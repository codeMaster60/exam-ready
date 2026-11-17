/*
 * app.js — the screens. Flow: start → quiz → selfcheck → result
 * All content comes from questions.js, all rules from scoring.js.
 */

const EXAMS = {
  goethe: "Goethe A1",
  osd: "ÖSD A1",
  unsure: "A1"
};

const BOOKING = {
  no: "Not yet",
  soon: "Yes, within 2 weeks",
  later: "Yes, later"
};

const SELF_OPTIONS = { yes: "Yes", little: "A little", no: "No" };

const VERDICTS = {
  ready:  { title: "Ready to book",  tone: "ok" },
  almost: { title: "Almost there",   tone: "warn" },
  notyet: { title: "Not ready yet",  tone: "bad" }
};

const TEXT_LABELS = { sign: "Notice", sms: "Text message", ad: "Small ad", email: "Email" };

const state = {
  screen: "start",
  exam: null,
  booking: null,
  current: 0,      // index of the question on screen
  answers: {},     // questionId → option index or DONT_KNOW
  selfCheck: {},   // selfcheck id → "yes" | "little" | "no"
  result: null,
  showReview: false
};

const app = document.getElementById("app");

/* ---------- small helpers ---------- */

function setState(changes) {
  Object.assign(state, changes);
  render();
}

function pill(group, value, label, selected) {
  return `<button type="button" class="pill ${selected ? "is-selected" : ""}"
            data-action="pick" data-group="${group}" data-value="${value}"
            aria-pressed="${selected}">${label}</button>`;
}

function answerText(q, chosen) {
  if (chosen === undefined) return "No answer";
  if (chosen === DONT_KNOW) return "I don't know";
  return q.options[chosen];
}

function toneFor(percent) {
  if (percent >= CONFIG.READY_MIN_SKILL) return "ok";
  if (percent >= CONFIG.NOT_YET_MIN_SKILL) return "warn";
  return "bad";
}

/* ---------- screens ---------- */

function renderStart() {
  const canStart = state.exam && state.booking;
  return `
    <section class="screen">
      <span class="eyebrow">Goethe &amp; ÖSD · Level A1</span>
      <h1 tabindex="-1">Are you ready to book your A1 exam?</h1>
      <p class="lead">Find out in 8 minutes, before you pay the exam fee.</p>

      <ul class="facts">
        <li><b>${QUESTIONS.length}</b><span>questions</span></li>
        <li><b>~8</b><span>minutes</span></li>
        <li><b>3</b><span>skills checked</span></li>
      </ul>

      <div class="card">
        <fieldset class="field">
          <legend>Which exam are you taking?</legend>
          <div class="pills">
            ${Object.entries(EXAMS).map(([k, v]) =>
              pill("exam", k, k === "unsure" ? "Not decided" : v, state.exam === k)).join("")}
          </div>
        </fieldset>
        <fieldset class="field">
          <legend>Have you booked it?</legend>
          <div class="pills">
            ${Object.entries(BOOKING).map(([k, v]) => pill("booking", k, v, state.booking === k)).join("")}
          </div>
        </fieldset>
      </div>

      <p class="hint"><span class="hint-icon" aria-hidden="true">i</span>
        <span>Not sure of an answer? Tap <b>I don't know</b>. Guessing only makes your result less accurate.</span></p>

      <button type="button" class="btn btn-primary btn-block" data-action="start" ${canStart ? "" : "disabled"}>
        Start the check
      </button>
    </section>`;
}

function renderText(q) {
  if (!q.text) return "";
  const lines = q.text.split("\n").map(l => `<span>${l}</span>`).join("");
  return `
    <figure class="text text-${q.textType}">
      <figcaption>${TEXT_LABELS[q.textType]}</figcaption>
      <div class="text-body" lang="de">${lines}</div>
    </figure>`;
}

function renderQuiz() {
  const q = QUESTIONS[state.current];
  const total = QUESTIONS.length;
  const chosen = state.answers[q.id];
  const isLast = state.current === total - 1;
  const progress = Math.round((state.current / total) * 100);

  return `
    <section class="screen">
      <div class="quiz-top">
        <button type="button" class="link-btn" data-action="back">← Back</button>
        <span class="counter">${state.current + 1} / ${total}</span>
      </div>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${state.current}">
        <span style="width:${progress}%"></span>
      </div>

      <span class="skill-chip skill-${q.skill}">${SKILL_LABELS[q.skill]}</span>
      ${renderText(q)}
      <h2 class="question" tabindex="-1">${q.prompt}</h2>

      <div class="options" role="radiogroup" aria-label="Answer options">
        ${q.options.map((opt, i) => `
          <button type="button" class="option ${chosen === i ? "is-selected" : ""}" role="radio"
                  aria-checked="${chosen === i}" data-action="answer" data-value="${i}">
            <span class="option-key">${"ABCDEF"[i]}</span><span>${opt}</span>
          </button>`).join("")}
        <button type="button" class="option option-dk ${chosen === DONT_KNOW ? "is-selected" : ""}" role="radio"
                aria-checked="${chosen === DONT_KNOW}" data-action="answer" data-value="${DONT_KNOW}">
          <span class="option-key">?</span><span>I don't know</span>
        </button>
      </div>

      <button type="button" class="btn btn-primary btn-block" data-action="next" ${chosen === undefined ? "disabled" : ""}>
        ${isLast ? "Continue" : "Next"}
      </button>
    </section>`;
}

