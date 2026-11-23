// ============================================================
//  Shopping Drifters – main: renderer, physics, camera, game flow, UI
// ============================================================
const $ = (id) => document.getElementById(id);
const store_ = (() => { try { return window.localStorage; } catch (e) { return null; } })();
const loadJ = (k, d) => { try { const v = store_ && store_.getItem(k); return v ? Object.assign({}, d, JSON.parse(v)) : d; } catch (e) { return d; } };
const saveJ = (k, v) => { try { store_ && store_.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };
const settings = loadJ('sd_settings', { vol: 0.7, music: true, quality: 'mid', fov: 78, shake: true, sens: 1 });
const bests = loadJ('sd_bests', {});
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (IS_TOUCH) document.body.classList.add('touch');

// ---------- renderer / scene ----------
const canvas = $('c');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
scene.background = new T.Color('#a9d8ff');
scene.fog = new T.Fog('#e9e4d8', 28, 75);
const camera = new T.PerspectiveCamera(settings.fov, 1, 0.03, 400);
scene.add(new T.HemisphereLight('#ffffff', '#b3a58e', 1.55));
const sun = new T.DirectionalLight('#fff4e2', 1.5);
sun.castShadow = true;
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 40 });
scene.add(sun, sun.target);

function applyQuality() {
  const dpr = window.devicePixelRatio || 1;
  const q = settings.quality;
  renderer.setPixelRatio(q === 'low' ? Math.min(dpr, 1) * 0.8 : q === 'mid' ? Math.min(dpr, 1.5) : Math.min(dpr, 2));
  sun.castShadow = q !== 'low';
  const ms = q === 'high' ? 2048 : 1024;
  if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
applyQuality(); resize();
window.addEventListener('resize', resize);

// ---------- world ----------
buildProductGeos();
buildStore(scene);
buildCashiers(scene);
const cart = buildCart();
scene.add(cart.root);
const eyeObj = new T.Object3D(); cart.body.add(eyeObj);
// third-person body of the rider (hidden in first person)
const riderTP = (() => {
  const o = new Obj();
  const P = { shirt: '#2a7de1', pants: '#2b3550', skin: '#f0c29a', hair: '#3a2412', style: 'cap', capColor: '#e8322b', capBack: true, logo: '#ffd21f' };
  addTorso(o, 0, 0.78, -0.7, P, -0.42);
  addHead(o, 0, 1.6, -1.0, P);
  const m = new MeshAcc().addObj(o).build(VCMAT); m.castShadow = true; return m;
})();
cart.body.add(riderTP);

// ---------- input ----------
const input = { up: 0, down: 0, left: 0, right: 0, drift: 0 };
const KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'drift' };
const KEYMAP2 = { w: 'up', s: 'down', a: 'left', d: 'right', ' ': 'drift', arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right' };
const keyOf = (e) => KEYMAP[e.code] || KEYMAP2[(e.key || '').toLowerCase()];
window.addEventListener('keydown', (e) => {
  SFX.init();
  const k = keyOf(e);
  if (k) { input[k] = 1; e.preventDefault(); }
  if (e.repeat) return;
  const key = (e.key || '').toLowerCase();
  if (e.code === 'KeyE' || key === 'e') onInteract();
  if (e.code === 'Escape' || e.code === 'KeyP' || key === 'escape' || key === 'p') togglePause();
  if ((e.code === 'Enter' || key === 'enter') && G.state === 'checkout' && G.co && G.co.shown) nextLevel();
});
window.addEventListener('keyup', (e) => { const k = keyOf(e); if (k) input[k] = 0; });
window.addEventListener('blur', () => { for (const k in input) input[k] = 0; });

// mouse / touch look
const look = { yaw: 0, pitch: 0, last: -9 };
function addLook(dx, dy) {
  const s = 0.0025 * settings.sens;
  look.yaw = clamp(look.yaw - dx * s, -1.3, 1.3);
  look.pitch = clamp(look.pitch - dy * s, -0.7, 0.45);
  look.last = G.clock;
}
document.addEventListener('mousemove', (e) => { if (document.pointerLockElement === canvas) addLook(e.movementX || 0, e.movementY || 0); });
let touchLook = null;
canvas.addEventListener('pointerdown', (e) => {
  SFX.init();
  if (e.pointerType === 'mouse') {
    if ((G.state === 'play' || G.state === 'countdown') && canvas.requestPointerLock) { try { const p = canvas.requestPointerLock(); p && p.catch && p.catch(() => {}); } catch (err) { /* ignore */ } }
  } else { touchLook = { id: e.pointerId, x: e.clientX, y: e.clientY }; }
});
canvas.addEventListener('pointermove', (e) => { if (touchLook && e.pointerId === touchLook.id) { addLook((e.clientX - touchLook.x) * 1.6, (e.clientY - touchLook.y) * 1.6); touchLook.x = e.clientX; touchLook.y = e.clientY; } });
const endTouch = (e) => { if (touchLook && e.pointerId === touchLook.id) touchLook = null; };
canvas.addEventListener('pointerup', endTouch); canvas.addEventListener('pointercancel', endTouch);
let lockByUs = false;
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && G.state === 'play' && !lockByUs) togglePause(true);
  lockByUs = false;
});
function releaseLock() { if (document.pointerLockElement) { lockByUs = true; document.exitPointerLock(); } }

// ---------- cart physics ----------
const PHY = { MAXV: 11.2, ACCEL: 8.5, BRAKE: 15, REV: 3, REVACC: 4, GRIP: 4.2, DRIFT_GRIP: 1.2, LOCK_GRIP: 2.6, STEER: 2.55, BOOSTV: 3.5, R: 0.36 };
const C = { x: 0, z: 0, h: 0, vx: 0, vz: 0, yawRate: 0, steer: 0, fwd: 0, lat: 0, slip: 0, charge: 0, boostT: 0, puddle: false, wasPuddle: false,
  roll: 0, tip: 0, tipV: 0, tipPeak: 0, pitch: 0, lean: 0, lookYaw: 0, wheelSpin: 0, shake: 0, crashCd: 0, accel: 0, throttle: 0, diceV: 0, dice: 0 };
