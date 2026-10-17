/* LeeLEEJG · dictado: el programa dice una palabra y el niño dice cómo se escribe (letra a letra) o toca las letras */
'use strict';
const ABC = {es:'abcdefghijklmnñopqrstuvwxyz', gl:'abcdefghijklmnñopqrstuvwxyz', en:'abcdefghijklmnopqrstuvwxyz'};
/* cómo dice el programa cada letra al corregir */
const NOMBRE_LETRA = {
  es:{a:'a',b:'be',c:'ce',d:'de',e:'e',f:'efe',g:'ge',h:'hache',i:'i',j:'jota',k:'ka',l:'ele',m:'eme',n:'ene','ñ':'eñe',o:'o',p:'pe',q:'cu',r:'erre',s:'ese',t:'te',u:'u',v:'uve',w:'uve doble',x:'equis',y:'i griega',z:'zeta'},
  gl:{a:'a',b:'be',c:'ce',d:'de',e:'e',f:'efe',g:'gue',h:'hache',i:'i',j:'jota',k:'ka',l:'ele',m:'eme',n:'ene','ñ':'eñe',o:'o',p:'pe',q:'que',r:'erre',s:'ese',t:'te',u:'u',v:'uve',w:'uve dobre',x:'xe',y:'i grego',z:'zeta'},
  en:{a:'ay',b:'bee',c:'see',d:'dee',e:'ee',f:'eff',g:'gee',h:'aitch',i:'eye',j:'jay',k:'kay',l:'el',m:'em',n:'en',o:'oh',p:'pee',q:'cue',r:'ar',s:'ess',t:'tee',u:'you',v:'vee',w:'double you',x:'ex',y:'why',z:'zed'}
};
/* lo que puede decir el niño → letra */
const LETRA_DE = {
  es:{a:'a',be:'b',ce:'c',de:'d',e:'e',efe:'f',ge:'g',hache:'h',i:'i',jota:'j',ka:'k',ele:'l',eme:'m',ene:'n','eñe':'ñ','eñ':'ñ','ñ':'ñ',o:'o',pe:'p',cu:'q',erre:'r',ere:'r',ese:'s',te:'t',u:'u',uve:'v',equis:'x',ye:'y',zeta:'z',ceta:'z',che:'ch',elle:'ll'},
  gl:{a:'a',be:'b',ce:'c',de:'d',e:'e',efe:'f',ge:'g',gue:'g',hache:'h',i:'i',jota:'j',ka:'k',ele:'l',eme:'m',ene:'n','eñe':'ñ','eñ':'ñ','ñ':'ñ',o:'o',pe:'p',cu:'q',que:'q',erre:'r',ere:'r',ese:'s',te:'t',u:'u',uve:'v',xe:'x',xis:'x',equis:'x',ye:'y',zeta:'z',ceta:'z'},
  en:{ay:'a',hey:'a',bee:'b',be:'b',see:'c',sea:'c',dee:'d',ee:'e',eff:'f',ef:'f',gee:'g',aitch:'h',eye:'i',jay:'j',kay:'k',el:'l',ell:'l',em:'m',en:'n',oh:'o',owe:'o',pee:'p',pea:'p',cue:'q',queue:'q',are:'r',ar:'r',ess:'s',tee:'t',tea:'t',you:'u',vee:'v',ex:'x',why:'y',zed:'z',zee:'z'}
};
const EXTRA_OIDO = {es:['doble','griega','tilde','alta','baja'], gl:['dobre','grego','grega','til'], en:['double']};
const sinTilde = s => String(s).toLowerCase().replace(/ñ/g,'\u0001').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\u0001/g,'ñ').replace(/[^a-zñ]/g,'');
/* texto oído → lista de letras */
function letrasOidas(texto, l){
  const m=LETRA_DE[l]||LETRA_DE.es, abc=ABC[l]||ABC.es, out=[];
  const tk=String(texto).toLowerCase().replace(/[^\p{L}\s]/gu,' ').split(/\s+/).filter(Boolean);
  for(let i=0;i<tk.length;i++){
    const t=tk[i], n=tk[i+1]||'';
    if(l==='en'){
      if(t==='double' && (n==='you'||n==='u')){ out.push('w'); i++; continue; }
      if(t==='double') continue;
    } else {
      if((t==='uve'||t==='doble'||t==='dobre'||t==='ve') && (n==='doble'||n==='dobre'||n==='uve'||n==='ve')){ out.push('w'); i++; continue; }
      if(t==='i' && /^grieg|^greg|^grego/.test(n)){ out.push('y'); i++; continue; }
      if(/^grieg|^greg/.test(t)){ if(out[out.length-1]==='i') out[out.length-1]='y'; else out.push('y'); continue; }
      if(t==='tilde'||t==='til'){ const u=out[out.length-1]; const con={a:'á',e:'é',i:'í',o:'ó',u:'ú'}; if(con[u]) out[out.length-1]=con[u]; continue; }
      if(['alta','baja','doble','dobre','con'].includes(t)) continue;
    }
    let x=m[t];
    if(!x && t.length===1 && abc.includes(t)) x=t;           // el reconocedor a veces escribe la letra tal cual
    if(!x && t.length===2 && /^[a-z]$/.test(t[0]) && l==='en' && 'bcdgptvz'.includes(t[0]) && t[1]==='e') x=t[0];
    if(x) out.push(...(x.length===2 ? x.split('') : [x]));
  }
  return out;
}

