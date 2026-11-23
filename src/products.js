// ============================================================
//  Shopping Drifters – products: low-poly models with printed labels + catalogue
//  Every shape is built standing on y=0, centered, front facing +z.
// ============================================================

// ---- printed labels (drawn into the decal atlas) ----
// p.lab = [brand, background, foreground, subline]
function drawLabel(p, g, x, y, w, h) {
  const [brand, bg, fg, sub] = p.lab;
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const a = w / h;
  // decorative swoosh in the foreground color
  g.globalAlpha = 0.22; g.fillStyle = fg;
  g.beginPath(); g.ellipse(x + w * 0.85, y + h * 1.05, w * 0.7, h * 0.55, -0.35, 0, TAU); g.fill();
  g.globalAlpha = 1;
  if (a >= 1.55) { // wide band (bottles, cans): icon left, text right
    const isz = h * 0.72;
    g.font = `${isz}px ${EMOJI_FONT}`; g.fillText(p.e, x + h * 0.55, y + h * 0.54);
    g.fillStyle = fg;
    const tx = x + h * 1.05 + (w - h * 1.05) / 2, tw = w - h * 1.2;
    fitText(g, brand, tx, y + h * (sub ? 0.4 : 0.52), tw, h * 0.42);
    if (sub) { g.globalAlpha = 0.9; fitText(g, sub, tx, y + h * 0.76, tw, h * 0.22, 700); g.globalAlpha = 1; }
  } else { // box front: brand on top, big picture, subline at the bottom
    g.fillStyle = fg;
    g.fillRect(x, y + h * 0.82, w, h * 0.18);
    fitText(g, brand, x + w / 2, y + h * 0.13, w * 0.9, Math.min(h * 0.16, w * 0.3));
    const isz = Math.min(w * 0.62, h * 0.5);
    g.font = `${isz}px ${EMOJI_FONT}`; g.fillText(p.e, x + w / 2, y + h * 0.49);
    if (sub) { g.fillStyle = bg; fitText(g, sub, x + w / 2, y + h * 0.915, w * 0.9, h * 0.11, 800); }
  }
  // thin frame
  g.strokeStyle = fg; g.globalAlpha = 0.35; g.lineWidth = Math.max(1, h * 0.03); g.strokeRect(x + 1, y + 1, w - 2, h - 2); g.globalAlpha = 1;
}
// one label per product+aspect (cached)
function lab(p, aspect, big = false) {
  const k = aspect.toFixed(2);
  p.labs = p.labs || {};
  if (!p.labs[k]) p.labs[k] = atlasLabel(aspect, (g, x, y, w, h) => drawLabel(p, g, x, y, w, h), big, p.lab[1]);
  if (!p.mainLab) { p.mainLab = p.labs[k]; p.mainAspect = aspect; }
  return p.labs[k];
}
const shade = (c, k) => { const col = new T.Color(c); col.offsetHSL(0, 0, k); return col; };
const GLASS = '#cfe6ee', SILVER = '#c8ccd0', CARD = '#e9dcc0';

