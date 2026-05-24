const PUZZLES = [
  {
    id: "bright-001",
    groups: [
      { title: "Breakfast staples", color: "var(--yellow)", words: ["toast", "cereal", "yogurt", "omelet"] },
      { title: "Phone gestures", color: "var(--green)", words: ["swipe", "tap", "scroll", "pinch"] },
      { title: "Weather words", color: "var(--blue)", words: ["sunny", "cloudy", "windy", "rainy"] },
      { title: "Quick praise", color: "var(--pink)", words: ["nice", "bravo", "sharp", "solid"] },
    ],
  },
  {
    id: "bright-002",
    groups: [
      { title: "Coffee orders", color: "var(--yellow)", words: ["latte", "mocha", "espresso", "americano"] },
      { title: "Travel items", color: "var(--green)", words: ["passport", "ticket", "luggage", "map"] },
      { title: "Chat replies", color: "var(--blue)", words: ["sure", "okay", "gotcha", "thanks"] },
      { title: "Fitness moves", color: "var(--pink)", words: ["jump", "squat", "plank", "lunge"] },
    ],
  },
  {
    id: "bright-003",
    groups: [
      { title: "Desserts", color: "var(--yellow)", words: ["cake", "cookie", "pudding", "gelato"] },
      { title: "Desk supplies", color: "var(--green)", words: ["paper", "marker", "stapler", "notebook"] },
      { title: "Colors", color: "var(--blue)", words: ["red", "blue", "green", "violet"] },
      { title: "Movie moods", color: "var(--pink)", words: ["funny", "scary", "tender", "tense"] },
    ],
  },
  {
    id: "bright-004",
    groups: [
      { title: "Kitchen tools", color: "var(--yellow)", words: ["pan", "knife", "whisk", "spoon"] },
      { title: "Time words", color: "var(--green)", words: ["today", "morning", "weekend", "midnight"] },
      { title: "Music words", color: "var(--blue)", words: ["song", "chorus", "rhythm", "playlist"] },
      { title: "Tiny reactions", color: "var(--pink)", words: ["wow", "oops", "yikes", "really"] },
    ],
  },
  {
    id: "bright-005",
    groups: [
      { title: "Online shopping", color: "var(--yellow)", words: ["cart", "sale", "coupon", "checkout"] },
      { title: "City transport", color: "var(--green)", words: ["metro", "bus", "taxi", "scooter"] },
      { title: "Ways to rest", color: "var(--blue)", words: ["nap", "walk", "stretch", "breathe"] },
      { title: "Garden things", color: "var(--pink)", words: ["soil", "seeds", "trowel", "sprout"] },
    ],
  },
];

const MAX_MISTAKES = 4;
const DAY_MS = 86400000;
const START_DATE = "2026-05-23";
const STATS_KEY = "bright-links-stats";
const SUBSCRIBE_ENDPOINT = "/api/subscribe";
const board = document.querySelector("#board");
const solvedList = document.querySelector("#solvedList");
const mistakesLeft = document.querySelector("#mistakesLeft");
const solvedCount = document.querySelector("#solvedCount");
const puzzleLabel = document.querySelector("#puzzleLabel");
const dateLabel = document.querySelector("#dateLabel");
const streakCount = document.querySelector("#streakCount");
const submitButton = document.querySelector("#submitButton");
const clearButton = document.querySelector("#clearButton");
const shuffleButton = document.querySelector("#shuffleButton");
const newGameButton = document.querySelector("#newGameButton");
const message = document.querySelector("#message");
const resultDialog = document.querySelector("#resultDialog");
const resultTitle = document.querySelector("#resultTitle");
const resultCopy = document.querySelector("#resultCopy");
const resultKicker = document.querySelector("#resultKicker");
const answerList = document.querySelector("#answerList");
const copyButton = document.querySelector("#copyButton");
const closeDialogButton = document.querySelector("#closeDialogButton");
const signupForm = document.querySelector("#signupForm");
const emailInput = document.querySelector("#emailInput");
const signupMessage = document.querySelector("#signupMessage");

