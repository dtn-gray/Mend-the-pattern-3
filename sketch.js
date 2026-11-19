const loom = {
  width: 1080,
  height: 730,
  left: 56,
  top: 45,
  columns: 108,
  rows: 72,
  step: 9,
  bands: 12
};

const palettes = [
  {
    name: "Violet Poppy",
    yarns: ["#352b87", "#6054f8", "#a99bff", "#3c729e"],
    light: ["#f46bfa","#67cfff"],
    stitch: "#ff8266"
  },
  {
    name: "Blue Aster",
    yarns: ["#164766", "#368fe7", "#95d4ff", "#39aa72"],
    light: ["#68a3ff","#8feaca"],
    stitch: "#ff659e"
  },
  {
    name: "Lime Clover",
    yarns: ["#354b24", "#a2c73b", "#e3ff9b", "#5a70e7"],
    light: ["#ffeb8d","#acf978"],
    stitch: "#8b9dff"
  },
  {
    name: "Ivory Hellebore",
    yarns: ["#44492e", "#93955d", "#f5f1df", "#c9ac78"],
    light: ["#ffe5b3","#d9e7cf"],
    stitch: "#ffae72"
  },
  {
    name: "Coral Poppy",
    yarns: ["#76342e", "#ed664d", "#ffae85", "#9e4eae"],
    light: ["#ffb182","#f084d5"],
    stitch: "#ffe185"
  },
  {
    name: "Mint Orchid",
    yarns: ["#245b50", "#3bc1a0", "#a1f9d8", "#3272c1"],
    light: ["#f1fd9d","#89dcff"],
    stitch: "#ff9de0"
  },
  {
    name: "Pink Cosmos",
    yarns: ["#713258", "#d85ba1", "#ffabd8", "#7947d3"],
    light: ["#ffdc9c","#f089ff"],
    stitch: "#aafe9f"
  },
  {
    name: "Golden Marigold",
    yarns: ["#754526", "#e79926", "#ffe58c", "#da614f"],
    light: ["#ffe6a4","#ffb582"],
    stitch: "#8ff2ea"
  }
];

const motifNames = [
  "Diamonds", "Herringbone", "Basket Check",
  "Ripple", "Windowpane", "Broken Twill"
];

const maxSeed = 4294967295;
const historyKey = "mend-the-pattern:p5-editor";
let recentSeeds = [];
let seed;
let repairMode = "spread";
let cloth;
let repair;
let artCanvas;
const ui = {};

function setup() {
  pixelDensity(1);
  makeInterface();
  artCanvas = createCanvas(loom.width, loom.height);
  artCanvas.parent(ui.stage);
  artCanvas.attribute("role", "img");
  artCanvas.attribute("aria-label", "Generative woven textile");
  artCanvas.attribute("aria-describedby", "artwork-description");
  chooseFreshSeed();
  noLoop();
}

function draw() {
  cloth = makeCloth(seed);
  repair = planRepair(cloth);
  randomSeed(seed + 197);

  const style = styleFor(seed);
  const palette = palettes[style.palette];
  const pattern = {
    motif: style.motif,
    palette: palette,
    columns: floor(random(20, 36)),
    rows: floor(random(18, 30)),
    phase: floor(random(4, 19)),
    lightPhase: random(TWO_PI),
    crest: random(230, 420)
  };
  const [warm, cool] = palette.light;
  pattern.warm = color(warm);
  pattern.cool = color(cool);
  pattern.yarns = palette.yarns.map((ink) => color(ink));

  background(0);
  drawCloth(cloth, pattern);
  drawRepair(repair, palette, cloth.horizontal);
  softenLight();
  updateInfo(pattern);
}

