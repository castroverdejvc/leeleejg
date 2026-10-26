/* LeeLEEJG · servidor dentro del aparato (tablet o móvil, sin ordenador)
   Responde a las mismas rutas que programa/app.py, pero guarda todo en el propio aparato (IndexedDB).
   También guarda el programa y las fotos para que funcione sin internet.
   En el ordenador con «Iniciar LeeLEEJG» este fichero no se usa. */
'use strict';
const VERSION = '7.8';   // la misma que app.py (preparar_tablet.py lo comprueba)
const CACHE_PROG = 'leeleejg-programa';      // el programa (se renueva cuando cambia precache.json)
const CACHE_FUENTES = 'leeleejg-fuentes';    // letras de Google Fonts, guardadas la primera vez
const ID_OK = /^[A-Za-z0-9_-]{1,64}$/;
const CLAVE_OK = /^[a-z0-9_]{1,40}$/;
const NUEVA_OK = /^[A-Za-z0-9_-]{1,60}\.json$/;
const PATRON_PAL = /\[([^|\]]+)\|([a-z0-9_]+)\]/g;
const MUNDO_DE_TEMA = {futbol: 'liga'};
/* La IA (Claude) solo funciona en el ordenador: aquí no hay clave ni se llama a internet para eso */
const IA_SOLO_PC = 'Disponible en el ordenador: la IA funciona allí y lo que prepara llega aquí al juntar los datos.';

/* ---------------- IndexedDB ---------------- */
let dbProm = null;
function db(){
  if(dbProm) return dbProm;
  dbProm = new Promise((res, rej)=>{
    const r = indexedDB.open('leeleejg', 1);
    r.onupgradeneeded = () => { const d=r.result;
      d.createObjectStore('kv'); d.createObjectStore('sesiones', {keyPath:'id'}); d.createObjectStore('audios');
      d.createObjectStore('papelera'); d.createObjectStore('imagenes'); d.createObjectStore('nuevas'); };
    r.onsuccess = () => res(r.result); r.onerror = () => { dbProm=null; rej(r.error); };
  });
  return dbProm;
}
async function tx(almacen, modo, fn){
  const d = await db();
  return new Promise((res, rej)=>{
    const t = d.transaction(almacen, modo); const s = t.objectStore(almacen); let out;
    const r = fn(s); if(r) r.onsuccess = () => { out = r.result; };
    t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  });
}
const leer = (al, k) => tx(al, 'readonly', s=>s.get(k));
const poner = (al, v, k) => tx(al, 'readwrite', s=> k===undefined ? s.put(v) : s.put(v, k));
const quitar = (al, k) => tx(al, 'readwrite', s=>s.delete(k));
const todos = al => tx(al, 'readonly', s=>s.getAll());
const claves = al => tx(al, 'readonly', s=>s.getAllKeys());

