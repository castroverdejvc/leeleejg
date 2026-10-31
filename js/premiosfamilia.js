/* LeeLEEJG · Familia › Premios (31/10/2026). Decidido por la familia:
   - Un solo sitio para los premios: qué se gana, cómo, el límite y lo que hay por dar, y se cambia todo desde aquí.
   - Premios nuevos de la familia («cada N ⭐» acumuladas, con máximo por semana si se quiere).
   - «Qué da cada tarea»: las estrellas y los minutos de tele de cada cosa, y para qué premios cuenta.
   - Cada cambio cuenta desde el día en que se hace; lo ganado antes se queda (guardarPremios, premiosCfg(fecha)). */
'use strict';
const PF_ICONOS = ['🎁','🍦','🍫','🧸','⚽','🎨','🎮','🎬','🍕','🏊','🚲','🎡','📚','🦖','⭐','🏆'];
/* un desplegable que guarda una regla (data-pk) */
function pfSel(k, vals, fmt, v){
  const cur=v===undefined ? premiosCfg()[k] : v; const lista=vals.slice(); if(cur!=null && !lista.some(x=>+x===+cur)) lista.push(+cur);
  lista.sort((a,b)=>a===0?-1:b===0?1:a-b);
  return `<select data-pk="${k}" aria-label="${esc(k)}">${lista.map(x=>`<option value="${x}" ${+x===+cur?'selected':''}>${esc(fmt(x))}</option>`).join('')}</select>`;
}
const pfMin = x => x ? (x===0.5?'30 segundos':x===1?'1 minuto':x<60?x+' minutos':x%60?`${Math.floor(x/60)} h ${x%60} min`:`${x/60} ${x===60?'hora':'horas'}`) : 'Nada';
const pfEst = x => x ? x+' ⭐' : 'Nada';
const pfSw = (k, v, txt) => `<span class="interruptor pf-sw"><span>${txt}</span><button type="button" class="switch" data-pkb="${k}" role="switch" aria-checked="${!!v}"></button></span>`;