/* ---------- de dónde salen las palabras ---------- */
function fuentesDictado(){
  const f=temasDe(perfil()).map(t=>({id:'tema:'+t, titulo:nombreTema(t), idioma:'es', tema:t}));
  f.push({id:'lecturas', titulo:f.length?'Todas mis historias':'Palabras de mis historias', idioma:'es'});
  FICHAS.filter(x=>x.activa!==false).forEach(x=>{ if(palabrasDeFicha(x).length) f.push({id:x.id, titulo:x.titulo, idioma:x.idioma||'es', ficha:x}); });
  return f;
}
const palabraSimple = w => /^[\p{L}]+$/u.test(w) && w.length>=2 && w.length<=12;
function palabrasDeFicha(f){ return (f.palabras||[]).filter(p=>palabraSimple(String(p.t||'').trim())).map(p=>({w:String(p.t).trim().toLowerCase(), img:p.img||null, es:p.es||''})); }
function palabrasDeLecturas(tema){
  const niv=nivelActualDe(); const lim=[[3,5],[3,6],[4,8],[4,10],[4,11]][Math.max(0,Math.min(4,niv-1))];
  const T=tema && temaDe(tema); const delTema=h=>!T || T.mundos.includes(h.mundo);
  let hs = [...new Set(misSes().slice().reverse().map(s=>s.historiaId))].map(historia).filter(h=>h && delTema(h)).slice(0,10);
  if(!hs.length) hs = T ? historiasTema(tema).filter(h=>h.nivel<=niv).slice(0,10) : [historiaDeHoy()];
  const vistas=new Map();
  hs.forEach(h=>h.lineas.forEach(li=>{ for(const m of li.matchAll(/\[([^|\]]+)\|([^\]]+)\]/g)){ const w=m[1].toLowerCase().trim(); if(palabraSimple(w) && w.length>=lim[0] && w.length<=lim[1] && !vistas.has(w)) vistas.set(w, {w, img:m[2]}); } }));
  if(vistas.size<6) (T ? historiasTema(tema).filter(h=>h.nivel<=niv) : CONT.historias.slice(0,30)).forEach(h=>h.lineas.forEach(li=>{ for(const m of li.matchAll(/\[([^|\]]+)\|([^\]]+)\]/g)){ const w=m[1].toLowerCase().trim(); if(palabraSimple(w) && w.length>=lim[0] && w.length<=lim[1] && !vistas.has(w)) vistas.set(w, {w, img:m[2]}); } }));
  return [...vistas.values()];
}
function elegirPalabras(fuente, n=6){
  const l=fuente.idioma, todas = fuente.ficha ? palabrasDeFicha(fuente.ficha) : palabrasDeLecturas(fuente.tema);
  const d=aj.dictado||{}; const est=x=>d[l+':'+sinTilde(x.w)];
  const falladas=todas.filter(x=>{ const e=est(x); return e && e.ultimo===false; });
  const nuevas=todas.filter(x=>!est(x)), resto=todas.filter(x=>{ const e=est(x); return e && e.ultimo!==false; });
  return [...barajar(falladas), ...barajar(nuevas), ...barajar(resto).sort((a,b)=>(est(a).u||'').localeCompare(est(b).u||''))].slice(0,n);
}

