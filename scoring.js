/*
 * scoring.js — how "ready" is decided. All the rules are in CONFIG.
 *
 * Everything is anchored on the real exam's pass mark: 60%.
 * The question we answer is not "did you score 60%?" but
 * "how sure are we that you would clear 60% on exam day?"
 *
 *   - Ready:    75%+ overall, and every skill at least 60% (the pass mark).
 *               The extra 15% is a safety margin: 15 questions is a small
 *               sample, and one or two lucky answers (~7% each) can tip it.
 *   - Almost:   60–74%. Above the pass mark, but too close to be safe.
 *   - Not yet:  under 60% (below the pass mark), or a skill at 0–1 of 5.
 *
 * Why careful: a wrong "Ready" costs the exam fee and weeks of the
 * learner's journey; a wrong "Not yet" costs about a week of practice.
 */

const CONFIG = {
  PASS_MARK: 60,          // the real A1 exam pass mark; below this overall → "Not yet"
  READY_OVERALL: 75,      // pass mark + safety margin, needed for "Ready"
  READY_MIN_SKILL: 60,    // every skill must reach the pass mark for "Ready"
  NOT_YET_MIN_SKILL: 40,  // any skill below this (0–1 of 5) → "Not yet"
  MAX_PRACTICE_ITEMS: 3,  // how many "things to practise" to show
  MIN_PRACTICE_ITEMS: 2
};

const DONT_KNOW = -1; // stored when the learner taps "I don't know"

/* answers: { questionId: chosenOptionIndex or DONT_KNOW } */
function scoreBySkill(answers) {
  const skills = {};
  for (const q of QUESTIONS) {
    if (!skills[q.skill]) skills[q.skill] = { correct: 0, total: 0, percent: 0 };
    skills[q.skill].total += 1;
    if (answers[q.id] === q.answer) skills[q.skill].correct += 1;
  }
  for (const name in skills) {
    const s = skills[name];
    s.percent = Math.round((s.correct / s.total) * 100);
  }
  return skills;
}

function overallPercent(skills) {
  // Every skill counts equally.
  const list = Object.values(skills);
  const sum = list.reduce((total, s) => total + s.percent, 0);
  return Math.round(sum / list.length);
}

/* Returns "ready", "almost" or "notyet" */
function getVerdict(overall, skills) {
  const weakest = Math.min(...Object.values(skills).map(s => s.percent));
  if (overall >= CONFIG.READY_OVERALL && weakest >= CONFIG.READY_MIN_SKILL) return "ready";
  if (overall < CONFIG.PASS_MARK || weakest < CONFIG.NOT_YET_MIN_SKILL) return "notyet";
  return "almost";
}

/* Explains why the learner is not "Ready" (empty when Ready) */
function getReason(verdict, overall, skills) {
  if (verdict === "ready") return "";
  const parts = [];
  if (overall < CONFIG.PASS_MARK) {
    parts.push("Your score is below the exam's " + CONFIG.PASS_MARK + "% pass mark.");
  } else if (verdict === "almost" && overall < CONFIG.READY_OVERALL) {
    const where = overall === CONFIG.PASS_MARK ? "right at" : "just above";
    parts.push("You're " + where + " the " + CONFIG.PASS_MARK + "% pass mark. " +
      "In a 15-question check, one or two lucky answers can make that difference.");
  }
  const weak = Object.entries(skills)
    .filter(([, s]) => s.percent < CONFIG.READY_MIN_SKILL)
    .map(([name, s]) => SKILL_LABELS[name] + " is at " + s.percent + "%");
  if (weak.length > 0) {
    parts.push(listToText(weak) + ". Every skill should reach the " + CONFIG.READY_MIN_SKILL + "% pass mark.");
  }
  return parts.join(" ");
}

/*
 * The 2–3 things to practise:
 *   1. topics with the most wrong / "I don't know" answers (weakest skill first on a tie)
 *   2. then skills the learner said they are unsure about (speaking, writing, listening)
 *   3. if still fewer than 2, suggest a full mock test (then speaking, listening)
 */
