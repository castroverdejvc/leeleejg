/* LeeLEEJG · Ayudante IA (Claude)
   En el ordenador, el motor (app.py + ia_claude.py) llama a la IA con la clave que está guardada en el ordenador.
   En la tablet no hay clave ni se llama a la IA: se ve lo que se preparó en el ordenador (llega al juntar los datos).
   Lo que se guarda en los ajustes (y por eso viaja en las copias a la tablet):
     aj.iaPalabras   {palabra: {texto, f}}           explicaciones de palabras («¿Qué significa?»)
     aj.iaPalabrasQuitadas {palabra: f}              explicaciones quitadas en la tablet (el ordenador las borra de su caché)
     aj.iaPreguntas  {historiaId: {preguntas, f}}    preguntas nuevas aprobadas: salen al volver a leer esa historia
     aj.iaInformes   {lectorId: informe}             último informe guardado de cada lector
     aj.iaExplicarNino  false = el niño no puede pedir explicaciones nuevas mientras lee
   Las historias aprobadas van como «historias nuevas» (datos/historias_nuevas), igual que las que se añaden a mano. */
'use strict';
const iaEnPC = () => !enLocal();
const iaActiva = () => iaEnPC() && !!(EST.ia && EST.ia.activa);
const iaClave = p => String(p||'').toLowerCase().replace(/[^\p{L}]/gu,'').slice(0,30);
const IA_SENCILLAS = new Set(['el','la','los','las','un','una','y','o','de','del','al','a','en','con','por','para','que','es','se','su','sus','mi','tu','lo','le','no','si','ya','me','te']);
const conNombreDe = (s, p) => String(s??'').split('{nombre}').join((p&&p.nombre)||nombre());
/* mensaje de error legible (el motor devuelve {"error": "..."}) */
function iaError(e){ const m=String(e && e.message || e || ''); try{ const j=JSON.parse(m); if(j && j.error) return j.error; }catch(x){} return m || 'No se pudo.'; }
/* la frase se manda sin el nombre del niño */
const iaSinNombre = t => String(t||'').split(nombre()).join('el niño').replace(/\s+/g,' ').trim().slice(0,240);

/* ================= «¿Qué significa?» (para el niño) ================= */
/* una explicación quitada (en este aparato o en el otro) no se usa aunque el otro aparato la traiga todavía */
function iaQuitada(k, x){ const q=(aj.iaPalabrasQuitadas||{})[k]; return !!q && (!x || q >= (Date.parse(x.f||0)||0)); }
function iaExplicacionDe(p){ const k=iaClave(p); const x=(aj.iaPalabras||{})[k]; return x && x.texto && !iaQuitada(k, x) ? x : null; }
function iaPuedeExplicar(p){ const k=iaClave(p); if(k.length<2 || IA_SENCILLAS.has(k)) return false; return !!iaExplicacionDe(k) || (iaActiva() && aj.iaExplicarNino!==false); }
function iaApuntarExplicacion(k, texto, extra){
  const m={...(aj.iaPalabras||{})}; m[k]={texto, f:new Date().toISOString(), ...(extra||{})};
  const ks=Object.keys(m); if(ks.length>800) ks.sort((a,b)=>String(m[a].f).localeCompare(String(m[b].f))).slice(0, ks.length-800).forEach(x=>delete m[x]);
  aj.iaPalabras=m; if(aj.iaPalabrasQuitadas && aj.iaPalabrasQuitadas[k]){ const q={...aj.iaPalabrasQuitadas}; delete q[k]; aj.iaPalabrasQuitadas=q; }
  guardarAj();
}
/* explicaciones quitadas (aquí o en el otro aparato): se borran de la lista y el ordenador también de su caché
   (si no, la volvería a dar). Las marcas se guardan 60 días para que al juntar no vuelvan. */