function resetCart(x, z, h) {
  Object.assign(C, { x, z, h, vx: 0, vz: 0, yawRate: 0, steer: 0, fwd: 0, lat: 0, slip: 0, charge: 0, boostT: 0, roll: 0, tip: 0, tipV: 0, tipPeak: 0, pitch: 0, lean: 0, lookYaw: 0, shake: 0 });
  look.yaw = look.pitch = 0;
}
function physicsStep(dt, ctl) {
  const fx = Math.sin(C.h), fz = Math.cos(C.h), rx = -Math.cos(C.h), rz = Math.sin(C.h);
  let fwd = C.vx * fx + C.vz * fz, lat = C.vx * rx + C.vz * rz;
  const fwd0 = fwd;
  // space = lock the wheels straight: no steering, lots of grip → pulls you out of a drift
  const lock = ctl && input.drift;
  const up = ctl ? input.up : 0, down = ctl ? input.down : 0, steerIn = ctl && !lock ? input.right - input.left : 0;
  C.throttle = up;
  C.steer = damp(C.steer, steerIn, 9, dt);
  const boosting = C.boostT > 0;
  const maxV = PHY.MAXV + (boosting ? PHY.BOOSTV : 0);
  if (up) {
    if (fwd < 0) fwd = Math.min(0, fwd + PHY.BRAKE * dt);
    else if (fwd < maxV) fwd += PHY.ACCEL * Math.pow(clamp(1 - fwd / maxV, 0, 1), 0.55) * dt;
  }
  if (down) {
    if (fwd > 0.25) fwd = Math.max(0, fwd - PHY.BRAKE * dt);
    else fwd = Math.max(-PHY.REV, fwd - PHY.REVACC * dt);
  }
  if (!up && !down) fwd -= Math.sign(fwd) * Math.min(Math.abs(fwd), (0.3 + Math.abs(fwd) * 0.1) * dt);
  if (boosting) { C.boostT -= dt; fwd = Math.min(maxV, fwd + 14 * dt); }
  if (fwd > maxV) fwd = damp(fwd, maxV, 1.5, dt);
  // steering
  const hand = !lock && Math.abs(fwd) > 2.5; // the cart always drives drifty above walking speed
  const sp = Math.abs(fwd);
  const sf = clamp(sp / 2.2, 0, 1) * (1 - 0.28 * clamp(sp / PHY.MAXV, 0, 1));
  const target = -C.steer * PHY.STEER * sf * (fwd < -0.1 ? -1 : 1) * (hand ? 1.35 : 1) * (C.puddle ? 0.75 : 1);
  C.yawRate = damp(C.yawRate, lock ? 0 : target, lock ? 4 : hand ? 5 : 8, dt);
  C.h += C.yawRate * dt;
  // grip: throttle/brake act along the heading, then the direction of travel is pulled towards
  // the (new) heading. The speed is mostly kept → slides and drifts keep their momentum.
  let vx = fx * fwd + rx * lat, vz = fz * fwd + rz * lat;
  let spd = Math.hypot(vx, vz);
  if (spd > 0.05) {
    const th = C.h + (fwd < 0 ? PI : 0);
    let grip = lock ? PHY.LOCK_GRIP : hand ? PHY.DRIFT_GRIP : PHY.GRIP;
    if (C.puddle) grip *= 0.2;
    let d = angDiff(Math.atan2(vx, vz), th) * Math.exp(-grip * dt); // remaining slip angle
    const maxSlip = C.puddle ? 1.3 : hand || lock ? 0.95 : 0.7;
    d = clamp(d, -maxSlip, maxSlip);
    spd -= spd * Math.abs(d) * (hand ? 0.22 : 0.35) * dt;
    if (spd > maxV) spd = damp(spd, maxV, 2.5, dt);
    const va = th - d;
    vx = Math.sin(va) * spd; vz = Math.cos(va) * spd;
  }
  C.vx = vx; C.vz = vz;
  C.x += C.vx * dt; C.z += C.vz * dt;
  const nfx = Math.sin(C.h), nfz = Math.cos(C.h);
  C.fwd = vx * nfx + vz * nfz; C.lat = vx * -nfz + vz * nfx;
  C.accel = (C.fwd - fwd0) / dt;
  C.slip = Math.atan2(Math.abs(C.lat), Math.max(Math.abs(C.fwd), 0.5));
  // almost tipping over: locked wheels while sliding sideways → the cart rolls onto two wheels
  // in the slide direction, then springs back down (spring + damper)
  const tipT = lock && spd > 3 ? clamp(C.lat * 0.06, -0.36, 0.36) : 0;
  C.tipV += (tipT - C.tip) * 38 * dt; C.tipV *= Math.exp(-4.5 * dt); C.tip += C.tipV * dt;
  C.tipPeak = Math.max(C.tipPeak, Math.abs(C.tip));
  if (C.tipPeak > 0.2 && Math.abs(C.tip) < 0.03 && Math.abs(C.tipV) > 0.4) { // lands back on 4 wheels
    SFX.crash(0.25 + C.tipPeak * 0.6); C.shake = Math.min(1, C.shake + C.tipPeak); spawnPuffs(4, '#ffffff'); C.tipPeak = 0;
  }
  if (Math.abs(C.tip) < 0.05 && Math.abs(C.tipV) < 0.1) C.tipPeak = 0;
  // mini turbo: drift long enough, then straighten out (by itself or with space) for a boost
  if (hand && C.slip > 0.25 && sp > 4) C.charge += dt;
  else if (C.slip < 0.12 || sp < 2) {
    if (C.charge > 1.0 && sp >= 2) { C.boostT = 0.55 + Math.min(C.charge, 2.5) * 0.3; SFX.boost(); flash($('turbo'), 900); spawnPuffs(4, '#9ff6ff'); }
    C.charge = 0;
  }
  collide(dt);
}
const _hit = { n: 0, power: 0 };
function collide(dt) {
  C.crashCd -= dt;
  const fx = Math.sin(C.h), fz = Math.cos(C.h);
  let impact = 0;
  for (const off of [0.27, -0.3]) {
    let cx = C.x + fx * off, cz = C.z + fz * off;
    const r = PHY.R;
    const resolve = (nx, nz, pen) => {
      C.x += nx * pen; C.z += nz * pen; cx += nx * pen; cz += nz * pen;
      const vn = C.vx * nx + C.vz * nz;
      if (vn < 0) {
        C.vx -= 1.4 * vn * nx; C.vz -= 1.4 * vn * nz; // restitution ~0.4
        C.vx *= 0.93; C.vz *= 0.93;
        impact = Math.max(impact, -vn);
      }
    };
    const boxes = (list) => {
      for (const b of list) {
        if (cx < b.x0 - r || cx > b.x1 + r || cz < b.z0 - r || cz > b.z1 + r) continue;
        const px = clamp(cx, b.x0, b.x1), pz = clamp(cz, b.z0, b.z1);
        let dx = cx - px, dz = cz - pz; const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-9) { const d = Math.sqrt(d2); resolve(dx / d, dz / d, r - d); }
        else { // center inside: push out along the shortest axis
          const l = cx - b.x0, rr = b.x1 - cx, t = cz - b.z0, bb = b.z1 - cz, m = Math.min(l, rr, t, bb);
          if (m === l) resolve(-1, 0, l + r); else if (m === rr) resolve(1, 0, rr + r); else if (m === t) resolve(0, -1, t + r); else resolve(0, 1, bb + r);
        }
      }
    };
    boxes(COLS); boxes(DYN_BOXES);
    for (const c of DYN_CIRCLES) {
      const dx = cx - c.x, dz = cz - c.z, d = Math.hypot(dx, dz), rr = r + c.r;
      if (d < rr && d > 1e-6) { resolve(dx / d, dz / d, rr - d); bumpShopper(c); }
    }
  }
  if (impact > 1.6 && C.crashCd <= 0) {
    C.crashCd = 0.25;
    SFX.crash(impact / 7);
    C.shake = Math.min(1, C.shake + impact / 8);
    C.yawRate += (Math.random() - 0.5) * impact * 0.25;
    spawnPuffs(Math.min(8, 2 + impact), '#ffffff');
  }
}
function bumpShopper(c) {
  for (const sh of HZ.shoppers) if (sh.col === c && sh.bump <= 0) { sh.bump = 1.2; SFX.hey(); toast(pick(['Hey! Pass doch auf!', 'Rowdy!', 'Unverschämtheit!', 'Mein Joghurt!!'])); }
}