/* ---------- frases del dictado ---------- */
const FRASE_D = {
  hola:{es:n=>`Hola, ${n}. Voy a dictarte unas palabras y quiero que me digas cómo se escriben, letra a letra.`,
        gl:n=>`Ola, ${n}. Vouche ditar unhas palabras e quero que me digas como se escriben, letra a letra.`,
        en:n=>`Hola, ${n}. Voy a dictarte unas palabras en inglés y quiero que me digas cómo se escriben, letra a letra.`},
  dicta:{es:w=>`${w}. ¿Cómo se escribe ${w}?`, gl:w=>`${w}. Como se escribe ${w}?`, en:w=>`${w}. How do you spell ${w}?`},
  titulo:{es:'¿Cómo se escribe?', gl:'Como se escribe?', en:'How do you spell it?'},
  casi:{es:'Casi. Hasta aquí está bien. ¿Qué letra va ahora?', gl:'Case. Ata aquí está ben. Que letra vai agora?', en:'Almost! It is right up to here. What letter comes next?'},
  seEscribe:{es:'Se escribe así:', gl:'Escríbese así:', en:'You spell it like this:'},
  fin:{es:n=>`¡Muy bien, ${n}! Has terminado el dictado.`, gl:n=>`Moi ben, ${n}! Remataches o ditado.`, en:n=>`Great job, ${n}! You finished the spelling.`}
};
const deletrear = (w, l) => [...sinTilde(w)].map(c=>(NOMBRE_LETRA[l]||NOMBRE_LETRA.es)[c]||c).join(', ');

