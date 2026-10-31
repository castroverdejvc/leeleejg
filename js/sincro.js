/* LeeLEEJG · copias entre la tablet y el ordenador (por Google Drive)
   Cada aparato guarda una «copia» (un archivo LeeLEEJG-….leelee.json/.txt) y el otro la junta con lo suyo:
   - lecturas: se suman; si la misma lectura está en los dos, gana la más completa o la revisada;
   - perfiles y ajustes: cada dato (nivel, temas, repaso, nombre…) lleva su propia marca de cambio (modK) y gana
     el cambiado más tarde; los registros (repaso, dictado, juegos, tele…) se suman; el plan se junta día a día;
   - fichas: gana la lista cambiada más tarde (fichasMod);
   - imágenes propias, historias nuevas y grabaciones: se añaden las que falten;
   - lo que se borró en un aparato (aj.borrados) se borra también en el otro (a su papelera). */
'use strict';
const SINCRO_DIAS_AUDIO = 30;
const NUBE = 'Google Drive';   // donde la familia deja las copias (carpeta «LeeLEEJG» de Mi unidad)
const CAMPOS_LOCALES = new Set(['voz','vozPrograma','perfil','volumen','mod','modK','oidoModo','nube', ...PKEYS]);   // propios de cada aparato (o con marca aparte)
const APARTE = new Set(['borrados','fichasMod']);   // se juntan con sus propias reglas
const LISTAS_PERFIL = ['repasoLog','dictadoLog','temasLog','gustosLog','adivLog','letrasLog','teleLog','cambios','juegoLog','peliLog','sobresLog','trabajosLog','deseosLog','movilLog','eduLog','deporteLog','cartas','revistasLog','cajasLog','objManualLog','caliLog','palDiaLog','nivelLog','deletreoLog','practicaLog','sorpresaLog','nuevosLog'];
const clon = x => x==null ? x : JSON.parse(JSON.stringify(x));

/* --- marcas de cambio: cada dato guarda cuándo cambió (modK), así al juntar gana el cambio más reciente de cada cosa --- */
let huellasAj = null;
const huellasDe = (o, salta) => { const h={}; Object.keys(o||{}).forEach(k=>{ if(!salta(k)) h[k]=JSON.stringify(o[k]); }); return h; };
function huellasPerfil(p){ const h={}; Object.entries(huellasDe(p, k=>k==='cfg'||k==='mod'||k==='modK')).forEach(([k,v])=>h['f:'+k]=v); Object.entries(huellasDe(p.cfg, ()=>false)).forEach(([k,v])=>h['c:'+k]=v); return h; }
const huellasGenerales = () => huellasDe(aj, k=>CAMPOS_LOCALES.has(k)||APARTE.has(k)||k==='perfiles');
function marcarCambios(o, antes, ahora, t){
  let hay=false; new Set([...Object.keys(antes), ...Object.keys(ahora)]).forEach(k=>{ if(antes[k]!==ahora[k]){ o.modK=o.modK||{}; o.modK[k]=t; hay=true; } });
  if(hay) o.mod=t;
}
function sellarCambios(){
  const t=Date.now(), h={g:huellasGenerales()};
  (aj.perfiles||[]).forEach(p=>{ h['p:'+p.id]=huellasPerfil(p); });
  if(huellasAj){
    (aj.perfiles||[]).forEach(p=>marcarCambios(p, huellasAj['p:'+p.id]||{}, h['p:'+p.id], t));
    marcarCambios(aj, huellasAj.g, h.g, t);
  } else {
    // al cargar: lo que todavía no tiene marca propia (datos de versiones anteriores) queda con marca 0
    (aj.perfiles||[]).forEach(p=>{ p.modK=p.modK||{}; Object.keys(h['p:'+p.id]).forEach(k=>{ if(p.modK[k]==null) p.modK[k]=0; }); });
    aj.modK=aj.modK||{}; Object.keys(h.g).forEach(k=>{ if(aj.modK[k]==null) aj.modK[k]=0; });
  }
  huellasAj=h;
}
/* marca de un dato: la suya; si es de una versión sin marcas, la del conjunto (o 0 si no lo tiene) */
const marcaDe = (o, k, tiene) => (o && o.modK && o.modK[k]!=null) ? o.modK[k] : (tiene ? ((o && o.mod) || 0) : 0);

