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

// ---------- object builder: list of colored parts in local space ----------
const _m4 = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _s = new V3(), _p = new V3();
class Obj {
  constructor() { this.parts = []; }
  add(geo, x, y, z, sx, sy, sz, color, rx = 0, ry = 0, rz = 0) {
    const m = new T.Matrix4().compose(new V3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new V3(sx, sy, sz));
    this.parts.push({ geo, m, color: color instanceof T.Color ? color : new T.Color(color) });
    return this;
  }
  // all positions are part centers
  box(w, h, d, x, y, z, c, o = {}) { return this.add(geoBox(), x, y, z, w, h, d, c, o.rx || 0, o.ry || 0, o.rz || 0); }
  cyl(r, h, x, y, z, c, o = {}) { return this.add(geoCyl(o.seg || 8, o.rt != null ? o.rt : 1), x, y, z, r * (o.sx || 1), h, r * (o.sz || 1), c, o.rx || 0, o.ry || 0, o.rz || 0); }
  sph(r, x, y, z, c, o = {}) { return this.add(geoSph(o.seg || 8), x, y, z, r * (o.sx || 1), r * (o.sy || 1), r * (o.sz || 1), c, o.rx || 0, o.ry || 0, o.rz || 0); }
  cone(r, h, x, y, z, c, o = {}) { return this.add(geoCone(o.seg || 8), x, y, z, r, h, r, c, o.rx || 0, o.ry || 0, o.rz || 0); }
  torus(r, tube, x, y, z, c, o = {}) { return this.add(geoTorus(tube, o.seg || 10, o.arc || TAU), x, y, z, r, r, r * (o.sz || 1), c, o.rx || 0, o.ry || 0, o.rz || 0); }
  ico(r, x, y, z, c, o = {}) { return this.add(geoIco(o.d || 0), x, y, z, r * (o.sx || 1), r * (o.sy || 1), r * (o.sz || 1), c, o.rx || 0, o.ry || 0, o.rz || 0); }
  // thin bar between two points (for wire baskets, frames, arms)
  bar(a, b, t, c, round = false) {
    const d = new V3().subVectors(b, a), len = d.length();
    const q = new T.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize());
    const tt = round ? t * 0.5 : t; // cylinders have radius 1 → halve
    const m = new T.Matrix4().compose(new V3().addVectors(a, b).multiplyScalar(0.5), q, new V3(tt, len, tt));
    this.parts.push({ geo: round ? geoCyl(6) : geoBox(), m, color: c instanceof T.Color ? c : new T.Color(c) });
    return this;
  }
}

// ---------- merges parts into one vertex-colored geometry ----------
class MeshAcc {
  constructor() { this.pos = []; this.nor = []; this.col = []; }
  add(geo, matrix, color) {
    const g = geo.clone();
    g.applyMatrix4(matrix);
    g.computeVertexNormals();
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i++) { this.pos.push(p[i]); this.nor.push(n[i]); }
    for (let i = 0; i < p.length / 3; i++) this.col.push(color.r, color.g, color.b);
    g.dispose();
  }
  addObj(obj, matrix = null) {
    for (const pt of obj.parts) {
      if (matrix) { _m4.multiplyMatrices(matrix, pt.m); this.add(pt.geo, _m4, pt.color); }
      else this.add(pt.geo, pt.m, pt.color);
    }
    return this;
  }
  geometry() {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
  build(mat) { return new T.Mesh(this.geometry(), mat); }
}
const objGeo = (obj) => new MeshAcc().addObj(obj).geometry();
const matAt = (x, y, z, ry = 0, s = 1, rx = 0, rz = 0) => new T.Matrix4().compose(new V3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new V3(s, s, s));

const VCMAT = new T.MeshLambertMaterial({ vertexColors: true });

// ---------- 2D colliders (top-down xz): axis-aligned boxes + circles ----------
const COLS = [];            // static boxes {x0,z0,x1,z1}
const DYN_BOXES = [];       // hazard boxes (debris, signs) – rebuilt per level
const DYN_CIRCLES = [];     // moving shoppers {x,z,r,ref}
function addCol(x0, z0, x1, z1, list = COLS) { const c = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) }; list.push(c); return c; }

// ---------- canvas text textures ----------
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
