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

const TXT = {
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

const HINT = {
  bubble: "\u6309\u538b\u9f13\u8d77\u7684\u6ce1\u6ce1\uff0c\u5b83\u4f1a\u5148\u51f9\u9677\uff0c\u518d\u556a\u5730\u7834\u6389\u3002",
  film: "\u634f\u4f4f\u819c\u8fb9\u62d6\u62fd\uff0c\u901f\u5ea6\u8d8a\u7a33\uff0c\u5377\u66f2\u8d8a\u81ea\u7136\u3002",
  toothpaste: "\u4ece\u5c3e\u90e8\u5411\u524d\u63a8\uff0c\u7259\u818f\u4f1a\u6309\u538b\u529b\u6324\u51fa\u5e76\u5806\u53e0\u3002",
  soap: "\u6a2a\u5411\u5feb\u901f\u522e\u8fc7\u80a5\u7682\uff0c\u8584\u7247\u4f1a\u5377\u8d77\u5e76\u843d\u4e0b\u3002",
  carpet: "\u62d6\u52a8\u5438\u5934\u53cd\u590d\u6e05\u6d17\uff0c\u6c61\u6e0d\u4f1a\u88ab\u5438\u8d70\u7559\u4e0b\u6e7f\u75d5\u3002",
  blackhead: "\u957f\u6309\u9ed1\u5934\uff0c\u76ae\u80a4\u4f1a\u51f9\u9677\uff0c\u6cb9\u8102\u518d\u88ab\u63a8\u51fa\u3002",
  clay: "\u5411\u4e0b\u6162\u522e\u6cb9\u6ce5\uff0c\u9ed1\u4eae\u6750\u6599\u4f1a\u88ab\u5806\u6210\u539a\u6761\u3002",
  ice: "\u6309\u4f4f\u88c2\u7eb9\u8fde\u7eed\u65bd\u538b\uff0c\u51b0\u5757\u4f1a\u4ece\u5185\u90e8\u788e\u5f00\u3002",
};

const MODES = [
  {
    id: "bubble",
    icon: "o",
    name: TXT.bubble,
    bg: ["#d7edf0", "#f6fbfb"],
    accent: "#45bcc8",
    setup(s) {
      s.bubbles = [];
      const cols = 5;
      const rows = 8;
      const gapX = s.w / (cols + 1);
      const gapY = (s.h - 92) / (rows + 0.7);
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          s.bubbles.push({
            x: gapX * (x + 1) + (y % 2) * 6,
            y: 46 + gapY * (y + 0.55),
            r: Math.min(31, gapX * 0.28),
            press: 0,
            vel: 0,
            popped: false,
            wobble: rand(0, 9),
          });
        }
      }
    },
    update(s, dt) {
      s.bubbles.forEach((b) => {
        b.vel += (0 - b.press) * 0.16 * dt;
        b.vel *= 0.7;
        b.press += b.vel * dt;
        b.press = clamp(b.press, 0, 1.25);
      });
    },
    draw(s) {
      drawMaterialBack(s, "#d8edf0", "#b8d7dc", 32);
      s.bubbles.forEach((b) => drawBubble(b));
    },
    hit(s, p) {
      const b = s.bubbles.find((item) => !item.popped && distance(p, item) < item.r * 1.22);
      if (!b) return;
      b.press += 0.55;
      if (b.press > 0.72) {
        b.popped = true;
        b.press = 1;
        burst(s, b.x, b.y, 18, "#dffaff", 1.3);
        shockwave(s, b.x, b.y, b.r);
        feedback(16);
        reward(s, 1.2, "pop");
      } else {
        feedback(5);
        play("soft");
      }
    },
    drag(s, p) {
      this.hit(s, p);
    },
  },
  {
    id: "film",
    icon: "/",
    name: TXT.film,
    bg: ["#dde7ef", "#fbf4e8"],
    accent: "#a4b7ce",
    setup(s) {
      s.peel = 0.05;
      s.peelVel = 0;
      s.foldNoise = 0;
    },
    update(s, dt) {
      s.peelVel *= Math.pow(0.9, dt);
      s.peel = clamp(s.peel + s.peelVel * dt, 0.03, 1);
      s.foldNoise += 0.04 * dt;
    },
    draw(s) {
      drawPhonePlate(s);
      drawPhotoUnderlay(s);
      drawFilmSheet(s);
    },
    drag(s, p, last) {
      const pull = Math.max(0, last.x - p.x) + Math.max(0, p.y - last.y) * 0.62;
      if (p.x > s.w * 0.12 && p.y > 40) {
        s.peelVel += pull / 2600;
        s.peel = clamp(s.peel + pull / 620, 0.03, 1);
        makeRubLine(s, p, "#e7f7ff", 0.5);
        feedback(Math.min(18, pull * 0.2));
        reward(s, pull / 34, "peel");
      }
    },
  },
  {
    id: "toothpaste",
    icon: ">",
    name: TXT.toothpaste,
    bg: ["#e5eee8", "#fbf7ed"],
    accent: "#50c085",
    setup(s) {
      s.squeeze = 0;
      s.tubeDent = 0;
      s.paste = [];
    },
    update(s, dt) {
      s.tubeDent *= Math.pow(0.88, dt);
      s.paste.forEach((p) => {
        p.vy += 0.08 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r *= 0.999;
      });
    },
    draw(s) {
      drawCountertop(s);
      drawToothpaste(s);
    },
    drag(s, p, last) {
      const dx = Math.max(0, p.x - last.x);
      const band = Math.abs(p.y - s.h * 0.58) < 95;
      if (band && dx > 0) {
        const pressure = clamp(dx / 20, 0, 1.8);
        s.squeeze = clamp(s.squeeze + dx / 470, 0, 1);
        s.tubeDent = Math.max(s.tubeDent, pressure);
        if (s.paste.length < 38) {
          s.paste.push({
            x: s.w - 64 + rand(-4, 4),
            y: s.h * 0.58 + rand(-8, 8),
            vx: rand(0.8, 2.2) + pressure,
            vy: rand(-1.1, 0.8),
            r: 9 + pressure * 7 + rand(0, 3),
          });
        }
        feedback(7 + pressure * 8);
        reward(s, dx / 18, "squeeze");
      }
    },
  },
  {
    id: "soap",
    icon: "=",
    name: TXT.soap,
    bg: ["#f3e2d6", "#f7f1e7"],
    accent: "#ff9d63",
    setup(s) {
      s.cuts = [];
      s.shavings = [];
    },
    update(s, dt) {
      s.shavings.forEach((item) => {
        item.vy += 0.12 * dt;
        item.x += item.vx * dt;
        item.y += item.vy * dt;
        item.rot += item.spin * dt;
        item.life -= 0.004 * dt;
      });
      s.shavings = s.shavings.filter((item) => item.life > 0 && item.y < s.h + 80);
    },
    draw(s) {
      drawWoodTable(s);
      drawSoapBlock(s);
      s.shavings.forEach(drawSoapCurl);
    },
    drag(s, p, last) {
      const speed = Math.abs(p.x - last.x);
      if (speed > 5 && p.x > 54 && p.x < s.w - 54 && p.y > 95 && p.y < s.h - 128) {
        s.cuts.push({ y: p.y, depth: clamp(speed / 28, 0.2, 1) });
        for (let i = 0; i < Math.ceil(speed / 18); i += 1) {
          s.shavings.push({
            x: p.x + rand(-18, 18),
            y: p.y + rand(-8, 8),
            vx: rand(-2.2, 2.2),
            vy: rand(-2.6, -0.2),
            rot: rand(-1, 1),
            spin: rand(-0.12, 0.12),
            len: rand(24, 54),
            life: 1,
          });
        }
        feedback(Math.min(22, speed * 0.28));
        reward(s, speed / 24, "slice");
      }
    },
  },
  {
    id: "carpet",
    icon: "#",
    name: TXT.carpet,
    bg: ["#d6b793", "#efe4d5"],
    accent: "#55b8ff",
    setup(s) {
      s.stains = [];
      s.wet = [];
      for (let i = 0; i < 95; i += 1) {
        s.stains.push({
          x: rand(20, s.w - 20),
          y: rand(40, s.h - 95),
          r: rand(12, 38),
          a: rand(0.18, 0.56),
        });
      }
    },
    update(s, dt) {
      s.wet.forEach((w) => {
        w.life -= 0.0025 * dt;
      });
      s.wet = s.wet.filter((w) => w.life > 0);
    },
    draw(s) {
      drawCarpetBase(s);
      s.wet.forEach(drawWetStroke);
      s.stains.forEach(drawStain);
      if (s.pointer) drawCleanerHead(s.pointer.x, s.pointer.y, s.pointer.vx || 0);
    },
    drag(s, p, last) {
      const speed = distance(p, last);
      s.stains.forEach((d) => {
        if (distance(p, d) < d.r + 40) d.a = Math.max(0, d.a - 0.018 * speed);
      });
      s.wet.push({ x: p.x, y: p.y, w: 58 + speed, a: clamp(speed / 26, 0.15, 0.7), life: 1 });
      feedback(Math.min(12, speed * 0.25));
      reward(s, speed / 27, "wash");
    },
  },
  {
    id: "blackhead",
    icon: ".",
    name: TXT.blackhead,
    bg: ["#f2bca9", "#ffe8dc"],
    accent: "#d25b45",
    setup(s) {
      s.blackheads = [];
      for (let i = 0; i < 38; i += 1) {
        s.blackheads.push({
          x: rand(50, s.w - 50),
          y: rand(68, s.h - 124),
          r: rand(5, 10),
          press: 0,
          out: 0,
          done: false,
        });
      }
    },
    update(s, dt) {
      s.blackheads.forEach((b) => {
        if (!b.done) b.press *= Math.pow(0.92, dt);
        b.out += ((b.done ? 1 : 0) - b.out) * 0.16 * dt;
      });
    },
    draw(s) {
      drawSkinPanel(s);
      s.blackheads.forEach(drawBlackhead);
      if (s.pointer) drawFingerPressure(s.pointer.x, s.pointer.y);
    },
    hit(s, p) {
      this.drag(s, p, p);
    },
    drag(s, p) {
      const b = s.blackheads.find((item) => !item.done && distance(p, item) < 30);
      if (!b) return;
      b.press += 0.16;
      feedback(5);
      if (b.press > 0.75) {
        b.done = true;
        burst(s, b.x, b.y, 12, "#fff2cf", 0.75);
        feedback(20);
        reward(s, 1.25, "pop");
      } else {
        play("soft");
      }
    },
  },
  {
    id: "clay",
    icon: "|",
    name: TXT.clay,
    bg: ["#d4d7d9", "#f6f0e2"],
    accent: "#5f6872",
    setup(s) {
      s.grooves = [];
      const count = 13;
      for (let i = 0; i < count; i += 1) {
        s.grooves.push({
          x: 48 + i * ((s.w - 96) / (count - 1)),
          len: 0,
          mass: 0,
          wobble: rand(0, 6),
        });
      }
    },
    update(s, dt) {
      s.grooves.forEach((g) => {
        g.mass *= Math.pow(0.996, dt);
      });
    },
    draw(s) {
      drawMetalTray(s);
      s.grooves.forEach(drawOilGroove);
    },
    drag(s, p, last) {
      const dy = Math.max(0, p.y - last.y);
      const g = nearest(s.grooves, p);
      if (dy > 0 && Math.abs(g.x - p.x) < 26 && p.y > 70 && p.y < s.h - 70) {
        g.len = clamp(g.len + dy * 0.95, 0, s.h - 170);
        g.mass = clamp(g.mass + dy * 0.08, 0, 1.4);
        feedback(Math.min(14, dy * 0.35));
        reward(s, dy / 21, "scrape");
      }
    },
  },
  {
    id: "ice",
    icon: "<>",
    name: TXT.ice,
    bg: ["#dff7fb", "#fbfdff"],
    accent: "#62bdf0",
    setup(s) {
      s.cracks = [];
      s.chunks = [];
      s.damage = 0;
    },
    update(s, dt) {
      s.chunks.forEach((c) => {
        c.vy += 0.09 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += c.spin * dt;
        c.life -= 0.004 * dt;
      });
      s.chunks = s.chunks.filter((c) => c.life > 0 && c.y < s.h + 90);
    },
    draw(s) {
      drawFreezerSurface(s);
      drawIceBlock(s);
      s.cracks.forEach(drawCrack);
      s.chunks.forEach(drawIceChunk);
    },
    hit(s, p) {
      if (p.x < 40 || p.x > s.w - 40 || p.y < 78 || p.y > s.h - 105) return;
      s.damage = clamp(s.damage + 0.075, 0, 1);
      s.cracks.push(makeCrack(p.x, p.y, 42 + s.damage * 70));
      if (s.damage > 0.62) {
        for (let i = 0; i < 5; i += 1) s.chunks.push(makeIceChunk(p.x, p.y));
      }
      burst(s, p.x, p.y, 13, "#e8fbff", 1.1);
      feedback(18 + s.damage * 15);
      reward(s, 1.12, "crack");
    },
    drag(s, p) {
      if (Math.random() > 0.55) this.hit(s, p);
    },
  },
];

