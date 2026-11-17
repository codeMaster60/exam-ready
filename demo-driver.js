/*
 * demo-driver.js — runs inside the demo phone only (demo-frame.html).
 * It plays scripted walkthroughs of the REAL app: a finger moves to each
 * button and taps it. The parent page (demo.html) controls it with
 * postMessage: play / pause / resume / restart.
 */
(function () {
  /* ---------- finger ---------- */
  const finger = document.createElement("div");
  finger.className = "demo-finger";
  document.body.appendChild(finger);

  const css = document.createElement("style");
  css.textContent = `
    .demo-finger {
      position: fixed; left: 50%; top: 70%; width: 38px; height: 38px; margin: -19px 0 0 -19px;
      border-radius: 50%; background: rgba(16, 26, 61, .28); border: 3px solid #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,.25); pointer-events: none; z-index: 9999;
      opacity: 0; transition: left .5s ease, top .5s ease, transform .15s ease, opacity .25s;
    }
    .demo-finger.show { opacity: 1; }
    .demo-finger.press { transform: scale(.75); background: rgba(242, 208, 75, .6); }
    .demo-ripple {
      position: fixed; width: 38px; height: 38px; margin: -19px 0 0 -19px; border-radius: 50%;
      border: 3px solid #F2D04B; pointer-events: none; z-index: 9998; animation: demo-ripple .5s ease-out forwards;
    }
    @keyframes demo-ripple { to { transform: scale(2.4); opacity: 0; } }
    html { scroll-behavior: smooth; }
    ::-webkit-scrollbar { width: 0; }
  `;
  document.head.appendChild(css);

  /* ---------- timing that can pause and be cancelled ---------- */
  let runId = 0;
  let paused = false;
  class Stopped extends Error {}

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function wait(ms, id) {
    let passed = 0;
    while (passed < ms) {
      if (id !== runId) throw new Stopped();
      await sleep(50);
      if (!paused) passed += 50;
    }
    if (id !== runId) throw new Stopped();
  }

  function post(msg) {
    parent.postMessage(Object.assign({ source: "examready-demo" }, msg), "*");
  }

  /* ---------- gestures ---------- */
  // Scroll inside the phone only (scrollIntoView could also scroll the outer page)
  function scrollToEl(el, block) {
    const r = el.getBoundingClientRect();
    let y = window.scrollY + r.top;
    if (block === "center") y -= (window.innerHeight - r.height) / 2;
    else y -= 16;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  // fast = true for quick taps (used on the middle questions of the full walkthrough)
  async function moveTo(el, id, fast) {
    scrollToEl(el, "center");
    await wait(fast ? 250 : 450, id);
    const r = el.getBoundingClientRect();
    finger.style.left = r.left + Math.min(r.width / 2, 90) + "px";
    finger.style.top = r.top + r.height / 2 + "px";
    finger.classList.add("show");
    await wait(fast ? 380 : 560, id);
  }

  async function tap(selector, id, fast) {
    const el = document.querySelector(selector);
    if (!el) return;
    await moveTo(el, id, fast);
    finger.classList.add("press");
    const ripple = document.createElement("div");
    ripple.className = "demo-ripple";
    ripple.style.left = finger.style.left;
    ripple.style.top = finger.style.top;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    await wait(170, id);
    el.click();
    finger.classList.remove("press");
    await wait(fast ? 120 : 260, id);
  }

  async function show(selector, id, block = "start") {
    finger.classList.remove("show");
    const el = document.querySelector(selector);
    if (el) scrollToEl(el, block);
    await wait(500, id);
  }

  async function top(id) {
    finger.classList.remove("show");
    window.scrollTo({ top: 0, behavior: "smooth" });
    await wait(450, id);
  }

  /* ---------- example learners ---------- */
  const PROFILES = {
    // 14/15 → 93%, every skill ≥ 60% → Ready
    ready:  { wrong: ["v2"], dontKnow: [], exam: "goethe", booking: "no",
              self: { speaking: "yes", writing: "yes", listening: "yes" } },
    // 10/15 → 67%, grammar 2/5 → Almost there
    almost: { wrong: ["v2", "g1", "r3"], dontKnow: ["g3", "g5"], exam: "goethe", booking: "no",
              self: { speaking: "little", writing: "yes", listening: "yes" } },
    // 8/15 → 53%, below the pass mark, exam in 2 weeks → Not ready yet
    notyet: { wrong: ["g1", "g2", "r1", "r4", "v3"], dontKnow: ["g3", "v1"], exam: "osd", booking: "soon",
              self: { speaking: "no", writing: "no", listening: "little" } }
  };

  function choiceFor(q, profile) {
    if (profile.dontKnow.includes(q.id)) return DONT_KNOW;
    if (profile.wrong.includes(q.id)) return (q.answer + 1) % q.options.length;
    return q.answer;
  }

  function answersFor(profile) {
    const answers = {};
    for (const q of QUESTIONS) answers[q.id] = choiceFor(q, profile);
    return answers;
  }

  function reset() {
    setState({ screen: "start", exam: null, booking: null, current: 0,
               answers: {}, selfCheck: {}, result: null, showReview: false });
    window.scrollTo(0, 0);
  }

  function jumpToResult(name) {
    const p = PROFILES[name];
    const answers = answersFor(p);
    setState({ screen: "result", exam: p.exam, booking: p.booking, current: 0, answers,
               selfCheck: { ...p.self }, showReview: false,
               result: calculateResult(answers, p.self, p.booking) });
    window.scrollTo(0, 0);
  }

  function jumpToQuestion(index, profile) {
    const answers = {};
    QUESTIONS.slice(0, index).forEach(q => { answers[q.id] = choiceFor(q, profile); });
    setState({ screen: "quiz", exam: profile.exam, booking: profile.booking, current: index,
               answers, selfCheck: {}, result: null, showReview: false });
    window.scrollTo(0, 0);
  }

  const optionSel = v => `[data-action='answer'][data-value='${v}']`;

  /*
   * Each step: say = caption title, why = the product reason (optional),
   * covers = which ask from the mail it shows, hold = ms to stay after the action.
   */

  /* ---------- reusable chapters ---------- */
  function startSteps(p) {
    return [
      { say: "A learner opens the link before booking their exam",
        why: "Failing the A1 exam costs the full fee again, plus weeks of waiting. This check answers one question: should I book now?",
        hold: 3200, run: async () => { reset(); } },
      { say: "They pick their exam: Goethe A1 or ÖSD A1",
        run: async id => tap(`[data-group='exam'][data-value='${p.exam}']`, id) },
      { say: "And whether they've already booked it",
        why: "Someone whose exam is in 10 days needs different advice from someone who hasn't booked yet.",
        hold: 2200, run: async id => tap(`[data-group='booking'][data-value='${p.booking}']`, id) },
      { say: "“I don't know” is better than guessing",
        why: "With 3 options, a blind guess is right 1 time in 3. Lucky guesses would make learners look more ready than they are.",
        hold: 2800, run: async id => show(".hint", id, "center") },
      { say: "Start the check", run: async id => tap("[data-action='start']", id) }
    ];
  }

  function questionSteps(p, fast) {
    const firstOfSkill = {
      v1: { say: "Vocabulary: 5 everyday A1 words", why: "Family, numbers, time, places and days: the topics the real A1 exam is built on." },
      g1: { say: "Grammar: 5 A1 basics", why: "Verb endings, haben/sein, der/die/das, word order and ein/einen: where A1 learners slip most." },
      r1: { say: "Reading: 5 short real-life texts", why: "A notice, an SMS, a small ad, an email and a station sign, in the same formats as the real exam." }
    };
    return QUESTIONS.map((q, i) => {
      const choice = choiceFor(q, p);
      const intro = firstOfSkill[q.id];
      let say = intro ? intro.say : `Question ${i + 1} of ${QUESTIONS.length}`;
      let why = intro ? intro.why : "";
      if (choice === DONT_KNOW) {
        say = "Not sure? They tap “I don't know”";
        why = "It counts as not correct, and the topic goes straight onto their practice list.";
      }
      const quick = fast && !intro && choice !== DONT_KNOW;
      return {
        say, why, covers: intro ? "questions" : null,
        hold: quick ? 150 : why ? 900 : 500,
        run: async id => {
          await wait(intro ? 1600 : choice === DONT_KNOW ? 1200 : quick ? 100 : 250, id);
          await tap(optionSel(choice), id, quick);
          await tap("[data-action='next']", id, quick);
        }
      };
    });
  }

  function selfCheckSteps(p) {
    return [
      { say: "Three things the check can't test",
        why: "The real exam also has listening, writing and speaking. Instead of hiding that, the learner rates themselves honestly.",
        hold: 3000, run: async id => top(id) },
      ...SELF_CHECKS.map(c => ({
        say: `${c.label}: “${SELF_OPTIONS[p.self[c.id]]}”`,
        why: "This never changes the score. It only adds warnings and practice tips.",
        hold: 500, run: async id => tap(`[data-group='self:${c.id}'][data-value='${p.self[c.id]}']`, id)
      })),
      { say: "See the result", run: async id => tap("[data-action='finish']", id) }
    ];
  }

  function resultSteps(name) {
    const first = {
      ready:  { say: "Ready to book: 93%",
                why: "Comfortably above the 60% pass mark, and every skill reaches 60% too." },
      almost: { say: "67%, but “Almost there”",
                why: "It's above the 60% pass mark, but only just. In 15 questions, one or two lucky answers can make that difference, so it's too risky to pay the fee yet." },
      notyet: { say: "53%: not ready yet",
                why: "Below the 60% pass mark, and their exam is in 2 weeks, so it suggests asking the centre about rescheduling." }
    }[name];
    const practiceWhy = {
      ready:  "Even when ready, it shows what to keep sharp until exam day.",
      almost: "Picked from their actual mistakes, with the exact question they missed. Not generic tips.",
      notyet: "Their weakest grammar topics come first, because that's where the most points are lost."
    }[name];
    const steps = [
      { say: first.say, why: first.why, covers: "ready", hold: 4000, run: async id => top(id) }
    ];
    if (name !== "ready") {
      steps.push({ say: "“Why” tells them exactly which rule they missed",
                   why: "No mystery score: the learner sees the reason in plain words.", covers: "logic",
                   hold: 3400, run: async id => show(".verdict-reason", id, "center") });
    }
    if (name === "notyet") {
      steps.push({ say: "A warning about speaking and writing",
                   why: "They said they can't do these yet. The check can't test them, but the real exam does.",
                   hold: 3000, run: async id => show(".alert", id, "center") });
    }
    steps.push(
      { say: "Score broken down by skill",
        why: "The line marks the 60% pass mark. A strong skill can't hide a weak one: each must reach it.",
        covers: "skills", hold: 3600, run: async id => show(".skills", id, "center") },
      { say: "The 2–3 things to practise before booking", why: practiceWhy, covers: "practice",
        hold: 4000, run: async id => show(".practice", id, "start") },
      { say: "How “ready” is decided, explained in the app",
        why: "Ready = 75%+ overall and every skill at 60%. The extra margin covers lucky answers in a short check.",
        covers: "logic", hold: 4000,
        run: async id => { await tap(".how summary", id); await show(".how", id, "start"); } }
    );
    return steps;
  }

  function reviewSteps() {
    return [
      { say: "Review every answer", why: "Each question shows the right answer and a one-line explanation.",
        hold: 1400, run: async id => tap("[data-action='review']", id) },
      { say: "Wrong answers are marked", why: "So the learner knows exactly what to fix.",
        hold: 3000, run: async id => show(".review", id, "start") },
      { say: "Practise, then take the check again", why: "Retaking after 1–2 weeks shows whether the practice worked, before paying the exam fee.",
        hold: 2600, run: async id => moveTo(document.querySelector("[data-action='restart']"), id) }
    ];
  }

  function skipTo(name, say) {
    return { say: "⏩ " + say, hold: 2000, run: async () => jumpToResult(name) };
  }

  /* ---------- the demos in the dropdown ---------- */
  const DEMOS = {
    full: () => {
      const p = PROFILES.almost;
      return [...startSteps(p), ...questionSteps(p, true), ...selfCheckSteps(p),
              ...resultSteps("almost"), ...reviewSteps()];
    },
    start: () => startSteps(PROFILES.almost),
    quiz: () => {
      const p = PROFILES.almost;
      const all = questionSteps(p, false);
      const pick = i => ({ ...all[i], run: async id => { jumpToQuestion(i, p); await all[i].run(id); } });
      return [pick(0), pick(1), pick(5), pick(7), pick(10), pick(13)];
    },
    self: () => {
      const p = PROFILES.almost;
      return [{ say: "⏩ The learner has answered all 15 questions", hold: 1600,
                run: async () => { jumpToQuestion(14, p); setState({ answers: answersFor(p), screen: "selfcheck" }); } },
              ...selfCheckSteps(p)];
    },
    ready:  () => [skipTo("ready", "This learner got 14 of 15 right"), ...resultSteps("ready")],
    almost: () => [skipTo("almost", "This learner got 10 of 15 right"), ...resultSteps("almost")],
    notyet: () => [skipTo("notyet", "8 of 15 right, and the exam is in 2 weeks"), ...resultSteps("notyet")],
    review: () => [skipTo("almost", "From the result screen"), ...reviewSteps()]
  };

  /* ---------- player ---------- */
  async function play(name) {
    const id = ++runId;
    paused = false;
    finger.classList.remove("show");
    const steps = (DEMOS[name] || DEMOS.full)();
    post({ type: "chapters", name, chapters: steps.map(s => ({ say: s.say, covers: s.covers || null })) });
    post({ type: "status", status: "playing" });
    try {
      for (let i = 0; i < steps.length; i++) {
        post({ type: "step", index: i, say: steps[i].say, why: steps[i].why || "", covers: steps[i].covers || null });
        await steps[i].run(id);
        await wait(steps[i].hold == null ? 900 : steps[i].hold, id);
      }
      finger.classList.remove("show");
      post({ type: "status", status: "ended" });
    } catch (e) {
      if (!(e instanceof Stopped)) { console.error(e); post({ type: "status", status: "ended" }); }
    }
  }

  window.addEventListener("message", event => {
    const msg = event.data || {};
    if (msg.target !== "examready-demo") return;
    if (msg.type === "play") play(msg.name);
    if (msg.type === "pause") { paused = true; post({ type: "status", status: "paused" }); }
    if (msg.type === "resume") { paused = false; post({ type: "status", status: "playing" }); }
  });

  post({ type: "ready" });
})();
