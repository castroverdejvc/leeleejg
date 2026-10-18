/* LeeLEEJG · zona de familia y profesorado */
'use strict';
let lectorAdulto=null;   // lector que se está mirando en la zona de adultos
const lectorVisto = () => aj.perfiles.find(p=>p.id===lectorAdulto) || perfil();
function selLector(pantalla){
  const ps=aj.perfiles.slice().sort((a,b)=>(!!a.prueba)-(!!b.prueba)); const v=lectorVisto();
  return `<div class="sel-lector">${ps.map(p=>`<button type="button" data-lec="${esc(p.id)}" data-pant="${pantalla}" aria-pressed="${p.id===v.id}">${avatarHTML(p)}${esc(p.nombre)}${p.prueba?' <span class="pill-prueba">Pruebas</span>':''}</button>`).join('')}</div>`;
}
document.addEventListener('click', e=>{ const b=e.target.closest('[data-lec]'); if(b){ lectorAdulto=b.dataset.lec; ir(b.dataset.pant); } });

/* ---------- 25 · Acceso de adultos (PIN) ---------- */
definir('pin', {zona:'pin', pintar(){
  let val=''; const s=$('#s-pin');
  const pinta=(msg='')=>{ s.innerHTML = `<div class="pin-pant"><div class="pin-ilus"><span class="blob"></span>${imgHTML('buho',true)}<span class="frase">Aprender<br>también<br>es crecer</span></div>
    <div class="pin-caja"><div class="logo" style="font-size:1.5rem">${icLogo()}<span>LeeLEE<b>JG</b></span></div><h1 class="tit">Acceso de adultos</h1><p class="sub">Introduce tu PIN de 4 dígitos</p>
      <div class="pin-puntos">${[0,1,2,3].map(i=>`<i class="${i<val.length?'on':''}"></i>`).join('')}</div>
      <div class="teclado">${[1,2,3,4,5,6,7,8,9].map(k=>`<button type="button" data-k="${k}">${k}</button>`).join('')}<button type="button" class="cero" data-k="0">0</button><button type="button" data-k="b" aria-label="Borrar">${ic('borrar')}</button></div>
      <p class="pin-msg">${esc(msg)}</p><button class="btn btn-p btn-g" type="button" id="pinEntrar" style="min-width:300px">Entrar</button><button class="btn" type="button" id="pinVolver" style="min-width:160px">Volver</button></div></div>`;
    $$('#s-pin [data-k]').forEach(b=>b.onclick=()=>tecla(b.dataset.k));
    $('#pinEntrar').onclick=entrar; $('#pinVolver').onclick=()=>{ volverTrasPin=null; ir('inicio'); }; };
  const tecla=k=>{ if(k==='b') val=val.slice(0,-1); else if(val.length<4) val+=k; pinta(); if(val.length===4) setTimeout(entrar,150); };
  const entrar=()=>{ if(val===aj.pin){ pinOk=true; const [p,a]=volverTrasPin||['evolucion',[]]; volverTrasPin=null; ir(p,...a); } else { val=''; pinta('PIN incorrecto'); } };
  pinta();
  s.onkeydown=null; document.onkeydown=e=>{ if(actual!=='pin') return; if(/^\d$/.test(e.key)) tecla(e.key); else if(e.key==='Backspace') tecla('b'); else if(e.key==='Enter') entrar(); };
}});
function pedirPinNuevo(cb){
  let val=''; const d=dialogo({titulo:'Elige un PIN de 4 números', html:`<div class="pin-puntos" id="pnP" style="justify-content:center"></div><div class="teclado" style="margin:0 auto">${[1,2,3,4,5,6,7,8,9].map(k=>`<button type="button" data-k="${k}">${k}</button>`).join('')}<button type="button" class="cero" data-k="0">0</button><button type="button" data-k="b">${ic('borrar')}</button></div>`});
  const pinta=()=>{ $('#pnP',d.el).innerHTML=[0,1,2,3].map(i=>`<i class="${i<val.length?'on':''}"></i>`).join(''); }; pinta();
  $$('[data-k]',d.el).forEach(b=>b.onclick=()=>{ const k=b.dataset.k; if(k==='b') val=val.slice(0,-1); else if(val.length<4) val+=k; pinta(); if(val.length===4){ d.cerrar(); cb(val); } });
}

