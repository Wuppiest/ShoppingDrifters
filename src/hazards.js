// ============================================================
//  Shopping Drifters – people (shoppers, cashiers) + level hazards
// ============================================================
function buildPerson(shirt, pants, hair, skin = '#f0c29a') {
  const g = new T.Group();
  const body = new Obj();
  body.box(0.42, 0.55, 0.26, 0, 1.2, 0, shirt);
  body.box(0.44, 0.12, 0.27, 0, 0.98, 0, pants);
  body.box(0.12, 0.12, 0.12, 0, 1.53, 0, skin);
  body.sph(0.15, 0, 1.7, 0, skin, { seg: 7 });
  body.box(0.31, 0.1, 0.3, 0, 1.82, -0.02, hair);
  body.box(0.31, 0.2, 0.06, 0, 1.72, -0.15, hair);
  body.sph(0.02, 0.06, 1.72, 0.14, '#111', { seg: 4 }); body.sph(0.02, -0.06, 1.72, 0.14, '#111', { seg: 4 });
  const bm = new MeshAcc().addObj(body).build(VCMAT); bm.castShadow = true; g.add(bm);
  const limb = (w, h, c, foot) => {
    const o = new Obj(); o.box(w, h, w, 0, -h / 2, 0, c);
    if (foot) o.box(w * 1.1, 0.07, w * 1.6, 0, -h + 0.035, 0.04, '#2a2a2a');
    const m = new MeshAcc().addObj(o).build(VCMAT); m.castShadow = true;
    const p = new T.Group(); p.add(m); return p;
  };
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const l = limb(0.16, 0.92, pants, true); l.position.set(s * 0.11, 0.93, 0); g.add(l); legs.push(l);
    const a = limb(0.11, 0.55, shirt); a.position.set(s * 0.27, 1.44, 0); g.add(a); arms.push(a);
    const hnd = new T.Mesh(geoSph(5), VCMAT); // hand (vertex colors not on this geo → use material color)
    hnd.material = new T.MeshLambertMaterial({ color: skin }); hnd.scale.setScalar(0.06); hnd.position.y = -0.58; a.add(hnd);
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
    const p = buildPerson(pick(['#1aa39a']), '#2b3550', pick(HAIR));
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
const puddleMat = new T.MeshLambertMaterial({ color: '#8fd3ff', transparent: true, opacity: 0.55, depthWrite: false });
const puddleShine = new T.MeshBasicMaterial({ color: '#e6f7ff', transparent: true, opacity: 0.5, depthWrite: false });
function setupHazards(scene, level) {
  clearHazards(scene);
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
    so.box(0.36, 0.6, 0.03, 0, 0.3, 0.1, '#ffd21f', { rx: -0.25 }); so.box(0.36, 0.6, 0.03, 0, 0.3, -0.1, '#ffd21f', { rx: 0.25 });
    so.box(0.2, 0.18, 0.01, 0, 0.35, 0.18, '#222', { rx: -0.25 }); so.box(0.12, 0.08, 0.02, 0, 0.35, 0.17, '#ffd21f', { rx: -0.25 });
    const sm = new MeshAcc().addObj(so).build(VCMAT); sm.position.set(sx, 0, sz); sm.rotation.y = R(0, TAU); sm.castShadow = true; HZ.group.add(sm);
    addCol(sx - 0.2, sz - 0.2, sx + 0.2, sz + 0.2, DYN_BOXES);
  }
  // ---- other shoppers ----
  for (let i = 0; i < cfg.shoppers; i++) {
    const p = buildPerson(pick(SHIRTS), pick(PANTS), pick(HAIR));
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
    for (let k = 0; k < 6; k++) { o.box(0.8, 0.36, 0.8, -f * 0.45 + R(-0.04, 0.04), 0.18 + k * 0.37, R(-0.04, 0.04), cols[k % 3], { ry: R(-0.1, 0.1) }); o.box(0.5, 0.12, 0.01, -f * 0.45, 0.2 + k * 0.37, 0.405, '#e8322b'); }
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
