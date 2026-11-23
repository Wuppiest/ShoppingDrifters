// ============================================================
//  Shopping Drifters – the supermarket (layout, shelves, products, checkouts)
// ============================================================
const STORE = { W0: -30, W1: 30, D0: 0, D1: 50, H: 5.6 };
const START = { x: 0, z: 3.2, h: 0 };
const GONDOLA_X = [-20, -12, -4, 4, 12, 20];
const HALVES = [[14, 27], [31, 44]];
const SHELF_LEVELS = [0.13, 0.58, 1.03, 1.48];
const COOLER_Z = 48.8;

// aisle boundaries (front faces of the shelves left/right of each aisle)
const AISLES = [];
{
  const xs = [-29.4, ...GONDOLA_X.flatMap((g) => [g - 0.8, g + 0.8]), 29.4];
  for (let i = 0; i < 7; i++) AISLES.push({ x0: xs[i * 2], x1: xs[i * 2 + 1], cx: (xs[i * 2] + xs[i * 2 + 1]) / 2 });
}

// [aisle][half] → category
const SECTIONS = [
  [{ n: 'Getränke', e: '🥤', col: '#2a62c9', t: ['cola', 'wasser', 'limo', 'energy'] }, { n: 'Säfte & Kisten', e: '🧃', col: '#ff8a1f', t: ['osaft', 'asaft', 'eistee', 'kiste'] }],
  [{ n: 'Süßes', e: '🍬', col: '#e0408a', t: ['schoko', 'gummi', 'kekse', 'lolli'] }, { n: 'Snacks', e: '🍿', col: '#e8322b', t: ['chips', 'popcorn', 'nuesse', 'salzst'] }],
  [{ n: 'Frühstück', e: '🥣', col: '#e0a019', t: ['muesli', 'honig', 'marmelade', 'creme'] }, { n: 'Backwaren', e: '🥖', col: '#b07a45', t: ['brot', 'toast', 'croissant', 'baguette'] }],
  [{ n: 'Nudeln & Reis', e: '🍝', col: '#1f4fb8', t: ['spaghetti', 'fusilli', 'reis', 'tomsauce'] }, { n: 'Konserven', e: '🥫', col: '#c8261b', t: ['mais', 'bohnen', 'thunfisch', 'ravioli'] }],
  [{ n: 'Backen & Würzen', e: '🧂', col: '#8a6bd6', t: ['mehl', 'zucker', 'salz', 'ketchup'] }, { n: 'Spielzeug', e: '🧸', col: '#ffb400', t: ['ente', 'fussball', 'teddy', 'auto'] }],
  [{ n: 'Haushalt', e: '🧻', col: '#2e9b8a', t: ['klopapier', 'kuechenrolle', 'spueli', 'schwamm'] }, { n: 'Drogerie', e: '🧴', col: '#b34fe0', t: ['zahnpasta', 'shampoo', 'seife', 'deo'] }],
  [{ n: 'Tierbedarf', e: '🐾', col: '#5a9e2e', t: ['katzenfutter', 'hundefutter', 'knochen', 'vogelfutter'] }, { n: 'Kaffee & Tee', e: '☕', col: '#6b4226', t: ['kaffee', 'tee', 'kakao', 'espresso'] }],
];
const SPOTS = {};       // productId → pickup spot
const LANES = [];       // checkout lanes
const STORE_ANIM = {};
const PRODUCT_LOD = []; // per product type: detailed + simple instanced mesh  // things that animate (doors, lane lamps, …)

