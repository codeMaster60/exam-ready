# Am I exam-ready?

**An 8-minute check that tells an A1 German learner whether to book their Goethe or ÖSD exam, before they pay the fee.**

[Try the app](https://codemaster60.github.io/exam-ready/) · [Watch the demo](https://codemaster60.github.io/exam-ready/demo.html)

Built by A. Sai Jayanth for the Globio Founder's Office – Product Manager Intern assignment.

---

## The problem

Learners finish A1 German and book their exam on a hunch. If they fail, they pay the full fee again and lose weeks on their way to a job abroad.

So the real question isn't *"what's my score?"* It's *"should I book now?"*

## What it does

- **15 questions:** 5 vocabulary, 5 grammar, 5 reading. The reading texts are a notice, an SMS, an ad and an email, like the real exam.
- **"I don't know" on every question.** A blind guess is right 1 time in 3, and lucky guesses make people look more ready than they are.
- **An honest self-check** for listening, writing and speaking. The check can't test those, so it asks. It never changes the score.
- **A clear result:** a readiness %, a verdict (Ready / Almost / Not yet), the score by skill, and the 2–3 things to practise, taken from the learner's own mistakes.
- **Advice that fits their situation.** If the exam is in 2 weeks and they're not ready, it suggests asking about rescheduling.

## How I decided what "ready" means

A wrong "Ready" costs the learner the exam fee and weeks of their journey. A wrong "Not yet" costs about a week of practice. So I'd rather be careful.

Everything is anchored on the real exam's **60% pass mark**:

| Verdict | Rule |
|---|---|
| Ready to book | 75%+ overall, and every skill at 60% |
| Almost there | 60–74%: above the pass mark, but too close to be safe |
| Not ready yet | Under 60%, or a skill at 0–1 of 5 |

The 75% isn't a higher bar than the exam. It's a safety margin: each question is worth about 7%, so one or two lucky answers can lift someone over 60%. Every skill must reach 60%, so strong vocabulary can't hide weak grammar.

## How I'd know it works

Track learners who take the check and then sit the real exam. The number that matters is **how many "Ready" learners actually pass**. Then tune the 75% until "Ready" reliably means "passes".

## What's next

- A bigger question bank, so retakes aren't memorised
- Short audio clips for listening
- Each practice tip linking straight to the matching Globio lesson or mock test

## Under the hood

Plain HTML, CSS and JavaScript. No framework, no build step, under 50 KB. Open `index.html` and it runs.

| File | What's in it |
|---|---|
| `questions.js` | All questions, practice tips and self-check items |
| `scoring.js` | Every rule. The thresholds sit together in `CONFIG` at the top |
| `app.js` | The four screens |
| `style.css` | The design, in Globio's blue and yellow |
| `demo.html` | The auto-playing walkthrough (uses `demo-frame.html` and `demo-driver.js`) |

To change the Ready bar, edit `READY_OVERALL` in `scoring.js`. To add a question, add one object to `questions.js`. Everything else updates by itself.
