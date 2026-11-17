/*
 * questions.js — all the content of the check lives here.
 *
 * To add or change a question, edit this file only.
 *   skill   : "vocabulary" | "grammar" | "reading"
 *   topic   : a key from TOPICS below (used to pick "what to practise")
 *   prompt  : the question the learner sees
 *   text    : (reading only) the German text to read
 *   textType: (reading only) "sign" | "sms" | "ad" | "email" — changes how the text looks
 *   options : answer choices
 *   answer  : index of the correct option (0 = first)
 *   explain : one line shown when reviewing answers
 */

const QUESTIONS = [
  // ---------- VOCABULARY (5) ----------
  {
    id: "v1", skill: "vocabulary", topic: "family",
    prompt: "Complete the sentence: Die Schwester von meiner Mutter ist meine ___.",
    options: ["Tante", "Oma", "Cousine"],
    answer: 0,
    explain: "Your mother's sister is your aunt: die Tante."
  },
  {
    id: "v2", skill: "vocabulary", topic: "numbers",
    prompt: "A price tag says 47 €. How do you say 47 in German?",
    options: ["vierundsiebzig", "siebenundvierzig", "siebzehnundvier"],
    answer: 1,
    explain: "German says the units first: 47 = sieben-und-vierzig (\"seven-and-forty\")."
  },
  {
    id: "v3", skill: "vocabulary", topic: "time",
    prompt: "\"Es ist Viertel nach acht.\" What time is it?",
    options: ["7:45", "8:15", "8:45"],
    answer: 1,
    explain: "Viertel nach acht = quarter past eight = 8:15."
  },
  {
    id: "v4", skill: "vocabulary", topic: "places",
    prompt: "Complete the sentence: Ich bin krank. Ich gehe zum ___.",
    options: ["Bäcker", "Bahnhof", "Arzt"],
    answer: 2,
    explain: "When you are sick (krank), you go to the doctor: zum Arzt."
  },
  {
    id: "v5", skill: "vocabulary", topic: "days",
    prompt: "Heute ist Montag. Morgen ist ___.",
    options: ["Dienstag", "Mittwoch", "Sonntag"],
    answer: 0,
    explain: "After Montag (Monday) comes Dienstag (Tuesday)."
  },

  // ---------- GRAMMAR (5) ----------
  {
    id: "g1", skill: "grammar", topic: "verbEndings",
    prompt: "Choose the right verb: Du ___ aus Indien, oder?",
    options: ["komme", "kommst", "kommt"],
    answer: 1,
    explain: "With du, the verb almost always ends in -st: du kommst."
  },
  {
    id: "g2", skill: "grammar", topic: "habenSein",
    prompt: "Choose the right verb: Wir ___ zwei Kinder.",
    options: ["sind", "habt", "haben"],
    answer: 2,
    explain: "You have children (haben), and with wir it is: wir haben."
  },
  {
    id: "g3", skill: "grammar", topic: "articles",
    prompt: "Choose the right article: ___ Tisch ist neu.",
    options: ["Der", "Die", "Das"],
    answer: 0,
    explain: "Tisch (table) is masculine: der Tisch."
  },
  {
    id: "g4", skill: "grammar", topic: "wordOrder",
    prompt: "Which sentence is correct?",
    options: ["Morgen ich gehe ins Kino.", "Morgen gehe ich ins Kino.", "Morgen ins Kino gehe ich."],
    answer: 1,
    explain: "The verb always comes second in a statement: Morgen gehe ich…"
  },
  {
    id: "g5", skill: "grammar", topic: "accusative",
    prompt: "Choose the right word: Ich habe ___ Bruder.",
    options: ["ein", "einen", "eine"],
    answer: 1,
    explain: "Bruder is masculine. After haben, ein becomes einen: Ich habe einen Bruder."
  },

  // ---------- READING (5) — short texts like in the real A1 exam ----------
  {
    id: "r1", skill: "reading", topic: "signs", textType: "sign",
    text: "Heute geschlossen.\nAb morgen, 9 Uhr, wieder geöffnet.",
    prompt: "This sign is on a shop door. When can you shop here again?",
    options: ["Today at 9 am", "Tomorrow from 9 am", "Tomorrow until 9 am"],
    answer: 1,
    explain: "geschlossen = closed, ab morgen 9 Uhr wieder geöffnet = open again from tomorrow, 9 am."
  },
  {
    id: "r2", skill: "reading", topic: "messages", textType: "sms",
    text: "Hallo Anna, ich komme heute später. Mein Bus hat 20 Minuten Verspätung. Bis gleich! Tom",
    prompt: "Why is Tom late?",
    options: ["He has to work 20 minutes longer", "He is sick", "His bus is 20 minutes late"],
    answer: 2,
    explain: "Mein Bus hat 20 Minuten Verspätung = my bus is 20 minutes late."
  },
  {
    id: "r3", skill: "reading", topic: "ads", textType: "ad",
    text: "Zimmer frei!\n1 Zimmer in Köln, 14 m², 350 € im Monat.\nNur für Nichtraucher.\nTel. 0221 456789",
    prompt: "Who can rent this room?",
    options: ["Only students", "Only people who don't smoke", "Only people from Köln"],
    answer: 1,
    explain: "Nur für Nichtraucher = only for non-smokers."
  },
  {
    id: "r4", skill: "reading", topic: "messages", textType: "email",
    text: "Liebe Maria,\nam Samstag habe ich Geburtstag. Ich mache eine Party bei mir zu Hause. Sie beginnt um 19 Uhr. Kannst du einen Salat mitbringen?\nViele Grüße\nLena",
    prompt: "What time does the party start?",
    options: ["9 am", "9 pm", "7 pm"],
    answer: 2,
    explain: "German uses the 24-hour clock: 19 Uhr = 7 pm."
  },
  {
    id: "r5", skill: "reading", topic: "signs", textType: "sign",
    text: "Achtung!\nDer Zug nach München fährt heute von Gleis 5, nicht von Gleis 3.",
    prompt: "This notice is at a station. Where does the train to Munich leave from today?",
    options: ["Platform 3", "Platform 5", "Platform 8"],
    answer: 1,
    explain: "Gleis = platform. The train leaves from Gleis 5, not Gleis 3."
  }
];

