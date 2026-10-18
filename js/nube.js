/* LeeLEEJG · copias automáticas entre el ordenador y la tablet, siempre, sin botones.
   Usa un pequeño programa de Google Apps Script en la cuenta de Google de la familia: guarda las copias en Mi unidad › LeeLEEJG.
   Cada aparato deja ahí su copia (LeeLEEJG-<aparato>.leelee.json) y junta las de los demás al abrirse y cada 2 minutos
   (en pantallas tranquilas, nunca a mitad de una lectura); al cerrarse o esconderse solo envía la suya.
   La copia lleva las grabaciones de los últimos 4 días. */
'use strict';
const NUBE_LOCAL = 'leeleejgNube';
const NUBE_SCRIPT = `// LeeLEEJG · copias automáticas (Google Apps Script). Guarda las copias en Mi unidad › LeeLEEJG.
const CARPETA = 'LeeLEEJG';
function carpeta_() { const it = DriveApp.getRootFolder().getFoldersByName(CARPETA); return it.hasNext() ? it.next() : DriveApp.getRootFolder().createFolder(CARPETA); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function permitido_(clave) {
  const p = PropertiesService.getScriptProperties(); const c = p.getProperty('CLAVE');
  if (!c) { if (clave && String(clave).length >= 16) { p.setProperty('CLAVE', String(clave)); return true; } return false; }
  return clave === c;
}
function doGet(e) {
  const q = e.parameter || {};
  if (!permitido_(q.clave)) return json_({ error: 'clave' });
  if (q.accion === 'listar') {
    const out = []; const it = carpeta_().getFiles();
    while (it.hasNext()) { const f = it.next(); const n = f.getName(); if (/^LeeLEEJG-[A-Za-z0-9_-]+\\.leelee\\.json$/.test(n)) out.push({ nombre: n, fecha: f.getLastUpdated().getTime(), tam: f.getSize() }); }
    return json_({ ok: true, archivos: out });
  }
  if (q.accion === 'leer') {
    const it = carpeta_().getFilesByName(String(q.nombre || ''));
    if (!it.hasNext()) return json_({ error: 'no existe' });
    return ContentService.createTextOutput(it.next().getBlob().getDataAsString()).setMimeType(ContentService.MimeType.JSON);
  }
  return json_({ ok: true });
}
function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (x) { return json_({ error: 'json' }); }
  if (!permitido_(b.clave)) return json_({ error: 'clave' });
  if (b.accion === 'probar') return json_({ ok: true });
  if (b.accion === 'guardar') {
    if (!/^LeeLEEJG-[A-Za-z0-9_-]+\\.leelee\\.json$/.test(b.nombre || '')) return json_({ error: 'nombre' });
    const c = carpeta_(); const it = c.getFilesByName(b.nombre);
    if (it.hasNext()) {
      const id = it.next().getId();
      UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files/' + id + '?uploadType=media', { method: 'patch', contentType: 'application/json', payload: Utilities.newBlob(b.contenido, 'application/json').getBytes(), headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
    } else c.createFile(b.nombre, b.contenido, 'application/json');
    return json_({ ok: true });
  }
  return json_({ error: 'accion' });
}
`;
const nubeConf = () => (aj.nube && aj.nube.url && aj.nube.clave) ? aj.nube : null;
const nubeLocal = () => { try{ return JSON.parse(localStorage.getItem(NUBE_LOCAL)||'{}'); }catch(e){ return {}; } };
const guardarNubeLocal = o => { try{ localStorage.setItem(NUBE_LOCAL, JSON.stringify(o)); }catch(e){} };
const urlNubeValida = u => /^https:\/\/script\.google(usercontent)?\.com\/[^\s#]+\/exec$/.test(u) || /^http:\/\/127\.0\.0\.1:\d+\/nube$/.test(u);   // la segunda, solo para las pruebas
async function nubeGet(params, c=nubeConf()){
  const r=await fetch(c.url+'?'+new URLSearchParams({...params, clave:c.clave}), {redirect:'follow', cache:'no-store'});
  if(!r.ok) throw new Error('la nube respondió '+r.status);
  const j=await r.json(); if(j && j.error) throw new Error(j.error==='clave'?'la clave no coincide':'nube: '+j.error); return j;
}
async function nubePost(body, c=nubeConf()){
  const r=await fetch(c.url, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({...body, clave:c.clave}), redirect:'follow'});
  if(!r.ok) throw new Error('la nube respondió '+r.status);
  const j=await r.json(); if(j && j.error) throw new Error(j.error==='clave'?'la clave no coincide':'nube: '+j.error); return j;
}
const nombreNube = () => 'LeeLEEJG-'+String((EST.aparato&&EST.aparato.id)||'aparato').replace(/[^A-Za-z0-9_-]/g,'')+'.leelee.json';
function huellaTexto(t){ let h=2166136261; for(let i=0;i<t.length;i++){ h^=t.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0).toString(36)+'_'+t.length; }

