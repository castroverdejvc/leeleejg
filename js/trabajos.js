/* LeeLEEJG · trabajos del cole: como las fichas que mandan en clase (unir puntos, leer y marcar números,
   relacionar dibujo y palabra, caminos con más o menos manzanas, hoy-ayer-mañana).
   Cada trabajo terminado da 1 minuto de tele (Familia › Premios y gustos lo cambia) y se apunta en cfg.trabajosLog. */
'use strict';
const TRABAJOS = [
  {id:'puntos',   emo:'✏️', nombre:'Une los puntos',      desc:'Une los números en orden y descubre el dibujo.'},
  {id:'numeros',  emo:'🔢', nombre:'Lee y marca',         desc:'Lee lo que te pido y colorea o rodea el número.'},
  {id:'relaciona',emo:'🐶', nombre:'Relaciona',           desc:'Une cada dibujo con su palabra: dentro, detrás, delante…'},
  {id:'camino',   emo:'🍎', nombre:'El camino',           desc:'Pinta de colores el camino hasta las manzanas.'},
  {id:'dias',     emo:'📅', nombre:'Hoy, ayer y mañana',  desc:'Rodea, tacha y recuadra los días de la semana.'}
];
const DIAS_SEM = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
let trab=null;   // trabajo en curso {tipo, a, e, ...}
const azarDe = a => a[Math.floor(Math.random()*a.length)];

function apuntarTrabajo(t, a, e){
  const p=perfil(); const c=cfgDe(p); c.trabajosLog=(c.trabajosLog||[]).concat([{f:new Date().toISOString(), t, a, e}]).slice(-1500); guardarAj();
  if(typeof avisarTele==='function') avisarTele(p, true);
}
const minTrabajo = () => (typeof teleCfg==='function' ? teleCfg().trabajo : 1);

/* tarjeta en Fichas (niño) */
function tarjetaTrabajosHTML(){
  return `<div class="card bloque trabajos-tarjeta"><div><b style="font-size:1.4rem">🖍️ Trabajos del cole</b><p class="nota">Como las fichas de clase.${minTrabajo()>0?` Cada trabajo terminado: +${minTxt(minTrabajo())} de tele.`:''}</p></div>
    <div class="trabajos-grid">${TRABAJOS.map(t=>`<button type="button" class="trabajo-c" data-trab="${t.id}"><span class="emo-j">${t.emo}</span><b>${esc(t.nombre)}</b><span class="nota">${esc(t.desc)}</span></button>`).join('')}</div></div>`;
}
function activarTarjetaTrabajos(raiz){ $$('[data-trab]', raiz).forEach(b=>b.onclick=()=>ir('trabajo', b.dataset.trab)); }

/* cabecera con la orden escrita (para leerla) y el altavoz */
function ordenHTML(txt){ return `<div class="orden-t"><p class="${claseTexto()}">${txt}</p><button class="ico-btn" type="button" id="oirOrden" aria-label="Escuchar">${ic('altavoz')}</button></div>`; }
const textoOrden = () => (($('#s-trabajo .orden-t p')||{}).textContent||'').trim();