async function iaSincronizarQuitadas(){
  const q={...(aj.iaPalabrasQuitadas||{})}; const ks=Object.keys(q); if(!ks.length) return; let cambio=false; const lim=Date.now()-60*DIA_MS;
  for(const k of ks){
    if(q[k]<lim){ delete q[k]; cambio=true; continue; }
    const x=(aj.iaPalabras||{})[k];
    if(x && iaQuitada(k, x)){ const m={...aj.iaPalabras}; delete m[k]; aj.iaPalabras=m; cambio=true; }
    if(iaEnPC() && !iaExplicacionDe(k)) await api('/api/ia/explicaciones/'+encodeURIComponent(k), {method:'DELETE'}).catch(()=>{});
  }
  if(cambio){ aj.iaPalabrasQuitadas=q; guardarAj(); }
}
function iaQuitarExplicacion(k){
  const m={...(aj.iaPalabras||{})}; delete m[k]; aj.iaPalabras=m; aj.iaPalabrasQuitadas={...(aj.iaPalabrasQuitadas||{}), [k]:Date.now()}; guardarAj();
  if(iaEnPC()) return api('/api/ia/explicaciones/'+encodeURIComponent(k), {method:'DELETE'}).catch(()=>{});
}
async function iaExplicar(palabra, frase){
  const k=iaClave(palabra); const ya=iaExplicacionDe(k); if(ya) return ya.texto;
  if(!iaActiva() || aj.iaExplicarNino===false) return null;
  if(iaQuitada(k)) await api('/api/ia/explicaciones/'+encodeURIComponent(k), {method:'DELETE'}).catch(()=>{});   // la quitó la familia: se pide otra
  const r=await postJSON('/api/ia/explicar', {palabra:k, frase:iaSinNombre(frase)});
  if(r && r.texto){ iaApuntarExplicacion(k, r.texto); return r.texto; }
  return '';
}
/* caja con la explicación, dentro de la ayuda de la palabra o en Practicar */
async function iaMostrarSignificado(texto, frase, cont, antes){
  if(!cont) return; let caja=cont.querySelector('.ia-explica');
  if(!caja){ caja=document.createElement('p'); caja.className='sub ia-explica';
    caja.style.cssText='margin:12px 0 4px;padding:12px 16px;border-radius:14px;background:var(--yellow-soft,#FFF6D6);color:var(--ink,#13204A);font-size:1.2rem;line-height:1.45;text-align:left';
    if(antes && antes.parentNode===cont) cont.insertBefore(caja, antes); else cont.appendChild(caja); }
  caja.textContent='🤔 Pensando…';
  try{
    const t=await iaExplicar(texto, frase);
    if(t){ caja.textContent='💡 '+t; decir(t); }
    else { caja.textContent='Esta palabra pregúntasela a papá o a mamá.'; decir('Esta palabra pregúntasela a papá o a mamá.'); }
  }catch(e){ caja.textContent='Ahora no puedo explicarla. Pregúntasela a papá o a mamá.'; decir('Ahora no puedo explicarla. Pregúntasela a papá o a mamá.'); registrar('IA explicar: '+iaError(e)); }
}
/* botón para la ayuda de una palabra al leer (lectura.js) */
function iaBotonSignificado(texto, frase){
  if(!iaPuedeExplicar(limpiar(texto)||texto)) return null;
  return {t:'🤔 ¿Qué significa?', cls:'btn-borde', mantener:true, fn:()=>{ const d=$$('.dialogo.ayuda-pal').pop(); if(d) iaMostrarSignificado(limpiar(texto)||texto, frase, d, d.querySelector('.dlg-botones')); }};
}
/* botón en Practicar (nino.js) */
function iaBotonPracticarHTML(p){ return iaPuedeExplicar(p) ? `<button class="btn btn-borde btn-g" type="button" id="btnQueSig">🤔 ¿Qué significa?</button>` : ''; }
function activarIaPracticar(p){
  const b=$('#btnQueSig'); if(!b) return;
  b.onclick=()=>{ const c=$('#s-practicar .card.practica > div:last-child') || $('#s-practicar .card.practica'); iaMostrarSignificado(p, iaFraseDe(p, perfil()), c); };
}
/* una frase de sus historias donde sale la palabra (para que la IA sepa qué significado tiene) */
function iaFraseDe(w, p){
  const k=iaClave(w);
  for(const s of sesDe(p.id).slice(-40).reverse()){ const h=historia(s.historiaId); if(!h) continue;
    for(const l of h.lineas){ const pl=l.replace(/\[([^|\]]+)\|[^\]]+\]/g,'$1').split('{nombre}').join('el niño'); if(pl.split(/[^\p{L}]+/u).some(x=>iaClave(x)===k)) return pl; } }
  return '';
}

/* ================= preguntas nuevas al volver a leer (lectura.js) ================= */
/* La primera vez salen las preguntas de siempre; si ya la ha leído y hay preguntas nuevas aprobadas, salen esas. */
function iaVariante(h, forzar){
  const x=h && (aj.iaPreguntas||{})[h.id];
  if(!x || !Array.isArray(x.preguntas) || !x.preguntas.length) return h;
  if(!forzar && !misSes().some(s=>s.historiaId===h.id && !s.incompleta)) return h;
  return {...h, preguntas:x.preguntas, pregIA:true};
}

/* ================= Familia › Ayudante IA ================= */
let tabIA='historias', iaBorr=[], iaInformeNuevo=null, iaForm={};
const IA_TABS=[['historias','Historias nuevas'],['preguntas','Preguntas nuevas'],['palabras','Explicar palabras'],['informe','Informe de progreso']];
const iaMundoDeTema = t => t.id==='futbol' ? 'liga' : t.mundos[0];
function iaMini(k, px){ const im=imgHTML(k).replace('<img ', '<img style="width:100%;height:100%;object-fit:cover" ');
  return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${px}px;height:${px}px;border-radius:8px;overflow:hidden;vertical-align:middle;margin:0 4px;background:var(--primary-soft,#EAF2FE);font-size:${Math.round(px*.6)}px;flex:none">${im}</span>`; }
const iaLineaHTML = (l, p) => esc(conNombreDe(l, p)).replace(/\[([^|\]]+)\|([^\]]+)\]/g, (m,w,k)=>`<b>${w}</b>${iaMini(k,30)}`);
const iaLineaPlana = (l, p) => conNombreDe(l, p).replace(/\[([^|\]]+)\|[^\]]+\]/g, '$1');
function iaPreguntasListaHTML(preg, p){
  return `<ol style="margin:8px 0 0 22px;display:grid;gap:8px">${(preg||[]).map(q=>`<li><b>${esc(conNombreDe(q.q,p))}</b><br><span class="nota">${q.ops.map((o,i)=>`${iaMini(o[1],24)}${i===q.ok?'✓ <b>'+esc(conNombreDe(o[0],p))+'</b>':esc(conNombreDe(o[0],p))}`).join(' · ')}</span></li>`).join('')}</ol>`;
}
/* lo que se sabe que le gusta (sus respuestas a «Sorpresas de hoy»); no se manda «qué te da miedo» */
const IA_GUSTOS = {animal:'animal favorito', deporte:'deporte', comida:'comida favorita', mayor:'de mayor quiere ser', poder:'superpoder', dino:'dinosaurio favorito', viaje:'le gustaría viajar en', lugar:'prefiere', juego:'le gusta jugar a', mascota:'mascota', color:'color favorito', musica:'instrumento', historias:'historias de', estacion:'estación favorita', fruta:'fruta favorita'};
function iaGustos(p){ const ult={}; (cfgDe(p).gustosLog||[]).forEach(x=>{ if(IA_GUSTOS[x.q]) ult[x.q]=x.r; }); return Object.entries(ult).map(([q,r])=>IA_GUSTOS[q]+': '+r); }
function iaIdeasBuzon(p){ const out=[]; (cfgDe(p).deseosLog||[]).slice().reverse().forEach(x=>{ if((x.q==='voz'||x.q==='historias') && x.r && !out.includes(x.r)) out.push(String(x.r)); }); return out.slice(0,6); }
const iaFechaCorta = f => f ? new Date(f).toLocaleDateString('es-ES',{day:'numeric', month:'short'}) : '';

