// === 1) QUESTIONS : ajoute/enlève ici ===
// format:
// { id, mode: "reading"|"listening", question, listeningText?, choices:[], answerIndex, explanation }
const QUESTIONS = [
  {
    id: 1,
    mode: "reading",
    question: "Choose the best synonym for: 'increase'.",
    choices: ["reduce", "raise", "delay", "avoid"],
    answerIndex: 1,
    explanation: "'Increase' means 'raise'."
  },
  {
    id: 2,
    mode: "reading",
    question: "Select the correct sentence.",
    choices: [
      "He don’t like coffee.",
      "He doesn’t likes coffee.",
      "He doesn’t like coffee.",
      "He not likes coffee."
    ],
    answerIndex: 2,
    explanation: "3rd person singular negative: 'doesn't + base verb'."
  },
  {
    id: 3,
    mode: "listening",
    listeningText: "You will hear: 'The meeting has been postponed to next Friday.'",
    question: "What does 'postponed' mean?",
    choices: ["cancelled", "moved to a later date", "started earlier", "made shorter"],
    answerIndex: 1,
    explanation: "'Postponed' = delayed / moved later."
  }
];

// === 2) Etat ===
let pool = [];
let idx = 0;
let score = 0;
let selected = null;
let timerId = null;
let secondsLeft = 0;
let history = []; // pour review

// === 3) Elements ===
const $ = (id) => document.getElementById(id);
const modeSel = $("mode");
const durationSel = $("duration");
const startBtn = $("startBtn");
const resetBtn = $("resetBtn");
const modeTag = $("modeTag");
const timerEl = $("timer");

const quiz = $("quiz");
const results = $("results");
const progressEl = $("progress");
const scoreLive = $("scoreLive");
const questionText = $("questionText");
const listeningText = $("listeningText");
const answersEl = $("answers");
const feedback = $("feedback");
const checkBtn = $("checkBtn");
const nextBtn = $("nextBtn");
const finishBtn = $("finishBtn");
const finalScore = $("finalScore");
const review = $("review");

// === 4) Utils ===
function formatTime(s) {
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function startTimer(minutes) {
  stopTimer();
  if (!minutes || minutes <= 0) {
    timerEl.textContent = "⏱️ 00:00";
    return;
  }
  secondsLeft = minutes * 60;
  timerEl.textContent = `⏱️ ${formatTime(secondsLeft)}`;
  timerId = setInterval(() => {
    secondsLeft--;
    timerEl.textContent = `⏱️ ${formatTime(Math.max(secondsLeft, 0))}`;
    if (secondsLeft <= 0) {
      stopTimer();
      finish();
    }
  }, 1000);
}

function setModeTag() {
  const m = modeSel.value;
  modeTag.textContent = `Mode: ${m === "reading" ? "Reading" : "Listening"}`;
}

// === 5) Render ===
function renderQuestion() {
  selected = null;
  feedback.textContent = "";
  checkBtn.disabled = false;
  nextBtn.classList.add("hidden");
  finishBtn.classList.add("hidden");

  const q = pool[idx];
  progressEl.textContent = `Question ${idx + 1}/${pool.length}`;
  scoreLive.textContent = `Score: ${score}`;
  questionText.textContent = q.question;

  if (q.mode === "listening") {
    listeningText.textContent = q.listeningText || "";
    listeningText.classList.remove("hidden");
  } else {
    listeningText.classList.add("hidden");
  }

  answersEl.innerHTML = "";
  q.choices.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "choice";
    div.textContent = `${String.fromCharCode(65 + i)}. ${c}`;
    div.onclick = () => {
      [...answersEl.children].forEach(ch => ch.classList.remove("selected"));
      div.classList.add("selected");
      selected = i;
    };
    answersEl.appendChild(div);
  });
}

function markAnswers(correctIdx, chosenIdx) {
  [...answersEl.children].forEach((node, i) => {
    if (i === correctIdx) node.classList.add("correct");
    if (chosenIdx === i && chosenIdx !== correctIdx) node.classList.add("wrong");
  });
}

// === 6) Flow ===
function start() {
  setModeTag();
  const mode = modeSel.value;
  pool = shuffle(QUESTIONS.filter(q => q.mode === mode));
  if (pool.length === 0) {
    alert("Aucune question pour ce mode. Ajoute-en dans app.js.");
    return;
  }
  idx = 0;
  score = 0;
  history = [];
  quiz.classList.remove("hidden");
  results.classList.add("hidden");
  startTimer(parseInt(durationSel.value, 10));
  renderQuestion();
}

function check() {
  const q = pool[idx];
  if (selected === null) {
    feedback.textContent = "Choose an answer first.";
    return;
  }
  const isCorrect = selected === q.answerIndex;
  if (isCorrect) score++;

  history.push({
    question: q.question,
    choices: q.choices,
    correct: q.answerIndex,
    chosen: selected,
    explanation: q.explanation || ""
  });

  markAnswers(q.answerIndex, selected);
  checkBtn.disabled = true;

  feedback.textContent = isCorrect
    ? "✅ Correct!"
    : `❌ Wrong. Correct answer: ${String.fromCharCode(65 + q.answerIndex)}.`;

  if (idx < pool.length - 1) {
    nextBtn.classList.remove("hidden");
  } else {
    finishBtn.classList.remove("hidden");
  }

  // Save progress
  localStorage.setItem("toeic_trainer_lastScore", String(score));
}

function next() {
  idx++;
  renderQuestion();
}

function finish() {
  stopTimer();
  quiz.classList.add("hidden");
  results.classList.remove("hidden");

  finalScore.textContent = `Final score: ${score} / ${pool.length}`;

  review.innerHTML = "";
  history.forEach((h, i) => {
    const block = document.createElement("div");
    block.style.margin = "12px 0";
    block.style.padding = "12px";
    block.style.border = "1px solid #22305f";
    block.style.borderRadius = "12px";
    block.style.background = "#0f1630";

    const chosenLetter = String.fromCharCode(65 + h.chosen);
    const correctLetter = String.fromCharCode(65 + h.correct);

    block.innerHTML = `
      <div style="opacity:.9"><b>Q${i + 1}.</b> ${h.question}</div>
      <div style="margin-top:8px; opacity:.9">
        Your answer: <b>${chosenLetter}</b> — Correct: <b>${correctLetter}</b>
      </div>
      <div style="margin-top:8px; opacity:.9"><i>${h.explanation}</i></div>
    `;
    review.appendChild(block);
  });
}

function resetAll() {
  stopTimer();
  quiz.classList.add("hidden");
  results.classList.add("hidden");
  feedback.textContent = "";
  answersEl.innerHTML = "";
  localStorage.removeItem("toeic_trainer_lastScore");
  timerEl.textContent = "⏱️ 00:00";
}

// === 7) Events ===
startBtn.addEventListener("click", start);
resetBtn.addEventListener("click", resetAll);
checkBtn.addEventListener("click", check);
nextBtn.addEventListener("click", next);
finishBtn.addEventListener("click", finish);
modeSel.addEventListener("change", setModeTag);

setModeTag();
