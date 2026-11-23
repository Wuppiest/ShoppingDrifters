// ============================================================
//  Shopping Drifters – style points, announcements, power cuts, moved products
// ============================================================

// ---------------------------------------------------------------- style points
const STY = (() => {
  let score = 0, combo = 0, comboT = 0, drift = 0, driftOff = 0, wall = 0, wallOff = 0, stopCand = null, lastLock = false;
  const box = $('style'), num = $('styleNum'), mult = $('styleMult'), pops = $('stylePops'), live = $('styleLive');
  const multOf = () => Math.min(5, 1 + Math.floor(combo / 2));
  function render() {
    num.textContent = score.toLocaleString('de-DE');
    const m = multOf();
    mult.textContent = 'x' + m; mult.classList.toggle('hidden', combo < 2);
    mult.style.background = ['#4b5275', '#4b5275', '#2bb24a', '#2a7de1', '#b34fe0', '#e8322b'][m];
  }
  function popup(txt, cls = '') {
    const d = document.createElement('div'); d.className = 'pop ' + cls; d.innerHTML = txt;
    pops.prepend(d); while (pops.children.length > 4) pops.lastChild.remove();
    setTimeout(() => d.remove(), 2600);
  }
  function add(name, pts) {
    if (G.state !== 'play') return;
    combo++; comboT = 3.5;
    const m = multOf(), total = Math.round(pts * m);
    score += total;
    popup(`<b>+${total}</b> ${name}${m > 1 ? ` <i>x${m}</i>` : ''}`);
    SFX.style(m);
    box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
    render();
  }
  function breakCombo() {
    if (combo >= 2) popup('COMBO WEG!', 'bad');
    combo = 0; comboT = 0; drift = 0; wall = 0; render();
  }
  function reset() { score = 0; combo = 0; comboT = 0; drift = 0; wall = 0; stopCand = null; pops.innerHTML = ''; live.textContent = ''; render(); }
  // distance from the cart to the nearest obstacle box (for the "precision stop")
  function wallDist() {
    let best = 99;
    for (const off of [0.27, -0.3]) {
      const cx = C.x + Math.sin(C.h) * off, cz = C.z + Math.cos(C.h) * off;
      for (const list of [COLS, DYN_BOXES]) for (const b of list) {
        const dx = Math.max(b.x0 - cx, 0, cx - b.x1), dz = Math.max(b.z0 - cz, 0, cz - b.z1);
        best = Math.min(best, Math.hypot(dx, dz) - PHY.R);
      }
    }
    return best;
  }
  function update(dt) {
    const v = Math.hypot(C.vx, C.vz), lock = input.drift;
    if (comboT > 0) { comboT -= dt; if (comboT <= 0) { combo = 0; render(); } }
    // drift: points while sliding, banked when the drift ends
    if (!lock && C.slip > 0.3 && v > 5) { drift += dt * v * C.slip * 14; driftOff = 0; }
    else if (drift > 0) { driftOff += dt; if (driftOff > 0.35) { if (drift >= 40) add('DRIFT', drift); drift = 0; } }
    // wall ride
    if (C.scrape > 0) { wall += dt * v * 10; wallOff = 0; }
    else if (wall > 0) { wallOff += dt; if (wallOff > 0.3) { if (wall >= 25) add('WALL-RIDE', wall); wall = 0; } }
    const liveTxt = drift > 20 ? `DRIFT ${Math.round(drift)}` : wall > 15 ? `WALL-RIDE ${Math.round(wall)}` : '';
    if (live.textContent !== liveTxt) live.textContent = liveTxt;
    // hockey stop: started sideways & fast, ends standing → precision bonus if close to a shelf
    if (lock && !lastLock && v > 5 && C.slip > 0.5) stopCand = { v };
    if (!lock) stopCand = null;
    if (stopCand && v < 0.3) {
      const d = wallDist();
      if (d < 0.7) add('PRÄZISIONS-STOPP', 250 + Math.round((0.7 - d) * 300)); else add('HOCKEY-STOPP', 80);
      stopCand = null;
    }
    lastLock = lock;
    // near misses with people / machines
    if (v > 5) for (const sh of HZ.shoppers) {
      if (sh.bump > 0 || (sh.nmT || 0) > G.clock) continue;
      for (const c of [sh.col, sh.col2]) {
        if (!c) continue;
        const d = Math.hypot(C.x - c.x, C.z - c.z) - c.r - PHY.R;
        if (d > 0.03 && d < 0.6) { sh.nmT = G.clock + 3; add(sh.kind === 'oma' ? 'OMA VERSCHONT' : 'KNAPP!', sh.kind === 'oma' ? 150 : 80); break; }
      }
    }
  }
  return { add, breakCombo, reset, update, get score() { return score; } };
})();
const breakCombo = () => STY.breakCombo();

