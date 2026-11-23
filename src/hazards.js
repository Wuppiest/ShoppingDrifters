// ============================================================
//  Shopping Drifters – people (shoppers, cashiers) + level hazards
// ============================================================
const SKINS = ['#f0c29a', '#e3a97c', '#c68a5a', '#8d5a3b', '#f6d3b5'];
const NAMES = ['Petra', 'Jonas', 'Ayşe', 'Kevin', 'Mia', 'Olaf', 'Lena', 'Mehmet'];
// head centered at (x,y,z), face looking +z
function addHead(o, x, y, z, P) {
  const { skin, hair } = P, style = P.style || 'short';
  o.sph(0.125, x, y, z, skin, { sy: 1.12, seg: 10 });
  for (const s of [-1, 1]) {
    o.sph(0.03, x + s * 0.122, y - 0.005, z - 0.005, skin, { sx: 0.5, seg: 6 });             // ears
    o.sph(0.022, x + s * 0.045, y + 0.02, z + 0.104, '#ffffff', { sz: 0.55, seg: 6 });        // eyes
    o.sph(0.012, x + s * 0.045, y + 0.02, z + 0.114, '#2a2018', { seg: 5 });
    o.box(0.042, 0.011, 0.012, x + s * 0.047, y + 0.058, z + 0.11, style === 'bald' ? shade(skin, -0.2) : hair, { rz: s * 0.15 }); // brows
    o.sph(0.018, x + s * 0.07, y - 0.035, z + 0.095, shade(skin, -0.03), { sz: 0.4, seg: 5 });  // cheeks
  }
  o.sph(0.022, x, y - 0.01, z + 0.122, shade(skin, -0.05), { sy: 1.25, seg: 6 });            // nose
  o.box(0.048, 0.012, 0.012, x, y - 0.058, z + 0.108, '#a8423a');                              // mouth
  if (style !== 'bald') {
    o.sph(0.134, x, y + 0.085, z - 0.015, hair, { sy: 0.72, seg: 10 });
    o.box(0.17, 0.045, 0.05, x - 0.02, y + 0.1, z + 0.085, hair, { rz: 0.12 });               // fringe
    for (const s of [-1, 1]) o.box(0.03, 0.1, 0.1, x + s * 0.118, y + 0.04, z - 0.02, hair);   // sideburns
  }
  if (style === 'long') { o.box(0.25, 0.3, 0.09, x, y - 0.06, z - 0.09, hair); for (const s of [-1, 1]) o.box(0.05, 0.22, 0.06, x + s * 0.12, y - 0.04, z + 0.0, hair); }
  if (style === 'bun') o.sph(0.06, x, y + 0.14, z - 0.09, hair, { seg: 7 });
  if (style === 'bald') { o.sph(0.1, x, y - 0.085, z + 0.04, hair, { sy: 0.55, sz: 0.85, seg: 8 }); o.box(0.06, 0.012, 0.014, x, y - 0.045, z + 0.112, hair); }
  if (style === 'cap') {
    const cc = P.capColor || '#e8322b', back = P.capBack ? -1 : 1;
    o.sph(0.138, x, y + 0.075, z - 0.005, cc, { sy: 0.62, seg: 10 });
    o.box(0.17, 0.014, 0.12, x, y + 0.075, z + back * 0.15, cc, { rx: back * -0.12 });
    o.cyl(0.012, 0.01, x, y + 0.16, z, shade(cc, -0.2), { seg: 6 });
  }
  if (P.glasses) {
    for (const s of [-1, 1]) o.torus(0.03, 0.15, x + s * 0.046, y + 0.022, z + 0.118, '#1d2230', { seg: 10 });
    o.box(0.03, 0.008, 0.008, x, y + 0.03, z + 0.12, '#1d2230');
  }
}
// upper body (hips → neck) built into o; returns nothing. lean = forward tilt in rad
function addTorso(o, x, y0, z, P, lean = 0) {
  const { shirt, pants, skin } = P;
  const T0 = new Obj();
  T0.cyl(0.165, 0.18, 0, 0.09, 0, pants, { sz: 0.64, seg: 8 });                // hips
  T0.cyl(0.168, 0.035, 0, 0.17, 0, '#2a2a2a', { sz: 0.65, seg: 8 });           // belt
  T0.box(0.04, 0.03, 0.01, 0, 0.17, 0.105, '#d9c060');                          // buckle
  T0.cyl(0.19, 0.48, 0, 0.42, 0, shirt, { rt: 1.14, sz: 0.62, seg: 8 });       // torso
  for (const s of [-1, 1]) T0.sph(0.075, s * 0.2, 0.64, 0, shirt, { sz: 0.9, seg: 7 }); // shoulders
  T0.cyl(0.075, 0.04, 0, 0.67, 0, shade(shirt, -0.12), { seg: 8 });             // collar
  T0.cyl(0.055, 0.1, 0, 0.72, 0, skin, { seg: 7 });                             // neck
  if (P.logo) T0.cyl(0.04, 0.01, -0.07, 0.52, 0.122, P.logo, { rx: PI / 2, seg: 8 });
  if (P.jacket) for (const s of [-1, 1]) T0.box(0.15, 0.5, 0.02, s * 0.11, 0.42, 0.122, P.jacket, { ry: s * -0.2 });
  if (P.apron) {
    T0.box(0.3, 0.5, 0.012, 0, 0.32, 0.128, P.apron);
    T0.box(0.012, 0.25, 0.01, -0.12, 0.6, 0.11, P.apron); T0.box(0.012, 0.25, 0.01, 0.12, 0.6, 0.11, P.apron);
    if (P.tag) T0.label(0.09, 0.035, 0.08, 0.5, 0.136, P.tag);
  }
  o.put(T0, x, y0, z, 0, 1, lean);
}
function buildPerson(shirt, pants, hair, skin = '#f0c29a', P0 = {}) {
  const P = Object.assign({ shirt, pants, hair, skin, style: pick(['short', 'short', 'long', 'bun', 'cap', 'bald']), glasses: rng() < 0.25, logo: rng() < 0.5 ? pick(['#ffffff', '#ffd21f', '#1d2230']) : null, jacket: rng() < 0.25 ? '#3a3f4a' : null, capColor: pick(['#e8322b', '#2a62c9', '#1d2230']) }, P0);
  const g = new T.Group();
  const body = new Obj();
  addTorso(body, 0, 0.9, 0, P);
  addHead(body, 0, 1.73, 0, P);
  const bm = new MeshAcc().addObj(body).build(VCMAT); bm.castShadow = true; g.add(bm);
  const shoe = P.shoe || pick(['#2a2a2a', '#ffffff', '#6b4226', '#e8322b']);
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const lo = new Obj();
    lo.cyl(0.075, 0.47, 0, -0.235, 0, pants, { rt: 1.1, seg: 8 });
    lo.sph(0.066, 0, -0.47, 0, pants, { seg: 7 });
    lo.cyl(0.064, 0.4, 0, -0.67, 0, pants, { rt: 1.0, seg: 8 });
    lo.sph(0.07, 0, -0.88, 0.04, shoe, { sx: 0.85, sy: 0.5, sz: 1.5, seg: 8 });
    lo.box(0.12, 0.022, 0.21, 0, -0.9, 0.04, shade(shoe, -0.25));
    const lm = new MeshAcc().addObj(lo).build(VCMAT); lm.castShadow = true;
    const l = new T.Group(); l.add(lm); l.position.set(s * 0.09, 0.92, 0); g.add(l); legs.push(l);
    const ao = new Obj(), sleeve = P.jacket || shirt;
    ao.cyl(0.056, 0.28, 0, -0.14, 0, sleeve, { seg: 8, rt: 1.05 });
    ao.cyl(0.046, 0.26, 0, -0.41, 0, P.jacket ? P.jacket : skin, { seg: 8 });
    ao.sph(0.052, 0, -0.57, 0.01, skin, { sx: 0.7, sy: 1.1, seg: 7 });
    ao.sph(0.02, s * -0.035, -0.55, 0.035, skin, { seg: 5 });
    const am = new MeshAcc().addObj(ao).build(VCMAT); am.castShadow = true;
    const a = new T.Group(); a.add(am); a.position.set(s * 0.255, 1.52, 0); g.add(a); arms.push(a);
  }
  return { g, legs, arms };
}
const SHIRTS = ['#e8322b', '#2a62c9', '#3f9b3a', '#f2a20c', '#8a6bd6', '#1aa39a', '#ff7eb6', '#555b66'];
const PANTS = ['#2b3550', '#3a3f4a', '#6b4226', '#1d2230', '#4a5a8a'];
const HAIR = ['#3a2412', '#111111', '#d9a253', '#8a3a1b', '#bbbbbb'];