definir('ia', {zona:'adulto', async pintar(tab){
  if(tab && typeof tab==='string') tabIA=tab;
  const s=$('#s-ia'); if(!s.innerHTML) s.innerHTML='<p class="vacio">Cargando…</p>';
  if(iaEnPC()){ try{ EST.ia = await api('/api/ia/estado'); }catch(e){} iaBorr = await api('/api/ia/borradores').catch(()=>[]); iaSincronizarQuitadas(); }
  else iaBorr=[];
  if(actual!=='ia') return;
  const p=lectorVisto(); if(iaForm.lector!==p.id) iaForm={lector:p.id};   // el formulario es de cada lector
  const cuerpo = tabIA==='preguntas' ? iaPreguntasHTML(p) : tabIA==='palabras' ? iaPalabrasHTML(p) : tabIA==='informe' ? iaInformeHTML(p) : iaHistoriasHTML(p);
  s.innerHTML = `<div class="pag-cab no-imprimir"><div><h1>Ayudante IA</h1><p class="sub">Con Claude, una inteligencia artificial. Lo que prepara es un borrador: lo revisáis antes de que lo vea ${esc(p.nombre)}.</p></div>${selLector('ia')}</div>
    ${iaEstadoHTML()}
    <div class="tabs no-imprimir" role="tablist">${IA_TABS.map(([k,t])=>`<button type="button" role="tab" data-tabia="${k}" aria-selected="${k===tabIA}">${t}</button>`).join('')}</div>${cuerpo}`;
  $$('#s-ia [data-tabia]').forEach(b=>b.onclick=()=>ir('ia', b.dataset.tabia));
  if(tabIA==='preguntas') activarIaPreguntas(p); else if(tabIA==='palabras') activarIaPalabras(p); else if(tabIA==='informe') activarIaInforme(p); else activarIaHistorias(p);
}});
function iaEstadoHTML(){
  if(!iaEnPC()) return `<div class="card ajuste no-imprimir"><h3>${ic('bombilla')} Disponible en el ordenador</h3><p class="nota">La IA funciona en el ordenador, donde está guardada la clave. Aquí se ve lo que se preparó allí (historias aprobadas, explicaciones de palabras, preguntas nuevas e informes) cuando se juntan los datos.</p></div>`;
  const e=EST.ia||{};
  if(!e.activa) return `<div class="card ajuste no-imprimir"><h3>${ic('bombilla')} La IA no está activada</h3><p class="nota">${esc(e.motivo||'Falta la clave.')} Puede ser solo la clave (sk-ant-…) o una línea ANTHROPIC_API_KEY=… Después vuelve a entrar aquí. El resto del programa funciona igual.</p></div>`;
  return e.uso ? `<p class="nota no-imprimir" style="margin:-6px 0 12px">IA activada · este mes, ${e.uso.peticiones||0} ${e.uso.peticiones===1?'petición':'peticiones'}.</p>` : '';
}
/* botón ocupado mientras trabaja la IA */
async function iaTrabajar(b, texto, fn){
  if(!b || b.disabled) return; const antes=b.innerHTML; b.disabled=true; b.textContent=texto;
  try{ await fn(); }catch(e){ dialogo({titulo:'No se pudo', html:`<p class="nota">${esc(iaError(e))}</p>`, botones:[{t:'Vale',cls:'btn-p'}]}); }
  finally{ if(document.body.contains(b)){ b.disabled=false; b.innerHTML=antes; } }
}