let puzzleIndex = 0;
let activePuzzle;
let remainingTiles = [];
let selected = new Set();
let solvedGroups = [];
let mistakes = 0;
let history = [];
let locked = false;
let audioContext;
let activeDayNumber = 1;
let activeDateKey = "";
let isDailyMode = true;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayNumberFor(dateKey) {
  const start = new Date(`${START_DATE}T00:00:00`);
  const current = new Date(`${dateKey}T00:00:00`);
  return Math.max(1, Math.floor((current - start) / DAY_MS) + 1);
}

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) ?? { streak: 0, lastSolvedDate: "" };
  } catch {
    return { streak: 0, lastSolvedDate: "" };
  }
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function updateDailyStats(won) {
  if (!won || !isDailyMode) return;
  const stats = loadStats();
  if (stats.lastSolvedDate === activeDateKey) return;

  const yesterday = new Date(`${activeDateKey}T00:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = localDateKey(yesterday);
  stats.streak = stats.lastSolvedDate === yesterdayKey ? stats.streak + 1 : 1;
  stats.lastSolvedDate = activeDateKey;
  saveStats(stats);
  streakCount.textContent = stats.streak;
}

function dailyPuzzleIndex(dateKey) {
  return (dayNumberFor(dateKey) - 1) % PUZZLES.length;
}

function track(eventName, payload = {}) {
  window.brightLinksEvents ||= [];
  window.brightLinksEvents.push({ eventName, payload, at: new Date().toISOString() });
}

function playSound(type = "tap") {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const now = audioContext.currentTime;
  const presets = {
    tap: { tone: 185, gain: 0.035, duration: 0.032, noise: 0.018 },
    good: { tone: 230, gain: 0.045, duration: 0.04, noise: 0.022 },
    bad: { tone: 120, gain: 0.055, duration: 0.05, noise: 0.026 },
    shuffle: { tone: 170, gain: 0.03, duration: 0.028, noise: 0.018 },
  };
  const preset = presets[type] ?? presets.tap;

  function keyClick(offset = 0) {
    const clickTime = now + offset;
    const sampleCount = Math.floor(audioContext.sampleRate * preset.duration);
    const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < sampleCount; i += 1) {
      const decay = 1 - i / sampleCount;
      data[i] = (Math.random() * 2 - 1) * decay * preset.noise;
    }

    const noise = audioContext.createBufferSource();
    const noiseGain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const tone = audioContext.createOscillator();
    const toneGain = audioContext.createGain();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800 + Math.random() * 700, clickTime);
    filter.Q.setValueAtTime(1.8, clickTime);

    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(preset.gain, clickTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, clickTime + preset.duration);

    tone.type = "square";
    tone.frequency.setValueAtTime(preset.tone + Math.random() * 18, clickTime);
    toneGain.gain.setValueAtTime(preset.gain * 0.24, clickTime);
    toneGain.gain.exponentialRampToValueAtTime(0.001, clickTime + preset.duration * 0.75);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    tone.connect(toneGain);
    toneGain.connect(audioContext.destination);

    noise.start(clickTime);
    noise.stop(clickTime + preset.duration);
    tone.start(clickTime);
    tone.stop(clickTime + preset.duration * 0.75);
  }

  keyClick();
  if (type === "good") keyClick(0.045);
  if (type === "shuffle") {
    keyClick(0.035);
    keyClick(0.07);
  }
}

function startGame(nextIndex = Math.floor(Math.random() * PUZZLES.length), mode = "practice") {
  puzzleIndex = nextIndex;
  activePuzzle = PUZZLES[puzzleIndex];
  isDailyMode = mode === "daily";
  activeDateKey = isDailyMode ? localDateKey() : "practice";
  activeDayNumber = isDailyMode ? dayNumberFor(activeDateKey) : puzzleIndex + 1;
  remainingTiles = shuffle(
    activePuzzle.groups.flatMap((group, groupIndex) =>
      group.words.map((word) => ({ word, groupIndex }))
    )
  );
  selected = new Set();
  solvedGroups = [];
  mistakes = 0;
  history = [];
  locked = false;
  if (resultDialog.open) resultDialog.close();
  setMessage(isDailyMode ? "Daily puzzle loaded. Select four words that belong together." : "Practice puzzle loaded.");
  track("puzzle_started", { id: activePuzzle.id, mode, day: activeDayNumber });
  render();
}

function render() {
  const stats = loadStats();
  puzzleLabel.textContent = isDailyMode ? `Daily #${activeDayNumber}` : `Practice #${activeDayNumber}`;
  dateLabel.textContent = isDailyMode ? activeDateKey : "Practice mode";
  streakCount.textContent = stats.streak ?? 0;
  mistakesLeft.textContent = MAX_MISTAKES - mistakes;
  solvedCount.textContent = `${solvedGroups.length}/4`;

  solvedList.innerHTML = solvedGroups
    .map((groupIndex) => {
      const group = activePuzzle.groups[groupIndex];
      return `
        <article class="solved-group" style="background:${group.color}">
          <h3>${group.title}</h3>
          <p>${group.words.join(" / ")}</p>
        </article>
      `;
    })
    .join("");

  board.innerHTML = remainingTiles
    .map(
      (tile) => `
        <button class="tile ${selected.has(tile.word) ? "selected" : ""}" type="button" data-word="${tile.word}">
          ${tile.word}
        </button>
      `
    )
    .join("");

  submitButton.disabled = selected.size !== 4 || locked;
  clearButton.disabled = selected.size === 0 || locked;
  shuffleButton.disabled = locked || remainingTiles.length <= 4;
}

function setMessage(text, tone = "") {
  message.textContent = text;
  message.className = `message ${tone}`.trim();
}

function toggleTile(word) {
  if (locked) return;
  playSound("tap");
  if (selected.has(word)) {
    selected.delete(word);
  } else if (selected.size < 4) {
    selected.add(word);
    punch(word, "bump");
  } else {
    setMessage("Only four at a time. Deselect one first.", "bad");
    playSound("bad");
  }
  render();
}

function punch(word, className) {
  requestAnimationFrame(() => {
    const tile = board.querySelector(`[data-word="${CSS.escape(word)}"]`);
    if (!tile) return;
    tile.classList.add(className);
    tile.addEventListener("animationend", () => tile.classList.remove(className), { once: true });
  });
}

function submitGuess() {
  if (selected.size !== 4 || locked) return;
  const words = [...selected];
  const groupIndex = remainingTiles.find((tile) => tile.word === words[0]).groupIndex;
  const isCorrect = words.every(
    (word) => remainingTiles.find((tile) => tile.word === word)?.groupIndex === groupIndex
  );

  locked = true;

  if (isCorrect) {
    playSound("good");
    solvedGroups.push(groupIndex);
    remainingTiles = remainingTiles.filter((tile) => tile.groupIndex !== groupIndex);
    selected.clear();
    history.push(activePuzzle.groups[groupIndex].color);
    setMessage("Hit. That set snaps into place.", "good");
    setTimeout(() => {
      locked = false;
      render();
      if (solvedGroups.length === 4) finishGame(true);
    }, 250);
    render();
    return;
  }

  playSound("bad");
  mistakes += 1;
  history.push("#d34646");
  words.forEach((word) => punch(word, "shake"));
  setMessage(mistakes >= MAX_MISTAKES ? "No more misses. Revealing the board." : "Not that set. Hit it again.", "bad");

  setTimeout(() => {
    selected.clear();
    locked = false;
    render();
    if (mistakes >= MAX_MISTAKES) finishGame(false);
  }, 460);
}

function finishGame(won) {
  locked = true;
  updateDailyStats(won);
  track("puzzle_finished", {
    id: activePuzzle.id,
    mode: isDailyMode ? "daily" : "practice",
    won,
    mistakes,
    solved: solvedGroups.length,
  });
  render();
  resultKicker.textContent = won ? "Solved" : "Revealed";
  resultTitle.textContent = won ? "Clean solve." : "Close one.";
  resultCopy.textContent = won
    ? `You solved ${resultPuzzleName()} with ${mistakes} mistake${mistakes === 1 ? "" : "s"}.`
    : `You found ${solvedGroups.length} of 4 sets in ${resultPuzzleName()}.`;
  answerList.innerHTML = activePuzzle.groups
    .map(
      (group) => `
        <div class="answer-row" style="background:${group.color}">
          ${group.title}: ${group.words.join(" / ")}
        </div>
      `
    )
    .join("");
  resultDialog.showModal();
}

function copyResult() {
  const colorMap = new Map([
    ["var(--yellow)", "[Y]"],
    ["var(--green)", "[G]"],
    ["var(--blue)", "[B]"],
    ["var(--pink)", "[P]"],
  ]);
  const result = [
    "Bright Links",
    `${resultPuzzleName()} ${solvedGroups.length}/4`,
    `Streak: ${loadStats().streak ?? 0}`,
    ...history.map((color) => (color === "#d34646" ? "[X]" : colorMap.get(color) ?? "[G]")),
    "Play today's puzzle:",
    window.location.href.split("#")[0],
  ].join("\n");
  navigator.clipboard?.writeText(result);
  track("result_copied", { id: activePuzzle.id, mode: isDailyMode ? "daily" : "practice" });
  playSound("good");
  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = "Copy result";
  }, 1100);
}