function renderSelfCheck() {
  const done = SELF_CHECKS.every(c => state.selfCheck[c.id]);
  return `
    <section class="screen">
      <div class="quiz-top">
        <button type="button" class="link-btn" data-action="back">← Back</button>
        <span class="counter">Last step</span>
      </div>
      <div class="progress"><span style="width:100%"></span></div>

      <h1 tabindex="-1">Three things this check can't test</h1>
      <p class="lead">The real exam also tests speaking, writing and listening. Answer honestly: this won't change your score, only your advice.</p>

      ${SELF_CHECKS.map(c => `
        <fieldset class="card field">
          <legend><span class="skill-chip skill-self">${c.label}</span></legend>
          <p class="self-prompt">${c.prompt}</p>
          <div class="pills pills-3">
            ${Object.entries(SELF_OPTIONS).map(([k, v]) =>
              pill("self:" + c.id, k, v, state.selfCheck[c.id] === k)).join("")}
          </div>
        </fieldset>`).join("")}

      <button type="button" class="btn btn-primary btn-block" data-action="finish" ${done ? "" : "disabled"}>
        See my result
      </button>
    </section>`;
}

function renderRing(percent, tone) {
  const r = 52, c = 2 * Math.PI * r;
  const filled = (percent / 100) * c;
  return `
    <div class="ring ring-${tone}">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="${r}" class="ring-track"/>
        <circle cx="60" cy="60" r="${r}" class="ring-fill"
                stroke-dasharray="${filled} ${c}" transform="rotate(-90 60 60)"/>
      </svg>
      <div class="ring-label"><b>${percent}%</b><span>ready</span></div>
    </div>`;
}

function renderPracticeItem(item, index) {
  const topic = TOPICS[item.topic];
  let evidence = "";
  if (item.questions.length > 0) {
    const q = item.questions[0];
    const chosen = state.answers[q.id];
    evidence = `
      <div class="evidence">
        <span class="evidence-q">${q.prompt}</span>
        <span><span class="tag tag-bad">You</span> ${answerText(q, chosen)}</span>
        <span><span class="tag tag-ok">Correct</span> ${q.options[q.answer]}</span>
      </div>`;
  } else if (state.selfCheck[item.topic]) {
    evidence = `<div class="evidence"><span>You said: <b>${SELF_OPTIONS[state.selfCheck[item.topic]]}</b></span></div>`;
  }
  return `
    <li class="practice-item">
      <span class="practice-num">${index + 1}</span>
      <div>
        <h3>${topic.title}</h3>
        <p>${topic.tip}</p>
        ${evidence}
      </div>
    </li>`;
}

function renderReview() {
  return `
    <ol class="review">
      ${QUESTIONS.map(q => {
        const chosen = state.answers[q.id];
        const right = chosen === q.answer;
        return `
          <li class="review-item ${right ? "is-right" : "is-wrong"}">
            <span class="review-mark" aria-label="${right ? "Correct" : "Not correct"}">${right ? "✓" : "✕"}</span>
            <div>
              <span class="review-skill">${SKILL_LABELS[q.skill]}</span>
              <p class="review-q">${q.prompt}</p>
              ${right ? "" : `<p class="review-a">You: ${answerText(q, chosen)} · Correct: <b>${q.options[q.answer]}</b></p>`}
              <p class="review-e">${q.explain}</p>
            </div>
          </li>`;
      }).join("")}
    </ol>`;
}

