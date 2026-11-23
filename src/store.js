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
  ex.box(61.2, 0.5, 51.2, 0, STORE.H + 0.25, 25, '#9aa0a8');
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
  function gondola(gx, za, zb, colL, colR) {
    const L = zb - za, cz = (za + zb) / 2;
    so.box(1.5, 0.12, L - 0.2, gx, 0.06, cz, baseC);
    so.box(0.08, 2.0, L, gx, 1.0, cz, backC);
    for (const lv of SHELF_LEVELS) {
      for (const s of [-1, 1]) {
        so.box(0.62, 0.03, L - 1.2, gx + s * 0.42, lv - 0.015, cz, boardC);
        priceStrip(gx + s * 0.73, lv, za + 0.6, zb - 0.6, s);
      }
    }
    // top header in category colors + side uprights
    so.box(0.8, 0.22, L - 1.2, gx - 0.4, 2.1, cz, colL);
    so.box(0.8, 0.22, L - 1.2, gx + 0.4, 2.1, cz, colR);
    for (const z of [za + 0.6, zb - 0.6]) so.box(1.6, 2.2, 0.06, gx, 1.1, z, shelfC);
    // end caps with promo pyramids
    for (const [z, dir] of [[za + 0.3, -1], [zb - 0.3, 1]]) {
      so.box(1.5, 0.5, 0.55, gx, 0.25, z, '#e8322b');
      so.box(1.3, 0.02, 0.5, gx, 0.51, z, '#f4f4f4');
      so.box(1.2, 0.5, 0.04, gx, 1.6, z - dir * 0.22, '#ffd84a');
      endcaps.push({ x: gx, z: z, dir });
    }
    addCol(gx - 0.8, za, gx + 0.8, zb);
  }
  const endcaps = [];
  function wallShelf(xFront, s, za, zb, col) { // s = direction into the aisle (+1 left wall, -1 right wall)
    const L = zb - za, cz = (za + zb) / 2, xb = xFront - s * 0.3;
    so.box(0.6, 0.12, L, xb, 0.06, cz, baseC);
    so.box(0.06, 2.3, L, xFront - s * 0.58, 1.15, cz, backC);
    for (const lv of SHELF_LEVELS) { so.box(0.56, 0.03, L, xb, lv - 0.015, cz, boardC); priceStrip(xFront - s * 0.01, lv, za, zb, s); }
    so.box(0.62, 0.3, L, xb, 2.35, cz, col);
    addCol(Math.min(xFront, xFront - s * 0.6), za, Math.max(xFront, xFront - s * 0.6), zb);
  }
  // faces
  const face = (x, za, zb, nx, types) => faces.push({ ax: x, az: za, bx: x, bz: zb, nx, nz: 0, types, levels: SHELF_LEVELS.map((y) => ({ y, inset: 0.22 })) });
  for (let gi = 0; gi < GONDOLA_X.length; gi++) for (let h = 0; h < 2; h++) {
    const [za, zb] = HALVES[h];
    gondola(GONDOLA_X[gi], za, zb, SECTIONS[gi][h].col, SECTIONS[gi + 1][h].col);
  }
  for (let h = 0; h < 2; h++) {
    const [za, zb] = HALVES[h];
    wallShelf(-29.4, 1, za, zb, SECTIONS[0][h].col);
    wallShelf(29.4, -1, za, zb, SECTIONS[6][h].col);
    for (let a = 0; a < 7; a++) {
      const sec = SECTIONS[a][h], A = AISLES[a];
      const fz0 = a === 0 || a === 6 ? za + 0.4 : za + 0.6, fz1 = a === 0 || a === 6 ? zb - 0.4 : zb - 0.6;
      face(A.x0, fz0, fz1, 1, sec.t.slice(0, 2));
      face(A.x1, fz1, fz0, -1, sec.t.slice(2, 4));
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
    for (const lv of [0.25, 0.7, 1.15, 1.6]) so.box(L, 0.03, dz - 0.2, cx, lv - 0.015, zc + 0.1, '#f4f7fa');
    const nd = Math.round(L / 1.0);
    const go = new Obj();
    for (let i = 0; i <= nd; i++) so.box(0.06, 2.2, 0.08, c.x0 + (i * L) / nd, 1.2, COOLER_Z - 0.02, '#9aa3ad');
    for (let i = 0; i < nd; i++) { go.box(L / nd - 0.06, 2.0, 0.02, c.x0 + ((i + 0.5) * L) / nd, 1.2, COOLER_Z - 0.03, '#ffffff'); so.box(0.03, 0.5, 0.05, c.x0 + ((i + 0.85) * L) / nd, 1.2, COOLER_Z - 0.09, '#cfd6dc'); }
    glassAcc.addObj(go);
    addCol(c.x0, COOLER_Z, c.x1, 50.4);
    faces.push({ ax: c.x1 - 0.2, az: COOLER_Z, bx: c.x0 + 0.2, bz: COOLER_Z, nx: 0, nz: -1, types: c.t, levels: [0.25, 0.7, 1.15, 1.6].map((y) => ({ y, inset: 0.4 })) });
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
    const za = 4.5, zb = 9.5, cz = 7;
    so.box(1.5, 0.66, 5, tx, 0.33, cz, '#8a5a32');
    so.box(1.7, 0.06, 5.2, tx, 0.69, cz, '#a8703e');
    so.box(0.4, 0.14, 5, tx, 0.79, cz, '#8a5a32');
    so.box(0.06, 1.6, 0.06, tx, 1.3, za + 0.1, '#6b4226'); so.box(0.06, 1.6, 0.06, tx, 1.3, zb - 0.1, '#6b4226');
    so.box(0.2, 0.3, 5, tx, 2.1, cz, '#3f9b3a');
    faces.push({ ax: tx - 0.85, az: zb, bx: tx - 0.85, bz: za, nx: -1, nz: 0, types: [a], levels: [{ y: 0.72, inset: 0.2 }] });
    faces.push({ ax: tx + 0.85, az: za, bx: tx + 0.85, bz: zb, nx: 1, nz: 0, types: [b], levels: [{ y: 0.72, inset: 0.2 }] });
    addCol(tx - 0.85, za, tx + 0.85, zb);
    PROD[a].section = PROD[b].section = 'Obst & Gemüse';
  }

  // ---------- checkouts ----------
  const counterXs = [-27, -21, -15, -9];
  for (let i = 0; i < counterXs.length; i++) {
    const cx = counterXs[i];
    so.box(1.2, 0.85, 6, cx, 0.425, 7, '#dfe3e8');
    so.box(1.22, 0.06, 6.02, cx, 0.86, 7, '#3a3f4a');
    so.box(0.55, 0.04, 4, cx + 0.28, 0.9, 8, '#1a1c22'); // belt
    so.box(0.04, 0.08, 4, cx + 0.03, 0.92, 8, '#9aa3ad');
    so.box(0.5, 0.04, 0.5, cx + 0.3, 0.9, 5.6, '#2a2d35'); // scanner
    so.box(0.4, 0.02, 0.4, cx + 0.3, 0.925, 5.6, '#ff3a3a');
    so.box(0.45, 0.3, 0.35, cx - 0.25, 1.05, 5.2, '#2a2d35'); // register
    so.cyl(0.03, 0.5, cx - 0.1, 1.3, 5.6, '#555', { seg: 6 });
    addCol(cx - 0.6, 4, cx + 0.6, 10);
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
      scrMesh.position.set(cx - 0.1, 1.62, 5.6); scrMesh.rotation.y = PI * 0.75; scene.add(scrMesh);
      lane.screen = scr;
      LANES.push(lane);
    }
  }
  so.box(2.4, 1.1, 6, -28.8, 0.55, 7, '#6b4226'); addCol(-30, 4, -27.6, 10); // info booth next to the wall
  so.box(2.4, 0.1, 6, -28.8, 1.15, 7, '#a8703e');

  // ---------- entrance deco: parked carts, plants, flower stand ----------
  const dc = new Obj();
  for (let i = 0; i < 5; i++) buildPlainCart(dc, -7.2, 1.4 + i * 0.28, '#c3c8cf');
  addCol(-7.6, 1.0, -6.8, 3.0);
  for (const [x, z] of [[-4.2, 1.0], [4.2, 1.0], [7.5, 11.8], [-6.5, 11.8]]) {
    dc.cyl(0.35, 0.5, x, 0.25, z, '#b5653a', { seg: 7, rt: 1.2 }); dc.ico(0.55, x, 0.95, z, '#3f9b3a'); dc.ico(0.35, x + 0.2, 1.35, z - 0.1, '#4fb348');
    addCol(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
  }
  flat.addObj(dc);

  // ---------- products ----------
  for (const f of faces) placeFace(f, inst);
  for (const ec of endcaps) { // promo pyramids on the end caps
    const p = PRODUCTS[RI(0, PRODUCTS.length - 1)];
    if (p.shape === 'crateOf') continue;
    const n = Math.max(1, Math.floor(1.2 / p.w));
    for (let i = 0; i < n; i++) inst[p.idx].push(matAt(ec.x - 0.6 + (i + 0.5) * (1.2 / n), 0.52, ec.z, ec.dir > 0 ? 0 : PI));
    for (let i = 0; i < n - 1; i++) inst[p.idx].push(matAt(ec.x - 0.6 + (i + 1) * (1.2 / n), 0.52 + p.h + 0.01, ec.z, ec.dir > 0 ? 0 : PI));
  }

  for (const p of PRODUCTS) {
    const list = inst[p.idx];
    if (!list.length) continue;
    const mk = (geo) => {
      const im = new T.InstancedMesh(geo, VCMAT, list.length);
      list.forEach((m, i) => im.setMatrixAt(i, m));
      im.instanceMatrix.needsUpdate = true;
      im.receiveShadow = true;
      im.computeBoundingSphere && im.computeBoundingSphere();
      scene.add(im); return im;
    };
    const sp = SPOTS[p.id];
    PRODUCT_LOD.push({ hi: mk(p.geo), lo: mk(p.geoLo), x: sp ? sp.mx : 0, z: sp ? sp.mz : 0 });
  }

  acc.addObj(so);
  const shelves = acc.build(VCMAT); shelves.castShadow = true; shelves.receiveShadow = true; scene.add(shelves);
  const walls = flat.build(VCMAT); walls.receiveShadow = true; scene.add(walls);

  buildSigns(scene, coolers);
}

