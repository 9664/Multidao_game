/* Grande Cerco 0.6.0 — mobile controls, audio lifecycle and truthful battle HUD. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
try{
 const game=new Multidao.Game(),renderer=new MultidaoRenderer($('game')),audio=new SiegeAudio();
 let prefs={effects:true,music:true,volume:.58,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
 try{const saved=JSON.parse(localStorage.getItem('multidao-settings-v05')||'null');if(saved)prefs={...prefs,...saved};}catch{}
 audio.setEffects(prefs.effects);audio.setMusic(prefs.music);audio.setVolume(prefs.volume);renderer.reducedMotion=!!prefs.reduced;
 let last=performance.now(),resultShown=false,pointer=null,lastPhase='',frames=0,frameMs=16.7;
 renderer.rebuild(game);
 const gateLabels=game.gates.map(()=>{const e=document.createElement('div');e.className='gate';$('labels').append(e);return e;});
 function labels(){
  game.gates.forEach((g,i)=>{const el=gateLabels[i],p=renderer.project(g.x,1.5,g.z),l=renderer.project(g.x-g.w*.43,1.5,g.z),r=renderer.project(g.x+g.w*.43,1.5,g.z);
   el.textContent='×'+g.m;el.classList.toggle('gold',g.color==='gold');el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.width=Math.max(34,Math.min(155,r.x-l.x))+'px';el.classList.toggle('flash',g.flash>.04);});
 }
 function draw(){renderer.render(game);labels();}
 function resize(){renderer.resize();draw();}
 new ResizeObserver(resize).observe($('stage'));addEventListener('resize',resize);
 function settings(){
  $('music').checked=audio.musicEnabled;$('effects').checked=audio.enabled;$('volume').value=Math.round(audio.volume*100);$('motion').checked=!renderer.reducedMotion;
  $('volume-value').textContent=Math.round(audio.volume*100)+'%';$('sound').classList.toggle('muted',!audio.enabled&&!audio.musicEnabled);
  $('audio-status').textContent=audio.available?'Sons originais gerados pelo jogo.':'Áudio indisponível neste navegador. O jogo continua sem som.';
 }
 function save(){prefs={effects:audio.enabled,music:audio.musicEnabled,volume:audio.volume,reduced:renderer.reducedMotion};try{localStorage.setItem('multidao-settings-v05',JSON.stringify(prefs));}catch{}settings();}
 async function unlock(){await audio.unlock();if(document.hidden)await audio.suspend();settings();}
 function hud(){
  const s=game.snapshot();$('level').textContent=s.level;$('allies').textContent=s.blue.toLocaleString('pt-BR');$('enemies').textContent=s.enemies.toLocaleString('pt-BR');
  $('kills').textContent=s.kills;$('health').textContent=Math.max(0,s.health)+' / 5';$('ammo').textContent=s.ammo;$('time').textContent=Math.max(0,Math.ceil(game.duration-s.time))+'s';
  $('progress').style.width=((s.kills+s.breaches)/s.initialEnemies*100)+'%';$('pause').disabled=!['playing','paused'].includes(s.state);
  $('hint').textContent=s.ammo?'Arraste para mirar · disparo automático':'Sem cargas · suas tropas continuam lutando';
  $('phase-title').textContent=s.phase==='assemble'?'ESCOLHA SUA ROTA':s.phase==='clash'?'DEFENDA A MURALHA':'ÚLTIMA INVESTIDA';
  $('phase-sub').textContent=s.time<8?'A horda avança em '+Math.ceil(8-s.time)+'s':s.phase==='assemble'?'Escolha os portões e prepare o confronto':s.phase==='clash'?'A frente de batalha está em disputa':'Quebre a última linha de defesa';
  if(lastPhase!==s.phase){lastPhase=s.phase;$('phase').classList.remove('announce');void $('phase').offsetWidth;if(!renderer.reducedMotion)$('phase').classList.add('announce');}
 }
 function showResult(){
  if(resultShown||!['won','lost'].includes(game.state))return;resultShown=true;audio.update(game);
  $('overlay').hidden=false;$('title').innerHTML=game.state==='won'?'O reino<br>resistiu.':'O cerco<br>venceu.';
  $('description').textContent=game.reason;$('result-stats').hidden=false;$('result-kills').textContent=game.metrics.kills;$('result-time').textContent=Math.ceil(game.time)+'s';
  $('start').textContent=game.state==='won'?'PRÓXIMO CERCO':'TENTAR OUTRA VEZ';$('retry').hidden=game.state!=='won';
  $('fine').textContent=game.metrics.shots+' disparos · '+game.metrics.multiplied+' reforços multiplicados · '+game.metrics.maxBlue+' aliados no pico';
 }
 function begin(level){
  audio.reset();game.reset(level);game.start();renderer.rebuild(game);$('aim').value=game.aimX;resultShown=false;lastPhase='';last=performance.now();
  $('overlay').hidden=true;$('settings').hidden=true;$('result-stats').hidden=true;pointer=null;hud();draw();
 }
 function pause(){
  if(!['playing','paused'].includes(game.state))return;game.pause();last=performance.now();
  if(game.state==='paused'){
   audio.suspend();$('overlay').hidden=false;$('title').innerHTML='Cerco<br>em pausa.';$('description').textContent='O combate e o áudio estão parados.';
   $('start').textContent='CONTINUAR';$('retry').hidden=false;$('result-stats').hidden=true;$('fine').textContent='Suas tropas aguardam seu comando.';
  }else{$('overlay').hidden=true;unlock();}
  hud();
 }
 $('start').onclick=()=>{if(game.state==='paused')pause();else{begin(game.state==='won'?game.level+1:game.level);unlock();}};
 $('retry').onclick=()=>{begin(game.level);unlock();};$('restart').onclick=()=>{begin(game.level);unlock();};$('pause').onclick=pause;
 $('sound').onclick=()=>{$('settings').hidden=false;settings();};$('close-settings').onclick=()=>$('settings').hidden=true;
 $('music').onchange=e=>{audio.setMusic(e.target.checked);save();if(game.state==='playing')unlock();};
 $('effects').onchange=e=>{audio.setEffects(e.target.checked);save();if(game.state==='playing')unlock();};
 $('volume').oninput=e=>{audio.setVolume(Number(e.target.value)/100);save();};
 $('motion').onchange=e=>{renderer.reducedMotion=!e.target.checked;save();};
 $('quality').onclick=()=>{renderer.quality=renderer.quality===1?1.5:1;$('quality').textContent=renderer.quality===1?'LEVE':'HD';resize();};
 $('aim').oninput=e=>game.aim(Number(e.target.value));
 const canvas=$('game');function aim(e){game.aim(renderer.pointerX(e.clientX));$('aim').value=game.aimX;}
 canvas.addEventListener('pointerdown',e=>{if(game.state!=='playing'||pointer!==null)return;pointer=e.pointerId;canvas.setPointerCapture(pointer);aim(e);e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId===pointer&&game.state==='playing'){aim(e);e.preventDefault();}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(e.pointerId===pointer)pointer=null;});
 addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(e.key==='Escape'){$('settings').hidden=true;return;}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){if(game.state==='playing'){game.aim(game.aimX+(e.key==='ArrowLeft'?-.6:.6));$('aim').value=game.aimX;e.preventDefault();}}
  else if(e.code==='Space'){e.preventDefault();pause();}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(game.state==='playing')pause();else audio.suspend();}last=performance.now();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(game.state==='playing')game.pause();audio.suspend();showGameError('A renderização 3D foi interrompida. Recarregue o jogo; o botão LEVE reduz a resolução.');});
 function frame(now){
  const dt=(now-last)/1000;last=now;frameMs=frameMs*.97+Math.min(250,dt*1000)*.03;frames++;
  if(game.state==='playing'){game.update(dt);hud();audio.update(game);draw();showResult();}
  else audio.update(game);
  requestAnimationFrame(frame);
 }
 settings();resize();hud();requestAnimationFrame(frame);
 // Test hooks are opt-in and use exactly the same simulation, renderer and sound graph.
 if(new URLSearchParams(location.search).get('test')==='1'||window.__TEST_MODE__===true)window.__gameTest={
  game,renderer,audio,begin,snapshot:()=>({...game.snapshot(),audio:audio.snapshot(),render:renderer.lastStats,frameMs,frames}),
  advance(seconds){for(let i=0;i<Math.round(seconds/Multidao.STEP)&&game.state==='playing';i++)game.step();hud();audio.update(game);draw();showResult();},
  projected(){return {cannon:renderer.project(game.gunX,0,3.65),front:renderer.project(0,.7,-21),upper:renderer.project(0,.7,-32),gates:game.gates.map(g=>renderer.project(g.x,1.5,g.z))};}
 };
}catch(error){showGameError(error.message||String(error));console.error(error);}
})();
