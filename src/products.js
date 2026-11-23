// ============================================================
//  Shopping Drifters – products: low-poly models + catalogue
//  Every shape is built standing on y=0, centered, front facing +z.
// ============================================================
const SHAPES = {
  // c = [main, accent, label]; returns slot width
  bottle(o, c, s = 1) {
    const r = 0.042 * s;
    o.cyl(r, 0.16 * s, 0, 0.08 * s, 0, c[0], { seg: 8 });
    o.cyl(r, 0.05 * s, 0, 0.185 * s, 0, c[0], { seg: 8, rt: 0.42 });
    o.cyl(r * 0.42, 0.035 * s, 0, 0.225 * s, 0, c[0], { seg: 6 });
    o.cyl(r * 0.5, 0.02 * s, 0, 0.25 * s, 0, c[1], { seg: 6 });
    o.cyl(r * 1.04, 0.06 * s, 0, 0.09 * s, 0, c[2], { seg: 8 });
    return 0.1 * s;
  },
  can(o, c, s = 1) {
    const r = 0.034 * s;
    o.cyl(r, 0.115 * s, 0, 0.0575 * s, 0, c[0], { seg: 8 });
    o.cyl(r * 0.85, 0.012 * s, 0, 0.12 * s, 0, '#c8ccd0', { seg: 8 });
    o.cyl(r * 1.03, 0.05 * s, 0, 0.06 * s, 0, c[2] || c[1], { seg: 8 });
    return 0.076 * s;
  },
  flatcan(o, c) { // tuna / cat food: stacks of flat cans
    for (let i = 0; i < 3; i++) { o.cyl(0.045, 0.038, 0, 0.019 + i * 0.04, 0, c[0], { seg: 8 }); o.cyl(0.046, 0.015, 0, 0.022 + i * 0.04, 0, c[1], { seg: 8 }); }
    return 0.1;
  },
  box(o, c, w = 0.16, h = 0.24, d = 0.07) {
    o.box(w, h, d, 0, h / 2, 0, c[0]);
    o.box(w * 0.78, h * 0.42, 0.006, 0, h * 0.5, d / 2 + 0.002, c[1]);
    o.box(w + 0.002, h * 0.12, d + 0.002, 0, h * 0.86, 0, c[2] || c[1]);
    return w + 0.02;
  },
  carton(o, c, s = 1) { // milk / juice carton with gable top
    const w = 0.07 * s, h = 0.17 * s;
    o.box(w, h, w, 0, h / 2, 0, c[0]);
    o.add(geoCyl(3), 0, h + 0.012 * s, 0, w * 0.58, w, w * 0.4, c[0], 0, 0, PI / 2);
    o.box(w + 0.004, h * 0.35, w + 0.004, 0, h * 0.45, 0, c[1]);
    o.box(w * 0.5, w * 0.5, 0.004, 0, h * 0.45, w / 2 + 0.004, c[2] || c[1]);
    o.cyl(0.012 * s, 0.015 * s, w * 0.2, h + 0.03 * s, 0, c[2] || '#fff', { seg: 6 });
    return w + 0.025;
  },
  jar(o, c, s = 1) {
    const r = 0.04 * s;
    o.cyl(r, 0.09 * s, 0, 0.045 * s, 0, c[0], { seg: 8 });
    o.cyl(r * 1.05, 0.025 * s, 0, 0.1 * s, 0, c[1], { seg: 8 });
    o.cyl(r * 1.03, 0.045 * s, 0, 0.045 * s, 0, c[2] || '#f4efe2', { seg: 8 });
    return 0.095 * s;
  },
  bag(o, c, w = 0.16, h = 0.22) { // puffy crisp bag
    o.sph(1, 0, h / 2, 0, c[0], { sx: w / 2, sy: h / 2.1, sz: 0.045, seg: 7 });
    o.box(w * 0.95, 0.02, 0.02, 0, h - 0.01, 0, c[1]);
    o.box(w * 0.95, 0.02, 0.02, 0, 0.012, 0, c[1]);
    o.box(w * 0.5, h * 0.3, 0.01, 0, h * 0.5, 0.042, c[2] || c[1]);
    return w + 0.015;
  },
  bar(o, c) { // chocolate bars standing in a tray
    o.box(0.13, 0.03, 0.12, 0, 0.015, 0, c[1]);
    for (let i = 0; i < 3; i++) o.box(0.11, 0.16, 0.02, 0, 0.11, -0.035 + i * 0.035, i === 2 ? c[0] : c[0], { rx: -0.12 });
    o.box(0.08, 0.04, 0.005, 0, 0.14, 0.05, c[2], { rx: -0.12 });
    return 0.14;
  },
  cups(o, c) { // yogurt cups 2x
    for (const x of [-0.04, 0.04]) {
      o.cyl(0.035, 0.08, x, 0.04, 0, c[0], { seg: 8, rt: 1.25 });
      o.cyl(0.045, 0.006, x, 0.083, 0, c[1], { seg: 8 });
      o.cyl(0.0445, 0.03, x, 0.05, 0, c[2] || c[1], { seg: 8, rt: 1.12 });
    }
    return 0.17;
  },
  tp(o, c) { // toilet paper / kitchen roll pack
    const big = c[3];
    const r = big ? 0.06 : 0.05, h = big ? 0.22 : 0.1, nx = 2, ny = big ? 1 : 2;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      o.cyl(r, h, -r + i * 2 * r, h / 2 + j * h, 0, c[0], { seg: 8 });
      o.cyl(r * 0.3, h + 0.002, -r + i * 2 * r, h / 2 + j * h, 0, '#c7a77a', { seg: 6 });
    }
    o.box(4 * r + 0.01, h * ny * 0.3, 2 * r + 0.01, 0, h * ny * 0.55, 0, c[1]);
    o.box(4 * r * 0.6, h * ny * 0.18, 0.006, 0, h * ny * 0.55, r + 0.008, c[2]);
    return 4 * r + 0.03;
  },
  flask(o, c, s = 1) { // shampoo / dish soap
    o.box(0.08 * s, 0.17 * s, 0.045 * s, 0, 0.085 * s, 0, c[0]);
    o.cyl(0.02 * s, 0.04 * s, 0.01 * s, 0.19 * s, 0, c[1], { seg: 6, rt: 0.6 });
    o.box(0.06 * s, 0.07 * s, 0.006, 0, 0.08 * s, 0.025 * s, c[2]);
    return 0.095 * s;
  },
  spray(o, c) {
    o.cyl(0.026, 0.15, 0, 0.075, 0, c[0], { seg: 8 });
    o.cyl(0.026, 0.04, 0, 0.17, 0, c[1], { seg: 8, rt: 0.8 });
    o.cyl(0.027, 0.04, 0, 0.08, 0, c[2], { seg: 8 });
    return 0.065;
  },
  tube(o, c) { // toothpaste box
    o.box(0.18, 0.045, 0.045, 0, 0.0225, 0, c[0]);
    o.box(0.18, 0.045, 0.045, 0, 0.0675, 0, c[0]);
    o.box(0.08, 0.05, 0.006, -0.03, 0.045, 0.024, c[1]);
    o.box(0.03, 0.09, 0.047, 0.07, 0.045, 0, c[2]);
    return 0.2;
  },
  soap(o, c) {
    for (let i = 0; i < 3; i++) o.box(0.09, 0.03, 0.06, 0, 0.015 + i * 0.031, 0, i % 2 ? c[0] : c[1]);
    o.box(0.05, 0.02, 0.004, 0, 0.08, 0.031, c[2]);
    return 0.1;
  },
  sponge(o, c) {
    for (let i = 0; i < 3; i++) { o.box(0.1, 0.025, 0.065, 0, 0.0125 + i * 0.05, 0, c[0]); o.box(0.1, 0.022, 0.065, 0, 0.036 + i * 0.05, 0, c[1]); }
    return 0.11;
  },
  sack(o, c, w = 0.2, h = 0.3) { // dog food, flour, sugar
    o.box(w, h * 0.85, w * 0.45, 0, h * 0.425, 0, c[0]);
    o.box(w * 0.98, h * 0.15, w * 0.2, 0, h * 0.9, 0, c[0]);
    o.box(w * 0.7, h * 0.35, 0.006, 0, h * 0.45, w * 0.225 + 0.002, c[1]);
    o.box(w * 0.3, h * 0.12, 0.007, 0, h * 0.45, w * 0.225 + 0.004, c[2] || c[1]);
    return w + 0.02;
  },
  squeeze(o, c) { // ketchup
    o.cyl(0.035, 0.14, 0, 0.09, 0, c[0], { seg: 8, rt: 0.85 });
    o.cyl(0.03, 0.03, 0, 0.015, 0, c[1], { seg: 8 });
    o.box(0.05, 0.05, 0.004, 0, 0.1, 0.034, c[2]);
    return 0.085;
  },
  crate(o, c) { // drinks crate with bottles
    o.box(0.32, 0.22, 0.22, 0, 0.11, 0, c[0]);
    o.box(0.26, 0.05, 0.006, 0, 0.12, 0.112, c[1]);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      o.cyl(0.018, 0.08, -0.12 + i * 0.08, 0.25, -0.07 + j * 0.07, c[2], { seg: 5, rt: 0.5 });
      o.cyl(0.01, 0.012, -0.12 + i * 0.08, 0.295, -0.07 + j * 0.07, c[1], { seg: 5 });
    }
    return 0.34;
  },
  // ---- bakery ----
  loaf(o, c) {
    o.sph(1, 0, 0.055, 0, c[0], { sx: 0.12, sy: 0.07, sz: 0.075, seg: 8 });
    for (let i = -1; i <= 1; i++) o.box(0.012, 0.02, 0.09, i * 0.05, 0.115, 0, c[1], { rz: 0.3 });
    return 0.26;
  },
  toast(o, c) {
    o.box(0.12, 0.09, 0.2, 0, 0.045, 0, c[0]);
    o.cyl(0.06, 0.2, 0, 0.09, 0, c[0], { rx: PI / 2, seg: 8, sz: 1 });
    o.box(0.124, 0.05, 0.12, 0, 0.06, 0, c[1]);
    o.box(0.03, 0.04, 0.03, 0, 0.12, -0.11, c[2]);
    return 0.14;
  },
  croissant(o, c) {
    o.box(0.22, 0.012, 0.14, 0, 0.006, 0, '#d9d2c4');
    for (const [x, z] of [[-0.05, 0.02], [0.05, -0.02]]) o.torus(0.045, 0.45, x, 0.035, z, c[0], { arc: PI * 1.2, rx: PI / 2, rz: PI * 0.9, seg: 7 });
    return 0.24;
  },
  baguette(o, c) {
    o.box(0.16, 0.1, 0.1, 0, 0.05, 0, c[1]);
    for (let i = 0; i < 3; i++) o.cyl(0.022, 0.32, -0.04 + i * 0.04, 0.19, 0, c[0], { seg: 6, rz: (i - 1) * 0.15, rt: 0.7 });
    return 0.18;
  },
  // ---- dairy / fridge ----
  wheel(o, c) { // cheese wheel with cut
    o.cyl(0.09, 0.07, 0, 0.035, 0, c[1], { seg: 9 });
    o.cyl(0.085, 0.072, 0, 0.035, 0, c[0], { seg: 9 });
    o.box(0.06, 0.04, 0.004, 0, 0.04, 0.088, c[2]);
    return 0.2;
  },
  eggs(o, c) {
    o.box(0.2, 0.05, 0.1, 0, 0.025, 0, c[0]);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) o.sph(0.022, -0.065 + i * 0.065, 0.065, -0.024 + j * 0.048, c[1], { sy: 1.3, seg: 6 });
    o.box(0.2, 0.008, 0.1, 0, 0.09, 0, c[0]);
    return 0.22;
  },
  butter(o, c) {
    for (let i = 0; i < 2; i++) { o.box(0.1, 0.04, 0.06, 0, 0.02 + i * 0.042, 0, c[0]); o.box(0.05, 0.025, 0.004, 0, 0.02 + i * 0.042, 0.031, c[1]); }
    return 0.11;
  },
  tray(o, c) { // meat / sausages / chicken in tray with film
    o.box(0.2, 0.03, 0.14, 0, 0.015, 0, '#f2f2f2');
    if (c[3] === 'saus') for (let i = 0; i < 4; i++) o.cyl(0.015, 0.17, 0, 0.045, -0.045 + i * 0.03, c[0], { rz: PI / 2, seg: 6 });
    else if (c[3] === 'chick') { o.sph(0.07, 0, 0.06, 0, c[0], { sx: 1.2, sy: 0.75, seg: 7 }); o.sph(0.03, -0.07, 0.05, 0.03, c[0], { seg: 6 }); o.sph(0.03, 0.07, 0.05, 0.03, c[0], { seg: 6 }); }
    else { o.sph(1, 0, 0.04, 0, c[0], { sx: 0.085, sy: 0.025, sz: 0.055, seg: 7 }); o.box(0.15, 0.004, 0.1, 0, 0.05, 0, c[1]); }
    o.box(0.06, 0.03, 0.004, 0.05, 0.03, 0.071, c[2]);
    return 0.22;
  },
  salami(o, c) {
    o.cyl(0.035, 0.22, 0, 0.035, 0, c[0], { rz: PI / 2, seg: 7 });
    o.cyl(0.03, 0.005, 0.111, 0.035, 0, c[1], { rz: PI / 2, seg: 7 });
    o.box(0.008, 0.075, 0.075, -0.06, 0.035, 0, c[2]);
    return 0.24;
  },
  pizza(o, c) {
    for (let i = 0; i < 3; i++) o.box(0.28, 0.03, 0.28, 0, 0.015 + i * 0.032, 0, c[0]);
    o.cyl(0.08, 0.006, 0, 0.065, 0.142, c[1], { rx: PI / 2, seg: 10 });
    o.cyl(0.02, 0.008, 0.03, 0.08, 0.144, c[2], { rx: PI / 2, seg: 6 });
    o.cyl(0.02, 0.008, -0.03, 0.05, 0.144, c[2], { rx: PI / 2, seg: 6 });
    return 0.3;
  },
  tub(o, c) { // ice cream
    o.cyl(0.07, 0.09, 0, 0.045, 0, c[0], { seg: 9, rt: 1.12 });
    o.cyl(0.08, 0.02, 0, 0.1, 0, c[1], { seg: 9 });
    o.sph(0.03, 0, 0.05, 0.07, c[2], { sz: 0.3, seg: 6 });
    return 0.17;
  },
  // ---- produce (crates) ----
  crateOf(o, c) {
    o.box(0.46, 0.1, 0.34, 0, 0.05, 0, '#b07a45');
    o.box(0.47, 0.03, 0.35, 0, 0.1, 0, '#9a6535');
    const kind = c[3];
    rng = mulberry32(kind.length * 31 + 7);
    if (kind === 'ball') {
      const r = c[4] || 0.04;
      for (let x = -0.18; x <= 0.18; x += r * 2.05) for (let z = -0.12; z <= 0.12; z += r * 2.05) o.sph(r, x + R(-0.01, 0.01), 0.1 + r * 0.8, z, (rng() < 0.5 ? c[0] : c[1]), { seg: 6 });
      for (let x = -0.13; x <= 0.13; x += r * 2.1) o.sph(r, x, 0.1 + r * 2.3, R(-0.05, 0.05), c[0], { seg: 6 });
    } else if (kind === 'melon') {
      for (const x of [-0.11, 0.11]) { o.sph(0.12, x, 0.18, 0, c[0], { sx: 0.95, sz: 1.1, seg: 8 }); o.sph(0.121, x, 0.18, 0, c[1], { sx: 0.5, sz: 1.1, seg: 8 }); }
    } else if (kind === 'banana') {
      for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) o.torus(0.11, 0.18, -0.15 + i * 0.1, 0.13 + (k % 2) * 0.02, -0.11 + k * 0.07, k % 3 === 2 ? c[1] : c[0], { arc: 1.4, rz: PI * 1.15, rx: 0, ry: PI / 2, seg: 5 });
    } else if (kind === 'carrot') {
      for (let i = 0; i < 9; i++) { const x = -0.16 + (i % 5) * 0.08, z = -0.07 + Math.floor(i / 5) * 0.11; o.cone(0.025, 0.2, x, 0.13, z, c[0], { rx: PI / 2, rz: R(-0.2, 0.2), seg: 6 }); o.cone(0.02, 0.07, x, 0.13, z - 0.13, c[1], { rx: -PI / 2, seg: 5 }); }
    } else if (kind === 'broc') {
      for (let i = 0; i < 6; i++) { const x = -0.14 + (i % 3) * 0.14, z = -0.07 + Math.floor(i / 3) * 0.14; o.cyl(0.02, 0.06, x, 0.13, z, c[1], { seg: 5 }); for (let k = 0; k < 4; k++) o.ico(0.035, x + Math.cos(k * 1.6) * 0.03, 0.18, z + Math.sin(k * 1.6) * 0.03, c[0]); o.ico(0.04, x, 0.2, z, c[0]); }
    }
    return 0.48;
  },
  // ---- toys / pets ----
  duck(o, c) {
    o.sph(0.06, 0, 0.055, 0, c[0], { sx: 1.1, sy: 0.85, sz: 1.3, seg: 8 });
    o.sph(0.04, 0, 0.12, 0.04, c[0], { seg: 7 });
    o.cone(0.02, 0.04, 0, 0.115, 0.09, c[1], { rx: PI / 2, seg: 5 });
    o.sph(0.008, 0.022, 0.135, 0.07, '#111', { seg: 4 }); o.sph(0.008, -0.022, 0.135, 0.07, '#111', { seg: 4 });
    o.sph(0.03, 0, 0.08, -0.07, c[0], { seg: 5 });
    return 0.14;
  },
  ball(o, c) {
    o.ico(0.1, 0, 0.1, 0, c[0], { d: 1 });
    o.torus(0.1, 0.06, 0, 0.1, 0, c[1], { rx: PI / 2, seg: 10 });
    o.torus(0.1, 0.06, 0, 0.1, 0, c[1], { seg: 10 });
    return 0.22;
  },
  teddy(o, c) {
    o.sph(0.07, 0, 0.08, 0, c[0], { sy: 1.15, seg: 7 });
    o.sph(0.055, 0, 0.19, 0.01, c[0], { seg: 7 });
    for (const s of [-1, 1]) { o.sph(0.022, s * 0.045, 0.24, 0, c[0], { seg: 5 }); o.sph(0.028, s * 0.07, 0.11, 0.03, c[0], { seg: 5 }); o.sph(0.03, s * 0.045, 0.025, 0.04, c[0], { seg: 5 }); o.sph(0.007, s * 0.02, 0.205, 0.055, '#111', { seg: 4 }); }
    o.sph(0.022, 0, 0.18, 0.052, c[1], { seg: 5 });
    o.box(0.06, 0.02, 0.02, 0, 0.145, 0.05, c[2]);
    return 0.18;
  },
  toycar(o, c) {
    o.box(0.18, 0.12, 0.12, 0, 0.06, 0, c[2]);
    o.box(0.15, 0.04, 0.07, 0, 0.055, 0.0, c[0]);
    o.box(0.08, 0.035, 0.065, -0.01, 0.09, 0, c[0]);
    for (const x of [-0.05, 0.05]) o.cyl(0.015, 0.075, x, 0.03, 0, '#222', { rx: PI / 2, seg: 6 });
    o.box(0.17, 0.115, 0.004, 0, 0.06, 0.062, c[1]);
    return 0.2;
  },
  bone(o, c) {
    o.cyl(0.018, 0.14, 0, 0.03, 0, c[0], { rz: PI / 2, seg: 6 });
    for (const x of [-0.075, 0.075]) for (const z of [-0.018, 0.018]) o.sph(0.026, x, 0.03, z, c[0], { seg: 6 });
    o.box(0.12, 0.004, 0.06, 0, 0.003, 0, c[1]);
    return 0.2;
  },
};

