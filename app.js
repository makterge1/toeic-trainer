/**********************
 * TOEIC SHOCK TRAINER
 * - Mixed modes
 * - Stats + charts
 * - Badges + streak
 * - Confetti + mascot
 **********************/

// ✅ Pour le listening: tu peux mettre un mp3 dans ton repo (ex: audio/q1.mp3)
// et mettre audioSrc: "audio/q1.mp3"
const QUESTIONS = [
  // -------- Reading Part 5 (phrases à trous)
  { id: 1, mode:"reading", part:"Part 5", difficulty:"easy",
    question:"Choose the correct word: She ____ to work by train every day.",
    choices:["go","goes","going","gone"], answerIndex:1,
    explanation:"3rd person singular → goes."
  },
  { id: 2, mode:"reading", part:"Part 5", difficulty:"medium",
    question:"The report must be submitted ____ Friday at noon.",
    choices:["in","by","at","on"], answerIndex:1,
    explanation:"'by' = deadline."
  },
  { id: 3, mode:"reading", part:"Part 5", difficulty:"hard",
    question:"Not only ____ the budget approved, but the timeline was shortened as well.",
    choices:["was","has","did","had"], answerIndex:0,
    explanation:"Inversion after 'Not only' → was the budget approved."
  },

  // -------- Reading Part 6 (mini texte)
  { id: 10, mode:"reading", part:"Part 6", difficulty:"medium",
    question:"(TEXT) 'Due to unexpected demand, we will extend our opening hours.' What does 'extend' mean?",
    choices:["reduce","increase","cancel","replace"], answerIndex:1,
    explanation:"extend = make longer / increase."
  },

  // -------- Reading Part 7 (mail/annonce)
  { id: 20, mode:"reading", part:"Part 7", difficulty:"easy",
    question:"(EMAIL) The email says the meeting is moved to next Monday. What is the new date?",
    choices:["This Friday","Next Monday","Tomorrow","Next month"], answerIndex:1,
    explanation:"Moved to next Monday."
  },

  // -------- Listening (audio)
  { id: 100, mode:"listening", part:"Listening", difficulty:"easy",
    audioText:"(Simulated audio) 'The delivery will arrive between 2 and 4 p.m.'",
    question:"When will the delivery arrive?",
    choices:["Before 2 p.m.","Between 2 and 4 p.m.","After 6 p.m.","Tomorrow morning"],
    answerIndex:1,
    explanation:"Between 2 and 4 p.m."
  },
  { id: 101, mode:"listening", part:"Listening", difficulty:"medium",
    audioText:"(Simulated audio) 'Please review the attached document and reply by end of day.'",
    question:"What is the deadline?",
    choices:["Next week","End of day","Tomorrow noon","No deadline"],
    answerIndex:1,
    explanation:"Reply by end of day."
  },

  // Tu peux ajouter plein de questions ici 👇
];

// ---------- Storage keys
const KEY = {
  stats: "toeicShock_stats_v1",
  sessions: "toeicShock_sessions_v1",
  streak: "toeicShock_streak_v1",
  bestStreak: "toeicShock_bestStreak_v1",
  lastDay: "toeicShock_lastDay_v1",
  badges: "toeicShock_badges_v1"
};

const $ = (id)=>document.getElementById(id);

// UI
const modeSel = $("mode");
const diffSel = $("difficulty");
const durationSel = $("duration");
const countSel = $("count");
const startBtn = $("startBtn");
const resetBtn = $("resetBtn");
const fullscreenBtn = $("fullscreenBtn");
const timerChip = $("timerChip");
const streakChip = $("streakChip");
const levelChip = $("levelChip");
const mascotBubble = $("mascotBubble");
const mascotFace = $("mascotFace");

const quiz = $("quiz");
const results = $("results");
const progressEl = $("progress");
const scoreLive = $("scoreLive");
const paceEl = $("pace");
const partTag = $("partTag");
const diffTag = $("diffTag");
const questionText = $("questionText");
const listeningBox = $("listeningBox");
const playBtn = $("playBtn");
const pauseBtn = $("pauseBtn");
const audioEl = $("audio");
const answersEl = $("answers");
const feedback = $("feedback");
const checkBtn = $("checkBtn");
const nextBtn = $("nextBtn");
const finishBtn = $("finishBtn");
const finalScore = $("finalScore");
const review = $("review");
const againBtn = $("againBtn");
const exportBtn = $("exportBtn");

const badgesWrap = $("badgesWrap");

// KPI + charts
const kpiAcc = $("kpiAcc");
const kpiSessions = $("kpiSessions");
const kpiBestStreak = $("kpiBestStreak");

let chartLine, chartDonut, chartBar;

// Session state
let pool = [];
let idx = 0;
let score = 0;
let selected = null;
let startTime = 0;
let qStart = 0;
let timerId = null;
let secondsLeft = 0;
let history = [];
let perQuestionTimes = [];

