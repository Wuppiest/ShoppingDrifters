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

// ============================================================
//  Extra shapes for the other worlds (Baumarkt, Mega-Mall, Tiefkühl-Lager)
// ============================================================
Object.assign(SHAPES, {
  bucket(o, p, s = 1) { // paint bucket with lid + handle
    const r = 0.08 * s, h = 0.15 * s;
    o.cyl(r, h, 0, h / 2, 0, p.lab[1], { seg: 12, rt: 1.06 });
    o.wrap(r * 1.03 + 0.001, h * 0.6, 0, h * 0.5, 0, lab(p, (PI * r) / (h * 0.6)), { seg: 12 });
    o.cyl(r * 1.08, 0.012, 0, h + 0.006, 0, '#c8ccd0', { seg: 12 });
    o.cyl(r * 0.7, 0.004, 0, h + 0.014, 0, p.c[0], { seg: 12 }); // paint drip on the lid
    o.torus(r * 0.98, 0.04, 0, h + 0.01, 0, '#9aa0a6', { rz: PI / 2, arc: PI, seg: 10 });
    return 2 * r * 1.08 + 0.02;
  },
  toolcard(o, p, kind = 'hammer') { // tool on a hanging blister card
    o.box(0.16, 0.24, 0.01, 0, 0.12, -0.02, p.lab[1]);
    o.label(0.16, 0.24, 0, 0.12, -0.0145, lab(p, 0.66, true));
    const [m1, m2] = p.c;
    if (kind === 'hammer') { o.box(0.025, 0.17, 0.025, 0, 0.1, 0, m2); o.box(0.09, 0.03, 0.03, 0, 0.19, 0, m1); }
    else if (kind === 'driver') { o.cyl(0.016, 0.08, 0, 0.06, 0, m2, { seg: 8 }); o.cyl(0.005, 0.1, 0, 0.15, 0, m1, { seg: 6 }); }
    else if (kind === 'pliers') { for (const s of [-1, 1]) { o.box(0.014, 0.1, 0.012, s * 0.02, 0.07, 0, m2, { rz: s * 0.18 }); o.box(0.012, 0.06, 0.012, s * 0.006, 0.15, 0, m1, { rz: -s * 0.1 }); } }
    else if (kind === 'saw') { o.box(0.04, 0.06, 0.02, 0, 0.05, 0, m2); o.box(0.07, 0.15, 0.004, 0, 0.14, 0, m1); }
    else { o.box(0.05, 0.12, 0.03, 0, 0.1, 0, m2); }
    o.box(0.03, 0.02, 0.012, 0, 0.235, -0.02, '#f4f4f4'); // hanger hole
    return 0.18;
  },
  coil(o, p) { // cable drum / extension cord
    o.cyl(0.11, 0.012, 0, 0.006, 0, p.c[1], { seg: 12 }); o.cyl(0.11, 0.012, 0, 0.13, 0, p.c[1], { seg: 12 });
    for (let k = 0; k < 4; k++) o.torus(0.075, 0.25, 0, 0.025 + k * 0.028, 0, p.c[0], { rx: PI / 2, seg: 12 });
    o.cyl(0.03, 0.14, 0, 0.07, 0, '#333', { seg: 8 });
    o.label(0.1, 0.05, 0, 0.07, 0.106, lab(p, 2));
    return 0.24;
  },
  tape(o, p) { // stack of tape rolls
    for (let k = 0; k < 3; k++) o.torus(0.045, 0.5, 0, 0.016 + k * 0.032, 0, p.c[0], { rx: PI / 2, seg: 12 });
    o.label(0.06, 0.03, 0, 0.05, 0.068, lab(p, 2));
    return 0.13;
  },
  pipes(o, p) { // bundle of pipes lying on the shelf
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2 - (i % 2); j++) o.cyl(0.025, 0.36, (j - 0.5 + (i % 2) * 0.5) * 0.052, 0.025 + i * 0.044, 0, p.c[0], { rx: PI / 2, seg: 8 });
    o.box(0.12, 0.05, 0.006, 0, 0.05, 0.182, p.lab[1]); o.label(0.12, 0.05, 0, 0.05, 0.186, lab(p, 2.4));
    return 0.14;
  },
  planks(o, p) { // stack of boards (long axis along the shelf front)
    for (let k = 0; k < 5; k++) o.box(0.5, 0.03, 0.12, (k % 2) * 0.01, 0.015 + k * 0.031, 0, shade(p.c[0], (k % 3) * 0.03 - 0.03));
    o.box(0.012, 0.16, 0.124, -0.15, 0.08, 0, p.lab[1]); o.box(0.012, 0.16, 0.124, 0.15, 0.08, 0, p.lab[1]); // straps
    o.label(0.1, 0.05, 0, 0.08, 0.0605, lab(p, 2));
    return 0.54;
  },
  tiles(o, p) { // boxes of tiles with one sample tile in front
    for (let k = 0; k < 3; k++) o.box(0.3, 0.045, 0.3, 0, 0.0225 + k * 0.046, 0, '#d9c8a8');
    o.label(0.29, 0.04, 0, 0.115, 0.151, lab(p, 7));
    o.box(0.13, 0.13, 0.01, 0, 0.21, 0.08, p.c[0], { rx: -0.25 });
    o.box(0.13, 0.004, 0.012, 0, 0.21, 0.081, shade(p.c[0], -0.2), { rx: -0.25 });
    return 0.32;
  },
  pot(o, p, kind = 'flower') { // plant in a terracotta pot
    const pc = p.c[1] || '#c8693a';
    o.cyl(0.07, 0.11, 0, 0.055, 0, pc, { seg: 10, rt: 1.25 });
    o.cyl(0.09, 0.025, 0, 0.115, 0, shade(pc, -0.08), { seg: 10 });
    o.cyl(0.08, 0.01, 0, 0.125, 0, '#4a3220', { seg: 10 });
    const g = p.c[0];
    if (kind === 'cactus') { o.cyl(0.035, 0.16, 0, 0.2, 0, g, { seg: 8 }); o.sph(0.035, 0, 0.28, 0, g, { seg: 8 }); o.cyl(0.018, 0.06, 0.05, 0.2, 0, g, { seg: 6 }); o.cyl(0.018, 0.05, 0.05, 0.24, 0, g, { seg: 6 }); o.sph(0.012, 0, 0.32, 0, '#ff5aa0', { seg: 5 }); }
    else if (kind === 'flower') { o.cyl(0.006, 0.16, 0, 0.21, 0, '#3f9b3a', { seg: 4 }); for (let k = 0; k < 6; k++) o.sph(0.022, Math.cos(k) * 0.03, 0.3, Math.sin(k) * 0.03, g, { sy: 0.4, seg: 5 }); o.sph(0.018, 0, 0.305, 0, '#ffd21f', { seg: 5 }); for (const s of [-1, 1]) o.sph(0.03, s * 0.03, 0.18, 0, '#3f9b3a', { sx: 1.4, sy: 0.3, seg: 5 }); }
    else if (kind === 'bush') { for (let k = 0; k < 6; k++) o.ico(0.05, Math.cos(k * 1.1) * 0.04, 0.2 + (k % 2) * 0.04, Math.sin(k * 1.1) * 0.04, shade(g, (k % 3) * 0.04)); if (p.c[2]) for (let k = 0; k < 4; k++) o.sph(0.016, Math.cos(k * 1.6) * 0.06, 0.2 + (k % 2) * 0.05, Math.sin(k * 1.6) * 0.06, p.c[2], { seg: 5 }); }
    else if (kind === 'tree') { o.cyl(0.012, 0.12, 0, 0.18, 0, '#6b4226', { seg: 5, rz: 0.2 }); o.ico(0.07, 0.02, 0.27, 0, g, { sy: 0.6 }); o.ico(0.05, -0.04, 0.23, 0.02, shade(g, 0.05), { sy: 0.6 }); }
    o.label(0.06, 0.03, 0, 0.06, 0.08, lab(p, 2), { rx: -0.1 });
    return 0.2;
  },
  helmet(o, p) {
    o.sph(0.1, 0, 0.0, 0, p.c[0], { sy: 0.8, seg: 10 });
    o.cyl(0.11, 0.01, 0, 0.005, 0.01, p.c[0], { seg: 12, sz: 1.15 });
    o.box(0.02, 0.06, 0.18, 0, 0.07, 0, shade(p.c[0], -0.08));
    o.box(0.07, 0.03, 0.005, 0, 0.04, 0.095, p.lab[1]); o.label(0.07, 0.03, 0, 0.04, 0.098, lab(p, 2.3), { rx: -0.3 });
    return 0.24;
  },
  lamp(o, p) { // table lamp in its box
    o.box(0.16, 0.1, 0.12, 0, 0.05, 0, p.lab[1]); o.label(0.16, 0.1, 0, 0.05, 0.061, lab(p, 1.6));
    o.cyl(0.04, 0.012, 0, 0.106, 0, '#333', { seg: 10 }); o.cyl(0.006, 0.14, 0, 0.18, 0, '#c8ccd0', { seg: 6 });
    o.cyl(0.07, 0.08, 0, 0.27, 0, p.c[0], { seg: 10, rt: 0.55 });
    return 0.18;
  },
  wcan(o, p) { // watering can
    o.cyl(0.07, 0.15, 0, 0.075, 0, p.c[0], { seg: 10, sz: 0.8 });
    o.bar(new V3(0.05, 0.05, 0), new V3(0.16, 0.18, 0), 0.02, p.c[0], true);
    o.cyl(0.022, 0.025, 0.165, 0.185, 0, shade(p.c[0], -0.1), { seg: 8, rz: -0.8 });
    o.torus(0.06, 0.15, -0.02, 0.16, 0, p.c[0], { arc: PI, seg: 8 });
    o.label(0.06, 0.05, -0.01, 0.075, 0.0565, lab(p, 1.2));
    return 0.26;
  },
  bin(o, p) { // bucket / trash bin
    o.cyl(0.09, 0.2, 0, 0.1, 0, p.c[0], { seg: 12, rt: 1.15 });
    o.cyl(0.105, 0.015, 0, 0.2, 0, shade(p.c[0], -0.1), { seg: 12 });
    o.torus(0.09, 0.04, 0, 0.21, 0, '#9aa0a6', { rz: PI / 2, arc: PI, seg: 10 });
    o.label(0.07, 0.05, 0, 0.1, 0.098, lab(p, 1.4), { rx: -0.07 });
    return 0.23;
  },
  // ---------- mall ----------
  book(o, p, thick = 0.03) { // books standing, covers to the front
    const uv = lab(p, 0.13 / 0.19);
    for (let i = 0; i < 2; i++) {
      const z = -i * (thick + 0.004);
      o.box(0.13, 0.19, thick, 0, 0.095, z, p.lab[1]);
      o.box(0.124, 0.184, thick * 0.9, 0.004, 0.095, z, '#f4efe2');
      o.label(0.13, 0.19, 0, 0.095, z + thick / 2 + 0.001, uv);
    }
    return 0.14;
  },
  shoe(o, p) { // pair of sneakers on a box
    o.box(0.26, 0.06, 0.16, 0, 0.03, 0, p.lab[1]); o.label(0.26, 0.06, 0, 0.03, 0.081, lab(p, 4.3));
    for (const s of [-1, 1]) {
      const x = s * 0.06;
      o.box(0.07, 0.02, 0.2, x, 0.07, 0, p.c[1]);
      o.box(0.064, 0.04, 0.16, x, 0.1, -0.02, p.c[0]);
      o.sph(0.035, x, 0.09, 0.07, p.c[0], { sy: 0.65, sz: 1.2, seg: 7 });
      o.box(0.05, 0.05, 0.05, x, 0.13, -0.07, p.c[0]);
      o.box(0.068, 0.012, 0.04, x, 0.115, 0.02, shade(p.c[0], -0.25));
    }
    return 0.28;
  },
  shirt(o, p) { // folded T-shirts in a pile
    for (let k = 0; k < 3; k++) {
      const y = 0.015 + k * 0.03;
      o.box(0.2, 0.028, 0.16, 0, y, 0, p.c[0]);
      o.box(0.08, 0.03, 0.03, 0, y + 0.002, 0.07, shade(p.c[0], -0.1));
    }
    o.label(0.1, 0.06, 0, 0.12, 0.05, lab(p, 1.6), { rx: -PI / 2 + 0.2 });
    o.box(0.04, 0.012, 0.03, 0.08, 0.1, 0.06, '#ffffff');
    return 0.22;
  },
  headphones(o, p) { // headphones on a stand
    o.box(0.1, 0.012, 0.08, 0, 0.006, 0, '#222'); o.cyl(0.008, 0.16, 0, 0.09, 0, '#555', { seg: 6 });
    o.torus(0.065, 0.12, 0, 0.17, 0, p.c[0], { arc: PI, seg: 10 });
    for (const s of [-1, 1]) { o.cyl(0.038, 0.03, s * 0.068, 0.15, 0, p.c[0], { rz: PI / 2, seg: 10 }); o.cyl(0.03, 0.032, s * 0.068, 0.15, 0, p.c[1], { rz: PI / 2, seg: 10 }); }
    o.box(0.08, 0.03, 0.004, 0, 0.03, 0.041, p.lab[1]); o.label(0.08, 0.03, 0, 0.03, 0.0435, lab(p, 2.6));
    return 0.18;
  },
  gadget(o, p, w = 0.09, h = 0.15) { // phone / console box with the device standing in front
    o.box(w, h, 0.04, 0, h / 2, -0.01, p.lab[1]); o.label(w, h, 0, h / 2, 0.0105, lab(p, w / h));
    return w + 0.02;
  },
  mug(o, p) {
    for (const x of [-0.045, 0.045]) {
      o.cyl(0.035, 0.08, x, 0.04, 0, p.c[0], { seg: 10 });
      o.torus(0.022, 0.25, x + 0.04, 0.045, 0, p.c[0], { seg: 8 });
      o.cyl(0.03, 0.004, x, 0.081, 0, '#3a2412', { seg: 10 });
      o.wrap(0.0355, 0.04, x, 0.04, 0, lab(p, (PI * 0.035) / 0.04), { seg: 10 });
    }
    return 0.19;
  },
  pan(o, p) {
    o.cyl(0.1, 0.035, 0, 0.0175, 0, '#2a2a2a', { seg: 12, rt: 1.1 });
    o.cyl(0.09, 0.004, 0, 0.034, 0, '#444', { seg: 12 });
    o.box(0.16, 0.015, 0.025, 0.17, 0.03, 0, p.c[0]);
    o.box(0.09, 0.05, 0.004, 0, 0.025, 0.112, p.lab[1]); o.label(0.09, 0.05, 0, 0.025, 0.115, lab(p, 1.8));
    return 0.36;
  },
  candle(o, p) {
    for (const [x, h] of [[-0.035, 0.12], [0.035, 0.09]]) { o.cyl(0.03, h, x, h / 2, 0, p.c[0], { seg: 10 }); o.cyl(0.003, 0.015, x, h + 0.007, 0, '#222', { seg: 4 }); }
    o.label(0.05, 0.03, -0.035, 0.05, 0.031, lab(p, 1.7));
    return 0.14;
  },
  dumbbell(o, p) {
    for (const z of [-0.03, 0.03]) { o.cyl(0.012, 0.16, 0, 0.04, z, '#9aa0a6', { rz: PI / 2, seg: 6 }); for (const x of [-0.065, 0.065]) o.cyl(0.04, 0.035, x, 0.04, z, p.c[0], { rz: PI / 2, seg: 8 }); }
    return 0.2;
  },
  matroll(o, p) { o.cyl(0.05, 0.4, 0, 0.05, 0, p.c[0], { rz: PI / 2, seg: 10 }); o.box(0.04, 0.104, 0.104, 0, 0.05, 0, p.lab[1]); o.label(0.1, 0.06, 0, 0.05, 0.053, lab(p, 1.7)); return 0.42; },
  // ---------- food court ----------
  burger(o, p) {
    o.box(0.26, 0.01, 0.16, 0, 0.005, 0, '#e8322b');
    for (const x of [-0.06, 0.06]) {
      o.sph(0.05, x, 0.03, 0, '#d99a3e', { sy: 0.35, seg: 9 }); o.cyl(0.052, 0.015, x, 0.045, 0, '#5a3418', { seg: 10 });
      o.cyl(0.055, 0.006, x, 0.055, 0, '#ffd21f', { seg: 4 }); o.cyl(0.054, 0.006, x, 0.06, 0, '#4fb348', { seg: 10 });
      o.sph(0.05, x, 0.065, 0, '#d99a3e', { sy: 0.55, seg: 9 }); o.sph(0.004, x + 0.02, 0.09, 0.01, '#fff3c4', { seg: 4 });
    }
    return 0.27;
  },
  slice(o, p) { // pizza slices on a plate
    o.cyl(0.11, 0.008, 0, 0.004, 0, '#ffffff', { seg: 12 });
    for (const r of [0, 2.2]) { o.add(geoCyl(3), Math.cos(r) * 0.03, 0.015, Math.sin(r) * 0.03, 0.07, 0.014, 0.05, '#f2c26a', 0, r, 0); o.add(geoCyl(3), Math.cos(r) * 0.03, 0.022, Math.sin(r) * 0.03, 0.062, 0.004, 0.045, '#d6262b', 0, r, 0); }
    return 0.24;
  },
  donut(o, p) {
    o.box(0.2, 0.01, 0.12, 0, 0.005, 0, '#f4efe2');
    for (const x of [-0.05, 0.05]) { o.torus(0.035, 0.6, x, 0.025, 0, '#d99a3e', { rx: PI / 2, seg: 10 }); o.torus(0.035, 0.55, x, 0.032, 0, p.c[0], { rx: PI / 2, seg: 10, sz: 0.5 }); for (let k = 0; k < 4; k++) o.box(0.008, 0.003, 0.003, x + Math.cos(k * 1.6) * 0.035, 0.045, Math.sin(k * 1.6) * 0.035, ['#ffffff', '#4ff2ff', '#ffd21f', '#2bd45a'][k], { ry: k }); }
    return 0.22;
  },
  cup(o, p) { // smoothie / slush cup with lid + straw
    o.cyl(0.04, 0.14, 0, 0.07, 0, p.c[0], { seg: 10, rt: 1.2 });
    o.cyl(0.05, 0.012, 0, 0.146, 0, '#f4f4f4', { seg: 10 });
    o.cyl(0.005, 0.08, 0.01, 0.18, 0, p.c[1] || '#ff4fa8', { seg: 5, rz: 0.15 });
    o.wrap(0.0465, 0.05, 0, 0.08, 0, lab(p, (PI * 0.046) / 0.05), { seg: 10 });
    return 0.11;
  },
  // ---------- frozen ----------
  popsicle(o, p) { // box of ice lollies with one on top
    o.box(0.16, 0.06, 0.1, 0, 0.03, 0, p.lab[1]); o.label(0.16, 0.06, 0, 0.03, 0.051, lab(p, 2.7));
    o.box(0.04, 0.09, 0.02, 0, 0.11, 0, p.c[0]); o.box(0.012, 0.04, 0.006, 0, 0.05, 0, '#e8c48a');
    return 0.18;
  },
  icebag(o, p) { // bag of ice cubes
    o.box(0.18, 0.2, 0.08, 0, 0.1, 0, '#e6f7ff');
    for (let k = 0; k < 9; k++) o.box(0.035, 0.035, 0.035, -0.05 + (k % 3) * 0.05, 0.05 + Math.floor(k / 3) * 0.05, 0.03, '#bfe6ff', { ry: k, rx: k * 0.5 });
    o.label(0.16, 0.06, 0, 0.17, 0.0415, lab(p, 2.7));
    return 0.2;
  },
  cake(o, p) {
    o.box(0.2, 0.012, 0.2, 0, 0.006, 0, '#d9d2c4');
    o.cyl(0.085, 0.07, 0, 0.047, 0, p.c[0], { seg: 12 }); o.cyl(0.087, 0.012, 0, 0.083, 0, p.c[1], { seg: 12 });
    for (let k = 0; k < 6; k++) o.sph(0.012, Math.cos(k * 1.05) * 0.06, 0.095, Math.sin(k * 1.05) * 0.06, '#d6262b', { seg: 5 });
    o.label(0.08, 0.035, 0, 0.03, 0.101, lab(p, 2.3));
    return 0.22;
  },
});