async function aparato(){
  let a = await leer('kv', 'aparato');
  if(!a){ a = {id: 'ap_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8), nombre: 'Tablet'}; await poner('kv', a, 'aparato'); }
  return a;
}
async function registrar(m){
  try{ const r = (await leer('kv','registro')) || []; r.push(new Date().toISOString().slice(0,19).replace('T',' ') + '  ' + String(m).slice(0,500)); await poner('kv', r.slice(-300), 'registro'); }catch(e){}
}

/* ---------------- respuestas ---------------- */
const json = (d, st=200) => new Response(JSON.stringify(d), {status:st, headers:{'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'}});
const binario = (blob, tipo) => new Response(blob, {status:200, headers:{'Content-Type': tipo || blob.type || 'application/octet-stream', 'Cache-Control':'no-store'}});
const esJPEG = async blob => { const b = new Uint8Array(await blob.slice(0,2).arrayBuffer()); return b[0]===0xFF && b[1]===0xD8; };

/* ---------------- historias nuevas (igual que revisar_historia de app.py) ---------------- */
function calculoValido(c){
  try{
    return !!(c && typeof c==='object' && ['suma','resta','contar'].includes(c.tipo) && String(c.q||'').trim()
      && Number.isInteger(c.resultado) && c.resultado>=0 && c.resultado<=20
      && Array.isArray(c.ops) && c.ops.length>=2 && c.ops.length<=4 && Number.isInteger(c.ok) && c.ok>=0 && c.ok<c.ops.length
      && (c.cuenta==null || (Array.isArray(c.cuenta) && c.cuenta.every(k=>typeof k==='string'))));
  }catch(e){ return false; }
}
function revisarHistoria(h, mundos){
  if(!h || typeof h!=='object' || Array.isArray(h)) return [null, 'no es una historia'];
  const t = String(h.titulo||'').trim(); if(!t) return [null, 'sin título'];
  const m0 = h.mundo || h.tema; const m = MUNDO_DE_TEMA[m0] || m0;
  if(!mundos.has(m)) return [null, t+': tema desconocido ('+m+')'];
  const lineas = h.lineas;
  if(!Array.isArray(lineas) || !lineas.length || !lineas.every(x=>typeof x==='string' && x.trim()) || lineas.length>14) return [null, t+': líneas no válidas'];
  let nivel = parseInt(h.nivel||1, 10); if(!Number.isFinite(nivel)) nivel = 1;
  const preg = [];
  for(const q of (h.preguntas||[])){
    try{ const ops = q.ops.map(o=>[String(o[0]), o.length>1 ? String(o[1]) : '']); const ok = parseInt(q.ok, 10);
      if(q.q && ops.length>=2 && ops.length<=4 && ok>=0 && ok<ops.length) preg.push({q:String(q.q), ops, ok}); }catch(e){}
  }
  if(!preg.length) return [null, t+': sin preguntas válidas'];
  const limpia = {id:String(h.id||''), dia:0, mundo:m, nivel:Math.max(1, Math.min(5, nivel)), titulo:t, resumen:String(h.resumen||''),
    portada:String(h.portada||''), lineas:lineas.map(x=>x.trim()), preguntas:preg.slice(0,4), especial:'', fecha:''};
  if(calculoValido(h.calculo)) limpia.calculo = h.calculo;
  return [limpia, null];
}
async function contenidoBase(){
  const c = await caches.open(CACHE_PROG);
  let r = await c.match(new URL('contenido.json', self.registration.scope).href);
  if(!r){ r = await fetch(new URL('contenido.json', self.registration.scope).href, {cache:'no-store'}); if(r.ok) await c.put(new URL('contenido.json', self.registration.scope).href, r.clone()); }
  return r.json();
}
async function contenidoConNuevas(){
  const cont = await contenidoBase();
  const paquetes = (await todos('nuevas')).sort((a,b)=>a.nombre<b.nombre?-1:1);
  if(!paquetes.length) return cont;
  const mundos = new Set((cont.mundos||[]).map(m=>m.id)); const ids = new Set((cont.historias||[]).map(h=>h.id)); const fotos = cont.fotos||{};
  const nuevas = [];
  for(const p of paquetes){
    (p.historias||[]).forEach((h,i)=>{
      const [limpia] = revisarHistoria(h, mundos); if(!limpia) return;
      if(!limpia.id || ids.has(limpia.id)){ const b='n_' + p.nombre.slice(0,-5).toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,20) + '_' + (i+1); let id=b, k=2; while(ids.has(id)){ id=b+'_'+k; k++; } limpia.id=id; }
      ids.add(limpia.id);
      if(!(limpia.portada in fotos)){ const alt=[]; limpia.lineas.forEach(l=>{ for(const m of l.matchAll(PATRON_PAL)) if(m[2] in fotos) alt.push(m[2]); }); if(alt.length) limpia.portada = alt[0]; }
      limpia.nueva = p.nombre; nuevas.push(limpia);
    });
  }
  const pal = cont.palabras = cont.palabras || {};
  nuevas.forEach(h=>h.lineas.forEach(l=>{ for(const m of l.matchAll(PATRON_PAL)){ const w=m[1].toLowerCase(); if(!(w in pal)) pal[w]=m[2]; } }));
  cont.historias = (cont.historias||[]).concat(nuevas);
  return cont;
}

/* ---------------- el «servidor» ---------------- */
async function servir(req, ruta){
  const metodo = req.method;
  if(metodo==='GET' || metodo==='HEAD'){
    if(ruta==='/api/estado'){ return json({version:VERSION, voz:'navegador', vozNombre:'', oido:'navegador', datos:'este aparato', voces:[], oidos:[], cargando:false, local:true, ia:{activa:false, local:true}, aparato: await aparato()}); }
    if(ruta==='/api/datos'){
      const [ajustes, ses, conAudio] = await Promise.all([leer('kv','ajustes'), todos('sesiones'), claves('audios')]);
      const hay = new Set(conAudio);
      return json({ajustes: ajustes || null, sesiones: ses.sort((a,b)=>a.id<b.id?-1:1).map(s=>({...s, audio: hay.has(s.id)}))});
    }
    if(ruta==='/api/copias') return json([]);
    if(ruta==='/api/datos/info'){
      const auds = await todos('audios'); let uso=null; try{ uso=(await navigator.storage.estimate()).usage; }catch(e){}
      return json({carpeta:'Guardado en este aparato', bytes: uso, grabaciones: auds.length, bytesGrabaciones: auds.reduce((s,a)=>s+(a.blob?a.blob.size:0),0),
        ultimaCopia: (await leer('kv','ultimaCopia')) || null, copias: 0, local: true});
    }
    if(ruta==='/api/misimagenes'){ const out={};
      const ks = await claves('imagenes'); const vs = await todos('imagenes'); ks.forEach((k,i)=>{ out[k]=vs[i].mtime; }); return json(out); }
    let m = ruta.match(/^\/mis-imagenes\/([a-z0-9_]{1,40})\.jpg$/);
    if(m){ const im = await leer('imagenes', m[1]); return im ? binario(im.blob, 'image/jpeg') : json({error:'sin imagen'}, 404); }
    m = ruta.match(/^\/api\/audio\/([A-Za-z0-9_-]{1,64})$/);
    if(m){ const a = await leer('audios', m[1]); return a ? binario(a.blob, a.tipo) : json({error:'sin audio'}, 404); }
    if(ruta==='/api/voz') return json({error:'sin voz'}, 404);
    if(ruta==='/api/fichas') return json((await leer('kv','fichas')) || []);
    if(ruta==='/api/historias-nuevas'){
      const ps = (await todos('nuevas')).sort((a,b)=>a.nombre<b.nombre?-1:1);
      return json(ps.map(p=>{ const mundos={}; (p.historias||[]).forEach(h=>{ const m0=h&&(h.mundo||h.tema); const mm=MUNDO_DE_TEMA[m0]||m0; if(mm) mundos[mm]=(mundos[mm]||0)+1; });
        return {archivo:p.nombre, n:(p.historias||[]).length, mundos, f:p.f||0}; }));
    }
    m = ruta.match(/^\/api\/historias-nuevas\/(.+)$/);
    if(m){ const n=decodeURIComponent(m[1]); const p = NUEVA_OK.test(n) && await leer('nuevas', n); return p ? json(p.historias) : json({error:'no existe'}, 404); }
    if(ruta==='/contenido.json') return json(await contenidoConNuevas());
    if(ruta.startsWith('/api/ia/')) return ruta==='/api/ia/estado' ? json({activa:false, local:true, motivo:'La IA funciona en el ordenador. Lo que se prepara allí llega a la tablet al juntar los datos.'}) : json({error:IA_SOLO_PC}, 404);
    if(ruta==='/api/registro') return json(   // para mirar el registro de la tablet si algo falla (abriendo …/api/registro)
      (await leer('kv','registro')) || []);
    return null;
  }
  if(metodo==='POST'){
    if(ruta==='/api/ajustes'){ const d = await req.json().catch(()=>null); if(!d || typeof d!=='object' || Array.isArray(d)) return json({error:'datos no válidos'}, 400); await poner('kv', d, 'ajustes'); return json({ok:true}); }
    if(ruta==='/api/sesion'){ const d = await req.json().catch(()=>null); if(!d || typeof d!=='object' || !ID_OK.test(String(d.id||''))) return json({error:'sesión no válida'}, 400);
      delete d.audio; await poner('sesiones', d); return json({ok:true}); }
    let m = ruta.match(/^\/api\/audio\/(.+)$/);
    if(m){ if(!ID_OK.test(m[1])) return json({error:'id no válido'}, 400); const blob = await req.blob();
      await poner('audios', {blob, tipo: blob.type || req.headers.get('Content-Type') || 'audio/webm'}, m[1]); return json({ok:true}); }
    m = ruta.match(/^\/api\/misimagenes\/(.+)$/);
    if(m){ const blob = await req.blob(); if(!CLAVE_OK.test(m[1]) || blob.size>3000000 || !(await esJPEG(blob))) return json({error:'imagen no válida'}, 400);
      const mt = parseInt(new URL(req.url).searchParams.get('mtime')||'', 10);   // al juntar copias se conserva la fecha original
      await poner('imagenes', {blob: new Blob([blob], {type:'image/jpeg'}), mtime: mt>0 ? mt : Math.floor(Date.now()/1000)}, m[1]); await registrar('Imagen propia guardada para: '+m[1]); return json({ok:true}); }
    if(ruta.startsWith('/api/oido/')) return json({error:'sin reconocimiento local en este aparato'}, 404);
    if(ruta==='/api/historias-nuevas'){
      const d = (await req.json().catch(()=>null)) || {}; const lista = d.historias;
      if(!Array.isArray(lista) || !lista.length) return json({error:'El archivo no trae historias.'}, 400);
      const mundos = new Set(((await contenidoBase()).mundos||[]).map(x=>x.id));
      const buenas=[], malas=[]; lista.slice(0,400).forEach(h=>{ const [l, motivo]=revisarHistoria(h, mundos); l ? buenas.push(h) : malas.push(motivo); });
      if(!buenas.length) return json({error:'Ninguna historia válida. ' + malas.slice(0,3).join('; ')}, 400);
      const base = (String(d.nombre||'historias').replace(/\.[^.]*$/,'').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,40)) || 'historias';
      const existen = new Set(await claves('nuevas')); let nombre = base+'.json', k=2; while(existen.has(nombre)){ nombre = base+'_'+k+'.json'; k++; }
      await poner('nuevas', {nombre, historias: buenas, f: Date.now()}, nombre); await registrar('Historias nuevas añadidas: '+nombre+' '+buenas.length);
      return json({ok:true, n:buenas.length, descartadas:malas, archivo:nombre});
    }
    if(ruta==='/api/fichas'){ const d = await req.json().catch(()=>null); if(!Array.isArray(d)) return json({error:'datos no válidos'}, 400); await poner('kv', d, 'fichas'); return json({ok:true}); }
    if(ruta==='/api/copia' || ruta==='/api/copia/restaurar') return json({error:'En la tablet las copias se hacen solas (copias automáticas) o con «Enviar a Google Drive».'}, 400);
    if(ruta==='/api/abrir-carpeta') return json({ok:false, carpeta:'Guardado en este aparato'});
    if(ruta==='/api/registro'){ const d = (await req.json().catch(()=>null)) || {}; await registrar('Navegador: '+String(d.mensaje||'')); return json({ok:true}); }
    if(ruta==='/api/sincro/copia'){ await poner('kv', new Date().toISOString(), 'ultimaCopia'); return json({ok:true}); }
    if(ruta.startsWith('/api/ia/')) return json({error:IA_SOLO_PC}, 404);
    return json({error:'ruta desconocida'}, 404);
  }
  if(metodo==='DELETE'){
    let m = ruta.match(/^\/api\/audio\/([A-Za-z0-9_-]{1,64})$/);
    if(m){ const a = await leer('audios', m[1]); if(a){ await poner('papelera', {...a, f:Date.now()}, 'audio_'+m[1]); await quitar('audios', m[1]); await registrar('Grabación movida a la papelera: '+m[1]); } return json({ok:true}); }
    m = ruta.match(/^\/api\/misimagenes\/([a-z0-9_]{1,40})$/);
    if(m){ const im = await leer('imagenes', m[1]); if(im){ await poner('papelera', {...im, f:Date.now()}, 'imagen_'+m[1]+'_'+Date.now()); await quitar('imagenes', m[1]); } return json({ok:true}); }
    m = ruta.match(/^\/api\/sesion\/([A-Za-z0-9_-]{1,64})$/);
    if(m){ const s = await leer('sesiones', m[1]); const a = await leer('audios', m[1]);
      if(s) await poner('papelera', {sesion:s, audio:a||null, f:Date.now()}, 'sesion_'+m[1]); await quitar('sesiones', m[1]); await quitar('audios', m[1]);
      await registrar('Lectura movida a la papelera: '+m[1]); return json({ok:true}); }
    m = ruta.match(/^\/api\/historias-nuevas\/(.+)$/);
    if(m){ const n=decodeURIComponent(m[1]); if(!NUEVA_OK.test(n)) return json({error:'nombre no válido'}, 400); const p = await leer('nuevas', n);
      if(p){ await poner('papelera', {...p, f:Date.now()}, 'historias_'+Date.now()+'_'+n); await quitar('nuevas', n); await registrar('Historias nuevas quitadas: '+n); } return json({ok:true}); }
    if(ruta.startsWith('/api/ia/')) return json({error:IA_SOLO_PC}, 404);
    return json({error:'ruta desconocida'}, 404);
  }
  return json({error:'método no válido'}, 405);
}

