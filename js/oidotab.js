/* LeeLEEJG · oído del iPad sin internet (31/10/2026)
   El reconocimiento de Safari no sabe qué historia lee el niño y apenas acierta una de cada tres palabras largas.
   Aquí se usa Vosk dentro del propio aparato (vosk-browser, WebAssembly, licencia Apache 2.0) con el modelo pequeño
   de español (vosk-model-small-es-0.3, Apache 2.0) y una GRAMÁTICA: solo puede oír las palabras de la historia
   y sus sílabas, como el oído del ordenador. La voz del niño no sale del aparato.
   - El modelo (34 MB) se baja una vez con internet y se guarda en el aparato (IndexedDB); después funciona sin internet.
   - js/vosk-worker.js es el «worker» de vosk-browser con el WebAssembly dentro (sin tocar).
   - En el ordenador con el programa instalado se sigue usando el oído del programa (Vosk en Python). */
'use strict';
const OIDOTAB = (() => {
  const MODELO = 'modelos/vosk-es.tar.gz';
  let w = null, estado = 'no', motivo = '', prom = null, n = 0, t0 = 0;
  const soporta = () => typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined' && typeof indexedDB !== 'undefined';
  function cargar() {
    if (prom) return prom;
    if (!soporta()) { estado = 'error'; motivo = 'Este aparato no lo admite'; return (prom = Promise.resolve(false)); }
    estado = 'cargando'; t0 = performance.now();
    prom = new Promise(res => {
      let hecho = false;
      const fin = (ok, m) => { if (hecho) return; hecho = true; estado = ok ? 'listo' : 'error'; motivo = m || ''; if (!ok) { try { w && w.terminate(); } catch (e) {} w = null; prom = null; }
        try { registrar('Oído del aparato: ' + (ok ? 'listo en ' + Math.round((performance.now() - t0) / 1000) + ' s' : 'no disponible (' + motivo + ')')); } catch (e) {}
        res(ok); };
      try {
        w = new Worker('js/vosk-worker.js');
        w.addEventListener('message', ev => { const d = ev.data || {}; if (d.event === 'load') fin(!!d.result, d.result ? '' : 'no se pudo cargar'); else if (d.error && !d.recognizerId && !hecho) fin(false, String(d.error)); });
        w.addEventListener('error', e => fin(false, (e && e.message) || 'error'));
        w.postMessage({ action: 'set', key: 'logLevel', value: -1 });
        w.postMessage({ action: 'load', modelUrl: new URL(MODELO, document.baseURI).href });
        setTimeout(() => fin(false, 'tarda demasiado (¿sin internet la primera vez?)'), 240000);
      } catch (e) { fin(false, e.message); }
    });
    return prom;
  }
  /* una escucha: gramática = palabras y sílabas de la historia; alRes recibe {finales:[{w,s}], parcial:''} */
  function nuevo(gramatica, sampleRate, alRes) {
    if (estado !== 'listo' || !w) return null;
    const id = 'r' + (++n) + '_' + Date.now().toString(36);
    const finales = []; let parcial = '', ultimo = performance.now(), cerrado = false;
    const h = ev => { const d = ev.data || {}; if (d.recognizerId !== id) return; ultimo = performance.now();
      if (d.event === 'result' && d.result) { (d.result.result || []).forEach(x => { if (x.word && x.word !== '[unk]') finales.push({ w: x.word, s: +(+x.start || 0).toFixed(2) }); }); parcial = ''; alRes({ finales, parcial }); }
      else if (d.event === 'partialresult' && d.result) { parcial = String(d.result.partial || '').replace(/\[unk\]/g, '').trim(); alRes({ finales, parcial }); } };
    w.addEventListener('message', h);
    const lista = [...new Set(gramatica.map(x => String(x).toLowerCase()).filter(x => x && x.length <= 30))].slice(0, 1500);
    w.postMessage({ action: 'create', recognizerId: id, sampleRate, grammar: JSON.stringify([...lista, '[unk]']) });
    w.postMessage({ action: 'set', recognizerId: id, key: 'words', value: true });
    return {
      enviar(f32) { if (cerrado || !w) return; const d = new Float32Array(f32.length); for (let i = 0; i < f32.length; i++) d[i] = f32[i] * 32768; w.postMessage({ action: 'audioChunk', recognizerId: id, data: d, sampleRate }, [d.buffer]); },
      /* termina y espera lo último que oyó (como mucho 3 s) */
      cerrar() { if (cerrado) return Promise.resolve({ finales, parcial }); cerrado = true;
        return new Promise(res => { try { w.postMessage({ action: 'remove', recognizerId: id }); } catch (e) {}
          const t = setInterval(() => { if (performance.now() - ultimo > 700) { clearInterval(t); w && w.removeEventListener('message', h); res({ finales, parcial: '' }); } }, 150);
          setTimeout(() => { clearInterval(t); w && w.removeEventListener('message', h); res({ finales, parcial: '' }); }, 3000); }); }
    };
  }
  return { cargar, nuevo, soporta, get estado() { return estado; }, get motivo() { return motivo; } };
})();
/* se prepara al abrir el programa (en el iPad), para que esté listo cuando lea */
window.addEventListener('load', () => setTimeout(() => {
  try { if (typeof EST !== 'undefined' && EST.oido !== 'vosk' && !(typeof aj !== 'undefined' && aj && aj.oidoTab === 'no')) OIDOTAB.cargar(); } catch (e) {}
}, 5000));