// ---- catalogue: id, name, emoji, price, shape, colors, extra args ----
const P = (id, n, e, price, shape, c, ...a) => ({ id, n, e, price, shape, c, a });
const PRODUCTS = [
  // Getränke
  P('cola', 'Cola', '🥤', 1.29, 'bottle', ['#4a1608', '#d0161b', '#d0161b'], 1.15),
  P('wasser', 'Wasser', '💧', 0.49, 'bottle', ['#9fd4ef', '#2a62c9', '#2a62c9'], 1.15),
  P('limo', 'Zitronenlimo', '🍋', 1.19, 'bottle', ['#e6e14a', '#2e8b3a', '#2e8b3a'], 1.1),
  P('energy', 'Energy Drink', '⚡', 1.49, 'can', ['#1d2a5c', '#c8ccd0', '#8de03a'], 1.2),
  P('osaft', 'Orangensaft', '🍊', 1.79, 'carton', ['#ffa21f', '#ffffff', '#ff6a00'], 1.25),
  P('asaft', 'Apfelsaft', '🍏', 1.59, 'carton', ['#7cc444', '#ffffff', '#c22a2a'], 1.25),
  P('eistee', 'Eistee', '🧋', 0.99, 'carton', ['#e68b2a', '#fbe6b8', '#4d7d2b'], 1.0),
  P('kiste', 'Wasserkiste', '📦', 5.99, 'crate', ['#2a62c9', '#ffffff', '#9fd4ef']),
  // Süßes
  P('schoko', 'Schokolade', '🍫', 1.19, 'bar', ['#6a2fa0', '#d8d8d8', '#ffffff']),
  P('gummi', 'Gummibärchen', '🐻', 1.09, 'bag', ['#f2c200', '#d6262b', '#ffffff'], 0.15, 0.2),
  P('kekse', 'Kekse', '🍪', 1.49, 'box', ['#2a4fa8', '#c8914a', '#ffffff'], 0.2, 0.08, 0.12),
  P('lolli', 'Lollis', '🍭', 0.89, 'jar', ['#ff7eb6', '#ffffff', '#7fd3ff'], 1.3),
  // Snacks
  P('chips', 'Chips', '🥔', 1.69, 'bag', ['#e8322b', '#f2c200', '#ffd84a'], 0.17, 0.24),
  P('popcorn', 'Popcorn', '🍿', 1.39, 'bag', ['#2453c9', '#ffffff', '#ffe066'], 0.15, 0.22),
  P('nuesse', 'Erdnüsse', '🥜', 2.29, 'jar', ['#b8792d', '#c0161b', '#fbe6b8'], 1.15),
  P('salzst', 'Salzstangen', '🥨', 0.79, 'box', ['#1d7a3a', '#c8914a', '#ffffff'], 0.08, 0.28, 0.06),
  // Frühstück
  P('muesli', 'Müsli', '🥣', 2.49, 'box', ['#f6d36b', '#b8792d', '#2e8b3a'], 0.19, 0.27, 0.07),
  P('honig', 'Honig', '🍯', 3.49, 'jar', ['#e9a419', '#2a2a2a', '#fff3c4']),
  P('marmelade', 'Marmelade', '🍓', 1.99, 'jar', ['#b8142a', '#f4f4f4', '#ffffff']),
  P('creme', 'Schokocreme', '🌰', 2.79, 'jar', ['#5a3418', '#ffffff', '#e8322b'], 1.15),
  // Backwaren
  P('brot', 'Brot', '🍞', 2.29, 'loaf', ['#b97b3a', '#8a5523']),
  P('toast', 'Toastbrot', '🥪', 1.29, 'toast', ['#e8c48a', '#2a7de1', '#ffd84a']),
  P('croissant', 'Croissants', '🥐', 1.99, 'croissant', ['#d99a3e']),
  P('baguette', 'Baguette', '🥖', 0.99, 'baguette', ['#d9a253', '#b07a45']),
  // Nudeln & Reis
  P('spaghetti', 'Spaghetti', '🍝', 0.99, 'box', ['#1f4fb8', '#f2d27a', '#ffffff'], 0.08, 0.27, 0.04),
  P('fusilli', 'Fusilli', '🌀', 0.99, 'bag', ['#f0e6c8', '#1f4fb8', '#d6262b'], 0.12, 0.2),
  P('reis', 'Reis', '🍚', 1.89, 'sack', ['#ffffff', '#d6262b', '#f2c200'], 0.12, 0.18),
  P('tomsauce', 'Tomatensoße', '🍅', 1.49, 'jar', ['#c8261b', '#2e8b3a', '#ffffff'], 1.1),
  // Konserven
  P('mais', 'Mais', '🌽', 0.89, 'can', ['#2e8b3a', '#f2c200', '#f2c200'], 1.1),
  P('bohnen', 'Bohnen', '🫘', 0.79, 'can', ['#8a2a1b', '#c8ccd0', '#ff8a3d'], 1.1),
  P('thunfisch', 'Thunfisch', '🐟', 1.99, 'flatcan', ['#2a62c9', '#c8ccd0']),
  P('ravioli', 'Ravioli', '🥫', 1.79, 'can', ['#d6262b', '#c8ccd0', '#ffd84a'], 1.35),
  // Backen & Würzen
  P('mehl', 'Mehl', '🌾', 0.69, 'sack', ['#f4efe2', '#2a62c9', '#f2c200'], 0.12, 0.19),
  P('zucker', 'Zucker', '🧂', 0.99, 'sack', ['#ffffff', '#e8322b', '#2a62c9'], 0.12, 0.16),
  P('salz', 'Salz', '🫙', 0.49, 'spray', ['#2a7de1', '#ffffff', '#ffffff']),
  P('ketchup', 'Ketchup', '🍅', 1.89, 'squeeze', ['#d6262b', '#ffffff', '#ffffff']),
  // Spielzeug
  P('ente', 'Gummiente', '🦆', 2.99, 'duck', ['#ffd21f', '#ff8a1f']),
  P('fussball', 'Fußball', '⚽', 9.99, 'ball', ['#f4f4f4', '#222222']),
  P('teddy', 'Teddybär', '🧸', 12.99, 'teddy', ['#a8693a', '#3a2412', '#d6262b']),
  P('auto', 'Spielzeugauto', '🏎️', 7.99, 'toycar', ['#e8322b', '#bfe6ff', '#f2c200']),
  // Haushalt
  P('klopapier', 'Klopapier', '🧻', 3.49, 'tp', ['#ffffff', '#5aa9e6', '#ffffff']),
  P('kuechenrolle', 'Küchenrolle', '🧻', 2.29, 'tp', ['#ffffff', '#2e8b3a', '#ffffff', 1]),
  P('spueli', 'Spülmittel', '🫧', 1.19, 'flask', ['#4ccf5a', '#ffffff', '#ffe066'], 1.1),
  P('schwamm', 'Schwämme', '🧽', 1.49, 'sponge', ['#ffd21f', '#2e8b3a']),
  // Drogerie
  P('zahnpasta', 'Zahnpasta', '🪥', 1.29, 'tube', ['#ffffff', '#2a7de1', '#d6262b']),
  P('shampoo', 'Shampoo', '🧴', 2.49, 'flask', ['#b34fe0', '#ffffff', '#ffffff'], 1.2),
  P('seife', 'Seife', '🧼', 0.99, 'soap', ['#ff9ec7', '#ffffff', '#7fd3ff']),
  P('deo', 'Deo', '💨', 1.99, 'spray', ['#1d2a5c', '#c8ccd0', '#5aa9e6']),
  // Tierbedarf
  P('katzenfutter', 'Katzenfutter', '🐱', 0.69, 'flatcan', ['#e8322b', '#f2c200']),
  P('hundefutter', 'Hundefutter', '🐶', 8.99, 'sack', ['#c8261b', '#f2c200', '#ffffff'], 0.22, 0.32),
  P('knochen', 'Kauknochen', '🦴', 1.99, 'bone', ['#f4efe2', '#2a7de1']),
  P('vogelfutter', 'Vogelfutter', '🐦', 2.49, 'box', ['#7fd3ff', '#f2c200', '#2e8b3a'], 0.14, 0.2, 0.07),
  // Kaffee & Tee
  P('kaffee', 'Kaffee', '☕', 5.99, 'box', ['#3a2412', '#e0b04a', '#e0b04a'], 0.09, 0.17, 0.06),
  P('tee', 'Tee', '🍵', 1.79, 'box', ['#2e8b3a', '#ffffff', '#e0b04a'], 0.13, 0.07, 0.07),
  P('kakao', 'Kakao', '🥛', 2.99, 'jar', ['#7a4a22', '#f2c200', '#f2c200'], 1.3),
  P('espresso', 'Espresso', '🫘', 4.49, 'can', ['#222222', '#c8ccd0', '#d6262b'], 1.3),
  // Kühlregal
  P('milch', 'Milch', '🥛', 1.09, 'carton', ['#ffffff', '#2a62c9', '#2a62c9'], 1.3),
  P('kaese', 'Käse', '🧀', 3.29, 'wheel', ['#ffd84a', '#d6262b', '#ffffff']),
  P('joghurt', 'Joghurt', '🍶', 0.59, 'cups', ['#ffffff', '#ff7eb6', '#ff7eb6']),
  P('butter', 'Butter', '🧈', 1.99, 'butter', ['#f2c200', '#2a62c9']),
  P('eier', 'Eier', '🥚', 2.49, 'eggs', ['#bdb6a6', '#f3e3c3']),
  P('salami', 'Salami', '🍕', 2.99, 'salami', ['#7a2a1b', '#e07a6a', '#f2c200']),
  P('wuerstchen', 'Würstchen', '🌭', 2.49, 'tray', ['#e8a07a', '#ffffff', '#d6262b', 'saus']),
  P('haehnchen', 'Hähnchen', '🍗', 4.99, 'tray', ['#f0d2a8', '#ffffff', '#f2c200', 'chick']),
  P('schinken', 'Schinken', '🥓', 2.79, 'tray', ['#f28c8c', '#ffffff', '#2e8b3a']),
  P('pizza', 'TK-Pizza', '🍕', 2.99, 'pizza', ['#2a62c9', '#e8322b', '#f2c200']),
  P('eis', 'Eiscreme', '🍦', 3.49, 'tub', ['#ffe6f0', '#ff7eb6', '#7a4a22']),
  P('pommes', 'Pommes', '🍟', 2.19, 'bag', ['#e8322b', '#f2c200', '#ffd84a'], 0.2, 0.26),
  P('fischst', 'Fischstäbchen', '🐠', 2.69, 'box', ['#1d6fd8', '#f2a63a', '#ffffff'], 0.22, 0.05, 0.14),
  // Obst & Gemüse
  P('aepfel', 'Äpfel', '🍎', 2.49, 'crateOf', ['#d6262b', '#7cc444', '', 'ball', 0.04]),
  P('bananen', 'Bananen', '🍌', 1.69, 'crateOf', ['#ffd21f', '#c9b51a', '', 'banana']),
  P('karotten', 'Karotten', '🥕', 0.99, 'crateOf', ['#ff8a1f', '#3f9b3a', '', 'carrot']),
  P('tomaten', 'Tomaten', '🍅', 1.99, 'crateOf', ['#e8261b', '#d01b10', '', 'ball', 0.035]),
  P('melone', 'Wassermelone', '🍉', 3.99, 'crateOf', ['#2f8a2f', '#1d5e1d', '', 'melon']),
  P('brokkoli', 'Brokkoli', '🥦', 1.49, 'crateOf', ['#2f9a3a', '#7cc444', '', 'broc']),
];
const PROD = {}; PRODUCTS.forEach((p, i) => { p.idx = i; PROD[p.id] = p; });

