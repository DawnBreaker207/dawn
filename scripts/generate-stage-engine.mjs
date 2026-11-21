import fs from 'node:fs';

const runtimeAppCode = fs.readFileSync('src/lib/dts/runtime-app.ts', 'utf8');
const lines = runtimeAppCode.split('\n');

// Lines 1 to 1322 contain all code up to end of ap class
const stageLines = lines.slice(0, 1322);

let stageCode = stageLines.join('\n');

// Check if `var ap = class {` is present
if (stageCode.includes('var ap = class {')) {
  stageCode = stageCode.replace('var ap = class {', 'export class StageEngine {');
}

// Add dark theme color maps at top if needed
const header = `// @ts-nocheck
/* eslint-disable */
/**
 * StageEngine (ap class extracted from DTS runtime-app.ts)
 * 100% ground-truth DTS interactive Stage & Animation Engine.
 */
import {
  round as A,
  isoProject as j,
  buildDefs as jr,
  buildPill as zr,
  ENTITY_RENDERERS as Oi,
  ENTITY_DEFAULTS as ki,
  entitySortKey as Mi,
  entityCenter as ji,
  trimPathStart as Tr,
  trimPathEnd as Er,
  smoothPath as Cr,
} from './runtime-draw';

const rf = {
  "#1d1b18": "#efe6d6",
  "#211e1b": "#ece2d0",
  "#34302b": "#ddd3c2",
  "#1c1a17": "#050403",
  "#6b5236": "#000000",
  "#5a4123": "#000000",
  "#3a2a14": "#000000",
};
const af = { "#ffffff": "#ffffff", "#e6ddd0": "#4d463c" };
const of = (e) => {
  let t = e.replace("#", "").toLowerCase();
  return "#" + (t.length === 3 ? [...t].map((e) => e + e).join("") : t);
};
const or = () => "en";

// Font width calculation
const Fr = new Map();
let Ir = null;
let Lr = "";
if (typeof document !== "undefined" && document.fonts) {
  document.fonts.addEventListener("loadingdone", () => Fr.clear());
}
const Rr = (e, t) => {
  e = String(e);
  if (typeof document === "undefined") return e.length * t * 0.6;
  const n = t + "|" + e;
  let r = Fr.get(n);
  if (r === undefined) {
    if (!Ir) {
      Ir = document.createElement("canvas").getContext("2d");
      Lr = getComputedStyle(document.documentElement).getPropertyValue("--font").trim() || "monospace";
    }
    Ir.font = "700 " + t + "px " + Lr;
    r = Ir.measureText(e).width;
    Fr.set(n, r);
  }
  return r;
};
const Br = (e) => Math.round(e * 1.3);
function Vr(e, t) {
  const n = String(e).split("\\n");
  return { lines: n, tw: Math.max(...n.map((e) => Rr(e, t))), h: 21 + (n.length - 1) * Br(t) };
}
`;

// Remove the trailing comma from line 1322: `},` -> `}`
stageCode = stageCode.replace(/\},\s*$/, '}\n');

fs.writeFileSync('src/lib/dts/stage-engine.ts', header + '\n' + stageCode);
console.log('src/lib/dts/stage-engine.ts generated successfully!');
