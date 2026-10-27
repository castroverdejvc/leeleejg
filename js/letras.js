/* LeeLEEJG · «As letras» (en galego): recoñecer as vogais e as letras l, m, p, t, d, n, f
   dentro dunha palabra ou dunha sílaba. Vai en Fichas; cada rolda conta como un exercicio. */
'use strict';
const LETRAS_GL = ['a','e','i','o','u','l','m','p','t','d','n','f'];
const NOME_LETRA = {a:'a', e:'e', i:'i', o:'o', u:'u', l:'ele', m:'eme', p:'pe', t:'te', d:'de', n:'ene', f:'efe'};
const VOGAIS = ['a','e','i','o','u'], CONSOANTES = ['l','m','p','t','d','n','f'];
/* palabras galegas con foto [palabra, foto] */
const PALABRAS_GL = [['lúa','luna'],['mapa','mapa'],['pato','pato'],['mono','mono'],['pan','pan'],['tomate','tomate'],['mel','miel'],['leite','leche'],['lapis','lapiz'],
  ['foca','foca'],['flor','flor'],['faro','faro'],['uvas','uvas'],['ovo','huevo'],['oso','oso'],['ollo','ojo'],['nariz','nariz'],['pé','pie'],['pomba','paloma'],['fume','humo'],
  ['nube','nubes'],['neve','nieve'],['mesa','mesa'],['man','mano'],['moto','moto'],['tenda','tienda'],['lobo','lobo'],['león','leon'],['limón','limon'],['melón','melon'],
  ['peixe','pez'],['polo','pollito'],['pita','gallina'],['onda','ola'],['sol','sol'],['foguete','cohete'],['mazá','manzana'],['pera','pera'],['piña','pina'],['dado','dados'],
  ['dente','diente'],['porta','puerta'],['pataca','patata'],['noite','noche'],['elefante','elefante'],['frauta','flauta'],['planeta','planeta'],['patio','patio'],['lago','lago'],
  ['tambor','tambor'],['lámpada','lampara'],['millo','maiz'],['niño','nido'],['piano','piano'],['tenedor','tenedor']];
const sinTil = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const letrasDaPalabra = w => [...w].map(ch=>sinTil(ch)==='ñ'||ch==='ñ'?'ñ':sinTil(ch));
const GL = {
  ben:['Moi ben!','Xenial!','Iso é!','Perfecto!'], outra:'Case! Proba outra vez.',
  tocaNa:(l,w)=>`Toca as letras ${NOME_LETRA[l]} de «${w}».`,
  tocaUna:(l,w)=>`Toca a letra ${NOME_LETRA[l]} de «${w}».`,
  silaba:l=>`Cal destas sílabas ten a letra ${NOME_LETRA[l]}?`,
  oe:'Escoita e toca a sílaba que digo.',
  comeza:w=>`Con que letra comeza «${w}»?`,
};
const benGL = () => GL.ben[Math.floor(Math.random()*GL.ben.length)];
const dicirGL = t => decir(t, 'gl');