function buildStore(scene) {
  rng = mulberry32(42);
  const acc = new MeshAcc();      // shelves, counters … (cast shadows)
  const flat = new MeshAcc();     // walls, deco without shadow casting
  const inst = PRODUCTS.map(() => []);
  const faces = [];

  // ---------- floor & ceiling ----------
  const tileTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#cfc9bd'; g.fillRect(0, 0, w, h);
    const cs = ['#ece8df', '#e2ddd2'];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = cs[(i + j) % 2]; g.fillRect(i * 128 + 3, j * 128 + 3, 122, 122); }
  });
  tileTex.wrapS = tileTex.wrapT = T.RepeatWrapping; tileTex.repeat.set(30, 25);
  const floor = new T.Mesh(new T.PlaneGeometry(60, 50), new T.MeshLambertMaterial({ map: tileTex }));
  floor.rotation.x = -PI / 2; floor.position.set(0, 0, 25); floor.receiveShadow = true; scene.add(floor);
  // colored walkway stripe from the entrance
  const stripe = new T.Mesh(new T.PlaneGeometry(2.2, 10), new T.MeshLambertMaterial({ color: '#1aa39a' }));
  stripe.rotation.x = -PI / 2; stripe.position.set(0, 0.004, 5); stripe.receiveShadow = true; scene.add(stripe);
  const outside = new T.Mesh(new T.PlaneGeometry(300, 300), new T.MeshLambertMaterial({ color: '#6f747c' }));
  outside.rotation.x = -PI / 2; outside.position.set(0, -0.02, 0); outside.receiveShadow = true; scene.add(outside);

  const ceil = new T.Mesh(new T.PlaneGeometry(60, 50), new T.MeshLambertMaterial({ color: '#cfccc4' }));
  ceil.rotation.x = PI / 2; ceil.position.set(0, STORE.H, 25); scene.add(ceil);
  const lampAcc = new MeshAcc();
  const lampObj = new Obj();
  for (const a of AISLES) for (let z = 3; z < 49; z += 4.5) lampObj.box(0.5, 0.06, 2.6, a.cx, STORE.H - 0.05, z, '#ffffff');
  for (const g of [-8, 8]) for (let z = 3; z < 12; z += 4) lampObj.box(3, 0.06, 0.5, g, STORE.H - 0.05, z, '#ffffff');
  lampAcc.addObj(lampObj);
  scene.add(lampAcc.build(new T.MeshBasicMaterial({ color: '#fffdf2' })));

  // ---------- walls ----------
  const wallC = '#f1ece0', bandC = '#1aa39a', kickC = '#8a8f99';
  const wo = new Obj();
  const wall = (x0, z0, x1, z1) => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = Math.abs(x1 - x0) || 0.4, d = Math.abs(z1 - z0) || 0.4;
    wo.box(w, STORE.H, d, cx, STORE.H / 2, cz, wallC);
    wo.box(w + 0.02, 0.45, d + 0.02, cx, 2.75, cz, bandC);
    wo.box(w + 0.03, 0.25, d + 0.03, cx, 0.125, cz, kickC);
    addCol(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2);
  };
  wall(-30.2, 0, -30.2, 50); wall(30.2, 0, 30.2, 50); wall(-30, 50.2, 30, 50.2);
  wall(-30, -0.2, -3, -0.2); wall(3, -0.2, 30, -0.2);
  wo.box(6, STORE.H - 3, 0.4, 0, 3 + (STORE.H - 3) / 2, -0.2, wallC);
  addCol(-3, -0.6, 3, -0.05); // invisible: you can't leave through the doors
  flat.addObj(wo);

  // exterior shell, roof, sign
  const ex = new Obj();
  ex.box(61.2, 0.5, 51.2, 0, STORE.H + 0.35, 25, '#9aa0a8'); // roof (kept above the ceiling plane → no z-fighting)
  for (const sx of [-1, 1]) {
    ex.box(27.7, 6.6, 0.3, sx * 16.85, 3.3, -0.55, '#e9e2d0');
    ex.box(2, 6.65, 0.4, sx * 4, 3.3, -0.6, '#1aa39a');
    ex.box(27.7, 0.6, 0.4, sx * 16.85, 0.3, -0.62, '#7b808a');
    ex.box(0.25, 3.1, 0.5, sx * 3.1, 1.55, -0.6, '#2e3440');
  }
  ex.box(6, 3.6, 0.4, 0, 4.8, -0.6, '#1aa39a');
  ex.box(6.4, 0.25, 0.5, 0, 3.1, -0.6, '#2e3440');
  for (let x = -26; x <= 26; x += 6.5) if (Math.abs(x) > 6) ex.box(4.6, 2.2, 0.1, x, 2.0, -0.72, '#8fc6e8');
  flat.addObj(ex);
  // car park deco
  rng = mulberry32(5);
  const park = new Obj();
  for (let i = -5; i <= 5; i++) park.box(0.12, 0.01, 4.5, i * 3.2, 0.0, -14, '#f4f4f4');
  const carCols = ['#d6262b', '#2a62c9', '#f2c200', '#e9e9e9', '#3a3f4a', '#2e8b3a'];
  for (const i of [-4, -2, -1, 2, 3]) {
    const cx = i * 3.2 + 1.6, cz = -14, c = pick(carCols);
    park.box(1.8, 0.7, 4, cx, 0.6, cz, c); park.box(1.6, 0.6, 2.2, cx, 1.2, cz - 0.2, c);
    park.box(1.62, 0.45, 2.0, cx, 1.22, cz - 0.2, '#9fd4ef');
    for (const sx of [-0.9, 0.9]) for (const sz of [-1.3, 1.3]) park.cyl(0.33, 0.25, cx + sx, 0.33, cz + sz, '#222', { rz: PI / 2, seg: 8 });
  }
  for (const x of [-14, 14]) { park.cyl(0.08, 5, x, 2.5, -8, '#555', { seg: 6 }); park.box(1.2, 0.15, 0.4, x, 5, -8, '#333'); }
  for (const x of [-24, -18, 19, 25]) { park.cyl(0.18, 1.6, x, 0.8, -5, '#7a5230', { seg: 6 }); park.ico(1.4, x, 2.6, -5, '#3f9b3a', { d: 0 }); }
  flat.addObj(park);

  // facade logo
  const logoTex = canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#1aa39a'; g.fillRect(0, 0, w, h);
    g.font = `900 120px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#7a2e0b'; g.fillText('DRIFT-MARKT', w / 2 + 6, h / 2 + 8);
    g.fillStyle = '#ffe066'; g.fillText('DRIFT-MARKT', w / 2, h / 2);
  });
  const logo = new T.Mesh(new T.PlaneGeometry(9, 2.25), new T.MeshBasicMaterial({ map: logoTex }));
  logo.position.set(0, 4.6, -0.82); logo.rotation.y = PI; scene.add(logo);

  // sliding doors
  const glassMat = new T.MeshLambertMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.35, depthWrite: false });
  const doorL = new T.Mesh(new T.BoxGeometry(3, 3, 0.06), glassMat), doorR = doorL.clone();
  doorL.position.set(-1.5, 1.5, -0.25); doorR.position.set(1.5, 1.5, -0.25);
  scene.add(doorL, doorR);
  STORE_ANIM.doors = { L: doorL, R: doorR, open: 0 };

  // ---------- shelves ----------
  const shelfC = '#d9dde2', backC = '#c3c8cf', baseC = '#4b5160', boardC = '#eef0f2';
  const so = new Obj();
  const priceStrip = (x, y, z0, z1, sideX) => so.box(0.012, 0.05, z1 - z0, x + sideX * 0.006, y - 0.02, (z0 + z1) / 2, '#fdf6c9');
  const secLabel = (sec, num) => sec.hdr || (sec.hdr = atlasLabel(6.2, (g, x, y, w, h) => {
    g.fillStyle = sec.col; g.fillRect(x, y, w, h);
    g.fillStyle = '#ffffff'; g.fillRect(x + w * 0.015, y + h * 0.12, h * 1.5, h * 0.76);
    g.fillStyle = sec.col; g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, String(num), x + w * 0.015 + h * 0.75, y + h * 0.54, h * 1.3, h * 0.62);
    g.font = `${h * 0.62}px ${EMOJI_FONT}`; g.fillText(sec.e, x + w * 0.015 + h * 2.35, y + h * 0.55);
    g.fillStyle = '#ffffff'; g.textAlign = 'left'; fitText(g, sec.n.toUpperCase(), x + w * 0.015 + h * 3.0, y + h * 0.56, w - h * 3.3, h * 0.55);
  }, true, sec.col));
  const promoLabel = (p) => atlasLabel(2.4, (g, x, y, w, h) => {
    g.fillStyle = '#ffd84a'; g.fillRect(x, y, w, h);
    g.fillStyle = '#e8322b'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.62, y); g.lineTo(x + w * 0.5, y + h); g.lineTo(x, y + h); g.fill();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    fitText(g, 'ANGEBOT', x + w * 0.27, y + h * 0.32, w * 0.46, h * 0.28);
    fitText(g, '-' + (10 + (p.idx * 7) % 40) + '%', x + w * 0.26, y + h * 0.7, w * 0.44, h * 0.4);
    g.font = `${h * 0.7}px ${EMOJI_FONT}`; g.fillText(p.e, x + w * 0.78, y + h * 0.54);
  }, false, '#ffd84a');
  const pickPromo = () => { let p; do p = PRODUCTS[RI(0, PRODUCTS.length - 1)]; while (p.shape === 'crateOf'); return p; };
  function upright(x, z, h) { so.box(0.05, h, 0.05, x, h / 2, z, '#aab1ba'); for (let y = 0.2; y < h - 0.1; y += 0.12) so.box(0.052, 0.04, 0.012, x, y, z, '#5a606c'); }
  function gondola(gi, hf) {
    const gx = GONDOLA_X[gi], [za, zb] = HALVES[hf], L = zb - za, cz = (za + zb) / 2;
    so.box(1.5, 0.12, L - 0.2, gx, 0.06, cz, baseC);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) so.box(0.004, 0.012, L - 1.3, gx + s * 0.751, 0.035 + k * 0.025, cz, '#2e323c'); // kick grille
    so.box(0.08, 2.0, L - 1.2, gx, 1.0, cz, backC);
    for (let y = 0.35; y < 1.95; y += 0.45) so.box(0.086, 0.008, L - 1.2, gx, y, cz, '#b3b9c1'); // back panel seams
    for (const lv of SHELF_LEVELS) for (const s of [-1, 1]) {
      so.box(0.62, 0.03, L - 1.2, gx + s * 0.42, lv - 0.015, cz, boardC);
      priceStrip(gx + s * 0.73, lv, za + 0.6, zb - 0.6, s);
    }
    // printed category headers
    for (const s of [-1, 1]) {
      const sec = SECTIONS[s < 0 ? gi : gi + 1][hf], num = hf * 7 + (s < 0 ? gi : gi + 1) + 1;
      so.box(0.8, 0.3, L - 1.2, gx + s * 0.4, 2.15, cz, sec.col);
      so.box(0.81, 0.03, L - 1.18, gx + s * 0.4, 2.31, cz, shade(sec.col, -0.15));
      for (const f of [0.25, 0.75]) so.label(1.7, 0.26, gx + s * 0.801, 2.15, za + 0.6 + (L - 1.2) * f, secLabel(sec, num), { ry: s * PI / 2 });
    }
    for (const z of [za + 0.6, zb - 0.6]) { so.box(1.6, 2.2, 0.06, gx, 1.1, z, shelfC); for (const s of [-1, 1]) upright(gx + s * 0.77, z, 2.3); }
    // end caps with promo pyramids + posters
    for (const [z, dir] of [[za + 0.3, -1], [zb - 0.3, 1]]) {
      const p = pickPromo();
      so.box(1.5, 0.5, 0.55, gx, 0.25, z, '#e8322b');
      so.box(1.52, 0.04, 0.57, gx, 0.04, z, '#9a1a1a');
      so.box(1.3, 0.02, 0.5, gx, 0.51, z, '#f4f4f4');
      so.box(1.24, 0.54, 0.04, gx, 1.6, z - dir * 0.22, '#ffffff');
      so.label(1.2, 0.5, gx, 1.6, z - dir * 0.22 + dir * 0.021, promoLabel(p), { ry: dir > 0 ? 0 : PI });
      for (const sx of [-0.55, 0.55]) so.box(0.03, 1.1, 0.03, gx + sx, 1.1, z - dir * 0.24, '#aab1ba');
      endcaps.push({ x: gx, z, dir, p });
    }
    addCol(gx - 0.8, za, gx + 0.8, zb);
  }
  const endcaps = [];
  function wallShelf(xFront, s, hf) { // s = direction into the aisle (+1 left wall, -1 right wall)
    const [za, zb] = HALVES[hf], a = s > 0 ? 0 : 6, sec = SECTIONS[a][hf];
    const L = zb - za, cz = (za + zb) / 2, xb = xFront - s * 0.3;
    so.box(0.6, 0.12, L, xb, 0.06, cz, baseC);
    so.box(0.06, 2.3, L, xFront - s * 0.58, 1.15, cz, backC);
    for (const lv of SHELF_LEVELS) { so.box(0.56, 0.03, L, xb, lv - 0.015, cz, boardC); priceStrip(xFront - s * 0.01, lv, za, zb, s); }
    so.box(0.62, 0.32, L, xb, 2.35, cz, sec.col);
    for (const f of [0.2, 0.5, 0.8]) so.label(1.9, 0.29, xFront + s * 0.011, 2.35, za + L * f, secLabel(sec, hf * 7 + a + 1), { ry: s * PI / 2 });
    for (let z = za; z <= zb + 0.01; z += L / 4) upright(xFront - s * 0.03, z, 2.5);
    addCol(Math.min(xFront, xFront - s * 0.6), za, Math.max(xFront, xFront - s * 0.6), zb);
  }
  // faces (tagOff = where the price tags sit relative to the face line)
  const face = (x, za, zb, nx, types, wallFace) => faces.push({ ax: x, az: za, bx: x, bz: zb, nx, nz: 0, types, tagOff: wallFace ? -0.008 : 0.055, levels: SHELF_LEVELS.map((y) => ({ y, inset: 0.22 })) });
  for (let gi = 0; gi < GONDOLA_X.length; gi++) for (let h = 0; h < 2; h++) gondola(gi, h);
  for (let h = 0; h < 2; h++) {
    const [za, zb] = HALVES[h];
    wallShelf(-29.4, 1, h);
    wallShelf(29.4, -1, h);
    for (let a = 0; a < 7; a++) {
      const sec = SECTIONS[a][h], A = AISLES[a];
      const fz0 = a === 0 || a === 6 ? za + 0.4 : za + 0.6, fz1 = a === 0 || a === 6 ? zb - 0.4 : zb - 0.6;
      face(A.x0, fz0, fz1, 1, sec.t.slice(0, 2), a === 0);
      face(A.x1, fz1, fz0, -1, sec.t.slice(2, 4), a === 6);
      for (const id of sec.t) PROD[id].section = sec.n;
    }
  }
  // gaps between wall shelves & back/front: fill wall shelves only along the halves; cross aisle stays open

  // ---------- back-wall coolers ----------
  const coolers = [
    { x0: -28.5, x1: -10, n: 'Milch & Käse', e: '🥛', col: '#2a7de1', t: ['milch', 'kaese', 'joghurt', 'butter', 'eier'] },
    { x0: -9, x1: 9, n: 'Wurst & Fleisch', e: '🥩', col: '#c8261b', t: ['salami', 'wuerstchen', 'haehnchen', 'schinken'] },
    { x0: 10, x1: 28.5, n: 'Tiefkühl', e: '❄️', col: '#5ac8f0', t: ['pizza', 'eis', 'pommes', 'fischst'] },
  ];
  const glassAcc = new MeshAcc();
  for (const c of coolers) {
    const L = c.x1 - c.x0, cx = (c.x0 + c.x1) / 2, zc = (COOLER_Z + 50) / 2, dz = 50 - COOLER_Z;
    so.box(L, 0.2, dz, cx, 0.1, zc, '#3c4250');
    so.box(L, 2.3, 0.05, cx, 1.15, 49.95, '#e6f2fb');
    so.box(L, 0.25, dz, cx, 2.42, zc, c.col);
    for (const lv of [0.25, 0.7, 1.15, 1.6]) {
      so.box(L, 0.03, dz - 0.2, cx, lv - 0.015, zc + 0.1, '#f4f7fa');
      so.box(L, 0.04, 0.012, cx, lv - 0.02, COOLER_Z + 0.2, '#fdf6c9');
      so.box(L, 0.012, 0.03, cx, lv + 0.42, COOLER_Z + 0.25, '#fffef0'); // LED strip
    }
    for (let k = 0; k < 4; k++) so.box(L - 0.1, 0.012, 0.01, cx, 0.05 + k * 0.035, COOLER_Z - 0.005, '#20242c'); // vent grille
    so.box(L, 0.08, 0.1, cx, 2.25, COOLER_Z - 0.03, '#9aa3ad');
    const nd = Math.round(L / 1.0);
    const go = new Obj();
    for (let i = 0; i <= nd; i++) so.box(0.06, 2.2, 0.08, c.x0 + (i * L) / nd, 1.2, COOLER_Z - 0.02, '#9aa3ad');
    for (let i = 0; i < nd; i++) { go.box(L / nd - 0.06, 2.0, 0.02, c.x0 + ((i + 0.5) * L) / nd, 1.2, COOLER_Z - 0.03, '#ffffff'); so.box(0.03, 0.5, 0.05, c.x0 + ((i + 0.85) * L) / nd, 1.2, COOLER_Z - 0.09, '#cfd6dc'); }
    glassAcc.addObj(go);
    addCol(c.x0, COOLER_Z, c.x1, 50.4);
    faces.push({ ax: c.x1 - 0.2, az: COOLER_Z, bx: c.x0 + 0.2, bz: COOLER_Z, nx: 0, nz: -1, types: c.t, tagOff: -0.188, levels: [0.25, 0.7, 1.15, 1.6].map((y) => ({ y, inset: 0.4 })) });
    for (const id of c.t) PROD[id].section = c.n;
  }
  const glass = glassAcc.build(new T.MeshLambertMaterial({ color: '#cfeeff', transparent: true, opacity: 0.22, depthWrite: false }));
  glass.renderOrder = 2;
  scene.add(glass);
  // gaps between the coolers
  so.box(1, 2.4, 1.2, -9.5, 1.2, 49.4, '#c3c8cf'); so.box(1, 2.4, 1.2, 9.5, 1.2, 49.4, '#c3c8cf');
  addCol(-10, COOLER_Z, -9, 50); addCol(9, COOLER_Z, 10, 50);

  // ---------- produce tables ----------
  const produce = [[10, 'aepfel', 'tomaten'], [17, 'bananen', 'karotten'], [24, 'melone', 'brokkoli']];
  for (const [tx, a, b] of produce) {
    const za = 4.5, zb = 9.5, cz = 7, wood = '#a8703e', dark = '#7a4a26';
    for (const sx of [-0.7, 0.7]) for (const sz of [za + 0.15, cz, zb - 0.15]) so.box(0.08, 0.66, 0.08, tx + sx, 0.33, sz, dark); // legs
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) so.box(0.03, 0.12, 5, tx + sx * 0.74, 0.18 + k * 0.17, cz, k % 2 ? wood : shade(wood, -0.06)); // side planks
    so.box(1.4, 0.04, 4.9, tx, 0.12, cz, dark);
    for (let k = 0; k < 6; k++) so.box(1.7 / 6 - 0.01, 0.06, 5.2, tx - 0.85 + (k + 0.5) * (1.7 / 6), 0.69, cz, k % 2 ? wood : shade(wood, 0.05)); // top planks
    so.box(0.4, 0.14, 5, tx, 0.79, cz, dark);
    so.box(0.06, 1.6, 0.06, tx, 1.3, za + 0.1, '#6b4226'); so.box(0.06, 1.6, 0.06, tx, 1.3, zb - 0.1, '#6b4226');
    // little awning on top
    for (let k = 0; k < 8; k++) so.box(0.9, 0.04, 5.3 / 8, tx, 2.1, za - 0.15 + (k + 0.5) * (5.3 / 8), k % 2 ? '#ffffff' : '#3f9b3a', { rz: 0 });
    for (const sx of [-1, 1]) so.box(0.45, 0.03, 5.3, tx + sx * 0.4, 2.02, cz, '#3f9b3a', { rz: sx * -0.35 });
    // chalkboard price signs on sticks
    for (const [id, nx] of [[a, -1], [b, 1]]) {
      const p = PROD[id], x = tx + nx * 0.62;
      so.box(0.02, 0.5, 0.02, x, 1.0, cz, '#6b4226');
      so.box(0.36, 0.27, 0.025, x, 1.3, cz, '#8a5a32', { ry: PI / 2 });
      so.label(0.32, 0.23, x + nx * 0.014, 1.3, cz, atlasLabel(1.4, (g, x0, y0, w, h) => {
        g.fillStyle = '#2b2b2b'; g.fillRect(x0, y0, w, h); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `${h * 0.4}px ${EMOJI_FONT}`; g.fillText(p.e, x0 + w * 0.22, y0 + h * 0.36);
        fitText(g, p.n, x0 + w * 0.62, y0 + h * 0.34, w * 0.55, h * 0.24, 700, '"Chalkboard SE", "Comic Sans MS", cursive');
        g.fillStyle = '#ffd84a'; fitText(g, p.price.toFixed(2).replace('.', ',') + ' €', x0 + w / 2, y0 + h * 0.74, w * 0.8, h * 0.34, 900, '"Chalkboard SE", "Comic Sans MS", cursive');
      }, false, '#2b2b2b'), { ry: nx * PI / 2 });
    }
    faces.push({ ax: tx - 0.85, az: zb, bx: tx - 0.85, bz: za, nx: -1, nz: 0, types: [a], tagOff: 0.0, levels: [{ y: 0.72, inset: 0.2 }] });
    faces.push({ ax: tx + 0.85, az: za, bx: tx + 0.85, bz: zb, nx: 1, nz: 0, types: [b], tagOff: 0.0, levels: [{ y: 0.72, inset: 0.2 }] });
    addCol(tx - 0.85, za, tx + 0.85, zb);
    PROD[a].section = PROD[b].section = 'Obst & Gemüse';
  }

  // ---------- checkouts ----------
  const counterXs = [-27, -21, -15, -9];
  const candy = ['schoko', 'gummi', 'lolli', 'kekse', 'salzst'];
  for (let i = 0; i < counterXs.length; i++) {
    const cx = counterXs[i];
    so.box(1.2, 0.85, 6, cx, 0.425, 7, '#dfe3e8');
    so.box(1.21, 0.12, 6.01, cx, 0.12, 7, '#3a3f4a');                       // kick plate
    so.box(1.21, 0.08, 6.01, cx, 0.6, 7, '#1aa39a');                        // brand stripe
    so.box(1.22, 0.06, 6.02, cx, 0.86, 7, '#3a3f4a');
    // conveyor belt with rollers and side rails
    so.box(0.55, 0.03, 4, cx + 0.28, 0.9, 8, '#1a1c22');
    for (let k = 0; k < 18; k++) so.box(0.55, 0.004, 0.012, cx + 0.28, 0.917, 6.1 + k * 0.22, '#2c2f37');
    for (const z of [6.0, 10.0]) so.cyl(0.03, 0.56, cx + 0.28, 0.9, z, '#9aa3ad', { rz: PI / 2, seg: 8 });
    so.box(0.04, 0.08, 4, cx + 0.03, 0.92, 8, '#9aa3ad');
    so.box(0.02, 0.05, 4, cx + 0.57, 0.92, 8, '#9aa3ad');
    so.box(0.5, 0.03, 0.04, cx + 0.28, 0.935, 8.8, '#e8322b', { ry: 0 });  // divider stick on the belt
    so.box(0.52, 0.016, 0.044, cx + 0.28, 0.952, 8.8, '#ffffff');
    // scanner with glass + light
    so.box(0.5, 0.04, 0.5, cx + 0.3, 0.9, 5.6, '#2a2d35');
    so.box(0.36, 0.006, 0.36, cx + 0.3, 0.922, 5.6, '#9fd4ef');
    so.box(0.36, 0.012, 0.04, cx + 0.3, 0.925, 5.6, '#ff3a3a');
    so.box(0.5, 0.25, 0.06, cx + 0.3, 1.04, 5.33, '#2a2d35');               // vertical scanner window
    so.box(0.36, 0.14, 0.008, cx + 0.3, 1.05, 5.365, '#3a6a8a');
    // register + keypad + card terminal + monitor arm
    so.box(0.45, 0.22, 0.35, cx - 0.25, 1.0, 5.2, '#2a2d35');
    so.box(0.42, 0.012, 0.3, cx - 0.25, 1.116, 5.2, '#4a4f5a');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) so.box(0.06, 0.012, 0.05, cx - 0.36 + c * 0.075, 1.124, 5.1 + r * 0.06, c === 3 && r === 3 ? '#2bd45a' : '#d9dde2');
    so.cyl(0.02, 0.4, cx + 0.02, 1.25, 4.85, '#555', { seg: 8 });
    so.box(0.46, 0.25, 0.03, cx + 0.02 - 0.012, 1.5, 4.85 - 0.012, '#1a1c22', { ry: PI * 0.75 });
    so.cyl(0.015, 0.18, cx + 0.62, 1.0, 5.2, '#555', { seg: 6 });
    so.box(0.09, 0.15, 0.04, cx + 0.62, 1.15, 5.2, '#1a1c22', { rx: -0.4 });
    so.box(0.07, 0.05, 0.005, cx + 0.62, 1.18, 5.222, '#5dff9a', { rx: -0.4 });
    // bagging area + bag hooks with bags
    so.box(0.55, 0.06, 0.9, cx + 0.28, 0.92, 4.45, '#9aa3ad');
    for (let k = 0; k < 3; k++) { so.box(0.28, 0.3, 0.02, cx + 0.62, 0.68, 4.3 + k * 0.03, '#f4f4f4'); }
    so.label(0.2, 0.16, cx + 0.62, 0.7, 4.367, atlasLabel(1.25, (g, x, y, w, h) => { g.fillStyle = '#f4f4f4'; g.fillRect(x, y, w, h); g.fillStyle = '#1aa39a'; g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, 'DRIFT', x + w / 2, y + h * 0.35, w * 0.9, h * 0.35); fitText(g, 'MARKT', x + w / 2, y + h * 0.7, w * 0.9, h * 0.35); }, false, '#f4f4f4'));
    // cashier chair
    so.cyl(0.18, 0.05, cx - 0.35, 0.55, 5.9, '#1d2230', { seg: 10 });
    so.cyl(0.03, 0.5, cx - 0.35, 0.28, 5.9, '#9aa3ad', { seg: 6 });
    so.box(0.05, 0.4, 0.3, cx - 0.53, 0.8, 5.9, '#1d2230');
    // candy rack at the lane entry (Quengelware)
    const rx = cx + 0.75, rz = 9.3;
    so.box(0.04, 1.3, 0.9, rx - 0.16, 0.65, rz, '#e8322b');
    for (const d of [-1, 1]) so.box(0.32, 1.3, 0.03, rx, 0.65, rz + d * 0.45, '#e8322b');
    so.box(0.34, 0.1, 0.94, rx, 0.05, rz, '#9a1a1a');
    so.box(0.36, 0.16, 0.96, rx, 1.36, rz, '#ffd84a');
    for (let k = 0; k < 3; k++) {
      so.box(0.3, 0.02, 0.86, rx, 0.32 + k * 0.33, rz, '#f4f4f4');
      so.box(0.012, 0.04, 0.86, rx + 0.15, 0.32 + k * 0.33, rz, '#fdf6c9');
      const p = PROD[candy[(i + k) % candy.length]];
      const n = Math.max(1, Math.floor(0.8 / (p.w * 0.8)));
      for (let j = 0; j < n; j++) inst[p.idx].push(matAt(rx + 0.02, 0.335 + k * 0.33, rz - 0.4 + (j + 0.5) * (0.8 / n), PI / 2, 0.8));
    }
    addCol(cx - 0.6, 4, cx + 0.6, 10);
    addCol(rx - 0.18, rz - 0.47, rx + 0.17, rz + 0.47);
    if (i < 3) {
      const lx = cx + 3, lane = { x: lx, cx, z0: 4.5, z1: 10.5, idx: i };
      // lane lamp with number
      so.cyl(0.04, 2.2, cx + 0.45, 1.1, 10.2, '#9aa3ad', { seg: 6 });
      const lampTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.font = `900 90px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), w / 2, h / 2 + 4); });
      const lampMat = new T.MeshBasicMaterial({ map: lampTex, color: '#ff6a6a' });
      const lamp = new T.Mesh(new T.BoxGeometry(0.4, 0.4, 0.4), lampMat);
      lamp.position.set(cx + 0.45, 2.4, 10.2); scene.add(lamp);
      lane.lamp = lampMat;
      // register screen
      const scr = canvasTex(256, 128, (g) => { g.fillStyle = '#0d2a1a'; g.fillRect(0, 0, 256, 128); });
      const scrMesh = new T.Mesh(new T.PlaneGeometry(0.42, 0.21), new T.MeshBasicMaterial({ map: scr }));
      scrMesh.position.set(cx + 0.02, 1.5, 4.85); scrMesh.rotation.y = PI * 0.75; scene.add(scrMesh);
      lane.screen = scr;
      LANES.push(lane);
    }
  }
  so.box(2.4, 1.1, 6, -28.8, 0.55, 7, '#6b4226'); addCol(-30, 4, -27.6, 10); // info booth next to the wall
  so.box(2.4, 0.1, 6, -28.8, 1.15, 7, '#a8703e');

  // ---------- entrance deco: parked carts, plants, flower stand ----------
  const dc = new Obj();
  for (let i = 0; i < 5; i++) buildPlainCart(dc, -7.2, 1.4 + i * 0.26, '#c3c8cf');
  for (const x of [-7.65, -6.75]) {
    for (const y of [0.45, 0.9]) dc.cyl(0.025, 1.95, x, y, 2.0, y > 0.5 ? '#1aa39a' : '#9aa3ad', { rx: PI / 2, seg: 8 });
    for (const z of [1.05, 2.95]) dc.cyl(0.03, 0.92, x, 0.46, z, '#9aa3ad', { seg: 8 });
  }
  addCol(-7.7, 1.0, -6.7, 3.0);
  const plant = (x, z) => {
    dc.cyl(0.36, 0.52, x, 0.26, z, '#c8693a', { seg: 10, rt: 1.18 });
    dc.cyl(0.43, 0.06, x, 0.53, z, '#a8542a', { seg: 10 });
    dc.cyl(0.38, 0.02, x, 0.55, z, '#4a3220', { seg: 10 });
    for (let k = 0; k < 11; k++) {
      const a = (k / 11) * TAU, tilt = 0.35 + (k % 3) * 0.22, len = 0.7 + (k % 4) * 0.12;
      dc.add(geoCone(4), x + Math.sin(a) * len * 0.3, 0.55 + len * 0.45, z + Math.cos(a) * len * 0.3, 0.09, len, 0.03, k % 2 ? '#3f9b3a' : '#2f8a2f', tilt * Math.cos(a), a, tilt * -Math.sin(a) * 0);
    }
    dc.ico(0.16, x, 0.68, z, '#4fb348');
  };
  for (const [x, z] of [[-4.2, 1.0], [4.2, 1.0], [7.5, 11.8], [-6.5, 11.8]]) { plant(x, z); addCol(x - 0.4, z - 0.4, x + 0.4, z + 0.4); }
  // trash bin + info board near the entrance
  dc.cyl(0.25, 0.8, 5.6, 0.4, 0.8, '#3a3f4a', { seg: 10 }); dc.cyl(0.27, 0.08, 5.6, 0.84, 0.8, '#1aa39a', { seg: 10 }); dc.cyl(0.12, 0.02, 5.6, 0.885, 0.8, '#111', { seg: 8 });
  addCol(5.3, 0.5, 5.9, 1.1);
  flat.addObj(dc);

  // ---------- products ----------
  PRICE_UV = atlasSheet(2, 8, PRODUCTS.length, (g, x, y, w, h, i) => {
    const p = PRODUCTS[i]; g.fillStyle = '#ffe94a'; g.fillRect(x, y, w, h);
    g.fillStyle = '#d6262b'; g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, p.price.toFixed(2).replace('.', ',') + ' €', x + w / 2, y + h * 0.56, w * 0.9, h * 0.8);
  }, '#ffe94a');
  for (const f of faces) placeFace(f, inst, so);
  for (const ec of endcaps) { // promo pyramids on the end caps
    const p = ec.p;
    const n = Math.max(1, Math.floor(1.2 / p.w));
    for (let i = 0; i < n; i++) inst[p.idx].push(matAt(ec.x - 0.6 + (i + 0.5) * (1.2 / n), 0.52, ec.z, ec.dir > 0 ? 0 : PI));
    for (let i = 0; i < n - 1; i++) inst[p.idx].push(matAt(ec.x - 0.6 + (i + 1) * (1.2 / n), 0.52 + p.h + 0.01, ec.z, ec.dir > 0 ? 0 : PI));
  }

  // products are drawn in 3.5 m chunks so that every chunk can pick its own level of detail
  for (const p of PRODUCTS) {
    const chunks = new Map();
    for (const m of inst[p.idx]) {
      const x = m.elements[12], z = m.elements[14], k = Math.floor(x / 3.5) + ',' + Math.floor(z / 3.5);
      let c = chunks.get(k); if (!c) chunks.set(k, c = { list: [], x: 0, z: 0 });
      c.list.push(m); c.x += x; c.z += z;
    }
    for (const c of chunks.values()) {
      const mk = (geo) => {
        const im = new T.InstancedMesh(geo, VCMAT, c.list.length);
        c.list.forEach((m, i) => im.setMatrixAt(i, m));
        im.instanceMatrix.needsUpdate = true;
        im.receiveShadow = true;
        im.computeBoundingSphere && im.computeBoundingSphere();
        im.visible = false;
        scene.add(im); return im;
      };
      PRODUCT_LOD.push({ hi: mk(p.geo), mid: mk(p.geoMid), lo: mk(p.geoLo), x: c.x / c.list.length, z: c.z / c.list.length });
    }
  }

  acc.addObj(so);
  const shelves = acc.build(VCMAT); shelves.castShadow = true; shelves.receiveShadow = true; scene.add(shelves);
  const walls = flat.build(VCMAT); walls.receiveShadow = true; scene.add(walls);

  buildSigns(scene, coolers);
}