/* ---------- 26 · Evolución ---------- */
let tabEvo='semana';
function semanas(ms, n=6){
  if(!ms.length) return [];
  const lunes=d=>{ const x=new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x.getTime(); };
  const g=new Map(); ms.forEach(s=>{ const k=lunes(s.fecha); if(!g.has(k)) g.set(k,[]); g.get(k).push(s); });
  return [...g.entries()].sort((a,b)=>a[0]-b[0]).slice(-n).map(([k,v],i,arr)=>({etq:'Sem '+(i+1+(g.size>n?g.size-n:0)), desde:new Date(k), ses:v}));
}
function barras(vals, etq, {max=100, color='#7DD9A8', suf=''}={}){
  if(!vals.length) return '<p class="vacio">Todavía no hay lecturas.</p>';
  const W=480,H=210,pl=36,pr=10,pt=24,pb=28; const n=vals.length; const bw=Math.min(54,(W-pl-pr)/n*0.6); const y=v=>pt+(H-pt-pb)*(1-Math.min(v,max)/max);
  let g=`<svg class="barras" viewBox="0 0 ${W} ${H}" role="img">`;
  for(let k=0;k<=4;k++){ const v=max*k/4; g+=`<line class="eje" x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${Math.round(v)}</text>`; }
  vals.forEach((v,i)=>{ const cx=pl+(i+.5)*(W-pl-pr)/n; const yy=y(v); g+=`<rect x="${cx-bw/2}" y="${yy}" width="${bw}" height="${H-pb-yy}" rx="5" fill="${color}" opacity="${.55+.45*(i+1)/n}"/><text class="val" x="${cx}" y="${yy-6}" text-anchor="middle">${Math.round(v)}${suf}</text><text x="${cx}" y="${H-8}" text-anchor="middle">${esc(etq[i])}</text>`; });
  return g+'</svg>';
}
const pctComp = s => { const n=preguntasHechas(s); return n ? Math.round(100*(s.aciertos||0)/n) : null; };
definir('evolucion', {zona:'adulto', pintar(tab){
  if(tab) tabEvo=tab; const p=lectorVisto(); const ms=sesDe(p.id);
  const TABS=[['semana','Esta semana'],['lecturas','Lecturas'],['temas','Temas e intereses'],['grabaciones','Grabaciones'],['palabras','Palabras'],['calculo','Cálculo'],['juegos','Juegos'],['premios','Premios y gustos']];
  let cuerpo='';
  if(tabEvo==='lecturas'){
    const sem=semanas(ms);
    cuerpo = `<div class="graf-2"><div class="card graf-card"><h3>Comprensión</h3>${barras(sem.map(w=>media(w.ses.map(pctComp))), sem.map(w=>w.etq), {max:100, color:'#5CCB8F'})}</div>
      <div class="card graf-card"><h3>Fluidez <small>(palabras por minuto)</small></h3>${barras(sem.map(w=>media(w.ses.map(s=>s.ppm||0))), sem.map(w=>w.etq), {max:Math.max(100, Math.ceil(Math.max(0,...ms.map(s=>s.ppm||0))/25)*25), color:'#9B8CF5'})}</div></div>
      <div class="card informe-banda">${ic('informe')}<div><b>Informe para la tutora</b><span class="nota">Resumen del progreso de ${esc(p.nombre)} con gráficos y palabras que le cuestan.</span></div><button class="btn btn-p" type="button" id="btnInforme">Generar informe</button></div>
      <div class="card bloque" style="margin-top:18px"><h3 style="margin-bottom:12px">Todas las lecturas</h3>${tablaLecturas(ms)}</div>`;
  } else if(tabEvo==='grabaciones'){
    const g=ms.filter(s=>s.audio).reverse();
    cuerpo = `<div class="lista-rev">${g.length?g.map(s=>{ const h=historia(s.historiaId); return `<div class="fila-rev">${h?imgHTML(h.portada):''}<div class="tx"><b>${esc(s.titulo)}</b><span class="nota">${esc(fechaCorta(s.fecha))} · ${mmss(s.segundos)} · ${s.ppm} palabras/min ${s.revisada?'':'· <b style="display:inline;color:var(--coral)">sin revisar</b>'}</span><div class="pl"></div></div>
      <button class="btn btn-mini" type="button" data-oir="${s.id}">${ic('play')} Escuchar</button><button class="btn btn-mini" type="button" data-rev="${s.id}">Revisar</button><button class="btn btn-mini btn-rojo" type="button" data-delg="${s.id}">Eliminar</button></div>`; }).join(''):'<p class="vacio">Todavía no hay grabaciones.</p>'}</div>`;
  } else if(tabEvo==='temas'){
    cuerpo = temasAdultoHTML(p);
  } else if(tabEvo==='semana'){
    cuerpo = semanaHTML(p);
  } else if(tabEvo==='juegos'){
    cuerpo = juegosAdultoHTML(p);
  } else if(tabEvo==='premios'){
    cuerpo = premiosAdultoHTML(p) + gustosAdultoHTML(p);
  } else if(tabEvo==='palabras'){
    const dif=palabrasDificiles(ms).slice(0,40), dom=palabrasDominadas(ms), pr=Object.entries(p.cfg&&p.cfg.practica||aj.practica||{});
    cuerpo = `<div class="graf-2"><div class="card bloque"><h3 style="margin-bottom:12px">Palabras que le cuestan</h3>${dif.length?`<div class="palabras-chips">${dif.map(x=>`<span>${esc(x.p)}<small>${esc(silabear(x.p).join('-'))} · ${x.n}</small></span>`).join('')}</div>`:'<p class="vacio">Ninguna por ahora. Se apuntan cuando pide ayuda o al revisar una grabación.</p>'}</div>
      <div class="card bloque"><h3 style="margin-bottom:12px">Palabras que ya domina</h3>${dom.length?`<div class="palabras-chips">${dom.slice(0,80).map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:'<p class="vacio">Aparecen cuando lee una palabra bien al menos dos veces.</p>'}
      ${pr.length?`<h3 style="margin:18px 0 10px">Ha practicado</h3><div class="palabras-chips">${pr.map(([w,n])=>`<span>${esc(w)}<small>×${n}</small></span>`).join('')}</div>`:''}</div></div>`;
  } else {
    const cs=ms.filter(s=>s.calculo); const tipos=[['suma','Sumas'],['resta','Restas'],['contar','Contar']];
    const pct=t=>{ const x=cs.filter(s=>s.calculo.tipo===t); return x.length?Math.round(100*x.filter(s=>s.calculo.ok).length/x.length):0; };
    cuerpo = `<div class="graf-2"><div class="card graf-card"><h3>Aciertos a la primera</h3>${cs.length?(()=>{ const ts=tipos.filter(([t])=>cs.some(s=>s.calculo.tipo===t)); return barras(ts.map(([t])=>pct(t)), ts.map(([,n])=>n), {max:100, color:'#5FA4FF', suf:'%'}); })():'<p class="vacio">Todavía no hay cálculos.</p>'}</div>
      <div class="card bloque"><h3 style="margin-bottom:12px">Últimos retos</h3>${cs.length?`<table><thead><tr><th>Fecha</th><th>Historia</th><th>Tipo</th><th>Resultado</th></tr></thead><tbody>${cs.slice(-12).reverse().map(s=>`<tr><td>${esc(fechaCorta(s.fecha))}</td><td>${esc(s.titulo)}</td><td>${esc(s.calculo.tipo)}</td><td><span class="nb ${s.calculo.ok?'bien':'medio'}">${s.calculo.ok?'A la primera':s.calculo.intentos+' intentos'}</span></td></tr>`).join('')}</tbody></table>`:'<p class="vacio">—</p>'}</div></div>`;
  }
  $('#s-evolucion').innerHTML = `<div class="pag-cab"><h1>Evolución</h1>${selLector('evolucion')}</div>
    <div class="ficha">${avatarHTML(p)}<div><b>${esc(p.nombre)}</b><span class="nota">${esc([p.curso, p.prueba?'usuario de pruebas':'', ms.length?ms.length+' lecturas':'Todavía sin lecturas'].filter(Boolean).join(' · '))}</span></div></div>
    <div class="tabs" role="tablist">${TABS.map(([k,t])=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${k===tabEvo}">${t}</button>`).join('')}</div>${cuerpo}`;
  $$('#s-evolucion [data-tab]').forEach(b=>b.onclick=()=>ir('evolucion', b.dataset.tab));
  if($('#btnInforme')) $('#btnInforme').onclick=()=>ir('informe', p.id);
  activarAccionesLecturas('#s-evolucion');
  if(tabEvo==='temas') activarTemasAdulto(p);
  if(tabEvo==='premios') activarPremiosAdulto();
}});
function tablaLecturas(ms){
  if(!ms.length) return '<p class="vacio">Todavía no hay lecturas.</p>';
  return `<div class="tabla-w"><table><thead><tr><th>Fecha</th><th>Historia</th><th>Comprensión</th><th>Cálculo</th><th>Palabras/min</th><th></th></tr></thead><tbody>${ms.slice().reverse().map(s=>{ const r=pctComp(s);
    return `<tr><td style="white-space:nowrap">${esc(fechaCorta(s.fecha))}</td><td><b>${esc(s.titulo)}</b>${esComp(s.historiaId)?' <span class="nb extra">extra</span>':''}${s.revisada?'':' <span class="nb medio">sin revisar</span>'}${s.incompleta?' <span class="nb medio">a medias</span>':''}</td><td>${r==null?'–':`<span class="nb ${r>=99?'bien':r>=60?'medio':'mal'}">${s.aciertos||0} de ${preguntasHechas(s)}</span>`}</td><td>${s.calculo?`<span class="nb ${s.calculo.ok?'bien':'medio'}">${s.calculo.ok?'✓':'con ayuda'}</span>`:'–'}</td><td>${s.ppm}</td>
      <td style="white-space:nowrap">${s.audio?`<button class="btn btn-mini" type="button" data-rev="${s.id}">Revisar</button> `:''}<button class="btn btn-mini btn-rojo" type="button" data-dels="${s.id}">Borrar</button></td></tr>`; }).join('')}</tbody></table></div>`;
}
function activarAccionesLecturas(raiz){
  $$(raiz+' [data-rev]').forEach(b=>b.onclick=()=>ir('revisar', b.dataset.rev));
  $$(raiz+' [data-oir]').forEach(b=>b.onclick=()=>{ const c=b.closest('.fila-rev').querySelector('.pl'); if(!c.children.length){ crearReproductor(c, '/api/audio/'+b.dataset.oir).audio.play().catch(()=>{}); } });
  $$(raiz+' [data-delg]').forEach(b=>b.onclick=()=>{ const s=SES.find(x=>x.id===b.dataset.delg); const h=s&&historia(s.historiaId);
    dialogo({titulo:'¿Eliminar esta grabación?', html:`<p class="nota">La grabación va a la papelera de la carpeta de datos. La lectura y sus resultados se conservan.</p><div class="fila-rev" style="margin-top:10px">${h?imgHTML(h.portada):''}<div class="tx"><b>${esc(s.titulo)}</b><span class="nota">${esc(fechaCorta(s.fecha))} · ${mmss(s.segundos)}</span></div></div>`,
      botones:[{t:'Conservar', cls:'btn'},{t:'Eliminar', cls:'btn-rojo', fn:async()=>{ await borrar('/api/audio/'+s.id).catch(()=>{}); s.audio=false; aviso('Grabación eliminada'); ir(actual); }}]}); });
  $$(raiz+' [data-dels]').forEach(b=>b.onclick=()=>{ const s=SES.find(x=>x.id===b.dataset.dels);
    dialogo({titulo:'¿Borrar esta lectura?', html:`<p class="nota">«${esc(s.titulo)}», ${esc(fechaCorta(s.fecha))}. Se mueve a la papelera de la carpeta de datos (con su grabación).</p>`,
      botones:[{t:'Conservar', cls:'btn'},{t:'Borrar', cls:'btn-rojo', fn:async()=>{ await borrar('/api/sesion/'+s.id).catch(()=>{}); SES=SES.filter(x=>x.id!==s.id); aviso('Lectura borrada'); ir(actual); }}]}); });
}

/* ---------- 27 · Revisar lecturas ---------- */
let revS=null, revI=0, revP=null;
function palabrasDeHistoria(h){ const out=[]; h.lineas.forEach((l,li)=>tokenizar(conNombre(l)).forEach(tk=>{ if(normalizar(tk.texto)) out.push({texto:tk.texto, linea:li, clave:tk.tipo==='foto'?tk.clave:null}); })); return out; }
const marcadas = s => s.palabras.map((p,i)=>i).filter(i=>{ const p=s.palabras[i]; return p.e!=='ok' || p.a || p.m || p.r; });
definir('revisar', {zona:'adulto', pintar(id){
  if(revP){ revP.parar(); revP=null; }
  if(id && (!revS || revS.id!==id)){ const s=SES.find(x=>x.id===id); revS=s?JSON.parse(JSON.stringify(s)):null; revI=0; const m=revS?marcadas(revS):[]; if(m.length) revI=m[0]; }
  if(id===null) revS=null;
  if(!revS){ // lista
    const p=lectorVisto(); const ms=sesDe(p.id).filter(s=>s.audio).reverse(); const pend=ms.filter(s=>!s.revisada), hech=ms.filter(s=>s.revisada);
    const fila=s=>{ const h=historia(s.historiaId); const n=marcadas(s).length; return `<button class="fila-rev" type="button" data-r="${s.id}">${h?imgHTML(h.portada):''}<span class="tx"><b>${esc(s.titulo)}</b><span class="nota">${esc(fechaCorta(s.fecha))} · ${mmss(s.segundos)} · ${n} ${n===1?'palabra':'palabras'} para revisar</span></span>${s.revisada?'<span class="nb bien">Revisada</span>':'<span class="nb medio">Pendiente</span>'}</button>`; };
    $('#s-revisar').innerHTML = `<div class="pag-cab"><h1>Revisar lecturas</h1>${selLector('revisar')}</div>
      <p class="sub" style="margin-bottom:16px">Escucha cada palabra que el programa no tenía clara y márcala. Así las palabras difíciles son de verdad las que le cuestan.</p>
      ${pend.length?`<h3 style="margin:8px 0 10px">Pendientes</h3><div class="lista-rev">${pend.map(fila).join('')}</div>`:''}
      ${hech.length?`<h3 style="margin:22px 0 10px">Ya revisadas</h3><div class="lista-rev">${hech.map(fila).join('')}</div>`:''}
      ${!ms.length?'<p class="vacio">No hay grabaciones de este lector.</p>':''}`;
    $$('#s-revisar [data-r]').forEach(b=>b.onclick=()=>ir('revisar', b.dataset.r));
    return;
  }
  const s=revS, h=historia(s.historiaId); const ws=h?palabrasDeHistoria(h):[]; const m=marcadas(s);
  const p=s.palabras[revI]||{}; const w=ws[revI]||{texto:p.p, linea:0};
  const linea = ws.map((x,i)=>({x,i})).filter(o=>o.x.linea===w.linea).map(({x,i})=>`<span class="${i===revI?'esta':(i<revI?'ok':'')}" data-wi="${i}" style="cursor:pointer">${esc(x.texto)}</span>`).join(' ');
  const pos=m.indexOf(revI); const v = p.e==='ayuda'?'practica':p.e;
  $('#s-revisar').innerHTML = `<div class="pag-cab"><h1>Revisar una lectura</h1><button class="btn" type="button" id="revLista">${ic('atras')} Todas las grabaciones</button></div>
    <div class="card bloque revisar"><div class="rev-foto">${h?imgHTML(w.clave||h.portada,true):''}</div>
      <div class="nota">${esc(s.titulo)} · ${esc(new Date(s.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'long'}))} · ${s.ppm} palabras por minuto</div>
      <div class="rev-frase">${linea}</div><div id="revAudio"></div>
      <div><b>Marca la lectura de esta palabra: <span style="font-family:var(--f-lect);font-size:1.5rem">${esc(w.texto)}</span></b>${p.e==='ayuda'?' <span class="nb medio">pidió ayuda</span>':''}${p.e==='pendiente'?' <span class="nb medio">el programa no la oyó bien</span>':''}</div>
      <div class="marcar"><button type="button" class="m-ok" data-v="ok" aria-pressed="${v==='ok'&&!!p.r}"><i></i>Lectura correcta</button><button type="button" class="m-pr" data-v="practica" aria-pressed="${v==='practica'}"><i></i>Necesita práctica</button><button type="button" class="m-nc" data-v="noclaro" aria-pressed="${v==='noclaro'}"><i></i>Audio no claro</button></div>
      <div class="botones"><button class="btn btn-g" type="button" id="revAnt" ${pos<=0?'disabled':''}>${ic('izq')} Anterior</button><span class="nota" style="align-self:center;flex:0;white-space:nowrap">${pos>=0?(pos+1)+' de '+m.length:''}</span><button class="btn btn-g" type="button" id="revSig" ${pos<0||pos>=m.length-1?'disabled':''}>Siguiente ${ic('dcha')}</button><button class="btn btn-p btn-g" type="button" id="revGuardar">Guardar revisión</button></div>
      <p class="nota">Toca cualquier palabra de la frase para revisarla aunque el programa no la haya marcado.</p>
      ${s.oidoTexto?`<details class="oido-texto"><summary class="nota"><b>Lo que entendió el programa</b></summary><p class="nota">${esc(s.oidoTexto)}</p></details>`:''}</div>`;
  if(s.audio){ revP=crearReproductor($('#revAudio'), '/api/audio/'+s.id); if(p.t!=null) setTimeout(()=>revP && revP.trozo(p.t), 400); }
  else $('#revAudio').innerHTML='<p class="nota">Esta lectura no tiene grabación.</p>';
  $('#revLista').onclick=()=>ir('revisar', null);
  $$('#s-revisar [data-v]').forEach(b=>b.onclick=()=>{ p.e=b.dataset.v; p.r=1; const sig=m[m.indexOf(revI)+1]; if(sig!=null) revI=sig; ir('revisar'); });
  $$('#s-revisar [data-wi]').forEach(b=>b.onclick=()=>{ revI=+b.dataset.wi; const q=s.palabras[revI]; if(q && q.e==='ok' && !q.r){ q.a=1; } ir('revisar'); });
  $('#revAnt').onclick=()=>{ revI=m[pos-1]; ir('revisar'); };
  $('#revSig').onclick=()=>{ revI=m[pos+1]; ir('revisar'); };
  $('#revGuardar').onclick=async()=>{ s.palabras.forEach(q=>{ if(q.e==='pendiente') q.e='ok'; }); s.revisada=true;
    try{ const audio=s.audio; const c=JSON.parse(JSON.stringify(s)); delete c.audio; await guardarSesion(c); const i=SES.findIndex(x=>x.id===s.id); if(i>=0){ SES[i]=JSON.parse(JSON.stringify(s)); SES[i].audio=audio; } aviso('Revisión guardada'); revS=null; ir('revisar', null); }
    catch(e){ dialogo({titulo:'No se pudo guardar', html:`<p class="nota">${esc(e.message)}</p>`, botones:[{t:'Vale',cls:'btn-p'}]}); } };
}, salir(){ if(revP){ revP.parar(); revP=null; } }});

/* ---------- 28 · Grupo ---------- */
definir('grupo', {zona:'adulto', pintar(){
  const ps=aj.perfiles.slice().sort((a,b)=>(!!a.prueba)-(!!b.prueba));
  const barra=(v,c)=>`<span class="barra-t"><i style="width:${Math.max(0,Math.min(100,v||0))}%;background:${c}"></i></span>`;
  $('#s-grupo').innerHTML = `<div class="pag-cab"><div><h1>Grupo</h1><p class="sub" style="margin-top:6px"><b>Lectores y su progreso</b> · cada niño con su usuario; el de pruebas no cuenta.</p></div><button class="btn btn-p" type="button" id="btnNuevoAl">+ Añadir lector</button></div>
  <div class="card tabla-w"><table><thead><tr><th>Alumno</th><th>Lecturas<small>completadas / días</small></th><th>Comprensión<small>media %</small></th><th>Cálculo<small>aciertos %</small></th><th>Palabras/min<small>al empezar → ahora</small></th><th>Acciones</th></tr></thead><tbody>
  ${ps.map(p=>{ const ms=sesDe(p.id); const dias=diaHoyDe(p); const cr=new Set(ms.filter(s=>!s.incompleta).map(s=>s.historiaId)).size;
    const comp=media(ms.slice(-10).map(pctComp)); const cs=ms.filter(s=>s.calculo); const calc=cs.length?100*cs.filter(s=>s.calculo.ok).length/cs.length:null;
    const ini=media(ms.slice(0,5).map(s=>s.ppm||0)), act=media(ms.slice(-5).map(s=>s.ppm||0));
    if(p.prueba) return `<tr><td><span class="al">${avatarHTML(p)}${esc(p.nombre)}</span></td><td>${ms.length}${barra(0,'#ccc')}</td><td>—${barra(0,'#ccc')}</td><td>—${barra(0,'#ccc')}</td><td>—</td><td><span class="btn btn-mini" style="background:#EEF1F6;color:#64748B">No cuenta</span></td></tr>`;
    return `<tr><td><span class="al">${avatarHTML(p)}${esc(p.nombre)}</span></td><td><b>${cr} / ${dias}</b>${barra(100*cr/dias,'#5CCB8F')}</td><td><b>${comp==null?'—':Math.round(comp)+' %'}</b>${barra(comp,'#18B47B')}</td><td><b>${calc==null?'—':Math.round(calc)+' %'}</b>${barra(calc,'#1E7BF2')}</td><td>${ini==null?'—':`${Math.round(ini)} → <b>${Math.round(act)}</b>`}</td>
      <td><button class="btn btn-mini" type="button" data-inf="${esc(p.id)}">Informe individual</button></td></tr>`; }).join('')}</tbody></table></div>`;
  $('#btnNuevoAl').onclick=()=>ir('perfil','nuevo');
  $$('#s-grupo [data-inf]').forEach(b=>b.onclick=()=>ir('informe', b.dataset.inf));
}});

/* ---------- 29 · Editar perfil ---------- */
const NIVELES=[[1,'Estoy empezando'],[2,'Ya leo palabras'],[3,'Leo frases'],[4,'Leo historias'],[5,'Leo historias largas']];
const CURSOS=['','Infantil 5 años','1.º de Primaria','2.º de Primaria','3.º de Primaria','Otro'];
let perfilNuevo=null;
definir('perfil', {zona:'adulto', pintar(modo){
  if(modo==='nuevo'){ const n=aj.perfiles.filter(p=>!p.prueba).length; perfilNuevo={id:nuevoId(), nombre:'', color:COLORES[(n+1)%COLORES.length], cfg:cfgBase()}; }
  else if(modo!=='mismo') perfilNuevo=null;
  const p = perfilNuevo || lectorVisto(); const cfg = p.cfg || {}; const esNuevo=!!perfilNuevo;
  const f=esNuevo?null:fotoLector(p);
  $('#s-perfil').innerHTML = `<div class="pag-cab"><div><h1>${esNuevo?'Nuevo lector':'Editar perfil'}</h1><p class="sub">${esNuevo?'Crea el usuario de un niño para seguir sus avances.':'Personaliza el perfil para que la lectura sea suya.'}</p></div>${esNuevo?'':selLector('perfil')}</div>
  <div class="card perfil-ed"><div style="display:grid;justify-items:center;gap:14px"><div class="foto-perfil" style="--c:${esc(p.color)}">${f?`<img src="${f}" alt="">`:esc(iniciales(p.nombre||'?'))}${esNuevo?'':`<button type="button" id="btnFotoP" aria-label="Cambiar foto">${ic('camara')}</button>`}</div>
      <div class="colores">${COLORES.map(c=>`<button type="button" style="--c:${c}" data-col="${c}" aria-pressed="${c===p.color}" aria-label="Color"></button>`).join('')}</div></div>
    <div><div class="campo"><label for="pfNombre">Nombre</label><input id="pfNombre" maxlength="20" value="${esc(p.nombre)}" autocomplete="off" placeholder="Nombre del niño"></div>
      <div class="fam-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div class="campo"><label for="pfNac">Fecha de nacimiento</label><input id="pfNac" type="date" value="${esc(p.nac||'')}"></div>
        <div class="campo"><label for="pfCurso">Curso</label><select id="pfCurso">${CURSOS.map(c=>`<option ${c===(p.curso||'')?'selected':''} value="${esc(c)}">${c||'—'}</option>`).join('')}</select></div></div>
      <div class="campo"><b>Nivel de lectura</b><div class="niveles-g">${NIVELES.map(([n,t])=>`<button type="button" data-nl="${n}" aria-pressed="${(cfg.nivel||0)===n}"><b>${n}</b><span>${t}</span></button>`).join('')}</div><span class="nota">Orienta qué historias le salen al explorar. Las historias de sus temas van de más fáciles a más difíciles.</span></div>
      <div class="fam-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div class="campo"><label for="pfIni">Día 1 de su año de lectura</label><input id="pfIni" type="date" value="${esc(cfg.inicio||CONT.inicio)}"></div>
        <div class="campo"><b>Opciones</b><div class="interruptor"><span>Dejar leer días futuros</span><button type="button" class="switch" id="pfAdel" role="switch" aria-checked="${!!cfg.adelantar}"></button></div><div class="interruptor" style="margin-top:8px"><span>Usuario de pruebas (no cuenta)</span><button type="button" class="switch" id="pfPrueba" role="switch" aria-checked="${!!p.prueba}"></button></div></div></div>
      <div class="botones" style="margin-top:8px"><button class="btn btn-p btn-g" type="button" id="pfGuardar">Guardar</button>${!esNuevo && aj.perfiles.length>1?`<button class="btn btn-rojo btn-g" type="button" id="pfQuitar">Quitar este lector</button>`:''}</div></div></div>`;
  let nivelSel=cfg.nivel||0, color=p.color;
  $$('#s-perfil [data-nl]').forEach(b=>b.onclick=()=>{ nivelSel=+b.dataset.nl; $$('#s-perfil [data-nl]').forEach(x=>x.setAttribute('aria-pressed', String(x===b))); });
  $$('#s-perfil [data-col]').forEach(b=>b.onclick=()=>{ color=b.dataset.col; $$('#s-perfil [data-col]').forEach(x=>x.setAttribute('aria-pressed', String(x===b))); $('#s-perfil .foto-perfil').style.setProperty('--c', color); });
  $$('#s-perfil .switch').forEach(b=>b.onclick=()=>b.setAttribute('aria-checked', String(b.getAttribute('aria-checked')!=='true')));
  if($('#btnFotoP')) $('#btnFotoP').onclick=()=>{ imgDestino={tipo:'foto', clave:'lector_'+p.id, titulo:'Foto de '+p.nombre}; ir('imagenes','foto'); };
  $('#pfGuardar').onclick=()=>{
    const nom=$('#pfNombre').value.trim(); if(!nom){ $('#pfNombre').focus(); return; }
    p.nombre=nom; p.color=color; p.nac=$('#pfNac').value||''; p.curso=$('#pfCurso').value; p.prueba=$('#pfPrueba').getAttribute('aria-checked')==='true';
    const c={...(p.cfg||cfgBase(p)), nivel:nivelSel, inicio:$('#pfIni').value||null, adelantar:$('#pfAdel').getAttribute('aria-checked')==='true'};
    if(esNuevo){ p.cfg=c; aj.perfiles.push(p); perfilNuevo=null; lectorAdulto=p.id; }
    else if(p.id===aj.perfil){ Object.assign(aj, c); p.cfg=c; } else p.cfg=c;
    guardarAj(); pintarCabecera(); aviso('Perfil guardado'); ir('perfil','mismo');
  };
  if($('#pfQuitar')) $('#pfQuitar').onclick=()=>dialogo({titulo:`¿Quitar a ${esc(p.nombre)}?`, html:'<p class="nota">Sus lecturas y grabaciones se conservan en la carpeta de datos.</p>', botones:[{t:'Conservar', cls:'btn'},{t:'Quitar', cls:'btn-rojo', fn:()=>{ aj.perfiles=aj.perfiles.filter(x=>x.id!==p.id); if(aj.perfil===p.id){ aj.perfil=aj.perfiles[0].id; Object.assign(aj, cfgBase(perfil()), perfil().cfg||{}); } lectorAdulto=null; guardarAj(); pintarCabecera(); ir('grupo'); }}]});
}});

/* ---------- 30 · Mis imágenes (con recorte) ---------- */
let tabImg='foto', imgDestino=null, recorte=null;
definir('imagenes', {zona:'adulto', pintar(tab){
  if(tab && tab!==tabImg){ tabImg=tab; if(!imgDestino || imgDestino.tipo!==tab) imgDestino=null; }
  const p=lectorVisto();
  if(!imgDestino){ imgDestino = tabImg==='foto' ? {tipo:'foto', clave:'lector_'+p.id, titulo:'Foto de '+p.nombre} : tabImg==='personajes' ? {tipo:'personajes', clave:PERSONAJES[1].clave, titulo:PERSONAJES[1].nombre} : {tipo:'dibujos', clave:CONT.mundos[0].foto, titulo:CONT.mundos[0].nombre}; }
  const portada=k=>fotoURL(k)?`<img src="${fotoURL(k)}" alt="">`:(CONT.emoji[k]||'🖼️');
  const kFoto=claveLector(p);
  $('#s-imagenes').innerHTML = `<div class="pag-cab"><div><h1>Mis imágenes</h1><p class="sub">Añade y gestiona las imágenes que más os gustan. Se guardan solo en este ordenador.</p></div></div>
  <div class="mis-tabs"><button type="button" data-ti="foto" aria-pressed="${tabImg==='foto'}">Mi foto<span class="ft">${MIS[kFoto]?portada(kFoto):esc(iniciales(p.nombre))}</span></button><button type="button" data-ti="personajes" aria-pressed="${tabImg==='personajes'}">Mis personajes<span class="ft">${portada(PERSONAJES.map(x=>x.clave).find(k=>MIS[k])||'gato')}</span></button><button type="button" data-ti="dibujos" aria-pressed="${tabImg==='dibujos'}">Fotos de palabras<span class="ft">${portada('sol')}</span></button></div>
  <div class="card editor-img"><div><h3>Añadir nueva imagen</h3><label class="soltar" id="soltar"><span class="mas">+</span><b>Añadir imagen</b><span class="nota">JPG o PNG · para: ${esc(imgDestino.titulo)}</span><input type="file" accept="image/*" id="imgArchivo" hidden></label>
      ${MIS[imgDestino.clave]?`<button class="btn btn-rojo btn-mini" type="button" id="imgQuitar" style="margin-top:10px">Quitar la imagen propia</button>`:''}</div>
    <div><h3>Recortar imagen</h3><div class="recorte" id="recorte" style="aspect-ratio:${imgDestino.tipo==='foto'?'1':'1.5'}">${recorte?'':`<div style="position:absolute;inset:0;display:grid;place-items:center;color:var(--ink-3);font-weight:800;text-align:center;padding:10px">Elige una imagen y muévela con el ratón o el dedo</div>`}<div class="marco"></div></div>
      <div class="zoom"><span>−</span><input type="range" id="imgZoom" min="1" max="4" step="0.01" value="${recorte?recorte.z:1}" aria-label="Zoom"><span>+</span></div></div>
    <div class="previa"><h3>Vista previa</h3><canvas id="imgPrevia" width="${imgDestino.tipo==='foto'?180:240}" height="${imgDestino.tipo==='foto'?180:160}" class="${imgDestino.tipo==='foto'?'redonda':''}"></canvas><button class="btn btn-borde" type="button" id="imgUsar" ${recorte?'':'disabled'}>Usar esta imagen</button></div></div>
  <div class="card bloque" style="margin-top:18px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><h3>${tabImg==='foto'?'¿De quién es la foto? (o el logo del programa)':tabImg==='personajes'?'Personajes de las historias':'Portadas y palabras'}</h3>${tabImg==='dibujos'?`<input class="buscar" id="imgBuscar" type="search" placeholder="Buscar palabra (p. ej. murciélago)" value="${esc(buscaImg)}">`:''}</div><div class="lista-img" id="listaImg"></div></div>`;
  pintarListaImg();
  $$('#s-imagenes [data-ti]').forEach(b=>b.onclick=()=>{ recorte=null; ir('imagenes', b.dataset.ti); });
  $('#imgArchivo').onchange=e=>{ const f=e.target.files[0]; if(f) cargarRecorte(f); };
  if($('#imgQuitar')) $('#imgQuitar').onclick=async()=>{ await borrar('/api/misimagenes/'+imgDestino.clave).catch(()=>{}); delete MIS[imgDestino.clave]; pintarCabecera(); ir('imagenes'); };
  if($('#imgBuscar')) $('#imgBuscar').oninput=e=>{ buscaImg=e.target.value; pintarListaImg(); };
  $('#imgZoom').oninput=e=>{ if(recorte){ recorte.z=+e.target.value; dibujarRecorte(); } };
  $('#imgUsar').onclick=usarRecorte;
  activarArrastre(); if(recorte) dibujarRecorte();
}, salir(){ recorte=null; }});
let buscaImg='';
function pintarListaImg(){
  const it=(k,t,sub)=>{ const src=fotoURL(k); return `<button type="button" class="it-img" data-k="${esc(k)}" data-t="${esc(t)}" aria-pressed="${imgDestino&&imgDestino.clave===k}"><span class="ft">${src?`<img src="${src}" alt="">`:esc(CONT.emoji[k]||'🖼️')}${MIS[k]?'<span class="tuya">Tuya</span>':''}</span><b>${esc(t)}</b>${sub?`<span class="nota">${esc(sub)}</span>`:''}</button>`; };
  let h='';
  if(tabImg==='foto') h=aj.perfiles.map(p=>it('lector_'+p.id, p.nombre, p.prueba?'pruebas':'')).join('') + it('logo', 'Logo del programa', 'arriba, al lado de LeeLEEJG');
  else if(tabImg==='personajes') h=PERSONAJES.filter(x=>x.clave!=='lector').map(x=>it(x.clave, conNombre(x.nombre), 'sale junto a su nombre')).join('');
  else { const q=normalizar(buscaImg||''); h=(q?'':CONT.mundos.map(m=>it(m.foto, m.nombre, 'portada')).join('')) + Object.entries(CONT.palabras).filter(([p])=>!q||normalizar(p).includes(q)).slice(0, q?120:36).map(([p,k])=>it(k,p,'')).join(''); }
  $('#listaImg').innerHTML=h;
  $$('#listaImg .it-img').forEach(b=>b.onclick=()=>{ imgDestino={tipo:tabImg, clave:b.dataset.k, titulo:b.dataset.t}; recorte=null; ir('imagenes'); });
}
async function cargarRecorte(f){
  try{ const bmp=await createImageBitmap(f); recorte={bmp, z:1, x:.5, y:.5}; $('#imgZoom').value=1; $('#imgUsar').disabled=false; const ph=$('#recorte>div:not(.marco)'); if(ph) ph.remove(); dibujarRecorte(); }
  catch(e){ dialogo({titulo:'No se pudo abrir la imagen', html:`<p class="nota">${esc(e.message)}</p>`, botones:[{t:'Vale',cls:'btn-p'}]}); }
}
function geomRecorte(W,H){ const r=recorte, b=r.bmp; const s=Math.max(W/b.width, H/b.height)*r.z; const dw=b.width*s, dh=b.height*s;
  const x=Math.min(0, Math.max(W-dw, W/2 - r.x*dw)), y=Math.min(0, Math.max(H-dh, H/2 - r.y*dh)); return {s,dw,dh,x,y}; }
function dibujarRecorte(){
  const box=$('#recorte'); if(!box||!recorte) return; const W=box.clientWidth, H=box.clientHeight; const g=geomRecorte(W,H);
  let im=$('#recorte canvas'); if(!im){ im=document.createElement('canvas'); im.style.cssText='position:absolute;inset:0;width:100%;height:100%'; box.prepend(im); }
  im.width=W; im.height=H; const c=im.getContext('2d'); c.drawImage(recorte.bmp, g.x, g.y, g.dw, g.dh);
  const pv=$('#imgPrevia'); const pc=pv.getContext('2d'); const g2=geomRecorte(pv.width, pv.height); pc.clearRect(0,0,pv.width,pv.height); pc.drawImage(recorte.bmp, g2.x, g2.y, g2.dw, g2.dh);
}
function activarArrastre(){
  const box=$('#recorte'); let ini=null;
  box.onpointerdown=e=>{ if(!recorte) return; box.setPointerCapture(e.pointerId); ini={x:e.clientX, y:e.clientY, rx:recorte.x, ry:recorte.y}; box.style.cursor='grabbing'; };
  box.onpointermove=e=>{ if(!ini||!recorte) return; const g=geomRecorte(box.clientWidth, box.clientHeight); recorte.x=Math.max(0,Math.min(1, ini.rx-(e.clientX-ini.x)/g.dw)); recorte.y=Math.max(0,Math.min(1, ini.ry-(e.clientY-ini.y)/g.dh)); dibujarRecorte(); };
  box.onpointerup=box.onpointercancel=()=>{ ini=null; box.style.cursor='grab'; };
  box.onwheel=e=>{ if(!recorte) return; e.preventDefault(); recorte.z=Math.max(1,Math.min(4, recorte.z*(e.deltaY<0?1.08:.93))); $('#imgZoom').value=recorte.z; dibujarRecorte(); };
}
async function usarRecorte(){
  if(!recorte) return; const W=imgDestino.tipo==='foto'?600:900, H=imgDestino.tipo==='foto'?600:600;
  const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,W,H); const g=geomRecorte(W,H); x.drawImage(recorte.bmp, g.x, g.y, g.dw, g.dh);
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.86));
  try{ await api('/api/misimagenes/'+imgDestino.clave,{method:'POST', body:blob}); MIS[imgDestino.clave]=Date.now(); recorte=null; pintarCabecera(); aviso('Imagen guardada'); ir('imagenes'); }
  catch(e){ dialogo({titulo:'No se pudo guardar', html:`<p class="nota">${esc(e.message)}</p>`, botones:[{t:'Vale',cls:'btn-p'}]}); }
}

