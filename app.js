const STORAGE_KEY = "riseAndRep.v1";
const WORKOUT_DAYS = new Set([1, 3, 5, 6]);

const workoutMoves = [
  { name: "Quick Warm-Up", visual: "warmup", sets: 1, target: "2–3", unit: "minutes", kind: "manual", cue: "Arm circles, shoulder rolls, then march or jump lightly in place." },
  { name: "Standard Push-Ups", visual: "standardPushup", sets: 3, baseTarget: 8, step: 2, cap: 12, unit: "reps", kind: "reps", cue: "Brace your middle. Lower as one strong line and keep your elbows controlled." },
  { name: "Wide Push-Ups", visual: "widePushup", sets: 3, baseTarget: 8, step: 1, cap: 10, unit: "reps", kind: "reps", cue: "Hands slightly wider than shoulders. Keep your neck long and chest active." },
  { name: "Chair Dips", visual: "chairDips", sets: 3, baseTarget: 10, step: 1, cap: 12, unit: "reps", kind: "reps", cue: "Use a stable chair. Keep your back close to the seat and shoulders down." },
  { name: "Forearm Plank", visual: "forearmPlank", sets: 3, baseTarget: 30, step: 5, cap: 45, unit: "seconds", kind: "seconds", cue: "Squeeze glutes, press the floor away, and keep a straight line head to heels." },
  { name: "Bicycle Crunches", visual: "bicycleCrunch", sets: 3, baseTarget: 20, step: 2, cap: 24, unit: "reps", kind: "reps", cue: "Rotate from your ribs. Move with control instead of pulling on your neck." },
  { name: "Mountain Climbers", visual: "mountainClimber", sets: 3, baseTarget: 30, step: 5, cap: 45, unit: "seconds", kind: "seconds", cue: "Keep shoulders over wrists and hips steady while your knees drive forward." },
  { name: "Bodyweight Squats", visual: "squat", sets: 3, baseTarget: 15, step: 2, cap: 21, unit: "reps", kind: "reps", cue: "Sit between your hips, keep your whole foot planted, then stand tall." }
];

const recoveryMoves = [
  { name: "Shoulder Rolls", visual: "shoulderRolls", sets: 1, target: 30, unit: "seconds", kind: "seconds", cue: "Make slow, generous circles and let your breathing settle." },
  { name: "Arm Circles", visual: "armCircles", sets: 1, target: 30, unit: "seconds", kind: "seconds", cue: "Start small and gradually widen the circle without shrugging." },
  { name: "Cat–Cow", visual: "catCow", sets: 1, target: 6, unit: "slow reps", kind: "reps", cue: "Move one vertebra at a time and pair each shape with a full breath." },
  { name: "Hip Hinge Stretch", visual: "hipHinge", sets: 1, target: 45, unit: "seconds", kind: "seconds", cue: "Keep a soft bend in the knees and lengthen through your spine." },
  { name: "Child’s Pose", visual: "childsPose", sets: 1, target: 60, unit: "seconds", kind: "seconds", cue: "Reach long through your fingertips and breathe into your back ribs." }
];

const achievements = [
  { id: "first", mark: "1ST", name: "First Light", description: "Complete your first daily quest." },
  { id: "streak3", mark: "3D", name: "Fuse Lit", description: "Build a 3-day streak." },
  { id: "streak7", mark: "7D", name: "Full Circuit", description: "Show up for 7 days in a row." },
  { id: "streak14", mark: "14", name: "Iron Habit", description: "Hold a 14-day streak." },
  { id: "sessions10", mark: "10", name: "Room Regular", description: "Complete 10 daily quests." },
  { id: "sets100", mark: "100", name: "Rep Century", description: "Finish 100 sets and recovery steps." }
];

const levelNames = ["Rookie", "Room Builder", "Rep Runner", "Morning Machine", "Habit Hero", "Daybreak Legend"];

let data = loadData();
let activeTab = "today";
let deferredInstallPrompt = null;
let restTimer = null;
let setTimer = null;
let toastTimer = null;

