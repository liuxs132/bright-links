const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const modeRail = document.querySelector("#modeRail");
const modeName = document.querySelector("#modeName");
const phaseName = document.querySelector("#phaseName");
const phaseFill = document.querySelector("#phaseFill");
const scoreValue = document.querySelector("#scoreValue");
const scoreFill = document.querySelector("#scoreFill");
const comboValue = document.querySelector("#comboValue");
const hintText = document.querySelector("#hintText");
const burstLabel = document.querySelector("#burstLabel");
const nextButton = document.querySelector("#nextButton");
const prevButton = document.querySelector("#prevButton");
const resetButton = document.querySelector("#resetButton");
const soundButton = document.querySelector("#soundButton");

const t = {
  bubble: "\u634f\u6ce1\u6ce1\u7eb8",
  film: "\u6495\u4fdd\u62a4\u819c",
  toothpaste: "\u6324\u7259\u818f",
  soap: "\u5207\u80a5\u7682",
  carpet: "\u6e05\u6d17\u5730\u6bef",
  blackhead: "\u6e05\u7406\u9ed1\u5934",
  clay: "\u522e\u6cb9\u6ce5",
  ice: "\u6380\u65ad\u51b0\u5757",
  enter: "\u8fdb\u5165",
  peak: "\u9ad8\u6f6e",
  loop: "\u5faa\u73af",
};

