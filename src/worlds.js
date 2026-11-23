// ============================================================
//  Shopping Drifters – the worlds (all share the same floor plan, but look,
//  products, shelving and physics differ)
// ============================================================
const S = (n, e, col, t) => ({ n, e, col, t });
const WORLDS = {
  // ---------------------------------------------------------------- Drift-Markt
  std: {
    id: 'std', name: 'Drift-Markt', logo: 'DRIFT-MARKT', short: ['DRIFT', 'MARKT'],
    H: 5.6, wall: '#f1ece0', band: '#1aa39a', kick: '#8a8f99', ceil: '#cfccc4', facade: '#e9e2d0',
    floor: { a: '#ece8df', b: '#e2ddd2', grout: '#cfc9bd', tile: 2 },
    fog: ['#e9e4d8', 28, 75], light: { hemi: ['#ffffff', '#b3a58e', 1.55], sun: ['#fff4e2', 1.5], bg: '#a9d8ff' },
    shelf: 'gondola', grip: 1,
    sections: [
      [S('Getränke', '🥤', '#2a62c9', ['cola', 'wasser', 'limo', 'energy']), S('Säfte & Kisten', '🧃', '#ff8a1f', ['osaft', 'asaft', 'eistee', 'kiste'])],
      [S('Süßes', '🍬', '#e0408a', ['schoko', 'gummi', 'kekse', 'lolli']), S('Snacks', '🍿', '#e8322b', ['chips', 'popcorn', 'nuesse', 'salzst'])],
      [S('Frühstück', '🥣', '#e0a019', ['muesli', 'honig', 'marmelade', 'creme']), S('Backwaren', '🥖', '#b07a45', ['brot', 'toast', 'croissant', 'baguette'])],
      [S('Nudeln & Reis', '🍝', '#1f4fb8', ['spaghetti', 'fusilli', 'reis', 'tomsauce']), S('Konserven', '🥫', '#c8261b', ['mais', 'bohnen', 'thunfisch', 'ravioli'])],
      [S('Backen & Würzen', '🧂', '#8a6bd6', ['mehl', 'zucker', 'salz', 'ketchup']), S('Spielzeug', '🧸', '#ffb400', ['ente', 'fussball', 'teddy', 'auto'])],
      [S('Haushalt', '🧻', '#2e9b8a', ['klopapier', 'kuechenrolle', 'spueli', 'schwamm']), S('Drogerie', '🧴', '#b34fe0', ['zahnpasta', 'shampoo', 'seife', 'deo'])],
      [S('Tierbedarf', '🐾', '#5a9e2e', ['katzenfutter', 'hundefutter', 'knochen', 'vogelfutter']), S('Kaffee & Tee', '☕', '#6b4226', ['kaffee', 'tee', 'kakao', 'espresso'])],
    ],
    back: { style: 'cooler', tag: 'KÜHLREGAL', units: [
      { x0: -28.5, x1: -10, n: 'Milch & Käse', e: '🥛', col: '#2a7de1', t: ['milch', 'kaese', 'joghurt', 'butter', 'eier'] },
      { x0: -9, x1: 9, n: 'Wurst & Fleisch', e: '🥩', col: '#c8261b', t: ['salami', 'wuerstchen', 'haehnchen', 'schinken'] },
      { x0: 10, x1: 28.5, n: 'Tiefkühl', e: '❄️', col: '#5ac8f0', t: ['pizza', 'eis', 'pommes', 'fischst'] },
    ] },
    front: { style: 'produce', n: 'Obst & Gemüse', e: '🍎', sub: 'FRISCH', col: '#3f9b3a', items: [[10, 'aepfel', 'tomaten'], [17, 'bananen', 'karotten'], [24, 'melone', 'brokkoli']] },
    candy: ['schoko', 'gummi', 'lolli', 'kekse', 'salzst'],
    posters: [['ANGEBOT', '-50%', '#e8322b'], ['NEU', 'Drift-Cola', '#2a62c9'], ['BITTE', 'Nicht driften!', '#f2a20c'], ['SUPER', 'Frisch!', '#3f9b3a']],
    desc: 'Der ganz normale Supermarkt um die Ecke.', icon: '🛒', grad: ['#1aa39a', '#2a62c9'],
  },
  // ---------------------------------------------------------------- Baumarkt
  bau: {
    id: 'bau', name: 'Baumarkt', logo: 'BAU-DRIFT', short: ['BAU', 'DRIFT'],
    H: 6.8, wall: '#e6e2d6', band: '#ff7a00', kick: '#555b66', ceil: '#8a8f99', facade: '#d9d4c4',
    floor: { a: '#b9b6ae', b: '#b3b0a8', grout: '#8f8c85', tile: 4 },
    fog: ['#d8d4c8', 30, 80], light: { hemi: ['#ffffff', '#9a9488', 1.5], sun: ['#ffffff', 1.4], bg: '#a9d8ff' },
    shelf: 'rack', grip: 1,
    sections: [
      [S('Farben', '🪣', '#d6262b', ['farbe_w', 'farbe_r', 'farbe_b', 'farbe_g']), S('Malerbedarf', '🖌️', '#e0408a', ['pinsel', 'roller', 'lackspray', 'klebeband'])],
      [S('Schrauben', '🔩', '#555b66', ['schrauben', 'duebel', 'naegel', 'muttern']), S('Werkzeug', '🔨', '#ffb400', ['hammer', 'schraubendreher', 'zange', 'saege'])],
      [S('Elektro', '🔌', '#1d2230', ['gluehbirne', 'kabeltrommel', 'verlaengerung', 'batterien']), S('Maschinen', '🛠️', '#2e8b3a', ['akkuschrauber', 'bohrmaschine', 'schleifer', 'stichsaege'])],
      [S('Sanitär', '🚿', '#2a7de1', ['wasserhahn', 'duschkopf', 'silikon', 'rohr']), S('Garten', '🌱', '#3f9b3a', ['blumenerde', 'rasensamen', 'duenger', 'giesskanne'])],
      [S('Holz', '🪵', '#b07a45', ['bretter', 'leisten', 'holzleim', 'spanplatte']), S('Fliesen', '🧱', '#c8693a', ['fliese_w', 'fliese_b', 'fliese_t', 'fliesenkleber'])],
      [S('Arbeitsschutz', '⛑️', '#f2c200', ['helm', 'handschuhe', 'schutzbrille', 'warnweste']), S('Licht', '💡', '#8a6bd6', ['tischlampe', 'lichterkette', 'taschenlampe', 'solarlampe'])],
      [S('Tapezieren', '🎞️', '#2e9b8a', ['eimer', 'muelleimer', 'kleister', 'tapete']), S('Putzen', '🧽', '#1aa39a', ['klopapier', 'kuechenrolle', 'spueli', 'schwamm'])],
    ],
    back: { style: 'open', tag: 'BAUSTOFFE', frame: '#ff7a00', units: [
      { x0: -28.5, x1: -1, n: 'Baustoffe', e: '🏗️', col: '#555b66', t: ['zement', 'kies'] },
      { x0: 1, x1: 28.5, n: 'Holzzuschnitt', e: '🪵', col: '#b07a45', t: ['kantholz', 'rigips'] },
    ] },
    front: { style: 'produce', n: 'Gartencenter', e: '🪴', sub: 'PFLANZEN', col: '#3f9b3a', items: [[10, 'kaktus', 'blume'], [17, 'tomatenpflanze', 'bonsai'], [24, 'kraeuter', 'lavendel']] },
    candy: ['batterien', 'klebeband', 'handschuhe', 'gluehbirne', 'schrauben'],
    posters: [['PROFI', 'Werkzeug', '#ff7a00'], ['NEU', 'Akku-Power', '#2e8b3a'], ['ACHTUNG', 'Stapler!', '#f2c200'], ['DIY', 'Selbst bauen!', '#2a62c9']],
    desc: 'Hohe Regale, Paletten, Gabelstapler-Feeling.', icon: '🔨', grad: ['#ff7a00', '#555b66'],
  },
  // ---------------------------------------------------------------- Mega-Mall
  mall: {
    id: 'mall', name: 'Mega-Mall', logo: 'DRIFT-MALL', short: ['DRIFT', 'MALL'],
    H: 9, wall: '#f6f1ea', band: '#b34fe0', kick: '#3a3f4a', ceil: '#f4f1ea', facade: '#ece6dc', skylight: true,
    floor: { a: '#f4f1ec', b: '#d9d2c8', grout: '#c9a96a', tile: 3 },
    fog: ['#f1ece4', 35, 90], light: { hemi: ['#fffaf0', '#c8b8a0', 1.7], sun: ['#fff8ec', 1.6], bg: '#9fd4ff' },
    shelf: 'shop', grip: 1,
    sections: [
      [S('Elektronik', '🎧', '#1d2230', ['kopfhoerer', 'handy', 'konsole', 'ladekabel']), S('Mode', '👕', '#e0408a', ['tshirt_r', 'tshirt_b', 'tshirt_s', 'jeans'])],
      [S('Schuhe', '👟', '#e8322b', ['sneaker_w', 'sneaker_r', 'stiefel', 'flipflops']), S('Sport', '🏀', '#ff8a1f', ['basketball', 'hanteln', 'yogamatte', 'trinkflasche'])],
      [S('Bücher', '📚', '#2a62c9', ['buch_k', 'buch_c', 'buch_r', 'buch_a']), S('Parfümerie', '🌸', '#ff7eb6', ['parfuem', 'lippenstift', 'nagellack', 'creme_m'])],
      [S('Wohnen', '🕯️', '#b07a45', ['tasse', 'pfanne', 'kerzen', 'bilderrahmen']), S('Musik & Style', '🎸', '#8a6bd6', ['vinyl', 'gitarre', 'sonnenbrille', 'uhr'])],
      [S('Spielwaren', '🧸', '#ffb400', ['ente', 'teddy', 'auto', 'fussball']), S('Süßwaren', '🍭', '#e0408a', ['schoko', 'gummi', 'lolli', 'popcorn'])],
      [S('Kiosk', '🗞️', '#2e9b8a', ['cola', 'energy', 'chips', 'salzst']), S('Reise', '🎒', '#1aa39a', ['rucksack', 'muetze', 'wasser', 'nuesse'])],
      [S('Zoohandlung', '🐾', '#5a9e2e', ['katzenfutter', 'hundefutter', 'knochen', 'vogelfutter']), S('Café', '☕', '#6b4226', ['kaffee', 'tee', 'kakao', 'croissant'])],
    ],
    back: { style: 'cooler', tag: 'FEINKOST', frame: '#c9a96a', units: [
      { x0: -28.5, x1: -10, n: 'Feinkost', e: '🧀', col: '#c9a96a', t: ['kaese', 'salami', 'creme', 'espresso'] },
      { x0: -9, x1: 9, n: 'Kühl-Bar', e: '🥛', col: '#2a7de1', t: ['milch', 'joghurt', 'osaft', 'asaft'] },
      { x0: 10, x1: 28.5, n: 'Eis-Café', e: '🍨', col: '#ff7eb6', t: ['eis', 'torte', 'tiramisu', 'eistee'] },
    ] },
    front: { style: 'food', n: 'Food-Court', e: '🍔', sub: 'SNACKS', col: '#e8322b', items: [[10, 'burger', 'pizzastueck'], [17, 'donut', 'smoothie'], [24, 'slush', 'popcorn_m']] },
    candy: ['schoko', 'gummi', 'lolli', 'kopfhoerer', 'ladekabel'],
    posters: [['SALE', '-70%', '#e8322b'], ['NEU', 'Phone 9', '#1d2230'], ['KINO', 'Drift Movie', '#8a6bd6'], ['FOOD', 'Burger!', '#ff8a1f']],
    fountain: true,
    desc: 'Riesig, glänzend, mit Brunnen und Food-Court.', icon: '🛍️', grad: ['#b34fe0', '#ff7eb6'],
  },
  // ---------------------------------------------------------------- Tiefkühl-Lager
  frost: {
    id: 'frost', name: 'Tiefkühl-Lager', logo: 'FROST-LAGER', short: ['FROST', 'LAGER'],
    H: 6, wall: '#e6f2fb', band: '#4fb0ff', kick: '#3a5a7a', ceil: '#a9c2d4', facade: '#dfeaf2',
    floor: { a: '#d6ecf6', b: '#c4e0ee', grout: '#a9c8da', tile: 2 },
    fog: ['#d6ebf7', 18, 60], light: { hemi: ['#eaf6ff', '#8fb0c8', 1.6], sun: ['#e6f4ff', 1.3], bg: '#cfe8ff' },
    shelf: 'freezer', grip: 0.55, ice: true,
    sections: [
      [S('Eiscreme', '🍨', '#ff7eb6', ['eis_v', 'eis_s', 'eis_m', 'eisstiel']), S('Pizza', '🍕', '#e8322b', ['tkpizza_m', 'tkpizza_t', 'tkpizza_s', 'pizza'])],
      [S('TK-Gemüse', '🥦', '#3f9b3a', ['tkgemuese_e', 'tkgemuese_s', 'tkgemuese_m']), S('Fisch', '🐟', '#2a62c9', ['fischst', 'lachs', 'garnelen', 'thunfisch'])],
      [S('Fleisch', '🥩', '#c8261b', ['hack', 'patties', 'nuggets', 'haehnchen']), S('Kartoffel', '🍟', '#ffb400', ['pommes', 'kroketten', 'roesti'])],
      [S('Backwaren', '🥐', '#b07a45', ['tkbroetchen', 'croissant', 'brot', 'baguette']), S('Fertiggerichte', '🍝', '#8a6bd6', ['lasagne', 'asiapfanne', 'fruehlingsrollen', 'ravioli'])],
      [S('Desserts', '🎂', '#ff7eb6', ['torte', 'tiramisu', 'eis', 'donut']), S('TK-Obst', '🫐', '#3a3aa0', ['beeren_b', 'beeren_e', 'beeren_m', 'smoothie'])],
      [S('Eis & Drinks', '🧊', '#4fb0ff', ['eiswuerfel', 'slush', 'wasser', 'energy']), S('Molkerei', '🥛', '#2a7de1', ['milch', 'butter', 'joghurt', 'kaese'])],
      [S('Wurst & Eier', '🥓', '#c8504a', ['salami', 'wuerstchen', 'schinken', 'eier']), S('Snacks', '🍿', '#e8322b', ['chips', 'popcorn', 'nuesse', 'salzst'])],
    ],
    back: { style: 'cooler', tag: 'KÜHLHAUS', frame: '#7a9ab0', units: [
      { x0: -28.5, x1: -1, n: 'Kühlhaus A', e: '❄️', col: '#2a7de1', t: ['kiste', 'eistee', 'kekse', 'creme'] },
      { x0: 1, x1: 28.5, n: 'Kühlhaus B', e: '🧊', col: '#4fb0ff', t: ['muesli', 'honig', 'marmelade', 'toast'] },
    ] },
    front: { style: 'chest', n: 'Aktions-Truhen', e: '🧊', sub: 'ANGEBOTE', col: '#4fb0ff', items: [[10, 'cola', 'limo'], [17, 'schoko', 'gummi'], [24, 'asaft', 'osaft']] },
    candy: ['schoko', 'gummi', 'lolli', 'eisstiel', 'kekse'],
    posters: [['KALT!', '-25 °C', '#4fb0ff'], ['ACHTUNG', 'Glatteis!', '#e8322b'], ['NEU', 'Frost-Eis', '#ff7eb6'], ['TIPP', 'Jacke an!', '#2a62c9']],
    desc: 'Eiskalt und spiegelglatt – überall rutschig!', icon: '🧊', grad: ['#4fb0ff', '#bfe6ff'],
  },
};
const WORLD_ORDER = ['std', 'bau', 'mall', 'frost'];
// every product id a world uses (geometry + labels are built for exactly these)
function worldProductIds(W) {
  const ids = new Set();
  for (const col of W.sections) for (const s of col) s.t.forEach((t) => ids.add(t));
  for (const u of W.back.units) u.t.forEach((t) => ids.add(t));
  for (const [, a, b] of W.front.items) { ids.add(a); ids.add(b); }
  W.candy.forEach((t) => ids.add(t));
  return [...ids];
}