// ---------- effects: puffs + skid marks ----------
const puffs = [];
const puffGeo = new T.IcosahedronGeometry(1, 0);
for (let i = 0; i < 40; i++) {
  const m = new T.Mesh(puffGeo, new T.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  m.visible = false; scene.add(m); puffs.push({ m, life: 0, max: 1, vx: 0, vy: 0, vz: 0, s: 0.1 });
}
let puffI = 0;
function spawnPuff(x, y, z, vx, vy, vz, life, s, col) {
  const p = puffs[puffI++ % puffs.length];
  p.m.position.set(x, y, z); p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.s = s;
  p.m.material.color.set(col); p.m.visible = true;
}
function spawnPuffs(n, col) {
  for (let i = 0; i < n; i++) spawnPuff(C.x + R(-0.3, 0.3), 0.2, C.z + R(-0.3, 0.3), R(-1, 1), R(0.5, 1.5), R(-1, 1), R(0.4, 0.8), R(0.06, 0.12), col);
}
function updatePuffs(dt) {
  for (const p of puffs) {
    if (p.life <= 0) continue;
    p.life -= dt;
    if (p.life <= 0) { p.m.visible = false; continue; }
    const k = p.life / p.max;
    p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
    p.m.scale.setScalar(p.s * (1.8 - k));
    p.m.material.opacity = k * 0.6;
  }
}
const SKID_N = 900;
const skidPos = new Float32Array(SKID_N * 6 * 3);
const skidGeo = new T.BufferGeometry(); skidGeo.setAttribute('position', new T.BufferAttribute(skidPos, 3));
const skid = new T.Mesh(skidGeo, new T.MeshBasicMaterial({ color: '#2a2a2a', transparent: true, opacity: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
skid.frustumCulled = false; scene.add(skid);
let skidI = 0; const skidLast = [null, null];
function clearSkids() { skidPos.fill(0); skidGeo.attributes.position.needsUpdate = true; skidLast[0] = skidLast[1] = null; }
function updateSkids(marking) {
  const fx = Math.sin(C.h), fz = Math.cos(C.h), rx = -Math.cos(C.h), rz = Math.sin(C.h);
  [-1, 1].forEach((s, w) => {
    if (!marking) { skidLast[w] = null; return; }
    const px = C.x - fx * 0.38 + rx * s * 0.24, pz = C.z - fz * 0.38 + rz * s * 0.24;
    const L = skidLast[w];
    if (!L) { skidLast[w] = [px, pz]; return; }
    const dx = px - L[0], dz = pz - L[1], d = Math.hypot(dx, dz);
    if (d < 0.12) return;
    const nx = (-dz / d) * 0.03, nz = (dx / d) * 0.03, y = 0.008, o = (skidI++ % SKID_N) * 18;
    const v = [L[0] - nx, y, L[1] - nz, L[0] + nx, y, L[1] + nz, px + nx, y, pz + nz, L[0] - nx, y, L[1] - nz, px + nx, y, pz + nz, px - nx, y, pz - nz];
    for (let i = 0; i < 18; i++) skidPos[o + i] = v[i];
    skidGeo.attributes.position.needsUpdate = true;
    skidLast[w] = [px, pz];
  });
}

// ---------- pickup markers ----------
const markerMat = new T.MeshBasicMaterial({ color: '#ffd21f' });
const frameMat = new T.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.3, depthWrite: false, side: T.DoubleSide });
const edgeMat = new T.MeshBasicMaterial({ color: '#ffd21f' });
function makeMarker(sp) {
  const g = new T.Group();
  const arrow = new T.Group();
  const cone = new T.Mesh(new T.ConeGeometry(0.22, 0.4, 4), markerMat); cone.rotation.x = PI; arrow.add(cone);
  const stem = new T.Mesh(new T.BoxGeometry(0.12, 0.3, 0.12), markerMat); stem.position.y = 0.32; arrow.add(stem);
  arrow.position.set(sp.mx + sp.nx * 0.9, 2.3, sp.mz + sp.nz * 0.9);
  g.add(arrow);
  const len = Math.hypot(sp.bx - sp.ax, sp.bz - sp.az) + 0.3;
  const frame = new T.Mesh(new T.PlaneGeometry(len, 1.95), frameMat);
  frame.position.set(sp.mx + sp.nx * 0.03, 1.0, sp.mz + sp.nz * 0.03);
  frame.rotation.y = Math.atan2(sp.nx, sp.nz);
  frame.renderOrder = 3;
  g.add(frame);
  // bright edges around the shelf block
  for (const [w, h, x, y] of [[len, 0.05, 0, 0.975], [len, 0.05, 0, -0.975], [0.05, 1.95, len / 2, 0], [0.05, 1.95, -len / 2, 0]]) {
    const e = new T.Mesh(new T.PlaneGeometry(w, h), edgeMat); e.position.set(x, y, 0.01); frame.add(e);
    const e2 = e.clone(); e2.rotation.y = PI; e2.position.z = -0.01; frame.add(e2);
  }
  g.visible = false; scene.add(g);
  return { g, arrow, frame, vis: 0 };
}

// ---------- game state ----------
const G = { state: 'menu', level: 1, time: 0, clock: 0, list: [], got: new Set(), markers: {}, near: null, slowT: 0, sinceGo: 0, cfg: levelCfg(1),
  anim: null, cine: null, lane: null, scan: null, items: [], total: 0, prev: 'menu', pausedFrom: null };

function pickList(level) {
  rng = mulberry32(777 + level * 131);
  const cfg = levelCfg(level);
  const pool = shuffle(PRODUCTS.slice());
  const perSec = {}, out = [];
  for (const p of pool) {
    if (out.length >= cfg.items) break;
    if ((perSec[p.section] || 0) >= 2) continue;
    if (level === 1 && p.section === 'Obst & Gemüse' && out.some((q) => q.section === p.section)) continue;
    perSec[p.section] = (perSec[p.section] || 0) + 1;
    out.push(p);
  }
  return out;
}
function setupLevel(level) {
  G.level = level; G.cfg = levelCfg(level);
  G.list = pickList(level); G.got = new Set(); G.time = 0; G.slowT = 0; G.near = null; G.total = 0;
  for (const k in G.markers) scene.remove(G.markers[k].g);
  G.markers = {};
  for (const p of G.list) G.markers[p.id] = makeMarker(SPOTS[p.id]);
  for (const it of G.items) it.mesh.parent && it.mesh.parent.remove(it.mesh);
  G.items = [];
  setupHazards(scene, level);
  clearSkids();
  resetCart(START.x, START.z, START.h);
  cart.drawDial(G.cfg.minKmh);
  for (const l of LANES) { l.lamp.color.set('#ff6a6a'); drawScreen(l, '', ''); }
  renderList();
  $('lvl').textContent = 'LEVEL ' + level;
}

// ---------- UI helpers ----------
function show(id, on = true) { $(id).classList.toggle('hidden', !on); }
let toastT = 0;
function toast(msg, ms = 1800) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
function flash(el, ms) { el.classList.add('show'); setTimeout(() => el.classList.remove('show'), ms); }
const fmt = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return String(m).padStart(2, '0') + ':' + s.toFixed(2).padStart(5, '0'); };
function renderList() {
  const ul = $('items'); ul.innerHTML = '';
  for (const p of G.list) {
    const li = document.createElement('li'); li.id = 'li_' + p.id;
    li.innerHTML = `<span class="bx"></span><span>${p.e}</span><span>${p.n}</span>`;
    if (G.got.has(p.id)) li.classList.add('got');
    ul.appendChild(li);
  }
  $('listCount').textContent = G.got.size + '/' + G.list.length;
  $('listFoot').textContent = G.got.size === G.list.length ? '➜ Ab zur Kasse! 🛒' : '';
}
function setCine(on) { document.body.classList.toggle('cine', on); }
function setPrompt(html, warn = false) {
  const p = $('prompt');
  if (!html) { p.classList.add('hidden'); return; }
  if (p.innerHTML !== html) p.innerHTML = html;
  p.classList.toggle('warn', warn); p.classList.remove('hidden');
}
function drawScreen(lane, line1, line2) {
  const g = lane.screen.userData.ctx;
  g.fillStyle = '#0d2a1a'; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#5dff9a'; g.font = `700 26px ${FONT}`; g.textAlign = 'left';
  g.fillText(line1, 12, 44); g.font = `900 34px ${FONT}`; g.fillText(line2, 12, 100);
  lane.screen.needsUpdate = true;
}

// ---------- game flow ----------
function showMenu() {
  G.state = 'menu'; releaseLock();
  ['hud', 'pause', 'dead', 'result', 'worlds', 'settings', 'credits', 'count'].forEach((id) => show(id, false));
  show('menu'); setCine(false); setPrompt(null);
  setupLevel(1);
  resetCart(MENU_POS.x, MENU_POS.z, PI / 2);
}
function startGame() {
  ['menu', 'worlds'].forEach((id) => show(id, false));
  setupLevel(1);
  beginIntro(true);
}
// camera keyframes: [time, pos, lookAt]
function beginIntro(full) {
  G.state = 'intro'; setCine(true); show('hud', false); show('dead', false); show('result', false);
  const s = new V3(START.x, 0, START.z);
  const kf = full ? [
    [0, new V3(-3, 5.5, -17), new V3(0, 2.5, 0)],
    [1.8, new V3(0, 2.4, -3.5), new V3(0, 1.6, 3)],
    [3.0, new V3(0.8, 1.9, s.z - 1.8), new V3(0, 1.0, s.z + 2)],
    [3.8, 'eye'],
  ] : [
    [0, new V3(1.6, 2.2, s.z - 2.4), new V3(0, 1.0, s.z + 1)],
    [1.1, 'eye'],
  ];
  G.cine = { t: 0, kf, full, doorsDone: false };
  if (full) SFX.door();
}
function beginCountdown() {
  G.state = 'countdown'; G.cdT = 3.999; G.cdShown = 4;
  show('hud');
}
function go() {
  G.state = 'play'; G.sinceGo = 0; setCine(false);
  const c = $('count'); c.textContent = 'LOS!'; c.className = 'go'; void c.offsetWidth; c.className = 'go anim';
  SFX.count(0);
  setTimeout(() => { if (G.state !== 'countdown') show('count', false); }, 900);
}
function togglePause(force) {
  if (G.state === 'play' || G.state === 'countdown') {
    G.pausedFrom = G.state; G.state = 'paused'; releaseLock(); show('pause');
    for (const k in input) input[k] = 0;
  } else if (G.state === 'paused' && force !== true) {
    if (!$('settings').classList.contains('hidden')) return;
    G.state = G.pausedFrom; show('pause', false);
  }
}
function die() {
  G.state = 'dead'; releaseLock(); SFX.lose();
  $('deadMsg').textContent = pick(['Dein Einkaufswagen ist eingeschlafen.', 'Der Motor ist abgesoffen.', 'Selbst die Oma mit Rollator war schneller.', 'Der Wagen hat sich gelangweilt.']) + ` (Mindestens ${G.cfg.minKmh} km/h!)`;
  show('dead'); show('hud', false); setPrompt(null); show('slow', false);
}
function retry() { show('dead', false); show('pause', false); setupLevel(G.level); beginIntro(false); }
function onInteract() {
  if (G.state !== 'play' || !G.near) return;
  const sp = Math.abs(C.fwd);
  if (sp > 3.6) { SFX.nope(); toast('Zu schnell! Erst bremsen (S)'); return; }
  pickup(G.near);
}
function pickup(id) {
  const p = PROD[id], sp = SPOTS[id];
  G.got.add(id);
  G.slowT = -2; // a bit of grace after stopping for a product
  SFX.pickup();
  const near = spotDist(sp, C.x, C.z);
  const mesh = new T.Mesh(p.geo, VCMAT); mesh.castShadow = true;
  const s = clamp(0.24 / Math.max(p.w, p.h, p.d), 0.55, 1.25);
  mesh.scale.setScalar(s);
  scene.add(mesh);
  const i = G.items.length;
  const slot = new V3(((i % 3) - 1) * 0.14, 0.575 + Math.floor(i / 9) * 0.16, -0.2 + (Math.floor(i / 3) % 3) * 0.24);
  const it = { id, mesh, t: 0, from: new V3(near.px - sp.nx * 0.2, sp.y + 0.05, near.pz - sp.nz * 0.2), slot, ry: R(-0.6, 0.6), done: false };
  G.items.push(it);
  const m = G.markers[id]; if (m) m.g.visible = false;
  renderList();
  const li = $('li_' + id); if (li) li.classList.add('pop');
  if (G.got.size === G.list.length) {
    toast('Alles da! Ab zur Kasse! 🛒', 2500); SFX.ding();
    for (const l of LANES) l.lamp.color.set('#5dff7a');
  } else toast(p.e + ' ' + p.n + ' eingeladen!', 1200);
}
function updateItems(dt) {
  const tmp = new V3();
  for (const it of G.items) {
    if (it.done || it.scan) continue;
    it.t += dt / 0.5;
    if (it.t >= 1) {
      it.done = true; cart.items.add(it.mesh);
      it.mesh.position.copy(it.slot); it.mesh.rotation.set(0, it.ry, 0);
      SFX.drop(); continue;
    }
    tmp.copy(it.slot); cart.body.localToWorld(tmp);
    const k = smooth(it.t);
    it.mesh.position.lerpVectors(it.from, tmp, k);
    it.mesh.position.y += Math.sin(k * PI) * 0.7;
    it.mesh.rotation.set(k * TAU, C.h + it.ry, 0);
  }
}

// ---------- checkout ----------
function startCheckout(lane) {
  G.state = 'checkout'; releaseLock(); setPrompt(null); show('slow', false);
  G.lane = lane;
  const best = bests['L' + G.level];
  G.isRecord = !best || G.time < best;
  if (G.isRecord) { bests['L' + G.level] = G.time; saveJ('sd_bests', bests); }
  G.co = { t: 0, from: { x: C.x, z: C.z, h: C.h }, h: Math.cos(C.h) < 0 ? PI : 0, camFrom: camera.position.clone(), camQ: camera.quaternion.clone(), next: 0.9, idx: 0, shown: false };
  G.total = 0;
  setCine(true);
  SFX.win();
}
function updateCheckout(dt) {
  const co = G.co, lane = G.lane;
  co.t += dt;
  // roll the cart into the lane and stop
  const k = smooth(Math.min(1, co.t / 1.1));
  C.x = lerp(co.from.x, lane.cx + 1.2, k); C.z = lerp(co.from.z, 7.6, k);
  C.h = co.from.h + angDiff(co.from.h, co.h) * k;
  C.vx = C.vz = C.fwd = 0;
  // items: cart → belt → scanner → bag
  if (co.t > co.next && co.idx < G.items.length) {
    const it = G.items[co.idx++];
    const wp = new V3(); it.mesh.getWorldPosition(wp);
    scene.attach(it.mesh);
    it.scan = { t: 0, from: wp, beeped: false };
    co.next = co.t + 0.55;
  }
  const bx = lane.cx + 0.3;
  for (const it of G.items) {
    if (!it.scan) continue;
    const s = it.scan; s.t += dt;
    const m = it.mesh;
    if (s.t < 0.4) { const q = smooth(s.t / 0.4); m.position.lerpVectors(s.from, new V3(bx, 0.95, 8.6), q); m.position.y += Math.sin(q * PI) * 0.5; }
    else if (s.t < 1.3) { const q = (s.t - 0.4) / 0.9; m.position.set(bx, 0.95, lerp(8.6, 5.75, q)); m.rotation.set(0, PI / 2, 0); }
    else if (s.t < 1.75) {
      if (!s.beeped) { s.beeped = true; SFX.scan(); const p = PROD[it.id]; G.total += p.price; drawScreen(lane, p.n + '  ' + p.price.toFixed(2) + ' €', 'Σ ' + G.total.toFixed(2) + ' €'); lane.cashier.arms[1].rotation.x = -1.4; }
      const q = (s.t - 1.3) / 0.45; m.position.set(bx, 0.95, lerp(5.75, 4.4, q)); lane.cashier.arms[1].rotation.x = lerp(-1.4, -0.8, q);
    } else { const q = Math.min(1, (s.t - 1.75) / 0.3); m.scale.setScalar(Math.max(0.001, (1 - q) * m.scale.x)); if (q >= 1) m.visible = false; }
  }
  if (co.t > 1.3 && !co.shown) {
    co.shown = true;
    show('result');
    $('resT').textContent = G.isRecord ? 'Einkauf erledigt! 🏆' : 'Einkauf erledigt!';
  }
  if (co.shown) {
    const best = bests['L' + G.level];
    $('resS').innerHTML = `Level ${G.level} · Zeit <b>${fmt(G.time)}</b>${G.isRecord ? ' <span class="rec">NEUER REKORD!</span>' : ' · Bestzeit ' + fmt(best)}<br>${G.list.length} Produkte · Summe <b>${G.total.toFixed(2)} €</b>`;
  }
}
function nextLevel() {
  if (G.state !== 'checkout') return;
  show('result', false);
  for (const it of G.items) it.mesh.parent && it.mesh.parent.remove(it.mesh);
  G.items = [];
  // drive back to the start in a cutscene
  const lx = C.x;
  const pts = [[lx, C.z], [lx, 4.6], [lx + 1.4, 2.5], [-10, 2.5], [-7.2, 3.6], [-3.2, 3.0], [-1.4, 2.0], [-0.2, 2.5], [START.x, START.z]].map(([x, z]) => new V3(x, 0, z));
  G.state = 'outro';
  G.out = { curve: new T.CatmullRomCurve3(pts, false, 'centripetal', 0.5), t: 0, dur: 4.2 };
  setCine(true);
}
function updateOutro(dt) {
  const o = G.out;
  o.t += dt;
  const u = clamp(o.t / o.dur, 0, 1), k = smooth(u);
  const p = o.curve.getPointAt(k), tg = o.curve.getTangentAt(Math.min(0.999, k + 0.001));
  const pv = new V3(C.x, 0, C.z);
  C.fwd = pv.distanceTo(p) / Math.max(dt, 1e-4);
  C.x = p.x; C.z = p.z;
  const th = Math.atan2(tg.x, tg.z);
  C.yawRate = angDiff(C.h, th) / Math.max(dt, 1e-4) * 0.05;
  C.h = u < 0.97 ? th : C.h + angDiff(C.h, START.h) * 0.2;
  C.throttle = 1;
  if (u >= 1) { setupLevel(G.level + 1); beginIntro(false); }
}

// ---------- camera ----------
const _v = new V3(), _v2 = new V3(), _q2 = new T.Quaternion(), _up = new V3(0, 1, 0);
function fpCamera(dt) {
  const sp = Math.abs(C.fwd);
  // rider leans into the curve, head looks where we slide
  const leanT = clamp(C.steer * clamp(sp / 4, 0, 1) + C.yawRate * -0.15, -1.2, 1.2);
  C.lean = damp(C.lean, leanT, 5, dt);
  const slipDir = Math.atan2(C.lat, Math.max(Math.abs(C.fwd), 1));
  C.lookYaw = damp(C.lookYaw, clamp(-slipDir * 0.4, -0.3, 0.3), 4, dt);
  if (G.clock - look.last > 0.9) { look.yaw = damp(look.yaw, 0, 2.5, dt); look.pitch = damp(look.pitch, 0, 2.5, dt); }
  eyeObj.position.set(cart.eye.x - C.lean * 0.09, cart.eye.y + Math.sin(G.clock * 18) * 0.004 * clamp(sp / 8, 0, 1), cart.eye.z);
  eyeObj.rotation.set(-0.27 + look.pitch, PI + C.lookYaw + look.yaw, -C.lean * 0.11, 'YXZ');
  eyeObj.updateWorldMatrix(true, false);
  eyeObj.getWorldPosition(camera.position);
  eyeObj.getWorldQuaternion(camera.quaternion);
  if (C.shake > 0 && settings.shake) {
    camera.position.x += (Math.random() - 0.5) * C.shake * 0.06;
    camera.position.y += (Math.random() - 0.5) * C.shake * 0.06;
  }
  C.shake = Math.max(0, C.shake - dt * 2.5);
  const fov = settings.fov + clamp(sp / PHY.MAXV, 0, 1.4) * 7 + (C.boostT > 0 ? 8 : 0);
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = damp(camera.fov, fov, 4, dt); camera.updateProjectionMatrix(); }
  cart.rider.visible = true; riderTP.visible = false;
}
function setCamLook(pos, target) { camera.position.copy(pos); camera.lookAt(target); }
function thirdPerson(on) { riderTP.visible = on; cart.rider.visible = true; }
function fpPose() { // first person pose (without updating smoothing)
  fpCamera(0); return { p: camera.position.clone(), q: camera.quaternion.clone() };
}
function updateIntro(dt) {
  const c = G.cine; c.t += dt;
  const kf = c.kf;
  // doors
  if (c.full) STORE_ANIM.doors.open = damp(STORE_ANIM.doors.open, c.t > 0.4 && c.t < 3.0 ? 1 : 0, 3, dt);
  let i = 0; while (i < kf.length - 2 && c.t > kf[i + 1][0]) i++;
  const a = kf[i], b = kf[i + 1];
  const u = smooth(clamp((c.t - a[0]) / (b[0] - a[0]), 0, 1));
  if (b[1] === 'eye') {
    const fp = fpPose();
    thirdPerson(u < 0.85);
    _v.copy(a[1]).lerp(fp.p, u);
    camera.position.copy(_v); camera.lookAt(a[2]);
    camera.quaternion.slerp(fp.q, u);
    camera.position.copy(_v);
  } else {
    thirdPerson(true);
    _v.copy(a[1]).lerp(b[1], u); _v2.copy(a[2]).lerp(b[2], u);
    setCamLook(_v, _v2);
  }
  if (camera.fov !== settings.fov) { camera.fov = settings.fov; camera.updateProjectionMatrix(); }
  if (c.t >= kf[kf.length - 1][0]) beginCountdown();
}