const MODES = [
  {
    id: "bubble",
    icon: "○",
    name: t.bubble,
    hint: "\u8fde\u7eed\u70b9\u51fb\u9f13\u8d77\u7684\u6ce1\u6ce1\uff0c\u6bcf\u4e00\u4e2a\u90fd\u8981\u5e72\u51c0\u5730\u556a\u6389\u3002",
    bg: ["#dff8ff", "#f8fbff"],
    accent: "#42bfd0",
    setup(state) {
      state.items = [];
      const cols = 5;
      const rows = 8;
      const gapX = state.w / (cols + 1);
      const gapY = state.h / (rows + 1.3);
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          state.items.push({
            x: gapX * (x + 1) + (y % 2) * 7,
            y: gapY * (y + 0.85),
            r: Math.min(28, gapX * 0.26),
            done: false,
            squish: 0,
          });
        }
      }
    },
    draw(state) {
      drawTray(state, "#bcecf4");
      state.items.forEach((b) => {
        const lift = b.done ? 0 : 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * (1 + b.squish * 0.18), 0, Math.PI * 2);
        ctx.fillStyle = b.done ? "rgba(88,130,142,.16)" : "rgba(255,255,255,.75)";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = b.done ? "rgba(88,130,142,.18)" : "#78d4e2";
        ctx.stroke();
        if (lift) {
          ctx.beginPath();
          ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.28, b.r * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,.85)";
          ctx.fill();
        }
      });
    },
    hit(state, p) {
      const bubble = state.items.find((b) => !b.done && distance(p, b) < b.r * 1.15);
      if (!bubble) return;
      bubble.done = true;
      bubble.squish = 1;
      burst(state, bubble.x, bubble.y, 13, "#42bfd0");
      reward(state, 1, "pop");
    },
  },
  {
    id: "film",
    icon: "◩",
    name: t.film,
    hint: "\u6309\u4f4f\u53f3\u4e0a\u89d2\u7684\u819c\u8fb9\uff0c\u5411\u5de6\u4e0b\u7f13\u6162\u6495\u5f00\u3002",
    bg: ["#eaf4ff", "#fffaf0"],
    accent: "#8a8df0",
    setup(state) {
      state.peel = 0.08;
    },
    draw(state) {
      roundRect(42, 58, state.w - 84, state.h - 148, 32, "#222a35");
      roundRect(58, 78, state.w - 116, state.h - 188, 24, "#f8fafc");
      drawConfettiPattern(70, 92, state.w - 140, state.h - 216);
      const x = state.w - 58 - state.peel * (state.w - 150);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(state.w - 58, 78);
      ctx.lineTo(x, 78);
      ctx.quadraticCurveTo(x - 32, 150 + state.peel * 180, state.w - 66, state.h - 110);
      ctx.closePath();
      ctx.fillStyle = "rgba(210,235,255,.72)";
      ctx.fill();
      ctx.strokeStyle = "rgba(95,122,165,.42)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      drawFold(x, 78 + state.peel * 56, state.accent);
    },
    drag(state, p, last) {
      const dx = Math.max(0, last.x - p.x);
      const dy = Math.max(0, p.y - last.y);
      if (p.x > state.w * 0.2) {
        state.peel = clamp(state.peel + (dx + dy * 0.55) / 520, 0, 1);
        reward(state, (dx + dy) / 32, "peel");
      }
    },
  },
  {
    id: "toothpaste",
    icon: "▰",
    name: t.toothpaste,
    hint: "\u4ece\u5c3e\u90e8\u5411\u524d\u63a8\uff0c\u628a\u7259\u818f\u6324\u6210\u4e00\u6761\u9971\u6ee1\u7684\u6ce2\u7eb9\u3002",
    bg: ["#eef9f5", "#f9f5e9"],
    accent: "#5acb86",
    setup(state) {
      state.squeeze = 0;
      state.paste = [];
    },
    draw(state) {
      const y = state.h * 0.55;
      roundRect(72, y - 44, state.w - 170, 88, 28, "#6bd3d1");
      roundRect(state.w - 108, y - 28, 52, 56, 12, "#f1f3f4");
      ctx.fillStyle = "#1c6570";
      ctx.font = "800 22px sans-serif";
      ctx.fillText("FRESH", 104, y + 8);
      const fold = 72 + state.squeeze * (state.w - 220);
      roundRect(72, y - 44, Math.max(12, fold - 72), 88, 28, "rgba(32,42,48,.22)");
      state.paste.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(state.w - 42 + i * 13, y + Math.sin(i * 0.8) * 12, p, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#cfe9ee";
        ctx.stroke();
      });
    },
    drag(state, p, last) {
      const dx = Math.max(0, p.x - last.x);
      if (p.y > state.h * 0.42 && p.y < state.h * 0.7) {
        state.squeeze = clamp(state.squeeze + dx / 420, 0, 1);
        if (dx > 1 && state.paste.length < 16) state.paste.push(8 + state.squeeze * 9);
        reward(state, dx / 18, "squeeze");
      }
    },
  },
  {
    id: "soap",
    icon: "▥",
    name: t.soap,
    hint: "\u6a2a\u5411\u5212\u8fc7\u80a5\u7682\u8868\u9762\uff0c\u524a\u51fa\u4e00\u7247\u7247\u8584\u5377\u3002",
    bg: ["#fff2e7", "#f7fff6"],
    accent: "#ff9b65",
    setup(state) {
      state.cuts = [];
      state.shavings = [];
    },
    draw(state) {
      const x = 72;
      const y = 130;
      const w = state.w - 144;
      const h = state.h - 275;
      roundRect(x, y, w, h, 34, "#ffb78b");
      state.cuts.forEach((c) => {
        ctx.strokeStyle = "rgba(134,70,42,.32)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 24, c);
        ctx.lineTo(x + w - 24, c + Math.sin(c) * 5);
        ctx.stroke();
      });
      state.shavings.forEach(drawShaving);
    },
    drag(state, p, last) {
      const speed = Math.abs(p.x - last.x);
      if (speed > 5 && p.x > 70 && p.x < state.w - 70 && p.y > 120 && p.y < state.h - 145) {
        state.cuts.push(p.y);
        state.shavings.push({ x: p.x, y: p.y, vx: rand(-1.4, 1.4), vy: rand(1, 3), r: rand(8, 16), life: 1 });
        reward(state, speed / 22, "slice");
      }
    },
  },
  {
    id: "carpet",
    icon: "▤",
    name: t.carpet,
    hint: "\u62d6\u52a8\u6e05\u6d17\u5934\uff0c\u770b\u6c61\u6e0d\u88ab\u4e00\u9053\u9053\u5438\u8d70\u3002",
    bg: ["#efe7d8", "#e9f6ff"],
    accent: "#48b4ff",
    setup(state) {
      state.clean = [];
      for (let i = 0; i < 70; i += 1) {
        state.clean.push({ x: rand(35, state.w - 35), y: rand(70, state.h - 125), r: rand(18, 42), a: rand(0.28, 0.58) });
      }
    },
    draw(state) {
      drawCarpet(state);
      state.clean.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,54,37,${d.a})`;
        ctx.fill();
      });
      if (state.pointer) drawCleaner(state.pointer.x, state.pointer.y);
    },
    drag(state, p, last) {
      state.clean.forEach((d) => {
        if (distance(p, d) < d.r + 34) d.a = Math.max(0, d.a - 0.08);
      });
      reward(state, distance(p, last) / 26, "wash");
    },
  },
  {
    id: "blackhead",
    icon: "•",
    name: t.blackhead,
    hint: "\u70b9\u6309\u9ed1\u70b9\uff0c\u5b83\u4f1a\u88ab\u5e72\u51c0\u5730\u63a8\u51fa\u6765\u3002",
    bg: ["#ffe0d2", "#fff3e8"],
    accent: "#d45b46",
    setup(state) {
      state.items = [];
      for (let i = 0; i < 34; i += 1) {
        state.items.push({ x: rand(55, state.w - 55), y: rand(78, state.h - 150), r: rand(6, 11), done: false, out: 0 });
      }
    },
    draw(state) {
      roundRect(34, 48, state.w - 68, state.h - 118, 34, "#ffc7b8");
      drawSkinDots(state);
      state.items.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + b.out * 7, 0, Math.PI * 2);
        ctx.fillStyle = b.done ? "#fff0d5" : "#2d2420";
        ctx.fill();
      });
    },
    hit(state, p) {
      const item = state.items.find((b) => !b.done && distance(p, b) < 28);
      if (!item) return;
      item.done = true;
      item.out = 1;
      burst(state, item.x, item.y, 10, "#fff0d5");
      reward(state, 1.15, "pop");
    },
  },
  {
    id: "clay",
    icon: "▨",
    name: t.clay,
    hint: "\u7528\u624b\u6307\u5411\u4e0b\u522e\uff0c\u628a\u9ed1\u4eae\u6cb9\u6ce5\u522e\u6210\u6574\u9f50\u7684\u6761\u3002",
    bg: ["#e8edf2", "#fff8e8"],
    accent: "#6f7b86",
    setup(state) {
      state.strips = [];
      for (let i = 0; i < 12; i += 1) state.strips.push({ x: 58 + i * ((state.w - 116) / 11), len: 0 });
    },
    draw(state) {
      roundRect(42, 66, state.w - 84, state.h - 142, 28, "#cdd4db");
      state.strips.forEach((s) => {
        ctx.fillStyle = "#343942";
        roundRect(s.x - 10, 86, 20, state.h - 184 - s.len, 10, "#343942");
        if (s.len > 0) roundRect(s.x - 13, state.h - 100 - s.len, 26, s.len, 12, "#15181d");
      });
    },
    drag(state, p, last) {
      const strip = state.strips.reduce((best, s) => (Math.abs(s.x - p.x) < Math.abs(best.x - p.x) ? s : best));
      const dy = Math.max(0, p.y - last.y);
      if (dy > 0 && Math.abs(strip.x - p.x) < 24) {
        strip.len = clamp(strip.len + dy, 0, state.h - 195);
        reward(state, dy / 22, "scrape");
      }
    },
  },
  {
    id: "ice",
    icon: "◇",
    name: t.ice,
    hint: "\u8fde\u70b9\u88c2\u7eb9\uff0c\u628a\u51b0\u5757\u538b\u5230\u5b8c\u5168\u788e\u5f00\u3002",
    bg: ["#e4fbff", "#f6fdff"],
    accent: "#65c7ff",
    setup(state) {
      state.cracks = [];
      state.damage = 0;
    },
    draw(state) {
      drawIceBlock(state);
      state.cracks.forEach((c) => {
        ctx.strokeStyle = "rgba(30,117,166,.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        for (let i = 0; i < 5; i += 1) ctx.lineTo(c.x + rand(-42, 42), c.y + rand(-42, 42));
        ctx.stroke();
      });
    },
    hit(state, p) {
      if (p.x < 48 || p.x > state.w - 48 || p.y < 90 || p.y > state.h - 150) return;
      state.cracks.push({ x: p.x, y: p.y });
      state.damage = clamp(state.damage + 0.08, 0, 1);
      burst(state, p.x, p.y, 12, "#65c7ff");
      reward(state, 1, "crack");
    },
  },
];

const state = {
  modeIndex: 0,
  w: 720,
  h: 1120,
  score: 0,
  combo: 1,
  particles: [],
  lastTime: performance.now(),
  startedAt: performance.now(),
  pointer: null,
  muted: false,
  audio: null,
};

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.w = rect.width;
  state.h = rect.height;
  resetMode(false);
}

function resetMode(resetClock = true) {
  state.score = 0;
  state.combo = 1;
  state.particles = [];
  state.pointer = null;
  if (resetClock) state.startedAt = performance.now();
  currentMode().setup(state);
  updateHud();
}

function currentMode() {
  return MODES[state.modeIndex];
}

function setMode(index) {
  state.modeIndex = (index + MODES.length) % MODES.length;
  state.accent = currentMode().accent;
  modeName.textContent = currentMode().name;
  hintText.textContent = currentMode().hint;
  resetMode();
  renderRail();
}

function renderRail() {
  modeRail.innerHTML = MODES.map(
    (mode, index) => `
      <button class="mode-chip ${index === state.modeIndex ? "active" : ""}" type="button" data-index="${index}">
        <b>${mode.icon}</b>
        <span>${mode.name}</span>
      </button>
    `
  ).join("");
}

function updateHud() {
  const pct = Math.round(state.score * 100);
  scoreValue.textContent = `${pct}%`;
  scoreFill.style.width = `${pct}%`;
  comboValue.textContent = `x${state.combo}`;
}

function updatePhase(now) {
  const elapsed = ((now - state.startedAt) / 1000) % 120;
  let label = t.loop;
  let pct = elapsed / 120;
  if (elapsed < 10) {
    label = t.enter;
    pct = elapsed / 10 / 3;
  } else if (elapsed < 40) {
    label = t.peak;
    pct = 0.333 + ((elapsed - 10) / 30) * 0.333;
  } else {
    label = t.loop;
    pct = 0.666 + ((elapsed - 40) / 80) * 0.334;
  }
  phaseName.textContent = label;
  phaseFill.style.width = `${pct * 100}%`;
}

function reward(s, amount, soundName) {
  const before = s.score;
  s.score = clamp(s.score + amount * 0.025, 0, 1);
  if (s.score > before) {
    s.combo = clamp(s.combo + 1, 1, 99);
    showBurst(`+${Math.max(1, Math.round(amount * 3))}`);
    play(soundName);
  }
  if (s.score >= 1) {
    setTimeout(() => setMode(s.modeIndex + 1), 450);
  }
  updateHud();
}

function showBurst(text) {
  burstLabel.textContent = text;
  burstLabel.classList.remove("show");
  void burstLabel.offsetWidth;
  burstLabel.classList.add("show");
}

function pointerPos(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function onPointerDown(event) {
  canvas.setPointerCapture(event.pointerId);
  const p = pointerPos(event);
  state.pointer = p;
  currentMode().hit?.(state, p);
}

function onPointerMove(event) {
  if (!state.pointer) return;
  const p = pointerPos(event);
  currentMode().drag?.(state, p, state.pointer);
  state.pointer = p;
}

function onPointerUp() {
  state.pointer = null;
  state.combo = 1;
  updateHud();
}

function draw(now = performance.now()) {
  const dt = Math.min(32, now - state.lastTime) / 16.67;
  state.lastTime = now;
  updatePhase(now);
  const mode = currentMode();
  const gradient = ctx.createLinearGradient(0, 0, 0, state.h);
  gradient.addColorStop(0, mode.bg[0]);
  gradient.addColorStop(1, mode.bg[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.w, state.h);
  mode.draw(state);
  updateParticles(dt);
  requestAnimationFrame(draw);
}

function updateParticles(dt) {
  state.particles = state.particles.filter((p) => p.life > 0);
  state.particles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.09 * dt;
    p.life -= 0.025 * dt;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  if (state.shavings) {
    state.shavings = state.shavings.filter((s) => s.life > 0);
    state.shavings.forEach((s) => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 0.05 * dt;
      s.life -= 0.012 * dt;
    });
  }
}

function burst(s, x, y, count, color) {
  for (let i = 0; i < count; i += 1) {
    const a = rand(0, Math.PI * 2);
    const speed = rand(1.2, 4.8);
    s.particles.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r: rand(2.5, 6),
      life: rand(0.55, 1),
      color,
    });
  }
}

function play(type) {
  if (state.muted) return;
  state.audio ||= new (window.AudioContext || window.webkitAudioContext)();
  const audio = state.audio;
  const now = audio.currentTime;
  const freq = { pop: 420, peel: 260, squeeze: 180, slice: 520, wash: 150, scrape: 210, crack: 680 }[type] || 320;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type === "wash" ? "sine" : "triangle";
  osc.frequency.setValueAtTime(freq + rand(-30, 30), now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(70, freq * 0.55), now + 0.08);
  gain.gain.setValueAtTime(0.045, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

function drawTray(s, color) {
  roundRect(28, 38, s.w - 56, s.h - 98, 32, color);
  ctx.strokeStyle = "rgba(35,83,96,.16)";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawConfettiPattern(x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  roundPath(x, y, w, h, 24);
  ctx.clip();
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(x, y, w, h);
  for (let i = 0; i < 80; i += 1) {
    ctx.fillStyle = ["#ff6b5f", "#4dd6cb", "#f5c94a", "#9690ff"][i % 4];
    ctx.fillRect(x + rand(0, w), y + rand(0, h), rand(8, 20), 4);
  }
  ctx.restore();
}

function drawFold(x, y, color) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 34, y + 24, x + 58, y - 8);
  ctx.lineTo(x + 14, y - 16);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawShaving(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.vx);
  ctx.strokeStyle = "#ffd0b8";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, s.r, 0.2, Math.PI * 1.5);
  ctx.stroke();
  ctx.restore();
}

function drawCarpet(s) {
  ctx.fillStyle = "#caa57f";
  ctx.fillRect(0, 0, s.w, s.h);
  for (let y = 0; y < s.h; y += 16) {
    ctx.strokeStyle = y % 32 === 0 ? "rgba(255,255,255,.16)" : "rgba(70,45,28,.08)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s.w, y + Math.sin(y) * 5);
    ctx.stroke();
  }
}

function drawCleaner(x, y) {
  roundRect(x - 42, y - 24, 84, 48, 16, "rgba(245,250,255,.9)");
  roundRect(x - 32, y + 17, 64, 10, 5, "#48b4ff");
}

function drawSkinDots(s) {
  ctx.fillStyle = "rgba(146,72,52,.18)";
  for (let i = 0; i < 90; i += 1) {
    ctx.beginPath();
    ctx.arc((i * 47) % s.w, 58 + ((i * 89) % (s.h - 150)), 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIceBlock(s) {
  ctx.save();
  ctx.translate(s.w / 2, s.h / 2 - 15);
  ctx.rotate(-0.08);
  roundRect(-s.w * 0.36, -s.h * 0.28, s.w * 0.72, s.h * 0.56, 34, "rgba(203,242,255,.86)");
  ctx.strokeStyle = "rgba(101,199,255,.8)";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();
}

function roundRect(x, y, w, h, r, fill) {
  ctx.beginPath();
  roundPath(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundPath(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

modeRail.addEventListener("click", (event) => {
  const button = event.target.closest(".mode-chip");
  if (!button) return;
  setMode(Number(button.dataset.index));
});

nextButton.addEventListener("click", () => setMode(state.modeIndex + 1));
prevButton.addEventListener("click", () => setMode(state.modeIndex - 1));
resetButton.addEventListener("click", () => resetMode());
soundButton.addEventListener("click", () => {
  state.muted = !state.muted;
  soundButton.textContent = state.muted ? "\u00d7" : "\u266a";
});

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", onPointerUp);
window.addEventListener("resize", resizeCanvas);

renderRail();
setMode(0);
resizeCanvas();
requestAnimationFrame(draw);