// build each product's geometry once (shared by shelves, the cart and the checkout)
function buildProductGeos() {
  for (const p of PRODUCTS) {
    const o = new Obj();
    p.w = SHAPES[p.shape](o, p.c, ...p.a);
    p.geo = objGeo(o);
    const bb = p.geo.boundingBox;
    p.h = bb.max.y - bb.min.y; p.d = bb.max.z - bb.min.z;
    // low detail version for far away shelves: a box + a front label
    const lo = new Obj(), bw = bb.max.x - bb.min.x, cx = (bb.max.x + bb.min.x) / 2, cz = (bb.max.z + bb.min.z) / 2;
    if (p.shape === 'crateOf') { lo.box(bw, 0.11, p.d, cx, 0.055, cz, '#b07a45'); lo.box(bw * 0.92, p.h - 0.11, p.d * 0.9, cx, 0.11 + (p.h - 0.11) / 2, cz, p.c[0]); }
    else {
      lo.box(bw * 0.92, p.h, p.d * 0.9, cx, p.h / 2, cz, p.c[0]);
      lo.add(geoPlane(), cx, p.h * 0.5, bb.max.z * 0.9 + 0.003, bw * 0.6, p.h * 0.35, 1, p.c[2] || p.c[1]);
    }
    p.geoLo = objGeo(lo);
  }
}
