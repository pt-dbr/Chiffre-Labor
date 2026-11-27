'use strict';
const {alphabet, normalize, letters, mod, rotate, keyword, substitute, vigenere, railPath, rail, columnOrder, columnar, units, affineKey, matrices, hill} = Cipher;
const $ = id => document.getElementById(id);
const bench = $('bench');
const source = $('source');
const result = $('result');
const modes = {
  caesar: ['Cäsar', 'Verschiebe das Alphabet und verfolge jeden Buchstaben.', 'Ab Klasse 5', 'Bei +3 wird aus A ein D und aus Z ein C. Beim Entschlüsseln wird dieselbe Zuordnung rückwärts gelesen.', 'Verschlüssle HALLO mit +3. Was passiert bei +26?'],
  keyword: ['Schlüsselwort-Alphabet', 'Baue aus einem Codewort dein eigenes Geheimalphabet.', 'Ab Klasse 6', 'Jeder Buchstabe des Codeworts bleibt einmal stehen. Danach folgen die noch fehlenden Buchstaben von A bis Z. Die zusätzliche Verschiebung dreht den fertigen Streifen.', 'Vergleiche BANANE und BANE. Erkläre, warum sie denselben Streifen ergeben.'],
  pigpen: ['Freimaurer-Chiffre', 'Tausche Buchstaben gegen Winkel und Punkte.', 'Ab Klasse 5', 'Die Linien um ein Feld werden zum Zeichen. A–I und J–R liegen in zwei Gittern, S–V und W–Z in zwei Kreuzen. In der jeweils zweiten Zeichengruppe kommt ein Punkt dazu.', 'Verschlüssle ANNA. Kann dein Team die wiederholten Zeichen erkennen?'],
  templar: ['Templer-Chiffre', 'Schreibe mit Zeichen aus Kreuzarmen, Dreiecken und Rauten.', 'Ab Klasse 5', 'Diese Unterrichtsfassung orientiert sich an einer zugeschriebenen Kreuz-Chiffre und ergänzt ein eigenes Zeichen für J. Die mittelalterliche Verwendung durch den Templerorden ist historisch nicht gesichert.', 'Schreibe denselben Satz mit beiden Symbolchiffren. Was bleibt trotz der unterschiedlichen Zeichen gleich?'],
  atbash: ['Spiegelalphabet', 'Lies das Geheimalphabet von Z bis A.', 'Ab Klasse 5', 'A wird Z, B wird Y, und so weiter. Wende das Spiegelalphabet zweimal an, um den ursprünglichen Text zurückzubekommen.', 'Finde ein Wort, dessen Geheimtext mit demselben Buchstaben beginnt, mit dem das Wort endet.'],
  rail: ['Gartenzaun', 'Verteile deine Nachricht im Zickzack auf mehrere Zeilen.', 'Ab Klasse 7', 'Schreibe die Zeichen im Zickzack hinunter und hinauf. Lies dann jede Zeile von links nach rechts. Leerzeichen wandern dabei mit.', 'Vergleiche zwei und drei Zeilen. Welche Buchstaben behalten ihren Platz?'],
  vigenere: ['Vigenère', 'Jeder Buchstabe deines Schlüsselworts bestimmt eine Verschiebung.', 'Ab Klasse 8', 'A bedeutet Verschiebung 0, B bedeutet 1, Z bedeutet 25. Das Schlüsselwort wiederholt sich. Leer- und Satzzeichen verbrauchen keinen Schlüsselbuchstaben.', 'Verschlüssle AAAAAA einmal mit ABC und einmal mit AAA. Was siehst du?'],
  columnar: ['Spaltentransposition', 'Schreib in Zeilen und lies die Spalten nach dem Schlüsselwort ab.', 'Ab Klasse 8', 'Schreibe die Nachricht zeilenweise unter das Codewort. Sortiere die Spalten nach den Schlüsselbuchstaben. Bei gleichen Buchstaben kommt die linke Spalte zuerst. Lies jede Spalte von oben nach unten. Leer- und Satzzeichen wandern mit.', 'Vergleiche die Codewörter ZEBRA und ZEBRAS. Warum ändert sich die Reihenfolge des Geheimtexts?'],
  affine: ['Affine Chiffre', 'Multipliziere und verschiebe im Alphabet.', 'Ab Klasse 9', 'Nummeriere A bis Z von 0 bis 25. Für die Zahl x berechnest du a × x + b und nimmst den Rest bei Division durch 26. Faktor a muss zu 26 teilerfremd sein, damit alle Buchstaben eindeutig bleiben.', 'Stelle a = 1 ein und vergleiche die Zuordnung mit Cäsar. Was bewirkt a = 5?'],
  hill: ['Hill-Chiffre', 'Verschlüssele Buchstabenpaare mit einer Matrix.', 'Ab Klasse 10', 'A zählt als 0, Z als 25. Multipliziere die beiden Zahlen eines Paars mit der Schlüsselmatrix und nimm jeweils den Rest bei Division durch 26. Zum Entschlüsseln wird die Umkehrmatrix verwendet. Leerzeichen und Satzzeichen entfallen. Bei ungerader Länge ergänzt die App ein X. Prüfe nach dem Entschlüsseln, ob das letzte X ein Füllzeichen war.', 'Vergleiche HA und HB. Wie viele Zeichen im Ergebnis ändern sich? Wechsle danach die Schlüsselmatrix.'],
  crack: ['Knack-Labor', 'Probiere alle Cäsar-Schlüssel und finde die lesbare Nachricht.', 'Ab Klasse 7', 'Bei Cäsar gibt es 26 Möglichkeiten einschließlich 0. Die Buchstabenhäufigkeit zeigt, welche Zeichen oft vorkommen. Bei kurzen Texten ist sie nur ein schwacher Hinweis.', 'Setze das Beispiel ein und finde einen lesbaren Satz. Zähle, wie viele Verschiebungen du ausprobiert hast.']
};
const drafts = Object.fromEntries(Object.keys(modes).map(key => [key, {text: '', reverse: false, shift: key === 'keyword' ? 0 : 3, word: key === 'keyword' ? 'BANANE' : key === 'columnar' ? 'ZEBRA' : 'ABC', factor: 5, offset: 8, matrix: 0, rows: 3, view: 'strip', step: 0}]));
drafts.caesar.text = 'HALLO';
let mode = 'caesar';
let drag;
const state = () => drafts[mode];
const symbolMode = () => mode === 'pigpen' || mode === 'templar';
const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);
const path = d => '<path d="' + d + '"/>';
const dot = '<circle cx="16" cy="16" r="2" fill="currentColor" stroke="none"/>';
function symbol(letter) {
  const i = alphabet.indexOf(letter);
  let ink;
  if (mode === 'pigpen') {
    if (i < 18) {
      const col = i % 3;
      const row = Math.floor(i % 9 / 3);
      ink = (col > 0 ? path('M5 5v22') : '') + (col < 2 ? path('M27 5v22') : '') +
        (row > 0 ? path('M5 5h22') : '') + (row < 2 ? path('M5 27h22') : '') + (i >= 9 ? dot : '');
    } else {
      ink = '<g transform="rotate(' + ((i - 18) % 4 * 90) + ' 16 16)">' + path('M5 5l11 11L27 5') + '</g>' +
        (i >= 22 ? '<circle cx="16" cy="7" r="1.8" transform="rotate(' + ((i - 18) % 4 * 90) + ' 16 16)" fill="currentColor" stroke="none"/>' : '');
    }
  } else {
    const plain = 'ABCDEFGHIKLM';
    const dotted = 'OPQRVTUSXYWZ';
    const j = plain.includes(letter) ? plain.indexOf(letter) : dotted.indexOf(letter);
    if (j < 0) ink = path('M7 7l18 18M25 7L7 25') + (letter === 'J' ? '<circle cx="16" cy="7" r="2" fill="currentColor" stroke="none"/>' : '');
    else {
      const shapes = ['M4 5l12 21L28 5', 'M5 6h22L5 26Z', 'M5 16L23 5l4 11-4 11Z'];
      const angle = j % 4 * 90;
      ink = '<g transform="rotate(' + angle + ' 16 16)">' + path(shapes[Math.floor(j / 4)]) + (dotted.includes(letter) ? dot : '') + '</g>';
    }
  }
  return '<svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">' + ink + '</svg>';
}

