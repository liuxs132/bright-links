/* Bright Links - lightweight daily word grouping game
   Works with static hosting + optional Vercel /api/subscribe endpoint.
*/

(() => {
  "use strict";

  const CANONICAL_FALLBACK = "https://bright-links-gold.vercel.app/";
  const DAILY_EPOCH = "2026-05-23"; // Daily #1
  const MAX_MISTAKES = 4;
  const GROUP_SIZE = 4;
  const TOTAL_GROUPS = 4;

  const el = {
    board: document.querySelector("#board"),
    solvedList: document.querySelector("#solvedList"),
    mistakesLeft: document.querySelector("#mistakesLeft"),
    solvedCount: document.querySelector("#solvedCount"),
    submitButton: document.querySelector("#submitButton"),
    clearButton: document.querySelector("#clearButton"),
    revealButton: document.querySelector("#revealButton"),
    shuffleButton: document.querySelector("#shuffleButton"),
    newGameButton: document.querySelector("#newGameButton"),
    message: document.querySelector("#message"),
    puzzleLabel: document.querySelector("#puzzleLabel"),
    dateLabel: document.querySelector("#dateLabel"),
    streakCount: document.querySelector("#streakCount"),
    signupForm: document.querySelector("#signupForm"),
    emailInput: document.querySelector("#emailInput"),
    signupMessage: document.querySelector("#signupMessage"),
    resultDialog: document.querySelector("#resultDialog"),
    resultKicker: document.querySelector("#resultKicker"),
    resultTitle: document.querySelector("#resultTitle"),
    resultCopy: document.querySelector("#resultCopy"),
    answerList: document.querySelector("#answerList"),
    copyButton: document.querySelector("#copyButton"),
    closeDialogButton: document.querySelector("#closeDialogButton"),
  };

  const canonicalUrl =
    document.querySelector('link[rel="canonical"]')?.href ||
    document.querySelector('meta[name="bright-links:canonical"]')?.content ||
    CANONICAL_FALLBACK;

  function track(eventName, props) {
    try {
      if (typeof window.plausible === "function") {
        window.plausible(eventName, props ? { props } : undefined);
      }
    } catch {
      // ignore
    }
  }

  // --- Sound (subtle keyboard click) ---
  let audioCtx = null;
  function clickSound(strength = 1) {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx;
      const now = ctx.currentTime;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.03 * strength, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      // short noise burst
      const bufferSize = Math.floor(ctx.sampleRate * 0.06);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // damped noise to feel like a keycap
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(900, now);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.06);
    } catch {
      // ignore
    }
  }

  // --- Utilities ---
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function toLocalISODate(d = new Date()) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function daysBetweenISO(a, b) {
    // a,b are YYYY-MM-DD; compute day difference in local time by normalizing to midnight UTC
    const [ay, am, ad] = a.split("-").map(Number);
    const [by, bm, bd] = b.split("-").map(Number);
    const aUTC = Date.UTC(ay, am - 1, ad);
    const bUTC = Date.UTC(by, bm - 1, bd);
    return Math.floor((bUTC - aUTC) / 86400000);
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStringToSeed(str) {
    // small non-crypto hash
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function shuffleInPlace(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  // --- Puzzle bank ---
  // Keep words lower-case for clean tiles; titles are human labels for solved groups.
  const GROUP_POOL = [
    { title: "COFFEE DRINKS", words: ["espresso", "latte", "mocha", "americano"] },
    { title: "AIRPORT THINGS", words: ["passport", "ticket", "gate", "luggage"] },
    { title: "AGREEMENT", words: ["okay", "sure", "fine", "agreed"] },
    { title: "JUMPS", words: ["leap", "hop", "jump", "spring"] },
    { title: "MAP FEATURES", words: ["legend", "scale", "compass", "route"] },
    { title: "KEYBOARD KEYS", words: ["enter", "shift", "tab", "escape"] },
    { title: "MUSIC TEMPO", words: ["adagio", "andante", "allegro", "presto"] },
    { title: "WEATHER", words: ["breeze", "drizzle", "thunder", "fog"] },
    { title: "DAY PARTS", words: ["morning", "noon", "evening", "night"] },
    { title: "BODY MOVES", words: ["squat", "lunge", "plank", "stretch"] },
    { title: "THANKS", words: ["thanks", "cheers", "appreciate", "grateful"] },
    { title: "SIZES", words: ["tiny", "small", "medium", "large"] },
    { title: "COLORS", words: ["scarlet", "navy", "ivory", "amber"] },
    { title: "TIME UNITS", words: ["second", "minute", "hour", "day"] },
    { title: "PLANETS", words: ["mercury", "venus", "earth", "mars"] },
    { title: "DIRECTIONS", words: ["north", "south", "east", "west"] },
    { title: "SHAPES", words: ["circle", "square", "triangle", "oval"] },
    { title: "TOOLS", words: ["hammer", "wrench", "pliers", "screwdriver"] },
    { title: "FRUITS", words: ["apple", "banana", "orange", "grape"] },
    { title: "VEGETABLES", words: ["carrot", "pepper", "onion", "spinach"] },
    { title: "DOG BREEDS", words: ["beagle", "poodle", "husky", "boxer"] },
    { title: "BIRDS", words: ["sparrow", "eagle", "owl", "robin"] },
    { title: "SEASONS", words: ["spring", "summer", "autumn", "winter"] },
    { title: "SCHOOL SUBJECTS", words: ["math", "history", "science", "music"] },
    { title: "WEB THINGS", words: ["cookie", "cache", "domain", "browser"] },
    { title: "FILES", words: ["folder", "backup", "shortcut", "archive"] },
    { title: "SPORTS", words: ["soccer", "tennis", "baseball", "hockey"] },
    { title: "FABRICS", words: ["linen", "cotton", "silk", "denim"] },
    { title: "SPICES", words: ["cumin", "pepper", "cinnamon", "paprika"] },
    { title: "BREAD", words: ["bagel", "brioche", "sourdough", "rye"] },
    { title: "SUSHI", words: ["nigiri", "maki", "sashimi", "temaki"] },
    { title: "ANIMALS", words: ["tiger", "zebra", "panda", "otter"] },
    { title: "GEMS", words: ["opal", "ruby", "sapphire", "topaz"] },
    { title: "CLOUDS", words: ["cirrus", "cumulus", "stratus", "nimbus"] },
    { title: "ROOMS", words: ["kitchen", "bedroom", "bathroom", "office"] },
    { title: "EMOTIONS", words: ["calm", "proud", "anxious", "curious"] },
    { title: "CHAT WORDS", words: ["gotcha", "brb", "lol", "hiya"] },
    { title: "PAYMENTS", words: ["cash", "credit", "debit", "coupon"] },
    { title: "METALS", words: ["iron", "copper", "silver", "gold"] },
    { title: "TREES", words: ["maple", "cedar", "pine", "oak"] },
    { title: "CITIES", words: ["beijing", "seoul", "tokyo", "london"] },
    { title: "PACKING", words: ["map", "charger", "umbrella", "adapter"] },
    { title: "WATER", words: ["river", "lake", "ocean", "pond"] },
    { title: "FASTENERS", words: ["zipper", "button", "buckle", "snap"] },
  ];

  function pickDailyPuzzle(dateISO) {
    const seed = hashStringToSeed(`daily:${dateISO}`);
    const rnd = mulberry32(seed);
    const pool = GROUP_POOL.slice();
    shuffleInPlace(pool, rnd);

    const chosen = [];
    const usedWords = new Set();
    for (const g of pool) {
      const words = g.words.map((w) => w.trim().toLowerCase());
      if (words.length !== 4) continue;
      if (words.some((w) => usedWords.has(w))) continue;
      chosen.push({ title: g.title, words });
      words.forEach((w) => usedWords.add(w));
      if (chosen.length === TOTAL_GROUPS) break;
    }

    // Fallback: if pool collisions happen (shouldn't), just take first 4 ignoring collisions.
    while (chosen.length < TOTAL_GROUPS) {
      const g = pool[chosen.length % pool.length];
      chosen.push({ title: g.title, words: g.words.map((w) => w.trim().toLowerCase()) });
    }

    const tiles = chosen.flatMap((g) => g.words.map((w) => ({ word: w })));
    shuffleInPlace(tiles, rnd);
    return { groups: chosen, tiles };
  }

  function pickPracticePuzzle() {
    const seed = (crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 1e9)) >>> 0;
    const rnd = mulberry32(seed);
    const pool = GROUP_POOL.slice();
    shuffleInPlace(pool, rnd);

    const chosen = [];
    const usedWords = new Set();
    for (const g of pool) {
      const words = g.words.map((w) => w.trim().toLowerCase());
      if (words.length !== 4) continue;
      if (words.some((w) => usedWords.has(w))) continue;
      chosen.push({ title: g.title, words });
      words.forEach((w) => usedWords.add(w));
      if (chosen.length === TOTAL_GROUPS) break;
    }
    const tiles = chosen.flatMap((g) => g.words.map((w) => ({ word: w })));
    shuffleInPlace(tiles, rnd);
    return { groups: chosen, tiles, seed };
  }

  // --- State ---
  const state = {
    mode: "daily", // daily | practice
    dateISO: toLocalISODate(),
    dailyNumber: 1,
    groups: [],
    solved: new Array(TOTAL_GROUPS).fill(false),
    tiles: [], // {word, id, solved, selected}
    mistakesLeft: MAX_MISTAKES,
    guesses: [], // {correct:boolean}
    revealed: false,
    done: false,
  };

  function setMessage(text, kind = "neutral") {
    if (!el.message) return;
    el.message.textContent = text;
    el.message.dataset.kind = kind;
  }

  function computeDailyNumber(dateISO) {
    return 1 + Math.max(0, daysBetweenISO(DAILY_EPOCH, dateISO));
  }

  // --- Streak logic (daily only) ---
  function loadStreak() {
    const streak = Number(localStorage.getItem("brightlinks:streak") || "0");
    const last = String(localStorage.getItem("brightlinks:lastSolved") || "");
    const today = state.dateISO;
    const diff = last ? daysBetweenISO(last, today) : null;
    const current = !last ? 0 : diff === 0 ? streak : diff === 1 ? streak : 0;
    el.streakCount.textContent = String(current);
    localStorage.setItem("brightlinks:streak", String(current));
    return { current, last };
  }

  function bumpStreakIfNeeded() {
    const today = state.dateISO;
    const streak = Number(localStorage.getItem("brightlinks:streak") || "0");
    const last = String(localStorage.getItem("brightlinks:lastSolved") || "");
    if (last === today) return streak;
    const next = last && daysBetweenISO(last, today) === 1 ? streak + 1 : 1;
    localStorage.setItem("brightlinks:streak", String(next));
    localStorage.setItem("brightlinks:lastSolved", today);
    el.streakCount.textContent = String(next);
    return next;
  }

  // --- Rendering ---
  function renderCounters() {
    el.mistakesLeft.textContent = String(state.mistakesLeft);
    el.solvedCount.textContent = `${state.solved.filter(Boolean).length}/${TOTAL_GROUPS}`;
  }

  function renderSolvedList() {
    el.solvedList.innerHTML = "";
    state.groups.forEach((g, idx) => {
      if (!state.solved[idx]) return;
      const box = document.createElement("div");
      box.className = "solved-group";
      const title = document.createElement("strong");
      title.textContent = g.title;
      const words = document.createElement("span");
      words.textContent = g.words.join(" \u00b7 ");
      box.appendChild(title);
      box.appendChild(words);
      el.solvedList.appendChild(box);
    });
  }

  function renderBoard() {
    el.board.innerHTML = "";
    for (const tile of state.tiles) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tile";
      b.textContent = tile.word;
      b.dataset.id = tile.id;
      if (tile.solved) b.disabled = true;
      if (tile.selected) b.classList.add("selected");
      if (tile.solved) b.classList.add("solved");
      el.board.appendChild(b);
    }
    updateActionButtons();
  }

  function updateActionButtons() {
    const selectedCount = state.tiles.filter((t) => t.selected && !t.solved).length;
    el.submitButton.disabled = selectedCount !== GROUP_SIZE || state.done;
    el.clearButton.disabled = selectedCount === 0 || state.done;
    el.revealButton.disabled = state.done;
    el.shuffleButton.disabled = state.done;
  }

  function selectedWords() {
    return state.tiles.filter((t) => t.selected && !t.solved).map((t) => t.word);
  }

  function clearSelection() {
    for (const t of state.tiles) t.selected = false;
    renderBoard();
    setMessage("Select four words that belong together.");
  }

  // --- Game logic ---
  function findMatchingGroup(words) {
    const s = new Set(words);
    for (let i = 0; i < state.groups.length; i++) {
      if (state.solved[i]) continue;
      const g = state.groups[i];
      const ok = g.words.every((w) => s.has(w));
      if (ok) return i;
    }
    return -1;
  }

  function solveGroup(groupIndex) {
    state.solved[groupIndex] = true;
    const words = new Set(state.groups[groupIndex].words);
    for (const t of state.tiles) {
      if (words.has(t.word)) {
        t.solved = true;
        t.selected = false;
      }
    }
    state.guesses.push({ correct: true });
    clickSound(1.0);
    renderSolvedList();
    renderCounters();
    renderBoard();

    setMessage("Nice. One set down.", "good");
    track("set_solved", { mode: state.mode });

    if (state.solved.every(Boolean)) {
      finishGame({ solved: true, revealed: false });
    }
  }

  function wrongGuess() {
    state.mistakesLeft -= 1;
    state.mistakesLeft = clamp(state.mistakesLeft, 0, MAX_MISTAKES);
    state.guesses.push({ correct: false });
    clickSound(0.7);
    renderCounters();
    updateActionButtons();
    setMessage(state.mistakesLeft > 0 ? `Not quite. ${state.mistakesLeft} mistake${state.mistakesLeft === 1 ? "" : "s"} left.` : "No mistakes left.", "bad");
    track("guess_wrong", { mode: state.mode });

    if (state.mistakesLeft === 0) {
      finishGame({ solved: false, revealed: true });
    }
  }

  function revealAnswers() {
    if (state.done) return;
    state.revealed = true;
    finishGame({ solved: false, revealed: true });
    track("revealed", { mode: state.mode });
  }

  function buildSquares() {
    // group by 4 for readability
    if (state.guesses.length === 0) return "(no guesses yet)";
    const squares = state.guesses.map((g) => (g.correct ? "\uD83D\uDFE9" : "\u2B1B")); // green / black
    const lines = [];
    for (let i = 0; i < squares.length; i += 4) lines.push(squares.slice(i, i + 4).join(""));
    return lines.join("\n");
  }

  function finishGame({ solved, revealed }) {
    state.done = true;
    updateActionButtons();

    // update streak if daily + solved (and not revealed)
    let streakText = el.streakCount.textContent || "0";
    if (state.mode === "daily" && solved && !revealed) {
      streakText = String(bumpStreakIfNeeded());
      track("daily_solved", { mistakes_left: state.mistakesLeft });
    }

    // dialog copy
    const title = solved && !revealed ? "Clean solve." : solved ? "Solved." : revealed ? "Revealed." : "Done.";
    const kicker = state.mode === "daily" ? `Daily #${state.dailyNumber}` : "Practice";
    const header = `Bright Links\n${kicker} ${state.solved.filter(Boolean).length}/${TOTAL_GROUPS}\nMistakes: ${MAX_MISTAKES - state.mistakesLeft}/${MAX_MISTAKES}\nStreak: ${streakText}`;
    const share = `${header}\n\n${buildSquares()}\n${canonicalUrl}`;

    el.resultKicker.textContent = kicker;
    el.resultTitle.textContent = title;
    el.resultCopy.textContent = share;

    // answers
    el.answerList.innerHTML = "";
    for (const g of state.groups) {
      const row = document.createElement("div");
      row.className = "answer-row";
      const h = document.createElement("strong");
      h.textContent = g.title;
      const p = document.createElement("span");
      p.textContent = g.words.join(" \u00b7 ");
      row.appendChild(h);
      row.appendChild(p);
      el.answerList.appendChild(row);
    }

    setMessage("Result ready. Copy and share it.", "good");
    try {
      el.resultDialog.showModal();
    } catch {
      // If dialog isn't supported, no-op.
    }
  }

  function shuffleBoard() {
    if (state.done) return;
    const rnd = mulberry32(hashStringToSeed(`shuffle:${Date.now()}:${Math.random()}`));
    const unsolved = state.tiles.filter((t) => !t.solved);
    const solvedTiles = state.tiles.filter((t) => t.solved);
    shuffleInPlace(unsolved, rnd);
    // Keep solved tiles out of board anyway; but preserve full list
    state.tiles = unsolved.concat(solvedTiles);
    renderBoard();
    clickSound(0.6);
    setMessage("Shuffled.");
    track("shuffle", { mode: state.mode });
  }

  function submitSelection() {
    if (state.done) return;
    const words = selectedWords();
    if (words.length !== GROUP_SIZE) return;
    const match = findMatchingGroup(words);
    if (match >= 0) {
      solveGroup(match);
    } else {
      wrongGuess();
    }
  }

  // --- Signup (Kit) ---
  async function submitSignup(email) {
    const clean = String(email || "").trim();
    if (!clean || clean.length < 5) {
      el.signupMessage.textContent = "Please enter a valid email.";
      return;
    }

    el.signupMessage.textContent = "Joining...";
    track("signup_submit", { mode: state.mode });

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, tags: ["bright-links"] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        el.signupMessage.textContent = "Could not join right now. Try again later.";
        return;
      }
      el.signupMessage.textContent = "You're on the list. Check your inbox to confirm.";
      el.emailInput.value = "";
      clickSound(0.8);
      track("signup_ok");
    } catch {
      el.signupMessage.textContent = "Network error. Try again later.";
    }
  }

  // --- Init ---
  function startDaily() {
    state.mode = "daily";
    state.dateISO = toLocalISODate();
    state.dailyNumber = computeDailyNumber(state.dateISO);
    el.puzzleLabel.textContent = `Daily #${state.dailyNumber}`;
    el.dateLabel.textContent = state.dateISO;

    const { groups, tiles } = pickDailyPuzzle(state.dateISO);
    state.groups = groups;
    state.solved = new Array(TOTAL_GROUPS).fill(false);
    state.tiles = tiles.map((t, idx) => ({
      id: `t${idx + 1}`,
      word: t.word,
      solved: false,
      selected: false,
    }));
    state.mistakesLeft = MAX_MISTAKES;
    state.guesses = [];
    state.revealed = false;
    state.done = false;

    loadStreak();
    renderCounters();
    renderSolvedList();
    renderBoard();
    setMessage("Daily puzzle loaded. Select four words that belong together.");
    track("puzzle_loaded", { mode: "daily", daily: state.dailyNumber });
  }

  function startPractice() {
    state.mode = "practice";
    el.puzzleLabel.textContent = "Practice";
    el.dateLabel.textContent = "Free play";

    const { groups, tiles } = pickPracticePuzzle();
    state.groups = groups;
    state.solved = new Array(TOTAL_GROUPS).fill(false);
    state.tiles = tiles.map((t, idx) => ({
      id: `p${idx + 1}`,
      word: t.word,
      solved: false,
      selected: false,
    }));
    state.mistakesLeft = MAX_MISTAKES;
    state.guesses = [];
    state.revealed = false;
    state.done = false;

    renderCounters();
    renderSolvedList();
    renderBoard();
    setMessage("Practice puzzle loaded. No streak impact.");
    clickSound(0.6);
    track("puzzle_loaded", { mode: "practice" });
  }

  // Events
  el.board.addEventListener("click", (e) => {
    const btn = e.target.closest("button.tile");
    if (!btn) return;
    const id = btn.dataset.id;
    const tile = state.tiles.find((t) => t.id === id);
    if (!tile || tile.solved || state.done) return;
    tile.selected = !tile.selected;
    clickSound(tile.selected ? 0.7 : 0.5);
    renderBoard();
    const count = selectedWords().length;
    setMessage(count === 0 ? "Select four words that belong together." : `${count} selected.`);
    track("tile_click", { mode: state.mode });
  });

  el.submitButton.addEventListener("click", () => submitSelection());
  el.clearButton.addEventListener("click", () => {
    clickSound(0.5);
    clearSelection();
    track("clear", { mode: state.mode });
  });
  el.revealButton.addEventListener("click", () => {
    clickSound(0.6);
    revealAnswers();
  });
  el.shuffleButton.addEventListener("click", () => shuffleBoard());
  el.newGameButton.addEventListener("click", () => startPractice());

  el.copyButton.addEventListener("click", async () => {
    const text = el.resultCopy.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Copied.", "good");
      clickSound(0.7);
      track("result_copied", { mode: state.mode });
    } catch {
      setMessage("Copy failed. Select text and copy manually.", "bad");
    }
  });

  el.closeDialogButton.addEventListener("click", () => {
    try {
      el.resultDialog.close();
    } catch {
      // ignore
    }
  });

  el.signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitSignup(el.emailInput.value);
  });

  // Start
  startDaily();
})();

