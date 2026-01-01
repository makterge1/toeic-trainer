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

  // fallback if not enough questions in chosen difficulty
  if(candidates.length < count){
    const extra = QUESTIONS.filter(q => (mode==="mixed") ? true : q.mode===mode);
    candidates = shuffle([...new Set([...candidates, ...extra])]);
  }

  return shuffle(candidates).slice(0, Math.min(count, candidates.length));
}

function renderQuestion(){
  selected = null;
  feedback.textContent = "";
  checkBtn.disabled = false;
  nextBtn.classList.add("hidden");
  finishBtn.classList.add("hidden");

  const q = pool[idx];
  progressEl.textContent = `Question ${idx+1}/${pool.length}`;
  scoreLive.textContent = `Score: ${score}`;
  partTag.textContent = q.part || (q.mode==="listening" ? "Listening" : "Reading");
  diffTag.textContent = q.difficulty ? `Difficulty: ${q.difficulty}` : "Difficulty";
  questionText.textContent = q.question;

  // Listening mode: show player
  if(q.mode === "listening"){
    listeningBox.classList.remove("hidden");
    audioEl.src = q.audioSrc || ""; // optional
    // if no audio file, we show simulated audio text in bubble
    mascotSay(q.audioText || "Listen carefully 👂");
  } else {
    listeningBox.classList.add("hidden");
    audioEl.pause();
    audioEl.src = "";
    mascotSay("Focus. One question at a time ✅");
  }

  answersEl.innerHTML = "";
  q.choices.forEach((c,i)=>{
    const div = document.createElement("div");
    div.className = "choice";
    div.textContent = `${String.fromCharCode(65+i)}. ${c}`;
    div.onclick = ()=>{
      [...answersEl.children].forEach(ch=>ch.classList.remove("selected"));
      div.classList.add("selected");
      selected = i;
    };
    answersEl.appendChild(div);
  });

  qStart = performance.now();
  updatePace();
}

function updatePace(){
  // estimate based on average time per question in this session
  const avg = perQuestionTimes.length
    ? perQuestionTimes.reduce((a,b)=>a+b,0)/perQuestionTimes.length
    : 0;
  paceEl.textContent = avg ? `⚡ Avg: ${(avg/1000).toFixed(1)}s/Q` : `⚡ Pace`;
}

function markAnswers(correctIdx, chosenIdx){
  [...answersEl.children].forEach((node,i)=>{
    if(i===correctIdx) node.classList.add("correct");
    if(chosenIdx===i && chosenIdx!==correctIdx) node.classList.add("wrong");
  });
}

function start(){
  pool = buildPool();
  if(pool.length === 0){
    alert("Ajoute plus de questions dans app.js.");
    return;
  }
  idx = 0;
  score = 0;
  history = [];
  perQuestionTimes = [];
  startTime = performance.now();
  quiz.classList.remove("hidden");
  results.classList.add("hidden");
  startTimer(parseInt(durationSel.value,10));
  mascotSay("Go! Shock your TOEIC score ⚡");
  renderQuestion();
}

function check(){
  const q = pool[idx];
  if(selected === null){
    feedback.textContent = "Choose an answer first.";
    return;
  }

  const dt = performance.now() - qStart;
  perQuestionTimes.push(dt);
  updatePace();

  const correct = selected === q.answerIndex;
  if(correct) score++;

  history.push({
    question: q.question,
    choices: q.choices,
    correct: q.answerIndex,
    chosen: selected,
    explanation: q.explanation || "",
    mode: q.mode,
    timeMs: dt,
    part: q.part,
    difficulty: q.difficulty
  });

  markAnswers(q.answerIndex, selected);
  checkBtn.disabled = true;

  if(correct){
    feedback.textContent = "✅ Correct!";
    pulseMascot("good");
  }else{
    feedback.textContent = `❌ Wrong. Correct answer: ${String.fromCharCode(65+q.answerIndex)}.`;
    pulseMascot("bad");
  }

  if(idx < pool.length-1) nextBtn.classList.remove("hidden");
  else finishBtn.classList.remove("hidden");
}

function next(){
  idx++;
  renderQuestion();
}