const todayView = document.querySelector("#todayView");
const progressView = document.querySelector("#progressView");
const routineView = document.querySelector("#routineView");
const workoutView = document.querySelector("#workoutView");
const sheetRoot = document.querySelector("#sheetRoot");
const toast = document.querySelector("#toast");
const installButton = document.querySelector("#installButton");
const connectionBadge = document.querySelector("#connectionBadge");

function defaultData() {
  return {
    xp: 0,
    completedDays: {},
    totalSessions: 0,
    totalSets: 0,
    longestStreak: 0,
    earnedAchievements: {},
    session: null
  };
}

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultData(), ...stored, completedDays: stored?.completedDays || {}, earnedAchievements: stored?.earnedAchievements || {} };
  } catch {
    return defaultData();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function completedWorkoutCount() {
  return Object.values(data.completedDays).filter((entry) => entry.type === "workout").length;
}

function getProgression() {
  const completed = completedWorkoutCount();
  const week = Math.floor(completed / 4) + 1;
  const sessionsIntoWeek = completed % 4;
  const stages = ["Foundation", "Build", "Strong", "Control"];
  const stageIndex = Math.min(week - 1, stages.length - 1);
  const restSeconds = [45, 40, 35, 30][stageIndex];
  return {
    week,
    stage: stages[stageIndex],
    stageIndex,
    sessionsIntoWeek,
    sessionsToNext: 4 - sessionsIntoWeek,
    restSeconds,
    atMastery: week >= 4
  };
}

function progressedWorkoutMoves() {
  const progression = getProgression();
  return workoutMoves.map((move) => {
    if (!Number.isFinite(move.baseTarget)) return { ...move };
    const target = Math.min(move.baseTarget + move.step * progression.stageIndex, move.cap);
    const masteryCue = progression.atMastery && move.kind === "reps"
      ? " Control block: take 3 counts on the lowering phase and keep every rep clean."
      : "";
    return { ...move, target, cue: `${move.cue}${masteryCue}` };
  });
}

function nextProgressionSummary() {
  const progression = getProgression();
  if (progression.atMastery) return "Top range reached · win with cleaner, slower reps";
  const nextStage = Math.min(progression.stageIndex + 1, 3);
  const pushup = workoutMoves.find((move) => move.name === "Standard Push-Ups");
  const nextTarget = Math.min(pushup.baseTarget + pushup.step * nextStage, pushup.cap);
  const nextRest = [45, 40, 35, 30][nextStage];
  return `Next block · ${nextTarget} push-ups · ${nextRest}s rest`;
}

function getPlan(date = new Date()) {
  const workout = WORKOUT_DAYS.has(date.getDay());
  const progression = getProgression();
  const moves = workout ? progressedWorkoutMoves() : recoveryMoves;
  return {
    type: workout ? "workout" : "recovery",
    label: workout ? "Full Body Quest" : "Recovery Quest",
    title: workout ? "Mini Room Circuit" : "Reset & Recharge",
    description: workout
      ? "Seven bodyweight moves, three steady sets, and one clean win before the day gets noisy."
      : "A light mobility run that keeps your daily promise without loading tired muscles.",
    moves,
    totalSegments: moves.reduce((sum, move) => sum + move.sets, 0),
    estimated: workout ? "20–25 min" : "4–6 min",
    completionXp: workout ? 80 : 45,
    segmentXp: workout ? 10 : 15,
    progression,
    restSeconds: workout ? progression.restSeconds : 30
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Still Time";
  return "Finish Strong";
}

function currentStreak() {
  const today = new Date();
  let cursor = data.completedDays[dateKey(today)] ? today : addDays(today, -1);
  let streak = 0;
  while (data.completedDays[dateKey(cursor)]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function calculateLongestStreak() {
  const keys = Object.keys(data.completedDays).sort();
  let longest = 0;
  let run = 0;
  let previous = null;
  for (const key of keys) {
    const current = fromDateKey(key);
    if (previous && dateKey(addDays(previous, 1)) === key) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    previous = current;
  }
  return longest;
}

function getLevel() {
  const index = Math.floor(data.xp / 500);
  const level = index + 1;
  const levelXp = data.xp % 500;
  return {
    level,
    title: levelNames[Math.min(index, levelNames.length - 1)],
    levelXp,
    remaining: 500 - levelXp,
    progress: Math.round((levelXp / 500) * 100)
  };
}

function fuseHtml(total, completed, extraClass = "") {
  return `<div class="fuse ${extraClass}" aria-label="${completed} of ${total} steps complete">${Array.from({ length: total }, (_, index) => `<span class="fuse-segment ${index < completed ? "is-lit" : ""}"></span>`).join("")}</div>`;
}

function getWeekDates() {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = addDays(today, -mondayOffset);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function weekHtml() {
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
  const today = dateKey();
  return getWeekDates().map((date) => {
    const key = dateKey(date);
    const done = Boolean(data.completedDays[key]);
    const workout = getPlan(date).type === "workout";
    return `<div class="day-cell ${key === today ? "is-today" : ""} ${done ? "is-done" : ""}" aria-label="${formatter.format(date)}, ${done ? "complete" : workout ? "workout" : "recovery"}">
      <span>${formatter.format(date).slice(0, 2).toUpperCase()}</span>
      <strong>${date.getDate()}</strong>
      ${done ? `<div class="day-dot" style="background:white"></div>` : workout ? `<div class="day-dot"></div>` : `<div class="day-dot" style="background:#a6afba"></div>`}
    </div>`;
  }).join("");
}

function renderToday() {
  const plan = getPlan();
  const progression = plan.progression;
  const key = dateKey();
  const complete = data.completedDays[key];
  const resumable = data.session?.date === key && !complete;
  const completedSegments = complete ? plan.totalSegments : resumable ? data.session.completedSegments : 0;
  const level = getLevel();
  const streak = currentStreak();
  const formattedDate = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(new Date());
  const buttonCopy = complete ? "VIEW YOUR PROGRESS" : resumable ? "RESUME QUEST" : plan.type === "workout" ? "START TODAY’S CIRCUIT" : "START RECOVERY QUEST";

  todayView.innerHTML = `
    <p class="eyebrow">${formattedDate}</p>
    <h1 id="todayHeading" class="page-title">${getGreeting()}.</h1>
    <div class="stats-rail" aria-label="Your stats">
      <div class="stat"><strong>${streak}</strong><span>Day Streak</span></div>
      <div class="stat"><strong>${data.xp}</strong><span>Total XP</span></div>
      <div class="stat"><strong>${level.level}</strong><span>Level</span></div>
    </div>
    <div class="today-grid">
      <article class="quest-card ${complete ? "is-complete" : ""}">
        <div class="quest-kicker">
          <span class="quest-type">${complete ? "Quest Complete" : plan.label}</span>
          <span class="quest-xp">+${plan.totalSegments * plan.segmentXp + plan.completionXp} XP</span>
        </div>
        <h2>${complete ? "Promise Kept." : plan.title}</h2>
        <p>${complete ? "You showed up today. That is the whole game—and you won it." : plan.description}</p>
        ${fuseHtml(plan.totalSegments, completedSegments)}
        <button id="startQuest" class="primary-button ${complete ? "is-complete" : ""}" type="button">
          <span>${buttonCopy}</span><span class="button-arrow" aria-hidden="true">→</span>
        </button>
        <div class="quest-meta"><span><b>${plan.estimated}</b></span><span>•</span><span>${plan.totalSegments} checkpoints</span><span>•</span><span>${plan.type === "workout" ? `${plan.restSeconds}s rest` : "Light recovery"}</span></div>
      </article>
      <div class="today-secondary">
        <div class="section-header"><h2>This Week</h2><span>Orange = training</span></div>
        <div class="week-strip">${weekHtml()}</div>
        <div class="section-header"><h2>Training Block</h2><span>Progress after 4 circuits</span></div>
        <div class="progression-panel">
          <div class="progression-top"><span class="progression-week">W${progression.week}</span><div><strong>${progression.stage}</strong><small>${progression.atMastery ? "Own the tempo" : `${progression.sessionsToNext} circuit${progression.sessionsToNext === 1 ? "" : "s"} until targets rise`}</small></div></div>
          <div class="block-dots" aria-label="${progression.sessionsIntoWeek} of 4 circuits complete in this block">${Array.from({ length: 4 }, (_, index) => `<i class="${index < progression.sessionsIntoWeek ? "is-done" : ""}"></i>`).join("")}</div>
          <p class="progression-next">${nextProgressionSummary()}</p>
        </div>
        <div class="section-header"><h2>Level ${level.level}</h2><span>${level.remaining} XP to level up</span></div>
        <div class="level-block">
          <div class="level-line"><strong>${level.title}</strong><span>${level.levelXp} / 500 XP</span></div>
          <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="500" aria-valuenow="${level.levelXp}"><div class="meter-fill" style="width:${level.progress}%"></div></div>
        </div>
      </div>
    </div>`;

  document.querySelector("#startQuest")?.addEventListener("click", () => {
    if (complete) switchTab("progress");
    else startOrResumeQuest();
  });
}

function renderProgress() {
  const streak = currentStreak();
  const progression = getProgression();
  const history = Object.entries(data.completedDays).sort(([a], [b]) => b.localeCompare(a));
  const heatDates = Array.from({ length: 28 }, (_, index) => addDays(new Date(), index - 27));

  progressView.innerHTML = `
    <p class="eyebrow">Your Record</p>
    <h1 id="progressHeading" class="page-title">Built By Showing Up.</h1>
    <div class="progress-layout">
      <div>
        <div class="progress-hero">
          <div><strong>${streak}</strong><span>Current Streak</span></div>
          <div class="hero-split"><strong>${data.longestStreak}</strong><span>Best Streak</span></div>
        </div>
        <div class="section-header"><h2>Current Block</h2><span>${completedWorkoutCount()} circuits completed</span></div>
        <div class="progression-panel">
          <div class="progression-top"><span class="progression-week">W${progression.week}</span><div><strong>${progression.stage}</strong><small>${progression.atMastery ? "Top range · controlled tempo" : `${progression.sessionsToNext} more circuit${progression.sessionsToNext === 1 ? "" : "s"} to progress`}</small></div></div>
          <div class="block-dots">${Array.from({ length: 4 }, (_, index) => `<i class="${index < progression.sessionsIntoWeek ? "is-done" : ""}"></i>`).join("")}</div>
          <p class="progression-next">${nextProgressionSummary()}</p>
        </div>
        <div class="section-header"><h2>Last 28 Days</h2><span>${data.totalSessions} quests total</span></div>
        <div class="heatmap" aria-label="Last 28 days of activity">
          ${heatDates.map((date) => `<span class="heat-cell ${data.completedDays[dateKey(date)] ? "is-done" : ""} ${dateKey(date) === dateKey() ? "is-today" : ""}" title="${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date)}"></span>`).join("")}
        </div>
        <div class="section-header"><h2>History</h2><span>${data.totalSets} checkpoints</span></div>
        ${history.length ? `<ol class="history-list">${history.slice(0, 10).map(([key, entry]) => {
          const date = fromDateKey(key);
          return `<li class="history-row"><span class="history-day">${date.getDate()}</span><div><strong>${entry.type === "workout" ? "Mini Room Circuit" : "Recovery Quest"}</strong><span>${new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(date)}${entry.blockWeek ? ` · W${entry.blockWeek}` : ""}</span></div><span class="history-xp">+${entry.xp} XP</span></li>`;
        }).join("")}</ol>` : `<p class="empty-copy">Your completed quests will land here. Today is a very good day to make the first mark.</p>`}
      </div>
      <div>
        <div class="section-header"><h2>Trophy Shelf</h2><span>${Object.keys(data.earnedAchievements).length} / ${achievements.length}</span></div>
        <ol class="achievement-list">${achievements.map((achievement) => {
          const earned = data.earnedAchievements[achievement.id];
          return `<li class="achievement ${earned ? "is-earned" : ""}"><span class="achievement-mark">${achievement.mark}</span><div><h3>${achievement.name}</h3><p>${achievement.description}</p></div><span class="achievement-state">${earned ? "EARNED" : "LOCKED"}</span></li>`;
        }).join("")}</ol>
      </div>
    </div>`;
}

function renderRoutine() {
  const progression = getProgression();
  const currentMoves = progressedWorkoutMoves();
  routineView.innerHTML = `
    <p class="eyebrow">The Plan</p>
    <h1 id="routineHeading" class="page-title">Small Room. Full Send.</h1>
    <div class="schedule-band">
      <div class="schedule-side"><strong>Training Days</strong><span>Mon · Wed · Fri · Sat<br>Full bodyweight circuit</span></div>
      <div class="schedule-side recovery"><strong>Recovery Days</strong><span>Tue · Thu · Sun<br>Light mobility quest</span></div>
    </div>
    <div class="routine-progression"><span>W${progression.week}</span><div><strong>${progression.stage} Block</strong><p>Current targets rise only after 4 completed circuits. Rest: ${progression.restSeconds} seconds.${progression.atMastery ? " You have reached the top range; the next challenge is slower control." : ""}</p></div></div>
    <div class="routine-layout">
      <div>
        <div class="section-header"><h2>Your Current Circuit</h2><span>${progression.restSeconds}s rest</span></div>
        <ol class="move-list">${currentMoves.map((move, index) => `<li class="move-row"><span class="move-number">${index === 0 ? "W" : index}</span><div><strong>${move.name}</strong><span>${move.sets} ${move.sets === 1 ? "round" : "sets"} × ${move.target} ${move.unit}</span></div><span class="history-xp">${move.kind === "seconds" ? "TIME" : move.kind === "manual" ? "PREP" : "REPS"}</span></li>`).join("")}</ol>
      </div>
      <details class="poster-frame">
        <summary>OPEN ORIGINAL ROUTINE POSTER</summary>
        <img src="assets/routine-poster.png" width="1055" height="1491" loading="lazy" alt="Original Mini Room Calisthenics Plan with seven bodyweight exercises" />
      </details>
    </div>`;
}

function renderAll() {
  renderToday();
  renderProgress();
  renderRoutine();
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".view").forEach((view) => {
    const active = view.id === `${tab}View`;
    view.hidden = !active;
    view.classList.toggle("is-active", active);
  });
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.tab === tab));
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelector(`#${tab}View`)?.focus({ preventScroll: true });
}

function createSession() {
  const plan = getPlan();
  return {
    date: dateKey(),
    type: plan.type,
    moveIndex: 0,
    setIndex: 0,
    completedSegments: 0,
    mode: "move",
    restRemaining: plan.restSeconds,
    setTimerRemaining: null
  };
}

function startOrResumeQuest() {
  const key = dateKey();
  if (!data.session || data.session.date !== key || data.session.type !== getPlan().type) {
    data.session = createSession();
    saveData();
  }
  workoutView.hidden = false;
  document.body.style.overflow = "hidden";
  renderWorkout();
}

function closeWorkout() {
  clearActiveTimers();
  workoutView.hidden = true;
  workoutView.innerHTML = "";
  document.body.style.overflow = "";
  renderAll();
}

function clearActiveTimers() {
  window.clearInterval(restTimer);
  window.clearInterval(setTimer);
  restTimer = null;
  setTimer = null;
}

function renderWorkout() {
  clearActiveTimers();
  const session = data.session;
  if (!session) return;
  const plan = getPlan();
  if (session.mode === "summary") {
    renderSummary(session.summary);
    return;
  }
  if (session.mode === "rest") {
    renderRest(plan, session);
    return;
  }

  const move = plan.moves[session.moveIndex];
  const timed = move.kind === "seconds";
  const timerActive = timed && Number.isFinite(session.setTimerRemaining);
  workoutView.innerHTML = `<div class="workout-screen">
    <div class="workout-top">
      <button id="closeWorkout" class="icon-button" type="button" aria-label="Close and save workout">×</button>
      <div class="workout-top-copy"><span>${plan.type === "workout" ? `W${plan.progression.week} · ${plan.progression.stage}` : plan.label}</span><strong>MOVE ${session.moveIndex + 1} OF ${plan.moves.length}</strong></div>
      <span></span>
    </div>
    ${fuseHtml(plan.totalSegments, session.completedSegments, "workout-fuse")}
    <div class="move-stage">
      <span class="move-index">${session.moveIndex + 1}</span>
      ${window.RiseRepVisuals?.get(move.visual) || ""}
      <p class="eyebrow">${move.sets === 1 ? "One Round" : `Set ${session.setIndex + 1} of ${move.sets}`}</p>
      <h1 id="workoutMove">${move.name}</h1>
      <div class="move-prescription"><strong id="targetValue">${timerActive ? session.setTimerRemaining : move.target}</strong><span>${timerActive ? "seconds left" : move.unit}</span></div>
      <p class="form-cue">${move.cue}</p>
    </div>
    <button id="completeSet" class="set-button" type="button" ${timerActive ? "disabled" : ""}>${timed ? `START ${move.target} SEC` : move.kind === "manual" ? "WARM-UP DONE" : "SET DONE"}<span class="button-arrow" aria-hidden="true">→</span></button>
    <p class="workout-footnote">Stop if you feel sharp pain, dizziness, or unusual discomfort.</p>
  </div>`;

  document.querySelector("#closeWorkout").addEventListener("click", closeWorkout);
  document.querySelector("#completeSet").addEventListener("click", () => timed ? startSetTimer(move.target) : completeSet());
  if (timerActive) runSetTimer();
}

function startSetTimer(seconds) {
  data.session.setTimerRemaining = Number(seconds);
  saveData();
  renderWorkout();
  soundTick(520, 0.06);
}

function runSetTimer() {
  const targetValue = document.querySelector("#targetValue");
  setTimer = window.setInterval(() => {
    if (!data.session || data.session.mode !== "move") return clearActiveTimers();
    data.session.setTimerRemaining -= 1;
    if (targetValue) targetValue.textContent = Math.max(0, data.session.setTimerRemaining);
    if (data.session.setTimerRemaining <= 0) {
      window.clearInterval(setTimer);
      setTimer = null;
      data.session.setTimerRemaining = null;
      soundTick(760, 0.12);
      completeSet();
    } else if (data.session.setTimerRemaining <= 3) {
      soundTick(600, 0.035);
    }
    saveData();
  }, 1000);
}

function completeSet() {
  clearActiveTimers();
  const session = data.session;
  const plan = getPlan();
  const move = plan.moves[session.moveIndex];
  session.completedSegments += 1;
  session.setTimerRemaining = null;
  pulseDevice();

  const finishedEverything = session.completedSegments >= plan.totalSegments;
  if (finishedEverything) {
    finishQuest();
    return;
  }

  if (session.setIndex + 1 < move.sets) {
    session.setIndex += 1;
  } else {
    session.moveIndex += 1;
    session.setIndex = 0;
  }
  session.mode = "rest";
  session.restRemaining = plan.restSeconds;
  saveData();
  renderWorkout();
}

function renderRest(plan, session) {
  const nextMove = plan.moves[session.moveIndex];
  workoutView.innerHTML = `<div class="workout-screen">
    <div class="workout-top">
      <button id="closeWorkout" class="icon-button" type="button" aria-label="Close and save workout">×</button>
      <div class="workout-top-copy"><span>Checkpoint ${session.completedSegments}</span><strong>+${plan.segmentXp} XP BANKED</strong></div>
      <span></span>
    </div>
    ${fuseHtml(plan.totalSegments, session.completedSegments, "workout-fuse")}
    <div class="rest-stage">
      <h1>Reset Your Engine.</h1>
      <p>Next: ${nextMove.name}${nextMove.sets > 1 ? ` · set ${session.setIndex + 1}` : ""}</p>
      <div class="rest-layout">
        <div class="timer-ring"><span id="restValue" class="timer-value">${session.restRemaining}</span></div>
        <div class="next-preview">${window.RiseRepVisuals?.get(nextMove.visual) || ""}<span>NEXT MOVE</span></div>
      </div>
    </div>
    <button id="skipRest" class="secondary-button" type="button">SKIP REST <span class="button-arrow" aria-hidden="true">→</span></button>
  </div>`;
  document.querySelector("#closeWorkout").addEventListener("click", closeWorkout);
  document.querySelector("#skipRest").addEventListener("click", endRest);

  restTimer = window.setInterval(() => {
    if (!data.session || data.session.mode !== "rest") return clearActiveTimers();
    data.session.restRemaining -= 1;
    document.querySelector("#restValue").textContent = Math.max(0, data.session.restRemaining);
    if (data.session.restRemaining <= 0) endRest();
    else saveData();
  }, 1000);
}

function endRest() {
  clearActiveTimers();
  if (!data.session) return;
  data.session.mode = "move";
  data.session.restRemaining = getPlan().restSeconds;
  saveData();
  renderWorkout();
}

function finishQuest() {
  const plan = getPlan();
  const key = dateKey();
  const xp = plan.totalSegments * plan.segmentXp + plan.completionXp;
  const alreadyComplete = Boolean(data.completedDays[key]);
  if (!alreadyComplete) {
    data.xp += xp;
    data.totalSessions += 1;
    data.totalSets += plan.totalSegments;
    data.completedDays[key] = {
      type: plan.type,
      xp,
      completedAt: new Date().toISOString(),
      segments: plan.totalSegments,
      blockWeek: plan.type === "workout" ? plan.progression.week : null,
      stage: plan.type === "workout" ? plan.progression.stage : null
    };
    data.longestStreak = calculateLongestStreak();
  }

  const streak = currentStreak();
  const nextProgression = getProgression();
  const newAchievements = awardAchievements(streak);
  data.session = {
    date: key,
    type: plan.type,
    mode: "summary",
    summary: {
      xp,
      streak,
      segments: plan.totalSegments,
      newAchievements,
      week: plan.progression.week,
      stage: plan.progression.stage,
      progressed: plan.type === "workout" && nextProgression.week > plan.progression.week,
      nextWeek: nextProgression.week,
      nextStage: nextProgression.stage
    }
  };
  saveData();
  soundWin();
  launchConfetti();
  renderWorkout();
}

function awardAchievements(streak) {
  const checks = {
    first: data.totalSessions >= 1,
    streak3: streak >= 3,
    streak7: streak >= 7,
    streak14: streak >= 14,
    sessions10: data.totalSessions >= 10,
    sets100: data.totalSets >= 100
  };
  const newlyEarned = [];
  achievements.forEach((achievement) => {
    if (checks[achievement.id] && !data.earnedAchievements[achievement.id]) {
      data.earnedAchievements[achievement.id] = new Date().toISOString();
      newlyEarned.push(achievement.name);
    }
  });
  return newlyEarned;
}

function renderSummary(summary) {
  const newBadge = summary.newAchievements?.[0];
  const summaryMessage = summary.progressed
    ? `Training block advanced: Week ${summary.nextWeek}, ${summary.nextStage}. Your targets rise on the next circuit.`
    : `${newBadge ? `New trophy unlocked: ${newBadge}. ` : ""}Come back tomorrow and put one more day on the board.`;
  workoutView.innerHTML = `<div class="workout-screen summary-screen">
    <div class="workout-top"><button id="closeSummary" class="icon-button" type="button" aria-label="Close summary">×</button><span></span><span></span></div>
    <div class="summary-stage">
      <span class="summary-badge">${summary.streak}</span>
      <p class="eyebrow">Daily Quest Complete</p>
      <h1>Streak Secured.</h1>
      <p>${summaryMessage}</p>
      <div class="reward-line">
        <div class="reward"><strong>+${summary.xp}</strong><span>XP Earned</span></div>
        <div class="reward"><strong>${summary.streak}</strong><span>Day Streak</span></div>
        <div class="reward"><strong>${summary.segments}</strong><span>Checkpoints</span></div>
      </div>
    </div>
    <button id="summaryDone" class="primary-button" type="button">BACK TO TODAY <span class="button-arrow" aria-hidden="true">→</span></button>
  </div>`;
  document.querySelector("#closeSummary").addEventListener("click", closeSummary);
  document.querySelector("#summaryDone").addEventListener("click", closeSummary);
}

function closeSummary() {
  data.session = null;
  saveData();
  closeWorkout();
}

function pulseDevice() {
  if (navigator.vibrate) navigator.vibrate(35);
  soundTick(640, 0.05);
}

function soundTick(frequency, duration) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
    oscillator.addEventListener("ended", () => context.close());
  } catch {
    // Sound is optional; the visual feedback remains complete.
  }
}