function pigpenKey() {
  const key = (title, grid, cross, dotted) => {
    const label = (letter, x, y) => '<text x="' + x + '" y="' + y + '">' + letter + '</text>' +
      (dotted ? '<circle cx="' + (x + 7) + '" cy="' + (y - 4) + '" r="1.25"/>' : '');
    const positions = [[32,9],[54,32],[32,55],[10,32]];
    return '<figure><figcaption>' + title + '</figcaption><div class="key-diagrams">' +
      '<svg viewBox="0 0 64 64" role="img" aria-label="Gitter ' + grid.split('').join(' ') + '">' +
      path('M22 2v60M42 2v60M2 22h60M2 42h60') +
      [...grid].map((letter, i) => label(letter, 12 + i % 3 * 20, 12 + Math.floor(i / 3) * 20)).join('') +
      '</svg><svg viewBox="0 0 64 64" role="img" aria-label="Kreuz, von oben im Uhrzeigersinn: ' + cross.split('').join(' ') + '">' +
      path('M3 3l58 58M61 3L3 61') +
      [...cross].map((letter, i) => label(letter, ...positions[i])).join('') + '</svg></div></figure>';
  };
  return '<div class="symbol-header"><p>Suche den Buchstaben in der Schlüsseltafel. Die Linien um sein Feld bilden das Symbol.</p>' +
    '<aside class="symbol-key" aria-label="Freimaurer-Schlüsseltafel"><h3>Schlüsseltafel</h3><div class="key-pairs">' +
    key('Ohne Punkt', 'ABCDEFGHI', 'STUV', false) + key('Mit Punkt', 'JKLMNOPQR', 'WXYZ', true) +
    '</div></aside></div>';
}
function templarKey() {
  return '<div class="symbol-header"><p>Suche einen Buchstaben in der Schlüsseltafel und lies das Zeichen daneben ab.</p>' +
    '<aside class="symbol-key" aria-label="Templer-Schlüsseltafel"><h3>Schlüsseltafel</h3><div class="templar-key-grid">' +
    [...alphabet].map(letter => '<span><b>' + letter + '</b>' + symbol(letter) + '</span>').join('') + '</div></aside></div>';
}
function templarOrigin() {
  const arms = [0, 90, 180, 270].map(angle =>
    '<g transform="rotate(' + angle + ' 50 50)"><path class="cross-arm" d="M50 50L34 12l16 16 16-16Z"/>' +
    '<path class="cross-guide" d="M43.7 35h12.6M43.7 35L50 28l6.3 7"/></g>').join('');
  const stages = [
    ['Das Kreuz', '', 'Vier Arme mit je zwei Spitzen.'],
    ['Hilfslinien', '', 'Gedachte Linien unterteilen die Arme.'],
    ['Winkel · A–D', 'M34 12l16 16 16-16', 'Die V-Form entsteht an den Spitzen.'],
    ['Dreiecke · E–H', 'M43.7 35h12.6L50 50Z', 'Zwei Seiten und eine Hilfslinie bilden ein Dreieck.'],
    ['Rauten · I, K, L, M', 'M50 28l6.3 7L50 50l-6.3-15Z', 'Zwei Dreiecke bilden eine rautenartige Form.'],
    ['Kreuzmitte · N', 'M43.7 35l12.6 30M56.3 35L43.7 65', 'Die Linien treffen sich in der Mitte.']
  ];
  return '<details class="templar-origin"><summary>Wie entstehen die Zeichen aus dem Kreuz?</summary>' +
    '<div class="origin-grid">' + stages.map(([title, outline, description], i) =>
      '<figure><svg viewBox="0 0 100 100" aria-hidden="true"' + (i === 0 ? ' class="cross-only"' : '') + '>' +
      arms + (outline ? '<path class="cross-outline" d="' + outline + '"/>' : '') +
      '</svg><figcaption><b>' + title + '</b><br>' + description + '</figcaption></figure>').join('') + '</div>' +
    '<p>Durch Drehen entstehen weitere Zeichen. Ein Punkt unterscheidet die zweite Zeichengruppe. ' +
    'Die Skizzen zeigen das Prinzip. Die genauen, vereinfacht gezeichneten Zeichen des Labors findest du in der Schlüsseltafel. ' +
    'Für J nutzt das Labor ein Kreuzzeichen mit zusätzlichem Punkt.</p></details>';
}
function encodeTokens(text) {
  return Array.from(normalize(text), character => alphabet.includes(character)
    ? String(alphabet.indexOf(character) + 1).padStart(2, '0')
    : 'U+' + character.codePointAt(0).toString(16).toUpperCase()).join(' ');
}
function tokenParts(text) {
  return text.trim() ? text.trim().split(/\s+/).map(token => {
    if (/^(0[1-9]|1[0-9]|2[0-6])$/.test(token)) return {letter: alphabet[Number(token) - 1]};
    if (/^U\+[0-9A-F]{1,6}$/i.test(token) && parseInt(token.slice(2), 16) <= 0x10ffff) return {other: String.fromCodePoint(parseInt(token.slice(2), 16))};
    return {other: '�', invalid: true};
  }) : [];
}
function renderSymbols(id, tokens) {
  $(id).innerHTML = tokens.map(token => token.letter
    ? '<span class="glyph">' + symbol(token.letter) + '</span>'
    : '<span class="glyph punctuation">' + escape(token.other === ' ' ? '·' : token.other) + '</span>').join('');
  $(id).hidden = tokens.length === 0;
}
function showMode(next, focus = false) {
  mode = next;
  const [title, description, level, explanation, mission] = modes[mode];
  $('mode-title').textContent = title;
  $('description').textContent = description;
  $('level').textContent = level;
  $('explanation').textContent = explanation;
  $('vigenere-square')?.remove();
  if (mode === 'vigenere') $('explanation').insertAdjacentHTML('afterend', vigenereSquare());
  $('mission').textContent = mission;
  $('notice').textContent = '';
  document.querySelectorAll('[data-mode]').forEach(button => {
    if (button.dataset.mode === mode) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
  source.value = state().text;
  const controls = [];
  if (mode !== 'crack') controls.push('<fieldset><legend>Richtung</legend><div class="segment"><button data-direction="encode">Verschlüsseln</button><button data-direction="decode">Entschlüsseln</button></div></fieldset>');
  if (mode === 'keyword' || mode === 'vigenere' || mode === 'columnar') controls.push('<label>Codewort<input id="word" maxlength="36" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></label>');
  if (mode === 'caesar' || mode === 'keyword') controls.push('<fieldset><legend>Verschiebung</legend><div class="segment shift"><button data-shift="-1" aria-label="Verschiebung verkleinern">−</button><output id="shift-value"></output><button data-shift="1" aria-label="Verschiebung vergrößern">+</button></div></fieldset>');
  if (mode === 'caesar') controls.push('<fieldset><legend>Ansicht</legend><div class="segment"><button data-view="strip">Streifenalphabet</button><button data-view="wheel">Drehscheibe</button></div></fieldset>');
  if (mode === 'rail') controls.push('<label>Zeilen<select id="rows"><option>2</option><option>3</option><option>4</option><option>5</option></select></label>');
  const selectControl = (label, id, choices) => '<label>' + label + '<select id="' + id + '">' +
    choices.map(([value, text]) => '<option value="' + value + '">' + text + '</option>').join('') + '</select></label>';
  if (mode === 'affine') {
    controls.push(selectControl('Faktor a', 'factor', units.map(n => [n,n])));
    controls.push(selectControl('Verschiebung b', 'offset', [...alphabet].map((_,n) => [n,n])));
  }
  if (mode === 'hill') controls.push(selectControl('Schlüsselmatrix', 'matrix', matrices.map(([a,b,c,d],i) => [i, a + ' ' + b + ' / ' + c + ' ' + d])));
  $('controls').innerHTML = controls.join('');
  if ($('word')) $('word').value = state().word;
  if ($('rows')) $('rows').value = state().rows;
  for (const id of ['factor','offset','matrix']) if ($(id)) $(id).value = state()[id];
  if (focus) $('mode-title').focus();
  update();
}
function mapping() {
  if (mode === 'atbash') return [...alphabet].reverse().join('');
  return rotate(mode === 'keyword' ? keyword(state().word) : alphabet, state().shift);
}
function strip(key, active) {
  const highlights = mode === 'keyword' ? letters(state().word) : '';
  const row = (name, chars, activeChar, keywordLetters = '') => '<div class="strip-line"><strong>' + name + '</strong><div class="letters">' +
    [...chars].map(char => {
      const classes = [char === activeChar ? 'lit' : '', keywordLetters.includes(char) ? 'keyword-letter' : ''].filter(Boolean);
      return '<span class="' + classes.join(' ') + '">' + char + '</span>';
    }).join('') + '</div></div>';
  return '<div class="strips" ' + (['caesar','keyword'].includes(mode) ? 'data-drag="true"' : '') + '>' +
    row('Klaralphabet', alphabet, active) + row('Geheimalphabet', key, key[alphabet.indexOf(active)], highlights) + '</div>';
}
function wheel(key, active) {
  const ring = (chars, radius, mark) => [...chars].map((letter, index) => {
    const angle = index * 2 * Math.PI / 26 - Math.PI / 2;
    return '<text x="' + (160 + radius * Math.cos(angle)).toFixed(1) + '" y="' + (160 + radius * Math.sin(angle)).toFixed(1) +
      '"' + (letter === mark ? ' class="wheel-lit"' : '') + '>' + letter + '</text>';
  }).join('');
  return '<div class="wheel-wrap"><svg viewBox="0 0 320 320" role="img" aria-label="Cäsar-Drehscheibe: außen Klaralphabet, innen Geheimalphabet">' +
    '<circle cx="160" cy="160" r="151"/><circle cx="160" cy="160" r="119"/><circle cx="160" cy="160" r="87"/>' +
    ring(alphabet, 134, active) + ring(key, 102, key[alphabet.indexOf(active)]) +
    '<text class="wheel-key" x="160" y="153">+' + state().shift + '</text><text x="160" y="182">Verschiebung</text></svg></div>';
}
function vigenereSquare() {
  const header = [...alphabet].map(letter => '<th scope="col">' + letter + '</th>').join('');
  const rows = [...alphabet].map((letter, shift) => '<tr><th scope="row">' + letter + '</th>' +
    [...rotate(alphabet, shift)].map(cell =>
      '<td' + (letter === 'C' && cell === 'J' ? ' class="square-example"' : '') + '>' + cell + '</td>').join('') +
    '</tr>').join('');
  return '<div id="vigenere-square"><p>Wähle links den <b>Codebuchstaben</b> und oben den <b>Klartextbuchstaben</b>. ' +
    'Am Schnittpunkt steht der Geheimtextbuchstabe. Beispiel: Codebuchstabe <b>C</b> und Klartext <b>H</b> ergeben <b>J</b>. ' +
    'Zum Entschlüsseln suche in der Codezeile den Geheimtextbuchstaben und lies oben den Klartext ab.</p>' +
    '<div class="square-scroll" role="region" tabindex="0" aria-label="Vigenère-Quadrat, seitlich scrollbar">' +
    '<table class="cipher-square"><caption>Vigenère-Quadrat</caption><thead><tr><th scope="col">Code ↓</th>' +
    header + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}
function frequencies(text) {
  const counts = Object.fromEntries([...alphabet].map(letter => [letter, 0]));
  for (const letter of letters(text)) counts[letter]++;
  return Object.entries(counts).filter(([, count]) => count > 0).sort((a,b) => b[1] - a[1]).slice(0,8)
    .map(([letter, count]) => '<span>' + letter + ' <b>' + count + '</b></span>').join('');
}
function update() {
  const s = state();
  const usesSymbols = symbolMode();
  const mapMode = ['caesar','keyword','atbash'].includes(mode);
  $('shift-value')?.replaceChildren('+' + s.shift);
  bench.querySelectorAll('[data-direction]').forEach(btn => btn.setAttribute('aria-pressed', String((btn.dataset.direction === 'decode') === s.reverse)));
  bench.querySelectorAll('[data-view]').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.view === s.view)));
  $('source-label').textContent = s.reverse || mode === 'crack' ? 'Geheimtext' : 'Klartext';
  $('result-label').textContent = s.reverse || mode === 'crack' ? 'Klartext' : 'Geheimtext';
  $('symbol-input').hidden = $('symbol-result').hidden = true;
  source.hidden = usesSymbols && s.reverse;
  result.hidden = usesSymbols && !s.reverse;
  result.parentElement.hidden = mode === 'crack';
  $('copy').hidden = mode === 'crack' || (usesSymbols && !s.reverse);
  $('use-result').hidden = mode === 'crack';
  source.maxLength = symbolMode() && s.reverse ? 14000 : 1200;
  source.placeholder = 'Schreib eine Nachricht …';
  $('convention').textContent = 'A–Z · Ä → AE, Ö → OE, Ü → UE, ß → SS. Andere Zeichen bleiben erhalten.';
  let visual;
  let answer;
  if (mapMode) {
    const key = mapping();
    answer = substitute(s.text, key, s.reverse);
    const input = letters(s.text);
    s.step = Math.min(s.step, Math.max(input.length - 1, 0));
    const char = input[s.step];
    const active = s.reverse && char ? alphabet[key.indexOf(char)] : char;
    visual = s.view === 'wheel' && mode === 'caesar' ? wheel(key, active) : strip(key, active);
    if (mode === 'keyword') visual += '<p class="caption">Codewort ohne Wiederholungen · <b>' + escape([...new Set(letters(s.word))].join('') || '—') + '</b></p>';
    if (mode === 'caesar' && s.view === 'strip') visual += '<p class="caption">Verschiebe den Streifen per Ziehen oder mit − und +.</p>';
    if (char) visual += '<div class="stepper"><button data-step="-1" aria-label="Vorheriger Buchstabe" ' + (s.step === 0 ? 'disabled' : '') + '>‹</button>' +
      '<span><b>' + char + ' → ' + (s.reverse ? active : key[alphabet.indexOf(active)]) + '</b> · ' + (s.step + 1) + ' / ' + input.length + '</span>' +
      '<button data-step="1" aria-label="Nächster Buchstabe" ' + (s.step === input.length - 1 ? 'disabled' : '') + '>›</button></div>';
  } else if (symbolMode()) {
    const tokens = tokenParts(s.reverse ? s.text : encodeTokens(s.text));
    answer = s.reverse ? tokens.map(token => token.letter || token.other).join('') : encodeTokens(s.text);
    renderSymbols(s.reverse ? 'symbol-input' : 'symbol-result', tokens);
    if (s.reverse) $('source-label').textContent = 'Angetippte Symbole';
    $('convention').textContent = s.reverse
      ? 'Tippe die Symbole deiner Nachricht der Reihe nach an. Der Klartext erscheint darunter.'
      : 'Die Zeichen erscheinen im Geheimtext. Mit „Ergebnis übernehmen“ kannst du sie direkt entschlüsseln.';
    visual = mode === 'pigpen' ? pigpenKey() : templarKey() + templarOrigin();
    if (s.reverse) {
      visual += '<div class="symbol-table">' + [...alphabet].map((letter, i) =>
        '<button data-token="' + String(i + 1).padStart(2,'0') + '" aria-label="Zeichen für ' + letter + '">' +
        symbol(letter) + '</button>').join('') +
        '<button data-token="U+20">Leerzeichen</button><button data-token="back">Letztes Zeichen löschen</button></div>';
    }
  } else if (mode === 'columnar') {
    const code = letters(s.word);
    answer = columnar(s.text, code, s.reverse);
    const chars = Array.from(normalize(s.reverse ? answer : s.text)).slice(0,72);
    const order = columnOrder(code);
    visual = code.length < 2 ? '<p>Das Codewort braucht mindestens zwei Buchstaben.</p>' :
      '<div class="square-scroll" tabindex="0" aria-label="Spaltentabelle"><table class="cipher-square"><caption>Spalten in Ablesereihenfolge nummeriert</caption><thead><tr>' +
      [...code].map((char,i) => '<th scope="col">' + char + ' · ' + (order.indexOf(i)+1) + '</th>').join('') +
      '</tr></thead><tbody>' + Array.from({length:Math.ceil(chars.length/code.length)}, (_,row) => '<tr>' +
      [...code].map((_,i) => '<td>' + escape((chars[row*code.length+i] || '').replace(' ','·')) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>';
  } else if (mode === 'affine') {
    const key = affineKey(s.factor,s.offset);
    answer = substitute(s.text,key,s.reverse);
    visual = '<p><b>Geheimtextzahl = (' + s.factor + ' × Klartextzahl + ' + s.offset + ') mod 26</b></p>' + strip(key);
  } else if (mode === 'hill') {
    const matrix = matrices[s.matrix];
    answer = hill(s.text,matrix,s.reverse);
    const input = letters(s.text);
    if (input.length % 2) $('notice').textContent = s.reverse ? 'Der Geheimtext braucht eine gerade Buchstabenzahl.' : 'Ein X wurde als Füllzeichen ergänzt.';
    else $('notice').textContent = '';
    $('convention').textContent = 'Hill verwendet nur Buchstaben A–Z. Umlaute werden ausgeschrieben.';
    const [a,b,c,d] = matrix;
    const pair = ((!s.reverse ? input : answer) + 'X').slice(0,2);
    visual = '<p><b>Schlüsselmatrix</b></p><table class="hill-matrix" aria-label="Schlüsselmatrix"><tr><td>' + a +
      '</td><td>' + b + '</td></tr><tr><td>' + c + '</td><td>' + d + '</td></tr></table>';
    if (pair.length === 2 && answer) {
      const [x,y] = [...pair].map(char => alphabet.indexOf(char));
      visual += '<p>Erstes Klartextpaar <b>' + pair + '</b> → (' + x + ', ' + y + ')</p><p>(' +
        a + ' × ' + x + ' + ' + b + ' × ' + y + ') mod 26 = ' + mod(a*x+b*y) + ' · (' +
        c + ' × ' + x + ' + ' + d + ' × ' + y + ') mod 26 = ' + mod(c*x+d*y) + ' → <b>' + hill(pair,matrix) + '</b></p>';
    }
  } else if (mode === 'rail') {
    answer = rail(s.text, s.rows, s.reverse);
    const chars = Array.from(normalize(s.reverse ? answer : s.text)).slice(0,24);
    const route = railPath(chars.length, s.rows);
    visual = chars.length ? '<div class="rail-rows">' + Array.from({length:s.rows}, (_, i) =>
      '<div>' + chars.map((char, j) => '<span>' + (route[j] === i ? escape(char === ' ' ? '·' : char) : '') + '</span>').join('') + '</div>').join('') + '</div>' +
      (letters(s.text).length > 24 ? '<p class="caption">Zickzack-Vorschau der ersten 24 Zeichen.</p>' : '') : '<p>Gib Text ein, um den Zickzack-Weg zu sehen.</p>';
  } else if (mode === 'vigenere') {
    const code = letters(s.word);
    answer = vigenere(s.text, code, s.reverse);
    const input = letters(s.text).slice(0,24);
    visual = code && input ? '<div class="vigenere">' + [...input].map((char,i) => '<span><b>' + char +
      '</b><small>' + code[i % code.length] + ' · ' + alphabet.indexOf(code[i % code.length]) + '</small><b>' +
      letters(answer)[i] + '</b></span>').join('') + '</div><p class="caption">Oben Eingabe · Mitte Schlüsselbuchstabe und Verschiebung · unten Ergebnis</p>' :
      '<p>Gib ein Codewort und einen Text ein.</p>';
  } else {
    answer = '';
    visual = s.text.trim() ? '<h3>Buchstabenhäufigkeit</h3><div class="frequency">' + frequencies(s.text) +
      '</div><h3>Alle 26 Verschiebungen</h3><ol class="attempts">' + Array.from({length:26}, (_, shift) =>
      '<li><b>+' + shift + '</b><span>' + escape(substitute(s.text, rotate(alphabet, shift), true)) + '</span></li>').join('') +
      '</ol>' : '<p>Gib einen Cäsar-Geheimtext ein oder setze ein Beispiel ein.</p>';
  }
  const previousScroll = $('visual').querySelector('.strips')?.scrollLeft || 0;
  $('visual').innerHTML = visual;
  const strips = $('visual').querySelector('.strips');
  if (strips) strips.scrollLeft = previousScroll;
  result.value = answer;
  $('copy').disabled = $('use-result').disabled = !answer;
}
source.addEventListener('input', () => { state().text = source.value; state().step = 0; $('notice').textContent = ''; update(); });
document.querySelector('.rack').addEventListener('click', event => {
  const button = event.target.closest('[data-mode]');
  if (button) showMode(button.dataset.mode, true);
});
bench.addEventListener('input', event => {
  if (!['word','rows','factor','offset','matrix'].includes(event.target.id)) return;
  if (event.target.id === 'word') state().word = event.target.value;
  else state()[event.target.id] = Number(event.target.value);
  update();
});
bench.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;
  const s = state();
  const {direction, shift, view, step, token} = button.dataset;
  $('notice').textContent = '';
  if (direction) {
    const reverse = direction === 'decode';
    if (s.reverse === reverse) return;
    if (symbolMode()) s.text = result.value;
    s.reverse = reverse;
    s.step = 0;
  }
  if (shift) s.shift = mod(s.shift + Number(shift));
  if (view) s.view = view;
  if (step) s.step += Number(step);
  if (token) {
    const digits = s.text.trim() ? s.text.trim().split(/\s+/) : [];
    if (token === 'back') digits.pop();
    else if (s.text.length + token.length + 1 <= source.maxLength) digits.push(token);
    s.text = digits.join(' ');
  }
  if (button.id === 'example') {
    const example = 'DER SCHATZ IST HIER';
    if (mode === 'crack') s.text = substitute(example, rotate(alphabet, 7));
    else if (!s.reverse) s.text = example;
    else if (symbolMode()) s.text = encodeTokens(example);
    else if (mode === 'columnar') s.text = columnar(example,s.word);
    else if (mode === 'affine') s.text = substitute(example,affineKey(s.factor,s.offset));
    else if (mode === 'hill') s.text = hill(example,matrices[s.matrix]);
    else if (mode === 'rail') s.text = rail(example, s.rows);
    else if (mode === 'vigenere') s.text = vigenere(example, s.word);
    else s.text = substitute(example, mapping());
    s.step = 0;
  }
  if (button.id === 'clear') { s.text = ''; s.step = 0; }
  if (button.id === 'use-result') { s.text = result.value; s.reverse = !s.reverse; s.step = 0; }
  if (button.id === 'copy') {
    try {
      await navigator.clipboard.writeText(result.value);
      $('notice').textContent = 'Kopiert.';
    } catch {
      result.focus();
      result.select();
      $('notice').textContent = 'Ergebnis markiert. Kopiere es über das Kontextmenü oder mit Strg+C.';
    }
    return;
  }
  if (source.value !== s.text) source.value = s.text;
  update();
  if (step) bench.querySelector('[data-step="' + step + '"]:not(:disabled)')?.focus();
  if (token) bench.querySelector('[data-token="' + token + '"]')?.focus();
});
$('visual').addEventListener('pointerdown', event => {
  const track = event.target.closest('[data-drag] .strip-line:last-child');
  if (!track || event.button !== 0) return;
  drag = {x:event.clientX, shift:state().shift, id:event.pointerId};
  $('visual').setPointerCapture(event.pointerId);
});
$('visual').addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const next = mod(drag.shift + Math.round((drag.x - event.clientX) / 32));
  if (next !== state().shift) { state().shift = next; update(); }
});
for (const event of ['pointerup','pointercancel','lostpointercapture']) $('visual').addEventListener(event, () => { drag = undefined; });
showMode(mode);