const state = {
  modeIndex: 0,
  w: 720,
  h: 1120,
  score: 0,
  combo: 1,
  pointer: null,
  particles: [],
  ripples: [],
  rubs: [],
  lastTime: performance.now(),
  startedAt: performance.now(),
  muted: false,
  audio: null,
  accent: "#45bcc8",
};

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.w = rect.width;
  state.h = rect.height;
  resetMode(false);
}

function resetMode(resetClock = true) {
  state.score = 0;
  state.combo = 1;
  state.pointer = null;
  state.particles = [];
  state.ripples = [];
  state.rubs = [];
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
  hintText.textContent = HINT[currentMode().id];
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
  let label = TXT.loop;
  let pct = elapsed / 120;
  if (elapsed < 10) {
    label = TXT.enter;
    pct = elapsed / 10 / 3;
  } else if (elapsed < 40) {
    label = TXT.peak;
    pct = 0.333 + ((elapsed - 10) / 30) * 0.333;
  } else {
    label = TXT.loop;
    pct = 0.666 + ((elapsed - 40) / 80) * 0.334;
  }
  phaseName.textContent = label;
  phaseFill.style.width = `${pct * 100}%`;
}

function reward(s, amount, soundName) {
  const before = s.score;
  s.score = clamp(s.score + amount * 0.018, 0, 1);
  if (s.score > before) {
    s.combo = clamp(s.combo + 1, 1, 99);
    showBurst(`+${Math.max(1, Math.round(amount * 2))}`);
    play(soundName);
  }
  if (s.score >= 1) setTimeout(() => setMode(s.modeIndex + 1), 520);
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
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pressure: event.pressure || 0.6,
  };
}

