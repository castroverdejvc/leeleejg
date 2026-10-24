/* LeeLEEJG · para la familia (24/10/2026):
   - Avisos arriba en Evolución: lleva días sin leer, las preguntas le salen peor, premios por dar, muchas atrasadas,
     o ha pedido historias nuevas en su buzón. Se pueden quitar (hasta el día siguiente).
   - Resumen de la semana (de sábado a viernes), listo el viernes por la noche: qué hizo, qué ganó, lo más importante
     y en qué ayudarle. Para imprimir, guardar en PDF o compartir (en el iPad, con «Compartir»).
   - Desde el buzón de ideas, «Hacer historias con esto» abre el Ayudante IA con esa idea. */
'use strict';

/* ---------- avisos ---------- */
function avisosFamilia(p){
  const A=[], hoy=hoySinHora(), c=cfgDe(p), ses=sesDe(p.id).filter(s=>!s.incompleta && s.fecha);
  if(p.prueba) return A;
  // días sin leer
  if(ses.length){ const ult=new Date(ses[ses.length-1].fecha); ult.setHours(0,0,0,0); const dias=Math.round((hoy-ult)/DIA_MS);
    if(dias>=2) A.push({k:'sinleer', tipo:'ojo', t:`Lleva <b>${dias} días sin leer</b> (la última vez, el ${esc(fechaCorta(ses[ses.length-1].fecha))}).`}); }
  // preguntas peor que antes
  const comp=ses.map(pctComp).filter(x=>x!=null); if(comp.length>=10){ const u=media(comp.slice(-5)), a=media(comp.slice(-15,-5));
    if(a!=null && u!=null && u<a-15) A.push({k:'preguntas', tipo:'ojo', t:`Las preguntas le salen <b>peor</b> últimamente: ${Math.round(u)} % en sus 5 últimas lecturas, antes ${Math.round(a)} %. Puede que lea deprisa para acabar.`}); }
  // atrasadas
  const at=typeof atrasadasDe==='function'?atrasadasDe(p).length:0; if(at>=5) A.push({k:'atrasadas', tipo:'info', t:`Tiene <b>${at} historias atrasadas</b> del calendario.`});
  // premios por dar
  const rec=typeof premiosPorRecoger==='function'?premiosPorRecoger(p):[]; if(rec.length) A.push({k:'premios', tipo:'info', t:`Tiene premios por dar: ${rec.map(x=>x.emo+' '+x.t).join(', ')}. Se apuntan en Premios y gustos o tocando su tarjeta en Inicio.`});
  // buzón: ha pedido historias
  const des=(c.deseosLog||[]).filter(x=>x.q==='historias' || x.q==='voz').slice(-3).filter(x=>Date.now()-new Date(x.f)<14*DIA_MS);
  if(des.length && typeof iaEnlaceHistorias==='function') A.push({k:'buzon', tipo:'info', t:`En su buzón ha pedido: ${des.map(x=>'«'+esc(x.r)+'»').join(', ')}.`, btn:`<button class="btn btn-mini btn-p" type="button" data-iaidea="${esc(des[des.length-1].r)}">✨ Hacer historias con esto</button>`});
  // resumen listo (viernes desde las 18:00 y el fin de semana)
  const d=new Date(); const k=claveDia(semanaResumen());
  if((d.getDay()===5 && d.getHours()>=18) || d.getDay()===6 || d.getDay()===0){ if(c.informeVisto!==k) A.push({k:'resumen', tipo:'bien', t:'El <b>resumen de la semana</b> está listo.', btn:`<button class="btn btn-mini btn-p" type="button" data-ir-resumen="1">📄 Ver el resumen</button>`}); }
  const vistos=c.avisosVistos||{}, hoyK=claveDia(new Date());
  return A.filter(a=>vistos[a.k]!==hoyK);
}
function avisosFamiliaHTML(p){
  const A=avisosFamilia(p); if(!A.length) return '';
  const ico={ojo:'⚠️', info:'💡', bien:'✅'};
  return `<div class="avisos-fam">${A.map(a=>`<div class="aviso-f val-${a.tipo}"><span>${ico[a.tipo]}</span><span class="tx">${a.t}</span>${a.btn||''}<button class="x-aviso" type="button" data-quitar-aviso="${a.k}" aria-label="Quitar este aviso">×</button></div>`).join('')}</div>`;
}
function activarAvisosFamilia(p){
  $$('[data-quitar-aviso]').forEach(b=>b.onclick=()=>{ const c=cfgDe(p); c.avisosVistos={...(c.avisosVistos||{}), [b.dataset.quitarAviso]:claveDia(new Date())}; guardarAj(); b.closest('.aviso-f').remove(); });
  $$('[data-ir-resumen]').forEach(b=>b.onclick=()=>ir('resumen', p.id));
}
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-iaidea]'); if(!b || typeof iaForm==='undefined') return;
  iaForm={lector:lectorVisto().id, idea:b.dataset.iaidea}; ir('ia','historias');
});

