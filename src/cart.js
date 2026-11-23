// ============================================================
//  Shopping Drifters – the tuned shopping cart (+ rider hands, speedometer)
//  Local space: +z = forward, origin = floor below cart center.
// ============================================================
const CART_MAX_KMH = 50;
function buildCart() {
  const root = new T.Group();      // position + yaw
  const body = new T.Group();      // roll/pitch/bounce
  root.add(body);
  const o = new Obj();
  const chrome = '#d4dbe2', dark = '#22252d', red = '#e8322b', yel = '#ffd21f', purple = '#7a3cff';

  // ---- wire basket (tapered) ----
  const bz0 = -0.36, bz1 = 0.5, by0 = 0.56, by1 = 0.98;
  const hw = (z, y) => lerp(0.29, 0.24, (z - bz0) / (bz1 - bz0)) - (by1 - y) * 0.08;
  const P3 = (x, y, z) => new V3(x, y, z);
  const t = 0.012;
  // top rim (thick, painted)
  const rim = [[bz0, by1], [bz1, by1]];
  for (const s of [-1, 1]) o.bar(P3(s * hw(bz0, by1), by1, bz0), P3(s * hw(bz1, by1), by1, bz1), 0.026, purple);
  o.bar(P3(-hw(bz1, by1), by1, bz1), P3(hw(bz1, by1), by1, bz1), 0.026, purple);
  o.bar(P3(-hw(bz0, by1), by1, bz0), P3(hw(bz0, by1), by1, bz0), 0.026, purple);
  // bottom frame
  for (const s of [-1, 1]) o.bar(P3(s * hw(bz0, by0), by0, bz0), P3(s * hw(bz1, by0), by0, bz1), 0.016, chrome);
  o.bar(P3(-hw(bz1, by0), by0, bz1), P3(hw(bz1, by0), by0, bz1), 0.016, chrome);
  o.bar(P3(-hw(bz0, by0), by0, bz0), P3(hw(bz0, by0), by0, bz0), 0.016, chrome);
  // side walls: vertical wires + 3 horizontal wires
  for (let z = bz0 + 0.07; z < bz1; z += 0.07) for (const s of [-1, 1]) o.bar(P3(s * hw(z, by0), by0, z), P3(s * hw(z, by1), by1, z), t, chrome);
  for (const y of [0.66, 0.76, 0.87]) for (const s of [-1, 1]) o.bar(P3(s * hw(bz0, y), y, bz0), P3(s * hw(bz1, y), y, bz1), t, chrome);
  // front + back walls
  for (const z of [bz0, bz1]) {
    for (let k = -3; k <= 3; k++) { const f = k / 3.5; o.bar(P3(hw(z, by0) * f, by0, z), P3(hw(z, by1) * f, by1, z), t, chrome); }
    for (const y of [0.66, 0.76, 0.87]) o.bar(P3(-hw(z, y), y, z), P3(hw(z, y), y, z), t, chrome);
  }
  // floor grid
  for (let k = -3; k <= 3; k++) o.bar(P3(k * 0.07, by0, bz0), P3(k * 0.065, by0, bz1), t, chrome);
  for (let z = bz0 + 0.1; z < bz1; z += 0.1) o.bar(P3(-hw(z, by0), by0, z), P3(hw(z, by0), by0, z), t, chrome);
  // racing panels on the sides (outside)
  for (const s of [-1, 1]) {
    const zc = 0.07, x = s * (hw(zc, 0.77) + 0.012);
    o.box(0.008, 0.2, 0.62, x, 0.77, zc, dark, { ry: s * 0.03 });
    o.box(0.01, 0.05, 0.62, x + s * 0.002, 0.81, zc, yel, { ry: s * 0.03 });
    o.box(0.01, 0.025, 0.62, x + s * 0.002, 0.75, zc, red, { ry: s * 0.03 });
    // number circle
    o.cyl(0.06, 0.012, x + s * 0.004, 0.77, -0.12, '#ffffff', { rz: PI / 2, seg: 10 });
  }

  // ---- chassis, handle, push bars ----
  for (const s of [-1, 1]) {
    o.bar(P3(s * 0.27, 1.0, -0.48), P3(s * 0.25, 0.2, -0.4), 0.03, dark, true);
    o.bar(P3(s * 0.25, 0.2, -0.42), P3(s * 0.21, 0.13, 0.47), 0.03, dark, true);
    o.bar(P3(s * 0.27, 1.0, -0.48), P3(s * 0.27, by1, bz0 + 0.02), 0.02, dark, true);
  }
  o.cyl(0.024, 0.62, 0, 1.0, -0.48, red, { rz: PI / 2, seg: 8 }); // original push handle
  // chopper "ape hanger" bars on top of it
  for (const s of [-1, 1]) {
    o.bar(P3(s * 0.2, 1.0, -0.48), P3(s * 0.24, 1.24, -0.5), 0.022, chrome, true);
    o.bar(P3(s * 0.24, 1.24, -0.5), P3(s * 0.31, 1.27, -0.55), 0.022, chrome, true);
    o.cyl(0.028, 0.11, s * 0.36, 1.27, -0.57, '#111', { rz: PI / 2 + s * 0.15, ry: s * 0.25, seg: 8 }); // grips
  }
  o.bar(P3(-0.24, 1.24, -0.5), P3(0.24, 1.24, -0.5), 0.02, chrome, true);
  // bottom tray (where crates normally go) + rider's foot bar
  o.box(0.44, 0.02, 0.8, 0, 0.17, 0.04, dark);
  o.bar(P3(-0.24, 0.2, -0.47), P3(0.24, 0.2, -0.47), 0.03, chrome, true);
  o.box(0.48, 0.02, 0.1, 0, 0.21, -0.5, '#3a3f4a'); // step plate
  // ---- the ENGINE on the bottom tray ----
  o.box(0.26, 0.15, 0.24, 0, 0.26, 0.12, '#30343e');
  o.box(0.28, 0.04, 0.26, 0, 0.35, 0.12, red);
  for (let i = 0; i < 4; i++) o.box(0.3, 0.008, 0.2, 0, 0.21 + i * 0.03, 0.12, '#5a606c');
  for (const s of [-1, 1]) { o.cyl(0.04, 0.12, s * 0.075, 0.42, 0.1, chrome, { seg: 8 }); o.cyl(0.05, 0.02, s * 0.075, 0.485, 0.1, '#888', { seg: 8 }); }
  o.cyl(0.05, 0.05, 0, 0.4, 0.26, chrome, { rx: PI / 2, seg: 8 }); // intake
  o.cyl(0.035, 0.01, 0, 0.4, 0.29, '#111', { rx: PI / 2, seg: 8 });
  o.box(0.1, 0.1, 0.14, 0.12, 0.25, -0.1, '#1d6fd8'); // fuel tank
  o.cyl(0.02, 0.02, 0.12, 0.31, -0.1, chrome, { seg: 6 });
  // exhaust pipes → back
  for (const s of [-1, 1]) {
    o.bar(P3(s * 0.08, 0.24, 0.02), P3(s * 0.15, 0.2, -0.3), 0.035, chrome, true);
    o.bar(P3(s * 0.15, 0.2, -0.3), P3(s * 0.16, 0.24, -0.6), 0.04, chrome, true);
    o.cyl(0.032, 0.04, s * 0.16, 0.24, -0.62, '#222', { rx: PI / 2, seg: 8 });
  }
  // nitro bottle on the right side
  o.cyl(0.04, 0.28, -0.33, 0.72, 0.05, '#1d6fd8', { rx: PI / 2, seg: 8 });
  o.sph(0.04, -0.33, 0.72, 0.19, '#1d6fd8', { seg: 6 });
  o.cyl(0.015, 0.05, -0.33, 0.72, 0.23, chrome, { rx: PI / 2, seg: 6 });
  o.box(0.012, 0.06, 0.012, -0.31, 0.72, -0.05, chrome); o.box(0.012, 0.06, 0.012, -0.31, 0.72, 0.15, chrome);
  // ---- front spoiler wing ----
  for (const s of [-1, 1]) o.bar(P3(s * 0.17, by1, bz1 - 0.02), P3(s * 0.17, 1.14, bz1 + 0.04), 0.022, dark);
  o.box(0.62, 0.02, 0.14, 0, 1.15, bz1 + 0.05, red, { rx: -0.12 });
  for (const s of [-1, 1]) o.box(0.01, 0.1, 0.18, s * 0.31, 1.15, bz1 + 0.05, dark);
  // front bumper + headlights + number plate
  o.box(0.5, 0.06, 0.05, 0, 0.18, 0.52, dark);
  o.box(0.2, 0.08, 0.005, 0, 0.3, bz1 + 0.012, '#ffffff');
  // ---- wheels (bigger in the back, rims) ----
  const wheels = [];
  for (const [x, z, r] of [[-0.21, 0.44, 0.075], [0.21, 0.44, 0.075], [-0.24, -0.38, 0.095], [0.24, -0.38, 0.095]]) {
    o.box(0.02, 0.1, 0.02, x, 0.1 + r * 0.5, z, chrome);
    wheels.push({ x, z, r });
  }
  o.bar(P3(0.25, 0.5, -0.45), P3(0.3, 0.52, -1.02), 0.02, dark, true); // flag bracket
  const cartMesh = new MeshAcc().addObj(o).build(VCMAT);
  cartMesh.castShadow = true;
  body.add(cartMesh);

  // wheels as separate meshes so they can spin
  const wheelObjs = [];
  for (const w of wheels) {
    const wo = new Obj();
    wo.cyl(w.r, 0.05, 0, 0, 0, '#16181d', { rz: PI / 2, seg: 10 });
    wo.cyl(w.r * 0.6, 0.052, 0, 0, 0, w.r > 0.08 ? red : yel, { rz: PI / 2, seg: 6 });
    wo.box(0.054, w.r * 1.3, 0.02, 0, 0, 0, '#ddd');
    const m = new MeshAcc().addObj(wo).build(VCMAT);
    m.position.set(w.x, w.r, w.z); m.castShadow = true;
    body.add(m); wheelObjs.push(m);
  }

  // ---- glowing bits: headlights, neon under-glow, flames ----
  const glow = new T.MeshBasicMaterial({ color: '#4ff2ff' });
  const neon = new T.Mesh(new T.BoxGeometry(0.46, 0.015, 0.82), glow);
  neon.position.set(0, 0.155, 0.04); body.add(neon);
  for (const s of [-1, 1]) {
    const hl = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.03, 8), new T.MeshBasicMaterial({ color: '#fff8c4' }));
    hl.rotation.x = PI / 2; hl.position.set(s * 0.16, 0.22, 0.54); body.add(hl);
  }
  const underLight = new T.PointLight('#33e8ff', 3.5, 2.6, 2);
  underLight.position.set(0, 0.12, 0.05); body.add(underLight);
  const flameMat = new T.MeshBasicMaterial({ color: '#ff8a1f', transparent: true, opacity: 0.9, depthWrite: false });
  const flameCore = new T.MeshBasicMaterial({ color: '#fff3a0', transparent: true, opacity: 0.9, depthWrite: false });
  const flames = [];
  for (const s of [-1, 1]) {
    const f = new T.Group();
    const a = new T.Mesh(new T.ConeGeometry(0.035, 0.22, 7), flameMat); a.rotation.x = -PI / 2; a.position.z = -0.11;
    const b = new T.Mesh(new T.ConeGeometry(0.018, 0.12, 6), flameCore); b.rotation.x = -PI / 2; b.position.z = -0.06;
    f.add(a, b); f.position.set(s * 0.16, 0.24, -0.64); body.add(f); flames.push(f);
  }

  // ---- speedometer on the handle (model, not UI) ----
  const dialTex = canvasTex(256, 256, () => {});
  const tacho = new T.Group();
  const housing = new Obj();
  housing.cyl(0.085, 0.04, 0, 0, 0, '#1a1c22', { rx: PI / 2, seg: 14 });
  housing.torus(0.085, 0.12, 0, 0, 0.02, chrome, { seg: 14 });
  housing.box(0.03, 0.1, 0.03, 0, -0.09, -0.01, dark);
  tacho.add(new MeshAcc().addObj(housing).build(VCMAT));
  const face = new T.Mesh(new T.CircleGeometry(0.078, 24), new T.MeshBasicMaterial({ map: dialTex }));
  face.position.z = 0.021; tacho.add(face);
  const needle = new T.Group();
  const nm = new T.Mesh(new T.BoxGeometry(0.006, 0.065, 0.004), new T.MeshBasicMaterial({ color: '#ff2a2a' }));
  nm.position.y = 0.028; needle.add(nm);
  const cap = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 0.01, 8), new T.MeshBasicMaterial({ color: '#ddd' }));
  cap.rotation.x = PI / 2; needle.add(cap);
  needle.position.z = 0.026; tacho.add(needle);
  // facing the rider (rider is at -z, looking at +z) → dial normal points -z and up a bit
  tacho.position.set(0, 1.3, -0.48); tacho.rotation.set(0.75, PI, 0); tacho.scale.setScalar(0.62);
  body.add(tacho);
  function drawDial(minKmh) {
    const g = dialTex.userData.ctx, W = 256, c = W / 2;
    g.fillStyle = '#111318'; g.fillRect(0, 0, W, W);
    const a0 = PI * 0.75, a1 = PI * 2.25, ang = (k) => a0 + (a1 - a0) * (k / CART_MAX_KMH);
    g.lineWidth = 16; g.strokeStyle = '#d6262b'; g.beginPath(); g.arc(c, c, 104, ang(0), ang(minKmh)); g.stroke();
    g.strokeStyle = '#2bd45a'; g.beginPath(); g.arc(c, c, 104, ang(minKmh), ang(40)); g.stroke();
    g.strokeStyle = '#ff8a1f'; g.beginPath(); g.arc(c, c, 104, ang(40), ang(50)); g.stroke();
    g.fillStyle = '#fff'; g.font = `800 24px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let k = 0; k <= CART_MAX_KMH; k += 10) { const a = ang(k); g.fillText(String(k), c + Math.cos(a) * 74, c + Math.sin(a) * 74); }
    g.strokeStyle = '#fff'; g.lineWidth = 3;
    for (let k = 0; k <= CART_MAX_KMH; k += 5) { const a = ang(k); g.beginPath(); g.moveTo(c + Math.cos(a) * 92, c + Math.sin(a) * 92); g.lineTo(c + Math.cos(a) * (k % 10 ? 86 : 80), c + Math.sin(a) * (k % 10 ? 86 : 80)); g.stroke(); }
    g.fillStyle = '#ffd21f'; g.font = `900 22px ${FONT}`; g.fillText('km/h', c, c + 52);
    g.fillStyle = '#4ff2ff'; g.font = `900 16px ${FONT}`; g.fillText('TURBO', c, c - 40);
    dialTex.needsUpdate = true;
  }
  drawDial(8);

  // ---- fuzzy dice hanging from the handle ----
  const dice = new T.Group();
  const dObj = new Obj();
  dObj.box(0.004, 0.08, 0.004, 0, -0.04, 0, '#eee');
  dObj.box(0.05, 0.05, 0.05, -0.012, -0.1, 0, '#ff4fa8', { ry: 0.4, rx: 0.3 });
  dObj.box(0.05, 0.05, 0.05, 0.03, -0.11, 0.01, '#ffffff', { ry: -0.3, rz: 0.4 });
  for (const [x, y, z] of [[-0.012, -0.1, 0.026], [0.03, -0.11, 0.036]]) dObj.sph(0.006, x, y, z, '#111', { seg: 4 });
  dice.add(new MeshAcc().addObj(dObj).build(VCMAT));
  dice.position.set(-0.2, 1.23, -0.5); body.add(dice);
  // small checkered flag on the back left
  const flagTex = canvasTex(64, 48, (g) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#fff'; g.fillRect(i * 8, j * 8, 8, 8); } });
  const pole = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 1.0, 5), new T.MeshLambertMaterial({ color: '#ccc' }));
  pole.position.set(0.3, 1.0, -1.02); body.add(pole);
  const flag = new T.Mesh(new T.PlaneGeometry(0.2, 0.14, 4, 1), new T.MeshLambertMaterial({ map: flagTex, side: T.DoubleSide }));
  flag.position.set(0.3, 1.27, -1.12); flag.rotation.y = PI / 2; body.add(flag);

  // ---- rider: arms + hands on the handle, sneakers on the step ----
  const rider = new T.Group();
  const ro = new Obj();
  const skin = '#f0c29a', sleeve = '#2a7de1';
  for (const s of [-1, 1]) {
    const hand = P3(s * 0.36, 1.275, -0.57), wrist = P3(s * 0.36, 1.27, -0.64), elbow = P3(s * 0.38, 1.2, -0.78), shoulder = P3(s * 0.22, 1.36, -0.98);
    ro.bar(shoulder, elbow, 0.09, sleeve, true);
    ro.bar(elbow, wrist, 0.07, sleeve, true);
    ro.cyl(0.042, 0.03, wrist.x, wrist.y, wrist.z + 0.01, '#ffffff', { rx: PI / 2, seg: 7 }); // cuffs
    ro.sph(0.048, hand.x, hand.y + 0.015, hand.z, skin, { sx: 0.9, sy: 0.85, sz: 1.2, seg: 6 });
    ro.sph(0.02, hand.x - s * 0.035, hand.y + 0.04, hand.z + 0.02, skin, { seg: 5 }); // thumb
    // legs + sneakers
    ro.bar(P3(s * 0.11, 0.24, -0.53), P3(s * 0.12, 0.95, -0.72), 0.11, '#2b3550', true);
    ro.box(0.1, 0.07, 0.24, s * 0.11, 0.255, -0.5, '#ffffff');
    ro.box(0.104, 0.025, 0.25, s * 0.11, 0.225, -0.5, '#e8322b');
  }
  rider.add(new MeshAcc().addObj(ro).build(VCMAT));
  rider.children[0].castShadow = true;
  body.add(rider);

  // basket item holder
  const items = new T.Group(); body.add(items);

  return {
    root, body, wheels: wheelObjs, flames, flameMat, flameCore, underLight, needle, dice, flag, rider, items, drawDial, glow,
    eye: new V3(0, 1.66, -0.9),
  };
}