function premiosFamiliaHTML(p){
  const c=premiosCfg(), t=teleDe(p), pe=peliculaDe(p), ps=peliSabadoDe(p), m=movilDe(p), s=sobresDe(p), r=revistasDe(p), cj=cajasHitos(p);
  const sd=sobreDelDia(p), semS=sd.semana||{n:0,tope:0};
  const fila=(emo, nombre, como, limite, estado, extra='')=>`<div class="pf-fila"><div class="pf-nom"><span class="emo-g">${emo}</span><b>${nombre}</b></div>
    <div class="pf-como"><span class="pf-et">Cómo se gana</span>${como}</div><div class="pf-lim"><span class="pf-et">Límite</span>${limite||'—'}</div><div class="pf-est"><span class="pf-et">Ahora</span>${estado}</div>${extra}</div>`;
  const dar=(id, txt)=>`<button type="button" class="btn btn-mini btn-p" id="${id}">${txt}</button>`;
  const filas=[];
  filas.push(fila('📺','Tele del fin de semana', 'Minutos por cada tarea (abajo, en «Qué da cada tarea»). Se gana de sábado a viernes y se ve el fin de semana siguiente.',
    `Al día ${pfSel('teleMaxDia',[0,60,90,120,150,180],x=>x?pfMin(x):'Sin límite')}<br>Por fin de semana ${pfSel('teleMaxSemana',[0,120,180,240,300],x=>x?pfMin(x):'Sin límite')}`,
    `${t.finde?'Para este fin de semana':'Lleva'} <b>${minTxt(t.ganados)}</b>; le quedan ${minTxt(t.saldo)}.`));
  filas.push(fila('🎬','Peli del viernes', 'Leer la historia del día los 7 días (de sábado a viernes).', '1 a la semana',
    pe.completa?(pe.vista?'Ya vista esta semana.':'<b>Desbloqueada.</b>'):`${pe.hechos} de ${pe.total}.`));
  filas.push(fila('🍿','Peli del sábado', `${pfSel('peliExtras',[3,4,5,6,7,8,9,10,12],x=>x+' lecturas extra')} en la semana.`, '1 a la semana',
    ps.completa?(ps.vista?'Ya vista esta semana.':'<b>Desbloqueada.</b>'):`${ps.hechas} de ${ps.total}.`));
  filas.push(fila('📱','Móvil del fin de semana', `1 minuto cada ${pfSel('movilCada',[1,2,3,4,5],pfEst)} de la semana, y los juegos de pensar (abajo).`,
    `${pfSel('movilMax',[0,15,20,30,45,60],x=>x?pfMin(x):'Sin móvil')} por fin de semana`, `${minTxt(m.ganados)} de ${minTxt(m.max)}${m.jugados?`; ha jugado ${minTxt(m.jugados)}`:''}.`));
  filas.push(fila('🎴','Sobre de cartas', `La historia del día y ${pfSel('sobreDia',[0,2,3,4,5,6],x=>x?x+' lecturas extra':'sin sobre del día')} el mismo día.<br>${pfSw('sorpresa', c.sorpresa, 'Días sorpresa (1 o 2 por semana)')} con ${pfSel('sorpresaExtras',[1,2,3],x=>x+(x===1?' extra':' extras'))}`,
    `${pfSel('sobresSemana',[0,1,2,3,4,5,7],x=>x?x+' por semana':'Sin límite')}`,
    s.activo?`Esta semana: <b>${semS.n}${semS.tope?' de '+semS.tope:''}</b>. Ganados ${s.ganados}, dados ${s.dados}.${s.pend?` <b class="pf-pend">${s.pend} por dar</b>`:''}`:'Apagado.',
    s.pend?`<div class="pf-dar">${dar('pfSobre','Ya le he dado 1 sobre')}${s.pend>1?dar('pfSobreTodos',`Ya le he dado los ${s.pend}`):''}</div>`:''));
  filas.push(fila('📰','Revistas', `La 1.ª con ${pfSel('revista1',[0,30,40,45,50,60],x=>x?x+' ⭐':'sin revistas')} de la semana y la 2.ª con ${pfSel('revista2',[0,60,70,75,80,90,100],x=>x?x+' ⭐':'solo una')}.`,
    (+c.revista2>0?2:+c.revista1>0?1:0)+' por semana',
    r.activo?`Esta semana lleva ${r.sem?r.sem.est:0} ⭐ (${r.sem?r.sem.n:0} ${r.sem&&r.sem.n===1?'revista':'revistas'}). Ganadas ${r.ganadas}, dadas ${r.dadas}.${r.pend?` <b class="pf-pend">${r.pend} por dar</b>`:''}`:'Apagado.',
    r.pend?`<div class="pf-dar">${dar('pfRevista','Ya le he dado 1 revista')}</div>`:''));
  const cajaPend = cj.pend ? cj.ganados[cj.dadas] : null;
  filas.push(fila('🎁','Cofre del tesoro (cajas)', `Caja pequeña de Pokémon cada ${pfSel('cajaPeq',[0,300,400,500,600,750],x=>x?x+' ⭐':'nunca')} acumuladas.<br>Caja grande (One Piece o Pokémon) cada ${pfSel('cajaGrande',[0,800,1000,1200,1500,2000],x=>x?x+' ⭐':'nunca')}.<br>El niño la ve cuando falta el ${pfSel('cajaVerPct',[0,10,20,30,50],x=>x===0?'— (siempre la ve)':x+' %')}.`,
    'Por estrellas',
    `Lleva ${cj.est} ⭐.${cj.sig?` Próxima: ${esc(nombreCaja(cj.sig.tipo).replace(/^una /,''))} a los ${cj.sig.v} ⭐ (faltan ${cj.sig.v-cj.est}; ${cj.ver?'<b>ya la ve</b>':'todavía no la ve'}).`:''}${cj.pend?` <b class="pf-pend">${cj.pend} por dar</b>`:''}`,
    cajaPend?`<div class="pf-dar">${cajaPend.tipo==='grande'?dar('pfCajaOP','Ya le he dado la caja: One Piece')+dar('pfCajaPK','Ya le he dado la caja: Pokémon'):dar('pfCajaPK','Ya le he dado la caja')}</div>`:''));
  filas.push(fila('🐾','Muñeco (en el programa)', `Cada ${pfSel('estCriatura',[5,6,8,10,12],pfEst)}.`, 'Por estrellas', `${criaturasDe(p).length} muñecos; el próximo, en ${progresoCada(p,'estCriatura').falta} ⭐.`));
  filas.push(fila('🎮','Juego nuevo (en el programa)', `Cada ${pfSel('estJuego',[15,20,30,40,50],pfEst)}. Se juega cuando acaba lo de hoy.`, `${pfSel('minutos',[0,5,10,15,20,30,45,60],x=>x?x+' min al día':'Sin límite de tiempo')}`, `${juegosAbiertos(p)} de ${typeof JUEGOS!=='undefined'?JUEGOS.length:'?'} juegos abiertos.`));
  // premios nuevos de la familia
  const nv=nuevosDe(p), lista=premiosNuevos();
  lista.forEach((x,i)=>{ const e=nv.find(y=>y.id===x.id)||{ganados:0,dados:0,pend:0,falta:null};
    filas.push(`<div class="pf-fila pf-nuevo${x.activo===false?' apagado':''}"><div class="pf-nom"><select data-nv="${i}" data-campo="emo" class="pf-emo" aria-label="Dibujo">${PF_ICONOS.concat(PF_ICONOS.includes(x.emo)?[]:[x.emo||'🎁']).map(z=>`<option ${z===x.emo?'selected':''}>${z}</option>`).join('')}</select><input data-nv="${i}" data-campo="nombre" value="${esc(x.nombre||'')}" maxlength="40" placeholder="Ej.: un helado" aria-label="Nombre del premio"></div>
      <div class="pf-como"><span class="pf-et">Cómo se gana</span>Cada <input type="number" min="1" max="5000" data-nv="${i}" data-campo="cada" value="${+x.cada||100}" style="width:90px"> ⭐ acumuladas.<br>Se ve: <select data-nv="${i}" data-campo="ver"><option value="siempre" ${x.ver!=='cerca'?'selected':''}>siempre</option><option value="cerca" ${x.ver==='cerca'?'selected':''}>cuando falte el ${pctCerca()} %</option></select></div>
      <div class="pf-lim"><span class="pf-et">Límite</span><select data-nv="${i}" data-campo="maxSemana">${[0,1,2,3,4,5,7].map(z=>`<option value="${z}" ${+x.maxSemana===z?'selected':''}>${z?z+' por semana':'Sin límite'}</option>`).join('')}</select></div>
      <div class="pf-est"><span class="pf-et">Ahora</span>${x.activo===false?'Apagado.':`Ganados ${e.ganados}, dados ${e.dados}.${e.falta!=null?` El próximo, en ${e.falta} ⭐.`:''}`}${e.pend?` <b class="pf-pend">${e.pend} por dar</b>`:''}</div>
      <div class="pf-dar">${e.pend?`<button type="button" class="btn btn-mini btn-p" data-nvdar="${esc(x.id)}">Ya se lo he dado</button>`:''}${pfSw('', x.activo!==false, 'Encendido').replace('data-pkb=""', `data-nvsw="${i}"`)}<button type="button" class="btn btn-mini" data-nvdel="${i}">Quitar</button></div></div>`); });
  return `<div class="card bloque pf" style="margin-bottom:18px"><h3 style="margin-bottom:6px">🏆 Premios</h3>
    <p class="nota" style="margin-bottom:10px">Todos los premios de ${esc(p.nombre)}: cómo se gana cada uno, el límite y lo que hay por dar. <b>Cada cambio cuenta desde hoy</b>; lo que ya ganó con las reglas de antes se queda. Las semanas van de sábado a viernes.</p>
    <div class="pf-lista">${filas.join('')}</div>
    <div class="botones" style="margin-top:12px"><button type="button" class="btn btn-mini btn-verde" id="pfNuevo">➕ Crear un premio</button></div></div>`;
}