function getPracticeList(answers, skills, selfCheck) {
  const missed = {}; // topic → list of missed questions
  for (const q of QUESTIONS) {
    if (answers[q.id] !== q.answer) {
      if (!missed[q.topic]) missed[q.topic] = [];
      missed[q.topic].push(q);
    }
  }

  const topicList = Object.keys(missed).sort((a, b) => {
    const byCount = missed[b].length - missed[a].length;
    if (byCount !== 0) return byCount;
    return skills[missed[a][0].skill].percent - skills[missed[b][0].skill].percent;
  });

  const items = topicList.map(topic => ({ topic, questions: missed[topic] }));

  // "No" answers come before "A little"
  const unsure = SELF_CHECKS
    .filter(c => selfCheck[c.id] === "no" || selfCheck[c.id] === "little")
    .sort((a, b) => (selfCheck[a.id] === "no" ? 0 : 1) - (selfCheck[b.id] === "no" ? 0 : 1));
  for (const c of unsure) items.push({ topic: c.topic, questions: [] });

  // Fill up to the minimum: a full mock test first, then the skills this check can't test
  for (const topic of ["mockTest", "speaking", "listening"]) {
    if (items.length >= CONFIG.MIN_PRACTICE_ITEMS) break;
    if (!items.some(item => item.topic === topic)) items.push({ topic, questions: [] });
  }

  return items.slice(0, CONFIG.MAX_PRACTICE_ITEMS);
}

/* What the learner should do next, based on verdict + booking status */
function getAdvice(verdict, booking, selfCheck) {
  const weakSkills = SELF_CHECKS.filter(c => selfCheck[c.id] === "no").map(c => c.label.toLowerCase());

  const advice = {
    ready: {
      no:    { action: "Go ahead and book your exam.", detail: "Keep revising a little every day until exam day." },
      soon:  { action: "You're on track for your exam.", detail: "Keep revising a little every day. Don't learn new things now; strengthen what you know." },
      later: { action: "You're on track for your exam.", detail: "Keep practising so you stay at this level until exam day." }
    },
    almost: {
      no:    { action: "Don't book just yet.", detail: "Practise the topics below for 1–2 weeks, then take this check again before booking." },
      soon:  { action: "Focus hard before your exam.", detail: "Spend every day on the topics below. You're close, so a focused week can make the difference." },
      later: { action: "You have time to close the gap.", detail: "Practise the topics below and take this check again in about a week." }
    },
    notyet: {
      no:    { action: "Wait before you book.", detail: "Spend 2–3 more weeks on the topics below, then take this check again. Booking now risks losing your exam fee." },
      soon:  { action: "Think about moving your exam date.", detail: "Ask your exam centre if you can reschedule. A failed attempt costs the full fee again and weeks of waiting." },
      later: { action: "Use the time before your exam well.", detail: "Work on the topics below every day and take this check again in 2 weeks." }
    }
  };

  const result = { ...advice[verdict][booking] };

  if (weakSkills.length > 0 && verdict === "ready" && booking === "no") {
    // Ready on paper, but weak in a skill we can't test: the advice itself changes
    result.action = "Your reading, grammar and vocabulary are ready.";
    result.detail = "Practise " + listToText(weakSkills) + " for about a week, then book your exam.";
  } else if (weakSkills.length > 0) {
    result.warning = "This check can't test " + listToText(weakSkills) +
      ", and you said you can't do it yet. The real exam tests it, so practise it before your exam.";
  }
  return result;
}

function listToText(list) {
  if (list.length <= 1) return list.join("");
  return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
}

/* One function that the app calls to get the whole result */
function calculateResult(answers, selfCheck, booking) {
  const skills = scoreBySkill(answers);
  const overall = overallPercent(skills);
  const verdict = getVerdict(overall, skills);
  return {
    skills,
    overall,
    verdict,
    reason: getReason(verdict, overall, skills),
    advice: getAdvice(verdict, booking, selfCheck),
    practice: getPracticeList(answers, skills, selfCheck)
  };
}