// ---------------------------------------------------------------- announcements
let annT = 0;
function announce(txt, ms = 4200) {
  const a = $('announce'); a.innerHTML = '📢 ' + txt; a.classList.add('show');
  SFX.gong(); clearTimeout(annT); annT = setTimeout(() => a.classList.remove('show'), ms);
}
const FUN_ANN = [
  'Der Fahrer des motorisierten Einkaufswagens wird gebeten, die Reifen zu schonen.',
  'Heute im Angebot: Bremsen. Bitte bedienen Sie sich.',
  'Kassierer bitte zu Kasse 2 – und Helm aufsetzen.',
  'Wer hat den Wagen getunt? Bitte an der Info melden.',
  'Liebe Kunden, bitte driften Sie nur in den markierten Bereichen.',
  'Ein kleiner Junge sucht seine Mama. Und sein Skateboard.',
];

// ---------------------------------------------------------------- events: power cut + moved products
const EV = (() => {
  let t = 0, lights = null, moves = [], funT = 0;
  const islands = [];
  const spot = new T.SpotLight('#fff6d8', 0, 32, 0.55, 0.6, 1.2);
  spot.position.set(0, 0.35, 0.5); cart.body.add(spot);
  const spotTarget = new T.Object3D(); spotTarget.position.set(0, 0.2, 9); cart.body.add(spotTarget); spot.target = spotTarget;
  function setDark(k) { // k = 0 normal … 1 dark
    hemi.intensity = lerp(LIGHT_BASE.hemi, LIGHT_BASE.hemi * 0.1, k);
    sun.intensity = lerp(LIGHT_BASE.sun, LIGHT_BASE.sun * 0.05, k);
    if (STORE_ANIM.lampMat) STORE_ANIM.lampMat.color.copy(STORE_ANIM.lampCol).multiplyScalar(1 - 0.85 * k);
    if (LIGHT_BASE.fog) scene.fog.color.copy(LIGHT_BASE.fog).multiplyScalar(1 - 0.8 * k);
    spot.intensity = 220 * k;
  }
  function reset(cfg) {
    t = 0; funT = R(8, 14);
    lights = cfg.lightsOut ? { at: R(18, 40), phase: 0, pt: 0 } : null;
    setDark(0);
    restoreMoves();
    moves = [];
    for (let i = 0; i < cfg.wander; i++) moves.push({ at: 22 + i * R(18, 26), done: false });
  }
  function update(dt) {
    t += dt;
    if (funT > 0) { funT -= dt; if (funT <= 0 && !lights) announce(pick(FUN_ANN)); }
    // ---- power cut ----
    if (lights) {
      const L = lights;
      if (L.phase === 0 && t > L.at) { L.phase = 1; L.pt = 0; announce('Stromausfall! Bitte bleiben Sie ruhig. Ihr Wagen hat Scheinwerfer.', 5000); SFX.power(false); }
      if (L.phase > 0) L.pt += dt;
      if (L.phase === 1) { setDark(Math.random() < 0.5 ? 1 : 0.2); if (L.pt > 1.3) { L.phase = 2; L.pt = 0; setDark(1); } }
      else if (L.phase === 2 && L.pt > 13) { L.phase = 3; L.pt = 0; SFX.power(true); }
      else if (L.phase === 3) { setDark(Math.random() < 0.5 ? 0.9 : 0); if (L.pt > 0.9) { L.phase = 4; setDark(0); announce('Strom ist wieder da. Weiterdriften!'); } }
    }
    // ---- a product gets moved to a promo island ----
    for (const mv of moves) {
      if (mv.done || t < mv.at) continue;
      mv.done = true;
      const left = G.list.filter((p) => !G.got.has(p.id) && !p.moved);
      if (left.length) moveProduct(pick(left));
    }
  }
  // islands: in the cross aisle (z 29) or the back aisle (z 46.3) at an aisle center
  function moveProduct(p) {
    const cands = [];
    for (let a = 0; a < 7; a++) for (const z of [29, 46.3]) cands.push({ a, x: AISLES[a].cx, z });
    const ok = cands.filter((c) => Math.hypot(c.x - C.x, c.z - C.z) > 9 && !islands.some((i) => i.a === c.a && i.z === c.z));
    if (!ok.length) return;
    const c = pick(ok);
    hideBlock(p.id, SPOTS[p.id]);
    const o = new Obj();
    o.box(1.0, 0.62, 0.7, 0, 0.31, 0, '#e8322b'); o.box(1.04, 0.04, 0.74, 0, 0.64, 0, '#ffffff'); o.box(1.04, 0.06, 0.74, 0, 0.04, 0, '#9a1a1a');
    o.box(0.04, 0.9, 0.04, 0, 1.1, 0, '#c8ccd0'); o.box(0.6, 0.3, 0.03, 0, 1.6, 0, '#ffd84a');
    const g = new T.Group(); g.add(new MeshAcc().addObj(o).build(VCMAT)); g.children[0].castShadow = true;
    const n = Math.max(1, Math.min(4, Math.floor(0.9 / p.w)));
    for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
      const m = new T.Mesh(p.geo, VCMAT); m.position.set(-0.45 + (i + 0.5) * (0.9 / n), 0.66, row ? 0.17 : -0.17); m.rotation.y = row ? 0 : PI; g.add(m);
    }
    const sign = new T.Mesh(new T.PlaneGeometry(0.56, 0.26), new T.MeshBasicMaterial({ map: canvasTex(256, 120, (gc, w, h) => { gc.fillStyle = '#ffd84a'; gc.fillRect(0, 0, w, h); gc.textAlign = 'center'; gc.textBaseline = 'middle'; gc.font = `${h * 0.55}px ${EMOJI_FONT}`; gc.fillText(p.e, w * 0.2, h * 0.55); gc.fillStyle = '#e8322b'; fitText(gc, 'HIER!', w * 0.62, h * 0.55, w * 0.55, h * 0.5); }) }));
    sign.position.set(0, 1.6, 0.02); const s2 = sign.clone(); s2.rotation.y = PI; s2.position.z = -0.02; g.add(sign, s2);
    g.position.set(c.x, 0, c.z); HZ.group.add(g);
    addCol(c.x - 0.52, c.z - 0.37, c.x + 0.52, c.z + 0.37, DYN_BOXES);
    islands.push(c);
    SPOTS[p.id] = { ax: c.x - 0.4, az: c.z, bx: c.x + 0.4, bz: c.z, nx: 0, nz: -1, mx: c.x, mz: c.z, y: 0.7 };
    p.moved = true;
    if (G.markers[p.id]) scene.remove(G.markers[p.id].g);
    G.markers[p.id] = makeMarker(SPOTS[p.id]);
    G.markers[p.id].arrow.position.set(c.x, 2.3, c.z);
    const where = c.z < 40 ? `im mittleren Quergang bei Gang ${c.a + 1}` : `im hinteren Gang bei Gang ${c.a + 8}`;
    announce(`${p.e} <b>${p.n}</b> wurde umgeräumt – jetzt auf einer Aktionsinsel ${where}!`, 6000);
    const li = $('li_' + p.id); if (li) li.classList.add('moved');
  }
  function restoreMoves() {
    for (const p of PRODUCTS) if (p.moved) { p.moved = false; SPOTS[p.id] = ORIG_SPOTS[p.id]; }
    for (const l of PRODUCT_LOD) if (l.hidden) { l.hidden = false; for (const im of [l.hi, l.mid, l.lo]) { l.mats.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; } }
    islands.length = 0;
  }
  const ZERO = new T.Matrix4().makeScale(0, 0, 0);
  function hideBlock(id, sp) {
    for (const l of PRODUCT_LOD) {
      if (l.id !== id) continue;
      l.mats.forEach((m, i) => {
        if (spotDist(sp, m.elements[12], m.elements[14]).d < 0.75) { l.hidden = true; for (const im of [l.hi, l.mid, l.lo]) im.setMatrixAt(i, ZERO); }
      });
      for (const im of [l.hi, l.mid, l.lo]) im.instanceMatrix.needsUpdate = true;
    }
  }
  return { reset, update, setDark };
})();