/* --- juntar --- */
function unirListas(a, b){
  const vistos=new Set(), out=[];
  [...(a||[]), ...(b||[])].forEach(x=>{ const k=JSON.stringify(x); if(!vistos.has(k)){ vistos.add(k); out.push(x); } });
  const fecha = x => (x && (x.f || x.fecha)) || '';
  if(out.every(x=>fecha(x))) out.sort((x,y)=>fecha(x)<fecha(y)?-1:fecha(x)>fecha(y)?1:0);
  return out;
}
function unirPerfil(pl, po){
  const r=clon(pl); r.cfg=r.cfg||{}; r.modK={...(pl.modK||{})}; const lc=pl.cfg||{}, oc=po.cfg||{};
  const toma=(clave, tieneL, tieneO, poner)=>{ const a=marcaDe(pl, clave, tieneL), b=marcaDe(po, clave, tieneO); if(b>a){ poner(); r.modK[clave]=b; } };
  new Set([...Object.keys(pl), ...Object.keys(po)]).forEach(k=>{ if(['id','cfg','mod','modK'].includes(k)) return;
    toma('f:'+k, k in pl, k in po, ()=>{ if(po[k]===undefined) delete r[k]; else r[k]=clon(po[k]); }); });
  new Set([...Object.keys(lc), ...Object.keys(oc)]).forEach(k=>{
    if(LISTAS_PERFIL.includes(k)){ if(lc[k] || oc[k]) r.cfg[k]=unirListas(lc[k], oc[k]); return; }
    if(k==='plan'){ const oGana=marcaDe(po,'c:plan',true)>marcaDe(pl,'c:plan',true); r.cfg.plan = oGana ? {...(lc.plan||{}), ...(oc.plan||{})} : {...(oc.plan||{}), ...(lc.plan||{})}; return; }
    if(k==='juegoDias'){ const j={...(lc.juegoDias||{})}; Object.entries(oc.juegoDias||{}).forEach(([d,v])=>{ j[d]=Math.max(j[d]||0, v||0); }); r.cfg.juegoDias=j; return; }   // tiempo jugado en cada aparato
    toma('c:'+k, k in lc, k in oc, ()=>{ if(oc[k]===undefined) delete r.cfg[k]; else r.cfg[k]=clon(oc[k]); });
  });
  r.mod=Math.max(pl.mod||0, po.mod||0) || undefined;
  return r;
}
function unirAjustes(l, o){
  const r = clon(l||{});
  if(!o) return r;
  r.modK={...(r.modK||{})};
  new Set([...Object.keys(r), ...Object.keys(o)]).forEach(k=>{ if(CAMPOS_LOCALES.has(k) || APARTE.has(k) || k==='perfiles') return;
    const a=marcaDe(l, k, l && k in l), b=marcaDe(o, k, k in o); if(b>a){ if(o[k]===undefined) delete r[k]; else r[k]=clon(o[k]); r.modK[k]=b; } });
  r.mod=Math.max(r.mod||0, o.mod||0) || undefined;
  r.perfiles = r.perfiles || [];
  (o.perfiles||[]).forEach(po=>{ const i=r.perfiles.findIndex(p=>p.id===po.id); if(i<0) r.perfiles.push(clon(po)); else r.perfiles[i]=unirPerfil(r.perfiles[i], po); });
  return r;
}
/* aparato recién estrenado: se queda con todo lo del otro, salvo la voz y el volumen de este aparato */
function adoptarAjustes(l, o){
  const r = clon(o); ['voz','vozPrograma','volumen'].forEach(k=>{ if(l && l[k]!==undefined) r[k]=l[k]; else delete r[k]; }); return r;
}
const rangoSesion = s => [s.incompleta?0:1, s.revisada?1:0, (s.preguntas||[]).length + (s.calculo?1:0), s.mod||0];
function sesionMejor(nueva, vieja){
  const a=rangoSesion(nueva), b=rangoSesion(vieja);
  for(let i=0;i<a.length;i++){ if(a[i]!==b[i]) return a[i]>b[i]; }
  return false;
}
const estrenado = d => !d.ajustes || (!(d.sesiones||[]).some(s=>!s.prueba) && !(d.ajustes.perfiles||[]).some(p=>p.mod));

