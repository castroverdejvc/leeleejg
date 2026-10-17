/* LeeLEEJG · cromos repetidos y cambios entre los niños de la familia.
   Cada vez que un niño vuelve a leer una historia que ya tenía, consigue un cromo repetido («repe»).
   Los repes se cambian con otro niño de la familia: cada uno da un repe que al otro le falta. */
'use strict';
const cambiosDe = p => cfgDe(p).cambios || [];
/* cromos que tiene: los de las historias leídas y los que le han dado en un cambio */
function cromosDe(p=perfil()){
  const own={}; Object.keys(leidasDe(p.id)).forEach(id=>own[id]='leido');
  cambiosDe(p).forEach(c=>{ if(!own[c.recibe]) own[c.recibe]='cambio'; });
  return own;
}
/* repes: lecturas de más de una historia, menos los que ya ha dado */
function repesDe(p=perfil()){
  const r={}; Object.entries(leidasDe(p.id)).forEach(([id,n])=>{ if(n>1) r[id]=n-1; });
  cambiosDe(p).forEach(c=>{ if(r[c.da]) r[c.da]--; });
  Object.keys(r).forEach(k=>{ if(r[k]<=0) delete r[k]; });
  return r;
}
const otrosNinos = (p=perfil()) => aj.perfiles.filter(x=>x.id!==p.id && !x.prueba);

let cambioCon=null, cambioSel={da:null, recibe:null};
definir('cambiar', {nav:'cromos', pintar(conId){
  const yo=perfil(); const otros=otrosNinos(yo);
  if(conId!==undefined){ cambioCon=conId; cambioSel={da:null, recibe:null}; }
  const s=$('#s-cambiar');
  if(yo.prueba || !otros.length){ s.innerHTML=`<button class="volver" type="button" data-ir="cromos">${ic('atras')} Mis cromos</button><div class="card bloque centro"><h1 class="tit">🔁 Cambiar cromos</h1><p class="sub">Para cambiar cromos hace falta otro niño en LeeLEEJG.</p><p class="nota">Papá o mamá pueden añadirlo en Familia y profesorado › Perfil › Nuevo lector.</p></div>`; return; }
  const otro = otros.find(x=>x.id===cambioCon);
  if(!otro){
    s.innerHTML=`<button class="volver" type="button" data-ir="cromos">${ic('atras')} Mis cromos</button><h1 class="tit">🔁 Cambiar cromos</h1><p class="sub">¿Con quién quieres cambiar?</p>
      <div class="quien-grid">${otros.map(o=>{ const n=Object.keys(repesDe(o)).length; return `<button type="button" class="quien" data-con="${esc(o.id)}" style="--c:${esc(o.color)};--cs:${SUAVE[o.color]||'#E2EEFF'}"><span class="circulo">${fotoLector(o)?`<img src="${fotoLector(o)}" alt="">`:esc(iniciales(o.nombre))}</span><b>${esc(o.nombre)}</b><span class="nota">${n} ${n===1?'repe':'repes'}</span></button>`; }).join('')}</div>`;
    $$('#s-cambiar [data-con]').forEach(b=>b.onclick=()=>ir('cambiar', b.dataset.con)); return;
  }
  const misRepes=repesDe(yo), susRepes=repesDe(otro), mios=cromosDe(yo), suyos=cromosDe(otro);
  const doy=Object.keys(misRepes).filter(id=>!suyos[id] && historia(id)), recibo=Object.keys(susRepes).filter(id=>!mios[id] && historia(id));
  const carta=(id, lado)=>{ const h=historia(id); return `<button type="button" class="cromo cambio${cambioSel[lado]===id?' elegido':''}" data-lado="${lado}" data-h="${id}"><span class="ft">${imgHTML(h.portada)}</span><b>${esc(conNombre(h.titulo))}</b></button>`; };
  s.innerHTML=`<button class="volver" type="button" id="volCambio">${ic('atras')} Elegir con quién</button><h1 class="tit">🔁 Cambiar con ${esc(otro.nombre)}</h1>
    <p class="sub">Elige un repe tuyo que le falte a ${esc(otro.nombre)} y un repe suyo que te falte a ti.</p>
    <div class="cambio-cols"><div class="card bloque"><h3>Tus repes que le faltan a ${esc(otro.nombre)}</h3>${doy.length?`<div class="cromos">${doy.map(id=>carta(id,'da')).join('')}</div>`:`<p class="vacio">Ahora no tienes repes que le falten. Cuando vuelves a leer una historia que ya tenías, consigues un repe.</p>`}</div>
      <div class="card bloque"><h3>Repes de ${esc(otro.nombre)} que te faltan</h3>${recibo.length?`<div class="cromos">${recibo.map(id=>carta(id,'recibe')).join('')}</div>`:`<p class="vacio">${esc(otro.nombre)} no tiene repes que te falten.</p>`}</div></div>
    <div class="botones" style="justify-content:center;margin-top:16px"><button class="btn btn-p btn-xl" type="button" id="btnCambiar" ${cambioSel.da&&cambioSel.recibe?'':'disabled'}>🔁 Cambiar</button></div>`;
  $('#volCambio').onclick=()=>ir('cambiar', null);
  $$('#s-cambiar [data-lado]').forEach(b=>b.onclick=()=>{ cambioSel[b.dataset.lado]=b.dataset.h; sonido('toc'); ir('cambiar'); });
  $('#btnCambiar').onclick=()=>{ const da=cambioSel.da, recibe=cambioSel.recibe; if(!da||!recibe) return;
    dialogo({titulo:`${esc(otro.nombre)}, ¿aceptas el cambio?`, html:`<div class="cambio-dlg"><div>${imgHTML(historia(da).portada)}<b>${esc(conNombre(historia(da).titulo))}</b><span class="nota">para ${esc(otro.nombre)}</span></div><span class="flecha-c">⇄</span><div>${imgHTML(historia(recibe).portada)}<b>${esc(conNombre(historia(recibe).titulo))}</b><span class="nota">para ${esc(yo.nombre)}</span></div></div>`,
      botones:[{t:'¡Sí, acepto!', cls:'btn-p', fn:()=>{ const id=nuevoId(), f=new Date().toISOString();
        const cy=cfgDe(yo), co=cfgDe(otro); cy.cambios=(cy.cambios||[]).concat([{id, f, da, recibe, con:otro.id}]); co.cambios=(co.cambios||[]).concat([{id, f, da:recibe, recibe:da, con:yo.id}]);
        guardarAj(); sonido('cromo'); cambioSel={da:null, recibe:null}; ir('cambiar'); confeti($('#s-cambiar')); decir(`¡Cambio hecho! ${yo.nombre} y ${otro.nombre} tienen un cromo nuevo.`); }},
        {t:'No, ahora no', cls:'btn'}]}); };
}});