// ---------- visuals of the cart ----------
function updateCartVisual(dt, engineOn) {
  cart.root.position.set(C.x, 0, C.z);
  cart.root.rotation.y = C.h;
  const sp = Math.abs(C.fwd);
  const rollT = clamp(C.yawRate * C.fwd * 0.011, -0.12, 0.12) + (C.slip > 0.3 && sp > 5 ? Math.sign(C.yawRate * C.fwd) * 0.06 : 0);
  C.roll = damp(C.roll, rollT, 6, dt);
  C.pitch = damp(C.pitch, clamp(-C.accel * 0.004, -0.04, 0.05), 6, dt);
  cart.body.rotation.set(C.pitch, 0, C.roll + C.tip);
  cart.body.position.y = Math.abs(Math.sin(G.clock * 25)) * 0.006 * clamp(sp / 6, 0, 1) + Math.abs(C.roll) * 0.25 + Math.abs(C.tip) * 0.24;
  C.wheelSpin += (C.fwd * dt) / 0.08;
  for (const w of cart.wheels) w.rotation.x = C.wheelSpin;
  // flames
  const blue = C.boostT > 0 || C.charge > 1.0;
  const fl = engineOn ? (C.boostT > 0 ? 1.6 : C.throttle ? 1 : 0.25) : 0;
  cart.flameMat.color.set(blue ? '#3aa8ff' : '#ff8a1f'); cart.flameCore.color.set(blue ? '#d8f6ff' : '#fff3a0');
  for (const f of cart.flames) { const s = fl * (0.8 + Math.random() * 0.4); f.visible = s > 0.05; f.scale.set(1, 1, Math.max(0.01, s)); }
  // speedometer needle (canvas angle a → rotation)
  const kmh = Math.min(CART_MAX_KMH, sp * 3.6);
  const a = PI * 0.75 + PI * 1.5 * (kmh / CART_MAX_KMH);
  cart.needle.rotation.z = -a - PI / 2 + (Math.random() - 0.5) * 0.02 * (engineOn ? 1 : 0);
  // fuzzy dice swing
  C.diceV += (-(C.yawRate * 0.5) - C.dice * 20) * dt; C.diceV *= Math.exp(-2 * dt); C.dice += C.diceV * dt;
  cart.dice.rotation.z = C.dice; cart.dice.rotation.x = clamp(C.accel * 0.02, -0.5, 0.5);
  cart.flag.rotation.y = PI / 2 + Math.sin(G.clock * 9) * 0.15 * (0.3 + sp / 8);
  cart.underLight.intensity = 3 + Math.sin(G.clock * 4) * 0.6 + (blue ? 2 : 0);
}