/* ---------- pantalla del dictado ---------- */
let dic=null;
function empezarDictado(fuenteId){
  const fu=fuentesDictado().find(x=>x.id===fuenteId) || fuentesDictado()[0];
  const items=elegirPalabras(fu);
  if(!items.length){ aviso('No hay palabras para el dictado'); return; }
  dic={fuente:fu, l:fu.idioma, items, i:0, res:[], saludo:false}; ir('dictado');
}
definir('dictado', {nav:'repaso', pintar(){
  const it=dic.items[dic.i], l=dic.l, objetivo=[...sinTilde(it.w)], idm=IDIOMAS[l]||IDIOMAS.es;
  const abc=[...(ABC[l]||ABC.es)];
  let escrito=[], base=[], intentos=0, hecho=false, escuchando=false, corte=false;
  $('#s-dictado').innerHTML = `<div class="card preg dictado">
    <div class="paso-cab"><span class="pill">${ic('lapiz')} Dictado · ${dic.fuente.tema?temaDe(dic.fuente.tema).emo:idm.bandera} ${esc(dic.fuente.id==='lecturas'?idm.propio:dic.fuente.titulo)}</span><span class="der">${dic.i+1} de ${dic.items.length}<span class="barra-paso"><i style="width:${Math.round(100*(dic.i+1)/dic.items.length)}%"></i></span></span></div>
    <div class="dic-grid"><div class="dic-ft">${it.img?imgHTML(it.img,true):'<span class="emo">✏️</span>'}<button class="btn btn-borde btn-g" type="button" id="dcOir">${ic('altavoz')} Escuchar otra vez</button></div>
      <div class="dic-tx"><h2>${esc(FRASE_D.titulo[l])}</h2>
        <div class="casillas" id="dcCas">${objetivo.map(()=>'<span class="c"></span>').join('')}</div>
        <div class="medidor" id="dcMed" hidden>${'<i></i>'.repeat(12)}</div><p class="estado-mic" id="dcEstado"></p>
        <div class="botones" id="dcBot"><button class="btn btn-p btn-g" type="button" id="dcHablar">${ic('mic')} Decir las letras</button><button class="btn btn-g" type="button" id="dcComprobar" disabled>${ic('check')} Comprobar</button></div></div></div>
    <div class="teclado" id="dcTec">${abc.map(c=>`<button type="button" class="tecla" data-t="${c}">${c}</button>`).join('')}<button type="button" class="tecla borrar" id="dcBorrar" aria-label="Borrar la última letra">⌫</button></div>
    <div class="pie-preg"><button class="btn btn-g" type="button" id="dcNose">No lo sé</button><span id="dcPie"></span></div></div>`;
  const cas=$$('#dcCas .c'), est=$('#dcEstado'), barras=$$('#dcMed i');
  const pintarCasillas=(marcar)=>{ cas.forEach((c,i)=>{ c.textContent=escrito[i]||''; c.className='c'+(escrito[i]?' llena':'')+(i===escrito.length&&!hecho?' cursor':''); if(marcar && escrito[i]) c.classList.add(sinTilde(escrito[i])===objetivo[i]?'bien':'mal'); });
    if(escrito.length>objetivo.length) est.textContent='Sobran letras.'; $('#dcComprobar').disabled=!escrito.length||hecho; };
  const decirPalabra=()=>decir(FRASE_D.dicta[l](it.w), l);
  async function escuchar(){
    if(hecho) return; escuchando=true; corte=false; base=escrito.slice(); const btn=$('#dcHablar'); btn.disabled=true; est.className='estado-mic'; est.textContent='Te escucho: dime las letras…'; $('#dcMed').hidden=false;
    const r=await escucharUna({idioma:l, palabras:[...Object.keys(LETRA_DE[l]||LETRA_DE.es), ...(EXTRA_OIDO[l]||[]), ...(l==='en'?[...ABC.en]:[])], maxSeg:Math.min(40, 8+objetivo.length*4), silencio:2600,
      comprobar:t=>base.length+letrasOidas(t,l).length>=objetivo.length,
      alTexto:t=>{ if(hecho||corte||actual!=='dictado') return; escrito=base.concat(letrasOidas(t,l)); pintarCasillas(false); },
      alNivel:v=>barras.forEach((b,i)=>b.classList.toggle('on', i<Math.round(v*barras.length*1.6)))});
    escuchando=false; if(actual!=='dictado' || dic.items[dic.i]!==it || hecho) return;
    $('#dcMed').hidden=true; btn.disabled=false;
    if(corte){ corte=false; btn.innerHTML=ic('mic')+' Decir las letras'; if(!hecho) est.textContent=''; if(!hecho && escrito.length===objetivo.length) setTimeout(comprobar, 300); return; }
    if(r.sinMic){ est.textContent='No hay micrófono: escríbela tocando las letras.'; btn.hidden=true; return; }
    escrito=base.concat(letrasOidas(r.texto,l)); pintarCasillas(false);
    if(escrito.length>=objetivo.length){ comprobar(); return; }
    if(escrito.length===base.length){ est.textContent='No te he oído bien. Pulsa el micrófono o toca las letras.'; btn.innerHTML=ic('mic')+' Otra vez'; }
    else { const f=objetivo.length-escrito.length; est.textContent=`Sigue: ${f===1?'falta 1 letra':'faltan '+f+' letras'}.`; btn.innerHTML=ic('mic')+' Seguir'; }
  }
  function comprobar(){
    if(hecho) return; if(escuchando) corte=true; pararEscucha(); intentos++;
    const ok = escrito.length===objetivo.length && escrito.every((c,i)=>sinTilde(c)===objetivo[i]);
    pintarCasillas(true);
    if(ok){ terminar(true); return; }
    if(intentos>=2){ terminar(false); return; }
    let k=0; while(k<escrito.length && k<objetivo.length && sinTilde(escrito[k])===objetivo[k]) k++;
    sonido('mal'); est.className='estado-mic'; est.textContent = k ? 'Casi. Hasta la letra verde está bien.' : 'Mmm, no. Empieza otra vez.';
    const mal=escrito.slice(); dic.ultimoMal=mal.join('');
    setTimeout(async()=>{ if(actual!=='dictado' || dic.items[dic.i]!==it || hecho) return; escrito=escrito.slice(0,k); pintarCasillas(false);
      await decir(k?FRASE_D.casi[l]:FRASE_D.dicta[l](it.w), l); if(actual==='dictado' && dic.items[dic.i]===it && !hecho) escuchar(); }, 1300);
  }
  function terminar(ok){
    hecho=true; if(escuchando) corte=true; pararEscucha(); const escritoFinal=escrito.join('');
    escrito=[...it.w.toLowerCase()].filter(c=>/\p{L}/u.test(c)); pintarCasillas(false); cas.forEach(c=>c.classList.add(ok?'bien':'sol'));
    $('#dcBot').innerHTML=''; $('#dcNose').hidden=true; $('#dcMed').hidden=true; $$('#dcTec .tecla').forEach(t=>t.disabled=true);
    est.className='estado-mic '+(ok?'ok':''); est.innerHTML = ok ? esc(fraseBien(l)) : `${esc(FRASE_D.seEscribe[l])} <span class="respuesta-g">${esc(it.w)}</span>`;
    if(ok){ sonido('bien'); decirVarias([[fraseBien(l),l],[it.w,l]]); } else decirVarias([[FRASE_D.seEscribe[l],l],[deletrear(it.w,l),l],[it.w,l]]);
    const primera = ok && intentos<=1;
    aj.dictado=aj.dictado||{}; const k=l+':'+sinTilde(it.w); const e=aj.dictado[k]||{ok:0,ko:0};
    if(primera) e.ok++; else e.ko++; e.ultimo=primera; e.u=hoyISO(); if(!primera){ const m=dic.ultimoMal||escritoFinal; if(m) e.mal=[m, ...(e.mal||[])].slice(0,3); } aj.dictado[k]=e;
    dic.res.push({w:it.w, ok:primera, mal: primera?'':(dic.ultimoMal||escritoFinal)}); dic.ultimoMal='';
    guardarAj();
    $('#dcPie').innerHTML = `<button class="btn btn-p btn-g" type="button" id="dcSig">${dic.i+1<dic.items.length?'Siguiente':'Terminar'} ${ic('flecha')}</button>`;
    $('#dcSig').onclick=()=>{ callar(); dic.i++; if(dic.i<dic.items.length) ir('dictado'); else ir('dictadofin'); };
  }
  $('#dcOir').onclick=()=>{ if(escuchando) corte=true; pararEscucha(); decirPalabra(); };
  $('#dcHablar').onclick=escuchar;
  $('#dcComprobar').onclick=comprobar;
  $('#dcNose').onclick=()=>{ intentos=2; dic.ultimoMal=escrito.join('')||'?'; terminar(false); };
  $$('#dcTec [data-t]').forEach(b=>b.onclick=()=>{ if(hecho) return; if(escuchando){ corte=true; pararEscucha(); } if(escrito.length<objetivo.length+2){ escrito.push(b.dataset.t); pintarCasillas(false); } if(escrito.length===objetivo.length) setTimeout(()=>{ if(!hecho && escrito.length===objetivo.length && !escuchando) comprobar(); }, 500); });
  $('#dcBorrar').onclick=()=>{ if(hecho) return; if(escuchando){ corte=true; pararEscucha(); } escrito.pop(); pintarCasillas(false); };
  pintarCasillas(false);
  (async()=>{ if(!dic.saludo){ dic.saludo=true; await decir(FRASE_D.hola[l](nombre()), l==='en'?'es':l); }
    if(actual!=='dictado' || dic.items[dic.i]!==it) return; await decirPalabra();
    if(actual==='dictado' && dic.items[dic.i]===it && !hecho && !escrito.length) escuchar(); })();
}, salir(){ pararEscucha(); callar(); }});