function makeInterface() {
  createElement("style", `
:root {
  color-scheme: dark;
  --black: #050505;
  --text: #f0f0f2;
  --muted: #a4a4ad;
  --line: #333338;
  --accent: #ff8868;
  background: var(--black);
  color: var(--text);
  font-family: "IBM Plex Mono", Consolas, monospace;
}
* { box-sizing: border-box; }
body { margin: 0; }
a { color: inherit; text-underline-offset: .27em; }
button, input { font: inherit; }
:focus-visible { outline: 2px solid #8e9eff; outline-offset: 3px; }
[hidden] { display: none !important; }
.sr-only {
  position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden;
  clip-path: inset(50%); white-space: nowrap;
}
.page { width: min(1510px, calc(100% - 52px)); margin: auto; }
.masthead {
  min-height: 86px; display: flex; align-items: center; justify-content: space-between;
  gap: 10px; padding-inline: clamp(0px, 2vw, 32px);
}
.masthead nav { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 9px; }
.badge {
  display: inline-block; padding: 8px clamp(10px, 1.55vw, 23px);
  border: 1px solid var(--line); border-radius: 12px;
  text-decoration: none; color: var(--muted); font-size: clamp(.75rem, 1.35vw, 1.07rem);
  white-space: nowrap;
}
.badge:hover { color: var(--text); border-color: #6d6d76; }
.gallery {
  position: relative;
  height: clamp(540px, calc(100svh - 167px), 780px);
  border: 1px solid var(--line);
  border-radius: 27px;
  margin: 9px 0 0;
}
.gallery h1 {
  position: absolute; z-index: 2; left: 50%; bottom: 0; transform: translate(-50%, 50%);
  margin: 0; border: 1px solid #48484f; border-radius: 23px;
  background: #090909f5; padding: .29em .65em .36em;
  font-size: clamp(1.65rem, 4.3vw, 4.45rem); font-weight: 400; line-height: 1; letter-spacing: -.065em;
  white-space: nowrap;
}
.gallery h1 span { color: var(--weave-accent, var(--accent)); }
.swatch { margin: 0; position: absolute; inset: 0; display: grid; place-items: center; }
#weave-style {
  position: absolute; left: 17px; bottom: 27px; border: 1px solid var(--line); border-radius: 6px;
  background: var(--black); padding: 5px 8px; color: var(--muted); font-size: .68rem; line-height: 1.3;
}
#weave-style:empty { display: none; }
#artwork { width: min(59%, 810px); max-height: 91%; display: grid; place-items: center; }
#artwork canvas { display: block; width: 100% !important; height: auto !important; }
#artwork-placeholder { max-width: 32ch; color: var(--muted); text-align: center; font-size: .8rem; }
.repair-panel {
  display: flex; flex-direction: column; gap: 10px; width: 236px;
  position: absolute; top: 14px; right: 14px; bottom: 14px;
  font-size: .875rem; font-weight: 500;
}
.actions, #strategy, .ledger, #seed-form {
  background: #0b0b0bed; border: 1px solid #29292e; border-radius: 17px; padding: 11px;
}
.actions { display: grid; gap: 6px; }
button, #seed {
  border: 1px solid #36363b; border-radius: 7px; background: #0b0b0b;
  color: var(--text); min-height: 33px; padding: 5px 9px;
}
button { cursor: pointer; }
button:hover:not(:disabled) { background: #252527; }
button:disabled { opacity: .55; cursor: default; }
#new-tear { background: #252527; border-color: #252527; }
#new-tear:hover:not(:disabled) { background: #343438; }
#strategy { margin: 0; min-width: 0; }
#strategy legend { padding: 0 5px; color: var(--muted); }
.strategy-options { position: relative; display: grid; grid-template-columns: 1fr auto; gap: 4px; }
.strategy-options input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.strategy-options label {
  border: 1px solid #303036; border-radius: 6px; padding: 7px 5px; text-align: center; cursor: pointer;
}
.strategy-options input:checked + label { background: #28233e; border-color: #6659a5; color: #eee9ff; }
.strategy-options input:focus-visible + label { outline: 2px solid #8e9eff; outline-offset: 2px; }
.ledger .eyebrow, .seam > div:first-child {
  display: flex; justify-content: space-between; align-items: center; gap: 5px;
  margin: 0 0 7px; font-size: .68rem; font-weight: 500;
}
.ledger .eyebrow span, .seam > div:first-child, dt { color: var(--muted); }
.budget-bar { height: 4px; background: #33333a; }
#used-bar { width: 0; height: 100%; background: var(--weave-accent, var(--accent)); }
.ledger dl { display: grid; grid-template-columns: 1.25fr 1fr .65fr; gap: 5px; margin: 8px 0 12px; }
.ledger dt { font-size: .57rem; }
.ledger dd { margin: 2px 0 0; font-size: .83rem; }
.seam strong { color: var(--text); }
#seam-map { display: grid; grid-template-columns: repeat(12, 1fr); gap: 3px; }
#seam-map span { height: 5px; background: #35353d; }
#seam-map .reached { background: var(--weave-accent, #9e90ff); }
#seed-form { margin-top: auto; }
#seed-form label { display: block; color: var(--muted); text-align: center; margin-bottom: 7px; }
#seed-form div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px; }
#seed { width: 100%; text-align: center; }
.message, footer { max-width: 1050px; margin-inline: auto; }
.message {
  display: grid; grid-template-columns: 1fr 1.14fr; gap: 23px clamp(28px, 7vw, 90px);
  padding-block: clamp(74px, 9vw, 140px) 40px;
}
blockquote { margin: 0 0 12px; font-size: clamp(1.3rem, 3vw, 2.4rem); line-height: 1.18; letter-spacing: -.055em; }
.quote a, footer { color: var(--muted); font-size: .73rem; }
.message h2 { font-weight: 500; margin: 0 0 8px; font-size: .95rem; }
.message p { color: var(--muted); margin: 0 0 9px; font-size: .82rem; line-height: 1.65; }
.message strong { display: block; margin-top: 9px; color: var(--text); font-weight: 600; }
footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 20px 0 37px; }
@media (min-width: 731px) and (max-width: 1050px) {
  .swatch { right: 143px; }
  #artwork { width: 78%; }
}
@media (max-width: 730px) {
  .page { width: calc(100% - 26px); }
  .masthead { min-height: 61px; }
  .masthead nav { gap: 5px; }
  .badge { padding: 6px 7px; border-radius: 8px; font-size: .68rem; }
  .gallery { height: auto; margin-top: 5px; padding-bottom: 33px; border-radius: 20px; }
  .swatch { position: static; padding: 8px 1px 0; min-height: 185px; }
  #weave-style { position: static; margin: 0 8px 9px; text-align: center; }
  #artwork { width: 98%; max-height: none; }
  .repair-panel {
    position: static; margin: 0 10px 8px; width: auto;
    display: grid; grid-template-columns: 1fr 1fr; align-items: stretch; gap: 7px;
  }
  .actions, #strategy, .ledger, #seed-form { padding: 8px; border-radius: 12px; min-width: 0; }
  #seed-form { margin-top: 0; display: grid; align-content: center; }
  .strategy-options { grid-template-columns: 1fr; }
  .gallery h1 { border-radius: 13px; }
  .message { grid-template-columns: 1fr; }
}

body { font-size: 16px; }
.badge { font-size: clamp(.875rem, 1.35vw, 1.07rem); }
.swatch { right: 250px; }
#artwork { width: min(90%, 810px, calc(clamp(540px, calc(100svh - 167px), 780px) * 1.24)); }
#weave-style { max-width: calc(100% - 34px); font-size: .8125rem; }
.ledger .eyebrow, .seam > div:first-child { font-size: .875rem; }
.ledger .eyebrow span, .ledger dt { font-size: .8125rem; }
.ledger dd { font-size: .9375rem; }
#seed-feedback { color: #ffa68d; font-size: .875rem; line-height: 1.4; margin: 8px 0 0; }
#seed-feedback:empty { display: none; }
.message p { font-size: 1rem; }
.message h2, .quote a, footer { font-size: .875rem; }
@media (min-width: 731px) and (max-width: 1050px) {
  .swatch { right: 250px; }
  #artwork { width: 94%; }
}
@media (max-width: 730px) {
  .badge { font-size: .875rem; }
  .repair-panel { font-size: .875rem; }
  #artwork { width: 98%; }
  .ledger .eyebrow { flex-wrap: wrap; }
  #seed-form div { grid-template-columns: minmax(0, 1fr); }
  .gallery h1 { font-size: clamp(1.4rem, 5.3vw, 2.5rem); }
}
  `);

  ui.page = createDiv(`
<header class="masthead">
      <a class="badge" href="#artwork">weave generator</a>
      <nav aria-label="Project links">
        <a class="badge" href="https://sdgs.un.org/goals/goal12" aria-label="UN SDG 12, Responsible Consumption and Production">SDG 12</a>
        <a class="badge" href="#action-title">about the project</a>
      </nav>
    </header>

    <main>
      <section class="gallery" aria-labelledby="title">
        <h1 id="title">mend the pattern<span>.</span></h1>
        <figure class="swatch">
          <div id="artwork">
            
          </div>
          <p id="artwork-description" class="sr-only" aria-live="polite"></p>
          <figcaption id="weave-style"></figcaption>
        </figure>

        <div class="repair-panel">
          <div class="actions">
            <button id="new-tear" type="button">New weave <span aria-hidden="true">↻</span></button>
          </div>
          <fieldset id="strategy">
            <legend>Stitch placement</legend>
            <div class="strategy-options">
              <input type="radio" name="repair" id="spread" value="spread" checked>
              <label for="spread">Spread</label>
              <input type="radio" name="repair" id="concentrate" value="concentrate">
              <label for="concentrate">Concentrate</label>
            </div>
          </fieldset>
          <div class="ledger">
            <h3 class="eyebrow">Thread budget <span>model units</span></h3>
            <div class="budget-bar" aria-hidden="true"><div id="used-bar"></div></div>
            <dl>
              <div><dt>Recovered</dt><dd id="recovered">–</dd></div>
              <div><dt>Used</dt><dd id="used">–</dd></div>
              <div><dt>Left</dt><dd id="remaining">–</dd></div>
            </dl>
            <div class="seam">
              <div><span>Seam reach</span><strong id="reach">–</strong></div>
              <div id="seam-map" aria-hidden="true"></div>
            </div>
          </div>
          <form id="seed-form">
            <label for="seed">Weave seed</label>
            <div>
              <input id="seed" name="seed" type="text" inputmode="numeric" pattern="[0-9]{1,10}" maxlength="10" required>
              <button type="submit" id="apply-seed">Go</button>
            </div>
          <p id="seed-feedback" role="status"></p>
          </form>
        </div>
      </section>

      <section class="message" aria-labelledby="action-title">
        <div class="quote">
          <blockquote>“The economy is entirely dependent on finite materials.”</blockquote>
          <a href="https://www.ellenmacarthurfoundation.org/the-circular-economy-at-sea/part-1">Ellen MacArthur ↗</a>
        </div>
        <div>
          <h2 id="action-title">Use what you have.</h2>
          <p>Ellen MacArthur’s observation connects to SDG 12, Responsible Consumption and Production. Repairing an object keeps materials in use and can prevent waste. Here, each repair spends the thread its tear leaves behind. <strong>Before you replace something this week, try one repair with a material you already have and show someone how you did it.</strong></p>
        </div>
      </section>
    </main>

    <footer>
      <a href="https://sdgs.un.org/goals/goal12">UN Target 12.5</a>
      <a href="https://www.ellenmacarthurfoundation.org/the-circular-economy-at-sea/part-1">Quote source ↗</a>
    </footer>
  `).class("page");
  ui.stage = select("#artwork", ui.page);
  ui.seed = select("#seed", ui.page);
  ui.feedback = select("#seed-feedback", ui.page);
  ui.info = select("#weave-style", ui.page);
  ui.description = select("#artwork-description", ui.page);
  ui.recovered = select("#recovered", ui.page);
  ui.used = select("#used", ui.page);
  ui.remaining = select("#remaining", ui.page);
  ui.usedBar = select("#used-bar", ui.page);
  ui.reach = select("#reach", ui.page);
  ui.seamMap = select("#seam-map", ui.page);
  ui.seed.attribute("aria-describedby", "seed-feedback");

  select("#new-tear", ui.page).mousePressed(() => {
    chooseFreshSeed();
    redraw();
  });

  select("#strategy", ui.page).changed((event) => {
    repairMode = event.target.value;
    redraw();
  });

  ui.seed.input(() => ui.feedback.html(""));
  select("#seed-form", ui.page).elt.addEventListener("submit", (event) => {
    event.preventDefault();
    loadSeed();
  });
}