/* ---------- 31 · Voz y sonido ---------- */
definir('vozsonido', {zona:'adulto', pintar(guardado){
  const vs=vocesEs().sort((a,b)=>puntuarVoz(b)-puntuarVoz(a));
  const opciones=[...(EST.voz==='piper'?[['', `Español · España (voz del programa)`]]:[]), ...vs.map(v=>[v.voiceURI, v.name.replace(/^Microsoft\s+/,'')+' · '+v.lang])];
  if(!opciones.length) opciones.push(['','Sin voces en español en este equipo']);
  const sel = usaPiper() ? '' : (aj.voz||'');
  $('#s-vozsonido').innerHTML = `<div class="pag-cab"><div><h1>Voz y sonido</h1><p class="sub">Elige la voz que más os guste y ajusta el sonido.</p></div></div>
  <div class="card ajuste"><h3>${ic('altavoz')} Voz de lectura</h3><div class="fila-sel"><select id="vsVoz">${opciones.map(([v,t])=>`<option value="${esc(v)}" ${v===sel?'selected':''}>${esc(t)}</option>`).join('')}</select><button class="btn btn-borde btn-g" type="button" id="vsProbar">${ic('altavoz')} Probar voz</button></div></div>
  <div class="card ajuste"><h3>${ic('altavoz')} Volumen</h3><div class="vol"><span style="width:22px;display:inline-flex;color:var(--ink-3)">${ic('altavoz')}</span><input type="range" id="vsVol" min="0" max="1" step="0.05" value="${aj.volumen??.9}"><b id="vsVolT">${Math.round((aj.volumen??.9)*100)}%</b></div></div>
  <div class="card ajuste"><div class="interruptor"><div><h3 style="margin-bottom:4px"><span style="width:24px;height:24px;border-radius:50%;background:var(--primary);color:#fff;display:inline-grid;place-items:center;font-size:.9rem">?</span> Audio de preguntas</h3><p class="nota">Lee las preguntas en voz alta automáticamente.</p></div><button type="button" class="switch" id="vsPreg" role="switch" aria-checked="${aj.audioPreguntas!==false}"></button></div></div>
  <div class="card ajuste"><h3>${ic('engranaje')} Estado del programa</h3><div class="estado-prog"><div>Versión <b>${esc(EST.version||'4')}</b></div>
    <div>Voz: ${EST.voz==='piper'?`<span class="ok">voz española del programa (${esc(EST.vozNombre)})</span>`:'<span class="no">voz del navegador</span>'}</div>
    <div>Oído: ${EST.oido==='vosk'?'<span class="ok">reconocimiento sin internet (la voz del niño no sale del ordenador)</span>':'<span class="no">reconocimiento del navegador (necesita internet)</span>'}</div>${enLocal()?'<div>Datos: <span class="ok">guardados en este aparato</span></div>':''}</div></div>
  ${guardado?`<div class="guardado"><i>${ic('check')}</i><div><b>Cambios guardados</b><br><span class="nota">La voz y el sonido se han actualizado correctamente.</span></div></div>`:''}`;
  const hecho=()=>{ guardarAj(); const g=$('#s-vozsonido .guardado'); if(!g) $('#s-vozsonido').insertAdjacentHTML('beforeend', `<div class="guardado"><i>${ic('check')}</i><div><b>Cambios guardados</b><br><span class="nota">La voz y el sonido se han actualizado correctamente.</span></div></div>`); };
  $('#vsVoz').onchange=e=>{ const v=e.target.value; aj.vozPrograma = v===''; if(v) aj.voz=v; elegirVoz(); hecho(); decir(`Hola, ${nombre()}. Así sueno yo.`); };
  $('#vsProbar').onclick=()=>decir(`Hola, ${nombre()}. ¿Qué historia vamos a leer hoy?`);
  $('#vsVol').oninput=e=>{ aj.volumen=+e.target.value; $('#vsVolT').textContent=Math.round(aj.volumen*100)+'%'; };
  $('#vsVol').onchange=()=>{ hecho(); sonido('bien'); };
  $('#vsPreg').onclick=e=>{ const v=e.currentTarget.getAttribute('aria-checked')!=='true'; e.currentTarget.setAttribute('aria-checked', String(v)); aj.audioPreguntas=v; hecho(); };
}});