let nubeOcupada=false;
/* junta lo de los otros aparatos y deja la copia de este (solo si ha cambiado algo) */
async function nubeSincro({soloEnviar=false}={}){
  if(!nubeConf() || nubeOcupada || navigator.onLine===false) return null;
  nubeOcupada=true; const loc=nubeLocal(); loc.visto=loc.visto||{}; const res={total:0, unidos:[]}; const fallos=[];
  try{
    if(!soloEnviar){
      const l=await nubeGet({accion:'listar'}); const mio=nombreNube();
      try{
        for(const f of (l.archivos||[])){
          if(f.nombre===mio || loc.visto[f.nombre]===f.fecha) continue;
          try{   // una copia que falla no impide juntar las demás ni enviar la de este aparato
            const c=await nubeGet({accion:'leer', nombre:f.nombre});
            const r=await unirCopia(c); loc.visto[f.nombre]=f.fecha; guardarNubeLocal(loc);
            if(!r.propia && r.total){ res.total+=r.total; res.unidos.push({nombre:f.nombre, r}); }
          }catch(e){ fallos.push(f.nombre+': '+e.message); }
        }
      } finally { if(res.total) await cargarDatos(); }   // lo ya juntado se carga siempre (si no, se guardaría encima)
    }
    const copia=await crearCopia({diasAudio:4});
    const hu=huellaTexto(JSON.stringify({...copia, fecha:''}));
    if(hu!==loc.huella){ await nubePost({accion:'guardar', nombre:nombreNube(), contenido:JSON.stringify(copia)}); loc.huella=hu; loc.enviada=Date.now(); }
    loc.ultima=Date.now(); loc.error=fallos.length ? 'no se pudo juntar '+fallos.join('; ') : null;
    if(fallos.length) registrar('Copias automáticas: '+loc.error);
  }catch(e){ loc.error=e.message; registrar('Copias automáticas: '+e.message); }
  finally{ guardarNubeLocal(loc); nubeOcupada=false; }
  return res;
}
/* pantallas en las que se puede juntar sin molestar (nunca leyendo, contestando ni jugando) */
const PANT_TRANQUILAS = new Set(['inicio','quien','calendario','historias','cromos','criaturas','juegos','temporada','cambiar','asi','mipantalla','temas',
  'evolucion','revisar','grupo','fichas','perfil','imagenes','vozsonido','datos','informe']);