definir('trabajo', {nav:'repaso', pintar(tipo){
  if(tipo) trab={tipo, a:0, e:0, fin:false};
  if(!trab || !TRABAJOS.some(t=>t.id===trab.tipo)){ ir('repaso'); return; }
  const T=TRABAJOS.find(t=>t.id===trab.tipo);
  $('#s-trabajo').innerHTML=`<div class="juego-cab"><button class="volver" type="button" data-ir="repaso">${ic('atras')} Fichas</button><h1 class="tit">${T.emo} ${esc(T.nombre)}</h1><span class="pill" id="trabMarca"></span></div><div class="card trabajo-zona" id="trabZona"></div>`;
  ({puntos:tPuntos, numeros:tNumeros, relaciona:tRelaciona, camino:tCamino, dias:tDias})[trab.tipo]($('#trabZona'));
  const o=$('#oirOrden'); if(o) o.onclick=()=>decir(textoOrden());
  marcaTrab(); setTimeout(()=>{ if(actual==='trabajo' && textoOrden()) decir(textoOrden()); }, 300);
}});
function marcaTrab(){ const m=$('#trabMarca'); if(m) m.textContent=`✓ ${trab.a} · ✗ ${trab.e}`; }
function bienT(){ trab.a++; sonido('bien'); marcaTrab(); }
function malT(el, frase){ trab.e++; sonido('mal'); sacudir(el); marcaTrab(); if(frase) decir(frase); }
function terminarTrabajo(){
  if(trab.fin) return; trab.fin=true; apuntarTrabajo(trab.tipo, trab.a, trab.e);
  const z=$('#trabZona'); confeti(z); sonido('cromo');
  const m=minTrabajo(); decir(`¡Trabajo terminado!${m>0?' Has ganado '+minTxt(m)+' de tele.':''}`);
  cartel(z, `<h2>¡Trabajo terminado! 🎉</h2><p class="nota">${trab.e?`Con ${trab.e} ${trab.e===1?'fallo':'fallos'}.`:'¡Sin ningún fallo!'}${m>0?` +${minTxt(m)} de tele.`:''}</p>`,
    [['Otro igual', ()=>ir('trabajo', trab.tipo)], ['Volver a Fichas', ()=>ir('repaso'), 'btn']]);
}

/* ============ 1 · Une los puntos ============ */
const FIGURAS_PUNTOS = [
  {n:'una casa', k:'casa', col:'#F5A300', p:[[10,90],[10,45],[24,33],[24,14],[34,14],[34,25],[50,10],[90,45],[90,90]]},
  {n:'un pez', k:'pez', col:'#1E7BF2', p:[[8,50],[28,28],[58,22],[78,38],[95,22],[95,78],[78,62],[58,78],[28,72]]},
  {n:'una estrella', k:'estrellas', col:'#F2C230', p:[[50,5],[61,37],[95,38],[68,58],[78,92],[50,72],[22,92],[32,58],[5,38],[39,37]]},
  {n:'un barco', k:'barco', col:'#E5484D', p:[[8,62],[46,62],[46,8],[82,58],[92,62],[76,88],[24,88]]},
  {n:'un árbol', k:'arbol', col:'#2FB36B', p:[[44,92],[44,64],[18,64],[32,44],[20,44],[50,8],[80,44],[68,44],[82,64],[56,64],[56,92]]},
  {n:'un cohete', k:'cohete', col:'#8B5CF6', p:[[50,4],[66,28],[66,68],[82,90],[60,80],[40,80],[18,90],[34,68],[34,28]]},
  {n:'un corazón', k:'corazon', col:'#E5484D', p:[[50,90],[14,56],[8,34],[18,16],[36,12],[50,28],[64,12],[82,16],[92,34],[86,56]]}
];
function tPuntos(z){
  const F=azarDe(FIGURAS_PUNTOS); const N=F.p.length; let sig=0, color=null;
  z.innerHTML=ordenHTML(`Une los puntos del 1 al ${N} en orden. ¿Qué dibujo sale?`)+`<div class="puntos-caja"><svg viewBox="-6 -6 112 112" class="puntos-svg"><polyline id="ptLinea" points="" fill="none" stroke="#1F2937" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    ${F.p.map(([x,y],i)=>`<g class="pt" data-i="${i}"><circle cx="${x}" cy="${y}" r="6" fill="transparent"/><circle cx="${x}" cy="${y}" r="2.3" fill="#1F2937"/><text x="${x+3.2}" y="${y-3.2}" font-size="5.5" font-weight="800" fill="#334155">${i+1}</text></g>`).join('')}</svg></div><div id="ptFin"></div>`;
  const linea=$('#ptLinea', z);
  const pinta=()=>{ const ps=F.p.slice(0,sig).map(q=>q.join(',')); if(sig===N) ps.push(F.p[0].join(',')); linea.setAttribute('points', ps.join(' ')); };
  $$('.pt', z).forEach(g=>g.addEventListener('click', ()=>{
    if(sig>=N) return; const i=+g.dataset.i;
    if(i===sig){ sig++; bienT(); g.classList.add('hecho'); pinta();
      if(sig===N){ const svg=$('.puntos-svg', z); svg.insertAdjacentHTML('afterbegin', `<polygon id="ptRelleno" points="${F.p.map(q=>q.join(',')).join(' ')}" fill="transparent"/>`);
        decir(`¡Es ${F.n}! Ahora elige un color y píntalo.`);
        $('#ptFin', z).innerHTML=`<p class="sub centro">¡Es ${esc(F.n)}! Elige un color y toca el dibujo para pintarlo.</p><div class="paleta">${['#E5484D','#F5A300','#F2C230','#2FB36B','#1E7BF2','#8B5CF6','#8B5A2B'].map(c=>`<button type="button" class="col-p" data-c="${c}" style="background:${c}" aria-label="Color"></button>`).join('')}</div><div class="botones" style="justify-content:center;margin-top:12px"><button class="btn btn-p btn-g" type="button" id="ptTermine">Terminé ${ic('check')}</button></div>`;
        $$('.col-p', z).forEach(b=>b.onclick=()=>{ color=b.dataset.c; $$('.col-p', z).forEach(x=>x.classList.toggle('sel', x===b)); });
        $('#ptRelleno', z).addEventListener('click', ()=>{ if(color){ $('#ptRelleno', z).setAttribute('fill', color); sonido('toc'); } else decir('Primero elige un color.'); });
        $('#ptTermine', z).onclick=terminarTrabajo; }
    } else malT(g, `Busca el número ${sig+1}.`);
  }));
}