definir('dictadofin', {nav:'repaso', pintar(){
  const l=dic.l, bien=dic.res.filter(r=>r.ok).length;
  aj.dictadoLog=aj.dictadoLog||[]; aj.dictadoLog.push({f:new Date().toISOString(), l, fuente:dic.fuente.id==='lecturas'?'Historias':dic.fuente.titulo, n:dic.res.length, bien, mal:dic.res.filter(r=>!r.ok).map(r=>({w:r.w, e:r.mal}))}); aj.dictadoLog=aj.dictadoLog.slice(-2000); guardarAj();
  $('#s-dictadofin').innerHTML = `<div class="card buen-trabajo"><h1>${l==='en'?'Great job!':l==='gl'?'Bo traballo!':'¡Buen trabajo!'}</h1><p class="sub">Dictado: ${bien} de ${dic.res.length} ${dic.res.length===1?'palabra':'palabras'} bien escritas a la primera.</p>
    <div class="tarjetas-pal">${dic.res.map(r=>{ const it=dic.items.find(x=>x.w===r.w)||{}; return `<div class="tp"><span class="ft">${it.img?imgHTML(it.img):'✏️'}</span><b style="${r.ok?'':'color:var(--coral)'}">${esc(r.w)} ${r.ok?`<i>${ic('check')}</i>`:''}</b>${!r.ok&&r.mal?`<span class="nota">${r.mal==='?'?'No la sabías':'Escribiste: '+esc(r.mal)}</span>`:''}</div>`; }).join('')}</div>${libroSVG()}
    <div class="botones" style="max-width:640px;margin:0 auto"><button class="btn btn-p btn-g" type="button" data-ir="inicio">${ic('casa')} Volver al inicio</button><button class="btn btn-borde btn-g" type="button" id="dcOtro">${ic('lapiz')} Otro dictado</button></div></div>`;
  $('#dcOtro').onclick=()=>empezarDictado(dic.fuente.id);
  setTimeout(()=>{ if(actual==='dictadofin') comprobarPremios(); }, 2500);
  confeti($('#s-dictadofin .buen-trabajo')); sonido('cromo');
  decir(FRASE_D.fin[l](nombre()), l);
}});