function onPointerDown(event) {
  canvas.setPointerCapture(event.pointerId);
  const p = pointerPos(event);
  state.pointer = { ...p, vx: 0, vy: 0 };
  currentMode().hit?.(state, p);
}

function onPointerMove(event) {
  if (!state.pointer) return;
  const p = pointerPos(event);
  p.vx = p.x - state.pointer.x;
  p.vy = p.y - state.pointer.y;
  currentMode().drag?.(state, p, state.pointer);
  state.pointer = p;
}

function onPointerUp() {
  state.pointer = null;
  state.combo = 1;
  updateHud();
}

function draw(now = performance.now()) {
  const dt = Math.min(34, now - state.lastTime) / 16.67;
  state.lastTime = now;
  updatePhase(now);
  const mode = currentMode();
  drawBackground(mode);
  mode.update?.(state, dt);
  mode.draw(state);
  updateEffects(dt);
  requestAnimationFrame(draw);
}

function drawBackground(mode) {
  const gradient = ctx.createLinearGradient(0, 0, 0, state.h);
  gradient.addColorStop(0, mode.bg[0]);
  gradient.addColorStop(1, mode.bg[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.w, state.h);
  drawNoise(0.028);
  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.fillRect(0, 0, state.w, 2);
}

function updateEffects(dt) {
  state.rubs = state.rubs.filter((r) => r.life > 0);
  state.rubs.forEach((r) => {
    r.life -= 0.018 * dt;
    ctx.globalAlpha = Math.max(0, r.life) * r.a;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(r.x - r.vx, r.y - r.vy);
    ctx.lineTo(r.x, r.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  state.ripples = state.ripples.filter((r) => r.life > 0);
  state.ripples.forEach((r) => {
    r.life -= 0.03 * dt;
    r.radius += 3.2 * dt;
    ctx.globalAlpha = Math.max(0, r.life);
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  state.particles = state.particles.filter((p) => p.life > 0);
  state.particles.forEach((p) => {
    p.vy += 0.1 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += (p.spin || 0) * dt;
    p.life -= 0.022 * dt;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot || 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r * 1.5, p.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawBubble(b) {
  const sx = 1 + b.press * 0.22;
  const sy = 1 - b.press * 0.44;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.scale(sx, sy);
  ctx.shadowColor = "rgba(34,91,104,.22)";
  ctx.shadowBlur = b.popped ? 0 : 16;
  ctx.shadowOffsetY = b.popped ? 0 : 9;
  const g = ctx.createRadialGradient(-b.r * 0.32, -b.r * 0.36, b.r * 0.08, 0, 0, b.r);
  if (b.popped) {
    g.addColorStop(0, "rgba(255,255,255,.3)");
    g.addColorStop(1, "rgba(78,126,139,.18)");
  } else {
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.52, "#dffbff");
    g.addColorStop(1, "#78d3de");
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = b.popped ? "rgba(52,97,108,.16)" : "rgba(44,158,174,.58)";
  ctx.stroke();
  if (b.popped) {
    ctx.strokeStyle = "rgba(35,85,96,.22)";
    ctx.beginPath();
    ctx.moveTo(-b.r * 0.55, -b.r * 0.05);
    ctx.quadraticCurveTo(0, b.r * 0.25, b.r * 0.56, -b.r * 0.05);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMaterialBack(s, fill, stroke, r) {
  ctx.save();
  ctx.shadowColor = "rgba(36,74,82,.22)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 14;
  roundRect(24, 30, s.w - 48, s.h - 76, r, fill);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let y = 44; y < s.h - 58; y += 30) {
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.beginPath();
    ctx.moveTo(34, y);
    ctx.lineTo(s.w - 34, y + Math.sin(y) * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhonePlate(s) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 18;
  roundRect(40, 48, s.w - 80, s.h - 116, 34, "#1f2630");
  ctx.shadowBlur = 0;
  roundRect(58, 72, s.w - 116, s.h - 164, 25, "#f8fafc");
  ctx.restore();
}

function drawPhotoUnderlay(s) {
  ctx.save();
  roundClip(68, 84, s.w - 136, s.h - 188, 24);
  const g = ctx.createLinearGradient(68, 84, s.w - 68, s.h - 104);
  g.addColorStop(0, "#f8cf72");
  g.addColorStop(0.42, "#75c6b7");
  g.addColorStop(1, "#805caa");
  ctx.fillStyle = g;
  ctx.fillRect(68, 84, s.w - 136, s.h - 188);
  for (let i = 0; i < 70; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${rand(0.09, 0.28)})`;
    ctx.fillRect(rand(68, s.w - 68), rand(84, s.h - 104), rand(8, 32), 3);
  }
  ctx.restore();
}

function drawFilmSheet(s) {
  const right = s.w - 60;
  const top = 72;
  const bottom = s.h - 104;
  const peeledX = right - s.peel * (s.w - 136);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(right, top);
  ctx.lineTo(peeledX, top + Math.sin(s.foldNoise) * 8);
  ctx.bezierCurveTo(peeledX - 34, 160, right - 118, bottom - 70, right, bottom);
  ctx.closePath();
  const g = ctx.createLinearGradient(peeledX, top, right, bottom);
  g.addColorStop(0, "rgba(255,255,255,.82)");
  g.addColorStop(0.56, "rgba(183,220,238,.6)");
  g.addColorStop(1, "rgba(255,255,255,.3)");
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(0,0,0,.18)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = -8;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(80,113,135,.38)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  drawFold(peeledX, top + 18 + s.peel * 42, "#f0fbff");
}

function drawCountertop(s) {
  ctx.fillStyle = "#e8dfcd";
  ctx.fillRect(0, 0, s.w, s.h);
  for (let y = 0; y < s.h; y += 34) {
    ctx.strokeStyle = "rgba(91,73,54,.07)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s.w, y + Math.sin(y) * 4);
    ctx.stroke();
  }
}

function drawToothpaste(s) {
  const y = s.h * 0.58;
  const x = 54;
  const w = s.w - 144;
  const dent = s.tubeDent * 14;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.22)";
  ctx.shadowBlur = 19;
  ctx.shadowOffsetY = 13;
  ctx.beginPath();
  ctx.moveTo(x, y - 48);
  ctx.quadraticCurveTo(x + w * 0.5, y - 62 + dent, x + w, y - 38);
  ctx.lineTo(x + w, y + 38);
  ctx.quadraticCurveTo(x + w * 0.46, y + 62 - dent, x, y + 48);
  ctx.closePath();
  const tube = ctx.createLinearGradient(x, y - 54, x, y + 54);
  tube.addColorStop(0, "#8fe5df");
  tube.addColorStop(0.48, "#3fbab8");
  tube.addColorStop(1, "#1f7c88");
  ctx.fillStyle = tube;
  ctx.fill();
  ctx.shadowBlur = 0;
  roundRect(s.w - 94, y - 31, 46, 62, 9, "#eef3f3");
  roundRect(s.w - 52, y - 22, 19, 44, 6, "#ffffff");
  ctx.fillStyle = "rgba(8,62,72,.72)";
  ctx.font = "900 21px sans-serif";
  ctx.fillText("FRESH", x + 38, y + 7);
  const fold = x + s.squeeze * (w - 14);
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.fillRect(x, y - 46, Math.max(8, fold - x), 92);
  s.paste.forEach((p) => {
    const g = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.45, 2, p.x, p.y, p.r * 1.5);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, "#dceff2");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.r * 1.5, p.r, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawWoodTable(s) {
  const g = ctx.createLinearGradient(0, 0, 0, s.h);
  g.addColorStop(0, "#d6a673");
  g.addColorStop(1, "#a66f45");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s.w, s.h);
  for (let y = 24; y < s.h; y += 38) {
    ctx.strokeStyle = "rgba(88,48,25,.16)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(s.w * 0.28, y - 10, s.w * 0.62, y + 12, s.w, y);
    ctx.stroke();
  }
}

function drawSoapBlock(s) {
  const x = 54;
  const y = 88;
  const w = s.w - 108;
  const h = s.h - 194;
  ctx.save();
  ctx.shadowColor = "rgba(86,43,25,.34)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 18;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, "#ffd5bd");
  g.addColorStop(0.55, "#ffad7d");
  g.addColorStop(1, "#de724d");
  roundRect(x, y, w, h, 42, g);
  ctx.shadowBlur = 0;
  s.cuts.forEach((c) => {
    ctx.strokeStyle = `rgba(114,52,30,${0.16 + c.depth * 0.18})`;
    ctx.lineWidth = 2 + c.depth * 5;
    ctx.beginPath();
    ctx.moveTo(x + 24, c.y);
    ctx.bezierCurveTo(x + w * 0.35, c.y - 7, x + w * 0.7, c.y + 7, x + w - 22, c.y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawSoapCurl(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.rot);
  ctx.strokeStyle = `rgba(255,222,202,${item.life})`;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, item.len * 0.32, 0.1, Math.PI * 1.72);
  ctx.stroke();
  ctx.restore();
}

function drawCarpetBase(s) {
  ctx.fillStyle = "#b99067";
  ctx.fillRect(0, 0, s.w, s.h);
  for (let x = 0; x < s.w; x += 7) {
    ctx.strokeStyle = x % 21 === 0 ? "rgba(255,245,224,.18)" : "rgba(70,43,25,.1)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(x) * 6, s.h);
    ctx.stroke();
  }
}

function drawWetStroke(w) {
  ctx.fillStyle = `rgba(121,198,230,${w.a * w.life})`;
  ctx.beginPath();
  ctx.ellipse(w.x, w.y, w.w, 22, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawStain(d) {
  if (d.a <= 0) return;
  const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
  g.addColorStop(0, `rgba(58,36,22,${d.a})`);
  g.addColorStop(1, "rgba(58,36,22,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCleanerHead(x, y, vx) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(clamp(vx / 140, -0.28, 0.28));
  ctx.shadowColor = "rgba(0,0,0,.28)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  roundRect(-48, -28, 96, 56, 14, "#edf2f5");
  ctx.shadowBlur = 0;
  roundRect(-38, 20, 76, 12, 6, "#45aee8");
  ctx.fillStyle = "rgba(30,45,55,.18)";
  ctx.fillRect(-32, -8, 64, 8);
  ctx.restore();
}

function drawSkinPanel(s) {
  const g = ctx.createLinearGradient(0, 0, s.w, s.h);
  g.addColorStop(0, "#f8b99f");
  g.addColorStop(0.6, "#ffd5c4");
  g.addColorStop(1, "#e5967f");
  roundRect(28, 38, s.w - 56, s.h - 88, 38, g);
  for (let i = 0; i < 180; i += 1) {
    ctx.fillStyle = i % 2 ? "rgba(122,62,48,.12)" : "rgba(255,255,255,.16)";
    ctx.beginPath();
    ctx.arc((i * 71) % s.w, 44 + ((i * 43) % (s.h - 96)), rand(0.7, 1.8), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBlackhead(b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  const dent = b.press * 10;
  ctx.fillStyle = `rgba(118,54,42,${0.16 + b.press * 0.22})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22 + dent, 16 + dent * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = b.done ? "#fff1ce" : "#26201e";
  ctx.beginPath();
  ctx.ellipse(0, -b.out * 10, b.r + b.out * 6, b.r * 0.82 + b.out * 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFingerPressure(x, y) {
  ctx.strokeStyle = "rgba(255,255,255,.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.stroke();
}

function drawMetalTray(s) {
  const g = ctx.createLinearGradient(0, 0, s.w, s.h);
  g.addColorStop(0, "#dce1e4");
  g.addColorStop(1, "#929aa2");
  roundRect(30, 44, s.w - 60, s.h - 94, 34, g);
  drawNoise(0.04);
}

function drawOilGroove(g) {
  const top = 72;
  const bottom = state.h - 72;
  ctx.fillStyle = "#20242a";
  roundRect(g.x - 11, top, 22, Math.max(18, bottom - top - g.len), 11, "#252a31");
  if (g.len > 0) {
    const h = g.len;
    const y = bottom - h;
    const grad = ctx.createLinearGradient(g.x - 15, y, g.x + 15, y + h);
    grad.addColorStop(0, "#111318");
    grad.addColorStop(0.55, "#060708");
    grad.addColorStop(1, "#2f343b");
    roundRect(g.x - 15 - g.mass * 5, y, 30 + g.mass * 10, h, 15, grad);
    ctx.fillStyle = "rgba(255,255,255,.16)";
    ctx.fillRect(g.x - 8, y + 8, 4, Math.max(10, h - 18));
  }
}

function drawFreezerSurface(s) {
  ctx.fillStyle = "#e8f9fc";
  ctx.fillRect(0, 0, s.w, s.h);
  for (let i = 0; i < 80; i += 1) {
    ctx.strokeStyle = "rgba(87,168,205,.13)";
    ctx.beginPath();
    const y = (i * 31) % s.h;
    ctx.moveTo(0, y);
    ctx.lineTo(s.w, y + Math.sin(i) * 10);
    ctx.stroke();
  }
}

function drawIceBlock(s) {
  ctx.save();
  ctx.translate(s.w / 2, s.h / 2 - 8);
  ctx.rotate(-0.08);
  ctx.shadowColor = "rgba(27,113,163,.2)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 18;
  const w = s.w * 0.74;
  const h = s.h * 0.55;
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g.addColorStop(0, "rgba(255,255,255,.9)");
  g.addColorStop(0.4, "rgba(184,236,252,.78)");
  g.addColorStop(1, "rgba(96,184,232,.72)");
  roundRect(-w / 2, -h / 2, w, h, 38, g);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(67,154,202,.74)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function makeCrack(x, y, size) {
  const lines = [];
  const branches = 4 + Math.floor(rand(0, 4));
  for (let i = 0; i < branches; i += 1) {
    const a = rand(0, Math.PI * 2);
    const segs = [];
    let px = x;
    let py = y;
    for (let j = 0; j < 4; j += 1) {
      px += Math.cos(a + rand(-0.45, 0.45)) * size * rand(0.12, 0.26);
      py += Math.sin(a + rand(-0.45, 0.45)) * size * rand(0.12, 0.26);
      segs.push({ x: px, y: py });
    }
    lines.push(segs);
  }
  return { x, y, lines };
}

function drawCrack(c) {
  ctx.strokeStyle = "rgba(26,105,154,.6)";
  ctx.lineWidth = 2;
  c.lines.forEach((line) => {
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    line.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  });
}

function makeIceChunk(x, y) {
  return {
    x,
    y,
    vx: rand(-3.2, 3.2),
    vy: rand(-4.2, -1),
    rot: rand(-1, 1),
    spin: rand(-0.12, 0.12),
    size: rand(10, 24),
    life: 1,
  };
}

function drawIceChunk(c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rot);
  ctx.globalAlpha = c.life;
  ctx.fillStyle = "rgba(219,248,255,.86)";
  ctx.beginPath();
  ctx.moveTo(0, -c.size);
  ctx.lineTo(c.size * 0.8, 0);
  ctx.lineTo(0, c.size * 0.75);
  ctx.lineTo(-c.size * 0.9, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function burst(s, x, y, count, color, power = 1) {
  for (let i = 0; i < count; i += 1) {
    const a = rand(0, Math.PI * 2);
    const speed = rand(1.4, 5.5) * power;
    s.particles.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r: rand(2.4, 6.4),
      rot: rand(-1, 1),
      spin: rand(-0.18, 0.18),
      life: rand(0.58, 1),
      color,
    });
  }
}

function shockwave(s, x, y, radius) {
  s.ripples.push({ x, y, radius, life: 1 });
}

function makeRubLine(s, p, color, a) {
  s.rubs.push({ x: p.x, y: p.y, vx: p.vx || rand(-6, 6), vy: p.vy || rand(-6, 6), w: rand(6, 18), color, a, life: 1 });
}

function play(type) {
  if (state.muted) return;
  state.audio ||= new (window.AudioContext || window.webkitAudioContext)();
  const audio = state.audio;
  const now = audio.currentTime;
  const freq = {
    pop: 520,
    soft: 210,
    peel: 280,
    squeeze: 150,
    slice: 640,
    wash: 125,
    scrape: 190,
    crack: 760,
  }[type] || 300;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  osc.type = type === "wash" || type === "squeeze" ? "sine" : "triangle";
  osc.frequency.setValueAtTime(freq + rand(-24, 24), now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(55, freq * 0.46), now + 0.12);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(type === "crack" ? 4200 : 1800, now);
  gain.gain.setValueAtTime(type === "soft" ? 0.018 : 0.045, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.14);
}

function feedback(ms) {
  if (navigator.vibrate) navigator.vibrate(Math.max(1, Math.min(28, Math.round(ms))));
}

function drawNoise(alpha) {
  const step = 4;
  ctx.save();
  for (let y = 0; y < state.h; y += step) {
    for (let x = 0; x < state.w; x += step) {
      const v = Math.random() > 0.5 ? 255 : 0;
      ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`;
      ctx.fillRect(x, y, step, step);
    }
  }
  ctx.restore();
}

function drawFold(x, y, color) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.18)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 40, y + 24, x + 66, y - 10);
  ctx.lineTo(x + 12, y - 18);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function roundRect(x, y, w, h, r, fill) {
  ctx.beginPath();
  roundPath(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundClip(x, y, w, h, r) {
  ctx.beginPath();
  roundPath(x, y, w, h, r);
  ctx.clip();
}

function roundPath(x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
}

function nearest(items, p) {
  return items.reduce((best, item) => (Math.abs(item.x - p.x) < Math.abs(best.x - p.x) ? item : best));
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
