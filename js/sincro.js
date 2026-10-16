/* LeeLEEJG · copias entre la tablet y el ordenador (por OneDrive)
   Cada aparato guarda una «copia» (un archivo LeeLEEJG-….leelee.json/.txt) y el otro la junta con lo suyo:
   - lecturas: se suman; si la misma lectura está en los dos, gana la más completa o la revisada;
   - perfiles: gana el cambiado más tarde, pero se juntan los registros (repaso, dictado, temas) y el plan;
   - fichas, imágenes propias, historias nuevas y grabaciones (de los últimos 30 días): se añaden las que falten.
   Nada se borra al juntar. */
'use strict';
const SINCRO_DIAS_AUDIO = 30;
const CAMPOS_LOCALES = new Set(['voz','vozPrograma','perfil','volumen','mod', ...PKEYS]);   // propios de cada aparato
const LISTAS_PERFIL = ['repasoLog','dictadoLog','temasLog'];
const clon = x => x==null ? x : JSON.parse(JSON.stringify(x));

/* --- marcas de cambio: así se sabe qué es más nuevo al juntar --- */
let huellasAj = null;
function sellarCambios(){
  const ahora=Date.now(), h={};
  (aj.perfiles||[]).forEach(p=>{ const {mod, ...resto}=p; h['p:'+p.id]=JSON.stringify(resto); });
  const g={}; Object.keys(aj).sort().forEach(k=>{ if(!CAMPOS_LOCALES.has(k) && k!=='perfiles') g[k]=aj[k]; }); h.g=JSON.stringify(g);
  if(huellasAj){
    (aj.perfiles||[]).forEach(p=>{ if(huellasAj['p:'+p.id]!==h['p:'+p.id]){ p.mod=ahora; } });
    if(huellasAj.g!==h.g) aj.mod=ahora;
  }
  huellasAj=h;
}

/* --- juntar --- */
function unirListas(a, b){
  const vistos=new Set(), out=[];
  [...(a||[]), ...(b||[])].forEach(x=>{ const k=JSON.stringify(x); if(!vistos.has(k)){ vistos.add(k); out.push(x); } });
  const fecha = x => (x && (x.f || x.fecha)) || '';
  if(out.every(x=>fecha(x))) out.sort((x,y)=>fecha(x)<fecha(y)?-1:fecha(x)>fecha(y)?1:0);
  return out;
}
function unirPerfil(pl, po){
  const [gana, pierde] = (po.mod||0) > (pl.mod||0) ? [clon(po), pl] : [clon(pl), po];
  gana.cfg = gana.cfg || {}; const pc = pierde.cfg || {};
  LISTAS_PERFIL.forEach(k=>{ if(gana.cfg[k] || pc[k]) gana.cfg[k] = unirListas(gana.cfg[k], pc[k]); });
  if(gana.cfg.plan || pc.plan) gana.cfg.plan = {...(pc.plan||{}), ...(gana.cfg.plan||{})};
  return gana;
}
function unirAjustes(l, o){
  const r = clon(l||{});
  if(!o) return r;
  if((o.mod||0) > (r.mod||0)){ Object.keys(o).forEach(k=>{ if(!CAMPOS_LOCALES.has(k) && k!=='perfiles') r[k]=clon(o[k]); }); r.mod=o.mod; }
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

async function guardarAjYa(){ guardarCfgPerfil(); sellarCambios(); clearTimeout(tGuardarAj); await postJSON('/api/ajustes', aj); }

async function crearCopia({audios=true}={}){
  await guardarAjYa();
  const d = await api('/api/datos');
  const fichas = await api('/api/fichas').catch(()=>[]);
  const nuevas = [];
  for(const n of await api('/api/historias-nuevas').catch(()=>[])){ try{ nuevas.push({nombre:n.archivo, historias: await api('/api/historias-nuevas/'+encodeURIComponent(n.archivo))}); }catch(e){} }
  const imagenes = {};
  for(const [k, mt] of Object.entries(await api('/api/misimagenes').catch(()=>({})))){
    try{ const r=await fetch('/mis-imagenes/'+k+'.jpg?v='+mt); if(r.ok) imagenes[k]={mtime:mt, b64: await aBase64(await r.blob())}; }catch(e){}
  }
  const grab = {}; const desde = Date.now() - SINCRO_DIAS_AUDIO*864e5;
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
  await guardarAjYa().catch(()=>{});
  uniendo=true;
  try{ return await unirCopiaDentro(c); } finally { uniendo=false; }
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
      nuevo.fichasMod = Math.max(fl, fo) || undefined;
    }
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
  const hay = new Set((await api('/api/historias-nuevas').catch(()=>[])).map(n=>n.archivo));
  for(const n of hay){ if(B.has('historias:'+n)){ await api('/api/historias-nuevas/'+encodeURIComponent(n), {method:'DELETE'}).catch(()=>{}); res.borrados++; } }
  for(const n of (c.nuevas||[])){ if(n && n.nombre && !hay.has(n.nombre) && !B.has('historias:'+n.nombre) && Array.isArray(n.historias)){ try{ await postJSON('/api/historias-nuevas', {nombre:n.nombre, historias:n.historias}); res.historias++; }catch(e){} } }
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

/* --- en el ordenador: la carpeta LeeLEEJG de OneDrive --- */
async function sincroOrdenador({enviar=true}={}){
  let s; try{ s=await api('/api/sincro'); }catch(e){ return {disponible:false}; }
  if(!s.disponible) return s;
  const res = {disponible:true, carpeta:s.carpeta, unidos:[], total:0};
  for(const f of s.archivos.filter(x=>!x.importado && !x.propio)){
    try{ const c = await (await fetch('/api/sincro/archivo?n='+encodeURIComponent(f.nombre))).json();
      const r = await unirCopia(c); if(!r.propia && r.total){ res.unidos.push({nombre:f.nombre, aparato:(c.aparato&&c.aparato.nombre)||'', r}); res.total+=r.total; }
      await postJSON('/api/sincro/importado', {nombre:f.nombre, fecha:f.fecha});
    }catch(e){ registrar('Copia de OneDrive '+f.nombre+': '+e.message); }
  }
  if(res.total) await cargarDatos();   // lo juntado pasa a la pantalla antes de hacer la copia del ordenador
  if(enviar) await enviarOrdenador().catch(e=>registrar('Enviar a OneDrive: '+e.message));
  return res;
}
async function enviarOrdenador(){
  const copia = await crearCopia();
  await api('/api/sincro/guardar?n='+encodeURIComponent('LeeLEEJG-ordenador.leelee.json'), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(copia)});
}

