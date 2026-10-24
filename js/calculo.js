/* LeeLEEJG · reto de números después de cada historia (24/10/2026).
   Pedido por la familia: sumas y restas «algo más difíciles», siempre con 4 opciones, y una de ellas a veces
   «Todas son correctas» o «Ninguna es correcta». 5 niveles que suben y bajan solos:
     1 · el reto de la historia (contar y sumar con sus fotos)
     2 · sumas y restas hasta 10
     3 · hasta 20 con llevadas y «el número que falta» (7 + ? = 12)
     4 · tres números (3 + 4 + 2) y decenas (30 + 20, 45 + 3)
     5 · hasta 100 con decenas y unidades, y problemas de dos pasos
   Sube un nivel con 3 retos seguidos bien a la primera; baja uno si falla 2 seguidos. */
'use strict';
const TODAS='Todas son correctas', NINGUNA='Ninguna es correcta';
const CALC_NIVEL_INICIAL = 2;
const verOp = t => String(t).replace(/\s*\+\s*/g,' + ').replace(/\s*[-−]\s*/g,' − ');
const leerOp = t => verOp(t).replace(/ \+ /g,' más ').replace(/ − /g,' menos ').replace(/\?/g,'cuánto');
const valorOp = t => { const s=String(t).replace(/−/g,'-').replace(/\s/g,''); if(!/^\d+([+-]\d+)*$/.test(s)) return NaN; return s.match(/[+-]?\d+/g).reduce((a,x)=>a+ +x,0); };

/* nivel de cálculo de cada niño, a partir de sus retos (los de antes del 24/10 no cuentan) */
function nivelCalculo(p=perfil()){
  let n=Math.max(1, Math.min(5, +cfgDe(p).calcNivelIni || CALC_NIVEL_INICIAL)), racha=0, malas=0;
  sesDe(p.id).filter(s=>s.calculo && s.calculo.nivel && s.fecha).sort((a,b)=>a.fecha<b.fecha?-1:1).forEach(s=>{
    if(s.calculo.ok){ racha++; malas=0; if(racha>=3){ n=Math.min(5,n+1); racha=0; } }
    else { malas++; racha=0; if(malas>=2){ n=Math.max(1,n-1); malas=0; } }
  });
  return n;
}