/* que letra practicar: as que máis custan saen máis */
function escollerLetra(stats, excluir=[]){
  const ls=LETRAS_GL.filter(l=>!excluir.includes(l)); const peso=l=>{ const s=stats[l]||{ok:0,mal:0}; return 1 + 2*s.mal/(1+s.ok*.5) + (s.ok+s.mal<3?1:0); };
  const tot=ls.reduce((a,l)=>a+peso(l),0); let r=Math.random()*tot; for(const l of ls){ r-=peso(l); if(r<=0) return l; } return ls[0];
}
function silabaCon(c, v){ return c+v; }
function crearExercicios(n=8){
  const stats=aj.letras||{}; const out=[]; const usadas=[];
  for(let i=0;i<n;i++){
    const l=escollerLetra(stats, usadas.slice(-2)); usadas.push(l); const tipo=['toca','toca','silaba','oe','comeza'][i%5];
    if(tipo==='toca' || tipo==='comeza'){
      let cand = tipo==='toca' ? PALABRAS_GL.filter(([w])=>letrasDaPalabra(w).includes(l)) : PALABRAS_GL.filter(([w])=>letrasDaPalabra(w)[0]===l);
      if(!cand.length) cand=PALABRAS_GL.filter(([w])=>letrasDaPalabra(w).includes(l));
      if(tipo==='comeza' && !PALABRAS_GL.some(([w])=>letrasDaPalabra(w)[0]===l)){ out.push(exToca(l, cand)); continue; }
      if(tipo==='toca'){ out.push(exToca(l, cand)); continue; }
      const [w,k]=cand[Math.floor(Math.random()*cand.length)];
      const ops=barajar([l, ...barajar(LETRAS_GL.filter(x=>x!==l)).slice(0,2)]);
      out.push({tipo:'comeza', l, w, k, ops}); continue;
    }
    if(tipo==='silaba'){
      // tres sílabas; só unha leva a letra
      let ops;
      if(VOGAIS.includes(l)){ const vs=barajar(VOGAIS.filter(v=>v!==l)).slice(0,2); const cs=barajar(CONSOANTES).slice(0,3); ops=[silabaCon(cs[0],l), silabaCon(cs[1],vs[0]), silabaCon(cs[2],vs[1])]; }
      else { const cs=barajar(CONSOANTES.filter(c=>c!==l)).slice(0,2); const vs=barajar(VOGAIS).slice(0,3); ops=[silabaCon(l,vs[0]), silabaCon(cs[0],vs[1]), silabaCon(cs[1],vs[2])]; }
      out.push({tipo, l, boa:ops[0], ops:barajar(ops)}); continue;
    }
    // oe: dígolle unha sílaba e escolle entre tres parecidas
    const c=CONSOANTES.includes(l)?l:barajar(CONSOANTES)[0], v=VOGAIS.includes(l)?l:barajar(VOGAIS)[0];
    const boa=silabaCon(c,v); const outras=new Set();
    while(outras.size<2){ const x = Math.random()<.5 ? silabaCon(barajar(CONSOANTES.filter(z=>z!==c))[0], v) : silabaCon(c, barajar(VOGAIS.filter(z=>z!==v))[0]); if(x!==boa) outras.add(x); }
    out.push({tipo:'oe', l, boa, ops:barajar([boa, ...outras])});
  }
  return out;
}
function exToca(l, cand){ const [w,k]=cand[Math.floor(Math.random()*cand.length)]; return {tipo:'toca', l, w, k, falta:letrasDaPalabra(w).map((x,i)=>x===l?i:-1).filter(i=>i>=0)}; }