async function nubeTurno(){
  if(!nubeConf() || !PANT_TRANQUILAS.has(actual)) return;
  const r=await nubeSincro();
  if(r && r.total){ aviso('Juntado del otro aparato: '+resumenUnion(sumar(r.unidos.map(u=>u.r)))); if(PANT_TRANQUILAS.has(actual) && actual!=='datos') ir(actual); }
  if(actual==='datos'){ const e=$('#nubeEstado'); if(e) e.innerHTML=nubeEstadoTxt(); }
}
function nubeArrancar(){
  // enlace para el otro aparato: …/#nube=<dirección>|<clave>
  const m=location.hash.match(/^#nube=([^|]+)\|(.+)$/);
  if(m){ const url=decodeURIComponent(m[1]), clave=decodeURIComponent(m[2]); history.replaceState(null,'',location.pathname+location.search);
    if(urlNubeValida(url)){ aj.nube={url, clave}; guardarAj(); aviso('Copias automáticas activadas'); } }
  setTimeout(nubeTurno, 2500);
  setInterval(nubeTurno, 120000);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden' && nubeConf() && !recargando) nubeSincro({soloEnviar:true}); });
  window.addEventListener('online', ()=>setTimeout(nubeTurno, 3000));
}

/* --- tarjeta en «Datos y copias» --- */
function nubeEstadoTxt(){
  const l=nubeLocal(); const f=t=>new Date(t).toLocaleString('es-ES',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'});
  if(nubeOcupada) return '⏳ Juntando ahora…';
  if(l.error) return `⚠️ La última vez no se pudo (${esc(l.error)}). Se vuelve a intentar sola cada 2 minutos.`;
  return l.ultima ? `✅ Al día. Última vez: ${esc(f(l.ultima))}${l.enviada?' · copia de este aparato enviada: '+esc(f(l.enviada)):''}` : 'Todavía no se ha hecho ninguna.';
}
const codigoNube = () => { const c=nubeConf(); return c ? c.url+'#'+c.clave : ''; };
function nubeHTML(){
  const c=nubeConf();
  if(c) return `<div class="card ajuste nube-card" id="cardNube"><h3>${ic('nube')} Copias automáticas</h3>
    <p class="nota">Activadas: este aparato y el otro se juntan solos (al abrir y cada 2 minutos; al cerrar se envía lo último). Las copias están en Google Drive › Mi unidad › <b>LeeLEEJG</b>.</p>
    <p class="nota" id="nubeEstado" style="margin-top:6px">${nubeEstadoTxt()}</p>
    <div class="botones" style="margin-top:10px"><button class="btn btn-p" type="button" id="nubeYa">${ic('recargar')} Juntar ahora</button><button class="btn" type="button" id="nubeCodigo">Código para el otro aparato</button><button class="btn btn-rojo" type="button" id="nubeQuitar">Desactivar</button></div></div>`;
  if(enLocal()) return `<div class="card ajuste nube-card" id="cardNube"><h3>${ic('nube')} Copias automáticas</h3>
    <p class="nota">En el ordenador, en Familia › Datos y copias › Copias automáticas, toca «Código para el otro aparato» y pega aquí ese código. A partir de ahí se juntan solos, siempre.</p>
    <div class="campo" style="margin-top:8px"><label for="nubePega">Código del ordenador</label><input id="nubePega" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec#…"></div>
    <div class="botones"><button class="btn btn-p" type="button" id="nubeActivar">Activar</button></div><p class="nota" id="nubeMsg"></p></div>`;
  return `<div class="card ajuste nube-card" id="cardNube"><h3>${ic('nube')} Copias automáticas (recomendado)</h3>
    <p class="nota">Para que el ordenador y la tablet se junten solos, siempre, sin tocar botones. Se hace una sola vez (unos 10 minutos):</p>
    <ol class="pasos-nube">
      <li>Abre <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener"><b>Google Apps Script</b></a> con vuestra cuenta de Google (la misma de Google Drive). Se abre un proyecto nuevo.</li>
      <li>Borra lo que hay escrito y pega este programa: <button class="btn btn-mini" type="button" id="nubeCopiarScript">Copiar el programa</button><textarea id="nubeScript" readonly rows="4">${esc(NUBE_SCRIPT)}</textarea></li>
      <li>Arriba: <b>Implementar › Nueva implementación</b>. En el engranaje elige <b>Aplicación web</b>; «Ejecutar como»: <b>Yo</b>; «Quién tiene acceso»: <b>Cualquier usuario</b>. Pulsa <b>Implementar</b> y da los permisos (si sale «Google no ha verificado esta aplicación», pulsa «Configuración avanzada» › «Ir a…»: es vuestro propio programa).</li>
      <li>Copia la <b>URL de la aplicación web</b> (acaba en <b>/exec</b>) y pégala aquí:</li></ol>
    <div class="campo"><input id="nubeUrl" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec"></div>
    <div class="botones"><button class="btn btn-p" type="button" id="nubeActivar">Activar</button></div><p class="nota" id="nubeMsg"></p></div>`;
}
function activarNube(){
  const msg=t=>{ const e=$('#nubeMsg'); if(e) e.textContent=t; };
  const cs=$('#nubeCopiarScript'); if(cs) cs.onclick=async()=>{ try{ await navigator.clipboard.writeText(NUBE_SCRIPT); aviso('Programa copiado'); }catch(e){ const t=$('#nubeScript'); t.select(); document.execCommand('copy'); aviso('Programa copiado'); } };
  const act=$('#nubeActivar'); if(act) act.onclick=async()=>{
    let url, clave;
    if(enLocal()){ const v=($('#nubePega').value||'').trim(); const i=v.indexOf('#'); if(i<0){ msg('Ese código no está completo: tiene que llevar la dirección y la clave (con # en medio).'); return; } url=v.slice(0,i); clave=v.slice(i+1); }
    else { url=($('#nubeUrl').value||'').trim(); const a=new Uint8Array(18); crypto.getRandomValues(a); clave=[...a].map(x=>x.toString(16).padStart(2,'0')).join(''); }
    if(!urlNubeValida(url)){ msg('La dirección tiene que empezar por https://script.google.com/ y acabar en /exec.'); return; }
    act.disabled=true; msg('Probando…');
    try{ await nubePost({accion:'probar'}, {url, clave}); aj.nube={url, clave}; guardarAj(); guardarNubeLocal({}); msg('¡Activadas! Juntando por primera vez…'); await nubeTurno(); ir('datos'); }
    catch(e){ act.disabled=false; msg('No se pudo: '+e.message+'. Revisa que «Quién tiene acceso» sea «Cualquier usuario».'); }
  };
  const ya=$('#nubeYa'); if(ya) ya.onclick=async()=>{ ya.disabled=true; const e=$('#nubeEstado'); if(e) e.textContent='⏳ Juntando ahora…'; const r=await nubeSincro(); if(e) e.innerHTML=nubeEstadoTxt(); ya.disabled=false; if(r && r.total) aviso('Juntado: '+resumenUnion(sumar(r.unidos.map(u=>u.r)))); };
  const co=$('#nubeCodigo'); if(co) co.onclick=()=>{ const cod=codigoNube();
    dialogo({titulo:'Código para el otro aparato', cls:'dlg-ancho', html:`<p class="nota">En la tablet: abre LeeLEEJG › Familia › Datos y copias › Copias automáticas y pega este código (puedes mandártelo por correo o WhatsApp para copiarlo allí).</p>
      <div class="campo"><label>Código</label><input readonly value="${esc(cod)}" onclick="this.select()"></div>
      <p class="nota">Guárdalo para vosotros: con él se pueden leer las copias.</p>`, botones:[{t:'Copiar el código', cls:'btn-p', mantener:true, fn:async()=>{ try{ await navigator.clipboard.writeText(cod); aviso('Código copiado'); }catch(e){} }},{t:'Cerrar'}]}); };
  const qu=$('#nubeQuitar'); if(qu) qu.onclick=()=>dialogo({titulo:'¿Desactivar las copias automáticas?', html:'<p class="nota">Este aparato dejará de juntarse solo. Lo que ya está en los dos aparatos no se borra.</p>', botones:[{t:'Seguir con ellas',cls:'btn'},{t:'Desactivar',cls:'btn-rojo', fn:()=>{ delete aj.nube; guardarAj(); guardarNubeLocal({}); ir('datos'); }}]});
}
