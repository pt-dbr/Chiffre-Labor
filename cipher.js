'use strict';
const Cipher = (() => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const mod = n => ((n % 26) + 26) % 26;
  const normalize = text => text.normalize('NFC').replace(/[Ää]/g, 'AE').replace(/[Öö]/g, 'OE')
    .replace(/[Üü]/g, 'UE').replace(/[ßẞ]/g, 'SS').replace(/[a-z]/g, letter => letter.toUpperCase());
  const letters = text => normalize(text).replace(/[^A-Z]/g, '');
  const rotate = (text, n) => text.slice(mod(n)) + text.slice(0, mod(n));
  const keyword = text => [...new Set(letters(text) + alphabet)].join('');
  function substitute(text, key, reverse = false) {
    const from = reverse ? key : alphabet;
    const to = reverse ? alphabet : key;
    return normalize(text).replace(/[A-Z]/g, letter => to[from.indexOf(letter)]);
  }
  function vigenere(text, word, reverse = false) {
    const key = letters(word);
    if (!key) return '';
    let position = 0;
    return normalize(text).replace(/[A-Z]/g, letter => {
      const shift = alphabet.indexOf(key[position++ % key.length]);
      return alphabet[mod(alphabet.indexOf(letter) + shift * (reverse ? -1 : 1))];
    });
  }
  function railPath(length, rows) {
    const cycle = 2 * (rows - 1);
    return Array.from({length}, (_, i) => Math.min(i % cycle, cycle - i % cycle));
  }
  function rail(text, rows, reverse = false) {
    const chars = Array.from(normalize(text));
    const path = railPath(chars.length, rows);
    const positions = Array.from({length: rows}, () => []);
    path.forEach((row, i) => positions[row].push(i));
    const order = positions.flat();
    if (!reverse) return order.map(i => chars[i]).join('');
    const decoded = new Array(chars.length);
    order.forEach((position, i) => { decoded[position] = chars[i]; });
    return decoded.join('');
  }
  function columnOrder(word) {
    return [...letters(word)].map((letter, index) => ({letter,index}))
      .sort((a,b) => a.letter.charCodeAt(0) - b.letter.charCodeAt(0) || a.index - b.index)
      .map(({index}) => index);
  }
  function columnar(text, word, reverse = false) {
    const chars = Array.from(normalize(text));
    const order = columnOrder(word);
    if (order.length < 2) return '';
    const indices = order.flatMap(start => {
      const positions = [];
      for (let i = start; i < chars.length; i += order.length) positions.push(i);
      return positions;
    });
    if (!reverse) return indices.map(i => chars[i]).join('');
    const output = new Array(chars.length);
    indices.forEach((position, i) => { output[position] = chars[i]; });
    return output.join('');
  }
  const units = [...alphabet].map((_, i) => i).filter(i => [...alphabet].some((_, j) => mod(i * j) === 1));
  const inverse = n => units.find(i => mod(i * n) === 1);
  function affineKey(a, b) {
    return [...alphabet].map((_, i) => alphabet[mod(a * i + b)]).join('');
  }
  const matrices = [[3,3,2,5],[5,8,17,3]];
  function hill(text, matrix, reverse = false) {
    let input = letters(text);
    const [a,b,c,d] = matrix;
    const factor = inverse(a*d-b*c);
    if (factor === undefined || (reverse && input.length % 2)) return '';
    if (input.length % 2) input += 'X';
    const [p,q,r,s] = reverse ? [d,-b,-c,a].map(value => mod(value * factor)) : matrix;
    let out = '';
    for (let i = 0; i < input.length; i += 2) {
      const x = alphabet.indexOf(input[i]);
      const y = alphabet.indexOf(input[i+1]);
      out += alphabet[mod(p*x + q*y)] + alphabet[mod(r*x + s*y)];
    }
    return out;
  }
  return {alphabet, normalize, letters, mod, rotate, keyword, substitute, vigenere, railPath, rail,
    columnOrder, columnar, units, affineKey, matrices, hill};
})();
if (typeof module !== 'undefined') module.exports = Cipher;