function styleFor(value) {
  const slot = value < 10000 ? 0 : value;
  return {
    palette: slot % palettes.length,
    motif: floor(slot / palettes.length) % motifNames.length
  };
}

function seedHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(historyKey));
    if (Array.isArray(saved)) {
      return saved.filter((value) =>
        Number.isInteger(value) && value >= 0 && value <= maxSeed
      );
    }
  } catch {
  }
  return recentSeeds;
}

function rememberSeed(value) {
  seed = value;
  recentSeeds = [value, ...seedHistory()].slice(0, 7);
  try {
    localStorage.setItem(historyKey, JSON.stringify(recentSeeds));
  } catch {
  }
}

function chooseFreshSeed() {
  const history = seedHistory().map(styleFor);
  const usedPalettes = new Set(history.slice(0, 7).map((item) => item.palette));
  const usedMotifs = new Set(history.slice(0, 5).map((item) => item.motif));
  const values = new Uint32Array(1);
  let candidate;
  let style;

  do {
    crypto.getRandomValues(values);
    candidate = values[0];
    style = styleFor(candidate);
  } while (
    candidate < 10000 ||
    usedPalettes.has(style.palette) ||
    usedMotifs.has(style.motif)
  );

  rememberSeed(candidate);
  ui.feedback.html("");
}

