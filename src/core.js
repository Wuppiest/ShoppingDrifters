'use strict';
// ============================================================
//  Shopping Drifters – core: helpers, RNG, low-poly geometry, mesh merging
// ============================================================
const T = THREE;
const V3 = T.Vector3;
const PI = Math.PI, TAU = PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const smooth = (t) => t * t * (3 - 2 * t);
const angDiff = (a, b) => { let d = b - a; while (d > PI) d -= TAU; while (d < -PI) d += TAU; return d; };

// ---------- deterministic RNG ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
let rng = mulberry32(1);
const R = (a, b) => a + (b - a) * rng();
const RI = (a, b) => Math.floor(a + (b - a + 1) * rng());
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

// ---------- geometry cache (non-indexed → flat normals = low-poly look) ----------
const GEO = {};
function GC(key, fn) {
  if (!GEO[key]) { const g = fn(); GEO[key] = g.index ? g.toNonIndexed() : g; }
  return GEO[key];
}
const geoBox = () => GC('box', () => new T.BoxGeometry(1, 1, 1));
const geoCyl = (seg = 8, rt = 1) => GC('cyl' + seg + '_' + rt, () => new T.CylinderGeometry(rt, 1, 1, seg));
const geoSph = (seg = 8) => GC('sph' + seg, () => new T.SphereGeometry(1, seg, Math.max(3, Math.round(seg * 0.6))));
const geoCone = (seg = 8) => GC('cone' + seg, () => new T.ConeGeometry(1, 1, seg));
const geoTorus = (tube = 0.35, seg = 10, arc = TAU) => GC('tor' + tube + '_' + seg + '_' + arc.toFixed(2), () => new T.TorusGeometry(1, tube, 5, seg, arc));
const geoPlane = () => GC('plane', () => new T.PlaneGeometry(1, 1));
const geoIco = (d = 0) => GC('ico' + d, () => new T.IcosahedronGeometry(1, d));

// ---------- canvas helpers ----------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  t.userData = { canvas: c, ctx: g };
  return t;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
// draw text shrunk to fit a width
function fitText(g, txt, x, y, maxW, size, weight = 900, font = FONT) {
  let fs = size;
  g.font = `${weight} ${fs}px ${font}`;
  while (g.measureText(txt).width > maxW && fs > 6) { fs -= 1; g.font = `${weight} ${fs}px ${font}`; }
  g.fillText(txt, x, y);
  return fs;
}

// ---------- decal atlas: every printed label / sticker lives in one texture ----------
// top half: 256px cells (8x4), bottom half: 128px cells (16x8). Cell 0 of the small grid is pure white
// and is used by all untextured vertices (vertex color × white = vertex color).
const ATLAS_S = 2048;
const ATLAS = canvasTex(ATLAS_S, ATLAS_S, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, ATLAS_S, ATLAS_S); });
ATLAS.anisotropy = 8;
const ATLAS_G = ATLAS.userData.ctx;
const WHITE_UV = [64 / ATLAS_S, 1 - (1024 + 64) / ATLAS_S];
let atlasBig = 0, atlasSmall = 1;
// draw(g, x, y, w, h) paints a label of the given aspect (w/h); returns its uv rectangle
function atlasLabel(aspect, draw, big = false, bg = null) {
  let cx, cy, S;
  if (big && atlasBig < 32) { S = 256; cx = (atlasBig % 8) * 256; cy = Math.floor(atlasBig / 8) * 256; atlasBig++; }
  else { S = 128; const i = atlasSmall++ % 128; cx = (i % 16) * 128; cy = 1024 + Math.floor(i / 16) * 128; }
  const pad = 4, inner = S - pad * 2;
  let w = inner, h = inner;
  if (aspect >= 1) h = Math.max(8, Math.round(inner / aspect)); else w = Math.max(8, Math.round(inner * aspect));
  const x = cx + pad + Math.floor((inner - w) / 2), y = cy + pad + Math.floor((inner - h) / 2);
  const g = ATLAS_G;
  if (bg) { g.fillStyle = bg; g.fillRect(cx, cy, S, S); }
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  draw(g, x, y, w, h);
  g.restore();
  ATLAS.needsUpdate = true;
  const e = 0.6; // half-texel inset against bleeding
  return { u0: (x + e) / ATLAS_S, u1: (x + w - e) / ATLAS_S, v0: 1 - (y + h - e) / ATLAS_S, v1: 1 - (y + e) / ATLAS_S };
}

