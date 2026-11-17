# Am I exam-ready? – A1 German readiness check

A short web app that tells an A1 German learner whether they are ready to book their **Goethe A1** or **ÖSD A1** exam, before they pay the exam fee.

Built for the Globio Founder's Office – Product Manager Intern assignment.

**Live:** _add your Vercel link here_

## The problem

Many learners finish A1 German and book the exam without knowing if they are ready. If they fail, they lose the exam fee and weeks of time on their journey abroad, because the A1 exam can only be retaken as a whole.

## What the learner does

1. **Start:** picks their exam (Goethe / ÖSD / not decided) and whether they have booked it.
2. **Check:** 15 questions: 5 vocabulary, 5 grammar, 5 reading (short notices, an SMS, an ad, an email, like the real exam). Every question has an **"I don't know"** option so guesses don't inflate the score.
3. **Self-check:** 3 quick questions on speaking, writing and listening, which this check can't test.
4. **Result:**
   - Readiness % and a verdict: **Ready to book / Almost there / Not ready yet**
   - What to do next, based on whether they've booked (book now, practise first, or think about rescheduling)
   - Score for each skill
   - The **2–3 things to practise**, taken from their actual mistakes, with the question they got wrong
   - A review of every answer

## How "ready" is calculated

Everything is anchored on the real exam's **60% pass mark**. The question isn't "did you score 60%?" but **"how sure are we that you'd clear 60% on exam day?"**

| Verdict | Rule |
|---|---|
| ✅ Ready to book | **75%+ overall** and **every skill at least 60%** (the pass mark) |
| 🟡 Almost there | 60–74%: above the pass mark, but too close to be safe |
| 🔴 Not ready yet | Under 60% (below the pass mark), or a skill at 0–1 of 5 |

- **Why 75% for Ready?** It's not a higher bar than the exam. It's a safety margin. 15 questions is a small sample (each question ≈ 7%), so one or two lucky answers can lift someone over 60%. A wrong "Ready" costs the exam fee and weeks of time; a wrong "Not yet" costs about a week of practice.
- **Every skill must reach 60%,** so strong vocabulary can't hide weak grammar.
- **"I don't know" counts as not correct,** so a learner can't look ready by guessing.
- **The self-check never changes the score.** It only adds warnings and practice tips, because a self-rating isn't a measurement.
- **The practice list** = topics with the most missed questions (weakest skill first on a tie), then skills the learner said they're unsure about, then a full mock test.

## Code

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies (~40 KB total).

| File | What it does |
|---|---|
| `questions.js` | All questions, self-check items and practice tips (**content**) |
| `scoring.js` | How "ready" is decided; every threshold is in `CONFIG` at the top (**rules**) |
| `app.js` | The four screens and button handling (**UI**) |
| `style.css` | Design: mobile-first, Globio blue and yellow |
| `index.html` | Loads the files in order |

**Demo page (optional):** `demo.html` shows the working app on the left and an auto-playing walkthrough on the right (finger taps, captions, pause/resume, a menu of demos). `demo-frame.html` + `demo-driver.js` power the walkthrough; they don't change the app.

Common changes:
- **Change the Ready bar:** edit `READY_OVERALL` (or `PASS_MARK`) in `CONFIG` in `scoring.js`.
- **Add a question:** add an object to `QUESTIONS` in `questions.js` with a `skill` and a `topic`.
- **Change a practice tip:** edit `TOPICS` in `questions.js`.

## Run it

Open `index.html` in a browser. That's it.

Deploy: push to GitHub, then import the repo on [vercel.com](https://vercel.com) (no settings needed), or turn on GitHub Pages.

## What I'd do in version 2

- **Check the score against real results:** track learners who take the check and then the exam, and see how often "Ready" learners actually pass.
- **A bigger question bank,** with random questions on every retake so learners can't memorise answers.
- **Listening questions** with short audio clips.
- **Link results to Globio's mock tests and course modules,** so "practise verb endings" opens the right lesson.