// ---------- main play update ----------
function updatePlay(dt) {
  G.time += dt; G.sinceGo += dt;
  const sp = Math.abs(C.fwd);
  // puddles
  C.puddle = puddleAt(C.x, C.z);
  if (C.puddle && !C.wasPuddle && sp > 2) { SFX.splash(); for (let i = 0; i < 6; i++) spawnPuff(C.x + R(-0.4, 0.4), 0.1, C.z + R(-0.4, 0.4), R(-1.5, 1.5), R(1, 2.5), R(-1.5, 1.5), 0.5, 0.05, '#8fd3ff'); }
  C.wasPuddle = C.puddle;
  updateSkids((C.slip > 0.22 && sp > 3.5) || (input.down && sp > 6) || (C.puddle && sp > 3));
  if (C.slip > 0.35 && sp > 5 && Math.random() < 0.3) spawnPuff(C.x - Math.sin(C.h) * 0.4, 0.1, C.z - Math.cos(C.h) * 0.4, R(-0.3, 0.3), R(0.3, 0.8), R(-0.3, 0.3), 0.6, 0.08, '#e6e6e6');
  // nearest wanted product
  let near = null, nd = 1e9, anyClose = false;
  for (const p of G.list) {
    if (G.got.has(p.id)) continue;
    const sp_ = SPOTS[p.id], d = spotDist(sp_, C.x, C.z).d;
    if (d < 2.5 && d < nd) { nd = d; near = p.id; }
    if (d < 3.6) anyClose = true;
    const m = G.markers[p.id];
    const md = Math.hypot(C.x - sp_.mx, C.z - sp_.mz);
    m.vis = damp(m.vis, md < G.cfg.reveal ? 1 : 0, 6, dt);
    m.g.visible = m.vis > 0.02;
    m.arrow.position.y = 2.3 + Math.sin(G.clock * 4) * 0.12; m.arrow.rotation.y += dt * 2.5;
    m.arrow.scale.setScalar(m.vis);
  }
  frameMat.opacity = 0.3 + Math.sin(G.clock * 6) * 0.12;
  if (near !== G.near) {
    if (G.near) { const li = $('li_' + G.near); li && li.classList.remove('near'); }
    if (near) { const li = $('li_' + near); li && li.classList.add('near'); }
    G.near = near;
  }
  if (near) {
    const p = PROD[near];
    if (sp > 3.6) setPrompt(`Zu schnell für ${p.e} ${p.n}! Bremsen <kbd>S</kbd>`, true);
    else setPrompt(`<kbd>E</kbd> ${p.e} ${p.n} einladen`);
  } else setPrompt(null);
  // minimum speed rule
  const kmh = sp * 3.6;
  const busy = G.items.some((it) => !it.done);
  const exempt = anyClose || busy || G.sinceGo < 3;
  if (kmh < G.cfg.minKmh && !exempt) G.slowT += dt; else G.slowT = Math.max(0, G.slowT - dt * 3);
  const grace = 1.5, total = 5;
  if (G.slowT > grace) {
    const left = total - (G.slowT - grace);
    const n = Math.ceil(left);
    if ($('slowN').textContent !== String(n)) { $('slowN').textContent = n; SFX.tick(); }
    $('slowS').textContent = `Gib Gas! Mindestens ${G.cfg.minKmh} km/h`;
    show('slow');
    $('vignette').style.boxShadow = `inset 0 0 ${120 + (1 - left / total) * 120}px rgba(255,0,0,${0.25 + (1 - left / total) * 0.4})`;
    if (left <= 0) { die(); return; }
  } else { show('slow', false); $('vignette').style.boxShadow = 'none'; }
  // checkout lanes
  for (const l of LANES) {
    if (Math.abs(C.x - l.x) < 2.2 && C.z > l.z0 + 1 && C.z < l.z1) {
      if (G.got.size === G.list.length) { startCheckout(l); return; }
      if (!G.nagT || G.clock - G.nagT > 3) { G.nagT = G.clock; toast('Erst alles von der Liste holen!'); SFX.nope(); }
    }
  }
  updateHazards(dt, G.clock, C.x, C.z, sp, (tw) => { SFX.rumble(); toast('Achtung, das Regal kippt!', 1500); C.shake = 0.6; });
}