function updateStreakOnFinish(){
  const today = nowDayKey();
  const last = getLastDay();

  // If already finished today, don't change streak
  if(last === today) return;

  // Check if last day is exactly yesterday
  const d = new Date();
  const yesterday = new Date(d.getFullYear(), d.getMonth(), d.getDate()-1);
  const yKey = `${yesterday.getFullYear()}-${yesterday.getMonth()+1}-${yesterday.getDate()}`;

  let streak = getStreak();
  if(last === yKey) streak += 1;
  else streak = 1;

  setStreak(streak);
  setLastDay(today);

  let best = getBestStreak();
  if(streak > best){ best = streak; setBestStreak(best); }

  if(streak >= 3) unlockBadge("streak3");
  if(streak >= 7) unlockBadge("streak7");
}

function finish(){
  stopTimer();
  quiz.classList.add("hidden");
  results.classList.remove("hidden");

  const total = pool.length;
  const acc = total ? score/total : 0;
  const durationMs = performance.now() - startTime;
  const avgMs = perQuestionTimes.length ? perQuestionTimes.reduce((a,b)=>a+b,0)/perQuestionTimes.length : 0;

  finalScore.textContent = `Final score: ${score} / ${total} — Accuracy: ${Math.round(acc*100)}% — Avg: ${(avgMs/1000).toFixed(1)}s/Q`;

  // confetti if good score
  if(acc >= 0.85){
    confetti({ particleCount: 180, spread: 90, origin:{y:0.7} });
    mascotSay("🔥 That was impressive. Your prof will be shocked.");
  }else if(acc >= 0.65){
    confetti({ particleCount: 90, spread: 70, origin:{y:0.7} });
    mascotSay("Nice! Keep grinding, you're leveling up.");
  }else{
    mascotSay("No stress. Review errors → improvement is guaranteed.");
  }

  // Update global stats
  const st = getStats();
  history.forEach(h=>{
    st.totalAnswered += 1;
    st.totalCorrect += (h.chosen === h.correct) ? 1 : 0;

    // Points: difficulty-based
    const pts = (h.difficulty==="hard") ? 3 : (h.difficulty==="medium") ? 2 : 1;
    st.totalPoints += (h.chosen === h.correct) ? pts : 0;

    if(h.mode === "reading"){
      st.readingAnswered += 1;
      st.readingCorrect += (h.chosen === h.correct) ? 1 : 0;
    }else{
      st.listeningAnswered += 1;
      st.listeningCorrect += (h.chosen === h.correct) ? 1 : 0;
    }
  });
  setStats(st);

  // Save session log
  const sessions = getSessions();
  sessions.push({
    date: new Date().toISOString(),
    mode: modeSel.value,
    difficulty: diffSel.value,
    score,
    total,
    accuracy: Math.round(acc*100),
    avgSecPerQ: Number((avgMs/1000).toFixed(2))
  });
  setSessions(sessions);

  // Streak + badges
  updateStreakOnFinish();
  unlockBadge("first");
  if(score >= 10) unlockBadge("ten");
  if(total >= 10 && acc === 1) unlockBadge("perfect");
  if(diffSel.value==="hard" && acc >= 0.70) unlockBadge("hardwin");

  // Render review
  renderReview();

  // Update dashboard
  updateHeader();
  renderCharts();
}