function tareasFamiliaHTML(p){
  const c=premiosCfg();
  const fila=(emo, tarea, est, tele, cuenta)=>`<tr><td>${emo} ${tarea}</td><td>${est}</td><td>${tele}</td><td class="pf-cuenta">${cuenta}</td></tr>`;
  const e5=[0,1,2,3,4,5];
  const racha = typeof RACHA_DIAS!=='undefined' ? fila('🔥', `Leer ${RACHA_DIAS} días seguidos`, `${RACHA_ESTRELLAS} ⭐`, '—', '⭐') : '';
  return `<div class="card bloque pf" style="margin-bottom:18px"><h3 style="margin-bottom:6px">✅ Qué da cada tarea</h3>
    <p class="nota" style="margin-bottom:10px">Lo marca el programa solo. Las estrellas cuentan para los premios por estrellas (muñecos, juegos, móvil, revistas, cofre y los premios nuevos). <b>Los cambios cuentan desde hoy.</b></p>
    <div class="pf-tabla"><table><thead><tr><th>Tarea</th><th>⭐ Estrellas</th><th>📺 Tele</th><th>Cuenta también para</th></tr></thead><tbody>
    ${fila('📖','Lectura del día (la 1.ª vez)', pfSel('eDia',e5,pfEst), pfSel('tDia',[0,5,10,15,20,30],pfMin), '🎬 Peli del viernes · 🎴 Sobre del día · 🎯 Objetivos')}
    ${fila('📚','Lectura extra nueva', pfSel('eExtra',e5,pfEst), pfSel('tExtra',[0,5,10,15,20,30],pfMin), '🍿 Peli del sábado · 🎴 Sobre del día · 🎯 Objetivos')}
    ${fila('🆕','Historia nueva de sus temas', pfSel('eNueva',e5,pfEst), 'Como «Volver a leer»', '🎯 Objetivos («días leyendo»)')}
    ${fila('🔁','Volver a leer', pfSel('eRelee',e5,pfEst), pfSel('tRelee',[0,2,5,10],pfMin), '')}
    ${fila('✏️','Ficha, dictado, «As letras», caligrafía, Spell it!, palabras del día', `${pfSel('eFicha',e5,pfEst)}<br><span class="nota">con 80 % bien:</span> ${pfSel('eFichaBien',e5,pfEst)}`, `hasta ${pfSel('tFicha',[0,2,5,10],pfMin)}`, '🎯 Objetivos (fichas)')}
    ${fila('🖍️','Trabajo del cole', 'Como las fichas', pfSel('tTrabajo',[0,1,2,3,5],pfMin), '🎯 Objetivos (fichas)')}
    ${fila('🎁','Sorpresas de hoy y Practicar', 'Como las fichas', pfSel('tMini',[0,1,2,3],pfMin), '🎯 Objetivos (fichas)')}
    ${fila('🧩','Aprender jugando (cada ronda)', `⭐ (⭐⭐ si casi todo bien), como mucho ${pfSel('eduMax',[0,2,4,6,8],x=>x?x+' ⭐ al día':'no dan ⭐')}`, '—', '🎯 Objetivos (fichas)')}
    ${fila('🧠','Juego de pensar (3 partidas con premio por juego y día)', `${pfSel('eJuegoOro',[0,1,2,3],pfEst)} con oro`, `hasta ${pfSel('tJuego',[0,0.5,1,2],pfMin)}<br><span class="nota">📱 móvil hasta</span> ${pfSel('movilJuego',[0,0.5,1,2],pfMin)}`, 'Según la medalla')}
    ${fila('🎯','Cumplir todos los objetivos de la semana', pfSel('eObjetivos',[0,5,10,15,20],pfEst), '—', '')}
    ${racha}
    </tbody></table></div>
    <div class="fam-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:12px">
      <div class="campo"><label>Cada pregunta fallada resta a la tele</label>${pfSel('restaFallo',[0,0.5,1],pfMin)}</div></div></div>`;
}