const SHAPES = {
  // ---------- drinks ----------
  bottle(o, p, s = 1) {
    const [body, cap] = p.c, r = 0.042 * s, S = (v) => v * s;
    o.cyl(r * 0.9, S(0.012), 0, S(0.006), 0, shade(body, -0.08), { seg: 10, rt: 1.1 });
    o.cyl(r, S(0.14), 0, S(0.082), 0, body, { seg: 10 });
    o.cyl(r, S(0.055), 0, S(0.18), 0, body, { seg: 10, rt: 0.45 });
    o.cyl(r * 0.45, S(0.04), 0, S(0.225), 0, body, { seg: 8 });
    o.cyl(r * 0.56, S(0.008), 0, S(0.236), 0, cap, { seg: 10 });
    o.cyl(r * 0.5, S(0.026), 0, S(0.252), 0, cap, { seg: 10 });
    o.cyl(r * 0.42, S(0.004), 0, S(0.266), 0, shade(cap, 0.12), { seg: 10 });
    const lh = S(0.075), lr = r * 1.015;
    o.cyl(lr * 0.998, lh, 0, S(0.095), 0, p.lab[1], { seg: 10 });
    o.wrap(lr * 1.003, lh, 0, S(0.095), 0, lab(p, (PI * lr) / lh), { seg: 10 });
    return 0.1 * s;
  },
  can(o, p, s = 1) {
    const r = 0.034 * s, h = 0.115 * s;
    o.cyl(r, 0.012 * s, 0, 0.006 * s, 0, SILVER, { seg: 10, rt: 1.12 });
    o.cyl(r * 0.999, h - 0.024 * s, 0, h / 2, 0, p.lab[1], { seg: 10 });
    o.wrap(r * 1.004, h - 0.024 * s, 0, h / 2, 0, lab(p, (PI * r) / (h - 0.024 * s)), { seg: 10 });
    o.cyl(r, 0.012 * s, 0, h - 0.006 * s, 0, SILVER, { seg: 10, rt: 0.86 });
    o.cyl(r * 0.84, 0.004, 0, h + 0.001, 0, '#e2e5e8', { seg: 10 });
    o.box(0.012 * s, 0.003, 0.02 * s, 0, h + 0.004, r * 0.3, '#9aa0a6');
    return 0.078 * s;
  },
  flatcan(o, p) { // tuna / cat food: stacks of flat cans
    const uv = lab(p, (PI * 0.045) / 0.03);
    for (let i = 0; i < 3; i++) {
      const y = i * 0.04;
      o.cyl(0.045, 0.038, 0, y + 0.019, 0, SILVER, { seg: 10 });
      o.wrap(0.0455, 0.03, 0, y + 0.02, 0, uv, { seg: 8 });
    }
    o.cyl(0.037, 0.003, 0, 0.1215, 0, '#e2e5e8', { seg: 10 });
    return 0.1;
  },
  box(o, p, w = 0.16, h = 0.24, d = 0.07) {
    o.box(w, h, d, 0, h / 2, 0, p.lab[1]);
    o.label(w * 0.995, h * 0.995, 0, h / 2, d / 2 + 0.0008, lab(p, w / h, w * h > 0.02));
    // side panel + flap lines
    o.box(0.002, h * 0.6, d * 0.8, w / 2 + 0.0008, h * 0.5, 0, p.lab[2]);
    o.box(w * 1.002, 0.004, d * 1.002, 0, h - 0.012, 0, shade(p.lab[1], -0.12));
    o.box(w * 1.002, 0.004, d * 1.002, 0, 0.01, 0, shade(p.lab[1], -0.12));
    return w + 0.02;
  },
  carton(o, p, s = 1) { // milk / juice carton with gable top + screw cap
    const w = 0.07 * s, h = 0.17 * s, bg = p.lab[1];
    o.box(w, h, w, 0, h / 2, 0, bg);
    o.add(geoCyl(3), 0, h + 0.0135 * s, 0, w * 0.58, w, w * 0.42, shade(bg, -0.05), 0, 0, PI / 2);
    o.box(w * 1.0, 0.012 * s, 0.006, 0, h + 0.032 * s, 0, shade(bg, -0.1));
    o.cyl(0.013 * s, 0.014 * s, 0, h + 0.02 * s, w * 0.2, p.c[1], { seg: 8, rx: 0.6 });
    const uv = lab(p, (w * 0.98) / (h * 0.96));
    o.label(w * 0.98, h * 0.96, 0, h * 0.5, w / 2 + 0.0008, uv);
    o.label(w * 0.98, h * 0.96, w / 2 + 0.0008, h * 0.5, 0, uv, { ry: PI / 2 });
    return w + 0.025;
  },
  jar(o, p, s = 1) {
    const r = 0.04 * s, [fill, lid] = p.c;
    o.cyl(r * 0.95, 0.008 * s, 0, 0.004 * s, 0, GLASS, { seg: 10 });
    o.cyl(r, 0.074 * s, 0, 0.045 * s, 0, fill, { seg: 10 });
    o.cyl(r, 0.012 * s, 0, 0.088 * s, 0, GLASS, { seg: 10, rt: 0.85 });
    o.cyl(r * 0.92, 0.022 * s, 0, 0.105 * s, 0, lid, { seg: 12 });
    o.cyl(r * 0.8, 0.003, 0, 0.1165 * s, 0, shade(lid, 0.1), { seg: 12 });
    const lh = 0.045 * s;
    o.cyl(r * 1.003, lh, 0, 0.046 * s, 0, p.lab[1], { seg: 10 });
    o.wrap(r * 1.008, lh, 0, 0.046 * s, 0, lab(p, (PI * r) / lh), { seg: 10 });
    return 0.095 * s;
  },
  bag(o, p, w = 0.16, h = 0.22) { // crisp bag / pouch
    const bg = p.lab[1], dk = shade(bg, -0.08), d = 0.055;
    o.box(w * 0.97, h * 0.8, d, 0, h * 0.5, 0, bg);
    o.add(geoCyl(4), 0, h * 0.94, 0, w * 0.69, h * 0.12, d * 0.72, dk, 0, PI / 4, 0); // tapered ends
    o.add(geoCyl(4, 1.4), 0, h * 0.06, 0, w * 0.49, h * 0.12, d * 0.5, dk, 0, PI / 4, 0);
    for (let i = 0; i < 7; i++) { // crimped seams
      const x = -w * 0.45 + (i * w * 0.9) / 6;
      o.box(w * 0.14, 0.014, 0.006, x, h - 0.006, 0, dk, { rz: i % 2 ? 0.5 : -0.5 });
      o.box(w * 0.14, 0.014, 0.006, x, 0.006, 0, dk, { rz: i % 2 ? 0.5 : -0.5 });
    }
    o.label(w * 0.92, h * 0.76, 0, h * 0.5, d / 2 + 0.0008, lab(p, (w * 0.92) / (h * 0.76), true));
    return w + 0.015;
  },
  bar(o, p) { // chocolate bars standing in a display tray
    o.box(0.13, 0.035, 0.12, 0, 0.0175, 0, p.lab[2]);
    o.label(0.13, 0.035, 0, 0.0175, 0.0608, lab(p, 0.13 / 0.035));
    const uv = lab(p, 0.11 / 0.16);
    for (let i = 0; i < 3; i++) {
      const z = -0.035 + i * 0.035;
      o.box(0.11, 0.16, 0.018, 0, 0.11, z, p.lab[1], { rx: -0.12 });
      o.box(0.112, 0.012, 0.02, 0, 0.11 + 0.074, z - 0.009, SILVER, { rx: -0.12 });
      o.label(0.11, 0.16, 0, 0.11 + 0.0, z + 0.0095, uv, { rx: -0.12 });
    }
    return 0.14;
  },
  cups(o, p) { // 2x2 yogurt cups
    const uv = lab(p, (PI * 0.036) / 0.05);
    for (const x of [-0.042, 0.042]) for (const z of [-0.042, 0.042]) {
      o.cyl(0.036, 0.075, x, 0.0375, z, p.lab[1], { seg: 10, rt: 1.08 });
      if (z > 0) o.wrap(0.0392, 0.05, x, 0.04, z, uv, { seg: 10 });
      o.cyl(0.046, 0.005, x, 0.078, z, p.lab[2], { seg: 10 });
      o.cyl(0.03, 0.002, x, 0.081, z, shade(p.lab[2], 0.15), { seg: 10 });
    }
    return 0.18;
  },
  tp(o, p, big = 0) { // toilet paper / kitchen roll pack
    const r = big ? 0.06 : 0.05, h = big ? 0.22 : 0.1, ny = big ? 1 : 2;
    for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) for (let j = 0; j < ny; j++) {
      const x = -r + i * 2 * r, z = -r + k * 2 * r, y = h / 2 + j * h;
      o.cyl(r, h, x, y, z, '#fbfbfb', { seg: 8 });
      if (k === 1 || j === ny - 1) o.cyl(r * 0.32, h + 0.002, x, y, z, '#b8946a', { seg: 6 });
          }
    const H = h * ny;
    o.box(4 * r + 0.006, H * 0.34, 4 * r + 0.006, 0, H * 0.52, 0, p.lab[1]);
    o.label(4 * r * 0.9, H * 0.32, 0, H * 0.52, 2 * r + 0.004, lab(p, (4 * r * 0.9) / (H * 0.32)));
    o.box(0.02, 0.05, 0.02, 0, H + 0.02, 0, p.lab[1]); // carry handle
    o.box(0.08, 0.012, 0.02, 0, H + 0.045, 0, p.lab[1]);
    return 4 * r + 0.03;
  },
  flask(o, p, s = 1) { // shampoo / dish soap bottle
    const [body, cap] = p.c;
    o.cyl(0.042 * s, 0.15 * s, 0, 0.075 * s, 0, body, { seg: 10, sz: 0.55 });
    o.cyl(0.042 * s, 0.03 * s, 0, 0.165 * s, 0, body, { seg: 10, sz: 0.55, rt: 0.55 });
    o.cyl(0.018 * s, 0.03 * s, 0, 0.195 * s, 0, cap, { seg: 8 });
    o.box(0.012 * s, 0.012 * s, 0.024 * s, 0, 0.207 * s, 0.01 * s, cap);
    o.label(0.06 * s, 0.09 * s, 0, 0.075 * s, 0.0235 * s, lab(p, 0.66));
    return 0.095 * s;
  },
  spray(o, p) {
    const [body, cap] = p.c;
    o.cyl(0.026, 0.008, 0, 0.004, 0, SILVER, { seg: 10 });
    o.cyl(0.026, 0.13, 0, 0.073, 0, p.lab[1], { seg: 10 });
    o.wrap(0.0263, 0.1, 0, 0.07, 0, lab(p, (PI * 0.026) / 0.1), { seg: 10 });
    o.cyl(0.026, 0.015, 0, 0.145, 0, SILVER, { seg: 10, rt: 0.7 });
    o.cyl(0.022, 0.035, 0, 0.17, 0, cap, { seg: 10, rt: 0.85 });
    o.box(0.008, 0.008, 0.01, 0, 0.18, 0.02, '#222');
    return 0.065;
  },
  tube(o, p) { // toothpaste boxes lying on their side
    const uv = lab(p, 0.18 / 0.045);
    for (let i = 0; i < 2; i++) {
      o.box(0.18, 0.045, 0.045, 0, 0.0225 + i * 0.046, 0, p.lab[1]);
      o.label(0.18, 0.045, 0, 0.0225 + i * 0.046, 0.0233, uv);
    }
    return 0.2;
  },
  soap(o, p) {
    const uv = lab(p, 0.09 / 0.03);
    for (let i = 0; i < 3; i++) {
      const y = 0.015 + i * 0.031;
      o.box(0.08, 0.03, 0.06, 0, y, 0, p.lab[1]);
      o.cyl(0.03, 0.06, 0.04, y, 0, p.lab[1], { rx: PI / 2, seg: 8, sx: 0.5 });
      o.cyl(0.03, 0.06, -0.04, y, 0, p.lab[1], { rx: PI / 2, seg: 8, sx: 0.5 });
      o.label(0.08, 0.026, 0, y, 0.0305, uv);
    }
    return 0.11;
  },
  sponge(o, p) {
    const [a, b] = p.c;
    for (let i = 0; i < 3; i++) { o.box(0.1, 0.028, 0.068, 0, 0.014 + i * 0.05, 0, a); o.box(0.1, 0.02, 0.068, 0, 0.038 + i * 0.05, 0, b); }
    o.box(0.04, 0.15, 0.072, 0, 0.075, 0, p.lab[1]);
    o.label(0.04, 0.15, 0, 0.075, 0.0368, lab(p, 0.04 / 0.15));
    return 0.11;
  },
  sack(o, p, w = 0.2, h = 0.3) { // dog food, flour, sugar, rice
    const bg = p.lab[1], d = w * 0.45;
    o.box(w, h * 0.84, d, 0, h * 0.42, 0, bg);
    o.box(w * 0.96, h * 0.1, d * 0.5, 0, h * 0.88, 0, shade(bg, -0.06));
    o.box(w * 0.98, h * 0.05, d * 0.25, 0, h * 0.95, 0, shade(bg, -0.12));
    o.box(w * 1.004, 0.006, d * 1.004, 0, h * 0.84 - 0.003, 0, shade(bg, -0.1));
    o.label(w * 0.96, h * 0.74, 0, h * 0.43, d / 2 + 0.0008, lab(p, (w * 0.96) / (h * 0.74), w > 0.15));
    return w + 0.02;
  },
  squeeze(o, p) { // upside-down ketchup bottle standing on its cap
    const [body, cap] = p.c;
    o.cyl(0.03, 0.03, 0, 0.015, 0, cap, { seg: 10 });
    o.cyl(0.036, 0.11, 0, 0.085, 0, body, { seg: 10, sz: 0.75, rt: 1.1 });
    o.sph(0.04, 0, 0.14, 0, body, { sy: 0.5, sz: 0.75, seg: 10 });
    o.label(0.05, 0.065, 0, 0.085, 0.0285, lab(p, 0.77));
    return 0.085;
  },
  crate(o, p) { // drinks crate with bottles
    const [crate, cap, glass] = p.c;
    o.box(0.32, 0.2, 0.22, 0, 0.1, 0, crate);
    for (const s of [-1, 1]) o.box(0.004, 0.035, 0.08, s * 0.161, 0.16, 0, '#111'); // handle holes
    o.box(0.322, 0.012, 0.222, 0, 0.205, 0, shade(crate, -0.1));
    o.label(0.2, 0.08, 0, 0.1, 0.1105, lab(p, 2.5));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const x = -0.12 + i * 0.08, z = -0.07 + j * 0.07;
      o.cyl(0.02, 0.06, x, 0.24, z, glass, { seg: 6, rt: 0.5 });
      o.cyl(0.009, 0.02, x, 0.28, z, glass, { seg: 6 });
      o.cyl(0.011, 0.008, x, 0.292, z, cap, { seg: 6 });
    }
    return 0.34;
  },
  // ---------- bakery ----------
  loaf(o, p) {
    const [crust, dark] = p.c;
    o.box(0.26, 0.004, 0.16, 0, 0.002, 0, '#efe6d2'); // paper
    o.sph(1, 0, 0.055, 0, crust, { sx: 0.12, sy: 0.068, sz: 0.075, seg: 10 });
    o.sph(1, 0, 0.07, 0, shade(crust, 0.06), { sx: 0.1, sy: 0.058, sz: 0.06, seg: 10 });
    for (let i = -1; i <= 1; i++) o.box(0.014, 0.012, 0.085, i * 0.045, 0.124, 0, dark, { rz: 0.25, ry: 0.35 });
    for (let i = 0; i < 8; i++) o.box(0.008, 0.003, 0.008, -0.07 + i * 0.02, 0.125 - Math.abs(i - 3.5) * 0.006, (i % 3 - 1) * 0.02, '#f4efe2');
    return 0.27;
  },
  toast(o, p) {
    const bread = p.c[0];
    o.box(0.2, 0.085, 0.11, 0, 0.0425, 0, bread);
    o.cyl(0.055, 0.2, 0, 0.085, 0, shade(bread, 0.05), { rz: PI / 2, seg: 10 });
    o.box(0.17, 0.075, 0.114, 0, 0.06, 0, p.lab[1]); // printed bag band
    o.label(0.17, 0.075, 0, 0.06, 0.0575, lab(p, 0.17 / 0.075));
    o.cone(0.03, 0.045, 0.12, 0.07, 0, '#e4dccb', { rz: -PI / 2, seg: 6 }); // twisted bag end
    o.box(0.008, 0.035, 0.008, 0.11, 0.07, 0, p.lab[2]); // twist tie
    return 0.25;
  },
  croissant(o, p) {
    const c = p.c[0];
    o.box(0.25, 0.01, 0.17, 0, 0.005, 0, '#d9d2c4');
    const one = (cx, cz, ry) => {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1) - 0.5) * 2.2, rr = 0.034 * (1 - Math.abs(t) * 0.38);
        const x = Math.sin(t) * 0.065, z = Math.cos(t) * 0.065 - 0.065;
        const px = cx + x * Math.cos(ry) + z * Math.sin(ry), pz = cz - x * Math.sin(ry) + z * Math.cos(ry);
        o.sph(rr, px, 0.01 + rr * 0.8, pz, i % 2 ? shade(c, -0.07) : c, { sx: 1.25, seg: 8, ry: ry - t });
      }
    };
    one(-0.055, 0.035, 0.2); one(0.06, -0.015, -0.3);
    return 0.26;
  },
  baguette(o, p) {
    const [crust] = p.c;
    for (let i = 0; i < 3; i++) {
      const x = -0.04 + i * 0.04, rz = (i - 1) * 0.12;
      o.cyl(0.022, 0.34, x, 0.2, 0, crust, { seg: 7, rz, rt: 0.85 });
      for (let k = 0; k < 3; k++) o.box(0.03, 0.006, 0.01, x + Math.sin(-rz) * (0.26 + k * 0.05 - 0.2), 0.26 + k * 0.05, 0.02, shade(crust, -0.15), { rz: 0.5 + rz });
    }
    o.box(0.16, 0.16, 0.1, 0, 0.08, 0, p.lab[1]); // paper bag
    o.box(0.162, 0.02, 0.102, 0, 0.15, 0, shade(p.lab[1], -0.08));
    o.label(0.14, 0.12, 0, 0.075, 0.0508, lab(p, 1.16));
    return 0.18;
  },
  // ---------- dairy / fridge ----------
  wheel(o, p) { // cheese wheel + a wedge in front
    const [cheese, rind] = p.c;
    o.cyl(0.09, 0.07, 0, 0.035, -0.01, rind, { seg: 12 });
    o.cyl(0.085, 0.072, 0, 0.035, -0.01, cheese, { seg: 12 });
    o.wrap(0.0905, 0.035, 0, 0.035, -0.01, lab(p, (PI * 0.09) / 0.035), { seg: 12 });
    // wedge (triangular prism)
    o.add(geoCyl(3), 0.02, 0.022, 0.07, 0.035, 0.044, 0.05, cheese, 0, PI / 2, 0);
    for (const [x, y, z] of [[0.01, 0.03, 0.09], [0.03, 0.018, 0.085]]) o.sph(0.006, x, y, z, shade(cheese, -0.15), { seg: 5 });
    return 0.2;
  },
  eggs(o, p) {
    const [card, egg] = p.c;
    o.box(0.2, 0.045, 0.1, 0, 0.0225, 0, card);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) o.sph(0.021, -0.066 + i * 0.066, 0.06, -0.024 + j * 0.048, egg, { sy: 1.3, seg: 8 });
    // lid flipped open at the back with the printed top
    o.box(0.2, 0.008, 0.1, 0, 0.09, -0.08, card, { rx: -1.2 });
    o.label(0.19, 0.09, 0, 0.088, -0.075, lab(p, 2.1), { rx: -1.2 + PI / 2 });
    o.label(0.2, 0.045, 0, 0.0225, 0.0508, lab(p, 4.4));
    return 0.22;
  },
  butter(o, p) {
    const uv = lab(p, 0.1 / 0.04);
    for (let i = 0; i < 2; i++) {
      o.box(0.1, 0.04, 0.06, 0, 0.02 + i * 0.042, 0, p.lab[1]);
      o.label(0.1, 0.04, 0, 0.02 + i * 0.042, 0.0308, uv);
      o.box(0.102, 0.004, 0.062, 0, 0.002 + i * 0.042, 0, SILVER);
    }
    return 0.11;
  },
  tray(o, p, kind = '') { // meat / sausages / chicken in a tray with film
    const meat = p.c[0];
    o.box(0.2, 0.012, 0.14, 0, 0.006, 0, '#f2f2f2');
    for (const [w, d, x, z] of [[0.2, 0.006, 0, 0.067], [0.2, 0.006, 0, -0.067], [0.006, 0.14, 0.097, 0], [0.006, 0.14, -0.097, 0]]) o.box(w, 0.03, d, x, 0.02, z, '#e8e8e8');
    if (kind === 'saus') for (let i = 0; i < 4; i++) { o.cyl(0.015, 0.16, 0, 0.03, -0.045 + i * 0.03, meat, { rz: PI / 2, seg: 8 }); for (const s of [-1, 1]) o.sph(0.015, s * 0.08, 0.03, -0.045 + i * 0.03, meat, { seg: 6 }); }
    else if (kind === 'chick') {
      o.sph(0.065, 0, 0.05, 0, meat, { sx: 1.2, sy: 0.7, seg: 9 });
      for (const s of [-1, 1]) { o.sph(0.028, s * 0.065, 0.04, 0.035, meat, { sz: 1.4, seg: 7 }); o.cyl(0.008, 0.03, s * 0.075, 0.04, 0.07, '#fff4e0', { rx: PI / 2, seg: 5 }); }
    } else {
      for (let i = 0; i < 3; i++) o.sph(1, -0.04 + i * 0.04, 0.025 + i * 0.006, -0.01 + i * 0.012, i % 2 ? shade(meat, -0.06) : meat, { sx: 0.06, sy: 0.012, sz: 0.05, seg: 8 });
    }
    o.box(0.19, 0.002, 0.13, 0, 0.062, 0, '#f4fbff'); // film
    o.label(0.08, 0.05, 0.05, 0.035, 0.0704, lab(p, 1.6));
    return 0.22;
  },
  salami(o, p) {
    const [skin, cut] = p.c;
    o.cyl(0.035, 0.2, 0, 0.035, 0, skin, { rz: PI / 2, seg: 10 });
    o.sph(0.035, -0.1, 0.035, 0, skin, { sx: 0.4, seg: 8 });
    o.cyl(0.034, 0.004, 0.101, 0.035, 0, cut, { rz: PI / 2, seg: 10 });
    for (const [y, z] of [[0.045, 0.01], [0.025, -0.012], [0.04, -0.015], [0.028, 0.014]]) o.sph(0.004, 0.103, y, z, '#fff4f0', { seg: 4 });
    for (let i = 0; i < 5; i++) o.torus(0.0355, 0.05, -0.08 + i * 0.04, 0.035, 0, '#e8dcc0', { ry: PI / 2, seg: 10 });
    o.box(0.06, 0.04, 0.003, -0.02, 0.06, 0.036, '#fff', { rx: -0.3 });
    o.label(0.06, 0.04, -0.02, 0.06, 0.0378, lab(p, 1.5), { rx: -0.3 });
    return 0.24;
  },
  pizza(o, p) {
    for (let i = 0; i < 3; i++) o.box(0.28, 0.03, 0.28, 0, 0.015 + i * 0.031, 0, p.lab[1]);
    o.label(0.27, 0.27, 0, 0.0935, 0, lab(p, 1, true), { rx: -PI / 2 });
    const side = lab(p, 0.28 / 0.03);
    for (let i = 0; i < 3; i++) o.label(0.28, 0.028, 0, 0.015 + i * 0.031, 0.1408, side);
    return 0.3;
  },
  tub(o, p) { // ice cream
    o.cyl(0.07, 0.085, 0, 0.0425, 0, p.lab[1], { seg: 12 });
    o.wrap(0.0705, 0.06, 0, 0.045, 0, lab(p, (PI * 0.0705) / 0.06), { seg: 12 });
    o.cyl(0.08, 0.018, 0, 0.094, 0, p.lab[2], { seg: 12 });
    o.cyl(0.07, 0.003, 0, 0.104, 0, shade(p.lab[2], 0.12), { seg: 12 });
    return 0.17;
  },
  // ---------- produce: slatted wooden crate full of stuff ----------
  crateOf(o, p, kind, ar) {
    const wood = '#c08a50', dark = '#8a5a32';
    o.box(0.46, 0.012, 0.34, 0, 0.006, 0, dark);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 2; k++) o.box(0.46, 0.035, 0.01, 0, 0.03 + k * 0.05, s * 0.165, wood);
      for (let k = 0; k < 2; k++) o.box(0.01, 0.035, 0.34, s * 0.225, 0.03 + k * 0.05, 0, wood);
      for (const t of [-1, 1]) o.box(0.022, 0.1, 0.022, s * 0.22, 0.05, t * 0.16, dark);
    }
    const [c0, c1] = p.c;
    rng = mulberry32(kind.length * 31 + 7);
    if (kind === 'ball') { // apples / tomatoes
      const r = ar || 0.04, tom = p.id === 'tomaten';
      const put = (x, y, z) => {
        const col = shade(rng() < 0.35 ? c1 : c0, R(-0.05, 0.05));
        o.sph(r, x, y, z, col, { seg: 8, sy: tom ? 0.85 : 0.95 });
        if (tom) { o.cone(r * 0.55, 0.008, x, y + r * 0.85, z, '#2f8a2f', { seg: 5 }); }
        else { o.cyl(0.003, 0.018, x, y + r * 0.95, z, '#5a3a1a', { seg: 4, rz: 0.3 }); if (rng() < 0.3) o.box(0.018, 0.002, 0.01, x + 0.008, y + r * 0.98, z, '#3f9b3a', { ry: 0.6 }); }
      };
      for (let x = -0.18; x <= 0.181; x += r * 2.05) for (let z = -0.12; z <= 0.121; z += r * 2.05) put(x + R(-0.006, 0.006), 0.012 + r * 0.9, z);
      for (let x = -0.14; x <= 0.141; x += r * 2.1) for (let z = -0.08; z <= 0.081; z += r * 2.1) put(x, 0.012 + r * 2.5, z + R(-0.01, 0.01));
    } else if (kind === 'melon') {
      for (const x of [-0.11, 0.11]) {
        o.sph(0.12, x, 0.13, 0, c0, { sx: 0.95, sz: 1.15, seg: 10 });
        for (let k = 0; k < 6; k++) o.sph(0.121, x, 0.13, 0, c1, { sx: 0.14, sz: 1.16, ry: (k * PI) / 6, seg: 10 });
        o.cyl(0.006, 0.02, x, 0.25, 0.02, '#6b5a2a', { seg: 4, rx: 0.4 });
      }
    } else if (kind === 'banana') {
      const bunch = (bx, bz, ry) => {
        for (let b = 0; b < 4; b++) {
          const off = (b - 1.5) * 0.028, pts = [];
          for (let k = 0; k <= 4; k++) { const t = k / 4, ang = -0.9 + t * 1.8; pts.push(new V3(Math.sin(ang) * 0.09, 0.03 + (1 - Math.cos(ang)) * 0.06 + Math.abs(off) * 0.3, off)); }
          const m = matAt(bx, 0.012, bz, ry);
          for (let k = 0; k < 4; k++) {
            const a = pts[k].clone().applyMatrix4(m), bb = pts[k + 1].clone().applyMatrix4(m);
            o.bar(a, bb, k === 0 || k === 3 ? 0.022 : 0.03, k === 0 ? '#6b8a2a' : shade(c0, R(-0.04, 0.03)), true);
          }
          const tip = pts[4].clone().applyMatrix4(m); o.sph(0.008, tip.x, tip.y, tip.z, '#4a3a1a', { seg: 4 });
        }
      };
      bunch(-0.1, -0.06, 0.2); bunch(0.1, 0.05, -0.3); bunch(0, 0.0, 1.4);
    } else if (kind === 'carrot') {
      for (let i = 0; i < 12; i++) {
        const x = -0.18 + (i % 6) * 0.07, z = -0.06 + Math.floor(i / 6) * 0.12, y = 0.04 + Math.floor(i / 6) * 0.025;
        o.cone(0.024, 0.2, x, y, z, shade(c0, R(-0.04, 0.04)), { rx: PI / 2, rz: R(-0.15, 0.15), seg: 7 });
        for (let k = -1; k <= 1; k++) o.cone(0.012, 0.08, x + k * 0.008, y + 0.02, z - 0.13, c1, { rx: -PI / 2 + 0.5, rz: k * 0.35, seg: 4 });
      }
    } else if (kind === 'broc') {
      for (let i = 0; i < 6; i++) {
        const x = -0.14 + (i % 3) * 0.14, z = -0.07 + Math.floor(i / 3) * 0.14;
        o.cyl(0.018, 0.08, x, 0.05, z, c1, { seg: 6, rt: 0.7 });
        for (let k = 0; k < 6; k++) o.ico(0.032, x + Math.cos(k * 1.05) * 0.035, 0.11 + (k % 2) * 0.01, z + Math.sin(k * 1.05) * 0.035, shade(c0, (k % 3) * 0.03 - 0.03));
        o.ico(0.04, x, 0.13, z, c0);
      }
    }
    return 0.48;
  },
  // ---------- toys / pets ----------
  duck(o, p) {
    const [y, b] = p.c;
    o.sph(0.06, 0, 0.05, -0.005, y, { sx: 1.05, sy: 0.8, sz: 1.3, seg: 10 });
    o.sph(0.03, 0, 0.085, -0.075, y, { sy: 1.2, seg: 7, rx: -0.6 }); // tail
    o.sph(0.042, 0, 0.12, 0.04, y, { seg: 10 });
    o.sph(0.022, 0, 0.11, 0.085, b, { sx: 1.3, sy: 0.45, sz: 1.1, seg: 7 });
    o.sph(0.018, 0, 0.1, 0.08, shade(b, -0.1), { sx: 1.2, sy: 0.35, seg: 6 });
    for (const s of [-1, 1]) {
      o.sph(0.011, s * 0.024, 0.132, 0.068, '#ffffff', { seg: 6 });
      o.sph(0.006, s * 0.026, 0.133, 0.077, '#111111', { seg: 5 });
      o.sph(0.03, s * 0.05, 0.055, -0.01, shade(y, -0.05), { sx: 0.45, sz: 1.2, seg: 7 }); // wings
    }
    return 0.14;
  },
  ball(o, p) {
    o.ico(0.1, 0, 0.1, 0, p.c[0], { d: 1 });
    const g = new T.IcosahedronGeometry(1, 0), v = g.attributes.position, seen = new Set();
    for (let i = 0; i < v.count; i++) {
      const d = new V3(v.getX(i), v.getY(i), v.getZ(i)).normalize(), k = d.toArray().map((n) => n.toFixed(2)).join();
      if (seen.has(k)) continue; seen.add(k);
      const q = new T.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d), e = new T.Euler().setFromQuaternion(q);
      o.add(geoCyl(5), d.x * 0.093, 0.1 + d.y * 0.093, d.z * 0.093, 0.035, 0.016, 0.035, p.c[1], e.x, e.y, e.z);
    }
    return 0.22;
  },
  teddy(o, p) {
    const [fur, dark, bow] = p.c, light = shade(fur, 0.15);
    o.sph(0.07, 0, 0.08, 0, fur, { sy: 1.12, seg: 9 });
    o.sph(0.045, 0, 0.075, 0.035, light, { sy: 1.1, sz: 0.6, seg: 8 });
    o.sph(0.056, 0, 0.19, 0.01, fur, { seg: 9 });
    o.sph(0.025, 0, 0.18, 0.055, light, { sy: 0.8, seg: 7 });
    o.sph(0.009, 0, 0.19, 0.077, dark, { seg: 5 });
    for (const s of [-1, 1]) {
      o.sph(0.022, s * 0.045, 0.24, 0, fur, { sz: 0.6, seg: 7 }); o.sph(0.012, s * 0.045, 0.24, 0.008, light, { sz: 0.5, seg: 6 });
      o.sph(0.028, s * 0.075, 0.11, 0.025, fur, { sy: 1.4, seg: 7, rz: s * 0.4 });
      o.sph(0.032, s * 0.045, 0.025, 0.035, fur, { sz: 1.3, seg: 7 }); o.sph(0.02, s * 0.045, 0.025, 0.075, light, { sz: 0.3, seg: 6 });
      o.sph(0.008, s * 0.02, 0.205, 0.055, dark, { seg: 5 });
      o.sph(0.014, s * 0.016, 0.145, 0.05, bow, { sx: 1.3, seg: 5 });
    }
    return 0.18;
  },
  toycar(o, p) { // blister pack: card + plastic bubble + car
    o.box(0.18, 0.2, 0.012, 0, 0.1, -0.03, p.lab[1]);
    o.label(0.18, 0.2, 0, 0.1, -0.0238, lab(p, 0.9, true));
    for (const [w, h, x, y] of [[0.15, 0.006, 0, 0.022], [0.15, 0.006, 0, 0.098], [0.006, 0.08, -0.075, 0.06], [0.006, 0.08, 0.075, 0.06]]) o.box(w, h, 0.05, x, y, 0, '#e8f6ff');
    const car = p.c[0];
    o.box(0.12, 0.025, 0.04, 0, 0.05, 0.004, car);
    o.box(0.02, 0.012, 0.042, 0.05, 0.05, 0.004, '#ffd21f');
    o.box(0.06, 0.022, 0.036, -0.01, 0.073, 0.004, car);
    o.box(0.062, 0.016, 0.038, -0.01, 0.073, 0.004, '#9fd4ef');
    for (const x of [-0.04, 0.04]) o.cyl(0.013, 0.044, x, 0.038, 0.004, '#222', { rx: PI / 2, seg: 8 });
    return 0.2;
  },
  bone(o, p) {
    const c = p.c[0];
    o.box(0.2, 0.014, 0.1, 0, 0.007, 0, p.lab[1]);
    o.box(0.2, 0.12, 0.008, 0, 0.074, -0.046, p.lab[1]);
    o.label(0.2, 0.12, 0, 0.074, -0.0415, lab(p, 0.2 / 0.12));
    for (const z of [-0.018, 0.026]) {
      o.cyl(0.016, 0.13, 0, 0.03, z, c, { rz: PI / 2, seg: 8 });
      for (const x of [-0.07, 0.07]) for (const dz of [-0.013, 0.013]) o.sph(0.019, x, 0.03, z + dz, c, { seg: 7 });
    }
    return 0.21;
  },
};