function loadJSON(key, fallback){
  try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch{ return fallback; }
}
function saveJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}
function nowDayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function formatTime(s){
  const m = String(Math.floor(s/60)).padStart(2,"0");
  const sec = String(Math.floor(s%60)).padStart(2,"0");
  return `${m}:${sec}`;
}
function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function stopTimer(){
  if(timerId) clearInterval(timerId);
  timerId = null;
}
function startTimer(minutes){
  stopTimer();
  if(!minutes || minutes<=0){
    timerChip.textContent = "⏱️ 00:00";
    return;
  }
  secondsLeft = minutes*60;
  timerChip.textContent = `⏱️ ${formatTime(secondsLeft)}`;
  timerId = setInterval(()=>{
    secondsLeft--;
    timerChip.textContent = `⏱️ ${formatTime(Math.max(secondsLeft,0))}`;
    if(secondsLeft<=0){
      stopTimer();
      finish();
    }
  },1000);
}

function mascotSay(text){
  mascotBubble.textContent = text;
}
function pulseMascot(type){
  if(type==="good"){
    mascotFace.style.filter = "drop-shadow(0 0 18px rgba(49,208,170,.55))";
    setTimeout(()=>mascotFace.style.filter="", 450);
  }else{
    mascotFace.style.filter = "drop-shadow(0 0 18px rgba(255,90,95,.55))";
    setTimeout(()=>mascotFace.style.filter="", 450);
  }
}

// ----- Badges
const BADGE_DEFS = [
  { id:"first", title:"First Session", desc:"Finish your first session." },
  { id:"ten", title:"10 Correct", desc:"Get 10 correct answers in a session." },
  { id:"perfect", title:"Perfect!", desc:"Score 100% on a session (10+ Q)." },
  { id:"streak3", title:"Streak x3", desc:"3 days in a row." },
  { id:"streak7", title:"Streak x7", desc:"7 days in a row." },
  { id:"hardwin", title:"Hard Winner", desc:"Finish a Hard session with 70%+." },
];

function getBadges(){
  return loadJSON(KEY.badges, {});
}
function unlockBadge(id){
  const b = getBadges();
  if(!b[id]){
    b[id]=true;
    saveJSON(KEY.badges,b);
    renderBadges();
    confetti({ particleCount: 120, spread: 70, origin:{y:0.7} });
    mascotSay(`🏅 Badge unlocked: ${BADGE_DEFS.find(x=>x.id===id)?.title || id}!`);
  }
}
function renderBadges(){
  const b = getBadges();
  badgesWrap.innerHTML = "";
  BADGE_DEFS.forEach(def=>{
    const div = document.createElement("div");
    div.className = "badge" + (b[def.id] ? " on" : "");
    div.innerHTML = `<b>${b[def.id] ? "✅" : "🔒"} ${def.title}</b><br><span>${def.desc}</span>`;
    badgesWrap.appendChild(div);
  });
}

// ----- Level system (simple)
function computeLevel(totalPoints){
  if(totalPoints >= 250) return "Legend";
  if(totalPoints >= 150) return "Elite";
  if(totalPoints >= 80)  return "Pro";
  if(totalPoints >= 30)  return "Skilled";
  return "Rookie";
}

function getStats(){
  return loadJSON(KEY.stats, {
    totalCorrect: 0,
    totalAnswered: 0,
    totalPoints: 0,
    readingCorrect: 0,
    readingAnswered: 0,
    listeningCorrect: 0,
    listeningAnswered: 0
  });
}
function setStats(s){ saveJSON(KEY.stats,s); }

function getSessions(){ return loadJSON(KEY.sessions, []); }
function setSessions(s){ saveJSON(KEY.sessions,s); }

function getStreak(){ return parseInt(localStorage.getItem(KEY.streak) || "0", 10); }
function setStreak(n){ localStorage.setItem(KEY.streak, String(n)); }
function getBestStreak(){ return parseInt(localStorage.getItem(KEY.bestStreak) || "0", 10); }
function setBestStreak(n){ localStorage.setItem(KEY.bestStreak, String(n)); }
function getLastDay(){ return localStorage.getItem(KEY.lastDay) || ""; }
function setLastDay(d){ localStorage.setItem(KEY.lastDay, d); }

function updateHeader(){
  const streak = getStreak();
  const best = getBestStreak();
  const st = getStats();
  const level = computeLevel(st.totalPoints);
  streakChip.textContent = `🔥 Streak: ${streak}`;
  levelChip.textContent = `⭐ Level: ${level}`;
  kpiBestStreak.textContent = String(best);

  const acc = st.totalAnswered ? Math.round(100 * st.totalCorrect / st.totalAnswered) : 0;
  kpiAcc.textContent = `${acc}%`;
  kpiSessions.textContent = String(getSessions().length);
}

function buildPool(){
  const mode = modeSel.value;
  const diff = diffSel.value;
  const count = parseInt(countSel.value,10);

  let candidates = QUESTIONS.filter(q => q.difficulty === diff);

  if(mode === "reading") candidates = candidates.filter(q => q.mode === "reading");
  if(mode === "listening") candidates = candidates.filter(q => q.mode === "listening");
  if(mode === "mixed") candidates = candidates; // both