/* ============ 2 · Lee y marca (colorea y rodea números) ============ */
function ordenesNumeros(){
  const p=perfil(); const out=[];
  const edad = p.nac ? Math.floor((Date.now()-new Date(p.nac+'T00:00:00'))/(365.25*86400000)) : null;
  if(edad && edad>=3 && edad<=9) out.push({t:'Colorea el número que dice tu edad y rodea la edad que tendrás el año que viene.', c:edad, r:edad+1});
  out.push({t:'Colorea el número que va después del 3 y rodea el que va antes del 3.', c:4, r:2},
    {t:'Colorea el número más grande y rodea el más pequeño.', c:10, r:1, todos:true},
    {t:'Colorea las patas que tiene un perro y rodea los ojos que tienes tú.', c:4, r:2},
    {t:'Colorea los dedos de una mano y rodea las ruedas de una bici.', c:5, r:2},
    {t:'Colorea los días que tiene una semana y rodea las patas de una gallina.', c:7, r:2},
    {t:'Colorea el número que va entre el 5 y el 7 y rodea el que va después del 8.', c:6, r:9},
    {t:'Colorea el número que es uno más que 7 y rodea el que es uno menos que 4.', c:8, r:3});
  return out;
}
function tNumeros(z){
  const O=azarDe(ordenesNumeros()); let herr='c'; const hecho={c:false, r:false}; trab.obj={c:O.c, r:O.r};
  let nums = O.todos ? [1,2,3,4,5,6,7,8,9,10] : [...new Set([O.c, O.r, ...barajar([1,2,3,4,5,6,7,8,9,10]).slice(0,5)])];
  nums=barajar(nums).slice(0,7); if(!nums.includes(O.c)) nums[0]=O.c; if(!nums.includes(O.r)) nums[1]=O.r; nums=barajar(nums);
  z.innerHTML=ordenHTML(esc(O.t))+`<div class="herram"><button type="button" class="btn herr sel" data-h="c">🖍️ Colorear</button><button type="button" class="btn herr" data-h="r">⭕ Rodear</button></div>
    <div class="nums-t">${nums.map(n=>`<button type="button" class="num-t" data-n="${n}"><span>${n}</span></button>`).join('')}</div>`;
  $$('.herr', z).forEach(b=>b.onclick=()=>{ herr=b.dataset.h; $$('.herr', z).forEach(x=>x.classList.toggle('sel', x===b)); });
  $$('.num-t', z).forEach(b=>b.onclick=()=>{
    const n=+b.dataset.n; const obj = herr==='c' ? O.c : O.r;
    if(hecho[herr]){ malT(b, herr==='c'?'Ya has coloreado. Ahora rodea.':'Ya has rodeado. Ahora colorea.'); return; }
    if(n===obj){ hecho[herr]=true; b.classList.add(herr==='c'?'coloreado':'rodeado'); bienT(); if(hecho.c && hecho.r) setTimeout(terminarTrabajo, 600); }
    else malT(b, 'Ese no es. Lee otra vez lo que te pido.');
  });
}