/* ---------- 1 · historias nuevas ---------- */
function iaHistoriasHTML(p){
  const ts=temasDe(p), pm=(cfgDe(p).pideMas||[]).map(x=>x.tema).filter(t=>temaDe(t));
  const temaSel = iaForm.tema && temaDe(iaForm.tema) ? iaForm.tema : (pm[pm.length-1] || ts[0] || TEMAS[0].id);
  const nivel = iaForm.nivel || nivelActualDe(p);
  const palabras = iaForm.palabras!=null ? iaForm.palabras : palabrasDificiles(sesDe(p.id)).map(x=>x.p).filter(w=>!IA_SENCILLAS.has(iaClave(w))).slice(0,8).join(', ');
  const gustos=iaGustos(p), ideas=iaIdeasBuzon(p);
  const bs=iaBorr.filter(b=>b.tipo==='historia');
  return `<div class="card bloque no-imprimir"><h3>Crear historias nuevas</h3>
    <p class="nota" style="margin:6px 0 12px">Historias con el mismo formato que las del programa (frases cortas, fotos del programa, 3 preguntas y reto de números), a su nivel y con las palabras que le cuestan. Al aprobarlas entran en su tema y en el calendario de quien tenga ese tema.</p>
    <div class="fam-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px">
      <div class="campo"><label for="iaTema">Tema</label><select id="iaTema">${TEMAS.map(t=>`<option value="${t.id}" ${t.id===temaSel?'selected':''}>${t.emo} ${esc(t.nombre)}${ts.includes(t.id)?' ⭐':''}${pm.includes(t.id)?' · pidió más':''}</option>`).join('')}</select></div>
      <div class="campo"><label for="iaNivel">Nivel</label><select id="iaNivel">${NIVELES.map(([n,t])=>`<option value="${n}" ${n===nivel?'selected':''}>${n} · ${esc(t)}</option>`).join('')}</select></div>
      <div class="campo"><label for="iaCuantas">Cuántas</label><select id="iaCuantas">${[1,2,3].map(n=>`<option value="${n}" ${n===(iaForm.n||2)?'selected':''}>${n}</option>`).join('')}</select></div></div>
    <div class="campo"><label for="iaPalabras">Palabras que le cuestan (para que las practique en las historias)</label><input id="iaPalabras" value="${esc(palabras)}" placeholder="Separadas por comas" autocomplete="off"></div>
    <div class="campo"><label for="iaIdea">Idea (si queréis)</label><input id="iaIdea" maxlength="200" value="${esc(iaForm.idea||'')}" placeholder="Por ejemplo: piratas, un cumpleaños en la playa, su perro…" autocomplete="off">
      ${ideas.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${ideas.map(x=>`<button type="button" class="btn btn-mini" data-idea="${esc(x)}">${esc(x)}</button>`).join('')}</div><span class="nota">Lo que ha pedido en su buzón de ideas: tócalo para usarlo.</span>`:''}</div>
    ${gustos.length?`<p class="nota">Se tendrá en cuenta lo que le gusta: ${esc(gustos.join(' · '))}.</p>`:''}
    <p class="nota">A la IA solo se le manda el tema, el nivel, las palabras, la idea y sus gustos, sin su nombre.</p>
    <div class="botones" style="margin-top:10px"><button class="btn btn-p btn-g" type="button" id="iaCrearH" ${iaActiva()?'':'disabled'}>${ic('bombilla')} Crear borradores</button></div></div>
  ${bs.length?`<h3 class="no-imprimir" style="margin:22px 0 10px">Para revisar (${bs.length})</h3>${bs.slice().reverse().map(b=>iaHistoriaHTML(b, p)).join('')}`
    :`<p class="nota no-imprimir" style="margin-top:14px">No hay borradores pendientes. Las historias ya aprobadas están en Evolución › Temas e intereses › Historias nuevas (empiezan por «IA-»), donde también se pueden quitar.</p>`}`;
}
function iaHistoriaHTML(b, p){
  const h=b.historia, T=temaDeMundo(h.mundo)||{emo:'',nombre:h.mundo}; const lec=aj.perfiles.find(x=>x.id===b.lectorId)||p;
  return `<div class="card bloque no-imprimir" style="margin-bottom:14px">
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">${iaMini(h.portada,64)}<div><b style="font-size:1.15rem">${esc(conNombreDe(h.titulo, lec))}</b><span class="nota" style="display:block">${T.emo} ${esc(T.nombre)} · nivel ${h.nivel} · ${h.lineas.length} renglones${h.practica&&h.practica.length?' · practica: '+esc(h.practica.join(', ')):''} · para ${esc(lec.nombre)} · ${esc(iaFechaCorta(b.creado))}</span></div></div>
    ${b.avisos&&b.avisos.length?`<div class="aviso-int" style="margin-top:10px">${b.avisos.map(esc).join('<br>')}</div>`:''}
    <div style="font-family:var(--f-lect);font-size:1.3rem;line-height:1.8;margin:12px 0">${h.lineas.map(l=>`<p style="margin:0">${iaLineaHTML(l, lec)}</p>`).join('')}</div>
    <b>Preguntas</b>${iaPreguntasListaHTML(h.preguntas, lec)}
    ${h.calculo?`<p class="nota" style="margin-top:10px">🔢 ${esc(conNombreDe(h.calculo.q, lec))} → <b>${esc(h.calculo.ops[h.calculo.ok])}</b> (${h.calculo.resultado})</p>`:''}
    <div class="botones" style="margin-top:12px"><button class="btn btn-borde" type="button" data-iaoir="${esc(b.id)}">${ic('altavoz')} Escuchar</button><button class="btn btn-p" type="button" data-iaok="${esc(b.id)}">${ic('check')} Aprobar y añadir</button><button class="btn btn-rojo" type="button" data-iano="${esc(b.id)}">Descartar</button></div></div>`;
}
function activarIaHistorias(p){
  const leeForm=()=>{ const t=$('#iaTema'); if(!t) return; iaForm={...iaForm, tema:t.value, nivel:+$('#iaNivel').value, n:+$('#iaCuantas').value, palabras:$('#iaPalabras').value, idea:$('#iaIdea').value}; };
  $$('#s-ia select, #s-ia input').forEach(x=>x.onchange=leeForm);
  $$('#s-ia [data-idea]').forEach(b=>b.onclick=()=>{ $('#iaIdea').value=b.dataset.idea; leeForm(); });
  const bc=$('#iaCrearH'); if(bc) bc.onclick=()=>iaTrabajar(bc, 'Escribiendo… (puede tardar un minuto)', async()=>{
    leeForm(); const T=temaDe(iaForm.tema);
    const r=await postJSON('/api/ia/historias', {mundo:iaMundoDeTema(T), nivel:iaForm.nivel, n:iaForm.n, lectorId:p.id, idea:iaForm.idea,
      palabras:String(iaForm.palabras||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean).slice(0,12), gustos:iaGustos(p)});
    aviso((r.borradores||[]).length===1?'1 borrador listo para revisar':(r.borradores||[]).length+' borradores listos para revisar');
    if(actual==='ia') ir('ia','historias');
  });
  const buscar=id=>iaBorr.find(b=>b.id===id);
  $$('#s-ia [data-iaoir]').forEach(b=>b.onclick=()=>{ const x=buscar(b.dataset.iaoir); if(x){ const lec=aj.perfiles.find(y=>y.id===x.lectorId)||p; decirVarias([[conNombreDe(x.historia.titulo,lec),'es'], ...x.historia.lineas.map(l=>[iaLineaPlana(l,lec),'es'])]); } });
  $$('#s-ia [data-iano]').forEach(b=>b.onclick=()=>dialogo({titulo:'¿Descartar este borrador?', html:'<p class="nota">No se añade al programa.</p>', botones:[{t:'Conservar',cls:'btn'},{t:'Descartar',cls:'btn-rojo', fn:async()=>{ await api('/api/ia/borradores/'+b.dataset.iano, {method:'DELETE'}).catch(()=>{}); ir('ia'); }}]}));
  $$('#s-ia [data-iaok]').forEach(b=>b.onclick=()=>iaTrabajar(b, 'Añadiendo…', async()=>{
    const x=buscar(b.dataset.iaok); if(!x) return; const h={...x.historia}; delete h.practica;
    const T=temaDeMundo(h.mundo); const f=new Date(), dd=n=>String(n).padStart(2,'0');
    const archivo=`IA-${T?T.id:h.mundo}-${f.getFullYear()}${dd(f.getMonth()+1)}${dd(f.getDate())}-${dd(f.getHours())}${dd(f.getMinutes())}${dd(f.getSeconds())}`;
    await postJSON('/api/historias-nuevas', {nombre:archivo, historias:[h]});
    await api('/api/ia/borradores/'+x.id, {method:'DELETE'}).catch(()=>{});
    await recargarContenido(); aviso('Historia añadida a '+(T?T.nombre:'su tema')); ir('ia','historias');
  }));
}

/* ---------- 2 · preguntas nuevas ---------- */
function iaPreguntasHTML(p){
  const vistas=new Set(), leidasL=[];
  sesDe(p.id).slice().reverse().forEach(s=>{ if(!s.incompleta && !vistas.has(s.historiaId) && historia(s.historiaId)){ vistas.add(s.historiaId); leidasL.push(historia(s.historiaId)); } });
  const ap=aj.iaPreguntas||{}; const bs=iaBorr.filter(b=>b.tipo==='preguntas');
  const aprob=Object.entries(ap).filter(([id])=>historia(id)).sort((a,b)=>String(b[1].f).localeCompare(String(a[1].f)));
  return `<div class="card bloque no-imprimir"><h3>Preguntas nuevas para volver a leer</h3>
    <p class="nota" style="margin:6px 0 12px">La IA prepara preguntas de comprensión distintas para una historia que ya ha leído. Cuando las apruebes, le saldrán al <b>volver a leerla</b> (la primera vez siempre salen las de siempre). Releer el mismo texto le ayuda a leer con soltura, y con preguntas nuevas tiene que volver a pensar.</p>
    ${leidasL.length?`<div class="campo"><label for="iaHist">Historia</label><select id="iaHist">${leidasL.slice(0,80).map(h=>`<option value="${esc(h.id)}">${esc(conNombreDe(h.titulo,p))}${ap[h.id]?' · ya tiene preguntas nuevas':''}</option>`).join('')}</select></div>
      <div class="botones"><button class="btn btn-p btn-g" type="button" id="iaCrearP" ${iaActiva()?'':'disabled'}>${ic('bombilla')} Crear preguntas</button></div>`:'<p class="vacio">Todavía no ha terminado ninguna historia.</p>'}</div>
  ${bs.slice().reverse().map(b=>{ const h=historia(b.historiaId); const lec=aj.perfiles.find(x=>x.id===b.lectorId)||p;
    return `<div class="card bloque no-imprimir" style="margin-top:14px"><div style="display:flex;gap:14px;align-items:center">${h?iaMini(h.portada,56):''}<div><b>${esc(conNombreDe(b.titulo||'',lec))}</b><span class="nota" style="display:block">Preguntas nuevas · ${esc(iaFechaCorta(b.creado))}</span></div></div>
      ${b.avisos&&b.avisos.length?`<div class="aviso-int" style="margin-top:10px">${b.avisos.map(esc).join('<br>')}</div>`:''}
      ${h?`<details style="margin-top:10px"><summary class="nota">Ver la historia</summary><div style="font-family:var(--f-lect);font-size:1.15rem;line-height:1.7;margin-top:6px">${h.lineas.map(l=>`<p style="margin:0">${iaLineaHTML(l,lec)}</p>`).join('')}</div></details>`:''}
      ${iaPreguntasListaHTML(b.preguntas, lec)}
      <div class="botones" style="margin-top:12px"><button class="btn btn-p" type="button" data-iapok="${esc(b.id)}">${ic('check')} Aprobar</button><button class="btn btn-rojo" type="button" data-iano="${esc(b.id)}">Descartar</button></div></div>`; }).join('')}
  <div class="card bloque" style="margin-top:18px"><h3 style="margin-bottom:10px">Preguntas nuevas aprobadas</h3>${aprob.length?`<div class="tabla-w"><table><thead><tr><th>Historia</th><th>Preguntas</th><th>Aprobadas</th><th></th></tr></thead><tbody>${aprob.map(([id,x])=>`<tr><td><b>${esc(conNombreDe(historia(id).titulo,p))}</b></td><td>${x.preguntas.length}</td><td>${esc(iaFechaCorta(x.f))}</td><td style="white-space:nowrap"><button class="btn btn-mini" type="button" data-iapver="${esc(id)}">Ver</button> <button class="btn btn-mini btn-rojo" type="button" data-iapdel="${esc(id)}">Quitar</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="vacio">Todavía no hay ninguna.</p>'}</div>`;
}
function activarIaPreguntas(p){
  const bc=$('#iaCrearP'); if(bc) bc.onclick=()=>iaTrabajar(bc, 'Preparando preguntas…', async()=>{
    await postJSON('/api/ia/preguntas', {historiaId:$('#iaHist').value, lectorId:p.id}); aviso('Preguntas listas para revisar'); if(actual==='ia') ir('ia','preguntas'); });
  $$('#s-ia [data-iano]').forEach(b=>b.onclick=async()=>{ await api('/api/ia/borradores/'+b.dataset.iano, {method:'DELETE'}).catch(()=>{}); ir('ia'); });
  $$('#s-ia [data-iapok]').forEach(b=>b.onclick=async()=>{ const x=iaBorr.find(y=>y.id===b.dataset.iapok); if(!x) return;
    aj.iaPreguntas={...(aj.iaPreguntas||{}), [x.historiaId]:{preguntas:x.preguntas, f:new Date().toISOString()}}; guardarAj();
    await api('/api/ia/borradores/'+x.id, {method:'DELETE'}).catch(()=>{}); aviso('Preguntas aprobadas: saldrán al volver a leerla'); ir('ia','preguntas'); });
  $$('#s-ia [data-iapver]').forEach(b=>b.onclick=()=>{ const x=(aj.iaPreguntas||{})[b.dataset.iapver]; const h=historia(b.dataset.iapver); if(!x||!h) return;
    dialogo({titulo:esc(conNombreDe(h.titulo,p)), html:iaPreguntasListaHTML(x.preguntas,p), botones:[{t:'Vale',cls:'btn-p'}]}); });
  $$('#s-ia [data-iapdel]').forEach(b=>b.onclick=()=>dialogo({titulo:'¿Quitar estas preguntas?', html:'<p class="nota">Al volver a leer esa historia saldrán otra vez las de siempre.</p>', botones:[{t:'Conservar',cls:'btn'},{t:'Quitar',cls:'btn-rojo', fn:()=>{ const m={...(aj.iaPreguntas||{})}; delete m[b.dataset.iapdel]; aj.iaPreguntas=m; guardarAj(); ir('ia','preguntas'); }}]}));
}