// remember / rewind the atlas fill level (world switch: world-specific labels are redrawn)
const atlasMark = () => ({ big: atlasBig, small: atlasSmall });
function atlasRewind(m) {
  const g = ATLAS_G; g.fillStyle = '#ffffff';
  for (let i = m.big; i < atlasBig && i < 32; i++) g.fillRect((i % 8) * 256, Math.floor(i / 8) * 256, 256, 256);
  for (let i = m.small; i < atlasSmall; i++) { const k = i % 128; if (k === 0) continue; g.fillRect((k % 16) * 128, 1024 + Math.floor(k / 16) * 128, 128, 128); }
  atlasBig = m.big; atlasSmall = m.small; ATLAS.needsUpdate = true;
}
const atlasFree = () => ({ big: 32 - atlasBig, small: 128 - atlasSmall });
// many tiny labels sharing small atlas cells (e.g. price tags): returns n uv rects
function atlasSheet(nx, ny, n, draw, bg = '#ffffff') {
  const out = [];
  for (let k = 0; k < n; k += nx * ny) {
    const i = atlasSmall++ % 128, cx = (i % 16) * 128, cy = 1024 + Math.floor(i / 16) * 128, w = 128 / nx, h = 128 / ny, g = ATLAS_G;
    g.fillStyle = bg; g.fillRect(cx, cy, 128, 128);
    for (let j = 0; j < nx * ny && k + j < n; j++) {
      const x = cx + (j % nx) * w, y = cy + Math.floor(j / nx) * h;
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); draw(g, x + 1, y + 1, w - 2, h - 2, k + j); g.restore();
      out.push({ u0: (x + 1.5) / ATLAS_S, u1: (x + w - 1.5) / ATLAS_S, v0: 1 - (y + h - 1.5) / ATLAS_S, v1: 1 - (y + 1.5) / ATLAS_S });
    }
  }
  ATLAS.needsUpdate = true;
  return out;
}

// ---------- object builder: list of colored parts in local space ----------
const _m4 = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _s = new V3(), _p = new V3();
// detail control: products are built twice (full detail / reduced) for level of detail
let SEGCAP = 99, SKIP_TINY = false;
const sg = (n) => Math.max(5, Math.min(n, SEGCAP));
const geoWrap = (seg = 10, arc = PI) => GC('wrap' + seg + '_' + arc.toFixed(3), () => new T.CylinderGeometry(1, 1, 1, seg, 1, true, -arc / 2, arc));
class Obj {
  constructor() { this.parts = []; }
  add(geo, x, y, z, sx, sy, sz, color, rx = 0, ry = 0, rz = 0, uv = null) {
    if (SKIP_TINY && !uv && Math.max(Math.abs(sx), Math.abs(sy), Math.abs(sz)) < 0.016) return this;
    const m = new T.Matrix4().compose(new V3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new V3(sx, sy, sz));
    this.parts.push({ geo, m, color: color instanceof T.Color ? color : new T.Color(color), uv });
    return this;
  }
  // all positions are part centers
  box(w, h, d, x, y, z, c, o = {}) { return this.add(geoBox(), x, y, z, w, h, d, c, o.rx || 0, o.ry || 0, o.rz || 0); }
  cyl(r, h, x, y, z, c, o = {}) { return this.add(geoCyl(sg(o.seg || 8), o.rt != null ? o.rt : 1), x, y, z, r * (o.sx || 1), h, r * (o.sz || 1), c, o.rx || 0, o.ry || 0, o.rz || 0); }
  sph(r, x, y, z, c, o = {}) { return this.add(geoSph(sg(o.seg || 8)), x, y, z, r * (o.sx || 1), r * (o.sy || 1), r * (o.sz || 1), c, o.rx || 0, o.ry || 0, o.rz || 0); }
  cone(r, h, x, y, z, c, o = {}) { return this.add(geoCone(sg(o.seg || 8)), x, y, z, r * (o.sx || 1), h, r * (o.sz || 1), c, o.rx || 0, o.ry || 0, o.rz || 0); }
  torus(r, tube, x, y, z, c, o = {}) { return this.add(geoTorus(tube, sg(o.seg || 10), o.arc || TAU), x, y, z, r, r, r * (o.sz || 1), c, o.rx || 0, o.ry || 0, o.rz || 0); }
  ico(r, x, y, z, c, o = {}) { return this.add(geoIco(SEGCAP < 8 ? 0 : o.d || 0), x, y, z, r * (o.sx || 1), r * (o.sy || 1), r * (o.sz || 1), c, o.rx || 0, o.ry || 0, o.rz || 0); }
  // printed label: flat quad facing +z (before rotation)
  label(w, h, x, y, z, uv, o = {}) { return this.add(geoPlane(), x, y, z, w, h, 1, o.c || '#ffffff', o.rx || 0, o.ry || 0, o.rz || 0, uv); }
  // printed label wrapped around the front of a cylinder (axis y)
  wrap(r, h, x, y, z, uv, o = {}) { return this.add(geoWrap(sg(o.seg || 10), o.arc || PI), x, y, z, r * (o.sx || 1), h, r * (o.sz || 1), o.c || '#ffffff', o.rx || 0, o.ry || 0, o.rz || 0, uv); }
  // thin bar between two points (for wire baskets, frames, arms)
  bar(a, b, t, c, round = false) {
    const d = new V3().subVectors(b, a), len = d.length();
    const q = new T.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize());
    const tt = round ? t * 0.5 : t; // cylinders have radius 1 → halve
    const m = new T.Matrix4().compose(new V3().addVectors(a, b).multiplyScalar(0.5), q, new V3(tt, len, tt));
    this.parts.push({ geo: round ? geoCyl(6) : geoBox(), m, color: c instanceof T.Color ? c : new T.Color(c), uv: null });
    return this;
  }
  // copy another Obj in with a transform
  put(other, x, y, z, ry = 0, s = 1, rx = 0, rz = 0) {
    const m = matAt(x, y, z, ry, s, rx, rz);
    for (const pt of other.parts) this.parts.push({ geo: pt.geo, m: new T.Matrix4().multiplyMatrices(m, pt.m), color: pt.color, uv: pt.uv });
    return this;
  }
}

