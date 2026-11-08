/* v0.8.0: campaign + seeded endless mode. Performance and progress remain local. */
(function(){
'use strict';
const $=id=>document.getElementById(id),C=MultidaoInfinite;
try{
 let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('storage unavailable')}};}
 let save=SiegeProgress.load(storage);
 const game=new C.Game({level:save.selected,mode:save.mode,runSeed:save.endless.seed,wave:save.endless.checkpoint}),renderer=new SiegeRenderer($('game')),audio=new SiegeAudio();
 audio.setEffects(!!save.sound);audio.setMusic(!!save.music);audio.setVolume(Number(save.volume));renderer.reducedMotion=!save.motion;
 let pointer=null,last=performance.now(),lastDraw=0,lastUI=0,frameMean=33,slowFrames=0,draws=0,resultShown=false,toastUntil=0,lastEvent=0,damage=0,damageUntil=0;
 let lastSimulationCost=0;
 let quality=['auto','hd','lite'].includes(save.quality)?save.quality:'auto';
 let storageAvailable=SiegeProgress.save(storage,save);
 const write=()=>{storageAvailable=SiegeProgress.save(storage,save);return storageAvailable;};
 const gate=document.createElement('div');gate.className='gate';$('labels').append(gate);
 const towers=game.towers.map(()=>{const el=document.createElement('button');el.className='tower-label';$('labels').append(el);return el;});
 const floating=document.createElement('div');floating.className='damage';floating.hidden=true;$('labels').append(floating);
 function setText(id,value){const el=$(id),s=String(value);if(el.textContent!==s)el.textContent=s;}
 function renderQuality(){renderer.quality=quality==='hd'?1.25:quality==='lite'?.65:1;save.quality=quality;setText('quality',quality==='hd'?'HD':quality==='lite'?'LEVE':'AUTO');renderer.resize();draw();}
 function draw(){renderer.render(game);labels();draws++;}
 function labels(){const g=game.gates[0],p=renderer.project(g.x,1.5,g.z),a=renderer.project(g.x-g.w*.46,1.5,g.z),b=renderer.project(g.x+g.w*.46,1.5,g.z);gate.textContent='×'+g.m;gate.style.left=p.x+'px';gate.style.top=p.y+'px';gate.style.width=Math.max(50,b.x-a.x)+'px';gate.className='gate '+(g.color==='violet'?'violet':'gold')+(g.flash>.04?' flash':'');
  game.towers.forEach((t,i)=>{const e=towers[i],q=renderer.project(t.x,2.75,t.z);e.hidden=t.state!=='active';if(e.hidden)return;e.style.left=q.x+'px';e.style.top=q.y+'px';e.classList.toggle('targeted',game.target()?.id===t.id);const text=(t.kind==='cannon'?'+1 CANHÃO':'+99 SOLDADOS')+'\n'+Math.max(0,t.hp)+' / '+t.maxHP;if(e.textContent!==text)e.textContent=text;e.setAttribute('aria-label','Mirar '+text);e.onclick=()=>{if(game.state==='playing'){game.aim(t.x);$('aim').value=game.aimX;}};});
  if(damageUntil>game.time&&!['dormant','defeated'].includes(game.boss.state)){const p=renderer.project(game.boss.x,3.4,game.boss.z);floating.hidden=false;floating.textContent='−'+damage;floating.style.left=p.x+'px';floating.style.top=(p.y-10*(1-(damageUntil-game.time)/.5))+'px';}else floating.hidden=true;
 }
 function events(){for(const e of game.events){if(e.id<=lastEvent)continue;lastEvent=e.id;
  if(e.type==='upgrade')toast('BATERIA AMPLIADA · '+e.cannons+' CANHÕES');
  if(e.type==='reinforce')toast('+99 REFORÇOS A CAMINHO');
  if(e.type==='bossEntry')toast(game.stage.boss.toUpperCase()+' CHEGOU');
  if(e.type==='bossDefeated')toast('COMANDANTE DERROTADO');
  if(e.type==='bossHit'){if(game.time>damageUntil)damage=0;damage+=e.damage;damageUntil=game.time+.5;}
 }}
 function toast(text){setText('toast',text);$('toast').hidden=false;toastUntil=game.time+2;}
 function hud(){setText('stage-name',(game.mode==='endless'?'CERCO INFINITO · ':'')+game.stage.name);setText('level',game.mode==='endless'?'ONDA '+game.wave:game.level+' / '+C.stages.length);setText('mode-name',game.mode==='endless'?'INFINITO':'CAMPANHA');setText('record',save.endless.best);$('endless-record').hidden=game.mode!=='endless';setText('allies',game.blue.length.toLocaleString('pt-BR'));setText('enemies',game.red.length.toLocaleString('pt-BR'));setText('ammo',game.ammo);setText('health',Math.max(0,game.health)+'/5');setText('kills',game.metrics.kills);setText('time',Math.max(0,Math.ceil(game.duration-game.time))+'s');setText('battery',game.cannons);setText('pending',game.queue.length);
  const target=game.target();setText('hint',target?'ALVO: '+(target.kind==='cannon'?'+1 CANHÃO':'+99 SOLDADOS'):'ROTA ×'+game.cfg.gate+' · ARRASTE PARA MIRAR');
  $('pause').disabled=game.state!=='playing';$('burst').disabled=game.state!=='playing'||game.burstCooldown>0||!game.ammo;
  setText('burst',game.burstLeft>0?'RAJADA!':game.burstCooldown>0?'RAJADA '+Math.ceil(game.burstCooldown)+'s':'RAJADA');$('burst').classList.toggle('active',game.burstLeft>0);
  const b=game.boss;$('bossbar').hidden=b.state==='dormant';setText('boss-name',b.state==='defeated'?'COMANDANTE DERROTADO':game.stage.boss.toUpperCase());setText('boss-hp',Math.max(0,b.hp)+' / '+b.maxHP);$('boss-fill').style.width=Math.max(0,b.hp)/b.maxHP*100+'%';$('warning').hidden=!['windup','strike'].includes(b.state);setText('warning',b.state==='windup'?'GOLPE EM '+Math.max(.1,b.timer).toFixed(1)+'s':'IMPACTO');
  $('progress').style.width=(game.metrics.kills+game.metrics.breaches)/game.initialEnemies*100+'%';if(game.time>toastUntil)$('toast').hidden=true;
 }
 function intro(){resultShown=false;setText('result-stars','');$('overlay').hidden=false;$('result').hidden=true;setText('eyebrow',(game.mode==='endless'?'ONDA '+game.wave+' · CERCO INFINITO':'FASE '+game.level+' / '+C.stages.length)+' · v'+C.VERSION);setText('title',game.stage.name);setText('description',game.stage.description+' '+game.initialEnemies.toLocaleString('pt-BR')+' invasores e portão ×'+game.cfg.gate+'.');setText('start',game.mode==='endless'?'INICIAR A ONDA':'INICIAR A FASE');setText('fine','Mire nas torres para conquistar canhões e reforços. Volte ao centro para multiplicar tropas. Rajada acelera os tiros por 3 segundos, sem munição extra.');$('retry').hidden=true;}
 function select(level){audio.reset();game.reset(level);if(game.mode==='campaign')save.selected=game.level;else save.endless.checkpoint=game.wave;save.mode=game.mode;write();renderer.rebuild(game);lastEvent=0;damage=0;damageUntil=0;toastUntil=0;$('toast').hidden=true;pointer=null;$('aim').value=0;intro();hud();draw();}
 async function unlock(){await audio.unlock();if(document.hidden)await audio.suspend();settings();}
 function begin(){game.start();resultShown=false;last=performance.now();lastDraw=0;$('overlay').hidden=true;unlock();hud();draw();}
 function pause(){if(game.state!=='playing')return;game.pause();audio.suspend();pointer=null;$('overlay').hidden=false;setText('eyebrow','PAUSA · '+game.stage.name);setText('title','A batalha aguarda.');setText('description','Simulação e áudio estão pausados.');setText('start','CONTINUAR');setText('fine','Você pode escolher outra fase ou retomar esta partida.');$('result').hidden=true;$('retry').hidden=false;hud();}
 function resume(){if(game.state!=='paused')return;game.pause();last=performance.now();$('overlay').hidden=true;unlock();hud();}
 function result(){if(resultShown||!['won','lost'].includes(game.state))return;resultShown=true;const win=game.state==='won',final=win&&game.mode==='campaign'&&game.level===C.stages.length;let stars=0;
  if(win){stars=game.health>=4?3:game.health>=2?2:1;if(game.mode==='endless'){save.endless.best=Math.max(save.endless.best,game.wave);save.endless.checkpoint=game.wave+1;}else{const prior=save.completed[game.stage.id]||{};save.completed[game.stage.id]={stars:Math.max(prior.stars||0,stars),time:Math.min(prior.time||Infinity,game.time)};}write();}
  $('overlay').hidden=false;$('result').hidden=false;setText('eyebrow',win?(game.mode==='endless'?'ONDA '+game.wave+' CONCLUÍDA':'FASE CONCLUÍDA'):'CERCO ENCERRADO');setText('title',final?'Campanha concluída!':win?'O reino resistiu.':'A defesa caiu.');setText('description',game.reason);setText('result-stars',win?'★'.repeat(stars)+'☆'.repeat(3-stars):'');setText('result-kills',game.metrics.kills.toLocaleString('pt-BR'));setText('result-time',game.time.toFixed(1)+'s');setText('start',final?'VOLTAR À CAMPANHA':win?(game.mode==='endless'?'PRÓXIMA ONDA':'PRÓXIMA FASE'):'TENTAR NOVAMENTE');$('retry').hidden=false;setText('fine',game.metrics.shots+' tiros · '+game.metrics.clones+' clones no campo · '+game.metrics.reinforcements+' reforços · '+(storageAvailable?'progresso salvo neste navegador.':'salvamento indisponível neste navegador.'));
 }
 function openMap(){pause();$('save-warning').hidden=storageAvailable;setText('resume-infinite','RETOMAR ONDA '+save.endless.checkpoint);setText('best-infinite','RECORDE · '+save.endless.best+' ONDAS');setText('seed-label','Expedição '+save.endless.seed.toString(16).toUpperCase()+' · geração 1');$('map').hidden=false;$('stage-list').replaceChildren();C.stages.forEach((s,i)=>{const b=document.createElement('button');b.className='stage-card '+s.theme;const best=save.completed[s.id];b.textContent=String(i+1).padStart(2,'0')+'  '+s.name+'\n×'+s.gate+' · '+s.enemies.toLocaleString('pt-BR')+' invasores'+(best?' · '+'★'.repeat(Math.max(1,Math.min(3,best.stars))):'');b.onclick=()=>{$('map').hidden=true;game.mode='campaign';select(i+1);};$('stage-list').append(b);});}
 function settings(){ $('music').checked=audio.musicEnabled;$('effects').checked=audio.enabled;$('motion').checked=!renderer.reducedMotion;$('volume').value=Math.round(audio.volume*100);setText('volume-value',Math.round(audio.volume*100)+'%');setText('audio-status',audio.available?'Sons originais gerados pelo jogo.':'Áudio indisponível; a partida continua sem som.');}
 function saveSettings(){save.sound=audio.enabled;save.music=audio.musicEnabled;save.volume=audio.volume;save.motion=!renderer.reducedMotion;write();settings();}
 $('start').onclick=()=>{if(game.state==='paused')resume();else if(game.state==='won'&&game.mode==='campaign'&&game.level===C.stages.length)openMap();else{if(game.state==='won')select(game.level+1);else if(game.state==='lost')select(game.level);begin();}};
 $('retry').onclick=()=>{select(game.level);begin();};$('restart').onclick=()=>{select(game.level);begin();};$('pause').onclick=pause;
 $('resume-infinite').onclick=()=>{game.mode='endless';game.runSeed=save.endless.seed;$('map').hidden=true;select(save.endless.checkpoint);};$('new-infinite').onclick=()=>{const n=new Uint32Array(1);if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(n);else n[0]=Date.now()>>>0;save.endless.seed=n[0];save.endless.checkpoint=1;game.mode='endless';game.runSeed=n[0];$('map').hidden=true;select(1);};$('map-button').onclick=openMap;$('choose').onclick=openMap;$('close-map').onclick=()=>$('map').hidden=true;
 $('sound').onclick=()=>{pause();$('settings').hidden=false;settings();};$('close-settings').onclick=()=>$('settings').hidden=true;
 $('music').onchange=e=>{audio.setMusic(e.target.checked);saveSettings();};$('effects').onchange=e=>{audio.setEffects(e.target.checked);saveSettings();};$('motion').onchange=e=>{renderer.reducedMotion=!e.target.checked;saveSettings();};$('volume').oninput=e=>{audio.setVolume(Number(e.target.value)/100);saveSettings();};
 $('quality').onclick=()=>{quality=quality==='auto'?'hd':quality==='hd'?'lite':'auto';renderQuality();slowFrames=0;write();};
 $('burst').onclick=()=>{if(game.activateBurst()){toast('RAJADA · MESMO CUSTO POR TIRO');hud();}};
 $('aim').oninput=e=>{if(game.state==='playing')game.aim(Number(e.target.value));};
 const canvas=$('game');const aim=e=>{game.aim(renderer.pointerX(e.clientX));$('aim').value=game.aimX;};
 canvas.addEventListener('pointerdown',e=>{if(game.state!=='playing'||pointer!==null)return;pointer=e.pointerId;canvas.setPointerCapture(pointer);aim(e);e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId===pointer&&game.state==='playing'){aim(e);e.preventDefault();}});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(e.pointerId===pointer)pointer=null;});
 addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(e.key==='Escape'){$('settings').hidden=true;$('map').hidden=true;return;}if(game.state==='playing'&&['ArrowLeft','ArrowRight'].includes(e.key)){game.aim(game.aimX+(e.key==='ArrowLeft'?-.6:.6));$('aim').value=game.aimX;e.preventDefault();}if(e.code==='Space'){if(game.state==='playing')pause();else if(game.state==='paused')resume();e.preventDefault();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();audio.suspend();}last=performance.now();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();audio.suspend();showGameError('O navegador interrompeu o 3D. Recarregue; o modo LEVE reduz a resolução.');});
 const resize=()=>{renderer.resize();draw();};new ResizeObserver(resize).observe($('stage'));addEventListener('resize',resize);
 function frame(now){const dt=(now-last)/1000;last=now;if(game.state==='playing'){
   const simStart=performance.now();game.update(dt);lastSimulationCost=performance.now()-simStart;events();audio.update(game);
   if(now-lastUI>=100){hud();lastUI=now;}
   if(now-lastDraw>=14){const delta=now-lastDraw;frameMean=frameMean*.96+Math.min(250,delta)*.04;if(quality==='auto'&&delta>40){slowFrames++;if(slowFrames>90&&renderer.quality>.65){renderer.quality=.65;renderer.resize();setText('quality','AUTO · LEVE');}}lastDraw=now;draw();}
   result();
  }else audio.update(game);requestAnimationFrame(frame);
 }
 renderer.rebuild(game);renderQuality();intro();settings();hud();requestAnimationFrame(frame);
 if(new URLSearchParams(location.search).get('test')==='1'||rootTest())window.__gameTest={game,renderer,audio,select,begin,pause,resume,openMap,result,save,write,loadEndless(wave,seed=C.DEFAULT_SEED){game.mode='endless';game.runSeed=seed;select(wave);},snapshot:()=>({...game.snapshot(),audio:audio.snapshot(),render:renderer.lastStats,renderIntervalMean:frameMean,simulationCpuMs:lastSimulationCost,draws}),get pointer(){return pointer;},advance(seconds){for(let i=0;i<Math.round(seconds/C.STEP)&&game.state==='playing';i++)game.step();game.visualAlpha=1;events();hud();audio.update(game);draw();result();},refresh(){events();hud();draw();result();},projected(){return {cannon:renderer.project(game.gunX,0,2.3),gate:renderer.project(game.gates[0].x,1.5,game.gates[0].z)};}};
 function rootTest(){return window.__TEST_MODE__===true;}
}catch(e){showGameError(e.message||String(e));console.error(e);}
})();