/* ---------- 32 · Datos y copias ---------- */
const tam = b => b>1e9 ? (b/1e9).toFixed(1)+' GB' : b>1e6 ? (b/1e6).toFixed(1)+' MB' : Math.round(b/1e3)+' KB';
definir('datos', {zona:'adulto', async pintar(){
  const s=$('#s-datos'); s.innerHTML='<p class="vacio">Cargando…</p>';
  let inf={}, sin=null; try{ inf=await api('/api/datos/info'); }catch(e){}
  if(!enLocal()){ try{ sin=await api('/api/sincro'); }catch(e){} }
  if(actual!=='datos') return;
  s.innerHTML = `<div class="pag-cab"><div><h1>Datos y copias</h1><p class="sub">Gestiona las grabaciones y los datos. Solo personas adultas.</p></div></div>
  <div class="card filas-datos">
    <button class="fila-dato" type="button" id="dGrab"><span class="ic" style="background:var(--purple-soft);color:var(--purple)">${ic('mic')}</span><span class="tx"><b>Grabaciones</b><span class="nota">Escucha, revisa o elimina las grabaciones de lectura.</span></span><span class="val">${inf.grabaciones??'—'} grabaciones<br>${inf.bytesGrabaciones!=null?tam(inf.bytesGrabaciones):''}</span><span style="width:22px;display:inline-flex">${ic('dcha')}</span></button>
    <button class="fila-dato" type="button" id="dCarpeta"><span class="ic" style="background:var(--yellow-soft);color:#E0A100">${ic('carpeta')}</span><span class="tx"><b>Carpeta de datos</b><span class="nota">${esc(inf.carpeta||'datos')}</span></span><span class="val">${inf.bytes!=null?tam(inf.bytes):''}</span><span style="width:22px;display:inline-flex">${ic('dcha')}</span></button>
    <div class="fila-dato"><span class="ic" style="background:var(--primary-soft);color:var(--primary)">${ic('nube')}</span><span class="tx"><b>Copia de seguridad</b><span class="nota">${enLocal()?'En este aparato la copia es «Enviar a Google Drive» (más abajo): guarda lecturas, ajustes, imágenes y las grabaciones del último mes.':'Guarda una copia de todo (lecturas, grabaciones, imágenes) para no perderlo. Cada día se hace una copia automática de las lecturas.'}</span></span><span class="val">${inf.ultimaCopia?(enLocal()?'Último envío:':'Última copia:')+'<br>'+esc(new Date(inf.ultimaCopia).toLocaleString('es-ES',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})):'Sin copias'}</span></div></div>
  ${enLocal()?'':`<div class="botones" style="margin-top:16px"><button class="btn btn-p btn-g" type="button" id="dCrear">${ic('nube')} Crear copia</button><button class="btn btn-g" type="button" id="dRestaurar">${ic('historial')} Restaurar copia</button></div>`}
  <div style="margin-top:22px">${nubeHTML()}</div>
  ${nubeConf()?'':`<div style="margin-top:22px">${sincroHTML(enLocal()?inf:sin)}</div>`}
  ${instalarHTML()}
  <div class="card ajuste" style="margin-top:22px"><div class="interruptor"><div><h3 style="margin-bottom:4px">${ic('candado')} PIN de la zona de adultos</h3><p class="nota">${aj.pin?'Hay un PIN puesto: los niños no pueden entrar aquí.':'Sin PIN: cualquiera puede entrar en esta zona.'}</p></div><button class="btn" type="button" id="dPin">${aj.pin?'Quitar el PIN':'Poner un PIN'}</button></div></div>
  <details class="card ajuste creditos"><summary><b>Créditos de las fotos (Wikimedia Commons)</b></summary><ol>${CONT.creditos.map(c=>`<li>${esc(c.clave)}: <a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.file)}</a>${c.autor?' · '+esc(c.autor):''} · ${esc(c.lic)}</li>`).join('')}</ol></details>`;
  $('#dGrab').onclick=()=>ir('evolucion','grabaciones');
  $('#dCarpeta').onclick=async()=>{ const r=await postJSON('/api/abrir-carpeta',{}).catch(()=>({ok:false})); if(!r.ok) dialogo({titulo:'Carpeta de datos', html:`<p class="nota">Está en:<br><b>${esc(inf.carpeta||'')}</b></p>`, botones:[{t:'Vale',cls:'btn-p'}]}); };
  activarSincro(); activarNube(); activarInstalar();
  if(enLocal()){ $('#dPin').onclick=()=>{ if(aj.pin){ aj.pin=''; guardarAj(); ir('datos'); } else pedirPinNuevo(v=>{ aj.pin=v; pinOk=true; guardarAj(); aviso('PIN guardado'); ir('datos'); }); }; return; }
  $('#dCrear').onclick=async()=>{ const b=$('#dCrear'); b.disabled=true; b.textContent='Creando copia…'; try{ await postJSON('/api/copia',{}); aviso('Copia creada'); ir('datos'); }catch(e){ b.disabled=false; dialogo({titulo:'No se pudo crear la copia', html:`<p class="nota">${esc(e.message)}</p>`, botones:[{t:'Vale',cls:'btn-p'}]}); } };
  $('#dRestaurar').onclick=async()=>{ const cs=await api('/api/copias').catch(()=>[]);
    if(!cs.length){ dialogo({titulo:'No hay copias', botones:[{t:'Vale',cls:'btn-p'}]}); return; }
    const d=dialogo({titulo:'Restaurar una copia', html:`<p class="nota" style="margin-bottom:8px">Antes de restaurar se guarda una copia de lo que hay ahora.</p><div class="lista-rev" style="max-height:340px;overflow:auto;text-align:left">${cs.map(c=>`<button class="fila-rev" type="button" data-c="${esc(c.nombre)}"><span class="tx"><b>${esc(new Date(c.fecha).toLocaleString('es-ES',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}))}</b><span class="nota">${c.completa?'Copia completa':'Copia diaria (solo lecturas)'} · ${tam(c.bytes)}</span></span></button>`).join('')}</div>`});
    $$('[data-c]', d.el).forEach(b=>b.onclick=()=>{ d.cerrar(); dialogo({titulo:'¿Restaurar esta copia?', html:'<p class="nota">Se sustituyen las lecturas y ajustes actuales por los de la copia. Después se recarga el programa.</p>', botones:[{t:'Cancelar',cls:'btn'},{t:'Restaurar',cls:'btn-p', fn:async()=>{ try{ await postJSON('/api/copia/restaurar',{nombre:b.dataset.c}); location.reload(); }catch(e){ dialogo({titulo:'No se pudo restaurar', html:`<p class="nota">${esc(e.message)}</p>`, botones:[{t:'Vale',cls:'btn-p'}]}); } }}]}); }); };
  $('#dPin').onclick=()=>{ if(aj.pin){ aj.pin=''; guardarAj(); ir('datos'); } else pedirPinNuevo(v=>{ aj.pin=v; pinOk=true; guardarAj(); aviso('PIN guardado'); ir('datos'); }); };
}});