/* ---------- resumen de la semana ---------- */
/* la semana que se resume: el viernes por la noche y el fin de semana, la que acaba; entre semana, la que va */
function semanaResumen(d=new Date()){ const s=sabadoDe(d); return (d.getDay()===6 || d.getDay()===0) ? diasDespues(s,-7) : s; }
definir('resumen', {zona:'adulto', nav:'evolucion', pintar(id){
  const p=aj.perfiles.find(x=>x.id===id)||lectorVisto(); const desde=semanaResumen(); const w=statsSemana(p, desde);
  const ant=statsSemana(p, diasDespues(desde,-7)); const c=cfgDe(p); c.informeVisto=claveDia(desde); guardarAj();
  const comp=(a,b,f=x=>x)=>{ if(b==null||a==null) return ''; const d=a-b; return d>0?` <small class="verde">▲ ${f(d)}</small>`:d<0?` <small class="rojo">▼ ${f(-d)}</small>`:''; };
  const V=valoracionesDe(p, semanasDe(p)).filter(([t])=>t!=='bien').slice(0,4);
  const ay=Object.entries(w.ayuda).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([x])=>x);
  const fila=(t,v)=>`<tr><td>${t}</td><td><b>${v}</b></td></tr>`;
  const premios=[w.estrellas?`${w.estrellas} ⭐`:'', w.cromos?`${w.cromos} ${w.cromos===1?'cromo':'cromos'}`:'', w.criaturas?`${w.criaturas} ${w.criaturas===1?'muñeco':'muñecos'}`:'', w.juegos?`${w.juegos} ${w.juegos===1?'juego':'juegos'}`:'', w.sobres?`${w.sobres} ${w.sobres===1?'sobre':'sobres'}`:'', w.revistas?`${w.revistas} ${w.revistas===1?'revista':'revistas'}`:'', w.cajas?`${w.cajas} ${w.cajas===1?'caja':'cajas'}`:''].filter(Boolean).join(' · ')||'—';
  const texto=[`Resumen de la semana de ${p.nombre} (${fechaSem(w)})`, `Leyendo: ${tiempoTxt(w.seg)} en ${w.dias} de 7 días · ${w.lecturas} lecturas (${w.delDia} del día, ${w.extra} extra)`, `Comprensión: ${w.comp==null?'–':Math.round(w.comp)+' %'} · Palabras por minuto: ${w.ppm==null?'–':Math.round(w.ppm)}`, `Tele que pudo ver: ${minTxt(w.puede)} · Pelis: ${w.peliV?'viernes ✓ ':''}${w.peliS?'sábado ✓':''}${!w.peliV&&!w.peliS?'ninguna':''}`, `Premios: ${premios}`, ay.length?`Palabras que le costaron: ${ay.join(', ')}`:''].filter(Boolean).join('\n');
  $('#s-resumen').innerHTML=`<div class="no-imprimir botones" style="margin-bottom:14px"><button class="btn" type="button" data-nava="evolucion">${ic('atras')} Volver</button><button class="btn btn-p" type="button" id="resImprimir">🖨️ Imprimir o guardar en PDF</button>${navigator.share?'<button class="btn btn-borde" type="button" id="resCompartir">📤 Compartir</button>':'<button class="btn btn-borde" type="button" id="resCopiar">📋 Copiar el texto</button>'}</div>
  <div class="card informe resumen-sem"><span class="pill">Resumen de la semana · ${esc(fechaSem(w))}</span><h1 style="margin-top:10px">${esc(p.nombre)}</h1>
    <div class="cifras"><div><b>${tiempoTxt(w.seg)}</b><span>leyendo${comp(w.seg/60, ant.seg/60, x=>Math.round(x)+' min')}</span></div><div><b>${w.dias} de 7</b><span>días leyendo${comp(w.dias, ant.dias)}</span></div><div><b>${w.lecturas}</b><span>lecturas${comp(w.lecturas, ant.lecturas)}</span></div><div><b>${w.comp==null?'–':Math.round(w.comp)+' %'}</b><span>comprensión${comp(w.comp, ant.comp, x=>Math.round(x)+' %')}</span></div><div><b>${w.estrellas||0} ⭐</b><span>estrellas${comp(w.estrellas, ant.estrellas)}</span></div></div>
    <div class="graf-2"><div><h3>Lo que hizo</h3><table class="tele-tabla">${fila('Historias del día', w.delDia)}${fila('Lecturas extra', w.extra)}${fila('Volver a leer', w.relee)}${fila('Fichas, dictados y letras', w.repaso.n+w.dictado.n+w.letras.n)}${fila('Escribo en ligada', w.cali.n||0)}${fila('Mis palabras de hoy', w.palDia.n||0)}${fila('Aprender jugando', (w.edu&&w.edu.n)||0)}${fila('Trabajos del cole', w.trabajos)}${fila('Palabras por minuto', w.ppm==null?'–':Math.round(w.ppm))}</table></div>
      <div><h3>Lo que ganó</h3><table class="tele-tabla">${fila('Tele que pudo ver', minTxt(w.puede))}${w.movil?fila('Móvil', minTxt(w.movil)):''}${fila('Peli del viernes', w.peliV?'🎬 sí':'no')}${fila('Peli del sábado', w.peliS?'🍿 sí':`no (${w.extra} de ${w.extrasSabado})`)}${fila('Premios', premios)}${w.objTotal?fila('Objetivos', `${w.objHechos} de ${w.objTotal}${w.objTodos?' 🎯':''}`):''}</table></div></div>
    ${V.length?`<h3 style="margin-top:14px">En qué ayudarle</h3><ul class="val-lista">${V.map(([t,x])=>`<li class="val-${t}"><span>${t==='ojo'?'⚠️':'💡'}</span><span>${x}</span></li>`).join('')}</ul>`:''}
    ${ay.length?`<p class="nota" style="margin-top:10px">Palabras que le costaron esta semana: ${ay.map(x=>`<b>${esc(x)}</b>`).join(', ')}.</p>`:''}
    <p class="nota" style="margin-top:10px">Resumen generado por LeeLEEJG.</p></div>`;
  $('#resImprimir').onclick=()=>window.print();
  const sh=$('#resCompartir'); if(sh) sh.onclick=()=>navigator.share({title:'Resumen de la semana', text:texto}).catch(()=>{});
  const cp=$('#resCopiar'); if(cp) cp.onclick=()=>{ (navigator.clipboard?navigator.clipboard.writeText(texto):Promise.reject()).then(()=>aviso('Copiado')).catch(()=>aviso('No se pudo copiar')); };
}});