/*
 * The 3 skills this check CANNOT test. The learner rates themselves.
 * These never change the score — they only show up as warnings and practice tips.
 */
const SELF_CHECKS = [
  {
    id: "speaking", topic: "speaking",
    label: "Speaking",
    prompt: "Can you introduce yourself in German for 1 minute (name, age, country, job, hobbies) without notes?"
  },
  {
    id: "writing", topic: "writing",
    label: "Writing",
    prompt: "Can you write a short message of about 30 words, like telling a friend you will be late?"
  },
  {
    id: "listening", topic: "listening",
    label: "Listening",
    prompt: "Can you understand a slow German announcement, like a time or a platform number at a station?"
  }
];

/*
 * Practice advice for every topic. A wrong answer or "I don't know"
 * on a question points to its topic here.
 */
const TOPICS = {
  // vocabulary
  family:      { title: "Family words", tip: "Learn them in pairs: Mutter/Vater, Bruder/Schwester, Onkel/Tante, Oma/Opa." },
  numbers:     { title: "Numbers above 20", tip: "German says the units first: 47 = siebenundvierzig. Read prices and phone numbers out loud every day." },
  time:        { title: "Telling the time", tip: "Viertel nach = quarter past, Viertel vor = quarter to, halb neun = 8:30 (\"half to nine\")." },
  places:      { title: "Places in town", tip: "Learn each place with its reason: zum Arzt (sick), zur Apotheke (medicine), zum Bahnhof (train), zum Supermarkt (food)." },
  days:        { title: "Days of the week", tip: "Say Montag to Sonntag in order every morning for one week." },
  // grammar
  verbEndings: { title: "Verb endings", tip: "ich komme, du kommst, er/sie kommt, wir kommen, ihr kommt, sie/Sie kommen. With du, it is almost always -st." },
  habenSein:   { title: "haben and sein", tip: "sein: ich bin, du bist, er ist, wir sind. haben: ich habe, du hast, er hat, wir haben." },
  articles:    { title: "der, die, das", tip: "Never learn a noun alone. Learn der Tisch, die Lampe, das Buch, and colour-code your flashcards." },
  wordOrder:   { title: "Verb in position 2", tip: "In a statement the verb is always 2nd: Heute habe ich…, Morgen gehe ich…" },
  accusative:  { title: "ein / einen / eine", tip: "After haben, möchten, brauchen: masculine ein becomes einen (Ich habe einen Bruder). Feminine and neuter stay the same." },
  // reading
  signs:       { title: "Reading signs and notices", tip: "Learn notice words: geschlossen (closed), geöffnet (open), Gleis (platform), Eingang (entrance), Ausgang (exit)." },
  messages:    { title: "Reading short messages", tip: "In an SMS or email, find who, when and where first. Times use the 24-hour clock: 19 Uhr = 7 pm." },
  ads:         { title: "Reading small ads", tip: "Ads use short words: Zimmer (room), frei (available), im Monat (per month), nur (only). Read 2–3 small ads a day." },
  // self-check skills
  speaking:    { title: "Speaking", tip: "Record yourself introducing yourself for 1 minute each day. The A1 speaking test starts exactly like this." },
  writing:     { title: "Writing", tip: "Write one 30-word message a day: an invitation, a reply, or a note saying you are late." },
  listening:   { title: "Listening", tip: "Listen to slow German audio daily and write down every number, time and day you hear." },
  // fallback
  mockTest:    { title: "Take a full A1 mock test", tip: "Do one timed practice exam with all 4 parts (listening, reading, writing, speaking) before you book." }
};

const SKILL_LABELS = { vocabulary: "Vocabulary", grammar: "Grammar", reading: "Reading" };