/* --- de archivo a datos y al revés --- */
const aBase64 = blob => new Promise((res, rej)=>{ const r=new FileReader(); r.onload=()=>res(String(r.result).split(',')[1]||''); r.onerror=()=>rej(r.error); r.readAsDataURL(blob); });
function deBase64(b64, tipo){ const bin=atob(b64); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return new Blob([u], {type:tipo||'application/octet-stream'}); }

async function guardarAjYa(){ while(uniendo) await pausa(200); if(recargando) throw new Error('recargando'); guardarCfgPerfil(); sellarCambios(); clearTimeout(tGuardarAj); await postJSON('/api/ajustes', aj); }

async function crearCopia({audios=true, diasAudio=SINCRO_DIAS_AUDIO}={}){
  await guardarAjYa();
  const d = await api('/api/datos');
  const fichas = await api('/api/fichas');   // si falla, no se hace la copia (una lista vacía borraría las fichas del otro aparato)
  const nuevas = [];
  for(const n of await api('/api/historias-nuevas').catch(()=>[])){ try{ nuevas.push({nombre:n.archivo, f:n.f||0, historias: await api('/api/historias-nuevas/'+encodeURIComponent(n.archivo))}); }catch(e){} }
  const imagenes = {};
  for(const [k, mt] of Object.entries(await api('/api/misimagenes').catch(()=>({})))){
    try{ const r=await fetch('/mis-imagenes/'+k+'.jpg?v='+mt); if(r.ok) imagenes[k]={mtime:mt, b64: await aBase64(await r.blob())}; }catch(e){}
  }
  const grab = {}; const desde = Date.now() - diasAudio*864e5;
  if(audios) for(const s of (d.sesiones||[])){
    if(!s.audio || !(Date.parse(s.fecha) >= desde)) continue;
    try{ const r=await fetch('/api/audio/'+s.id); if(r.ok){ const b=await r.blob(); grab[s.id]={tipo:b.type||'audio/webm', b64: await aBase64(b)}; } }catch(e){}
  }
  return {tipo:'LeeLEEJG-copia', formato:1, version:EST.version||'', aparato:EST.aparato||null, fecha:new Date().toISOString(),
    ajustes:d.ajustes||null, sesiones:(d.sesiones||[]).map(s=>{ const c={...s}; delete c.audio; return c; }), fichas, nuevas, imagenes, audios:grab};
}

