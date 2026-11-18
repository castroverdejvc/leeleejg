/* LeeLEEJG 8.7 · 18/11/2026 (reglas de la familia):
   - Después de CADA lectura (del día, extra y releída) hay 6 preguntas SOLO CON TEXTO, sin dibujos.
     Las historias traen 3 o 4 escritas a mano; las que faltan hasta 6 las saca el programa del propio texto
     (siempre las mismas para cada historia, así al seguir una lectura a medias no cambian).
   - Cada pregunta vale 1 punto: bien a la primera, 1; con un fallo, medio; con dos fallos o más, nula (0).
   - Lo que da la lectura (⭐ y minutos de tele) se multiplica por puntos ÷ 6. Las estrellas pueden tener decimales.
     El móvil baja solo, porque sale de las estrellas. El reto de números no entra en la cuenta.
   - Ya no se restan los 30 segundos fijos por fallo en las lecturas (en fichas y trabajos sigue igual).
   - Fichas en papel del cole hechas en casa: 1 ⭐ cada una (ePapel); las apunta la familia con el PIN (cfg.papelLog).
   Cuenta desde el 18/11/2026: solo las lecturas marcadas con «p6» (las hechas ya con estas reglas). */
'use strict';
const CORTE_P6 = new Date(2026, 10, 18);   // miércoles 18/11/2026, 00:00 (no mover: cambia lo ya ganado)
const P6_TOTAL = 6;
const p6Activo = (f=new Date()) => +new Date(f) >= +CORTE_P6;

/* ---------- números con decimales, en bonito ---------- */
/* estrellas: «3», «2,25», «1,83» */
function estTxt(n){ const v=Math.round((+n||0)*100)/100; return (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/,'')).replace('.', ','); }
/* minutos con segundos: «11 min 15 s», «50 s», «10 min» */
function minSegTxt(m){ const s=Math.max(0, Math.round((+m||0)*60)), mm=Math.floor(s/60), ss=s%60; return mm && ss ? `${mm} min ${ss} s` : mm ? `${mm} min` : `${ss} s`; }
const puntosTxt = n => estTxt(n);

/* ---------- puntos de una lectura ---------- */
const puntoDe = q => { const i=+q.intentos||1; return i<=1 ? 1 : i===2 ? 0.5 : 0; };
function puntosP6(s){ return (s.preguntas||[]).reduce((a,q)=>a+puntoDe(q), 0); }
/* por cuánto se multiplica el premio de una lectura: 1 en las de antes; puntos ÷ preguntas en las nuevas */
function factorP6(s){ if(!s || !s.p6) return 1; const t=+s.totalPreguntas||P6_TOTAL; return t ? Math.max(0, Math.min(1, puntosP6(s)/t)) : 1; }