// ---- catalogue: id, name, emoji, price, shape, model colors, [brand, label bg, label fg, subline], shape args ----
const P = (id, n, e, price, shape, c, lab, ...a) => ({ id, n, e, price, shape, c, lab, a });
const PRODUCTS = [
  // Getränke
  P('cola', 'Cola', '🥤', 1.29, 'bottle', ['#3a1206', '#d0161b'], ['DRIFT COLA', '#d0161b', '#ffffff', 'Original'], 1.15),
  P('wasser', 'Wasser', '💧', 0.49, 'bottle', ['#a9dcf2', '#2a62c9'], ['Quellblau', '#2a62c9', '#ffffff', 'still'], 1.15),
  P('limo', 'Zitronenlimo', '🍋', 1.19, 'bottle', ['#e9e46a', '#2e8b3a'], ['ZITRO', '#f7e65a', '#2e8b3a', 'Limonade'], 1.1),
  P('energy', 'Energy Drink', '⚡', 1.49, 'can', [], ['VOLT!', '#1d2a5c', '#8de03a', 'ENERGY'], 1.2),
  P('osaft', 'Orangensaft', '🍊', 1.79, 'carton', ['#ffa21f', '#ff6a00'], ['Sonnen-Saft', '#ff9a1f', '#ffffff', '100% Orange'], 1.25),
  P('asaft', 'Apfelsaft', '🍏', 1.59, 'carton', ['#7cc444', '#2e8b3a'], ['Apfelgold', '#7cc444', '#ffffff', 'naturtrüb'], 1.25),
  P('eistee', 'Eistee', '🧋', 0.99, 'carton', ['#e68b2a', '#4d7d2b'], ['Eistee', '#e68b2a', '#ffffff', 'Pfirsich'], 1.0),
  P('kiste', 'Wasserkiste', '📦', 5.99, 'crate', ['#2a62c9', '#2a62c9', '#a9dcf2'], ['Quellblau', '#2a62c9', '#ffffff', '12 x 1 L']),
  // Süßes
  P('schoko', 'Schokolade', '🍫', 1.19, 'bar', [], ['Kakaolino', '#6a2fa0', '#ffffff', 'Vollmilch']),
  P('gummi', 'Gummibärchen', '🐻', 1.09, 'bag', [], ['Gummi-Bande', '#f2c200', '#d6262b', 'Fruchtig!'], 0.15, 0.2),
  P('kekse', 'Kekse', '🍪', 1.49, 'box', [], ['Knusper', '#2a4fa8', '#ffd84a', 'Butterkekse'], 0.2, 0.08, 0.12),
  P('lolli', 'Lollis', '🍭', 0.89, 'jar', ['#ff7eb6', '#ffffff'], ['LOLLO', '#ff7eb6', '#ffffff', 'bunt'], 1.3),
  // Snacks
  P('chips', 'Chips', '🥔', 1.69, 'bag', [], ['CRUNCH', '#e8322b', '#ffd84a', 'Paprika'], 0.17, 0.24),
  P('popcorn', 'Popcorn', '🍿', 1.39, 'bag', [], ['POP!', '#2453c9', '#ffe066', 'süß'], 0.15, 0.22),
  P('nuesse', 'Erdnüsse', '🥜', 2.29, 'jar', ['#b8792d', '#c0161b'], ['Nussig', '#fbe6b8', '#b8792d', 'geröstet'], 1.15),
  P('salzst', 'Salzstangen', '🥨', 0.79, 'box', [], ['Salzis', '#1d7a3a', '#ffffff', 'knackig'], 0.08, 0.28, 0.06),
  // Frühstück
  P('muesli', 'Müsli', '🥣', 2.49, 'box', [], ['Morgen-Müsli', '#f6d36b', '#6b4226', 'Schoko'], 0.19, 0.27, 0.07),
  P('honig', 'Honig', '🍯', 3.49, 'jar', ['#e9a419', '#2a2a2a'], ['Bienchen', '#fff3c4', '#b07a00', 'Blütenhonig']),
  P('marmelade', 'Marmelade', '🍓', 1.99, 'jar', ['#b8142a', '#f4f4f4'], ['Erdbeer', '#ffffff', '#b8142a', 'Konfitüre']),
  P('creme', 'Schokocreme', '🌰', 2.79, 'jar', ['#5a3418', '#ffffff'], ['Nussli', '#ffffff', '#5a3418', 'Nuss-Nougat'], 1.15),
  // Backwaren
  P('brot', 'Brot', '🍞', 2.29, 'loaf', ['#b97b3a', '#8a5523'], ['Brot', '#f4efe2', '#b07a45', '']),
  P('toast', 'Toastbrot', '🥪', 1.29, 'toast', ['#e8c48a'], ['Toasty', '#2a7de1', '#ffd84a', 'Weizen']),
  P('croissant', 'Croissants', '🥐', 1.99, 'croissant', ['#d99a3e'], ['Croissant', '#f4efe2', '#b07a45', '']),
  P('baguette', 'Baguette', '🥖', 0.99, 'baguette', ['#d9a253'], ['Bäckerei', '#f4efe2', '#b07a45', 'ofenfrisch']),
  // Nudeln & Reis
  P('spaghetti', 'Spaghetti', '🍝', 0.99, 'box', [], ['Pasta Nonna', '#1f4fb8', '#ffffff', 'Spaghetti'], 0.08, 0.27, 0.04),
  P('fusilli', 'Fusilli', '🌀', 0.99, 'bag', [], ['Pasta Nonna', '#1f4fb8', '#ffd84a', 'Fusilli'], 0.12, 0.2),
  P('reis', 'Reis', '🍚', 1.89, 'sack', [], ['Reiskorn', '#ffffff', '#d6262b', 'Langkorn'], 0.12, 0.18),
  P('tomsauce', 'Tomatensoße', '🍅', 1.49, 'jar', ['#c8261b', '#2e8b3a'], ['Pomodoro', '#ffffff', '#c8261b', 'Basilikum'], 1.1),
  // Konserven
  P('mais', 'Mais', '🌽', 0.89, 'can', [], ['Goldkorn', '#2e8b3a', '#f2c200', 'Mais'], 1.1),
  P('bohnen', 'Bohnen', '🫘', 0.79, 'can', [], ['Böhnchen', '#ff8a3d', '#ffffff', 'in Soße'], 1.1),
  P('thunfisch', 'Thunfisch', '🐟', 1.99, 'flatcan', [], ['Meer', '#2a62c9', '#ffffff', 'Thunfisch']),
  P('ravioli', 'Ravioli', '🥫', 1.79, 'can', [], ['Ravioli', '#ffd84a', '#d6262b', 'Tomate'], 1.35),
  // Backen & Würzen
  P('mehl', 'Mehl', '🌾', 0.69, 'sack', [], ['Mühle', '#f4efe2', '#2a62c9', 'Weizenmehl'], 0.12, 0.19),
  P('zucker', 'Zucker', '🍬', 0.99, 'sack', [], ['Süß', '#ffffff', '#e8322b', 'Zucker'], 0.12, 0.16),
  P('salz', 'Salz', '🧂', 0.49, 'spray', ['#2a7de1', '#ffffff'], ['Meersalz', '#2a7de1', '#ffffff', 'jodiert']),
  P('ketchup', 'Ketchup', '🍅', 1.89, 'squeeze', ['#d6262b', '#ffffff'], ['KETCH', '#ffffff', '#d6262b', 'Tomate']),
  // Spielzeug
  P('ente', 'Gummiente', '🦆', 2.99, 'duck', ['#ffd21f', '#ff8a1f'], ['Ente', '#ffd21f', '#ff8a1f', '']),
  P('fussball', 'Fußball', '⚽', 9.99, 'ball', ['#f4f4f4', '#222222'], ['Ball', '#ffffff', '#222222', '']),
  P('teddy', 'Teddybär', '🧸', 12.99, 'teddy', ['#a8693a', '#3a2412', '#d6262b'], ['Teddy', '#a8693a', '#ffffff', '']),
  P('auto', 'Spielzeugauto', '🏎️', 7.99, 'toycar', ['#e8322b'], ['Turbo Flitzer', '#f2c200', '#e8322b', 'ab 3 Jahren']),
  // Haushalt
  P('klopapier', 'Klopapier', '🧻', 3.49, 'tp', [], ['Wolke 7', '#5aa9e6', '#ffffff', '3-lagig']),
  P('kuechenrolle', 'Küchenrolle', '🧽', 2.29, 'tp', [], ['Saugstark', '#2e8b3a', '#ffffff', 'Küchenrolle'], 1),
  P('spueli', 'Spülmittel', '🫧', 1.19, 'flask', ['#4ccf5a', '#ffffff'], ['Blitzblank', '#ffe066', '#2e8b3a', 'Zitrone'], 1.1),
  P('schwamm', 'Schwämme', '🧽', 1.49, 'sponge', ['#ffd21f', '#2e8b3a'], ['Schrubbi', '#2e8b3a', '#ffd21f', '']),
  // Drogerie
  P('zahnpasta', 'Zahnpasta', '🪥', 1.29, 'tube', [], ['Strahle', '#ffffff', '#2a7de1', 'Zahncreme']),
  P('shampoo', 'Shampoo', '🧴', 2.49, 'flask', ['#b34fe0', '#ffffff'], ['Glanz', '#ffffff', '#b34fe0', 'Shampoo'], 1.2),
  P('seife', 'Seife', '🧼', 0.99, 'soap', [], ['Rosig', '#ff9ec7', '#ffffff', 'Seife']),
  P('deo', 'Deo', '💨', 1.99, 'spray', ['#1d2a5c', '#c8ccd0'], ['FRISCH', '#1d2a5c', '#5aa9e6', '48h']),
  // Tierbedarf
  P('katzenfutter', 'Katzenfutter', '🐱', 0.69, 'flatcan', [], ['Miau', '#e8322b', '#f2c200', 'Huhn']),
  P('hundefutter', 'Hundefutter', '🐶', 8.99, 'sack', [], ['Wuff!', '#c8261b', '#f2c200', 'Rind'], 0.22, 0.32),
  P('knochen', 'Kauknochen', '🦴', 1.99, 'bone', ['#f4efe2'], ['Kau-Spaß', '#2a7de1', '#ffffff', '2 Stück']),
  P('vogelfutter', 'Vogelfutter', '🐦', 2.49, 'box', [], ['Piep', '#7fd3ff', '#2e8b3a', 'Körnermix'], 0.14, 0.2, 0.07),
  // Kaffee & Tee
  P('kaffee', 'Kaffee', '☕', 5.99, 'box', [], ['Bohne', '#3a2412', '#e0b04a', 'gemahlen'], 0.09, 0.17, 0.06),
  P('tee', 'Tee', '🍵', 1.79, 'box', [], ['Teezeit', '#2e8b3a', '#ffffff', 'Kräuter'], 0.13, 0.07, 0.07),
  P('kakao', 'Kakao', '🥛', 2.99, 'jar', ['#7a4a22', '#f2c200'], ['Kakao', '#f2c200', '#7a4a22', 'Trink-Schoko'], 1.3),
  P('espresso', 'Espresso', '🫘', 4.49, 'can', [], ['ESPRESSO', '#222222', '#e0b04a', 'Bohnen'], 1.3),
  // Kühlregal
  P('milch', 'Milch', '🥛', 1.09, 'carton', ['#ffffff', '#2a62c9'], ['Muh', '#ffffff', '#2a62c9', 'Frische Milch'], 1.3),
  P('kaese', 'Käse', '🧀', 3.29, 'wheel', ['#ffd84a', '#e0a81a'], ['Gouda', '#ffd84a', '#d6262b', 'jung']),
  P('joghurt', 'Joghurt', '🍓', 0.59, 'cups', [], ['Joghurt', '#ffffff', '#ff4f8a', 'Erdbeere']),
  P('butter', 'Butter', '🧈', 1.99, 'butter', [], ['Butter', '#f2c200', '#2a62c9', 'mild gesäuert']),
  P('eier', 'Eier', '🥚', 2.49, 'eggs', ['#bdb6a6', '#f3e3c3'], ['Hof-Eier', '#f3e3c3', '#6b4226', 'Freiland']),
  P('salami', 'Salami', '🍖', 2.99, 'salami', ['#7a2a1b', '#c8504a'], ['Salami', '#f2c200', '#7a2a1b', '']),
  P('wuerstchen', 'Würstchen', '🌭', 2.49, 'tray', ['#e8a07a'], ['Würstchen', '#d6262b', '#ffffff', ''], 'saus'),
  P('haehnchen', 'Hähnchen', '🍗', 4.99, 'tray', ['#f0d2a8'], ['Hähnchen', '#f2c200', '#6b4226', ''], 'chick'),
  P('schinken', 'Schinken', '🥓', 2.79, 'tray', ['#f28c8c'], ['Schinken', '#2e8b3a', '#ffffff', '']),
  P('pizza', 'TK-Pizza', '🍕', 2.99, 'pizza', [], ['Pizzeria', '#2a62c9', '#ffffff', 'Salami']),
  P('eis', 'Eiscreme', '🍦', 3.49, 'tub', [], ['Eiskalt', '#ffe6f0', '#ff4fa8', 'Erdbeer']),
  P('pommes', 'Pommes', '🍟', 2.19, 'bag', [], ['Pommes', '#e8322b', '#ffd84a', 'extra knusprig'], 0.2, 0.26),
  P('fischst', 'Fischstäbchen', '🐠', 2.69, 'box', [], ["Käpt'n", '#1d6fd8', '#ffffff', 'Fischstäbchen'], 0.22, 0.05, 0.14),
  // Obst & Gemüse
  P('aepfel', 'Äpfel', '🍎', 2.49, 'crateOf', ['#d6262b', '#7cc444'], ['Äpfel', '#2b2b2b', '#ffffff', ''], 'ball', 0.04),
  P('bananen', 'Bananen', '🍌', 1.69, 'crateOf', ['#ffd21f', '#c9b51a'], ['Bananen', '#2b2b2b', '#ffffff', ''], 'banana'),
  P('karotten', 'Karotten', '🥕', 0.99, 'crateOf', ['#ff8a1f', '#3f9b3a'], ['Karotten', '#2b2b2b', '#ffffff', ''], 'carrot'),
  P('tomaten', 'Tomaten', '🍅', 1.99, 'crateOf', ['#e8261b', '#d01b10'], ['Tomaten', '#2b2b2b', '#ffffff', ''], 'ball', 0.035),
  P('melone', 'Wassermelone', '🍉', 3.99, 'crateOf', ['#2f8a2f', '#1d5e1d'], ['Melone', '#2b2b2b', '#ffffff', ''], 'melon'),
  P('brokkoli', 'Brokkoli', '🥦', 1.49, 'crateOf', ['#2f9a3a', '#7cc444'], ['Brokkoli', '#2b2b2b', '#ffffff', ''], 'broc'),
];
const PROD = {}; PRODUCTS.forEach((p, i) => { p.idx = i; PROD[p.id] = p; });