let PRICE_UV = [];
function placeFace(f, inst, so) {
  const dx = f.bx - f.ax, dz = f.bz - f.az, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  const yaw = Math.atan2(f.nx, f.nz);
  const bl = L / f.types.length;
  f.types.forEach((id, ti) => {
    const p = PROD[id], s0 = ti * bl;
    const n = Math.max(1, Math.floor((bl - 0.08) / p.w)), sp = (bl - 0.08) / n;
    for (const lv of f.levels) {
      for (let i = 0; i < n; i++) {
        if (rng() < 0.04) continue; // a few gaps = more alive
        const s = s0 + 0.04 + (i + 0.5) * sp;
        const x = f.ax + ux * s - f.nx * lv.inset, z = f.az + uz * s - f.nz * lv.inset;
        inst[p.idx].push(matAt(x, lv.y, z, yaw + R(-0.08, 0.08)));
      }
    }
    // price tags along the shelf edge
    if (so && f.tagOff != null) for (const lv of f.levels) for (let t = s0 + 0.35; t < s0 + bl - 0.2; t += 1.6) {
      const x = f.ax + ux * t - f.nx * f.tagOff, z = f.az + uz * t - f.nz * f.tagOff;
      so.label(0.08, 0.032, x + f.nx * 0.001, lv.y - 0.022, z + f.nz * 0.001, PRICE_UV[p.idx], { ry: yaw });
    }
    // pickup spot: segment along the shelf front
    SPOTS[id] = {
      ax: f.ax + ux * (s0 + 0.2), az: f.az + uz * (s0 + 0.2), bx: f.ax + ux * (s0 + bl - 0.2), bz: f.az + uz * (s0 + bl - 0.2),
      nx: f.nx, nz: f.nz, mx: f.ax + ux * (s0 + bl / 2), mz: f.az + uz * (s0 + bl / 2), y: f.levels[Math.min(2, f.levels.length - 1)].y,
    };
  });
}
// distance from a point to a product's shelf block
function spotDist(sp, x, z) {
  const dx = sp.bx - sp.ax, dz = sp.bz - sp.az, l2 = dx * dx + dz * dz;
  const t = clamp(((x - sp.ax) * dx + (z - sp.az) * dz) / l2, 0, 1);
  const px = sp.ax + dx * t, pz = sp.az + dz * t;
  return { d: Math.hypot(x - px, z - pz), px, pz };
}