function loadSeed() {
  const entered = ui.seed.value().trim();
  const value = Number(entered);
  if (!/^[0-9]{1,10}$/.test(entered) || value > maxSeed) {
    ui.feedback.html("Enter a whole number from 0 to 4294967295.");
    return;
  }
  rememberSeed(value);
  ui.feedback.html("");
  redraw();
}

function makeCloth(value) {
  randomSeed(value);
  noiseSeed(value);
  const original = value < 10000;
  const horizontal = !original && random() < 0.5;
  const alongCount = horizontal ? loom.columns : loom.rows;
  const acrossCount = horizontal ? loom.rows : loom.columns;
  const alongStart = horizontal ? loom.left : loom.top;
  const acrossStart = horizontal ? loom.top : loom.left;
  const span = (acrossCount - 1) * loom.step;
  const acrossEnd = acrossStart + span;
  const placement = original ? 0 : random(0.26, 0.74);
  const slant = original ? 0 : random(-0.24, 0.24);
  const phase = original ? 0 : random(TWO_PI);
  const rows = [];
  let recovered = 0;

  for (let index = 0; index < alongCount; index++) {
    const y = alongStart + index * loom.step;
    const progress = index / (alongCount - 1);
    const base = original
      ? 675 - index * 3.6
      : acrossStart + span * (placement + slant * (progress - 0.5));
    const roughCenter = base + 108 * (noise(index * 0.09) - 0.5)
      + 26 * sin(index * 0.15 + phase);
    const halfWidth = 13 + 72 * noise(index * 0.125 + 36);
    const margin = halfWidth + 36;
    const center = original
      ? roughCenter
      : constrain(roughCenter, acrossStart + margin, acrossEnd - margin);
    const left = center - halfWidth;
    const right = center + halfWidth;
    const fibers = [];

    for (let column = 0; column < acrossCount; column++) {
      const x = acrossStart + column * loom.step;
      const length = round(random(5, 13));
      if (x > left && x < right) {
        if (random() < 0.275) recovered += length;
      } else {
        fibers.push({ column, x, length });
      }
    }
    rows.push({ index, y, left, right, fibers });
  }
  return { rows, horizontal, acrossStart, acrossEnd, recovered };
}