/* ---------- 3 · explicar palabras ---------- */
function iaPalabrasHTML(p){
  const m=aj.iaPalabras||{}; const ks=Object.keys(m).filter(k=>iaExplicacionDe(k)).sort((a,b)=>String(m[b].f).localeCompare(String(m[a].f)));
  const dif=palabrasDificiles(sesDe(p.id)).map(x=>x.p).filter(w=>iaClave(w).length>1 && !IA_SENCILLAS.has(iaClave(w)));
  const sin=dif.filter(w=>!iaExplicacionDe(w)).slice(0,12);
  return `<div class="card ajuste no-imprimir"><div class="interruptor"><div><h3 style="margin-bottom:4px">🤔 «¿Qué significa?» mientras lee</h3><p class="nota">Cuando toca una palabra difícil, además de oírla por sílabas puede pedir que se la expliquen: una frase corta y un ejemplo, con la voz del programa. Cada explicación se guarda: la misma palabra no se vuelve a pedir a la IA. Podéis cambiarlas o quitarlas abajo.</p></div><button type="button" class="switch" id="iaSwNino" role="switch" aria-checked="${aj.iaExplicarNino!==false}"></button></div>
      ${iaEnPC()?'':'<p class="nota" style="margin-top:6px">En la tablet solo le salen las explicaciones que ya están preparadas.</p>'}</div>
    <div class="card bloque no-imprimir" style="margin-top:18px"><h3>Preparar las de sus palabras difíciles</h3><p class="nota" style="margin:6px 0 10px">${sin.length?`Todavía sin explicación: <b>${esc(sin.join(', '))}</b>. Al prepararlas aquí, también le saldrán en la tablet.`:'Sus palabras difíciles ya tienen explicación (o todavía no hay palabras difíciles).'}</p>
      <div class="botones"><button class="btn btn-p" type="button" id="iaPrepPal" ${iaActiva()&&sin.length?'':'disabled'}>${ic('bombilla')} Preparar explicaciones</button></div></div>
    <div class="card bloque" style="margin-top:18px"><h3 style="margin-bottom:10px">Explicaciones guardadas (${ks.length})</h3>${ks.length?`<div class="tabla-w"><table><thead><tr><th>Palabra</th><th>Explicación</th><th></th></tr></thead><tbody>${ks.map(k=>`<tr><td><b>${esc(k)}</b></td><td>${esc(m[k].texto)}${m[k].editada?' <span class="nb bien">cambiada</span>':''}</td><td style="white-space:nowrap"><button class="btn btn-mini" type="button" data-iapoir="${esc(k)}" aria-label="Escuchar">${ic('altavoz')}</button> <button class="btn btn-mini" type="button" data-iaped="${esc(k)}">Cambiar</button> <button class="btn btn-mini btn-rojo" type="button" data-iapq="${esc(k)}">Quitar</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="vacio">Todavía no hay ninguna.</p>'}</div>`;
}
function activarIaPalabras(p){
  const sw=$('#iaSwNino'); sw.onclick=()=>{ const v=sw.getAttribute('aria-checked')!=='true'; sw.setAttribute('aria-checked', String(v)); aj.iaExplicarNino=v; guardarAj(); aviso(v?'Puede pedir explicaciones':'No pedirá explicaciones nuevas'); };
  const bp=$('#iaPrepPal'); if(bp) bp.onclick=()=>iaTrabajar(bp, 'Preparando…', async()=>{
    await iaSincronizarQuitadas();
    const dif=palabrasDificiles(sesDe(p.id)).map(x=>x.p).filter(w=>iaClave(w).length>1 && !IA_SENCILLAS.has(iaClave(w)) && !iaExplicacionDe(w)).slice(0,12);
    const r=await postJSON('/api/ia/explicar-varias', {palabras:dif.map(w=>({palabra:iaClave(w), frase:iaSinNombre(iaFraseDe(w,p))}))});
    let n=0; Object.entries(r.explicaciones||{}).forEach(([k,x])=>{ if(x && x.texto && !iaExplicacionDe(k)){ iaApuntarExplicacion(k, x.texto); n++; } }); aviso(n===1?'1 explicación preparada':n+' explicaciones preparadas'); if(actual==='ia') ir('ia','palabras');
  });
  $$('#s-ia [data-iapoir]').forEach(b=>b.onclick=()=>{ const x=iaExplicacionDe(b.dataset.iapoir); if(x) decir(x.texto); });
  $$('#s-ia [data-iapq]').forEach(b=>b.onclick=async()=>{ await iaQuitarExplicacion(b.dataset.iapq); ir('ia','palabras'); });
  $$('#s-ia [data-iaped]').forEach(b=>b.onclick=()=>{ const k=b.dataset.iaped; const x=iaExplicacionDe(k);
    const d=dialogo({titulo:'Cambiar la explicación de «'+esc(k)+'»', html:`<p class="nota" style="margin-bottom:8px">Una o dos frases cortas y un ejemplo. Es lo que le dirá la voz.</p><textarea id="iaEdTxt" rows="4" maxlength="300" style="width:100%;font:inherit;font-size:1.1rem;padding:10px;border-radius:10px;border:2px solid var(--line)">${esc(x?x.texto:'')}</textarea>`,
      botones:[{t:'Cancelar',cls:'btn'},{t:'Guardar',cls:'btn-p', mantener:true, fn:async()=>{ const t=$('#iaEdTxt',d.el).value.replace(/\s+/g,' ').trim(); if(!t) return;
        iaApuntarExplicacion(k, t, {editada:true}); if(iaEnPC()) await postJSON('/api/ia/explicaciones/guardar', {palabra:k, texto:t}).catch(()=>{}); d.cerrar(); aviso('Guardada'); ir('ia','palabras'); }}]}); });
}

/* ---------- 4 · informe de progreso ---------- */
/* datos que ya guarda el programa, resumidos y sin el nombre del niño */
function iaDatosInforme(p){
  const ms=sesDe(p.id).filter(s=>!s.incompleta), cfg=cfgDe(p);
  const r=x=>x==null||isNaN(x)?null:Math.round(x);
  const edad = p.nac ? Math.floor((Date.now()-new Date(p.nac+'T00:00:00'))/(365.25*DIA_MS)) : null;
  const preg=ms.reduce((a,s)=>a+preguntasHechas(s),0), ac=ms.reduce((a,s)=>a+(s.aciertos||0),0);
  const calc=ms.filter(s=>s.calculo), hace14=Date.now()-14*DIA_MS;
  const ultBuzon=(cfg.deseosLog||[]).filter(x=>x.q==='dificil').pop();
  return {edad, curso:p.curso||null, nivel_actual:nivelActualDe(p), desde:ms.length?claveDia(ms[0].fecha):null, hoy:claveDia(new Date()),
    lecturas_terminadas:ms.length, historias_distintas:new Set(ms.map(s=>s.historiaId)).size,
    dias_con_lectura_ultimos_14_dias:new Set(ms.filter(s=>Date.parse(s.fecha)>=hace14).map(s=>claveDia(s.fecha))).size,
    ppm_primeras_5_lecturas:r(media(ms.slice(0,5).map(s=>s.ppm||0))), ppm_ultimas_5_lecturas:r(media(ms.slice(-5).map(s=>s.ppm||0))),
    por_semana:semanas(ms,8).map(w=>({semana:w.etq, lecturas:w.ses.length, ppm:r(media(w.ses.map(s=>s.ppm||0))), comprension_pct:r(media(w.ses.map(pctComp)))})),
    comprension_a_la_primera_pct:preg?r(100*ac/preg):null, pistas_usadas:ms.reduce((a,s)=>a+(s.preguntas||[]).filter(q=>q.pista).length,0),
    calculo_a_la_primera_pct:calc.length?r(100*calc.filter(s=>s.calculo.ok).length/calc.length):null,
    escucho_la_historia_antes:ms.filter(s=>s.escuchada).length, leidas_con_un_adulto_o_la_voz:ms.filter(s=>s.juntos).length,
    palabras_dificiles:palabrasDificiles(ms).filter(x=>!IA_SENCILLAS.has(iaClave(x.p))).slice(0,15).map(x=>({palabra:x.p, veces:x.n})),
    palabras_que_ya_lee_bien:palabrasDominadas(ms).length, palabras_practicadas:Object.keys(cfg.practica||{}).length,
    dictados:(cfg.dictadoLog||[]).length, temas_elegidos:temasDe(p).map(nombreTema), le_gusta:iaGustos(p),
    dice_que_las_historias_son:ultBuzon?ultBuzon.r:null};
}
function iaInformeTarjeta(inf, p, nuevo){
  const lista=a=>(a||[]).length?`<ul style="margin:6px 0 0 20px">${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="nota">—</p>';
  return `<div class="card informe" style="margin-top:18px"><div><span class="pill">${nuevo?'Borrador del informe':'Informe guardado'} · ${esc(new Date(inf.f||Date.now()).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}))}</span><h1 style="margin-top:10px">${esc(p.nombre)}: cómo va leyendo</h1></div>
    <p style="font-size:1.08rem;line-height:1.6">${esc(conNombreDe(inf.resumen,p))}</p>
    <div class="graf-2"><div><h3>Lo que hace bien</h3>${lista(inf.bien)}</div><div><h3>En qué ayudarle</h3>${lista(inf.mejorar)}</div></div>
    <div><h3 style="margin-bottom:6px">Para practicar esta semana</h3>${(inf.practicar||[]).length?`<ol style="margin:6px 0 0 20px;display:grid;gap:8px">${inf.practicar.map(x=>`<li><b>${esc(x.que)}</b>${x.como?': '+esc(x.como):''}</li>`).join('')}</ol>`:'<p class="nota">—</p>'}</div>
    ${(inf.palabras||[]).length?`<div><h3 style="margin-bottom:6px">Palabras para practicar</h3><div class="palabras-chips">${inf.palabras.map(w=>`<span>${esc(w)}<small>${esc(silabear(w).join('-'))}</small></span>`).join('')}</div></div>`:''}
    <p class="nota">Preparado con IA a partir de los datos de LeeLEEJG. Es una ayuda para la familia, no una evaluación: comparadlo con lo que veis en casa y lo que dice su tutora.</p>
    <div class="botones no-imprimir">${nuevo?`<button class="btn btn-p" type="button" id="iaInfGuardar">${ic('check')} Guardar informe</button><button class="btn btn-rojo" type="button" id="iaInfTirar">Descartar</button>`:`<button class="btn btn-borde" type="button" id="iaInfImprimir">Imprimir o guardar en PDF</button><button class="btn btn-rojo" type="button" id="iaInfQuitar">Quitar</button>`}</div></div>`;
}
function iaInformeHTML(p){
  const guardado=(aj.iaInformes||{})[p.id]; const nuevo=iaInformeNuevo && iaInformeNuevo.lector===p.id ? iaInformeNuevo.inf : null;
  const n=sesDe(p.id).filter(s=>!s.incompleta).length;
  return `<div class="card bloque no-imprimir"><h3>Informe de progreso con IA</h3>
    <p class="nota" style="margin:6px 0 12px">La IA mira los datos que ya guarda el programa (lecturas, palabras por minuto, preguntas, palabras que le cuestan, dictados y gustos) y prepara un resumen de cómo va y qué practicar esta semana. Lo revisáis y, si os sirve, lo guardáis.</p>
    <details><summary class="nota">Qué datos se envían (sin su nombre)</summary><pre style="white-space:pre-wrap;font-size:.8rem;max-height:260px;overflow:auto">${esc(JSON.stringify(iaDatosInforme(p),null,1))}</pre></details>
    <div class="botones" style="margin-top:10px"><button class="btn btn-p btn-g" type="button" id="iaCrearInf" ${iaActiva()&&n?'':'disabled'}>${ic('bombilla')} ${guardado?'Preparar un informe nuevo':'Preparar informe'}</button></div>
    ${n?'':'<p class="vacio">Hace falta al menos una lectura terminada.</p>'}</div>
    ${nuevo?iaInformeTarjeta(nuevo,p,true):''}${!nuevo&&guardado?iaInformeTarjeta(guardado,p,false):''}`;
}
function activarIaInforme(p){
  const bc=$('#iaCrearInf'); if(bc) bc.onclick=()=>iaTrabajar(bc, 'Preparando el informe… (puede tardar un minuto)', async()=>{
    const inf=await postJSON('/api/ia/informe', {datos:iaDatosInforme(p)}); iaInformeNuevo={lector:p.id, inf}; if(actual==='ia') ir('ia','informe'); });
  const g=$('#iaInfGuardar'); if(g) g.onclick=()=>{ aj.iaInformes={...(aj.iaInformes||{}), [p.id]:iaInformeNuevo.inf}; iaInformeNuevo=null; guardarAj(); aviso('Informe guardado'); ir('ia','informe'); };
  const t=$('#iaInfTirar'); if(t) t.onclick=()=>{ iaInformeNuevo=null; ir('ia','informe'); };
  const im=$('#iaInfImprimir'); if(im) im.onclick=()=>window.print();
  const q=$('#iaInfQuitar'); if(q) q.onclick=()=>dialogo({titulo:'¿Quitar el informe guardado?', botones:[{t:'Conservar',cls:'btn'},{t:'Quitar',cls:'btn-rojo', fn:()=>{ const m={...(aj.iaInformes||{})}; delete m[p.id]; aj.iaInformes=m; guardarAj(); ir('ia','informe'); }}]});
}

/* accesos desde otras pantallas de la familia (Temas e intereses, Evolución) */
function iaEnlaceHistorias(tema){ return `<button class="btn btn-mini btn-p" type="button" data-iatema="${esc(tema)}" style="margin-top:8px">${ic('bombilla')} Crearlas con el Ayudante IA</button>`; }
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-iatema],[data-iair]'); if(!b) return;
  if(b.dataset.iatema){ iaForm={lector:lectorVisto().id, tema:b.dataset.iatema}; ir('ia','historias'); }
  else ir('ia', b.dataset.iair);
});