// ---------- menu camera ----------
const MENU_POS = { x: 0, z: 29 };
function updateMenuCam(dt) {
  thirdPerson(true);
  const a = G.clock * 0.18;
  _v.set(MENU_POS.x + Math.sin(a) * 3.0, 1.3 + Math.sin(G.clock * 0.3) * 0.25, MENU_POS.z + Math.cos(a) * 1.7);
  // look a bit left of the cart so it shows up right of the menu
  const dx = MENU_POS.x - _v.x, dz = MENU_POS.z - _v.z, l = Math.hypot(dx, dz), k = camera.aspect > 1.1 ? 1.0 : 0;
  setCamLook(_v, _v2.set(MENU_POS.x + (dz / l) * k, 0.75, MENU_POS.z - (dx / l) * k));
  if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
  STORE_ANIM.doors.open = damp(STORE_ANIM.doors.open, 0, 3, dt);
}

// ---------- main loop ----------
let last = performance.now(), acc = 0;
const STEP = 1 / 120;
const MAXDT = /[?&]slowpc/.test(location.search) ? 0.25 : 0.05; // test hook for very slow machines
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(MAXDT, (now - last) / 1000); last = now;
  if (G.state === 'paused') { renderer.render(scene, camera); SFX.drive(false, 0, 0, 0, 0); return; }
  G.clock += dt;
  let engineOn = true;
  // 1) simulation
  switch (G.state) {
    case 'menu': C.fwd = 0; C.throttle = 0; break;
    case 'countdown': {
      G.cdT -= dt;
      const n = Math.ceil(G.cdT);
      if (n !== G.cdShown && n > 0) {
        G.cdShown = n; const c = $('count'); c.textContent = n; c.className = ''; void c.offsetWidth; c.className = 'anim'; SFX.count(n);
      }
      C.throttle = input.up;
      if (G.cdT <= 0) go();
      break;
    }
    case 'play':
      acc += dt;
      while (acc >= STEP) { physicsStep(STEP, true); acc -= STEP; }
      updatePlay(dt);
      break;
    case 'checkout': updateCheckout(dt); break;
    case 'outro': updateOutro(dt); break;
    case 'dead': engineOn = false; C.fwd = damp(C.fwd, 0, 3, dt); break;
  }
  const d = STORE_ANIM.doors; d.L.position.x = -1.5 - d.open * 2.6; d.R.position.x = 1.5 + d.open * 2.6;
  if (G.state !== 'menu' && G.state !== 'intro') STORE_ANIM.doors.open = damp(STORE_ANIM.doors.open, 0, 3, dt);
  updateCartVisual(dt, engineOn && G.state !== 'menu');
  updateItems(dt);
  // 2) camera (after the cart has moved this frame → no lag)
  switch (G.state) {
    case 'menu': updateMenuCam(dt); break;
    case 'intro': updateIntro(dt); break;
    case 'countdown': case 'play': fpCamera(dt); break;
    case 'checkout': {
      const lane = G.lane, k = smooth(Math.min(1, G.co.t / 1.4));
      thirdPerson(k > 0.3);
      _v.set(lane.cx + 3.2, 2.2, 3.4); _v2.set(lane.cx + 0.4, 0.85, 7.0);
      _q2.setFromRotationMatrix(_m4.lookAt(_v, _v2, _up));
      camera.position.lerpVectors(G.co.camFrom, _v, k);
      camera.quaternion.copy(G.co.camQ).slerp(_q2, k);
      break;
    }
    case 'outro': {
      thirdPerson(true);
      const back = new V3(C.x - Math.sin(C.h) * 3.2, 2.2, C.z - Math.cos(C.h) * 3.2);
      if (G.out.t < dt * 1.5) camera.position.copy(back);
      camera.position.lerp(back, 1 - Math.exp(-4 * dt));
      camera.lookAt(C.x + Math.sin(C.h) * 1.5, 0.8, C.z + Math.cos(C.h) * 1.5);
      break;
    }
  }
  if (G.state !== 'play') updateHazards(dt, G.clock, 999, 999, 0, null);
  updatePuffs(dt);
  // product level of detail: full models only for nearby shelf blocks
  const lodHi = settings.quality === 'high' ? 8 : settings.quality === 'mid' ? 5.5 : 3.5;
  const lodMid = settings.quality === 'high' ? 20 : settings.quality === 'mid' ? 13 : 8;
  for (const l of PRODUCT_LOD) {
    const d = Math.hypot(camera.position.x - l.x, camera.position.z - l.z);
    l.hi.visible = d < lodHi; l.mid.visible = d >= lodHi && d < lodMid; l.lo.visible = d >= lodMid;
  }
  // HUD
  if (G.state === 'play' || G.state === 'countdown') {
    $('time').textContent = fmt(G.time);
    const ic = $('clockIc'); ic.style.setProperty('--s', (G.time % 60) * 6 + 'deg'); ic.style.setProperty('--m', (G.time / 60) * 30 + 'deg');
  }
  // light follows the player (shadows only near the camera)
  sun.position.set(camera.position.x + 5, 14, camera.position.z + 3);
  sun.target.position.set(camera.position.x, 0, camera.position.z);
  const driving = G.state === 'play' || G.state === 'countdown' || G.state === 'outro' || G.state === 'checkout';
  SFX.drive(driving, G.state === 'checkout' ? 0 : C.fwd, C.throttle, G.state === 'play' ? C.slip : 0, C.boostT > 0 ? 1 : 0);
  renderer.render(scene, camera);
}