function makeStitch(row) {
  const slope = row.index % 4 < 2 ? -1 : 1;
  const start = { x: row.left - 18, y: row.y + 4 * slope };
  const bend = {
    x: row.left + (row.right - row.left) * 0.47,
    y: row.y + 3 * slope
  };
  const end = { x: row.right + 18, y: row.y - 6 * slope };
  const length = dist(start.x, start.y, bend.x, bend.y)
    + dist(bend.x, bend.y, end.x, end.y);
  return {
    index: row.index,
    points: [start, bend, end],
    cost: ceil(length) + 14
  };
}

function planRepair(material) {
  const rows = material.rows.slice(1, -1);
  const widest = rows.reduce((best, row) =>
    row.right - row.left > best.right - best.left ? row : best
  );
  const rowsPerBand = material.rows.length / loom.bands;
  const bandOf = (index) => floor(index / rowsPerBand);
  const bandCenter = floor((rowsPerBand - 1) / 2);
  const priority = (row) => abs(row.index % rowsPerBand - bandCenter);
  const radius = round(material.rows.length / 6);
  const bandOrder = [0, 11, 6, 3, 9, 1, 8, 4, 10, 2, 7, 5];

  rows.sort((a, b) => {
    if (repairMode === "concentrate") {
      return abs(a.index - widest.index) - abs(b.index - widest.index);
    }
    return priority(a) - priority(b)
      || bandOrder.indexOf(bandOf(a.index)) - bandOrder.indexOf(bandOf(b.index));
  });

  const stitches = [];
  const coverage = Array(loom.bands).fill(false);
  let remaining = material.recovered;

  for (const row of rows) {
    if (repairMode === "concentrate" && abs(row.index - widest.index) > radius) {
      break;
    }
    const stitch = makeStitch(row);
    if (stitch.cost > remaining) continue;
    stitches.push(stitch);
    coverage[bandOf(row.index)] = true;
    remaining -= stitch.cost;
  }

  stitches.sort((a, b) => a.index - b.index);
  return {
    stitches,
    coverage,
    remaining,
    used: material.recovered - remaining
  };
}

