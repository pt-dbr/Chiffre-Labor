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
  return {alphabet, normalize, letters, mod, rotate, keyword, substitute, vigenere, railPath, rail};
})();
if (typeof module !== 'undefined') module.exports = Cipher;