// cashiers at the checkouts
const CASHIERS = [];
function buildCashiers(scene) {
  rng = mulberry32(7);
  for (const lane of LANES) {
    const tag = atlasLabel(2.6, (g, x, y, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(x, y, w, h); g.fillStyle = '#1aa39a'; g.fillRect(x, y, w * 0.22, h); g.fillStyle = '#1d2230'; g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, pick(NAMES), x + w * 0.6, y + h * 0.55, w * 0.7, h * 0.6); }, false, '#ffffff');
    const p = buildPerson('#1aa39a', '#2b3550', pick(HAIR), pick(SKINS), { apron: '#1d6f68', tag, jacket: null, logo: null });
    p.g.position.set(lane.cx - 0.35, -0.35, 5.9); p.g.rotation.y = PI / 2;
    p.arms[1].rotation.x = -0.8; p.arms[0].rotation.x = -0.5;
    scene.add(p.g); CASHIERS.push(p); lane.cashier = p;
  }
}

// ---------- hazards per level ----------
const HZ = { group: null, puddles: [], shoppers: [], towers: [] };
function levelCfg(n) {
  return {
    items: Math.min(4 + n, 12),
    minKmh: Math.min(8 + (n - 1) * 1.5, 18),
    reveal: Math.max(10 - (n - 1) * 0.8, 5),
    puddles: n >= 2 ? Math.min(3 + (n - 2) * 2, 12) : 0,
    shoppers: n >= 3 ? Math.min(3 + (n - 3) * 2, 14) : 0,
    towers: n >= 4 ? Math.min(2 + (n - 4), 7) : 0,
  };
}
function clearHazards(scene) {
  if (HZ.group) scene.remove(HZ.group);
  HZ.group = new T.Group(); scene.add(HZ.group);
  HZ.puddles = []; HZ.shoppers = []; HZ.towers = [];
  DYN_BOXES.length = 0; DYN_CIRCLES.length = 0;
}
let WET_UV = null;
// permanent labels (drawn once before the world-specific part of the atlas)
function makeHazardLabels() {
  if (!WET_UV) WET_UV = atlasLabel(0.64, (g, x, y, w, h) => {
    g.fillStyle = '#ffd21f'; g.fillRect(x, y, w, h);
    g.fillStyle = '#1d2230'; g.beginPath(); g.moveTo(x + w / 2, y + h * 0.06); g.lineTo(x + w * 0.92, y + h * 0.55); g.lineTo(x + w * 0.08, y + h * 0.55); g.closePath(); g.fill();
    g.fillStyle = '#ffd21f'; g.beginPath(); g.moveTo(x + w / 2, y + h * 0.13); g.lineTo(x + w * 0.83, y + h * 0.51); g.lineTo(x + w * 0.17, y + h * 0.51); g.closePath(); g.fill();
    g.fillStyle = '#1d2230'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${h * 0.3}px ${FONT}`; g.fillText('!', x + w / 2, y + h * 0.37);
    fitText(g, 'VORSICHT', x + w / 2, y + h * 0.68, w * 0.9, h * 0.13); fitText(g, 'Rutschgefahr', x + w / 2, y + h * 0.84, w * 0.9, h * 0.1, 800);
  }, false, '#ffd21f');
}
const puddleMat = new T.MeshLambertMaterial({ color: '#8fd3ff', transparent: true, opacity: 0.55, depthWrite: false });
const puddleShine = new T.MeshBasicMaterial({ color: '#e6f7ff', transparent: true, opacity: 0.5, depthWrite: false });
function setupHazards(scene, level) {
  clearHazards(scene);
  makeHazardLabels();
  const cfg = levelCfg(level);
  rng = mulberry32(1000 + level * 17);
  const aisleSpot = () => { const a = RI(0, 6), h = RI(0, 1), A = AISLES[a]; const [za, zb] = HALVES[h]; return { a, h, A, za, zb }; };
  // ---- wet floor ----
  for (let i = 0; i < cfg.puddles; i++) {
    let x, z;
    if (rng() < 0.7) { const s = aisleSpot(); x = s.A.cx + R(-1.2, 1.2); z = R(s.za + 2, s.zb - 2); }
    else { x = R(-26, 26); z = rng() < 0.5 ? R(28, 30) : R(45.5, 47); }
    const rx = R(1.1, 1.9), rz = R(1.4, 2.4);
    const m = new T.Mesh(new T.CircleGeometry(1, 14), puddleMat);
    m.rotation.x = -PI / 2; m.scale.set(rx, rz, 1); m.position.set(x, 0.012, z); HZ.group.add(m);
    const sh = new T.Mesh(new T.CircleGeometry(1, 8), puddleShine);
    sh.rotation.x = -PI / 2; sh.scale.set(rx * 0.3, rz * 0.2, 1); sh.position.set(x + rx * 0.3, 0.014, z - rz * 0.2); HZ.group.add(sh);
    HZ.puddles.push({ x, z, rx, rz });
    // yellow wet floor sign
    const sx = x + (rx + 0.3) * (rng() < 0.5 ? -1 : 1), sz = z;
    const so = new Obj();
    for (const d of [1, -1]) {
      so.box(0.36, 0.62, 0.025, 0, 0.3, d * 0.1, '#ffd21f', { rx: d * -0.25 });
      so.label(0.32, 0.5, 0, 0.32, d * 0.1 + d * 0.014 * Math.cos(0.25), WET_UV, { rx: d * -0.25, ry: d > 0 ? 0 : PI });
    }
    so.box(0.38, 0.04, 0.06, 0, 0.62, 0, '#e0b400');
    const sm = new MeshAcc().addObj(so).build(VCMAT); sm.position.set(sx, 0, sz); sm.rotation.y = R(0, TAU); sm.castShadow = true; HZ.group.add(sm);
    addCol(sx - 0.2, sz - 0.2, sx + 0.2, sz + 0.2, DYN_BOXES);
  }
  // ---- other shoppers ----
  for (let i = 0; i < cfg.shoppers; i++) {
    const p = buildPerson(pick(SHIRTS), pick(PANTS), pick(HAIR), pick(SKINS));
    const cart = new Obj(); buildPlainCart(cart, 0, 0.75, '#c3c8cf');
    const cm = new MeshAcc().addObj(cart).build(VCMAT); cm.castShadow = true; p.g.add(cm);
    p.arms[0].rotation.x = p.arms[1].rotation.x = -1.1;
    let path;
    if (rng() < 0.75) { const s = aisleSpot(); const x = s.A.cx + R(-1.4, 1.4); path = { ax: x, az: s.za + 0.8, bx: x, bz: s.zb - 0.8 }; }
    else { const z = rng() < 0.5 ? 29 : 46.3; path = { ax: R(-27, -5), az: z, bx: R(5, 27), bz: z }; }
    const sh = { p, path, t: rng(), dir: rng() < 0.5 ? 1 : -1, speed: R(0.9, 1.4), turn: 0, bump: 0, col: { x: 0, z: 0, r: 0.7 } };
    sh.len = Math.hypot(path.bx - path.ax, path.bz - path.az);
    HZ.group.add(p.g); HZ.shoppers.push(sh); DYN_CIRCLES.push(sh.col);
  }
  // ---- wobbly display towers that topple when you come close ----
  for (let i = 0; i < cfg.towers; i++) {
    const s = aisleSpot();
    const side = rng() < 0.5 ? -1 : 1; // -1 = at left face (falls to +x)
    const fx = side < 0 ? s.A.x0 + 0.5 : s.A.x1 - 0.5, z = R(s.za + 2.5, s.zb - 2.5);
    const f = -side; // fall direction (towards the aisle center)
    const piv = new T.Group(); piv.position.set(fx + f * 0.45, 0, z); // pivot at the edge towards the aisle
    const o = new Obj();
    const cols = ['#c8914a', '#b97b3a', '#d9a253'];
    for (let k = 0; k < 6; k++) {
      const bx = -f * 0.45 + R(-0.04, 0.04), bz = R(-0.04, 0.04), ry = R(-0.1, 0.1), pr = pick(PRODUCTS.filter((q) => q.mainLab));
      o.box(0.8, 0.36, 0.8, bx, 0.18 + k * 0.37, bz, cols[k % 3], { ry });
      o.box(0.81, 0.04, 0.81, bx, 0.18 + k * 0.37, bz, '#c9a26a', { ry });
      for (const d of [1, -1]) o.label(0.36, 0.36 / pr.mainAspect > 0.3 ? 0.3 : 0.36 / pr.mainAspect, bx + Math.sin(ry) * d * 0.401, 0.18 + k * 0.37, bz + Math.cos(ry) * d * 0.401, pr.mainLab, { ry: ry + (d > 0 ? 0 : PI) });
    }
    o.box(0.6, 0.3, 0.02, -f * 0.45, 2.45, 0, '#ffd84a');
    const m = new MeshAcc().addObj(o).build(VCMAT); m.castShadow = true; piv.add(m); HZ.group.add(piv);
    const col = addCol(fx - 0.42, z - 0.42, fx + 0.42, z + 0.42, DYN_BOXES);
    HZ.towers.push({ piv, f, fx, z, s, col, state: 0, t: 0 });
  }
}
function puddleAt(x, z) {
  for (const p of HZ.puddles) { const dx = (x - p.x) / p.rx, dz = (z - p.z) / p.rz; if (dx * dx + dz * dz < 1) return true; }
  return false;
}
function updateHazards(dt, time, cx, cz, speed, onFall) {
  for (const sh of HZ.shoppers) {
    if (sh.bump > 0) sh.bump -= dt;
    if (sh.turn > 0) { sh.turn -= dt; if (sh.turn <= 0) sh.dir *= -1; }
    else if (sh.bump <= 0) {
      sh.t += (sh.dir * sh.speed * dt) / sh.len;
      if (sh.t > 1 || sh.t < 0) { sh.t = clamp(sh.t, 0, 1); sh.turn = 0.8; }
    }
    const { path } = sh, x = lerp(path.ax, path.bx, sh.t), z = lerp(path.az, path.bz, sh.t);
    let yaw = Math.atan2((path.bx - path.ax) * sh.dir, (path.bz - path.az) * sh.dir);
    if (sh.turn > 0) yaw += PI * (1 - sh.turn / 0.8);
    sh.p.g.position.set(x, 0, z); sh.p.g.rotation.y = yaw;
    const walk = sh.turn > 0 || sh.bump > 0 ? 0 : Math.sin(time * 6 * sh.speed) * 0.5;
    sh.p.legs[0].rotation.x = walk; sh.p.legs[1].rotation.x = -walk;
    sh.col.x = x + Math.sin(yaw) * 0.45; sh.col.z = z + Math.cos(yaw) * 0.45;
  }
  for (const tw of HZ.towers) {
    if (tw.state === 0) {
      const d = Math.hypot(cx - tw.fx, cz - tw.z);
      if (d < 7.5 && Math.abs(cx - tw.s.A.cx) < 4 && speed > 1) { tw.state = 1; tw.t = 0; onFall && onFall(tw); }
    } else if (tw.state === 1) {
      tw.t += dt;
      const k = Math.min(1, (tw.t * tw.t) / 0.5);
      tw.piv.rotation.z = -tw.f * k * (PI / 2 - 0.08);
      if (k >= 1) {
        tw.state = 2;
        // lying across the aisle now
        const x0 = tw.fx + tw.f * 0.45, x1 = x0 + tw.f * 2.3;
        Object.assign(tw.col, { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: tw.z - 0.45, z1: tw.z + 0.45 });
      }
    }
  }
}