const ent = (r, a, b) => a + Math.floor(r()*(b-a+1));
const mezclar = (xs, r) => { const a=xs.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
/* tres números distintos cerca de «v» (sin negativos) */
function cercanos(v, r, n=3, sin=[]){ const out=new Set(), malo=new Set(sin); let k=0;
  while(out.size<n && k<200){ k++; const d=[1,-1,2,-2,10,-10,3,-3][Math.floor(r()*(v>=20?8:6))]; const x=v+d; if(x>=0 && x!==v && !malo.has(x)) out.add(x); }
  for(let x=v+1; out.size<n; x++) if(!malo.has(x) && x!==v) out.add(x);
  return [...out]; }

/* una operación de un nivel: {a, b, c?, op, res, texto} */
function operacion(nivel, r){
  const sum = (a,b)=>({op:'+', a, b, res:a+b, texto:`${a} + ${b}`}), res = (a,b)=>({op:'-', a, b, res:a-b, texto:`${a} - ${b}`});
  if(nivel<=2){ if(r()<0.6){ const a=ent(r,1,8); return sum(a, ent(r,1,10-a)); } const a=ent(r,3,10); return res(a, ent(r,1,a-1)); }
  if(nivel===3){ if(r()<0.6){ const a=ent(r,5,9); return sum(a, ent(r,11-a,9)); } const a=ent(r,11,18); return res(a, ent(r,a-9,9)); }
  if(nivel===4){ const t=r();
    if(t<0.35){ const a=ent(r,1,6), b=ent(r,1,6), c=ent(r,1,6); return {op:'++', a, b, c, res:a+b+c, texto:`${a} + ${b} + ${c}`}; }
    if(t<0.7){ const a=10*ent(r,1,6), b=10*ent(r,1,3); return r()<0.6 ? sum(a,b) : res(a+b, b); }
    const a=10*ent(r,2,5)+ent(r,0,5), b=ent(r,1,4); return r()<0.5 ? sum(a,b) : res(a+b, b); }
  // nivel 5: decenas y unidades sin llevar, hasta 100
  const da=ent(r,1,6), ua=ent(r,0,5), db=ent(r,1,9-da), ub=ent(r,0,9-ua);
  return r()<0.55 ? sum(10*da+ua, 10*db+ub) : res(10*(da+db)+ua+ub, 10*db+ub);
}
/* otra operación que dé el mismo resultado (para «todas son correctas») */
function otraIgual(o, r, usadas){
  for(let k=0;k<40;k++){ let t;
    if(o.res<=1) return null;
    if(r()<0.6){ const a=ent(r, Math.max(0,Math.floor(o.res/5)), Math.max(1,o.res-1)); t=`${a} + ${o.res-a}`; }
    else { const b=ent(r,1,Math.min(9,Math.max(1,Math.floor(o.res/2)))); t=`${o.res+b} - ${b}`; }
    if(!usadas.includes(t) && valorOp(t)===o.res) return t; }
  return null;
}
/* una operación parecida que NO dé el resultado */
function otraDistinta(o, r, usadas){
  for(let k=0;k<40;k++){ const d=[1,-1,2,-2,10,-10][Math.floor(r()*(o.res>=20?6:4))];
    const t = o.op==='++' ? `${o.a} + ${Math.max(0,o.b+d)} + ${o.c}` : o.op==='+' ? (r()<0.5?`${Math.max(0,o.a+d)} + ${o.b}`:`${o.a} + ${Math.max(0,o.b+d)}`) : (r()<0.5?`${o.a+Math.abs(d)} - ${o.b}`:`${o.a} - ${Math.max(0,o.b-Math.abs(d))}`);
    if(!usadas.includes(t) && valorOp(t)!==o.res && valorOp(t)>=0) return t; }
  return null;
}

/* el reto de una historia para un nivel. Devuelve {q, voz, ops[4], ok, tipo, nivel, modo, variante, res, opBuena, fotos?} */
function retoPara(h, nivel, r=Math.random){
  const c=h.calculo;
  // nivel 1 (o historias sin reto): el de la historia, con su cuarta opción
  if(nivel<=1 && c){
    if(c.tipo==='contar'){
      const quita = r()<0.25; let nums=c.ops.slice();
      if(quita){ const otro=cercanos(c.resultado, r, 1, nums.map(Number))[0]; nums[c.ok]=String(otro); }
      return {q:c.q, voz:c.q, ops:[...nums, NINGUNA], ok: quita?3:c.ok, tipo:'contar', nivel:1, modo:'historia', variante: quita?'ninguna':'una', res:c.resultado, fotos:c.cuenta && c.cuenta.length ? c.cuenta.length : 0};
    }
    const t=r(); const ops=c.ops.slice();
    if(t<0.25){ // todas
      const o={res:c.resultado}; const nuevas=[]; for(let i=0;i<3;i++){ const x=otraIgual(o, r, nuevas); if(x) nuevas.push(x); }
      if(nuevas.length===3) return {q:c.q, voz:c.q+' Mira bien cada una.', ops:[...nuevas, TODAS], ok:3, tipo:c.tipo, nivel:1, modo:'historia', variante:'todas', res:c.resultado, fotos:c.cuenta?c.cuenta.length:0, opBuena:nuevas[0]};
    }
    if(t<0.5){ // ninguna
      const m=String(ops[c.ok]).replace('−','-').match(/(\d+)\s*([+-])\s*(\d+)/);
      if(m){ const o={op:m[2], a:+m[1], b:+m[3], res:c.resultado}; const x=otraDistinta(o, r, ops); if(x){ const buena=ops[c.ok]; ops[c.ok]=x;
        if(!ops.some(y=>valorOp(y)===c.resultado)) return {q:c.q, voz:c.q+' Mira bien cada una.', ops:[...ops, NINGUNA], ok:3, tipo:c.tipo, nivel:1, modo:'historia', variante:'ninguna', res:c.resultado, fotos:c.cuenta?c.cuenta.length:0, opBuena:buena}; } }
    }
    return {q:c.q, voz:c.q+' Mira bien cada una.', ops:[...ops, r()<0.5?TODAS:NINGUNA], ok:c.ok, tipo:c.tipo, nivel:1, modo:'historia', variante:'una', res:c.resultado, fotos:c.cuenta?c.cuenta.length:0, opBuena:ops[c.ok]};
  }
  const o=operacion(Math.max(2,nivel), r);
  const tipo = o.op==='-' ? 'resta' : 'suma';
  // nivel 5: a veces, un problema de dos pasos
  if(nivel>=5 && r()<0.3){
    const a=ent(r,8,20), b=ent(r,2,9), c2=ent(r,1,Math.min(9,a+b-1)), R=a+b-c2;
    const cosa=['cromos','canicas','caramelos','castañas','pegatinas'][Math.floor(r()*5)];
    const q=`{nombre} tiene ${a} ${cosa}. Le dan ${b} y después regala ${c2}. ¿Cuántos tiene ahora?`.replace('Cuántos tiene ahora?', cosa==='castañas'||cosa==='canicas'||cosa==='pegatinas'?'Cuántas tiene ahora?':'Cuántos tiene ahora?');
    const quita=r()<0.25; let nums=cercanos(R, r, quita?3:2); if(!quita) nums.push(R); nums=mezclar(nums, r);
    return {q, voz:q, ops:[...nums.map(String), NINGUNA], ok: quita?3:nums.indexOf(R), tipo:'problema', nivel, modo:'problema', variante: quita?'ninguna':'una', res:R, pasos:[a,b,c2]};
  }
  const modo = (nivel===3 && r()<0.3) ? 'falta' : r()<0.5 ? 'cuanto' : 'cual';
  if(modo==='falta'){   // 7 + ? = 12
    const quita=r()<0.2, x=o.b; let nums=cercanos(x, r, quita?3:2); if(!quita) nums.push(x); nums=mezclar(nums, r);
    const txt = o.op==='+' ? `${o.a} + ? = ${o.res}` : `${o.a} - ? = ${o.res}`;
    return {q:`¿Qué número falta? ${verOp(txt)}`, voz:`¿Qué número falta? ${leerOp(txt).replace('= ','son ')}`, ops:[...nums.map(String), NINGUNA], ok: quita?3:nums.indexOf(x), tipo, nivel, modo, variante: quita?'ninguna':'una', res:x, o, txt};
  }
  if(modo==='cuanto'){   // ¿Cuánto es 8 + 5?
    const quita=r()<0.25; let nums=cercanos(o.res, r, quita?3:2); if(!quita) nums.push(o.res); nums=mezclar(nums, r);
    return {q:`¿Cuánto es ${verOp(o.texto)}?`, voz:`¿Cuánto es ${leerOp(o.texto)}?`, ops:[...nums.map(String), NINGUNA], ok: quita?3:nums.indexOf(o.res), tipo, nivel, modo, variante: quita?'ninguna':'una', res:o.res, o};
  }
  // ¿Qué operación da 13?  (una, todas o ninguna)
  const t=r(); const q=`¿Qué operación da ${o.res}?`;
  if(t<0.25){ const ops=[o.texto]; for(let i=0;i<2;i++){ const x=otraIgual(o, r, ops); if(x) ops.push(x); }
    if(ops.length===3) return {q, voz:q+' Mira bien cada una.', ops:[...mezclar(ops,r), TODAS], ok:3, tipo, nivel, modo, variante:'todas', res:o.res, o}; }
  if(t<0.5){ const ops=[]; for(let i=0;i<3;i++){ const x=otraDistinta(o, r, ops); if(x) ops.push(x); }
    if(ops.length===3) return {q, voz:q+' Mira bien cada una.', ops:[...ops, NINGUNA], ok:3, tipo, nivel, modo, variante:'ninguna', res:o.res, o}; }
  const malas=[]; for(let i=0;i<2;i++){ const x=otraDistinta(o, r, [o.texto, ...malas]); if(x) malas.push(x); }
  const ops=mezclar([o.texto, ...malas], r);
  return {q, voz:q+' Mira bien cada una.', ops:[...ops, r()<0.5?TODAS:NINGUNA], ok:ops.indexOf(o.texto), tipo, nivel, modo, variante:'una', res:o.res, o};
}

/* cómo se hace (para «Lo vemos juntos») */
function explicarReto(R){
  const o=R.o;
  if(R.modo==='problema'){ const [a,b,c]=R.pasos; return {igual:`${a} + ${b} − ${c} = ${R.res}`, frase:`Primero ${a} más ${b} son ${a+b}. Después, ${a+b} menos ${c} son ${R.res}.`}; }
  if(!o) return null;
  const txtR = R.modo==='falta' ? R.txt.replace('?', String(R.res)) : `${o.texto} = ${o.res}`;
  let frase;
  if(o.op==='++') frase=`${o.a} más ${o.b} son ${o.a+o.b}, y ${o.a+o.b} más ${o.c} son ${o.res}.`;
  else if(o.op==='+'){
    if(o.a>=10 && o.b>=10){ const da=o.a-o.a%10, db=o.b-o.b%10; frase=`Las decenas: ${da} más ${db} son ${da+db}. Las unidades: ${o.a%10} más ${o.b%10} son ${o.a%10+o.b%10}. Juntas: ${o.res}.`; }
    else if(o.a<10 && o.a+o.b>10 && o.b<10){ const hasta=10-o.a; frase=`${o.a} y ${hasta} son 10, y ${o.b-hasta} más son ${o.res}.`; }
    else frase=`${o.a} más ${o.b} son ${o.res}.`;
  } else {
    if(o.a>10 && o.b<10 && o.a-o.b<10){ const baja=o.a-10; frase=`De ${o.a} quito ${baja} y llego a 10; quito ${o.b-baja} más y quedan ${o.res}.`; }
    else if(o.b>=10){ frase=`Quito las decenas: ${o.a} menos ${o.b-o.b%10} son ${o.a-(o.b-o.b%10)}${o.b%10?`; y menos ${o.b%10} son ${o.res}`:''}.`; }
    else frase=`${o.a} menos ${o.b} son ${o.res}.`;
  }
  if(R.modo==='falta') frase=`Falta el ${R.res}, porque ${frase.charAt(0).toLowerCase()+frase.slice(1)}`;
  return {igual:verOp(txtR), frase};
}

/* ---------- pantallas ---------- */
let cEst=null;
function claveCalculo(){ const c=hist.calculo||{}; if(c.cuenta && c.cuenta.length) return c.cuenta[0]; const m=hist.lineas.join(' ').match(/\[[^|\]]+\|([^\]]+)\]/); return m?m[1]:hist.portada; }
definir('calculo', {nav:'historias', pintar(){
  if(!cEst){ const p=perfil(); cEst={intentos:0, mal:new Set(), R:retoPara(hist, p.prueba?CALC_NIVEL_INICIAL:nivelCalculo(p))}; }
  const e=cEst, R=e.R;
  const k=claveCalculo(); const n = R.fotos||0;
  const etiqueta = R.modo==='problema' ? 'Problema' : R.tipo==='resta' ? 'Reto de restar' : R.tipo==='contar' ? 'Contar' : 'Reto de números';
  const esTxt = t => t===TODAS || t===NINGUNA;
  const pista = n ? 'Cuenta las fotos otra vez.' : R.modo==='historia' ? 'Piénsalo otra vez.' : 'Piénsalo otra vez. Puedes contar con los dedos.';
  $('#s-calculo').innerHTML = `<div class="card preg">${cabPaso(2+hist.preguntas.length, {t:etiqueta}, `<span class="pill nivel-calc">Nivel ${R.nivel}</span>`)}
    <div class="reto"><div class="fotos-reto">${n ? Array.from({length:Math.min(n,10)},()=>imgHTML(k)).join('') : `<span style="width:240px;height:170px;border-radius:16px;overflow:hidden;display:block">${imgHTML(hist.portada,true)}</span>`}</div>
      <div><div class="frase">${esc(conNombre(R.q))}</div><button class="ico-btn" type="button" id="btnOirC" style="margin-top:12px" aria-label="Escuchar">${ic('altavoz')}</button></div></div>
    ${e.intentos?'<div class="aviso-int" style="margin-top:14px">'+pista+'</div>':''}
    <div class="sumas cuatro">${R.ops.map((t,i)=>`<button type="button" class="suma${e.mal.has(i)?' mal':''}${esTxt(t)?' suma-txt':''}" data-i="${i}" ${e.mal.has(i)?'disabled':''}>${esc(esTxt(t)?t:verOp(t))}</button>`).join('')}</div></div>`;
  $('#btnOirC').onclick=()=>decir(conNombre(R.voz));
  $$('#s-calculo .suma').forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; e.intentos++;
    if(i===R.ok){ sonido('bien'); sesion.calculo={ok:e.intentos===1, intentos:e.intentos, tipo:R.tipo, nivel:R.nivel, modo:R.modo, variante:R.variante}; guardarSesionActual(); ir('juntos'); }
    else { e.mal.add(i); sonido('mal'); decir(n?'Casi. Cuenta las fotos otra vez.':'Casi. Piénsalo otra vez.'); ir('calculo'); } });
  if(!e.intentos && !e.leida){ e.leida=true; decirPregunta(conNombre(R.voz)); }
}, salir(){ }});
/* 18 · Lo vemos juntos */
definir('juntos', {nav:'historias', pintar(){
  const R=cEst && cEst.R; const k=claveCalculo();
  const pre = R && R.variante==='todas' ? `¡Todas daban ${R.res}! ` : R && R.variante==='ninguna' ? (R.modo==='historia'||R.modo==='cual' ? `¡Ninguna daba ${R.res}! ` : `¡El ${R.res} no estaba! `) : '';
  let vis, igual, frase;
  if(R && R.modo!=='historia'){
    const x=explicarReto(R)||{igual:String(R.res), frase:''};
    const o=R.o; const peque = o && o.op!=='++' && o.a<=10 && o.b<=10 && o.res<=10;
    const fotos=(n, tachadas=0)=>Array.from({length:n},(_,i)=>`<span class="${i>=n-tachadas?'tachada':''}">${imgHTML(k)}</span>`).join('');
    vis = peque ? (o.op==='+' ? `<div class="grupo-n a"><div class="fs">${fotos(o.a)}</div><b>${o.a}</b></div><span class="signo">+</span><div class="grupo-n b"><div class="fs">${fotos(o.b)}</div><b>${o.b}</b></div>` : `<div class="grupo-n a"><div class="fs">${fotos(o.a, o.b)}</div><b>${o.a} − ${o.b}</b></div>`)
                : `<div class="explica-calc"><span class="emo-g">🧮</span><p>${esc(conNombre(x.frase))}</p></div>`;
    igual=x.igual; frase=x.frase;
  } else {
    const c=hist.calculo; const op=verOp(R && R.opBuena ? R.opBuena : c.ops[c.ok]); const nums=(op.match(/\d+/g)||[]).map(Number);
    const fotos=(n, tachadas=0)=>Array.from({length:n},(_,i)=>`<span class="${i>=n-tachadas?'tachada':''}">${imgHTML(k)}</span>`).join('');
    if(c.tipo==='suma' && nums.length===2){ vis=`<div class="grupo-n a"><div class="fs">${fotos(nums[0])}</div><b>${nums[0]}</b></div><span class="signo">+</span><div class="grupo-n b"><div class="fs">${fotos(nums[1])}</div><b>${nums[1]}</b></div>`; igual=`${nums[0]} + ${nums[1]} = ${c.resultado}`; frase=`${leerOp(op)} son ${c.resultado}.`; }
    else if(c.tipo==='resta' && nums.length===2){ vis=`<div class="grupo-n a"><div class="fs">${fotos(nums[0], nums[1])}</div><b>${nums[0]} − ${nums[1]}</b></div>`; igual=`${nums[0]} − ${nums[1]} = ${c.resultado}`; frase=`${leerOp(op)} son ${c.resultado}.`; }
    else { vis=`<div class="grupo-n a"><div class="fs">${fotos(c.resultado)}</div><b>${c.resultado}</b></div>`; igual=`Hay ${c.resultado}`; frase=`Hay ${c.resultado}.`; }
  }
  $('#s-juntos').innerHTML = `<div class="card preg">${cabPaso(2+hist.preguntas.length, {t:'Lo vemos juntos'})}
    ${pre?`<p class="sub centro" style="margin:6px 0">${esc(pre)}</p>`:''}<div class="juntos">${vis}</div><div class="igualdad">${esc(igual)}</div>
    <div class="pie-preg" style="justify-content:center;gap:20px"><span class="correcto"><i>${ic('check')}</i>¡Correcto!</span><button class="btn btn-p btn-g" type="button" id="btnSigC">Siguiente ${ic('flecha')}</button></div></div>`;
  $('#btnSigC').onclick=()=>ir('cromonuevo');
  decir('¡Muy bien! '+pre+conNombre(frase||''));
}});