/* --- en la tablet: compartir con OneDrive y abrir un archivo --- */
async function enviarTablet(){
  const copia = await crearCopia();
  const nombre = nombreCopia(); const archivo = new File([JSON.stringify(copia)], nombre, {type:'text/plain'});
  let compartido=false;
  if(navigator.canShare && navigator.canShare({files:[archivo]})){
    try{ await navigator.share({files:[archivo], title:'Copia de LeeLEEJG'}); compartido=true; }
    catch(e){ if(e && e.name==='AbortError') return {cancelado:true}; }
  }
  if(!compartido){ const a=document.createElement('a'); a.href=URL.createObjectURL(archivo); a.download=nombre; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
  await postJSON('/api/sincro/copia', {}).catch(()=>{});
  return {nombre, compartido};
}
function elegirArchivo(){
  return new Promise(res=>{ const i=document.createElement('input'); i.type='file'; i.style.display='none';
    i.onchange=()=>{ const f=i.files && i.files[0]; i.remove(); res(f||null); }; document.body.appendChild(i); i.click(); });
}
async function traerTablet(){
  const f = await elegirArchivo(); if(!f) return null;
  let c; try{ c = JSON.parse(await f.text()); }catch(e){ throw new Error('Este archivo no es una copia de LeeLEEJG.'); }
  return unirCopia(c);
}

/* --- tarjeta en «Datos y copias» --- */
function sincroHTML(info){
  const cab = `<h3>${ic('nube')} Tablet y ordenador (OneDrive)</h3>`;
  if(enLocal()){
    const ult = info && info.ultimaCopia ? 'Última vez enviado: '+esc(new Date(info.ultimaCopia).toLocaleString('es-ES',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})) : 'Todavía no se ha enviado nada.';
    return `<div class="card ajuste" id="cardSincro">${cab}
      <p class="nota"><b>Enviar:</b> elige <b>OneDrive</b> y guarda el archivo en la carpeta <b>LeeLEEJG</b>. El ordenador lo junta solo la próxima vez que se abra.<br>
      <b>Traer:</b> busca en OneDrive, carpeta LeeLEEJG, el archivo <b>LeeLEEJG-ordenador</b>. Se juntan las lecturas de los dos sitios; no se borra nada.</p>
      <p class="nota" style="margin-top:6px">${ult}</p>
      <div class="botones" style="margin-top:10px"><button class="btn btn-p" type="button" id="btnEnviarSin">${ic('nube')} Enviar a OneDrive</button><button class="btn" type="button" id="btnTraerSin">${ic('descarga')} Traer del ordenador</button></div></div>`;
  }
  if(!info || !info.disponible) return `<div class="card ajuste" id="cardSincro">${cab}<p class="nota">No encuentro OneDrive en este ordenador. Si lo instalas e inicias sesión, el programa guardará y recogerá las copias de la tablet en la carpeta OneDrive\\LeeLEEJG.</p></div>`;
  const tabl = info.archivos.filter(a=>!a.propio);
  return `<div class="card ajuste" id="cardSincro">${cab}
    <p class="nota">Carpeta: <b>${esc(info.carpeta)}</b><br>Cada vez que se abre, el programa junta las copias que la tablet ha dejado ahí y deja la suya (<b>LeeLEEJG-ordenador</b>) para que la tablet la pueda traer.</p>
    <p class="nota" style="margin-top:6px">${tabl.length ? `Copias de la tablet: ${tabl.length} (${tabl.filter(a=>!a.importado).length} sin juntar).` : 'Todavía no hay copias de la tablet.'}${info.propia ? ' · Copia del ordenador: '+esc(new Date(info.propia).toLocaleString('es-ES',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})) : ''}</p>
    <div class="botones" style="margin-top:10px"><button class="btn btn-p" type="button" id="btnSincroPC">${ic('recargar')} Juntar y enviar ahora</button></div></div>`;
}
function activarSincro(){
  const ocupado=(b,t)=>{ b.disabled=true; b.dataset.t=b.innerHTML; b.textContent=t; }, libre=b=>{ b.disabled=false; if(b.dataset.t) b.innerHTML=b.dataset.t; };
  const trasUnir = r => { if(!r) return; if(r.propia){ dialogo({titulo:'Es la copia de este mismo aparato', html:'<p class="nota">Elige la copia del otro aparato (en el ordenador se llama «LeeLEEJG-ordenador»).</p>', botones:[{t:'Vale',cls:'btn-p'}]}); return; }
    dialogo({titulo:r.total?'Datos juntados':'No había nada nuevo', html:`<p class="nota">${r.total?'Se ha añadido: '+esc(resumenUnion(r))+'.':'Este aparato ya tenía todo lo de esa copia.'}</p>`, botones:[{t:'Vale',cls:'btn-p', fn:()=>{ if(r.total) location.reload(); }}], alCerrar:()=>{ if(r.total) location.reload(); }}); };
  const fallo = e => dialogo({titulo:'No se pudo', html:`<p class="nota">${esc(e.message||e)}</p>`, botones:[{t:'Vale',cls:'btn-p'}]});
  const be=$('#btnEnviarSin'); if(be) be.onclick=async()=>{ ocupado(be,'Preparando la copia…'); try{ const r=await enviarTablet(); if(!r.cancelado) aviso(r.compartido?'Copia enviada':'Copia descargada: súbela a OneDrive › LeeLEEJG'); if(actual==='datos') ir('datos'); }catch(e){ fallo(e); } libre(be); };
  const bt=$('#btnTraerSin'); if(bt) bt.onclick=async()=>{ ocupado(bt,'Juntando…'); try{ trasUnir(await traerTablet()); }catch(e){ fallo(e); } libre(bt); };
  const bp=$('#btnSincroPC'); if(bp) bp.onclick=async()=>{ ocupado(bp,'Juntando y enviando…'); try{ const r=await sincroOrdenador(); trasUnir({total:r.total||0, ...sumar((r.unidos||[]).map(u=>u.r))}); }catch(e){ fallo(e); } libre(bp); };
}
function sumar(rs){ const t={sesiones:0, grabaciones:0, imagenes:0, fichas:0, historias:0, perfiles:0, borrados:0}; rs.forEach(r=>Object.keys(t).forEach(k=>t[k]+=r[k]||0)); return t; }