/* Junta una copia con lo de este aparato. Devuelve cuántas cosas ha añadido o puesto al día. */
async function unirCopia(c){
  if(!c || c.tipo!=='LeeLEEJG-copia') throw new Error('Este archivo no es una copia de LeeLEEJG.');
  if(EST.aparato && c.aparato && c.aparato.id===EST.aparato.id) return {propia:true, total:0};
  while(uniendo) await pausa(200);   // otra unión en marcha (botón a mano y copias automáticas a la vez)
  await guardarAjYa().catch(()=>{});
  uniendo=true; ajPendiente=false;
  try{
    const r = await unirCopiaDentro(c);
    if(ajPendiente){   // lo que cambió en pantalla mientras se juntaba se junta con lo que ha quedado guardado
      const d = await api('/api/datos'); await postJSON('/api/ajustes', unirAjustes(d.ajustes||{}, aj));
    }
    return r;
  } finally { uniendo=false; ajPendiente=false; }
}
function unirBorrados(a, b){ const m=new Map(); [...(a||[]), ...(b||[])].forEach(x=>{ if(!x||!x.t||x.id==null) return; const k=x.t+':'+x.id; if(!m.has(k) || (x.f||0)>(m.get(k).f||0)) m.set(k, x); }); return [...m.values()].sort((x,y)=>(x.f||0)-(y.f||0)).slice(-2000); }
async function unirCopiaDentro(c){
  const local = await api('/api/datos'); const res = {sesiones:0, grabaciones:0, imagenes:0, fichas:0, historias:0, perfiles:0, borrados:0};
  const borrados = unirBorrados((local.ajustes||{}).borrados, (c.ajustes||{}).borrados);
  const B = new Map(borrados.map(x=>[x.t+':'+x.id, x.f||0]));
  // ajustes y perfiles
  if(c.ajustes){
    const antes = JSON.stringify(local.ajustes||null);
    const nuevo = estrenado(local) ? adoptarAjustes(local.ajustes, c.ajustes) : unirAjustes(local.ajustes||{}, c.ajustes);
    // fichas: gana la lista cambiada más tarde (así una ficha borrada no vuelve)
    const fl=(local.ajustes||{}).fichasMod||0, fo=c.ajustes.fichasMod||0;
    if(Array.isArray(c.fichas) && (fo>fl || (!fl && !fo))){
      const mias = await api('/api/fichas').catch(()=>[]);
      const lista = fo>fl ? c.fichas : unirListasPorId(mias, c.fichas);
      if(JSON.stringify(lista)!==JSON.stringify(mias)){ await postJSON('/api/fichas', lista); res.fichas = lista.length; }
    }
    nuevo.fichasMod = Math.max(fl, fo) || undefined;
    if(borrados.length) nuevo.borrados = borrados;
    const nPerf = (nuevo.perfiles||[]).length - ((local.ajustes||{}).perfiles||[]).length;
    if(JSON.stringify(nuevo)!==antes){ await postJSON('/api/ajustes', nuevo); res.perfiles = Math.max(1, nPerf); }
  }
  // lecturas
  const porId = new Map((local.sesiones||[]).map(s=>[s.id, s]));
  for(const s of (c.sesiones||[])){ if(!s || B.has('sesion:'+s.id)) continue; const l=porId.get(s.id); if(!l || sesionMejor(s, l)){ await postJSON('/api/sesion', s); res.sesiones++; } }
  // lo que se borró en el otro aparato se borra también aquí (va a la papelera de este aparato)
  for(const s of (local.sesiones||[])){
    if(B.has('sesion:'+s.id)){ await api('/api/sesion/'+s.id, {method:'DELETE'}).catch(()=>{}); res.borrados++; }
    else if(s.audio && B.has('audio:'+s.id)){ await api('/api/audio/'+s.id, {method:'DELETE'}).catch(()=>{}); res.borrados++; }
  }
  // grabaciones
  const conAudio = new Set((local.sesiones||[]).filter(s=>s.audio).map(s=>s.id));
  for(const [id, a] of Object.entries(c.audios||{})){ if(!conAudio.has(id) && a && a.b64 && !B.has('audio:'+id) && !B.has('sesion:'+id)){ await api('/api/audio/'+id, {method:'POST', body:deBase64(a.b64, a.tipo)}); res.grabaciones++; } }
  // imágenes propias (fotos de perfil, fondos, fichas…)
  const mis = await api('/api/misimagenes').catch(()=>({}));
  const imgBorrada = (k, mtime) => B.has('imagen:'+k) && mtime*1000 <= B.get('imagen:'+k);
  for(const [k, mt] of Object.entries(mis)){ if(imgBorrada(k, mt)){ await api('/api/misimagenes/'+k, {method:'DELETE'}).catch(()=>{}); delete mis[k]; res.borrados++; } }
  for(const [k, im] of Object.entries(c.imagenes||{})){ if(im && im.b64 && !imgBorrada(k, im.mtime) && (!mis[k] || im.mtime>mis[k])){ await api('/api/misimagenes/'+k+'?mtime='+im.mtime, {method:'POST', body:deBase64(im.b64,'image/jpeg')}); res.imagenes++; } }
  // historias nuevas
  const listaNuevas = await api('/api/historias-nuevas').catch(()=>[]);
  const hay = new Set(listaNuevas.map(n=>n.archivo));
  const nuevaBorrada = (nombre, f) => B.has('historias:'+nombre) && (f||0) <= B.get('historias:'+nombre);   // si se volvió a añadir después, no se borra
  for(const {archivo:n, f} of listaNuevas){ if(nuevaBorrada(n, f)){ await api('/api/historias-nuevas/'+encodeURIComponent(n), {method:'DELETE'}).catch(()=>{}); res.borrados++; } }
  for(const n of (c.nuevas||[])){ if(n && n.nombre && !hay.has(n.nombre) && !nuevaBorrada(n.nombre, n.f) && Array.isArray(n.historias)){ try{ await postJSON('/api/historias-nuevas', {nombre:n.nombre, historias:n.historias}); res.historias++; }catch(e){} } }
  res.total = res.sesiones + res.grabaciones + res.imagenes + res.fichas + res.historias + res.perfiles + res.borrados;
  return res;
}
function unirListasPorId(a, b){ const m=new Map(); (a||[]).forEach(x=>m.set(x.id, x)); (b||[]).forEach(x=>{ if(!m.has(x.id)) m.set(x.id, x); }); return [...m.values()]; }
function resumenUnion(r){
  const t=[]; if(r.sesiones) t.push(r.sesiones+(r.sesiones===1?' lectura':' lecturas')); if(r.grabaciones) t.push(r.grabaciones+(r.grabaciones===1?' grabación':' grabaciones'));
  if(r.imagenes) t.push(r.imagenes+(r.imagenes===1?' imagen':' imágenes')); if(r.historias) t.push(r.historias+(r.historias===1?' paquete de historias':' paquetes de historias'));
  if(r.fichas) t.push('las fichas'); if(r.perfiles) t.push('perfiles y ajustes'); if(r.borrados) t.push(r.borrados+' cosas borradas en el otro aparato');
  return t.length ? t.join(', ') : 'nada nuevo';
}
const nombreCopia = () => { const a=(EST.aparato&&EST.aparato.nombre)||'tablet'; const f=new Date(); const dd=n=>String(n).padStart(2,'0');
  return `LeeLEEJG-${a.replace(/[^A-Za-z0-9]+/g,'')}-${f.getFullYear()}-${dd(f.getMonth()+1)}-${dd(f.getDate())}-${dd(f.getHours())}${dd(f.getMinutes())}.leelee.txt`; };