/* ============ 3 · Relaciona dibujo y palabra ============ */
const ESCENAS = {
  dentro:  `<rect x="18" y="52" width="64" height="38" rx="6" fill="#C8A57A"/><text x="50" y="62" font-size="34" text-anchor="middle">🐶</text><rect x="18" y="62" width="64" height="28" rx="6" fill="#B08455"/><path d="M22 70h56M22 78h56" stroke="#8A6438" stroke-width="2"/>`,
  detras:  `<text x="56" y="44" font-size="32" text-anchor="middle">🐶</text><rect x="18" y="46" width="64" height="44" rx="6" fill="#B08455"/><path d="M22 58h56M22 70h56M22 82h56" stroke="#8A6438" stroke-width="2"/>`,
  delante: `<rect x="34" y="30" width="56" height="40" rx="6" fill="#B08455"/><path d="M38 42h48M38 54h48" stroke="#8A6438" stroke-width="2"/><text x="34" y="94" font-size="36" text-anchor="middle">🐶</text>`,
  encima:  `<text x="50" y="40" font-size="32" text-anchor="middle">🐶</text><rect x="22" y="44" width="56" height="46" rx="6" fill="#B08455"/><path d="M26 58h48M26 72h48" stroke="#8A6438" stroke-width="2"/>`,
  debajo:  `<rect x="12" y="28" width="76" height="8" rx="3" fill="#8A6438"/><rect x="16" y="36" width="6" height="56" fill="#8A6438"/><rect x="78" y="36" width="6" height="56" fill="#8A6438"/><text x="50" y="88" font-size="30" text-anchor="middle">🐶</text>`,
  lado:    `<rect x="10" y="44" width="44" height="46" rx="6" fill="#B08455"/><path d="M14 58h36M14 72h36" stroke="#8A6438" stroke-width="2"/><text x="74" y="88" font-size="32" text-anchor="middle">🐶</text>`,
  cerca:   `<text x="30" y="80" font-size="42" text-anchor="middle">🏠</text><text x="62" y="86" font-size="24" text-anchor="middle">🐶</text>`,
  lejos:   `<text x="18" y="80" font-size="30" text-anchor="middle">🏠</text><text x="88" y="90" font-size="16" text-anchor="middle">🐶</text><path d="M30 92h50" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="3 3"/>`
};
const PALABRA_ESC = {dentro:'dentro', detras:'detrás', delante:'delante', encima:'encima', debajo:'debajo', lado:'al lado', cerca:'cerca', lejos:'lejos'};
const GRUPOS_REL = [['detras','dentro','delante'], ['encima','debajo','lado'], ['cerca','lejos','dentro'], ['encima','debajo','dentro'], ['delante','detras','lado']];
function tRelaciona(z){
  const g=barajar(azarDe(GRUPOS_REL)); const palabras=barajar(g); let sel=null; const unidos=new Set();
  z.innerHTML=ordenHTML('Relaciona dónde está el perro con su palabra.')+`<div class="rel-caja"><svg class="rel-lineas" id="relLineas"></svg>
    <div class="rel-fila">${g.map(k=>`<button type="button" class="rel-dib" data-k="${k}"><svg viewBox="0 0 100 100">${ESCENAS[k]}</svg><i class="rel-punto"></i></button>`).join('')}</div>
    <div class="rel-fila">${palabras.map(k=>`<button type="button" class="rel-pal" data-k="${k}"><i class="rel-punto"></i><span class="ligada-t ${claseTexto()}">${esc(PALABRA_ESC[k])}</span></button>`).join('')}</div></div>
    <p class="nota centro">Toca un dibujo y luego su palabra.</p>`;
  const caja=$('.rel-caja', z), svg=$('#relLineas', z);
  const linea=(a,b,col)=>{ const r=caja.getBoundingClientRect(), p1=$('.rel-punto',a).getBoundingClientRect(), p2=$('.rel-punto',b).getBoundingClientRect();
    svg.insertAdjacentHTML('beforeend', `<line x1="${p1.left+p1.width/2-r.left}" y1="${p1.top+p1.height/2-r.top}" x2="${p2.left+p2.width/2-r.left}" y2="${p2.top+p2.height/2-r.top}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`); return svg.lastElementChild; };
  $$('.rel-dib', z).forEach(b=>b.onclick=()=>{ if(unidos.has(b.dataset.k)) return; sel=b; $$('.rel-dib', z).forEach(x=>x.classList.toggle('sel', x===b)); sonido('toc'); });
  $$('.rel-pal', z).forEach(b=>b.onclick=()=>{
    if(!sel){ decir('Primero toca un dibujo.'); return; } if(b.classList.contains('unida')) return;
    if(sel.dataset.k===b.dataset.k){ linea(sel,b,'#1E7BF2'); unidos.add(sel.dataset.k); sel.classList.add('unida'); b.classList.add('unida'); sel.classList.remove('sel'); decir(PALABRA_ESC[b.dataset.k]); sel=null; bienT();
      if(unidos.size===g.length) setTimeout(terminarTrabajo, 700); }
    else { const l=linea(sel,b,'#E5484D'); setTimeout(()=>l.remove(), 700); malT(b, 'Mira bien dónde está el perro.'); }
  });
}