function activarPremiosFamilia(p){
  const raiz=document.querySelector('#s-cfgpremios:not([hidden])')||$('#s-evolucion')||document;
  const volver=(txt='Guardado. Cuenta desde hoy.')=>{ const y=window.scrollY; aviso(txt); irPremiosFam(); setTimeout(()=>window.scrollTo(0,y), 30); };
  $$('[data-pk]', raiz).forEach(e=>e.onchange=()=>{ guardarPremios({[e.dataset.pk]: +e.value}); volver(); });
  $$('[data-pkb]', raiz).forEach(b=>b.onclick=()=>{ const v=b.getAttribute('aria-checked')!=='true'; guardarPremios({[b.dataset.pkb]: v}); volver(); });
  // premios nuevos
  const leer=()=>premiosNuevos().map(x=>({...x}));
  const guardaN=(l, txt)=>{ guardarPremios({nuevos:l}); volver(txt); };
  const nb=$('#pfNuevo'); if(nb) nb.onclick=()=>{ const l=leer(); l.push({id:'n'+Date.now().toString(36), emo:'🎁', nombre:'', cada:100, maxSemana:0, ver:'siempre', activo:true}); guardaN(l, 'Premio creado: ponle nombre'); };
  $$('[data-nv]', raiz).forEach(e=>e.onchange=()=>{ const l=leer(), i=+e.dataset.nv, k=e.dataset.campo; if(!l[i]) return;
    l[i][k] = k==='cada' ? Math.max(1, Math.min(5000, Math.round(+e.value||1))) : k==='maxSemana' ? +e.value||0 : String(e.value).trim().slice(0,40); guardaN(l); });
  $$('[data-nvsw]', raiz).forEach(b=>b.onclick=()=>{ const l=leer(), i=+b.dataset.nvsw; if(!l[i]) return; l[i].activo = l[i].activo===false; guardaN(l, l[i].activo?'Encendido':'Apagado'); });
  $$('[data-nvdel]', raiz).forEach(b=>b.onclick=()=>{ const l=leer(), i=+b.dataset.nvdel; if(!l[i]) return; const x=nuevosDe(p).find(y=>y.id===l[i].id);
    const d=dialogo({titulo:'¿Quitar este premio?', html:`<p class="nota">«${esc(l[i].nombre||'Premio')}» deja de salir.${x&&x.pend?` <b>Tiene ${x.pend} por dar</b>: si lo quitas, se pierden.`:''} Si solo quieres pararlo un tiempo, mejor apágalo.</p>`,
      botones:[{t:'Quitar', cls:'btn-p', fn:()=>{ l.splice(i,1); guardaN(l, 'Quitado'); }}, {t:'Cancelar', cls:'btn'}]}); });
  $$('[data-nvdar]', raiz).forEach(b=>b.onclick=()=>{ darNuevo(p, b.dataset.nvdar, 1); volver('Apuntado'); });
  // lo que hay por dar
  const on=(id, fn)=>{ const b=$('#'+id); if(b) b.onclick=fn; };
  on('pfSobre', ()=>{ darSobres(p, 1); volver('Apuntado'); });
  on('pfSobreTodos', ()=>{ darSobres(p, sobresDe(p).pend); volver('Apuntados'); });
  on('pfRevista', ()=>{ const cf=cfgDe(p); cf.revistasLog=(cf.revistasLog||[]).concat([{f:new Date().toISOString()}]).slice(-500); guardarAj(); volver('Apuntado'); });
  const caja=cual=>{ const cj=cajasHitos(p), t=cj.ganados[cj.dadas]; if(!t) return; const cf=cfgDe(p); cf.cajasLog=(cf.cajasLog||[]).concat([{f:new Date().toISOString(), tipo:t.tipo, v:t.v, cual}]).slice(-200); guardarAj(); volver('Apuntado'); };
  on('pfCajaOP', ()=>caja('One Piece')); on('pfCajaPK', ()=>caja('Pokémon'));
}