/* ---------- las preguntas que faltan hasta 6, sacadas del texto ---------- */
const P6_RE = /\[([^|\]]+)\|([^\]]+)\]/g;
const p6Limpia = l => String(l).replace(P6_RE, '$1');
const p6Palabras = l => { const r=[]; String(l).replace(P6_RE, (m,t)=>{ r.push(t); return m; }); return r; };
let _p6Bolsa=null;
/* todas las palabras con dibujo de todas las historias (para las respuestas que no son) */
function p6Bolsa(){
  if(_p6Bolsa) return _p6Bolsa; const vistas=new Set(), out=[];
  [...(CONT.historias||[]), ...(CONT.complementarias||[])].forEach(h=>(h.lineas||[]).forEach(l=>p6Palabras(l).forEach(t=>{ const n=normalizar(t); if(n.length<3 || /\{/.test(t) || vistas.has(n)) return; vistas.add(n); out.push(t.toLowerCase()); })));
  return (_p6Bolsa=out);
}
function preguntasDeTexto(h, faltan){
  const lineas=(h.lineas||[]).map(String), todo=normalizar(lineas.map(p6Limpia).join(' ')), r=azar(semilla('p6-'+h.id));
  const yaResp=new Set((h.preguntas||[]).map(q=>normalizar((q.ops[q.ok]||[''])[0])));
  const baraja = a => { const b=a.slice(); for(let i=b.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; };
  // palabras de la historia: la primera vez que sale cada una y en qué frase
  const pal=[]; const vist=new Set();
  lineas.forEach((l,i)=>p6Palabras(l).forEach(t=>{ const n=normalizar(t); if(n.length<3 || /\{/.test(t) || vist.has(n)) return; vist.add(n); pal.push({t:t.toLowerCase(), n, i}); }));
  const usadas=new Set();
  const libre = f => { const c=baraja(pal.filter(x=>!usadas.has(x.n) && (!f || f(x)))); const noResp=c.filter(x=>!yaResp.has(x.n)); return (noResp[0]||c[0]||null); };
  const bolsa=p6Bolsa(), deFuera=new Set();
  const ajena = () => { for(let k=0;k<400;k++){ const t=bolsa[Math.floor(r()*bolsa.length)], n=normalizar(t); if(!t || deFuera.has(n) || todo.includes(n) || pal.some(x=>x.n.includes(n) || n.includes(x.n))) continue; deFuera.add(n); return t; } return null; };
  const monta = (q, bien, malas, extra={}) => { if(!bien || malas.some(x=>!x)) return null; const ops=baraja([bien, ...malas]); return {q, ops:ops.map(t=>[t, null]), ok:ops.indexOf(bien), auto:true, ...extra}; };
  const ult=lineas.length-1;
  const tipos = {
    falta(){ const w=libre(); if(!w) return null; usadas.add(w.n); let hecho=false;
      const frase=lineas[w.i].replace(P6_RE, (m,t)=>{ if(!hecho && normalizar(t)===w.n){ hecho=true; return '_____'; } return t; });
      return monta('¿Qué palabra falta en esta frase?', w.t, [ajena(), ajena()], {frase, linea:w.i}); },
    sale(){ const w=libre(); if(!w) return null; usadas.add(w.n); return monta('¿Cuál de estas palabras sale en la historia?', w.t, [ajena(), ajena()], {linea:w.i}); },
    nosale(){ const a=libre(), b=a && libre(x=>x.n!==a.n); if(!a || !b) return null; usadas.add(a.n); usadas.add(b.n); return monta('¿Cuál de estas palabras NO sale en la historia?', ajena(), [a.t, b.t], {sinPista:true}); },
    primero(){ if(ult<2) return null; const a=libre(x=>x.i===0), c=libre(x=>x.i===ult), b=libre(x=>x.i>0 && x.i<ult); if(!a || !b || !c) return null; [a,b,c].forEach(x=>usadas.add(x.n)); return monta('¿Qué sale primero en la historia?', a.t, [b.t, c.t], {linea:0}); },
    final(){ if(ult<2) return null; const c=libre(x=>x.i===ult), a=libre(x=>x.i===0), b=libre(x=>x.i>0 && x.i<ult); if(!a || !b || !c) return null; [a,b,c].forEach(x=>usadas.add(x.n)); return monta('¿Qué sale al final de la historia?', c.t, [a.t, b.t], {linea:ult}); },
    titulo(){ const mias=baraja([...(CONT.historias||[]), ...(CONT.complementarias||[])].filter(x=>x.id!==h.id && x.titulo && x.titulo!==h.titulo && !/\{/.test(x.titulo))).slice(0,2).map(x=>x.titulo); if(mias.length<2 || !h.titulo) return null; return monta('¿Cómo se llama la historia que has leído?', h.titulo, mias, {sinPista:true, titulo:true}); }
  };
  const orden=baraja(['falta','sale','nosale','primero','final','titulo']), out=[];
  for(const t of orden){ if(out.length>=faltan) break; const q=tipos[t](); if(q) out.push(q); }
  for(let k=0; out.length<faltan && k<12; k++){ const q=tipos[k%2?'sale':'falta'](); if(q) out.push(q); }   // por si alguna no se pudo hacer
  return out;
}
/* la historia con sus 6 preguntas (las escritas a mano primero) y marcada «p6» */
function conSeisPreguntas(h){
  if(!h || h.p6) return h; const propias=(h.preguntas||[]).slice(0, P6_TOTAL);
  let extra=[]; try{ extra = propias.length<P6_TOTAL ? preguntasDeTexto({...h, preguntas:propias}, P6_TOTAL-propias.length) : []; }catch(e){ console.error('preguntas6', e); if(typeof registrar==='function') registrar('Preguntas de texto: '+e.message); }
  return {...h, preguntas:[...propias, ...extra], p6:true};
}

/* ---------- final de la lectura: los puntos ---------- */
function puntosChipHTML(s){ if(!s || !s.p6) return ''; return `<span class="chip chip-puntos">🎯 ${puntosTxt(puntosP6(s))} de ${s.totalPreguntas||P6_TOTAL} puntos</span>`; }
function puntosFraseP6(s){ if(!s || !s.p6) return ''; const p=puntosP6(s), t=s.totalPreguntas||P6_TOTAL; return p>=t ? ' ¡Todas bien a la primera: te llevas el premio entero!' : ` Has sacado ${puntosTxt(p)} puntos de ${t}: lee despacio las respuestas y te llevarás el premio entero.`; }

/* ---------- fichas en papel del cole ---------- */
const papelSemana = (p=perfil()) => { const d=sabadoDe(hoyTele()); return (cfgDe(p).papelLog||[]).filter(x=>x.f && new Date(x.f)>=d).reduce((a,x)=>a+(+x.n||0), 0); };
function apuntarPapel(p, n){ const c=cfgDe(p); c.papelLog=(c.papelLog||[]).concat([{f:new Date().toISOString(), n:Math.max(1, Math.min(20, Math.round(+n||1)))}]).slice(-500); guardarAj(); }
function quitarUltimoPapel(p){ const c=cfgDe(p); if(!(c.papelLog||[]).length) return false; c.papelLog=c.papelLog.slice(0,-1); guardarAj(); return true; }
function papelHTML(){
  const p=perfil(); if(p.prueba) return ''; const e=+premiosCfg().ePapel||0; if(!e) return ''; const n=papelSemana(p);
  return `<button class="acceso papel-acc" type="button" id="btnPapel"><span class="emo-g">📄</span><span><b>Fichas en papel del cole</b><span class="nota">Cada ficha hecha en casa: ${estTxt(e)} ⭐. La apuntan papá o mamá.${n?` Esta semana: ${n}.`:''}</span></span><span class="ir">${ic('dcha')}</span></button>`;
}
function activarPapel(raiz=document){
  const b=$('#btnPapel', raiz); if(!b) return;
  b.onclick=()=>{ const p=perfil(); let n=1; const a=12+Math.floor(Math.random()*8), m=6+Math.floor(Math.random()*4), conPin=!!aj.pin, e=+premiosCfg().ePapel||0;
    const d=dialogo({titulo:'📄 Fichas en papel del cole', html:`<p class="nota">Esto es para papá o mamá. ¿Cuántas fichas en papel ha hecho ${esc(p.nombre)} en casa?</p>
      <div class="papel-cuenta"><button class="btn btn-g" type="button" id="papelMenos" aria-label="Una menos">−</button><b id="papelN">1</b><button class="btn btn-g" type="button" id="papelMas" aria-label="Una más">+</button></div>
      <p class="nota" id="papelDa" style="text-align:center"></p>
      <p style="font-weight:800;margin:10px 0 6px">${conPin?'Pon el PIN de la familia:':`¿Cuánto es ${a} × ${m}?`}</p>
      <input id="papelRes" type="${conPin?'password':'number'}" inputmode="numeric" autocomplete="off" style="width:150px;font-size:1.4rem;padding:8px;border-radius:10px;border:2px solid var(--line)"><p class="pin-msg" id="papelMsg"></p>`,
      botones:[{t:'Apuntar', cls:'btn-p', mantener:true, fn:()=>{ const v=($('#papelRes',d.el).value||'').trim(); const bien=conPin ? v===aj.pin : +v===a*m;
        if(!bien){ $('#papelMsg',d.el).textContent=conPin?'PIN incorrecto':'No es correcto'; return; }
        apuntarPapel(p, n); d.cerrar(); sonido('cromo'); aviso(`📄 ${n===1?'1 ficha':n+' fichas'} en papel: +${estTxt(n*e)} ⭐`); ir(actual); }}, {t:'Ahora no', cls:'btn'}]});
    const pinta=()=>{ $('#papelN',d.el).textContent=n; $('#papelDa',d.el).textContent=`${n===1?'1 ficha':n+' fichas'} = ${estTxt(n*e)} ⭐`; };
    $('#papelMenos',d.el).onclick=()=>{ n=Math.max(1,n-1); pinta(); }; $('#papelMas',d.el).onclick=()=>{ n=Math.min(20,n+1); pinta(); }; pinta(); };
}