/* --- en el ordenador: la carpeta LeeLEEJG de Google Drive --- */
async function sincroOrdenador({enviar=true}={}){
  let s; try{ s=await api('/api/sincro'); }catch(e){ return {disponible:false}; }
  if(!s.disponible) return s;
  const res = {disponible:true, carpeta:s.carpeta, unidos:[], total:0};
  for(const f of s.archivos.filter(x=>!x.importado && !x.propio)){
    try{ const c = await (await fetch('/api/sincro/archivo?n='+encodeURIComponent(f.nombre))).json();
      const r = await unirCopia(c); if(!r.propia && r.total){ res.unidos.push({nombre:f.nombre, aparato:(c.aparato&&c.aparato.nombre)||'', r}); res.total+=r.total; }
      await postJSON('/api/sincro/importado', {nombre:f.nombre, fecha:f.fecha});
    }catch(e){ registrar('Copia de '+NUBE+' '+f.nombre+': '+e.message); }
  }
  if(res.total) await cargarDatos();   // lo juntado pasa a la pantalla antes de hacer la copia del ordenador
  if(enviar) await enviarOrdenador().catch(e=>registrar('Enviar a '+NUBE+': '+e.message));
  return res;
}
async function enviarOrdenador(){
  const copia = await crearCopia();
  await api('/api/sincro/guardar?n='+encodeURIComponent('LeeLEEJG-ordenador.leelee.json'), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(copia)});
}