/* ---------- espacio y limpieza (Datos y copias, solo en el ordenador) ---------- */
const mb = b => b<1024*1024 ? Math.max(1,Math.round(b/1024))+' KB' : (Math.round(b/1024/1024*10)/10).toString().replace('.',',')+' MB';
async function cargarEspacio(){
  const caja=$('#espacioCaja'); if(!caja) return; let e=null; try{ e=await api('/api/espacio'); }catch(_){ return; }
  if(!$('#espacioCaja')) return; const P=e.partes||{};
  const fila=(t,x)=>`<tr><td>${t}</td><td>${x?`${mb(x.bytes)}${x.n!=null?` · ${x.n} ${x.n===1?'archivo':'archivos'}`:''}`:'–'}</td></tr>`;
  caja.innerHTML=`<div class="card ajuste" style="margin-top:22px"><h3>🧹 Espacio y limpieza</h3><p class="nota">Los datos ocupan <b>${mb(e.total)}</b>. Nada se borra solo: lo que se quita va primero a la papelera del programa y, si queréis, a la Papelera de reciclaje de Windows (de donde se puede recuperar).</p>
    <table class="tele-tabla">${fila('Lecturas', P.sesiones)}${fila('Grabaciones', P.grabaciones)}${fila('Copias de seguridad', P.copias)}${fila('Voz guardada (caché)', P.cacheVoz)}${fila('Mis imágenes', P.misImagenes)}${fila('Ayudante IA', P.ia)}${fila('Registro', {bytes:e.registro})}${fila('Papelera del programa', e.papelera)}</table>
    ${e.papelera.viejos?`<div class="botones" style="margin-top:8px"><button class="btn btn-borde" type="button" id="espLimpiar">Mandar a la Papelera de Windows lo de más de 30 días (${e.papelera.viejos} · ${mb(e.papelera.bytesViejos)})</button></div>`:'<p class="nota" style="margin-top:6px">✅ No hay nada viejo en la papelera del programa. El registro se aparta solo cuando pasa de 1 MB.</p>'}</div>`;
  const b=$('#espLimpiar'); if(b) b.onclick=()=>dialogo({titulo:'¿Mandar a la Papelera de Windows?', html:`<p class="nota">${e.papelera.viejos} ${e.papelera.viejos===1?'archivo':'archivos'} de la papelera del programa con más de 30 días (lecturas, grabaciones o imágenes que ya quitasteis). Se podrán recuperar desde la Papelera de reciclaje.</p>`,
    botones:[{t:'Cancelar',cls:'btn'},{t:'Sí, mandarlos',cls:'btn-p', fn:async()=>{ const r=await postJSON('/api/limpiar',{}).catch(()=>({ok:false, motivo:'No se pudo.'})); aviso(r.ok?`${r.n} ${r.n===1?'archivo':'archivos'} en la Papelera de Windows`:(r.motivo||'No se pudo')); cargarEspacio(); }}]});
}
/* ---------- oído Whisper para comparar (Voz y sonido, solo en el ordenador) ---------- */
let tWhisper=null;
async function cargarWhisper(){
  const caja=$('#whisperCaja'); if(!caja) return; let w=null; try{ w=await api('/api/whisper'); }catch(_){ caja.innerHTML=''; return; }
  if(!$('#whisperCaja')) return;
  const res=(w.resultados||[]);
  const tabla=res.length?`<div class="tabla-w"><table><thead><tr><th>Lectura</th><th>Oído del programa</th><th>Whisper</th></tr></thead><tbody>${res.map(r=>`<tr><td>${esc(r.titulo)} <small>${esc(fechaCorta(r.fecha))}</small></td><td>${r.programa} %</td><td><b>${r.whisper} %</b></td></tr>`).join('')}</tbody></table></div><p class="nota">De media: programa ${Math.round(media(res.map(r=>r.programa)))} %, Whisper ${Math.round(media(res.map(r=>r.whisper)))} % de las palabras de la historia.${media(res.map(r=>r.whisper))>media(res.map(r=>r.programa))+10?' Whisper le entiende bastante mejor: se podría usar para revisar sus lecturas.':''}</p>`:'';
  caja.innerHTML=`<div class="card ajuste"><h3>🎧 Probar el oído Whisper (para comparar)</h3>
    <p class="nota">Whisper es otro reconocimiento de voz que funciona sin internet y suele entender mejor a los niños, pero es más lento: no sigue la lectura en directo, escucha las grabaciones después. Aquí se compara con el oído del programa usando sus últimas grabaciones.</p>
    ${w.instalando||w.comparando?`<p class="sub">⏳ ${esc(w.paso||'Trabajando…')}</p>`:''}${w.error?`<p class="nota" style="color:#B91C1C">No se pudo: ${esc(w.error)}</p>`:''}
    ${!w.instalado && !w.instalando ? `<div class="botones"><button class="btn btn-p" type="button" id="whInstalar">Instalar Whisper (necesita internet; descarga unos 150 MB)</button></div>` : ''}
    ${w.instalado && !w.comparando ? `<div class="botones"><button class="btn btn-p" type="button" id="whComparar">Comparar con sus 5 últimas grabaciones</button></div>` : ''}
    ${tabla}</div>`;
  const i=$('#whInstalar'); if(i) i.onclick=()=>dialogo({titulo:'¿Instalar Whisper?', html:'<p class="nota">Se descargará de internet el programa faster-whisper y su modelo «base» (unos 150 MB en total) en la carpeta del programa. Puede tardar unos minutos. No cambia nada de los datos.</p>',
    botones:[{t:'Cancelar',cls:'btn'},{t:'Sí, instalar',cls:'btn-p', fn:async()=>{ await postJSON('/api/whisper/instalar',{}).catch(()=>{}); cargarWhisper(); }}]});
  const c=$('#whComparar'); if(c) c.onclick=async()=>{ await postJSON('/api/whisper/comparar',{n:5}).catch(()=>{}); cargarWhisper(); };
  clearTimeout(tWhisper); if(w.instalando||w.comparando) tWhisper=setTimeout(()=>{ if(actual==='vozsonido') cargarWhisper(); }, 3000);
}