function renderReview(){
  review.innerHTML = "";
  history.forEach((h,i)=>{
    const chosenLetter = String.fromCharCode(65 + h.chosen);
    const correctLetter = String.fromCharCode(65 + h.correct);
    const ok = h.chosen === h.correct;

    const div = document.createElement("div");
    div.className = "card";
    div.style.marginTop = "10px";
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div style="color:#aab2d5"><b>Q${i+1}</b> • ${h.part || ""} • ${h.mode} • ${h.difficulty}</div>
        <div style="color:#aab2d5">⏱ ${(h.timeMs/1000).toFixed(1)}s</div>
      </div>
      <div style="margin-top:8px">${h.question}</div>
      <div style="margin-top:10px;color:${ok ? "#31d0aa" : "#ff5a5f"}">
        Your answer: <b>${chosenLetter}</b> — Correct: <b>${correctLetter}</b>
      </div>
      <div style="margin-top:8px;color:#aab2d5"><i>${h.explanation}</i></div>
    `;
    review.appendChild(div);
  });
}

function renderCharts(){
  const sessions = getSessions().slice(-12);
  const labels = sessions.map((s, i)=>`${i+1}`);
  const accData = sessions.map(s=>s.accuracy);

  const st = getStats();
  const rAcc = st.readingAnswered ? Math.round(100*st.readingCorrect/st.readingAnswered) : 0;
  const lAcc = st.listeningAnswered ? Math.round(100*st.listeningCorrect/st.listeningAnswered) : 0;

  const lastTimes = history.map(h=>Number((h.timeMs/1000).toFixed(2)));

  // Line
  const ctxL = $("chartLine");
  if(chartLine) chartLine.destroy();
  chartLine = new Chart(ctxL, {
    type:"line",
    data:{ labels, datasets:[{ label:"Accuracy %", data: accData, tension:.35 }]},
    options:{
      responsive:true,
      plugins:{ legend:{ labels:{ color:"#aab2d5" }}},
      scales:{
        x:{ ticks:{ color:"#aab2d5" }, grid:{ color:"rgba(255,255,255,.06)" } },
        y:{ ticks:{ color:"#aab2d5" }, grid:{ color:"rgba(255,255,255,.06)" }, suggestedMin:0, suggestedMax:100 }
      }
    }
  });

  // Donut
  const ctxD = $("chartDonut");
  if(chartDonut) chartDonut.destroy();
  chartDonut = new Chart(ctxD, {
    type:"doughnut",
    data:{
      labels:["Reading", "Listening"],
      datasets:[{ data:[rAcc, lAcc] }]
    },
    options:{
      plugins:{ legend:{ labels:{ color:"#aab2d5" }}},
      cutout:"62%"
    }
  });

  // Bar time per question
  const ctxB = $("chartBar");
  if(chartBar) chartBar.destroy();
  chartBar = new Chart(ctxB, {
    type:"bar",
    data:{
      labels: lastTimes.map((_,i)=>`Q${i+1}`),
      datasets:[{ label:"Seconds", data:lastTimes }]
    },
    options:{
      plugins:{ legend:{ labels:{ color:"#aab2d5" }}},
      scales:{
        x:{ ticks:{ color:"#aab2d5" }, grid:{ color:"rgba(255,255,255,.06)" } },
        y:{ ticks:{ color:"#aab2d5" }, grid:{ color:"rgba(255,255,255,.06)" } }
      }
    }
  });
}

function resetAll(){
  stopTimer();
  timerChip.textContent = "⏱️ 00:00";
  quiz.classList.add("hidden");
  results.classList.add("hidden");
  feedback.textContent = "";
  answersEl.innerHTML = "";
  mascotSay("Reset done. Ready for another shock ⚡");
}

function exportStats(){
  const payload = {
    stats: getStats(),
    sessions: getSessions(),
    badges: getBadges(),
    streak: getStreak(),
    bestStreak: getBestStreak()
  };
  const blob = new Blob([JSON.stringify(payload,null,2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "toeic_shock_stats.json";
  a.click();
  URL.revokeObjectURL(url);
}

function toggleFullscreen(){
  if(!document.fullscreenElement){
    document.documentElement.requestFullscreen?.();
    mascotSay("Exam mode ON 🧪 (focus!)");
  }else{
    document.exitFullscreen?.();
    mascotSay("Exam mode OFF ✅");
  }
}

// Listening controls (works if audio src exists)
playBtn?.addEventListener("click", ()=>audioEl.play().catch(()=>{}));
pauseBtn?.addEventListener("click", ()=>audioEl.pause());

startBtn.addEventListener("click", start);
resetBtn.addEventListener("click", resetAll);
checkBtn.addEventListener("click", check);
nextBtn.addEventListener("click", next);
finishBtn.addEventListener("click", finish);
againBtn.addEventListener("click", start);
exportBtn.addEventListener("click", exportStats);
fullscreenBtn.addEventListener("click", toggleFullscreen);

// Initial render
renderBadges();
updateHeader();
renderCharts();
mascotSay("Ready. Choose your mode and start a session 🚀");