function renderResult() {
  const r = state.result;
  const v = VERDICTS[r.verdict];
  const examName = EXAMS[state.exam];

  const skillRows = Object.entries(r.skills).map(([name, s]) => `
    <li class="skill-row">
      <div class="skill-row-top">
        <span>${SKILL_LABELS[name]}</span>
        <span class="skill-score">${s.correct}/${s.total}</span>
      </div>
      <div class="bar bar-${toneFor(s.percent)}" aria-label="${SKILL_LABELS[name]} ${s.percent}%">
        <span style="width:${Math.max(s.percent, 3)}%"></span>
        <i class="bar-line" style="left:${CONFIG.READY_MIN_SKILL}%" title="Exam pass mark"></i>
      </div>
    </li>`).join("");

  return `
    <section class="screen">
      <div class="verdict verdict-${v.tone}">
        ${renderRing(r.overall, v.tone)}
        <div class="verdict-text">
          <span class="eyebrow eyebrow-plain">Your ${examName} readiness</span>
          <h1 tabindex="-1">${v.title}</h1>
          <p class="verdict-action">${r.advice.action}</p>
          <p class="verdict-detail">${r.advice.detail}</p>
          ${r.reason ? `<p class="verdict-reason"><b>Why:</b> ${r.reason}</p>` : ""}
        </div>
      </div>

      ${r.advice.warning ? `<p class="alert"><b>Heads up:</b> ${r.advice.warning}</p>` : ""}

      <div class="card">
        <h2 class="card-title">Your score by skill</h2>
        <ul class="skills">${skillRows}</ul>
        <p class="legend"><i class="bar-line-key"></i> Line = ${CONFIG.PASS_MARK}%, the exam pass mark. Every skill should reach it.</p>
      </div>

      <div class="card">
        <h2 class="card-title">${r.verdict === "ready" ? "Keep these sharp before your exam" : "Practise these before you book"}</h2>
        <ol class="practice">${r.practice.map(renderPracticeItem).join("")}</ol>
      </div>

      <details class="card how">
        <summary>How we decide if you're ready</summary>
        <p>The real exam's pass mark is <b>${CONFIG.PASS_MARK}%</b>. We check how safely you'd clear it.</p>
        <ul>
          <li><b>Ready:</b> ${CONFIG.READY_OVERALL}% or more overall, and every skill at the ${CONFIG.READY_MIN_SKILL}% pass mark.</li>
          <li><b>Almost there:</b> ${CONFIG.PASS_MARK}–${CONFIG.READY_OVERALL - 1}%. Above the pass mark, but too close to be safe.</li>
          <li><b>Not ready yet:</b> under ${CONFIG.PASS_MARK}%, or a skill at 0–1 of 5.</li>
        </ul>
        <p>Why ${CONFIG.READY_OVERALL}% for Ready? A 15-question check is small: each question is about 7%, so one or two lucky answers can lift a learner over ${CONFIG.PASS_MARK}%. The margin makes sure "Ready" really means ready, so nobody loses their exam fee on a lucky score.</p>
      </details>

      <div class="actions">
        <button type="button" class="btn btn-secondary" data-action="review" aria-expanded="${state.showReview}">
          ${state.showReview ? "Hide my answers" : "Review my answers"}
        </button>
        <button type="button" class="btn btn-primary" data-action="restart">Take the check again</button>
      </div>

      ${state.showReview ? renderReview() : ""}
    </section>`;
}

/* ---------- render + events ---------- */

let lastScreenKey = "";

function render() {
  const screens = { start: renderStart, quiz: renderQuiz, selfcheck: renderSelfCheck, result: renderResult };
  app.innerHTML = screens[state.screen]();

  // When the screen or question changes, scroll up and move focus to the heading
  const key = state.screen + ":" + state.current;
  if (key !== lastScreenKey) {
    lastScreenKey = key;
    app.firstElementChild.classList.add("enter");
    window.scrollTo(0, 0);
    const heading = app.querySelector("[tabindex='-1']");
    if (heading) heading.focus({ preventScroll: true });
  }
}

app.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const { action, group, value } = el.dataset;

  if (action === "pick") {
    if (group.startsWith("self:")) {
      const id = group.slice(5);
      setState({ selfCheck: { ...state.selfCheck, [id]: value } });
    } else {
      setState({ [group]: value });
    }
  }

  if (action === "start") setState({ screen: "quiz", current: 0 });

  if (action === "answer") {
    const q = QUESTIONS[state.current];
    setState({ answers: { ...state.answers, [q.id]: Number(value) } });
  }

  if (action === "next") {
    if (state.current < QUESTIONS.length - 1) setState({ current: state.current + 1 });
    else setState({ screen: "selfcheck" });
  }

  if (action === "back") {
    if (state.screen === "selfcheck") setState({ screen: "quiz", current: QUESTIONS.length - 1 });
    else if (state.current > 0) setState({ current: state.current - 1 });
    else setState({ screen: "start" });
  }

  if (action === "finish") {
    const result = calculateResult(state.answers, state.selfCheck, state.booking);
    setState({ screen: "result", result, showReview: false });
  }

  if (action === "review") setState({ showReview: !state.showReview });

  if (action === "restart") {
    setState({ screen: "start", current: 0, answers: {}, selfCheck: {}, result: null, showReview: false });
  }
});

// Keyboard shortcuts on the quiz: 1–6 pick an answer, 0 = I don't know, Enter = next
document.addEventListener("keydown", (event) => {
  if (state.screen !== "quiz" || event.target.tagName === "BUTTON" && event.key === "Enter") return;
  const q = QUESTIONS[state.current];
  if (["1", "2", "3", "4", "5", "6"].includes(event.key) && Number(event.key) <= q.options.length) {
    setState({ answers: { ...state.answers, [q.id]: Number(event.key) - 1 } });
  } else if (event.key === "0") {
    setState({ answers: { ...state.answers, [q.id]: DONT_KNOW } });
  } else if (event.key === "Enter" && state.answers[q.id] !== undefined) {
    app.querySelector("[data-action='next']").click();
  }
});

render();
