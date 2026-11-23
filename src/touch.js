// ============================================================
//  Shopping Drifters – touch controls (iPad / phone)
//  Left half: steering stick (appears under the thumb, left/right only)
//  Right side: GAS, BREMSE, STOPP (hockey stop), GREIFEN (hold), NITRO
//  Free area on the right: swipe to look around (handled in game.js)
//  Using the keyboard hides the buttons, touching the screen shows them again.
// ============================================================
const TOUCH = (() => {
  const layer = $('touch'), zone = $('tSteer'), base = $('stickBase'), knob = $('stickKnob');
  let steerId = null, sx = 0, sy = 0;
  const RANGE = 70;
  function setTouchMode(on) {
    document.body.classList.toggle('touchmode', on);
    if (!on) release();
  }
  // steering stick
  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault(); SFX.init();
    if (steerId !== null) return;
    steerId = e.pointerId; sx = e.clientX; sy = e.clientY;
    try { zone.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    base.style.left = sx + 'px'; base.style.top = sy + 'px'; base.style.display = 'block';
    knob.style.transform = 'translate(0px,0px)';
    $('stickHint').style.opacity = 0;
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== steerId) return;
    let dx = e.clientX - sx;
    // the stick follows the thumb if it drifts too far
    if (Math.abs(dx) > RANGE) { sx += dx - Math.sign(dx) * RANGE; dx = Math.sign(dx) * RANGE; base.style.left = sx + 'px'; }
    const v = dx / RANGE, dead = 0.08, a = Math.abs(v) < dead ? 0 : Math.sign(v) * (Math.abs(v) - dead) / (1 - dead);
    input.right = Math.max(0, a); input.left = Math.max(0, -a);
    knob.style.transform = `translate(${dx}px,0px)`;
  });
  const endSteer = (e) => {
    if (e.pointerId !== steerId) return;
    steerId = null; input.left = input.right = 0; base.style.display = 'none'; $('stickHint').style.opacity = '';
  };
  zone.addEventListener('pointerup', endSteer); zone.addEventListener('pointercancel', endSteer);

  // hold buttons
  const holds = [];
  function holdBtn(id, key, onDown) {
    const b = $(id); let pid = null;
    const up = (e) => { if (e && e.pointerId !== pid) return; pid = null; b.classList.remove('down'); if (key) input[key] = 0; };
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); SFX.init();
      pid = e.pointerId; try { b.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      b.classList.add('down'); if (key) input[key] = 1; if (onDown) onDown();
    });
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
    holds.push(() => up(null));
  }
  holdBtn('tGas', 'up');
  holdBtn('tBrake', 'down');
  holdBtn('tStop', 'drift');
  holdBtn('tGrab', 'grab');
  holdBtn('tNitro', null, () => fireNitro());
  function release() {
    for (const h of holds) h();
    if (steerId !== null) { steerId = null; base.style.display = 'none'; }
    for (const k in input) input[k] = 0;
  }
  // switch between touch and keyboard
  window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' || e.pointerType === 'pen') setTouchMode(true); }, true);
  window.addEventListener('keydown', (e) => { if (!e.repeat && document.body.classList.contains('touchmode') && !e.metaKey) setTouchMode(false); }, true);
  if (IS_TOUCH) setTouchMode(true);
  layer.addEventListener('contextmenu', (e) => e.preventDefault());

  let lastPlaying = null;
  // per frame: show/hide, highlight buttons depending on the situation
  function update() {
    const playing = G.state === 'play' || G.state === 'countdown';
    if (playing !== lastPlaying) { document.body.classList.toggle('playing', playing); lastPlaying = playing; if (!playing) release(); }
    if (!playing) return;
    $('tNitro').classList.toggle('hidden', !(C.nitro > 0));
    $('tNitro').classList.toggle('late', C.nitro > 0 && C.nitroT < 1);
    $('tGrab').classList.toggle('ready', !!G.near);
  }
  return { update, active: () => document.body.classList.contains('touchmode') };
})();
// key label for prompts: keyboard key, or the button name in touch mode
function K(key, touchName) { return TOUCH.active() ? `<kbd class="tk">${touchName}</kbd>` : `<kbd>${key}</kbd>`; }