function signTex(title, emoji, sub, col) {
  return canvasTex(512, 200, (g, w, h) => {
    g.fillStyle = '#ffffff'; roundRect(g, 4, 4, w - 8, h - 8, 26); g.fill();
    g.fillStyle = col; roundRect(g, 4, 4, w - 8, 58, 26); g.fill(); g.fillRect(4, 36, w - 8, 26);
    g.fillStyle = '#fff'; g.font = `800 34px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(sub, w / 2, 34);
    g.fillStyle = '#1d2230'; g.font = `900 56px ${FONT}`;
    let fs = 56; while (g.measureText(emoji + ' ' + title).width > w - 40 && fs > 30) { fs -= 2; g.font = `900 ${fs}px ${FONT}`; }
    g.fillText(emoji + ' ' + title, w / 2, 130);
  });
}
function hangSign(scene, tex, x, y, z, ry, wdt = 2.6, both = true) {
  const m = new T.MeshBasicMaterial({ map: tex });
  const g = new T.PlaneGeometry(wdt, wdt * 200 / 512);
  const a = new T.Mesh(g, m); a.position.set(x, y, z); a.rotation.y = ry; scene.add(a);
  if (both) { const b = new T.Mesh(g, m); b.position.set(x, y, z); b.rotation.y = ry + PI; b.position.x += Math.sin(ry) * -0.01; b.position.z += Math.cos(ry) * -0.01; scene.add(b); }
  const wire = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, STORE.H - y), new T.MeshBasicMaterial({ color: '#555' }));
  wire.position.set(x, (STORE.H + y) / 2, z); scene.add(wire);
}
function buildSigns(scene, coolers) {
  let n = 1;
  for (let h = 0; h < 2; h++) for (let a = 0; a < 7; a++) {
    const s = SECTIONS[a][h], [za, zb] = HALVES[h];
    s.num = n;
    hangSign(scene, signTex(s.n, s.e, 'GANG ' + n++, s.col), AISLES[a].cx, 3.2, za + 0.4, 0);
    hangSign(scene, signTex(s.n, s.e, 'GANG ' + (n - 1), s.col), AISLES[a].cx, 3.2, zb - 0.4, PI);
  }
  for (const c of coolers) {
    const m = new T.Mesh(new T.PlaneGeometry(3.6, 3.6 * 200 / 512), new T.MeshBasicMaterial({ map: signTex(c.n, c.e, 'KÜHLREGAL', c.col) }));
    m.position.set((c.x0 + c.x1) / 2, 3.3, 49.9); m.rotation.y = PI; scene.add(m);
  }
  hangSign(scene, signTex('Kasse', '🛒', 'BEZAHLEN', '#e8322b'), -18, 3.4, 11.2, 0, 3.4);
  hangSign(scene, signTex('Obst & Gemüse', '🍎', 'FRISCH', '#3f9b3a'), 17, 3.4, 11.2, 0, 3.4);
  hangSign(scene, signTex('Willkommen!', '👋', 'DRIFT-MARKT', '#1aa39a'), 0, 3.6, 0.6, 0, 3.2, false);
  // wall posters
  const posters = [['ANGEBOT', '-50%', '#e8322b'], ['NEU', 'Drift-Cola', '#2a62c9'], ['BITTE', 'Nicht driften!', '#f2a20c'], ['SUPER', 'Frisch!', '#3f9b3a']];
  posters.forEach(([a, b, c], i) => {
    const tex = canvasTex(256, 320, (g, w, h) => {
      g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.fillRect(12, 12, w - 24, h - 24);
      g.fillStyle = c; g.font = `900 44px ${FONT}`; g.textAlign = 'center'; g.fillText(a, w / 2, 90);
      g.fillStyle = '#1d2230'; g.font = `900 ${b.length > 6 ? 34 : 64}px ${FONT}`; g.fillText(b, w / 2, 200);
    });
    const m = new T.Mesh(new T.PlaneGeometry(1.2, 1.5), new T.MeshBasicMaterial({ map: tex }));
    const side = i % 2 ? 1 : -1;
    m.position.set(0, 3.6, 10 + i * 9);
    m.position.x = side > 0 ? 29.95 : -29.95; m.rotation.y = side > 0 ? -PI / 2 : PI / 2;
    scene.add(m);
  });
}

// a normal (untuned) cart, used for parked carts and other shoppers
function buildPlainCart(o, x, z, col, ry = 0) {
  const t = new Obj(), V = (a, b, c) => new V3(a, b, c), w = 0.25, wt = 0.01;
  const z0 = -0.35, z1 = 0.45, y0 = 0.55, y1 = 0.92, hw = (zz, y) => w - (zz - z0) * 0.04 - (y1 - y) * 0.08;
  for (const y of [y0, 0.68, 0.8, y1]) {
    const th = y === y1 ? 0.024 : wt;
    for (const s of [-1, 1]) t.bar(V(s * hw(z0, y), y, z0), V(s * hw(z1, y), y, z1), th, col, true);
    t.bar(V(-hw(z0, y), y, z0), V(hw(z0, y), y, z0), th, col, true); t.bar(V(-hw(z1, y), y, z1), V(hw(z1, y), y, z1), th, col, true);
  }
  for (let zz = z0; zz <= z1 + 0.001; zz += 0.1) for (const s of [-1, 1]) t.bar(V(s * hw(zz, y0), y0, zz), V(s * hw(zz, y1), y1, zz), wt, col, true);
  for (let k = -2; k <= 2; k++) { t.bar(V(k * 0.09, y0, z1), V(k * 0.09, y1, z1), wt, col, true); t.bar(V(k * 0.09, y0, z0), V(k * 0.09, y1, z0), wt, col, true); t.bar(V(k * 0.09, y0, z0), V(k * 0.08, y0, z1), wt, col, true); }
  t.cyl(0.022, 0.56, 0, 1.0, -0.45, '#d6262b', { rz: PI / 2, seg: 8 });
  for (const s of [-1, 1]) {
    t.bar(V(s * 0.26, 1.0, -0.45), V(s * 0.22, 0.14, -0.38), 0.024, col, true);
    t.bar(V(s * 0.22, 0.14, -0.38), V(s * 0.19, 0.12, 0.42), 0.024, col, true);
    t.bar(V(s * 0.26, 1.0, -0.45), V(s * hw(z0, y1), y1, z0), 0.02, col, true);
  }
  t.box(0.36, 0.012, 0.75, 0, 0.17, 0.02, shade(col, -0.1));
  for (const s of [-1, 1]) for (const zz of [-0.33, 0.4]) { t.cyl(0.05, 0.035, s * 0.2, 0.05, zz, '#222', { rz: PI / 2, seg: 8 }); t.cyl(0.02, 0.037, s * 0.2, 0.05, zz, '#888', { rz: PI / 2, seg: 6 }); t.box(0.012, 0.08, 0.03, s * 0.2, 0.1, zz, col); }
  o.put(t, x, 0, z, ry);
}