function motifBand(kind, u, v) {
  switch (kind) {
    case 0: {
      const diamond = abs(u - 0.5) + abs(v - 0.5);
      if ((diamond > 0.45 && diamond < 0.56) || (v > 0.82 && v < 0.91)) return 2;
      if (diamond < 0.37 || v < 0.14) return 1;
      return diamond > 0.69 && diamond < 0.78 ? 3 : 0;
    }
    case 1: {
      const track = (v * 2 + abs(u - 0.5) * 1.65) % 1;
      if (track < 0.2) return 2;
      if (track < 0.42) return 1;
      return track < 0.52 ? 3 : 0;
    }
    case 2: {
      const column = floor(u * 2);
      const row = floor(v * 2);
      if (u % 0.5 < 0.075 || v % 0.5 < 0.075) return 3;
      if (column === row) return 2;
      return column === 1 ? 1 : 0;
    }
    case 3: {
      const wave = (v * 2 + 1 + 0.28 * sin(u * TWO_PI)) % 1;
      if (wave < 0.16) return 2;
      if (wave < 0.36) return 3;
      return wave < 0.64 ? 1 : 0;
    }
    case 4: {
      const vertical = min(u, 1 - u);
      const horizontal = abs(v - 0.5);
      if (vertical < 0.085 || horizontal < 0.085) return 2;
      if (vertical < 0.16 || horizontal < 0.16) return 1;
      return vertical > 0.34 && horizontal > 0.29 ? 3 : 0;
    }
    case 5: {
      const diagonal = (u * 2 + (u < 0.5 ? v : 1 - v)) % 1;
      if (abs(u - 0.5) < 0.065) return 3;
      if (diagonal < 0.21) return 2;
      return diagonal < 0.48 ? 1 : 0;
    }
  }
}

