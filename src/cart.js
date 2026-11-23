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

  // ---- printed decals ----
  const sideDecal = atlasLabel(0.62 / 0.2, (g, x, y, w, h) => {
    const grd = g.createLinearGradient(x, 0, x + w, 0); grd.addColorStop(0, '#1a1c22'); grd.addColorStop(1, '#2a2d38');
    g.fillStyle = grd; g.fillRect(x, y, w, h);
    // flames licking from the front
    const fl = (col, k) => { g.fillStyle = col; g.beginPath(); g.moveTo(x + w, y + h * 0.15); for (let i = 0; i <= 6; i++) { const fx = x + w - w * (0.25 + 0.55 * k) * (0.5 + 0.5 * Math.sin(i * 1.7 + k)), fy = y + h * (0.15 + i * 0.12); g.quadraticCurveTo(fx + w * 0.12, fy - h * 0.06, fx, fy); g.quadraticCurveTo(fx + w * 0.08, fy + h * 0.04, x + w - w * 0.1, fy + h * 0.06); } g.lineTo(x + w, y + h * 0.9); g.closePath(); g.fill(); };
    fl('#e8322b', 1); fl('#ff8a1f', 0.7); fl('#ffd21f', 0.4);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + h * 0.55, y + h * 0.5, h * 0.38, 0, TAU); g.fill();
    g.fillStyle = '#1a1c22'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${h * 0.55}px ${FONT}`; g.fillText('7', x + h * 0.55, y + h * 0.53);
    g.fillStyle = '#4ff2ff'; g.font = `italic 900 ${h * 0.3}px ${FONT}`; g.fillText('DRIFT', x + w * 0.42, y + h * 0.5);
  }, true, '#1a1c22');
  const plate = atlasLabel(2.6, (g, x, y, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(x, y, w, h); g.strokeStyle = '#111'; g.lineWidth = h * 0.08; g.strokeRect(x + 2, y + 2, w - 4, h - 4);
    g.fillStyle = '#1d4fb8'; g.fillRect(x + 3, y + 3, w * 0.12, h - 6);
    g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, 'SD·DR1FT', x + w * 0.56, y + h * 0.55, w * 0.8, h * 0.62);
  }, false, '#ffffff');
  const wingDecal = atlasLabel(6, (g, x, y, w, h) => {
    g.fillStyle = '#e8322b'; g.fillRect(x, y, w, h);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `italic 900 ${h * 0.75}px ${FONT}`; g.fillText('TURBO', x + w / 2, y + h * 0.55);
  }, false, '#e8322b');

  // ---- wire basket (tapered) ----
  const bz0 = -0.36, bz1 = 0.5, by0 = 0.56, by1 = 0.98;
  const hw = (z, y) => lerp(0.29, 0.24, (z - bz0) / (bz1 - bz0)) - (by1 - y) * 0.08;
  const P3 = (x, y, z) => new V3(x, y, z);
  const t = 0.011;
  // top rim: thick padded tube with stripes
  const rimPts = [P3(-hw(bz0, by1), by1, bz0), P3(-hw(bz1, by1), by1, bz1), P3(hw(bz1, by1), by1, bz1), P3(hw(bz0, by1), by1, bz0)];
  for (let i = 0; i < 4; i++) o.bar(rimPts[i], rimPts[(i + 1) % 4], 0.032, purple, true);
  for (const pt of rimPts) o.sph(0.017, pt.x, pt.y, pt.z, purple, { seg: 6 });
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const z = lerp(bz0 + 0.1, bz1 - 0.1, k / 4); o.cyl(0.018, 0.02, s * hw(z, by1), by1, z, yel, { rx: PI / 2, seg: 6 }); }
  // bottom frame
  const botPts = [P3(-hw(bz0, by0), by0, bz0), P3(-hw(bz1, by0), by0, bz1), P3(hw(bz1, by0), by0, bz1), P3(hw(bz0, by0), by0, bz0)];
  for (let i = 0; i < 4; i++) o.bar(botPts[i], botPts[(i + 1) % 4], 0.02, chrome, true);
  // side walls: vertical wires + horizontal wires
  for (let z = bz0 + 0.06; z < bz1 - 0.01; z += 0.06) for (const s of [-1, 1]) o.bar(P3(s * hw(z, by0), by0, z), P3(s * hw(z, by1), by1, z), t, chrome, true);
  for (const y of [0.63, 0.7, 0.77, 0.84, 0.91]) for (const s of [-1, 1]) o.bar(P3(s * hw(bz0, y), y, bz0), P3(s * hw(bz1, y), y, bz1), t, chrome, true);
  // front + back walls
  for (const z of [bz0, bz1]) {
    for (let k = -4; k <= 4; k++) { const f = k / 4.5; o.bar(P3(hw(z, by0) * f, by0, z), P3(hw(z, by1) * f, by1, z), t, chrome, true); }
    for (const y of [0.63, 0.7, 0.77, 0.84, 0.91]) o.bar(P3(-hw(z, y), y, z), P3(hw(z, y), y, z), t, chrome, true);
  }
  // floor grid
  for (let k = -4; k <= 4; k++) o.bar(P3(k * 0.055, by0, bz0), P3(k * 0.05, by0, bz1), t, chrome, true);
  for (let z = bz0 + 0.08; z < bz1; z += 0.08) o.bar(P3(-hw(z, by0), by0, z), P3(hw(z, by0), by0, z), t, chrome, true);
  // kids' seat flap at the back (classic cart detail), folded up
  o.box(0.42, 0.2, 0.012, 0, 0.84, bz0 + 0.035, '#e8322b', { rx: 0.08 });
  o.box(0.36, 0.05, 0.014, 0, 0.9, bz0 + 0.03, '#ffd21f', { rx: 0.08 });
  for (const s of [-1, 1]) o.box(0.07, 0.09, 0.016, s * 0.12, 0.79, bz0 + 0.03, '#b81e1e', { rx: 0.08 });
  // printed racing panels on the outside of both side walls
  for (const s of [-1, 1]) {
    const zc = 0.07, x = s * (hw(zc, 0.77) + 0.014), ry = s * 0.03;
    o.box(0.006, 0.21, 0.64, x - s * 0.004, 0.77, zc, dark, { ry });
    o.label(0.62, 0.2, x + s * 0.0005, 0.77, zc, sideDecal, { ry: s * PI / 2 + ry });
  }

  // ---- chassis, handle, push bars ----
  for (const s of [-1, 1]) {
    o.bar(P3(s * 0.27, 1.0, -0.48), P3(s * 0.25, 0.2, -0.4), 0.032, dark, true);
    o.bar(P3(s * 0.25, 0.2, -0.42), P3(s * 0.21, 0.13, 0.47), 0.032, dark, true);
    o.bar(P3(s * 0.27, 1.0, -0.48), P3(s * 0.27, by1, bz0 + 0.02), 0.022, dark, true);
    o.bar(P3(s * 0.26, 0.6, -0.44), P3(s * hw(bz0, by0), by0, bz0), 0.02, dark, true);
  }
  o.cyl(0.025, 0.6, 0, 1.0, -0.48, red, { rz: PI / 2, seg: 10 }); // original push handle
  for (const s of [-1, 1]) o.cyl(0.03, 0.03, s * 0.3, 1.0, -0.48, dark, { rz: PI / 2, seg: 8 });
  // chopper "ape hanger" bars on top of it
  for (const s of [-1, 1]) {
    o.bar(P3(s * 0.2, 1.0, -0.48), P3(s * 0.24, 1.24, -0.5), 0.024, chrome, true);
    o.sph(0.013, s * 0.24, 1.24, -0.5, chrome, { seg: 6 });
    o.bar(P3(s * 0.24, 1.24, -0.5), P3(s * 0.31, 1.27, -0.55), 0.024, chrome, true);
    // grips with flared ends
    o.cyl(0.026, 0.11, s * 0.36, 1.27, -0.57, '#16181d', { rz: PI / 2 + s * 0.15, ry: s * 0.25, seg: 10 });
    for (let k = 0; k < 4; k++) o.cyl(0.0275, 0.008, s * (0.325 + k * 0.022), 1.27 + s * 0.0, -0.562 - k * 0.006, '#e8322b', { rz: PI / 2 + s * 0.15, ry: s * 0.25, seg: 10 });
    o.cyl(0.032, 0.012, s * 0.418, 1.276, -0.585, chrome, { rz: PI / 2 + s * 0.15, ry: s * 0.25, seg: 10 });
  }
  o.bar(P3(-0.24, 1.24, -0.5), P3(0.24, 1.24, -0.5), 0.022, chrome, true);
  // bottom tray (where crates normally go) + rider's foot bar
  o.box(0.44, 0.02, 0.8, 0, 0.17, 0.04, dark);
  for (let k = -2; k <= 2; k++) o.box(0.015, 0.024, 0.8, k * 0.09, 0.172, 0.04, '#2e323c');
  o.bar(P3(-0.24, 0.2, -0.47), P3(0.24, 0.2, -0.47), 0.03, chrome, true);
  o.box(0.48, 0.02, 0.1, 0, 0.21, -0.5, '#3a3f4a'); // step plate
  for (let k = 0; k < 6; k++) o.box(0.46, 0.004, 0.008, 0, 0.222, -0.54 + k * 0.016, '#5a606c'); // grip ridges

  // ---- the ENGINE on the bottom tray ----
  const eng = '#30343e', alu = '#a9b0b9';
  o.box(0.26, 0.12, 0.24, 0, 0.245, 0.12, eng);                 // crank case
  o.box(0.27, 0.02, 0.25, 0, 0.31, 0.12, red);                   // gasket stripe
  for (const s of [-1, 1]) {                                     // two finned cylinders in V
    const cx = s * 0.075, rz = -s * 0.35;
    for (let i = 0; i < 6; i++) o.cyl(0.05 - (i === 5 ? 0.006 : 0), 0.008, cx + -s * i * 0.009 * Math.sin(0.35) * -1, 0.33 + i * 0.02, 0.1, alu, { seg: 10, rz });
    o.cyl(0.036, 0.13, cx - s * 0.012, 0.38, 0.1, '#6a717c', { seg: 8, rz });
    o.cyl(0.05, 0.02, cx - s * 0.04, 0.46, 0.1, chrome, { seg: 10, rz });             // head
    o.cyl(0.008, 0.03, cx - s * 0.05, 0.485, 0.1, '#f4f4f4', { seg: 6, rz });         // spark plug
    o.bar(P3(cx - s * 0.055, 0.5, 0.1), P3(0, 0.47, -0.02), 0.008, '#e8322b', true);  // plug wire
  }
  o.cyl(0.055, 0.06, 0, 0.32, 0.28, chrome, { rx: PI / 2, seg: 12 });   // air filter pod
  o.cyl(0.058, 0.012, 0, 0.32, 0.31, '#16181d', { rx: PI / 2, seg: 12 });
  for (let k = 0; k < 4; k++) o.torus(0.056, 0.06, 0, 0.32, 0.265 + k * 0.012, '#8a919b', { seg: 12 });
  o.cyl(0.045, 0.02, 0.145, 0.25, 0.08, alu, { rz: PI / 2, seg: 12 }); // pulley
  o.box(0.012, 0.025, 0.14, 0.15, 0.25, 0.04, '#16181d');               // belt
  o.box(0.1, 0.1, 0.15, -0.12, 0.25, -0.1, '#1d6fd8');                  // fuel tank
  o.box(0.102, 0.03, 0.152, -0.12, 0.25, -0.1, '#ffffff');
  o.cyl(0.022, 0.02, -0.12, 0.31, -0.08, chrome, { seg: 10 });          // filler cap
  o.box(0.06, 0.08, 0.05, 0, 0.27, -0.04, '#55606c');                    // carburettor
  // exhaust pipes → back, with heat shields and chrome tips
  for (const s of [-1, 1]) {
    o.bar(P3(s * 0.08, 0.3, 0.06), P3(s * 0.14, 0.2, -0.12), 0.034, '#b88a5a', true);
    o.bar(P3(s * 0.14, 0.2, -0.12), P3(s * 0.15, 0.2, -0.36), 0.036, chrome, true);
    o.bar(P3(s * 0.15, 0.2, -0.36), P3(s * 0.16, 0.24, -0.58), 0.042, chrome, true);
    o.cyl(0.026, 0.14, s * 0.155, 0.215, -0.28, '#3a3f4a', { rx: PI / 2, seg: 8, sx: 1.2 }); // heat shield
    o.cyl(0.03, 0.06, s * 0.16, 0.24, -0.61, chrome, { rx: PI / 2, seg: 10, rt: 1.15 });
    o.cyl(0.024, 0.062, s * 0.16, 0.24, -0.61, '#111', { rx: PI / 2, seg: 10 });
  }
  // nitro bottle on the right side
  o.cyl(0.042, 0.26, -0.335, 0.72, 0.05, '#1d6fd8', { rx: PI / 2, seg: 10 });
  o.sph(0.042, -0.335, 0.72, 0.18, '#1d6fd8', { seg: 8 });
  o.sph(0.042, -0.335, 0.72, -0.08, '#1d6fd8', { seg: 8 });
  o.cyl(0.0425, 0.05, -0.335, 0.72, 0.02, '#ffffff', { rx: PI / 2, seg: 10 });
  o.cyl(0.015, 0.05, -0.335, 0.72, 0.23, chrome, { rx: PI / 2, seg: 8 });
  o.cyl(0.02, 0.01, -0.335, 0.745, 0.23, '#e8322b', { seg: 8 });
  for (const z of [-0.04, 0.14]) o.torus(0.045, 0.1, -0.335, 0.72, z, chrome, { seg: 10 });
  o.bar(P3(-0.335, 0.72, 0.26), P3(-0.2, 0.3, 0.2), 0.012, '#1d6fd8', true); // hose to the engine
  // ---- front spoiler wing ----
  for (const s of [-1, 1]) o.bar(P3(s * 0.17, by1, bz1 - 0.02), P3(s * 0.17, 1.14, bz1 + 0.04), 0.024, dark);
  o.box(0.62, 0.02, 0.14, 0, 1.15, bz1 + 0.05, red, { rx: -0.12 });
  o.label(0.5, 0.083, 0, 1.161, bz1 + 0.05, wingDecal, { rx: PI / 2 - 0.12, ry: PI }); // readable for the rider
  for (const s of [-1, 1]) { o.box(0.008, 0.07, 0.17, s * 0.314, 1.16, bz1 + 0.05, dark); o.box(0.01, 0.015, 0.17, s * 0.314, 1.19, bz1 + 0.05, yel); }
  // front bumper + headlight housings + number plate
  o.box(0.52, 0.06, 0.05, 0, 0.18, 0.52, dark);
  o.box(0.52, 0.012, 0.052, 0, 0.21, 0.52, yel);
  for (const s of [-1, 1]) o.cyl(0.04, 0.04, s * 0.16, 0.25, 0.53, chrome, { rx: PI / 2, seg: 10 });
  o.label(0.2, 0.077, 0, 0.3, bz1 + 0.013, plate);
  // ---- wheels: forks / caster mounts ----
  const wheels = [];
  for (const [x, z, r] of [[-0.21, 0.44, 0.078], [0.21, 0.44, 0.078], [-0.24, -0.38, 0.1], [0.24, -0.38, 0.1]]) {
    o.cyl(0.025, 0.02, x, 0.155, z, chrome, { seg: 8 });
    for (const s of [-1, 1]) o.box(0.008, r + 0.06, 0.03, x + s * 0.035, r + 0.02, z, chrome);
    wheels.push({ x, z, r });
  }
  o.bar(P3(0.25, 0.5, -0.45), P3(0.3, 0.52, -1.02), 0.02, dark, true); // flag bracket
  const cartMesh = new MeshAcc().addObj(o).build(VCMAT);
  cartMesh.castShadow = true;
  body.add(cartMesh);

  // wheels as separate meshes so they can spin
  const wheelObjs = [];
  for (const w of wheels) {
    const wo = new Obj(), back = w.r > 0.09, rim = back ? red : yel;
    wo.cyl(w.r, 0.055, 0, 0, 0, '#16181d', { rz: PI / 2, seg: 14 });                       // tyre
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; wo.box(0.058, 0.012, 0.01, 0, Math.cos(a) * w.r * 0.97, Math.sin(a) * w.r * 0.97, '#2a2d35', { rx: a }); } // tread
    wo.cyl(w.r * 0.68, 0.058, 0, 0, 0, rim, { rz: PI / 2, seg: 12 });                    // rim
    wo.cyl(w.r * 0.55, 0.06, 0, 0, 0, shade(rim, -0.15), { rz: PI / 2, seg: 12 });
    for (let k = 0; k < 5; k++) wo.box(0.062, w.r * 1.05, 0.016, 0, 0, 0, '#e6e9ee', { rx: (k / 5) * PI });   // spokes
    wo.cyl(w.r * 0.2, 0.066, 0, 0, 0, chrome, { rz: PI / 2, seg: 8 });                    // hub cap
    wo.cyl(0.006, 0.12, 0, 0, 0, '#888', { rz: PI / 2, seg: 6 });                           // axle
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
  dObj.cyl(0.002, 0.08, 0, -0.04, 0, '#eeeeee', { seg: 4 });
  const die = (x, y, z, col, dot, rx, ry, rz) => {
    const d = new Obj();
    d.box(0.05, 0.05, 0.05, 0, 0, 0, col);
    for (const ax of [0, 1, 2]) for (const s of [-1, 1]) d.sph(0.028, ax === 0 ? s * 0.012 : 0, ax === 1 ? s * 0.012 : 0, ax === 2 ? s * 0.012 : 0, col, { seg: 6, sx: ax === 0 ? 0.6 : 1.02, sy: ax === 1 ? 0.6 : 1.02, sz: ax === 2 ? 0.6 : 1.02 });
    const pips = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 5: [[-1, -1], [1, 1], [0, 0], [-1, 1], [1, -1]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] };
    const F = 0.027, put = (n, map) => { for (const [a, b] of pips[n]) { const [px, py, pz] = map(a * 0.013, b * 0.013); d.sph(0.005, px, py, pz, dot, { seg: 4 }); } };
    put(5, (u, v) => [u, v, F]); put(2, (u, v) => [u, v, -F]); put(3, (u, v) => [F, v, u]); put(6, (u, v) => [-F, v, u]); put(1, (u, v) => [u, F, v]);
    dObj.put(d, x, y, z, ry, 1, rx, rz);
  };
  die(-0.014, -0.1, 0, '#ff4fa8', '#ffffff', 0.3, 0.4, 0);
  die(0.03, -0.11, 0.012, '#ffffff', '#111111', 0, -0.3, 0.4);
  dice.add(new MeshAcc().addObj(dObj).build(VCMAT));
  dice.position.set(0.2, 1.23, -0.5); body.add(dice);
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
    ro.sph(0.044, hand.x, hand.y + 0.022, hand.z - 0.006, '#1a1c22', { sx: 0.95, sy: 0.75, sz: 1.15, seg: 8 }); // glove back
    ro.box(0.035, 0.006, 0.02, hand.x, hand.y + 0.054, hand.z - 0.012, '#e8322b', { ry: s * 0.25 });       // glove stripe
    for (let k = 0; k < 4; k++) { // fingers wrapped around the grip
      const fx = hand.x + s * (-0.03 + k * 0.02);
      ro.torus(0.03, 0.32, fx, hand.y - 0.004, hand.z + 0.004, skin, { ry: PI / 2 + s * 0.25, arc: PI * 1.1, rz: 0, seg: 7, rx: 0 });
    }
    ro.sph(0.018, hand.x - s * 0.045, hand.y + 0.03, hand.z + 0.02, skin, { sz: 1.6, seg: 6, ry: s * 0.6 }); // thumb
    // legs + sneakers
    ro.bar(P3(s * 0.11, 0.24, -0.53), P3(s * 0.12, 0.95, -0.72), 0.11, '#2b3550', true);
    ro.box(0.1, 0.06, 0.22, s * 0.11, 0.26, -0.5, '#ffffff');                    // sneaker
    ro.sph(0.05, s * 0.11, 0.255, -0.4, '#ffffff', { sy: 0.6, sz: 0.9, seg: 7 }); // toe cap
    ro.box(0.104, 0.022, 0.25, s * 0.11, 0.23, -0.49, '#e8322b');                 // sole
    ro.box(0.08, 0.012, 0.1, s * 0.11, 0.294, -0.46, '#e8322b');                  // laces
    ro.cyl(0.055, 0.05, s * 0.115, 0.3, -0.6, '#2b3550', { seg: 8 });              // ankle / jeans hem
  }
  rider.add(new MeshAcc().addObj(ro).build(VCMAT));
  rider.children[0].castShadow = true;
  body.add(rider);

  // ---- NITRO bottle on the handlebar (right of the speedometer) ----
  const nitro = new T.Group();
  const no = new Obj();
  no.cyl(0.03, 0.15, 0, 0.075, 0, '#1d6fd8', { seg: 12 });
  no.sph(0.03, 0, 0.15, 0, '#1d6fd8', { sy: 0.6, seg: 10 });
  no.cyl(0.0305, 0.03, 0, 0.06, 0, '#ffffff', { seg: 12 });
  no.cyl(0.031, 0.01, 0, 0.045, 0, '#e8322b', { seg: 12 });
  no.cyl(0.012, 0.03, 0, 0.18, 0, chrome, { seg: 8 });                      // valve
  no.box(0.04, 0.008, 0.008, 0.018, 0.19, 0, '#e8322b');                     // valve lever
  no.torus(0.031, 0.12, 0, 0.02, 0, chrome, { rx: PI / 2, seg: 12 });        // clamps
  no.torus(0.031, 0.12, 0, 0.12, 0, chrome, { rx: PI / 2, seg: 12 });
  no.box(0.02, 0.05, 0.02, 0, -0.01, 0.02, dark);                            // mount to the bar
  no.bar(P3(0, 0.17, 0), P3(0.06, 0.06, 0.04), 0.008, '#1d6fd8', true);      // hose
  nitro.add(new MeshAcc().addObj(no).build(VCMAT));
  // pressure gauge facing the rider
  const gauge = new T.Group();
  const go2 = new Obj();
  go2.cyl(0.028, 0.012, 0, 0, 0, chrome, { rx: PI / 2, seg: 14 });
  go2.cyl(0.024, 0.002, 0, 0, 0.0065, '#f4f4f4', { rx: PI / 2, seg: 14 });
  go2.box(0.022, 0.006, 0.001, 0.008, 0.008, 0.0078, '#e8322b', { rz: -0.6 });  // red zone mark
  gauge.add(new MeshAcc().addObj(go2).build(VCMAT));
  const nNeedle = new T.Group();
  const nn = new T.Mesh(new T.BoxGeometry(0.003, 0.02, 0.002), new T.MeshBasicMaterial({ color: '#111111' })); nn.position.y = 0.009; nNeedle.add(nn);
  nNeedle.position.z = 0.009; gauge.add(nNeedle);
  gauge.position.set(0, 0.11, 0.032); nitro.add(gauge);
  // glow ring that pulses while the bottle is under pressure
  const nitroGlowMat = new T.MeshBasicMaterial({ color: '#4ff2ff', transparent: true, opacity: 0, depthWrite: false });
  const ring = new T.Mesh(new T.TorusGeometry(0.036, 0.007, 6, 18), nitroGlowMat); ring.rotation.x = PI / 2; ring.position.y = 0.075; nitro.add(ring);
  const ring2 = ring.clone(); ring2.position.y = 0.035; nitro.add(ring2);
  nitro.position.set(-0.17, 1.245, -0.49); nitro.rotation.set(0, PI, 0); nitro.scale.setScalar(0.8);
  body.add(nitro);
  gauge.rotation.x = -0.5;

  // basket item holder
  const items = new T.Group(); body.add(items);

  return {
    root, body, wheels: wheelObjs, nitro, nitroNeedle: nNeedle, nitroGlowMat, flames, flameMat, flameCore, underLight, needle, dice, flag, rider, items, drawDial, glow,
    eye: new V3(0, 1.66, -0.9),
  };
}