/* ---------------- guardar el programa para usarlo sin internet ---------------- */
async function listaPrecarga(){
  const r = await fetch(new URL('precache.json', self.registration.scope).href, {cache:'no-store'});
  if(!r.ok) throw new Error('sin precache.json');
  return r.json();
}
async function guardarArchivos(lista, alProgreso){
  const c = await caches.open(CACHE_PROG); let hechos = 0, fallos = 0;
  const pend = [];
  for(const f of lista){ const url = new URL(f, self.registration.scope).href; if(!(await c.match(url))) pend.push(url); else hechos++; }
  alProgreso && alProgreso(hechos, lista.length, fallos);
  const trabajar = async () => { while(pend.length){ const url = pend.shift();
      try{ const r = await fetch(url, {cache:'no-store'}); if(r.ok){ await c.put(url, r); hechos++; } else fallos++; }catch(e){ fallos++; }
      alProgreso && alProgreso(hechos, lista.length, fallos); } };
  await Promise.all([trabajar(), trabajar(), trabajar(), trabajar()]);
  return {hechos, total: lista.length, fallos};
}
/* Letras: se guardan todas las variantes desde el principio (también la ligada, aunque todavía no se haya usado) */
const FUENTES_CSS = 'https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Nunito:wght@600;700;800;900&family=Playwrite+ES:wght@300;400&display=swap';
async function guardarFuentes(){
  const c = await caches.open(CACHE_FUENTES);
  let css = '';
  try{ const r = await fetch(FUENTES_CSS, {mode:'cors'}); if(!r.ok) return 0; css = await r.clone().text(); await c.put(FUENTES_CSS, r); }
  catch(e){ return 0; }
  let n = 0;
  for(const m of css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)){
    const u = m[1]; if(await c.match(u, {ignoreVary:true})){ n++; continue; }
    try{ const f = await fetch(u, {mode:'cors'}); if(f.ok){ await c.put(u, f); n++; } }catch(e){}
  }
  return n;
}
/* El programa (pequeño) se guarda al instalar; las fotos, después, con aviso de progreso en la pantalla */
self.addEventListener('install', ev=>{
  ev.waitUntil((async()=>{
    const p = await listaPrecarga();
    // versión nueva: se borra lo guardado del programa (no las fotos: las que no cambian se vuelven a usar)
    const c = await caches.open(CACHE_PROG);
    const vp = await c.match('version-programa'), vf = await c.match('version-fotos');
    const fotosIgual = vf && (await vf.text())===String(p.fotosVersion);
    if(!vp || (await vp.text())!==p.version){ for(const k of await c.keys()){ if(!fotosIgual || !/\/fotos\//.test(k.url)) await c.delete(k); } }
    await guardarArchivos(p.programa);
    await c.put('version-programa', new Response(p.version)); await c.put('version-fotos', new Response(String(p.fotosVersion)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', ev=>{ ev.waitUntil(self.clients.claim()); });
self.addEventListener('message', ev=>{
  if(ev.data && ev.data.tipo==='precargar'){
    ev.waitUntil((async()=>{
      const avisar = async m => { for(const cl of await self.clients.matchAll()) cl.postMessage(m); };
      try{ await guardarFuentes(); const p = await listaPrecarga(); let ult = 0;
        const r = await guardarArchivos(p.programa.concat(p.fotos), (h,t,f)=>{ const ahora=Date.now(); if(ahora-ult>400 || h+f===t){ ult=ahora; avisar({tipo:'precarga', hechos:h, total:t, fallos:f}); } });
        avisar({tipo:'precarga', ...r, fin:true});
      }catch(e){ avisar({tipo:'precarga', error:String(e.message||e), fin:true}); }
    })());
  }
});

self.addEventListener('fetch', ev=>{
  const req = ev.request; const url = new URL(req.url);
  if(url.origin===self.location.origin){
    const base = new URL(self.registration.scope).pathname;           // p. ej. /leeleejg/
    let ruta = url.pathname; if(ruta.startsWith(base)) ruta = '/' + ruta.slice(base.length);
    if(ruta.startsWith('/api/') || ruta.startsWith('/mis-imagenes/') || (ruta==='/contenido.json' && req.method==='GET')){
      ev.respondWith(servir(req, ruta).then(r=>r || json({error:'no encontrado'}, 404)).catch(e=>{ registrar('Error en '+req.method+' '+ruta+': '+(e && e.message || e)); return json({error:String(e && e.message || e)}, 500); }));
      return;
    }
    if(req.method!=='GET') return;
    ev.respondWith((async()=>{
      const c = await caches.open(CACHE_PROG);
      const clave = url.origin + url.pathname;                         // sin «?v=…»
      const r = await c.match(clave) || (req.mode==='navigate' ? await c.match(new URL('index.html', self.registration.scope).href) : null);
      if(r) return r;
      try{ const red = await fetch(req); if(red.ok && /\.(jpg|png|js|css|json|html|webmanifest)$/.test(url.pathname)) c.put(clave, red.clone()); return red; }
      catch(e){ return new Response('', {status:504}); }
    })());
    return;
  }
  // letras de Google: se guardan la primera vez para tenerlas sin internet
  if(/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) && req.method==='GET'){
    ev.respondWith((async()=>{ const c = await caches.open(CACHE_FUENTES); const r = await c.match(req, {ignoreVary:true}); if(r) return r;
      try{ const red = await fetch(req); if(red.ok || red.type==='opaque') c.put(req, red.clone()); return red; }catch(e){ return new Response('', {status:504}); } })());
  }
});
