/* 0.9.0 — shorter opening and rapid, individually charged cannon fire. */
(function(root,factory){const node=typeof module==='object'&&module.exports,api=factory(node?require('./endless'):root.MultidaoInfinite);if(node)module.exports=api;else root.MultidaoRush=api;})(globalThis,(Previous)=>{
'use strict';
const VERSION='0.9.0';
class Game extends Previous.Game{
 reset(number=1){
  super.reset(number);
  this.cfg.enemyDelay=0;
  // Ordinary and burst salvos remain staggered; one unit of ammo per barrel.
  this.baseSalvo=.38;this.cfg.salvoInterval=.38;this.cfg.stagger=.075;
  this.cfg.shellSpeed=32;this.cfg.blueSpeed=3.8;
  this.cfg.redSpeed=Math.min(1.20,this.cfg.redSpeed*1.20);
  this.cfg.bossEntryTime=18;this.duration=70;
  this.fireClock=this.baseSalvo;this.burstCooldown=3;
  this.cfg.bossWindup=Math.max(1.1,this.cfg.bossWindup);
  // A vanguard starts near the gate while the rest is still a real rear formation.
  // This changes initial positions, not kills or counters, and never spawns on the player.
  const count=Math.min(108,Math.floor(this.red.length*.10));
  for(let i=0;i<count;i++){
   const u=this.red[i];u.s=this.gates[0].s+10+Math.floor(i/12)*.34;
   const w=Math.min(1.9,this.road.sample(u.s).width-.30);
   u.l=((i%12)/11*2-1)*w;this.road.pose(u);u.px=u.x;u.pz=u.z;
  }
  this.combo=0;this.comboPeak=0;this.comboClock=0;this.coinsPreview=0;
 }
 drainQueue(){if(this.blue.length>=964)return;return super.drainQueue();}
 step(dt=Previous.STEP){
  if(this.state!=='playing')return;
  const before=this.metrics.kills;super.step(dt);
  const kills=this.metrics.kills-before;
  this.comboClock=Math.max(0,this.comboClock-dt);
  if(kills){this.combo=(this.comboClock>0?this.combo:0)+kills;this.comboClock=1.5;this.comboPeak=Math.max(this.comboPeak,this.combo);}
  else if(!this.comboClock)this.combo=0;
  this.coinsPreview=Math.floor(this.metrics.kills/20)+this.metrics.towersDestroyed*12;
 }
 snapshot(){return {...super.snapshot(),version:VERSION,combo:this.combo,comboPeak:this.comboPeak,coinsPreview:this.coinsPreview};}
}
return {...Previous,VERSION,Game};
});