function softenLight() {
  const wovenImage = get();
  background('#050505');
  push();
  drawingContext.filter = 'blur(15px)';
  tint(255, 100);
  image(wovenImage, 0, 0);
  drawingContext.filter = 'blur(0.65px)';
  blendMode(SCREEN);
  noTint();
  image(wovenImage, 0, 0);
  pop();
}

function drawCloth({ rows, horizontal, acrossStart, acrossEnd }, pattern) {
  const first = rows[0];
  const last = rows[rows.length - 1];
  push();
  if (horizontal) applyMatrix(0, 1, 1, 0, 0, 0);
  noStroke();
  fill(lerpColor(pattern.yarns[0], color('#090612'), 0.65));
  beginShape();
  vertex(acrossStart - 5, first.y - 4);
  for (const row of rows) vertex(row.left, row.y);
  vertex(acrossStart - 4, last.y + 6);
  endShape(CLOSE);
  beginShape();
  vertex(acrossEnd + 5, first.y - 4);
  for (const row of rows) vertex(row.right, row.y);
  vertex(acrossEnd + 5, last.y + 6);
  endShape(CLOSE);
  pop();

  for (const row of rows) {
    for (const fiber of row.fibers) drawFiber(row, fiber, pattern, horizontal);
    drawFray(row, pattern.palette, horizontal);
  }
}

function drawFiber(row, fiber, pattern, horizontalTear) {
  const column = horizontalTear ? row.index : fiber.column;
  const level = horizontalTear ? fiber.column : row.index;
  const band = (level + pattern.phase) % pattern.rows;
  const heightPhase = band / pattern.rows;
  const widthPhase = ((column + pattern.phase) % pattern.columns) / pattern.columns;
  const tone = motifBand(pattern.motif, widthPhase, heightPhase);

  const x = (horizontalTear ? row.y : fiber.x) + random(-1.35, 1.35);
  const y = (horizontalTear ? fiber.x : row.y) + random(-1.45, 1.45);
  const horizontal = (column + 2 * level) % 5 < 3;
  const halfLength = fiber.length / 2 + 1;
  const dx = horizontal ? halfLength : random(-0.9, 0.9);
  const dy = horizontal ? random(-0.7, 0.7) : halfLength;
  const weight = random(4.3, 6.9);
  const base = lerpColor(pattern.yarns[tone], pattern.yarns[(tone + 1) % 4], random(0, 0.23));  const lightY = pattern.crest + 100 * Math.sin(x * 0.006 + pattern.lightPhase);
  const reflected = Math.exp(-Math.pow((y - lightY) / 67, 2));
  const rim = Math.exp(-Math.pow((y - lightY + 150) / 48, 2));
  const reflection = lerpColor(pattern.warm, pattern.cool, x / loom.width);
  const ink = lerpColor(base, reflection, reflected * 0.6 + rim * 0.22);

  stroke('#100b24');
  strokeWeight(weight + 2.6);
  line(x - dx, y - dy + 1.55, x + dx, y + dy + 1.55);
  stroke(ink);
  strokeWeight(weight);
  line(x - dx, y - dy, x + dx, y + dy);
  stroke(224, 213, 255, random(22, 90) + reflected * 81);
  strokeWeight(0.95);
  line(x - dx, y - dy - 1, x + dx, y + dy - 1);
}

