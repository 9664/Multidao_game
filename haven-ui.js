/* Secret-stage controller. All interactions are explicit; main battle stays paused. */
(function(root){
'use strict';
const H=root.MultidaoHaven,$=id=>document.getElementById(id);
class Controller{
 constructor({renderer,audio,storage,pause,redraw}){this.renderer=renderer;this.audio=audio;this.storage=storage;this.pauseMain=pause;this.redrawMain=redraw;this.profile=H.load(storage);this.active=false;this.world=null;this.view=null;this.pointer=null;this.saved=H.save(storage,this.profile);this.lastSound=0;
  $('secret-map-entry').onclick=()=>this.enter();$('secret-result-entry').onclick=()=>this.enter();$('base-exit').onclick=()=>this.exit();
  for(const key of Object.keys(H.BUILDINGS))$('build-'+key).onclick=()=>{const r=this.world.build(key);if(r.ok)this.persist();this.hud();};
  $('base-raid').onclick=()=>{if(this.world.startRaid()){this.audio.unlock();this.audioSeenKills=0;}this.hud();};
  $('base-pause').onclick=()=>{this.world.pause();if(this.world.state==='paused')this.audio.suspend();else this.audio.unlock();this.hud();};
  const canvas=renderer.canvas;
  const aim=e=>{const p=this.view.ground(e.clientX,e.clientY);this.world.aim(p.x,p.z);};
  canvas.addEventListener('pointerdown',e=>{if(!this.active||this.pointer!==null)return;this.pointer=e.pointerId;canvas.setPointerCapture(e.pointerId);aim(e);e.preventDefault();});
  canvas.addEventListener('pointermove',e=>{if(this.active&&this.pointer===e.pointerId){aim(e);e.preventDefault();}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(e.pointerId===this.pointer)this.pointer=null;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.active&&this.world.state==='raid'){this.world.pause();this.audio.suspend();this.hud();}});
 }
 persist(){this.saved=H.save(this.storage,this.profile);if(this.world)this.world.dirty=false;return this.saved;}
 settle(id,game){const reward=H.claimBattle(this.profile,id,{...game.snapshot(),boss:game.boss});this.persist();this.syncMenu();return reward;}
 syncMenu(){const opened=H.unlock(this.profile);$('secret-map-entry').disabled=!opened;$('secret-result-entry').hidden=!opened;$('secret-state').textContent=opened?'PASSAGEM REVELADA':'SELOS '+this.profile.seals+' / 3';$('secret-description').textContent=opened?'Construa sua fortaleza, recolha ouro com o comandante e defenda a base.':'Destrua três torres nos cercos para revelar o Refúgio Secreto. As moedas são creditadas no resultado da batalha.';$('secret-wallet').textContent=this.profile.coins;$('wallet').textContent=this.profile.coins;}
 enter(){if(!H.unlock(this.profile))return false;this.pauseMain();this.audio.suspend();if(!this.world)this.world=new H.Game(this.profile);if(!this.view)this.view=new root.MultidaoHavenView(this.renderer);this.previousClear=Array.from(this.renderer.gl.getParameter(this.renderer.gl.COLOR_CLEAR_VALUE));this.active=true;this.pointer=null;$('app').classList.add('visiting-base');$('overlay').hidden=true;$('map').hidden=true;$('settings').hidden=true;$('base-ui').hidden=false;this.view.render(this.world,0);this.hud();return true;}
 exit(){if(!this.active)return;if(this.world.state==='raid')this.world.pause();this.persist();this.audio.suspend();this.active=false;this.pointer=null;$('app').classList.remove('visiting-base');$('base-ui').hidden=true;$('overlay').hidden=false;this.renderer.gl.clearColor(...(this.previousClear||[.74,.81,.85,1]));this.syncMenu();this.redrawMain();}
 hud(){if(!this.world)return;const s=this.world.snapshot();$('base-gold').textContent=s.coins;$('base-hp').textContent=Math.max(0,s.hp)+' / '+this.world.maxHP();$('base-round').textContent=this.world.raid;$('base-message').textContent=this.world.message;$('base-collect').textContent=s.dropped?'OURO NO TERRENO · '+s.dropped+' MONTES':'TOQUE NO TERRENO PARA MOVER O COMANDANTE';$('base-raid').disabled=['raid','paused'].includes(s.state);$('base-raid').textContent=s.state==='raid'?'INVASÃO EM CURSO':s.state==='won'?'NOVA INVASÃO':'DEFENDER A BASE';$('base-pause').disabled=!['raid','paused'].includes(s.state);$('base-pause').textContent=s.state==='paused'?'CONTINUAR':'PAUSAR';$('base-save').textContent=this.saved?'Progresso local salvo.':'Salvamento indisponível neste navegador.';
  for(const [key,b] of Object.entries(H.BUILDINGS)){const level=s.buildings[key],cost=b.costs[level],e=$('build-'+key);e.textContent=b.name+' · '+level+'/3\n'+(level===3?'NÍVEL MÁXIMO':(level?'MELHORAR':'CONSTRUIR')+' · '+cost+' moedas');e.disabled=level===3||['raid','paused'].includes(s.state);e.classList.toggle('affordable',Number.isFinite(cost)&&cost<=s.coins);}
 }
 tick(dt){if(!this.active)return;const gold=this.profile.coins,kills=this.world.kills,was=this.world.state;this.world.update(dt);this.view.render(this.world,dt);if(this.world.dirty)this.persist();this.hud();
  const a=this.audio,c=a.ctx;if(c&&c.state==='running'&&a.enabled){const t=c.currentTime;if(this.profile.coins>gold&&t>this.lastSound+.12){a.gate(t,1);this.lastSound=t;}else if(this.world.kills>kills&&t>this.lastSound+.12){a.impact(t,.6);this.lastSound=t;}if(was==='raid'&&this.world.state==='won'&&a.musicEnabled)a.result(t,true);}
 }
}
root.MultidaoHavenController=Controller;
})(globalThis);