// ---- variants: same model, different colors/names (makes the list harder to read!) ----
const VAR = (prefix, name, shape, base, lab0, variants, ...a) => variants.map(([suf, nm, e, col, price]) =>
  P(prefix + suf, name + ' ' + nm, e, price, shape, [col, ...base.slice(1)], [lab0[0], col, lab0[2] || '#ffffff', nm], ...a));

PRODUCTS.push(
  // ======== BAUMARKT ========
  ...VAR('farbe_', 'Farbe', 'bucket', ['#ffffff'], ['Wandfarbe'], [['w', 'Weiß', '🪣', '#f4f4f4', 19.99], ['r', 'Rot', '🟥', '#d6262b', 24.99], ['b', 'Blau', '🟦', '#2a62c9', 24.99], ['g', 'Gelb', '🟨', '#f2c200', 24.99]]),
  P('pinsel', 'Pinsel', '🖌️', 3.99, 'toolcard', ['#c8914a', '#b07a45'], ['Malprofi', '#2e8b3a', '#ffffff', 'Pinsel-Set'], 'brush'),
  P('roller', 'Farbroller', '🧻', 6.99, 'toolcard', ['#f4f4f4', '#e8322b'], ['Malprofi', '#2e8b3a', '#ffffff', 'Farbroller'], 'roller'),
  P('lackspray', 'Sprühlack', '🎨', 7.49, 'spray', ['#111111', '#e8322b'], ['SPRAY', '#111111', '#ff4fa8', 'schwarz matt']),
  P('klebeband', 'Klebeband', '🩹', 2.49, 'tape', ['#e8c48a'], ['Abdeckband', '#f2c200', '#1d2230', '50 m']),
  P('schrauben', 'Schrauben', '🔩', 4.99, 'box', [], ['Fix-Fest', '#2a62c9', '#ffffff', '200 Stück'], 0.12, 0.1, 0.08),
  P('duebel', 'Dübel', '🔘', 3.99, 'box', [], ['Fix-Fest', '#e8322b', '#ffffff', 'Dübel 6 mm'], 0.12, 0.1, 0.08),
  P('naegel', 'Nägel', '📌', 2.99, 'box', [], ['Fix-Fest', '#555b66', '#ffd21f', 'Nägel 40 mm'], 0.12, 0.1, 0.08),
  P('muttern', 'Muttern', '⚙️', 3.49, 'jar', ['#9aa0a6', '#e8322b'], ['Fix-Fest', '#ffffff', '#555b66', 'Muttern M8'], 1.1),
  P('hammer', 'Hammer', '🔨', 12.99, 'toolcard', ['#555b66', '#c8914a'], ['Werkbank', '#ffd21f', '#1d2230', 'Hammer 500 g'], 'hammer'),
  P('schraubendreher', 'Schraubenzieher', '🪛', 6.99, 'toolcard', ['#c8ccd0', '#e8322b'], ['Werkbank', '#ffd21f', '#1d2230', 'Schlitz'], 'driver'),
  P('zange', 'Zange', '🔧', 9.99, 'toolcard', ['#555b66', '#e8322b'], ['Werkbank', '#ffd21f', '#1d2230', 'Kombizange'], 'pliers'),
  P('saege', 'Säge', '🪚', 14.99, 'toolcard', ['#c8ccd0', '#2e8b3a'], ['Werkbank', '#ffd21f', '#1d2230', 'Fuchsschwanz'], 'saw'),
  P('gluehbirne', 'Glühbirne', '💡', 3.99, 'box', [], ['Hell!', '#ffd21f', '#1d2230', 'LED 9 W'], 0.08, 0.13, 0.08),
  P('kabeltrommel', 'Kabeltrommel', '🔌', 29.99, 'coil', ['#ff8a1f', '#1d2230'], ['Volt', '#1d2230', '#ff8a1f', '25 m']),
  P('verlaengerung', 'Verlängerungskabel', '➰', 9.99, 'coil', ['#f4f4f4', '#555b66'], ['Volt', '#f4f4f4', '#1d2230', '5 m']),
  P('batterien', 'Batterien', '🔋', 5.99, 'gadget', [], ['Power+', '#1d2230', '#ffd21f', 'AA x8'], 0.1, 0.14),
  P('akkuschrauber', 'Akkuschrauber', '🪛', 79.99, 'box', [], ['BRUMM', '#2e8b3a', '#ffffff', 'Akkuschrauber'], 0.26, 0.2, 0.1),
  P('bohrmaschine', 'Bohrmaschine', '🛠️', 89.99, 'box', [], ['BRUMM', '#1f4fb8', '#ffffff', 'Schlagbohrer'], 0.26, 0.2, 0.1),
  P('schleifer', 'Schleifer', '🌀', 59.99, 'box', [], ['BRUMM', '#e8322b', '#ffffff', 'Schleifer'], 0.26, 0.2, 0.1),
  P('stichsaege', 'Stichsäge', '⚡', 69.99, 'box', [], ['BRUMM', '#ff8a1f', '#1d2230', 'Stichsäge'], 0.26, 0.2, 0.1),
  P('wasserhahn', 'Wasserhahn', '🚰', 39.99, 'box', [], ['Aqua', '#5aa9e6', '#ffffff', 'Armatur'], 0.18, 0.18, 0.1),
  P('duschkopf', 'Duschkopf', '🚿', 19.99, 'box', [], ['Aqua', '#ffffff', '#2a62c9', 'Duschkopf'], 0.14, 0.24, 0.07),
  P('silikon', 'Silikon', '🧪', 6.49, 'spray', ['#ffffff', '#2a62c9'], ['Dicht!', '#ffffff', '#2a62c9', 'Silikon']),
  P('rohr', 'Rohre', '🧯', 4.99, 'pipes', ['#9aa0a6'], ['Aqua', '#5aa9e6', '#ffffff', 'Rohr 1 m']),
  P('blumenerde', 'Blumenerde', '🪴', 4.99, 'sack', [], ['Grün', '#3a2412', '#4fb348', 'Blumenerde 20 L'], 0.22, 0.32),
  P('rasensamen', 'Rasensamen', '🌱', 9.99, 'box', [], ['Grün', '#4fb348', '#ffffff', 'Rasensamen'], 0.15, 0.22, 0.08),
  P('duenger', 'Dünger', '🧂', 7.99, 'sack', [], ['Grün', '#2e8b3a', '#ffd21f', 'Dünger'], 0.16, 0.24),
  P('giesskanne', 'Gießkanne', '🚿', 8.99, 'wcan', ['#2e8b3a'], ['Grün', '#ffffff', '#2e8b3a', '10 L']),
  P('bretter', 'Bretter', '🪵', 12.99, 'planks', ['#d9a253'], ['Holz', '#e8322b', '#ffffff', 'Fichte']),
  P('leisten', 'Leisten', '📏', 5.99, 'planks', ['#e8c48a'], ['Holz', '#2a62c9', '#ffffff', 'Leisten']),
  P('holzleim', 'Holzleim', '🧴', 4.99, 'flask', ['#ffffff', '#ff8a1f'], ['Leim', '#ff8a1f', '#ffffff', 'Holzleim']),
  P('spanplatte', 'Spanplatte', '🟫', 14.99, 'planks', ['#c8a070'], ['Holz', '#555b66', '#ffffff', 'Spanplatte']),
  ...VAR('fliese_', 'Fliesen', 'tiles', ['#ffffff'], ['Fliesen'], [['w', 'Weiß', '⬜', '#f4f4f4', 19.99], ['b', 'Blau', '🟦', '#5aa9e6', 22.99], ['t', 'Terracotta', '🟫', '#c8693a', 24.99]]),
  P('fliesenkleber', 'Fliesenkleber', '🧱', 12.99, 'sack', [], ['Fix-Fest', '#9aa0a6', '#1d2230', 'Kleber 25 kg'], 0.22, 0.32),
  P('helm', 'Schutzhelm', '⛑️', 14.99, 'helmet', ['#ffd21f'], ['Safe', '#1d2230', '#ffd21f', '']),
  P('handschuhe', 'Arbeitshandschuhe', '🧤', 4.99, 'bag', [], ['Safe', '#ff8a1f', '#1d2230', 'Größe 10'], 0.13, 0.2),
  P('schutzbrille', 'Schutzbrille', '🥽', 6.99, 'gadget', [], ['Safe', '#1d2230', '#4ff2ff', 'Schutzbrille'], 0.14, 0.12),
  P('warnweste', 'Warnweste', '🦺', 3.99, 'bag', [], ['Safe', '#f2ff3a', '#ff8a1f', 'Warnweste'], 0.16, 0.22),
  P('tischlampe', 'Tischlampe', '🛋️', 24.99, 'lamp', ['#ffd21f'], ['Lumen', '#1d2230', '#ffd21f', 'Tischlampe']),
  P('lichterkette', 'Lichterkette', '✨', 9.99, 'box', [], ['Lumen', '#1d2230', '#ffd21f', 'Lichterkette'], 0.16, 0.12, 0.08),
  P('taschenlampe', 'Taschenlampe', '🔦', 12.99, 'gadget', [], ['Lumen', '#ffd21f', '#1d2230', 'Taschenlampe'], 0.09, 0.18),
  P('solarlampe', 'Solarleuchte', '☀️', 7.99, 'gadget', [], ['Lumen', '#2a62c9', '#ffd21f', 'Solar'], 0.09, 0.2),
  P('eimer', 'Eimer', '🪣', 3.49, 'bin', ['#2a62c9'], ['Eimer', '#ffffff', '#2a62c9', '10 L']),
  P('muelleimer', 'Mülleimer', '🗑️', 14.99, 'bin', ['#555b66'], ['Clean', '#ffffff', '#555b66', '30 L']),
  P('kleister', 'Tapetenkleister', '📜', 5.99, 'box', [], ['Fix-Fest', '#ffffff', '#2a62c9', 'Kleister'], 0.12, 0.18, 0.06),
  P('tapete', 'Tapete', '🎞️', 11.99, 'matroll', ['#f4efe2'], ['Deko', '#b34fe0', '#ffffff', 'Tapete']),
  P('kaktus', 'Kaktus', '🌵', 4.99, 'pot', ['#3f9b3a', '#c8693a'], ['Grün', '#ffffff', '#3f9b3a', ''], 'cactus'),
  P('blume', 'Blumentopf', '🌷', 3.99, 'pot', ['#ff4fa8', '#c8693a'], ['Grün', '#ffffff', '#ff4fa8', ''], 'flower'),
  P('tomatenpflanze', 'Tomatenpflanze', '🍅', 2.99, 'pot', ['#3f9b3a', '#2e2e2e', '#e8322b'], ['Grün', '#ffffff', '#e8322b', ''], 'bush'),
  P('bonsai', 'Bonsai', '🌳', 19.99, 'pot', ['#2f8a2f', '#3a6a8a'], ['Grün', '#ffffff', '#2f8a2f', ''], 'tree'),
  P('kraeuter', 'Kräuter', '🌿', 1.99, 'pot', ['#4fb348', '#c8693a'], ['Grün', '#ffffff', '#4fb348', ''], 'bush'),
  P('lavendel', 'Lavendel', '💜', 3.49, 'pot', ['#4fb348', '#f4efe2', '#8a6bd6'], ['Grün', '#ffffff', '#8a6bd6', ''], 'bush'),
  P('zement', 'Zement', '🏗️', 6.99, 'sack', [], ['BAU', '#9aa0a6', '#e8322b', 'Zement 25 kg'], 0.26, 0.34),
  P('kies', 'Kies', '🪨', 4.99, 'sack', [], ['BAU', '#c8b89a', '#1d2230', 'Kies 25 kg'], 0.26, 0.34),
  P('rigips', 'Gipsplatte', '⬜', 9.99, 'planks', ['#f4f4f4'], ['BAU', '#2a62c9', '#ffffff', 'Gips']),
  P('kantholz', 'Kantholz', '🪵', 8.99, 'planks', ['#b97b3a'], ['Holz', '#2e8b3a', '#ffffff', 'Kantholz']),
  // ======== MEGA-MALL ========
  P('kopfhoerer', 'Kopfhörer', '🎧', 49.99, 'headphones', ['#1d2230', '#e8322b'], ['BASS', '#1d2230', '#e8322b', 'Wireless']),
  P('handy', 'Handy', '📱', 299, 'gadget', [], ['Pling', '#1d2230', '#4ff2ff', 'Phone 9'], 0.09, 0.16),
  P('konsole', 'Spielkonsole', '🎮', 399, 'gadget', [], ['ZOCK', '#ffffff', '#e8322b', 'Konsole'], 0.24, 0.18),
  P('ladekabel', 'Ladekabel', '🔌', 9.99, 'gadget', [], ['Pling', '#ffffff', '#1d2230', 'USB-C'], 0.09, 0.16),
  ...VAR('tshirt_', 'T-Shirt', 'shirt', ['#ffffff'], ['FASHION'], [['r', 'Rot', '👕', '#d6262b', 14.99], ['b', 'Blau', '👕', '#2a62c9', 14.99], ['s', 'Schwarz', '👕', '#1d2230', 14.99]]),
  P('jeans', 'Jeans', '👖', 39.99, 'shirt', ['#3a5a9a'], ['DENIM', '#3a5a9a', '#ffffff', 'Slim Fit']),
  P('sneaker_w', 'Sneaker Weiß', '👟', 79.99, 'shoe', ['#f4f4f4', '#e8322b'], ['ZOOM', '#1d2230', '#ffffff', 'Weiß']),
  P('sneaker_r', 'Sneaker Rot', '👟', 79.99, 'shoe', ['#d6262b', '#ffffff'], ['ZOOM', '#1d2230', '#ff6a6a', 'Rot']),
  P('stiefel', 'Stiefel', '🥾', 99.99, 'shoe', ['#6b4226', '#2a2a2a'], ['Trail', '#c8914a', '#1d2230', 'Stiefel']),
  P('flipflops', 'Flip-Flops', '🩴', 9.99, 'shoe', ['#4ff2ff', '#ff8a1f'], ['Beach', '#ffd21f', '#2a62c9', 'Flip-Flops']),
  P('basketball', 'Basketball', '🏀', 24.99, 'ball', ['#e87a1f', '#2a2a2a'], ['Ball', '#e87a1f', '#2a2a2a', '']),
  P('hanteln', 'Hanteln', '🏋️', 29.99, 'dumbbell', ['#e8322b'], ['FIT', '#1d2230', '#e8322b', '2 x 2 kg']),
  P('yogamatte', 'Yogamatte', '🧘', 19.99, 'matroll', ['#8a6bd6'], ['FIT', '#1d2230', '#8a6bd6', 'Yogamatte']),
  P('trinkflasche', 'Trinkflasche', '🍶', 12.99, 'bottle', ['#4ff2ff', '#1d2230'], ['FIT', '#1d2230', '#4ff2ff', '1 L'], 1.2),
  ...VAR('buch_', 'Buch', 'book', ['#ffffff'], ['Verlag'], [['k', '„Kochen“', '📕', '#d6262b', 19.99], ['c', '„Comic“', '📗', '#2bd45a', 9.99], ['r', '„Krimi“', '📘', '#1d2230', 12.99], ['a', '„Atlas“', '📙', '#ff8a1f', 24.99]]),
  P('parfuem', 'Parfüm', '🌸', 59.99, 'flask', ['#ffb3d9', '#c8a050'], ['Rosé', '#ffb3d9', '#8a3a5a', 'Eau de Parfum'], 0.9),
  P('lippenstift', 'Lippenstift', '💄', 14.99, 'gadget', [], ['Glam', '#1d2230', '#ff4f8a', 'Rouge'], 0.07, 0.12),
  P('nagellack', 'Nagellack', '💅', 7.99, 'jar', ['#ff4f8a', '#1d2230'], ['Glam', '#ffffff', '#ff4f8a', 'Pink'], 0.7),
  P('creme_m', 'Gesichtscreme', '🧴', 19.99, 'jar', ['#f4f4f4', '#c8a050'], ['Glow', '#f4f4f4', '#c8a050', 'Tagescreme'], 1.0),
  P('tasse', 'Tassen', '☕', 9.99, 'mug', ['#ffffff'], ['Home', '#ffffff', '#e8322b', 'I ♥ Drift']),
  P('pfanne', 'Pfanne', '🍳', 29.99, 'pan', ['#1d2230'], ['Koch', '#e8322b', '#ffffff', '28 cm']),
  P('kerzen', 'Kerzen', '🕯️', 6.99, 'candle', ['#f4efe2'], ['Home', '#f4efe2', '#b07a45', 'Vanille']),
  P('bilderrahmen', 'Bilderrahmen', '🖼️', 12.99, 'gadget', [], ['Home', '#c8a070', '#1d2230', '13 x 18'], 0.16, 0.2),
  P('vinyl', 'Schallplatte', '💿', 24.99, 'book', ['#ffffff'], ['Beats', '#1d2230', '#ff4fa8', 'Drift Hits'], 0.008),
  P('gitarre', 'Ukulele', '🎸', 39.99, 'gadget', [], ['Musik', '#c8914a', '#1d2230', 'Ukulele'], 0.14, 0.3),
  P('sonnenbrille', 'Sonnenbrille', '🕶️', 29.99, 'gadget', [], ['Cool', '#1d2230', '#ffd21f', 'UV 400'], 0.14, 0.1),
  P('uhr', 'Armbanduhr', '⌚', 89.99, 'gadget', [], ['Tick', '#1d2230', '#c8ccd0', 'Sport'], 0.1, 0.1),
  P('rucksack', 'Rucksack', '🎒', 34.99, 'bag', [], ['Trail', '#e8322b', '#1d2230', 'Rucksack'], 0.2, 0.28),
  P('muetze', 'Mütze', '🧢', 14.99, 'helmet', ['#2a62c9'], ['FASHION', '#ffffff', '#2a62c9', '']),
  P('burger', 'Burger', '🍔', 6.99, 'burger', [], ['Burger', '#e8322b', '#ffd21f', '']),
  P('pizzastueck', 'Pizzastück', '🍕', 3.49, 'slice', [], ['Pizza', '#2e8b3a', '#ffffff', '']),
  P('donut', 'Donuts', '🍩', 2.49, 'donut', ['#ff7eb6'], ['Donut', '#ff7eb6', '#ffffff', '']),
  P('smoothie', 'Smoothie', '🥤', 4.99, 'cup', ['#ff6a8a', '#4fb348'], ['Fresh', '#ffffff', '#ff6a8a', 'Beere']),
  P('slush', 'Slush-Eis', '🧊', 2.99, 'cup', ['#4fb0ff', '#ff4fa8'], ['BRRR', '#ffffff', '#2a62c9', 'Blau']),
  P('popcorn_m', 'Kino-Popcorn', '🍿', 4.99, 'cup', ['#ffd21f', '#e8322b'], ['KINO', '#e8322b', '#ffffff', 'XXL'], 1),
  // ======== TIEFKÜHL-LAGER ========
  ...VAR('eis_', 'Eis', 'tub', [], ['Eiskalt'], [['v', 'Vanille', '🍨', '#fff3c4', 3.49], ['s', 'Schoko', '🍫', '#7a4a22', 3.49], ['m', 'Minze', '🌿', '#9ff2c8', 3.49]]),
  P('eisstiel', 'Eis am Stiel', '🍡', 2.99, 'popsicle', ['#ff4f8a'], ['Frosty', '#4fb0ff', '#ffffff', '6 Stück']),
  ...VAR('tkpizza_', 'TK-Pizza', 'pizza', [], ['Pizzeria'], [['m', 'Margherita', '🍕', '#e8322b', 2.49], ['t', 'Thunfisch', '🐟', '#2a62c9', 2.99], ['s', 'Spinat', '🥬', '#2e8b3a', 2.99]]),
  ...VAR('tkgemuese_', 'TK-', 'bag', [], ['Frost'], [['e', 'Erbsen', '🫛', '#4fb348', 1.49], ['s', 'Spinat', '🥬', '#1d6f3a', 1.69], ['m', 'Mischgemüse', '🥕', '#ff8a1f', 1.99]], 0.16, 0.22),
  P('lachs', 'Lachsfilet', '🍣', 6.99, 'box', [], ["Käpt'n", '#ff8a6a', '#ffffff', 'Lachs'], 0.2, 0.05, 0.14),
  P('garnelen', 'Garnelen', '🦐', 7.99, 'bag', [], ["Käpt'n", '#2a62c9', '#ff8a6a', 'Garnelen'], 0.16, 0.2),
  P('hack', 'Hackfleisch', '🥩', 4.49, 'tray', ['#c8504a'], ['Metzger', '#c8261b', '#ffffff', '']),
  P('patties', 'Burger-Patties', '🍔', 5.49, 'box', [], ['Grill', '#3a2412', '#ffd21f', '4 Patties'], 0.2, 0.06, 0.14),
  P('nuggets', 'Chicken Nuggets', '🍗', 3.99, 'box', [], ['Crispy', '#ffd21f', '#e8322b', 'Nuggets'], 0.2, 0.06, 0.14),
  P('fruehlingsrollen', 'Frühlingsrollen', '🥟', 3.49, 'box', [], ['Asia', '#e8322b', '#ffd21f', '8 Stück'], 0.2, 0.06, 0.14),
  P('tkbroetchen', 'TK-Brötchen', '🥯', 2.29, 'bag', [], ['Back', '#c8914a', '#ffffff', '10 Stück'], 0.18, 0.22),
  P('kroketten', 'Kroketten', '🥔', 2.49, 'bag', [], ['Frost', '#ffd21f', '#6b4226', 'Kroketten'], 0.18, 0.24),
  P('roesti', 'Rösti', '🥔', 2.29, 'box', [], ['Frost', '#e8c48a', '#6b4226', 'Rösti'], 0.2, 0.06, 0.14),
  P('lasagne', 'Lasagne', '🍝', 3.99, 'box', [], ['Nonna', '#c8261b', '#ffffff', 'Lasagne'], 0.2, 0.07, 0.14),
  P('asiapfanne', 'Asia-Pfanne', '🍜', 3.49, 'bag', [], ['Asia', '#1d2230', '#ff8a1f', 'Wok'], 0.18, 0.24),
  P('eiswuerfel', 'Eiswürfel', '🧊', 1.29, 'icebag', [], ['BRRR', '#2a62c9', '#ffffff', '2 kg']),
  P('torte', 'Torte', '🎂', 8.99, 'cake', ['#fff3c4', '#ff7eb6'], ['Konditor', '#ff7eb6', '#ffffff', 'Erdbeer']),
  P('tiramisu', 'Tiramisu', '🍰', 4.49, 'cake', ['#7a4a22', '#e8c48a'], ['Dolce', '#7a4a22', '#ffffff', 'Tiramisu']),
  ...VAR('beeren_', 'TK-', 'bag', [], ['Frost'], [['b', 'Beeren', '🫐', '#3a3aa0', 2.99], ['e', 'Erdbeeren', '🍓', '#e8322b', 2.79], ['m', 'Mango', '🥭', '#ffb400', 3.29]], 0.16, 0.22),
);
PRODUCTS.forEach((p, i) => { p.idx = i; PROD[p.id] = p; });

// build each product's geometry once (shared by shelves, the cart and the checkout)
function buildProductGeos(list = PRODUCTS) {
  for (const p of PRODUCTS) { // forget the previous world's labels/geometries
    p.labs = null; p.mainLab = null; p.mainAspect = null;
    for (const k of ['geo', 'geoMid', 'geoLo']) if (p[k]) { p[k].dispose(); p[k] = null; }
  }
  for (const p of list) {
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
    const FLAT = ['box', 'sack', 'bag', 'gadget', 'carton', 'tube', 'soap', 'sponge', 'flask', 'bar', 'butter', 'pizza', 'cups', 'tp'];
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
    } else if (ORGANIC.includes(p.shape) || !FLAT.includes(p.shape)) {
      SEGCAP = 6; SKIP_TINY = true;
      const m = new Obj(); SHAPES[p.shape](m, p, ...p.a);
      SEGCAP = 99; SKIP_TINY = false;
      p.geoMid = objGeo(m);
    } else p.geoMid = p.geoLo;
  }
}