function drawFray(row, palette, horizontal) {
  push();
  if (horizontal) applyMatrix(0, 1, 1, 0, 0, 0);
  const width = row.right - row.left;
  const length = random(3, width * 0.21);
  strokeWeight(random(0.75, 2.1));
  stroke(palette.yarns[1]);
  line(row.left - 5, row.y, row.left + length, row.y + random(-4, 4));
  stroke(palette.yarns[2]);
  line(row.right + 5, row.y + 3, row.right - length * 0.8, row.y + random(-3, 7));
  pop();
}

function drawRepair({ stitches }, palette, horizontal) {
  push();
  if (horizontal) applyMatrix(0, 1, 1, 0, 0, 0);
  const stitchColor = color(palette.stitch);
  const highlight = lerpColor(stitchColor, color('#fff5e9'), 0.61);
  for (const stitch of stitches) {
    const [start, bend, end] = stitch.points;
    const tone = lerpColor(stitchColor, highlight, random(0, 0.3));
    const weight = random(6.3, 8.1);
    noFill();
    stroke('#181817');
    strokeWeight(weight + 4);
    line(start.x, start.y + 2, bend.x, bend.y + 2);
    line(bend.x, bend.y + 2, end.x, end.y + 2);
    stroke(red(tone), green(tone), blue(tone), 66);
    strokeWeight(weight + 9);
    line(start.x, start.y, bend.x, bend.y);
    line(bend.x, bend.y, end.x, end.y);
    stroke(tone);
    strokeWeight(weight);
    line(start.x, start.y, bend.x, bend.y);
    line(bend.x, bend.y, end.x, end.y);
    stroke(highlight);
    strokeWeight(1.4);
    line(start.x, start.y - 1, bend.x, bend.y - 1);
    line(bend.x, bend.y - 1, end.x, end.y - 1);

    fill(tone);
    stroke(lerpColor(stitchColor, color('#130c15'), 0.68));
    strokeWeight(1.4);
    ellipse(start.x, start.y, 9, 6);
    ellipse(end.x, end.y, 9, 6);
    stroke(tone);
    strokeWeight(1.5);
    line(start.x, start.y, start.x - 6, start.y - 3);
    line(end.x, end.y, end.x + 6, end.y + 3);
    stroke(highlight);
    strokeWeight(2.4);
    point(start.x - 1, start.y - 1);
    point(end.x - 1, end.y - 1);
  }
  pop();
}

function updateInfo(pattern) {
  const direction = cloth.horizontal ? "horizontal" : "vertical";
  const reached = repair.coverage.filter(Boolean).length;
  const modeName = repairMode === "concentrate" ? "Concentrate" : "Spread";
  ui.seed.value(String(seed));
  ui.page.elt.style.setProperty("--weave-accent", pattern.palette.stitch);
  ui.info.html(
    pattern.palette.name + " / " + motifNames[pattern.motif] +
    " / " + direction + " tear"
  );
  ui.recovered.html(cloth.recovered.toLocaleString("en-US"));
  ui.used.html(repair.used.toLocaleString("en-US"));
  ui.remaining.html(repair.remaining.toLocaleString("en-US"));
  ui.usedBar.style("width", 100 * repair.used / max(1, cloth.recovered) + "%");
  ui.reach.html(reached + " / " + loom.bands);
  ui.seamMap.html("");
  for (const reachedBand of repair.coverage) {
    const block = createSpan().parent(ui.seamMap);
    if (reachedBand) block.class("reached");
  }
  const description =
    "Edition " + seed + ". " + pattern.palette.name + " " +
    motifNames[pattern.motif] + " weave with a " + direction + " tear. " +
    modeName + " places " + repair.stitches.length + " stitches across " +
    reached + " of " + loom.bands + " bands. " +
    repair.remaining + " thread units remain.";
  artCanvas.attribute("aria-label", description);
  ui.description.html(description);
}