// ---------- merges parts into one vertex-colored (+ atlas uv) geometry ----------
class MeshAcc {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.uv = []; }
  add(geo, matrix, color, uvr = null) {
    const g = geo.clone();
    g.applyMatrix4(matrix);
    g.computeVertexNormals();
    const p = g.attributes.position.array, n = g.attributes.normal.array, uv = g.attributes.uv ? g.attributes.uv.array : null;
    for (let i = 0; i < p.length; i++) { this.pos.push(p[i]); this.nor.push(n[i]); }
    const nv = p.length / 3;
    for (let i = 0; i < nv; i++) {
      this.col.push(color.r, color.g, color.b);
      if (uvr && uv) this.uv.push(uvr.u0 + uv[i * 2] * (uvr.u1 - uvr.u0), uvr.v0 + uv[i * 2 + 1] * (uvr.v1 - uvr.v0));
      else this.uv.push(WHITE_UV[0], WHITE_UV[1]);
    }
    g.dispose();
  }
  addObj(obj, matrix = null) {
    for (const pt of obj.parts) {
      if (matrix) { _m4.multiplyMatrices(matrix, pt.m); this.add(pt.geo, _m4, pt.color, pt.uv); }
      else this.add(pt.geo, pt.m, pt.color, pt.uv);
    }
    return this;
  }
  geometry() {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(this.uv, 2));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
  build(mat) { return new T.Mesh(this.geometry(), mat); }
}
const objGeo = (obj) => new MeshAcc().addObj(obj).geometry();
function matAt(x, y, z, ry = 0, s = 1, rx = 0, rz = 0) { return new T.Matrix4().compose(new V3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new V3(s, s, s)); }

// one material for (almost) everything: vertex colors × decal atlas
const VCMAT = new T.MeshLambertMaterial({ vertexColors: true, map: ATLAS });

// ---------- 2D colliders (top-down xz): axis-aligned boxes + circles ----------
const COLS = [];            // static boxes {x0,z0,x1,z1}
const DYN_BOXES = [];       // hazard boxes (debris, signs) – rebuilt per level
const DYN_CIRCLES = [];     // moving shoppers {x,z,r,ref}
function addCol(x0, z0, x1, z1, list = COLS) { const c = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) }; list.push(c); return c; }