let letr=null;
function empezarLetras(){ letr={items:crearExercicios(8), i:0, res:[]}; ir('letrasitem'); }
function apuntarLetra(l, ok){ aj.letras=aj.letras||{}; const s=aj.letras[l]||(aj.letras[l]={ok:0,mal:0}); if(ok) s.ok++; else s.mal++; }
definir('letrasitem', {nav:'repaso', pintar(){
  const it=letr.items[letr.i]; let erros=0, feito=false;
  const cab=`<div class="paso-cab"><span class="pill">🔤 As letras · Galego</span><span class="der">${letr.i+1} de ${letr.items.length}<span class="barra-paso"><i style="width:${Math.round(100*(letr.i+1)/letr.items.length)}%"></i></span></span></div>`;
  const seguinte=(ok)=>{ if(feito) return; feito=true; apuntarLetra(it.l, ok); letr.res.push({l:it.l, tipo:it.tipo, ok}); guardarAj();
    setTimeout(()=>{ letr.i++; ir(letr.i<letr.items.length?'letrasitem':'letrasfin'); }, 1700); };
  const s=$('#s-letrasitem'); let texto='';
  if(it.tipo==='toca'){
    const varias=it.falta.length>1; texto = varias ? GL.tocaNa(it.l, it.w) : GL.tocaUna(it.l, it.w);
    s.innerHTML=`<div class="card preg letras-ex">${cab}<h2>${esc(texto)}</h2><button class="altavoz" type="button" id="ltOir" aria-label="Escoitar">${ic('altavoz')}</button>
      <div class="letras-pal"><span class="ft">${imgHTML(it.k,true)}</span><div class="fichas-letras ${claseTexto()}">${[...it.w].map((ch,i)=>`<button type="button" class="ficha-l" data-i="${i}">${esc(ch)}</button>`).join('')}</div></div>
      ${varias?`<p class="nota centro">Hai ${it.falta.length} letras ${NOME_LETRA[it.l]} nesta palabra.</p>`:''}<div class="pie-preg" id="ltPie"></div></div>`;
    const quedan=new Set(it.falta);
    $$('#s-letrasitem .ficha-l').forEach(b=>b.onclick=()=>{ if(feito) return; const i=+b.dataset.i;
      if(quedan.has(i)){ quedan.delete(i); b.classList.add('bien'); b.disabled=true; sonido('toc');
        if(!quedan.size){ sonido('bien'); dicirGL(benGL()+' '+it.w+'.'); seguinte(erros===0); } }
      else { erros++; b.classList.add('mal'); setTimeout(()=>b.classList.remove('mal'), 600); sonido('mal'); dicirGL(GL.outra);
        if(erros>=3){ quedan.forEach(j=>$(`#s-letrasitem .ficha-l[data-i="${j}"]`).classList.add('axuda')); dicirGL(`Mira: aquí está a ${NOME_LETRA[it.l]}.`); seguinte(false); } } });
  } else if(it.tipo==='comeza'){
    texto=GL.comeza(it.w);
    s.innerHTML=`<div class="card preg letras-ex">${cab}<h2>${esc(texto)}</h2><button class="altavoz" type="button" id="ltOir" aria-label="Escoitar">${ic('altavoz')}</button>
      <div class="letras-pal"><span class="ft">${imgHTML(it.k,true)}</span><div class="pal-grande ${claseTexto()}">${esc(it.w)}</div></div>
      <div class="ops-letra">${it.ops.map(x=>`<button type="button" class="op-l ${claseTexto()}" data-x="${x}">${x}</button>`).join('')}</div></div>`;
  } else {
    texto = it.tipo==='silaba' ? GL.silaba(it.l) : GL.oe;
    s.innerHTML=`<div class="card preg letras-ex">${cab}<h2>${esc(texto)}</h2><button class="altavoz" type="button" id="ltOir" aria-label="Escoitar">${ic('altavoz')}</button>
      <div class="ops-letra silabas">${it.ops.map(x=>`<button type="button" class="op-l ${claseTexto()}" data-x="${x}">${x}</button>`).join('')}</div></div>`;
  }
  if(it.tipo!=='toca'){
    const boa = it.tipo==='comeza' ? it.l : it.boa;
    $$('#s-letrasitem .op-l').forEach(b=>b.onclick=()=>{ if(feito) return;
      if(b.dataset.x===boa){ b.classList.add('bien'); $$('#s-letrasitem .op-l').forEach(x=>x.disabled=true); sonido('bien');
        dicirGL(benGL()+' '+(it.tipo==='comeza'?`«${it.w}» comeza pola ${NOME_LETRA[it.l]}.`:it.tipo==='silaba'?`«${boa}» ten a ${NOME_LETRA[it.l]}.`:boa+'.')); seguinte(erros===0); }
      else { erros++; b.classList.add('mal'); b.disabled=true; sonido('mal'); dicirGL(GL.outra);
        if(erros>=2){ const bb=$(`#s-letrasitem .op-l[data-x="${boa}"]`); bb.classList.add('bien'); $$('#s-letrasitem .op-l').forEach(x=>x.disabled=true); seguinte(false); } } });
  }
  const oir = it.tipo==='oe' ? ()=>decirVarias([[GL.oe,'gl'],[it.boa,'gl']]) : ()=>dicirGL(texto);
  $('#ltOir').onclick=oir; setTimeout(oir, 300);
}});
definir('letrasfin', {nav:'repaso', pintar(){
  const bien=letr.res.filter(r=>r.ok).length; const ls=[...new Set(letr.res.map(r=>r.l))];
  const _ant=typeof fotoPremios==='function'?fotoPremios():null;
  aj.letrasLog=aj.letrasLog||[]; aj.letrasLog.push({f:new Date().toISOString(), n:letr.res.length, bien, letras:ls, mal:[...new Set(letr.res.filter(r=>!r.ok).map(r=>r.l))]}); aj.letrasLog=aj.letrasLog.slice(-2000); guardarAj();
  $('#s-letrasfin').innerHTML=`<div class="card buen-trabajo"><h1>Bo traballo!</h1><p class="sub">${bien} de ${letr.res.length} á primeira.</p>${typeof premioChipHTML==='function'?premioChipHTML(_ant):''}
    <div class="letras-res">${ls.map(l=>{ const rs=letr.res.filter(r=>r.l===l); const ok=rs.every(r=>r.ok); return `<span class="letra-res ${ok?'ok':'medio'} ${claseTexto()}">${l}<small>${NOME_LETRA[l]}</small></span>`; }).join('')}</div>${libroSVG()}
    <div class="botones" style="max-width:640px;margin:0 auto"><button class="btn btn-p btn-g" type="button" data-ir="inicio">${ic('casa')} Volver ao inicio</button><button class="btn btn-borde btn-g" type="button" id="ltOutra">🔤 Outra rolda</button></div></div>`;
  $('#ltOutra').onclick=empezarLetras;
  confeti($('#s-letrasfin .buen-trabajo')); sonido('cromo'); dicirGL(`Bo traballo, ${nombre()}!`);
  setTimeout(()=>{ if(actual==='letrasfin') comprobarPremios(); }, 2500);
}});
function tarjetaLetrasHTML(){
  const st=aj.letras||{}; const custan=LETRAS_GL.filter(l=>st[l] && st[l].mal>st[l].ok/2);
  return `<div class="card bloque letras-tarjeta"><div><b style="font-size:1.4rem">🔤 As letras <span class="chip">Galego</span></b><p class="nota">Atopa as vogais e as letras l, m, p, t, d, n e f dentro das palabras e das sílabas.</p>
    <div class="letras-mini ${claseTexto()}">${LETRAS_GL.map(l=>`<span class="${custan.includes(l)?'custa':''}">${l}</span>`).join('')}</div></div>
    <button class="btn btn-p btn-xl" type="button" id="btnLetras">Xogar ${ic('flecha')}</button></div>`;
}
/* familia: como vai con cada letra */
function letrasAdultoHTML(p){
  const c=cfgDe(p), st=c.letras||{}, log=c.letrasLog||[];
  return `<div class="card bloque" style="margin-top:18px"><h3 style="margin-bottom:6px">${esc(p.nombre)} · As letras (galego)</h3><p class="nota" style="margin-bottom:10px">${log.length?`${log.length} roldas · última o ${esc(fechaCorta(log[log.length-1].f))}.`:'Aínda non xogou.'} Verde: a recoñece; laranxa: aínda lle custa.</p>
    <div class="letras-res">${LETRAS_GL.map(l=>{ const s=st[l]; if(!s) return `<span class="letra-res ${claseTexto()}">${l}<small>–</small></span>`; const pct=Math.round(100*s.ok/(s.ok+s.mal)); return `<span class="letra-res ${pct>=75?'ok':'medio'} ${claseTexto()}">${l}<small>${pct} %</small></span>`; }).join('')}</div></div>`;
}