/* ---------- 31/10/2026: Configuración › Premios (la familia lo buscaba en Configuración) ---------- */
let tabCfgPremios='tareas';
/* volver a pintar la pantalla de premios en la que se esté */
function irPremiosFam(){ if(actual==='cfgpremios') ir('cfgpremios'); else ir('evolucion','premios'); }
definir('cfgpremios', {zona:'adulto', pintar(tab){
  if(tab) tabCfgPremios=tab; const p=lectorVisto();
  const TABS=[['tareas','✅ Lo que da cada lectura y actividad'],['premios','🏆 Premios y límites'],['tele','📺 Tele y objetivos']];
  const cuerpo = tabCfgPremios==='premios' ? premiosFamiliaHTML(p)
    : tabCfgPremios==='tele' ? teleAdultoHTML(p, true) + (typeof metasAdultoHTML==='function' ? metasAdultoHTML(p, true) : '')
    : tareasFamiliaHTML(p);
  $('#s-cfgpremios').innerHTML = `<div class="pag-cab"><div><h1>Premios</h1><p class="sub">Subid o bajad lo que da cada lectura y actividad, los premios y sus límites. Cada cambio cuenta desde hoy; lo ya ganado se queda.</p></div>${selLector('cfgpremios')}</div>
    <div class="tabs" role="tablist">${TABS.map(([k,t])=>`<button type="button" role="tab" data-tabp="${k}" aria-selected="${k===tabCfgPremios}">${t}</button>`).join('')}</div>${cuerpo}`;
  $$('#s-cfgpremios [data-tabp]').forEach(b=>b.onclick=()=>ir('cfgpremios', b.dataset.tabp));
  if(tabCfgPremios==='tele'){ activarTeleAdulto(p); if(typeof activarMetasAdulto==='function') activarMetasAdulto(p); }
  else activarPremiosFamilia(p);
}});