/* ============ 4 · El camino de las manzanas ============ */
function tCamino(z){
  const cuentas=barajar([2,5,8]); const mas=cuentas.indexOf(8), menos=cuentas.indexOf(2);
  const ord=[0,1,2];   // cada camino llega a un árbol (arriba, medio, abajo); lo que cambia son las manzanas
  const finY=[18,50,82];
  const caminos=['M14 46 C 26 8, 44 44, 58 22 S 76 10, 86 18', 'M14 50 C 30 66, 46 34, 62 56 S 78 46, 86 50', 'M14 54 C 24 92, 42 60, 58 84 S 76 90, 86 82'];
  const PM=[[-4,-4],[4,2],[4,-5],[-4,3],[0,-1],[0,6],[-7,-1],[7,-1]];   // sitios de las manzanas (separadas para poder contarlas)
  const arbol=(y,n)=>`<g transform="translate(92 ${y})"><rect x="-1.8" y="3" width="3.6" height="9" fill="#8A6438"/><circle r="10" fill="#2FB36B"/>${PM.slice(0,n).map(([x,yy])=>`<circle cx="${x}" cy="${yy}" r="1.6" fill="#E5484D" stroke="#fff" stroke-width=".4"/>`).join('')}</g>`;
  let color=null; const hecho={azul:false, verde:false}; trab.obj={azul:ord.indexOf(mas), verde:ord.indexOf(menos)};
  z.innerHTML=ordenHTML('Pinta de AZUL el camino para ir donde hay MUCHAS manzanas y de VERDE donde hay POCAS.')+`<div class="herram"><button type="button" class="btn herr col-azul" data-c="azul">🔵 Azul</button><button type="button" class="btn herr col-verde" data-c="verde">🟢 Verde</button></div>
    <div class="camino-caja"><svg viewBox="0 0 104 100" class="camino-svg">
      ${caminos.map((d,i)=>`<path class="cam" data-i="${i}" d="${d}" fill="none" stroke="#CBD5E1" stroke-width="3.2" stroke-linecap="round"/><path class="cam-hit" data-i="${i}" d="${d}" fill="none" stroke="transparent" stroke-width="10"/>`).join('')}
      <text x="8" y="56" font-size="12" text-anchor="middle">🧒</text>
      ${finY.map((y,j)=>arbol(y, cuentas[j])).join('')}</svg></div>`;
  $$('.herr', z).forEach(b=>b.onclick=()=>{ color=b.dataset.c; $$('.herr', z).forEach(x=>x.classList.toggle('sel', x===b)); });
  $$('.cam-hit', z).forEach(h=>h.addEventListener('click', ()=>{
    const i=+h.dataset.i, dest=ord[i], cam=$(`.cam[data-i="${i}"]`, z);
    if(!color){ decir('Primero elige un color: azul o verde.'); return; }
    if(hecho[color]){ malT(cam, `Ya has pintado el camino ${color}.`); return; }
    const bien = (color==='azul' && dest===mas) || (color==='verde' && dest===menos);
    if(bien){ hecho[color]=true; cam.setAttribute('stroke', color==='azul'?'#1E7BF2':'#2FB36B'); cam.setAttribute('stroke-width','4'); bienT(); if(hecho.azul && hecho.verde) setTimeout(terminarTrabajo, 600); }
    else { cam.setAttribute('stroke', '#FCA5A5'); setTimeout(()=>cam.setAttribute('stroke','#CBD5E1'), 700); malT(cam, color==='azul'?'Ese camino no va donde hay muchas manzanas. Cuéntalas.':'Ese camino no va donde hay pocas manzanas. Cuéntalas.'); }
  }));
}