function soundWin() {
  [0, 120, 240].forEach((delay, index) => window.setTimeout(() => soundTick([520, 660, 820][index], 0.16), delay));
  if (navigator.vibrate) navigator.vibrate([45, 55, 85]);
}

function launchConfetti() {
  const root = document.querySelector("#confetti");
  const colors = ["#ff5a00", "#0a43a3", "#087a58", "#ffffff"];
  root.innerHTML = Array.from({ length: 34 }, (_, index) => {
    const left = (index * 29) % 100;
    const delay = (index % 8) * 0.035;
    const drift = `${((index % 7) - 3) * 18}px`;
    const spin = `${240 + (index % 5) * 100}deg`;
    return `<span class="confetti-piece" style="left:${left}%;background:${colors[index % colors.length]};animation-delay:${delay}s;--drift:${drift};--spin:${spin}"></span>`;
  }).join("");
  window.setTimeout(() => { root.innerHTML = ""; }, 2200);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function updateConnectionStatus(announce = false) {
  const offline = !navigator.onLine;
  connectionBadge.hidden = !offline;
  if (announce) showToast(offline ? "Offline mode. Your quest and progress still work." : "Back online. Everything is up to date.");
}

function showInstallSheet() {
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const localPreview = location.protocol === "file:";
  const installCopy = localPreview
    ? "You’re viewing the local preview. Upload the Rise & Rep folder to an HTTPS static host first; then reopen the hosted URL and install it from this button."
    : isiOS
      ? "In Safari, tap the Share button, then choose “Add to Home Screen.” Rise & Rep will open like an app each morning."
      : "Open your browser menu and choose “Install app” or “Add to Home screen.” Your progress stays on this device.";
  sheetRoot.innerHTML = `<div class="sheet-backdrop" role="presentation"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="installTitle">
    <h2 id="installTitle">Put It On Your Home Screen.</h2>
    <p>${installCopy}</p>
    <div class="sheet-actions"><button id="closeSheet" class="secondary-button" type="button">GOT IT</button></div>
  </section></div>`;
  document.querySelector("#closeSheet").addEventListener("click", closeSheet);
  document.querySelector(".sheet-backdrop").addEventListener("click", (event) => {
    if (event.target.classList.contains("sheet-backdrop")) closeSheet();
  });
}

function closeSheet() {
  sheetRoot.innerHTML = "";
}

document.querySelectorAll(".nav-item").forEach((item) => item.addEventListener("click", () => switchTab(item.dataset.tab)));
document.querySelector("[data-tab-target='today']").addEventListener("click", () => switchTab("today"));

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
  showToast("Rise & Rep is installed.");
});

installButton.addEventListener("click", async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  } else {
    showInstallSheet();
  }
});

if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) installButton.hidden = true;

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("sw.js");
      if (registration.waiting) registration.waiting.postMessage("SKIP_WAITING");
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) showToast("A fresh version is ready for your next launch.");
        });
      });
    } catch {
      // The app still runs normally if private browsing blocks service workers.
    }
  });
}

window.addEventListener("online", () => updateConnectionStatus(true));
window.addEventListener("offline", () => updateConnectionStatus(true));
updateConnectionStatus();
renderAll();