// ---------- menus wiring ----------
let settingsBack = 'menu';
function openSettings(from) {
  settingsBack = from; show('settings');
  $('sVol').value = settings.vol; $('sFov').value = settings.fov; $('sFovV').textContent = settings.fov + '°'; $('sSens').value = settings.sens;
  const seg = (id, v) => $(id).querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === String(v)));
  seg('sMusic', settings.music ? 1 : 0); seg('sQual', settings.quality); seg('sShake', settings.shake ? 1 : 0);
}
function saveSettings() { saveJ('sd_settings', settings); SFX.applySettings(); }
$('sVol').addEventListener('input', (e) => { settings.vol = +e.target.value; saveSettings(); });
$('sFov').addEventListener('input', (e) => { settings.fov = +e.target.value; $('sFovV').textContent = settings.fov + '°'; saveSettings(); });
$('sSens').addEventListener('input', (e) => { settings.sens = +e.target.value; saveSettings(); });
for (const [id, fn] of [['sMusic', (v) => (settings.music = v === '1')], ['sQual', (v) => { settings.quality = v; applyQuality(); }], ['sShake', (v) => (settings.shake = v === '1')]]) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    fn(b.dataset.v); saveSettings();
    $(id).querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  });
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  SFX.init(); SFX.click();
  const act = b.dataset.act, panel = b.closest('.overlay, #result');
  const pid = panel ? panel.id : '';
  switch (act) {
    case 'play': show('menu', false); show('worlds'); break;
    case 'start': startGame(); break;
    case 'settings': openSettings(pid === 'pause' ? 'pause' : 'menu'); if (pid === 'menu') show('menu', false); else show('pause', false); break;
    case 'credits': show('menu', false); show('credits'); break;
    case 'back':
      show(pid, false);
      if (pid === 'settings' && settingsBack === 'pause') show('pause'); else show('menu');
      break;
    case 'resume': show('pause', false); G.state = G.pausedFrom; break;
    case 'restart': retry(); break;
    case 'retry': retry(); break;
    case 'menu': showMenu(); break;
    case 'next': nextLevel(); break;
  }
});
$('pauseBtn').addEventListener('click', (e) => { e.stopPropagation(); SFX.init(); togglePause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && (G.state === 'play' || G.state === 'countdown')) togglePause(); });

// boot
showMenu();
requestAnimationFrame(frame);