function placeFace(f, inst) {
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
  const m = matAt(x, 0, z, ry);
  const t = new Obj();
  const w = 0.5, wire = 0.018;
  t.box(w, 0.02, 0.8, 0, 0.55, 0.05, col);
  for (const s of [-1, 1]) { t.box(0.02, 0.35, 0.8, s * w / 2, 0.72, 0.05, col); t.box(0.03, 0.03, 0.82, s * w / 2, 0.9, 0.05, col); }
  t.box(w, 0.35, 0.02, 0, 0.72, 0.45, col); t.box(w, 0.35, 0.02, 0, 0.72, -0.35, col);
  t.box(w + 0.04, 0.04, 0.04, 0, 1.0, -0.45, '#d6262b');
  for (const s of [-1, 1]) { t.box(wire, 0.85, wire, s * 0.22, 0.5, -0.4, col, { rx: 0.1 }); t.box(wire, wire, 0.8, s * 0.2, 0.12, 0.05, col); }
  for (const s of [-1, 1]) for (const zz of [-0.32, 0.4]) t.cyl(0.05, 0.03, s * 0.2, 0.05, zz, '#222', { rz: PI / 2, seg: 6 });
  for (const pt of t.parts) { const mm = new T.Matrix4().multiplyMatrices(m, pt.m); o.parts.push({ geo: pt.geo, m: mm, color: pt.color }); }
}