// build each product's geometry once (shared by shelves, the cart and the checkout)
function buildProductGeos() {
  for (const p of PRODUCTS) {
    const o = new Obj();
    p.w = SHAPES[p.shape](o, p, ...p.a);
    p.geo = objGeo(o);
    const bb = p.geo.boundingBox;
    p.h = bb.max.y - bb.min.y; p.d = bb.max.z - bb.min.z;
    // low detail version for far away shelves: a box with the printed label
    const lo = new Obj(), bw = bb.max.x - bb.min.x, cx = (bb.max.x + bb.min.x) / 2, cz = (bb.max.z + bb.min.z) / 2;
    if (p.shape === 'crateOf') { lo.box(bw, 0.11, p.d, cx, 0.055, cz, '#b07a45'); lo.box(bw * 0.92, p.h - 0.11, p.d * 0.9, cx, 0.11 + (p.h - 0.11) / 2, cz, p.c[0]); }
    else {
      const main = p.c[0] && p.shape !== 'jar' && p.shape !== 'bottle' ? p.c[0] : p.lab[1];
      lo.box(bw * 0.92, p.h, p.d * 0.9, cx, p.h / 2, cz, p.shape === 'bottle' || p.shape === 'jar' ? p.c[0] : main);
      const uv = p.mainLab || null;
      if (uv) {
        const lw = bw * 0.9, lh = Math.min(p.h * 0.95, lw / p.mainAspect);
        lo.label(lw, lh, cx, p.shape === 'bottle' ? p.h * 0.38 : p.h * 0.5, cz + p.d * 0.45 + 0.002, uv);
      }
    }
    p.geoLo = objGeo(lo);
    // medium detail: simple silhouette + printed label
    const ROUND = ['bottle', 'can', 'jar', 'spray', 'tub', 'squeeze', 'flatcan'];
    const ORGANIC = ['duck', 'ball', 'teddy', 'croissant', 'loaf', 'baguette', 'crateOf', 'wheel', 'salami', 'tray', 'eggs', 'toast', 'bone', 'toycar', 'crate'];
    if (ROUND.includes(p.shape)) {
      const m = new Obj(), r = Math.min(bw, p.d) / 2 * 0.98, body = p.shape === 'bottle' || p.shape === 'jar' ? p.c[0] : p.lab[1];
      if (p.shape === 'bottle') {
        m.cyl(r, p.h * 0.62, cx, p.h * 0.31, cz, body, { seg: 7 });
        m.cyl(r, p.h * 0.2, cx, p.h * 0.72, cz, body, { seg: 7, rt: 0.42 });
        m.cyl(r * 0.45, p.h * 0.18, cx, p.h * 0.91, cz, p.c[1], { seg: 6 });
      } else {
        m.cyl(r, p.h * 0.92, cx, p.h * 0.46, cz, body, { seg: 7 });
        m.cyl(r * 0.92, p.h * 0.08, cx, p.h * 0.96, cz, p.c[1] || '#c8ccd0', { seg: 7 });
      }
      if (p.mainLab) { const lh = Math.min(p.h * 0.5, (PI * r) / p.mainAspect); m.wrap(r * 1.02, lh, cx, p.shape === 'bottle' ? p.h * 0.36 : p.h * 0.45, cz, p.mainLab, { seg: 7 }); }
      p.geoMid = objGeo(m);
    } else if (ORGANIC.includes(p.shape)) {
      SEGCAP = 6; SKIP_TINY = true;
      const m = new Obj(); SHAPES[p.shape](m, p, ...p.a);
      SEGCAP = 99; SKIP_TINY = false;
      p.geoMid = objGeo(m);
    } else p.geoMid = p.geoLo;
  }
}
