/* LeeLEEJG · alinear lo que oye el reconocimiento con el texto de la historia (31/10/2026)
   El oído del iPad (y el del ordenador) escribe lo que oye a trozos y con «ruido»: palabras partidas en sílabas
   («ma ma di los dos fuss» = «mamá diplodocus»), palabras parecidas («siervo» = «ciervo»), cosas que dicen otras
   personas («hola», «sí»)… Antes se buscaba palabra a palabra en orden estricto y en cuanto se escapaba una se atascaba.
   Ahora se busca el mejor emparejamiento de TODO lo oído con TODO el texto (programación dinámica):
   - se compara por cómo SUENA (b/v, c/z/s, ll/y, h muda, qu/k, g/j…),
   - se admiten trozos de 1 a 3 piezas oídas para una palabra (lectura sílaba a sílaba) y una pieza para dos palabras («alago» = «al lago»),
   - se puede saltar lo que no es de la historia y las palabras que no se oyeron, sin perder el sitio.
   Funciona igual en el navegador y en node (para las pruebas con lecturas reales). */
'use strict';
const ALINEA = (() => {
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '').replace(/ñ/g, 'n');
  /* cómo suena (español de España, simplificado) */
  function fon(w) {
    let s = norm(w);
    if (!s) return '';
    s = s.replace(/ch/g, 'C').replace(/h/g, '').replace(/C/g, 'ch')
      .replace(/qu([ei])/g, 'k$1').replace(/gu([ei])/g, 'g$1').replace(/gü/g, 'gu')
      .replace(/c([ei])/g, 's$1').replace(/z/g, 's').replace(/c/g, 'k').replace(/q/g, 'k')
      .replace(/g([ei])/g, 'j$1').replace(/x/g, 'ks').replace(/v/g, 'b').replace(/w/g, 'u')
      .replace(/ll/g, 'y').replace(/y$/, 'i').replace(/y([^aeiou]|$)/g, 'i$1').replace(/rr/g, 'r')
      .replace(/(.)\1+/g, '$1');
    return s;
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j), cur = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      [prev, cur] = [cur, prev];
    }
    return prev[n];
  }
  /* lo que vale acertar una palabra: las cortas (el, la, y) valen poco porque salen en cualquier parte */
  const peso = w => w.length <= 1 ? 0.3 : w.length === 2 ? 0.5 : w.length === 3 ? 0.75 : 1;
  /* parecido entre lo oído (t) y la palabra (w), ya en «cómo suena»: 0 (nada) … 1 (igual) */
  function parecido(t, w, varias) {
    if (!t || !w) return 0;
    if (t === w) return 1;
    if (w.length <= 3) return 0;   // las cortas, iguales o nada
    const r = 1 - lev(t, w) / Math.max(t.length, w.length);
    const min = varias ? 0.8 : w.length >= 8 ? 0.6 : w.length >= 6 ? 0.66 : 0.8;   // 4-5 letras: como mucho una letra distinta
    let s = r >= min ? r : 0;
    // un trozo claro de la palabra (empezada o acabada): «saurio» de «braquiosaurio», «murcie» de «murciélago»
    if (!varias && t.length >= 4 && (w.startsWith(t) || w.endsWith(t)) && t.length / w.length >= 0.4) s = Math.max(s, 0.55);
    return s;
  }
  /* esperadas: palabras de la historia; oidas: lo oído, en orden. Devuelve para cada palabra el índice de la pieza
     oída con que casa (o -1) y una puntuación de 0 a 1. */
  function alinear(esperadas, oidas) {
    const E = esperadas.map(fon), n = E.length;
    const T = oidas.map(fon).filter(Boolean), m = T.length;
    const W = E.map(peso);
    // f[i][j]: lo mejor con las i primeras palabras y las j primeras piezas
    const f = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
    const de = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));   // 0 empezar, 1 salta palabra, 2 salta pieza, 3+L casa con L piezas, 7 dos palabras en una pieza
    const val = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
    // trozos de 2 y 3 piezas cortas seguidas (lectura sílaba a sílaba), preparados una vez
    const C = [null, T, T.map((x, j) => j >= 1 && x.length <= 5 && T[j - 1].length <= 5 ? T[j - 1] + x : null),
      T.map((x, j) => j >= 2 && x.length <= 5 && T[j - 1].length <= 5 && T[j - 2].length <= 5 ? T[j - 2] + T[j - 1] + x : null)];
    for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
      if (i === 0 && j === 0) continue;
      let best = -1, how = 0, v = 0;
      if (i > 0 && f[i - 1][j] > best) { best = f[i - 1][j]; how = 1; }
      if (j > 0 && f[i][j - 1] >= best) { best = f[i][j - 1]; how = 2; }
      if (i > 0) {
        for (let L = 1; L <= 3 && L <= j; L++) {
          const t = C[L][j - 1]; if (!t) break;   // juntar solo trozos cortos (sílabas)
          const s = parecido(t, E[i - 1], L > 1);
          if (s > 0) { const c = f[i - 1][j - L] + W[i - 1] * s * (L > 1 ? 0.95 : 1); if (c > best) { best = c; how = 3 + L; v = s; } }
        }
        if (i > 1 && j > 0 && E[i - 2].length + E[i - 1].length >= 5) {
          const dos = E[i - 2] + E[i - 1], t1 = T[j - 1];
          const s = t1.length >= dos.length - 1 && lev(t1, dos) <= 1 ? parecido(t1, dos, true) : 0;
          if (s >= 0.8) { const c = f[i - 2][j - 1] + (W[i - 2] + W[i - 1]) * s; if (c > best) { best = c; how = 7; v = s; } }
        }
      }
      f[i][j] = best; de[i][j] = how; val[i][j] = v;
    }
    const tok = new Array(n).fill(-1), punt = new Array(n).fill(0);
    let i = n, j = m;
    while (i > 0 || j > 0) {
      const h = de[i][j];
      if (h === 1) i--; else if (h === 2) j--;
      else if (h >= 4 && h <= 6) { const L = h - 3; tok[i - 1] = j - L; punt[i - 1] = val[i][j]; i--; j -= L; }
      else if (h === 7) { tok[i - 1] = tok[i - 2] = j - 1; punt[i - 1] = punt[i - 2] = val[i][j]; i -= 2; j--; }
      else break;
    }
    return { tok, punt, piezas: m };
  }
  /* ¿qué palabras se han leído? las que casan, y las cortas (el, la, en, y…) entre dos que casan cerca */
  function leidas(esperadas, oidas) {
    const r = alinear(esperadas, oidas), n = esperadas.length;
    const corta = k => norm(esperadas[k]).length <= 3;
    // una palabra corta suelta (la, el, y…) sale en cualquier parte: solo cuenta pegada a una larga que case
    const ok = r.tok.map((t, k) => t >= 0 && (!corta(k) || r.tok.some((u, g) => u >= 0 && !corta(g) && Math.abs(g - k) <= 2 && Math.abs(u - t) <= 3)));
    for (let k = 0; k < n; k++) {
      if (ok[k] || !corta(k)) continue;
      let a = k - 1; while (a >= 0 && !ok[a] && corta(a)) a--;
      let b = k + 1; while (b < n && !ok[b] && corta(b)) b++;
      if (a >= 0 && b < n && ok[a] && ok[b] && b - a <= 4) ok[k] = 'corta';
    }
    return { ...r, ok };
  }
  /* por dónde va leyendo (para el subrayado en directo): la última palabra que casa, sin dar saltos grandes por una
     sola palabra suelta (hacen falta dos que casen cerca para saltar más de 6 palabras de golpe) */
  function puntero(ok, antes) {
    antes = antes || 0;
    const casan = []; ok.forEach((v, k) => { if (v === true) casan.push(k); });
    let p = antes;
    for (const k of casan) {
      if (k + 1 <= p) continue;
      if (k + 1 - p <= 6 || casan.some(g => g < k && g >= k - 4 && g + 1 > p - 6)) p = k + 1;
    }
    return p;
  }
  return { fon, lev, parecido, alinear, leidas, puntero, norm };
})();
if (typeof module !== 'undefined') module.exports = ALINEA;