/* ---------- Informe para la tutora (imprimible) ---------- */
definir('informe', {zona:'adulto', nav:'evolucion', pintar(id){
  const p=aj.perfiles.find(x=>x.id===id)||lectorVisto(); const ms=sesDe(p.id); const a=agregado(ms);
  const pri=ms.slice(0,5), ult=ms.slice(-5); const mp=x=>x.length?Math.round(media(x.map(s=>s.ppm||0))):0;
  const totP=ms.reduce((s,x)=>s+preguntasHechas(x),0), acP=ms.reduce((s,x)=>s+(x.aciertos||0),0);
  const calc=ms.filter(s=>s.calculo), calcOk=calc.filter(s=>s.calculo.ok).length;
  const dif=Object.entries(a).filter(([,x])=>x.prac+x.ayuda>0).sort((x,y)=>(y[1].prac+y[1].ayuda)-(x[1].prac+x[1].ayuda)).slice(0,20);
  const sem=semanas(ms,8); const niv=Math.max(1,...ms.map(s=>s.nivel||1));
  $('#s-informe').innerHTML = `<div class="no-imprimir botones" style="margin-bottom:14px"><button class="btn" type="button" data-nava="evolucion">${ic('atras')} Volver</button><button class="btn btn-p" type="button" id="btnImprimir">Imprimir o guardar en PDF</button></div>
  <div class="card informe"><div><span class="pill">Informe de lectura · ${esc(new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}))}</span><h1 style="margin-top:10px">${esc(p.nombre)}</h1>
    <p class="sub">${esc(p.curso||'')}${p.curso?' · ':''}${ms.length?`Desde el ${esc(new Date(ms[0].fecha).toLocaleDateString('es-ES',{day:'numeric',month:'long'}))} ha leído ${ms.length} historias (${new Set(ms.map(s=>s.historiaId)).size} distintas). Nivel actual: ${niv} de 4.`:'Todavía no hay lecturas.'}</p></div>
    <div class="cifras"><div><b>${mp(ult)}</b><span>Palabras por minuto (últimas 5)</span></div><div><b>${mp(pri)}</b><span>Palabras por minuto (primeras 5)</span></div><div><b>${totP?Math.round(acP*100/totP):0}%</b><span>Comprensión a la primera</span></div><div><b>${calc.length?Math.round(calcOk*100/calc.length):0}%</b><span>Cálculo a la primera</span></div></div>
    <div class="graf-2"><div><h3>Comprensión por semana</h3>${barras(sem.map(w=>media(w.ses.map(pctComp))), sem.map(w=>w.etq), {max:100, color:'#5CCB8F'})}</div><div><h3>Palabras por minuto por semana</h3>${barras(sem.map(w=>media(w.ses.map(s=>s.ppm||0))), sem.map(w=>w.etq), {max:Math.max(100, Math.ceil(Math.max(0,...ms.map(s=>s.ppm||0))/25)*25), color:'#9B8CF5'})}</div></div>
    <div><h3 style="margin-bottom:10px">Palabras que más le cuestan</h3>${dif.length?`<table><thead><tr><th>Palabra</th><th>Sílabas</th><th>Veces difícil</th><th>Veces leída</th></tr></thead><tbody>${dif.map(([w,x])=>`<tr><td><b>${esc(w)}</b></td><td>${esc(silabear(w).join('-'))}</td><td>${x.prac+x.ayuda}</td><td>${x.veces}</td></tr>`).join('')}</tbody></table>`:'<p class="vacio">Sin palabras difíciles registradas.</p>'}</div>
    <p class="nota">Palabras que ya lee bien (al menos dos veces sin ayuda): ${palabrasDominadas(ms).length}. Informe generado por LeeLEEJG.</p></div>`;
  $('#btnImprimir').onclick=()=>window.print();
}});