/* ============ 5 · Hoy, ayer y mañana ============ */
function tDias(z){
  const hoy=(new Date().getDay()+6)%7;   // 0 = lunes
  const vars=[
    {t:'Rodea el día de hoy, tacha el día de ayer y recuadra el día que será mañana.', o:{rodear:hoy, tachar:(hoy+6)%7, recuadrar:(hoy+1)%7}},
    {t:'Rodea el primer día de la semana, tacha el último y recuadra el que va después del miércoles.', o:{rodear:0, tachar:6, recuadrar:3}},
    {t:'Rodea el día de hoy, tacha el día de pasado mañana y recuadra el día de antes de ayer.', o:{rodear:hoy, tachar:(hoy+2)%7, recuadrar:(hoy+5)%7}}
  ];
  const V = (cfgDe(perfil()).trabajosLog||[]).filter(x=>x.t==='dias').length<2 ? vars[0] : azarDe(vars);
  let herr='rodear'; const hecho={}; trab.obj=V.o;
  z.innerHTML=ordenHTML(esc(V.t))+`<div class="herram"><button type="button" class="btn herr sel" data-h="rodear">⭕ Rodear</button><button type="button" class="btn herr" data-h="tachar">❌ Tachar</button><button type="button" class="btn herr" data-h="recuadrar">⬜ Recuadrar</button></div>
    <div class="dias-t">${DIAS_SEM.map((d,i)=>`<button type="button" class="dia-t ${claseTexto()}" data-i="${i}">${d.toUpperCase()}</button>`).join('')}</div>`;
  $$('.herr', z).forEach(b=>b.onclick=()=>{ herr=b.dataset.h; $$('.herr', z).forEach(x=>x.classList.toggle('sel', x===b)); });
  $$('.dia-t', z).forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i;
    if(hecho[herr]){ malT(b, 'Eso ya está hecho. Cambia de lápiz.'); return; }
    if(i===V.o[herr]){ hecho[herr]=true; b.classList.add(herr); bienT(); decir(DIAS_SEM[i]); if(Object.keys(hecho).length===3) setTimeout(terminarTrabajo, 700); }
    else malT(b, 'Ese no es. Piensa qué día es hoy.');
  });
}

/* ---------- familia: resumen de los trabajos ---------- */
function trabajosAdultoHTML(p){
  const log=cfgDe(p).trabajosLog||[]; if(!log.length) return '';
  const desde=lunesDe ? lunesDe() : new Date(0);
  const filas=TRABAJOS.map(t=>{ const ps=log.filter(x=>x.t===t.id); if(!ps.length) return ''; const sem=ps.filter(x=>new Date(x.f)>=desde).length;
    const A=ps.reduce((s,x)=>s+(x.a||0),0), E=ps.reduce((s,x)=>s+(x.e||0),0); const pct=A+E?Math.round(100*A/(A+E)):null;
    return `<tr><td>${t.emo} ${esc(t.nombre)}</td><td>${ps.length}</td><td>${sem}</td><td>${pct==null?'–':pct+' %'}</td></tr>`; }).join('');
  return `<div class="card bloque" style="margin-top:18px"><h3 style="margin-bottom:6px">🖍️ Trabajos del cole · ${esc(p.nombre)}</h3><p class="nota" style="margin-bottom:8px">Cada trabajo terminado da ${minTxt(minTrabajo())} de tele (se cambia en Premios y gustos).</p>
    <table><thead><tr><th>Trabajo</th><th>Hechos</th><th>Esta semana</th><th>% acierto</th></tr></thead><tbody>${filas}</tbody></table></div>`;
}