/* tarjeta para elegir el dictado (en Fichas y en Practicar) */
function tarjetaDictadoHTML(){
  return `<div class="card bloque dictado-elegir"><div><b style="font-size:1.4rem">${ic('lapiz')} Dictado</b><p class="nota">Te digo una palabra y tú me dices cómo se escribe, letra a letra. También puedes tocar las letras.</p></div>
    <div class="botones">${fuentesDictado().map(f=>{ const idm=IDIOMAS[f.idioma]||IDIOMAS.es; return `<button class="btn ${f.tema||(f.id==='lecturas'&&!temasDe(perfil()).length)?'btn-p':'btn-borde'} btn-g" type="button" data-dic="${esc(f.id)}">${f.tema?temaDe(f.tema).emo:idm.bandera} ${esc(f.titulo)}</button>`; }).join('')}</div></div>`;
}
function activarTarjetaDictado(raiz){ $$('[data-dic]', raiz).forEach(b=>b.onclick=()=>empezarDictado(b.dataset.dic)); }

/* resumen para familia y profesorado */
function dictadosAdultoHTML(){
  const ps=aj.perfiles.filter(p=>!p.prueba);
  const filas=ps.flatMap(p=>{ const log=(p.id===aj.perfil?aj.dictadoLog:(p.cfg&&p.cfg.dictadoLog))||[]; return log.slice(-8).reverse().map(x=>({p, x})); });
  return `<div class="card bloque" style="margin-top:18px"><h3 style="margin-bottom:12px">Dictados</h3>${filas.length?`<div class="tabla-w"><table><thead><tr><th>Niño</th><th>Fecha</th><th>Dictado</th><th>Bien a la primera</th><th>Le costaron</th></tr></thead><tbody>
    ${filas.map(({p,x})=>`<tr><td><b>${esc(p.nombre)}</b></td><td>${new Date(x.f).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</td><td>${esc(x.fuente)} · ${(IDIOMAS[x.l]||IDIOMAS.es).bandera}</td><td>${x.bien} / ${x.n}</td><td>${(x.mal||[]).map(m=>`${esc(m.w)}${m.e?` <span class="nota">(${m.e==='?'?'no la sabía':'escribió «'+esc(m.e)+'»'})</span>`:''}`).join(', ')||'—'}</td></tr>`).join('')}</tbody></table></div>`
    :'<p class="vacio">Todavía no ha hecho ningún dictado. Está en <b>Fichas</b> y en <b>Practicar</b>.</p>'}</div>`;
}