/* --- en la tablet (o el ordenador sin Google Drive): compartir o descargar la copia y abrir un archivo --- */
async function enviarTablet(){
  const copia = await crearCopia();
  const nombre = nombreCopia(); const archivo = new File([JSON.stringify(copia)], nombre, {type:'text/plain'});
  let compartido=false;
  if(enLocal() && navigator.canShare && navigator.canShare({files:[archivo]})){
    try{ await navigator.share({files:[archivo], title:'Copia de LeeLEEJG'}); compartido=true; }
    catch(e){ if(e && e.name==='AbortError') return {cancelado:true}; }
  }
  if(!compartido){ const a=document.createElement('a'); a.href=URL.createObjectURL(archivo); a.download=nombre; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
  await postJSON('/api/sincro/copia', {}).catch(()=>{});
  return {nombre, compartido};
}
/* elegir el archivo de copia (el selector de imágenes es elegirArchivo, en recorte.js) */
function elegirCopia(){
  return new Promise(res=>{ const i=document.createElement('input'); i.type='file'; i.style.display='none';
    i.onchange=()=>{ const f=i.files && i.files[0]; i.remove(); res(f||null); }; document.body.appendChild(i); i.click(); });
}
async function traerTablet(){
  const f = await elegirCopia(); if(!f) return null;
  let c; try{ c = JSON.parse(await f.text()); }catch(e){ throw new Error('Este archivo no es una copia de LeeLEEJG.'); }
  return unirCopia(c);
}

/* --- tarjeta en «Datos y copias» --- */
function sincroHTML(info){
  const cab = `<h3>${ic('nube')} Tablet y ordenador (${NUBE})</h3>`;
  const fecha = f => esc(new Date(f).toLocaleString('es-ES',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'}));
  const botonesMano = (enviar, traer) => `<div class="botones" style="margin-top:10px"><button class="btn btn-p" type="button" id="btnEnviarSin">${ic('nube')} ${enviar}</button><button class="btn" type="button" id="btnTraerSin">${ic('descarga')} ${traer}</button></div>`;
  if(enLocal()){
    const ult = info && info.ultimaCopia ? 'Última vez enviado: '+fecha(info.ultimaCopia) : 'Todavía no se ha enviado nada.';
    return `<div class="card ajuste" id="cardSincro">${cab}
      <p class="nota"><b>Enviar:</b> elige <b>Drive</b> y guarda el archivo en la carpeta <b>LeeLEEJG</b> de Mi unidad. El ordenador lo junta solo la próxima vez que se abra.<br>
      <b>Traer:</b> busca en Drive, carpeta LeeLEEJG, el archivo <b>LeeLEEJG-ordenador</b>. Se juntan las lecturas de los dos sitios; no se borra nada.</p>
      <p class="nota" style="margin-top:6px">${ult}</p>${botonesMano('Enviar a '+NUBE, 'Traer del ordenador')}</div>`;
  }
  if(!info || !info.disponible) return `<div class="card ajuste" id="cardSincro">${cab}
    <p class="nota">No encuentro ${NUBE} en este ordenador. Con <b>Google Drive para ordenadores</b> instalado y la sesión iniciada, el programa recoge solo las copias de la tablet en <b>Mi unidad › LeeLEEJG</b> y deja allí la suya.</p>
    <p class="nota" style="margin-top:6px">Mientras tanto, a mano: <b>Guardar copia</b> la deja en Descargas (súbela a Drive › LeeLEEJG desde drive.google.com) y <b>Traer copia</b> abre la que haya enviado la tablet.</p>
    ${botonesMano('Guardar copia', 'Traer copia de la tablet')}</div>`;
  const tabl = info.archivos.filter(a=>!a.propio);
  return `<div class="card ajuste" id="cardSincro">${cab}
    <p class="nota">Carpeta: <b>${esc(info.carpeta)}</b><br>Cada vez que se abre, el programa junta las copias que la tablet ha dejado ahí y deja la suya (<b>LeeLEEJG-ordenador</b>) para que la tablet la pueda traer.</p>
    <p class="nota" style="margin-top:6px">${tabl.length ? `Copias de la tablet: ${tabl.length} (${tabl.filter(a=>!a.importado).length} sin juntar).` : 'Todavía no hay copias de la tablet.'}${info.propia ? ' · Copia del ordenador: '+fecha(info.propia) : ''}</p>
    <div class="botones" style="margin-top:10px"><button class="btn btn-p" type="button" id="btnSincroPC">${ic('recargar')} Juntar y enviar ahora</button></div></div>`;
}
function activarSincro(){
  const ocupado=(b,t)=>{ b.disabled=true; b.dataset.t=b.innerHTML; b.textContent=t; }, libre=b=>{ b.disabled=false; if(b.dataset.t) b.innerHTML=b.dataset.t; };
  const trasUnir = r => { if(!r) return; if(r.propia){ dialogo({titulo:'Es la copia de este mismo aparato', html:'<p class="nota">Elige la copia del otro aparato (en el ordenador se llama «LeeLEEJG-ordenador»).</p>', botones:[{t:'Vale',cls:'btn-p'}]}); return; }
    dialogo({titulo:r.total?'Datos juntados':'No había nada nuevo', html:`<p class="nota">${r.total?'Se ha añadido: '+esc(resumenUnion(r))+'.':'Este aparato ya tenía todo lo de esa copia.'}</p>`, botones:[{t:'Vale',cls:'btn-p', fn:()=>{ if(r.total) recargarSinGuardar(); }}], alCerrar:()=>{ if(r.total) recargarSinGuardar(); }}); };
  const fallo = e => dialogo({titulo:'No se pudo', html:`<p class="nota">${esc(e.message||e)}</p>`, botones:[{t:'Vale',cls:'btn-p'}]});
  const be=$('#btnEnviarSin'); if(be) be.onclick=async()=>{ ocupado(be,'Preparando la copia…'); try{ const r=await enviarTablet(); if(!r.cancelado) aviso(r.compartido?'Copia enviada':'Copia guardada en Descargas: súbela a Drive › LeeLEEJG'); if(actual==='datos') ir('datos'); }catch(e){ fallo(e); } libre(be); };
  const bt=$('#btnTraerSin'); if(bt) bt.onclick=async()=>{ ocupado(bt,'Juntando…'); try{ trasUnir(await traerTablet()); }catch(e){ fallo(e); } libre(bt); };
  const bp=$('#btnSincroPC'); if(bp) bp.onclick=async()=>{ ocupado(bp,'Juntando y enviando…'); try{ const r=await sincroOrdenador(); trasUnir({total:r.total||0, ...sumar((r.unidos||[]).map(u=>u.r))}); }catch(e){ fallo(e); } libre(bp); };
}
function sumar(rs){ const t={sesiones:0, grabaciones:0, imagenes:0, fichas:0, historias:0, perfiles:0, borrados:0}; rs.forEach(r=>Object.keys(t).forEach(k=>t[k]+=r[k]||0)); return t; }