function resultPuzzleName() {
  return isDailyMode ? `Daily #${activeDayNumber}` : `Practice #${activeDayNumber}`;
}

board.addEventListener("click", (event) => {
  const tile = event.target.closest(".tile");
  if (!tile) return;
  toggleTile(tile.dataset.word);
});

submitButton.addEventListener("click", submitGuess);
clearButton.addEventListener("click", () => {
  playSound("tap");
  selected.clear();
  setMessage("Selection cleared.");
  render();
});
shuffleButton.addEventListener("click", () => {
  playSound("shuffle");
  remainingTiles = shuffle(remainingTiles);
  setMessage("Board shuffled.");
  render();
});
newGameButton.addEventListener("click", () => {
  playSound("shuffle");
  startGame((puzzleIndex + 1) % PUZZLES.length);
});
copyButton.addEventListener("click", copyResult);
closeDialogButton.addEventListener("click", () => {
  playSound("tap");
  resultDialog.close();
});
signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();
  playSound("tap");
  if (!emailInput.checkValidity() || email.length < 5) {
    signupMessage.textContent = "Enter a valid email to join the early list.";
    signupMessage.style.color = "var(--bad)";
    return;
  }

  localStorage.setItem("bright-links-email", email);
  signupMessage.textContent = "Joining...";
  signupMessage.style.color = "var(--muted)";
  track("email_signup_attempted", { domain: email.split("@")[1] ?? "unknown" });

  const formData = new FormData();
  formData.set("email", email);

  fetch(SUBSCRIBE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      email,
      tags: isDailyMode ? ["daily"] : ["practice"],
      meta: {
        mode: isDailyMode ? "daily" : "practice",
        puzzle: resultPuzzleName(),
      },
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("bad_status");
      signupMessage.textContent = "You're in. Tomorrow's puzzle will land here.";
      signupMessage.style.color = "var(--good)";
      track("email_signup_submitted", { ok: true });
      emailInput.value = "";
    })
    .catch(() => {
      signupMessage.textContent = "Saved locally, but signup failed. Try again in a moment.";
      signupMessage.style.color = "var(--bad)";
      track("email_signup_submitted", { ok: false });
    });
});

startGame(dailyPuzzleIndex(localDateKey()), "daily");
