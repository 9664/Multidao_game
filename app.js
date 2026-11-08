/* Browser integration: controls, lifecycle, HUD, audio and reproducible test hooks. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
try{
 const game=new Multidao.Game(),renderer=new MultidaoRenderer($('game'));
 let last=performance.now(),resultShown=false,pointer=null,sound=false,audio=null,lastShots=0,lastKills=0;
 renderer.rebuild(game);
 const gateLabels=game.gates.map(()=>{const el=document.createElement('div');el.className='gate';$('labels').append(el);return el;});
 function labels(){
  game.gates.forEach((g,i)=>{const el=gateLabels[i],p=renderer.project(g.x,1.64,g.z);el.textContent='×'+g.m;
   el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.width=Math.max(36,Math.min(115,g.w/(renderer.halfW*2)*renderer.width*.90))+'px';el.classList.toggle('flash',g.flash>0);});
 }
 function resize(){renderer.resize();labels();renderer.render(game);}
 new ResizeObserver(resize).observe($('stage'));addEventListener('resize',resize);
 function beep(freq,duration,volume){
  if(!sound)return;
  try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
   const o=audio.createOscillator(),gain=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.45,audio.currentTime+duration);gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(gain);gain.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
  }catch{sound=false;$('sound').textContent='SOM OFF';}
 }
 function hud(){
  const s=game.snapshot();$('level').textContent=s.level;$('allies').textContent=s.blue;$('enemies').textContent=s.enemies;
  $('kills').textContent=s.kills;$('health').textContent=Math.max(0,s.health)+' / 3';$('ammo').textContent=s.ammo;$('time').textContent=Math.max(0,Math.ceil(90-s.time))+'s';
  $('progress').style.width=((s.kills+s.breaches)/s.initialEnemies*100)+'%';$('pause').disabled=!['playing','paused'].includes(s.state);
  $('hint').textContent=s.ammo?'Arraste o campo ou a mira • disparo automático':'Cargas esgotadas • suas tropas continuam lutando';
  if(s.shots>lastShots)beep(140,.09,.035);if(s.kills>lastKills)beep(320,.08,.025);lastShots=s.shots;lastKills=s.kills;
 }
 function showResult(){
  if(resultShown||!['won','lost'].includes(game.state))return;resultShown=true;
  $('overlay').hidden=false;$('title').textContent=game.state==='won'?'O reino resistiu!':'O cerco venceu.';
  $('description').textContent=game.reason+' '+game.metrics.kills+' inimigos eliminados em '+Math.ceil(game.time)+' segundos.';
  $('start').textContent=game.state==='won'?'PRÓXIMA FASE':'TENTAR NOVAMENTE';$('retry').hidden=game.state!=='won';
  $('fine').textContent='Fase '+game.level+' • '+game.metrics.shots+' disparos • '+game.metrics.multiplied+' reforços nos portões • v'+Multidao.VERSION;
 }
 function begin(level){
  game.reset(level);game.start();renderer.rebuild(game);$('aim').value=game.aimX;
  resultShown=false;lastShots=0;lastKills=0;last=performance.now();$('overlay').hidden=true;pointer=null;labels();hud();renderer.render(game);
 }
 function pause(){
  if(!['playing','paused'].includes(game.state))return;game.pause();last=performance.now();
  if(game.state==='paused'){$('overlay').hidden=false;$('title').textContent='Cerco em pausa.';$('description').textContent='A batalha está parada. Continue quando estiver pronto.';$('start').textContent='CONTINUAR';$('retry').hidden=false;$('fine').textContent='Nenhuma tropa se move enquanto o jogo está pausado.';}
  else $('overlay').hidden=true;
  hud();
 }
 $('start').onclick=()=>{if(game.state==='paused')pause();else begin(game.state==='won'?game.level+1:game.level);};
 $('retry').onclick=()=>begin(game.level);$('restart').onclick=()=>begin(game.level);$('pause').onclick=pause;
 $('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'SOM ON':'SOM OFF';$('sound').setAttribute('aria-label',sound?'Desativar som':'Ativar som');if(sound)beep(280,.08,.03);};
 $('quality').onclick=()=>{renderer.quality=renderer.quality===1?1.5:1;$('quality').textContent=renderer.quality===1?'LEVE':'HD';resize();};
 $('aim').oninput=e=>{game.aim(Number(e.target.value));};
 const canvas=$('game');
 function aim(e){game.aim(renderer.pointerX(e.clientX));$('aim').value=game.aimX;}
 canvas.addEventListener('pointerdown',e=>{if(game.state!=='playing'||pointer!==null)return;pointer=e.pointerId;canvas.setPointerCapture(pointer);aim(e);e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId===pointer&&game.state==='playing'){aim(e);e.preventDefault();}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(e.pointerId===pointer)pointer=null;});
 addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){if(game.state==='playing'){game.aim(game.aimX+(e.key==='ArrowLeft'?-.6:.6));$('aim').value=game.aimX;e.preventDefault();}}else if(e.code==='Space'){e.preventDefault();pause();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.state==='playing')pause();last=performance.now();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(game.state==='playing')game.pause();showGameError('O navegador interrompeu a renderização 3D. Recarregue o jogo; o botão LEVE reduz a resolução.');});
 function frame(now){
  const dt=(now-last)/1000;last=now;game.update(dt);hud();labels();renderer.render(game);showResult();requestAnimationFrame(frame);
 }
 resize();hud();requestAnimationFrame(frame);
 // Test mode uses the same simulation and renderer; no alternative combat rules.
 if(new URLSearchParams(location.search).get('test')==='1'||window.__TEST_MODE__===true)window.__gameTest={
  game,renderer,snapshot:()=>game.snapshot(),begin,advance(seconds){for(let i=0;i<Math.round(seconds/Multidao.STEP)&&game.state==='playing';i++)game.step();hud();labels();renderer.render(game);showResult();},
  projected(){return {cannon:renderer.project(game.gunX,0,3.65),front:renderer.project(0,1,-24),gates:game.gates.map(g=>renderer.project(g.x,1.64,g.z))};}
 };
}catch(error){showGameError(error.message||String(error));console.error(error);}
})();
