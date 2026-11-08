/* v0.8.0: deterministic endless stages, bounded costs, no server and no hidden adaptive difficulty. */
(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./campaign.js'):root.MultidaoCampaign,node?require('./engine.js'):root.Multidao,node?require('./levels.js'):root.CanyonLevels,node?require('./fast-road.js'):root.SiegePerformance);if(node)module.exports=api;else root.MultidaoInfinite=api;})(globalThis,(C,Base,Defaults,Perf)=>{
'use strict';
const VERSION='0.8.0',GENERATOR=1,DEFAULT_SEED=20261108;
function waveNumber(value){const n=Math.floor(Number(value));return Number.isSafeInteger(n)&&n>0?n:1;}
function seedNumber(value){return Number.isFinite(Number(value))?Number(value)>>>0:DEFAULT_SEED;}
function rng(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function generate(wave,seed=DEFAULT_SEED){
 wave=waveNumber(wave);seed=seedNumber(seed);
 const cycle=Math.floor((wave-1)/6),random=rng((seed^Math.imul(cycle+1,0x45d9f3b))>>>0),order=[0,1,2,3,4,5];
 for(let i=5;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const base=C.stages[order[(wave-1)%6]],r=rng((seed^Math.imul(wave,0x9e3779b1)^Math.floor(wave/4294967296))>>>0);
 const pressure=1-Math.exp(-(wave-1)/22),event=wave%10===0?'commander':wave%5===0?'elite':'siege';
 const gate=wave<4?50:wave<9?75:99,enemies=Math.min(3600,Math.round((1050+pressure*2250+(r()-.5)*180)/20)*20);
 return {...base,id:'endless-'+wave,name:base.name,mode:'endless',wave,seed,generator:GENERATOR,event,
  description:event==='commander'?'Onda de comandante: golpes mais amplos, sempre sinalizados.':event==='elite'?'Onda de elite: o Guardião resiste mais.':'Percurso e condições gerados para esta onda.',
  turns:[(r()-.5)*8,(r()-.5)*7],width:2.65+r()*.60,enemies,gate,ammo:88,
  bossHP:Math.round((260+pressure*650)*(event==='commander'?1.22:event==='elite'?1.12:1)),bossEntryTime:26+r()*5,
  upgrades:[5+Math.floor(pressure*2),8+Math.floor(pressure*3)],reinforcements:[7,11],
  redSpeed:.70+pressure*.22,blueSpeed:3.15,salvoInterval:1.10,bossWindup:event==='commander'?1.25:1.05,
  bossDamage:event==='commander'?3:2,bossAttackRadius:event==='commander'?2.1:1.8,bossRecovery:1.45,
  boss:base.boss+(event==='commander'?' · Supremacia':event==='elite'?' · Elite':'')};
}
class Game extends C.Game{
 constructor(options={}){super(options);this.runSeed=seedNumber(options.runSeed??DEFAULT_SEED);this.mode=options.mode==='endless'?'endless':'campaign';this.wave=waveNumber(options.wave||1);this.reset(this.mode==='endless'?this.wave:options.level||1);}
 reset(number=1){
  if(this.mode==='endless'){
   this.wave=waveNumber(number);this.stage=generate(this.wave,this.runSeed);this.cfg={...Defaults.canyon,...this.stage,...(this.overrides||{})};
   this.road=new C.CampaignRoad(this.stage);this.baseSalvo=this.cfg.salvoInterval;
   // The base engine's legacy level scaling is disabled, not allowed to grow army cost forever.
   Base.Game.prototype.reset.call(this,1);this.level=this.wave;this.gates[0].w=this.stage.width*2-.2;this.gates[0].color=this.cfg.gate>=75?'violet':'gold';
   this.burstLeft=0;this.burstCooldown=5;this.boss.name=this.stage.boss;
  }else{this.mode='campaign';C.Game.prototype.reset.call(this,number);}
  Perf.accelerateRoad(this.road);this.visualAlpha=1;this.previousGun=this.gunX;this.simulatedSteps=0;this.discardedWallSeconds=0;
  for(const u of [...this.blue,...this.red,this.boss]){u.px=u.x;u.pz=u.z;u.pa=u.angle;}
 }
 campaign(level=1){this.mode='campaign';this.reset(level);}
 endless(wave=1,seed=this.runSeed){this.runSeed=seedNumber(seed);this.mode='endless';this.reset(wave);}
 next(){if(this.state!=='won')return false;if(this.mode==='endless'){if(this.wave===Number.MAX_SAFE_INTEGER)return false;this.reset(this.wave+1);}else{if(this.level>=C.stages.length)return false;this.reset(this.level+1);}return true;}
 step(dt=Base.STEP){if(this.state!=='playing')return;this.previousGun=this.gunX;this.boss.px=this.boss.x;this.boss.pz=this.boss.z;this.boss.pa=this.boss.angle;C.Game.prototype.step.call(this,dt);this.simulatedSteps++;}
 drainQueue(){
  // Keep every reward in the explicit queue when the battlefield is crowded. No soldier is silently erased.
  if(this.mode!=='endless'||this.blue.length<1464)return Base.Game.prototype.drainQueue.call(this);
 }
 update(seconds){
  if(this.state!=='playing')return;const delta=Math.max(0,Number(seconds)||0),accepted=Math.min(delta,.10);
  this.discardedWallSeconds+=delta-accepted;this.accumulator+=accepted;
  let steps=0;while(this.accumulator+1e-10>=Base.STEP&&steps++<3){this.step();this.accumulator=Math.max(0,this.accumulator-Base.STEP);}
  this.visualAlpha=this.state==='playing'?Math.min(1,this.accumulator/Base.STEP):1;
 }
 snapshot(){return {...C.Game.prototype.snapshot.call(this),version:VERSION,mode:this.mode,wave:this.mode==='endless'?this.wave:null,runSeed:this.runSeed,generator:GENERATOR,event:this.stage.event||'campaign',campaignComplete:this.mode==='campaign'&&this.level===C.stages.length&&this.state==='won',discardedWallSeconds:this.discardedWallSeconds};}
}
return {Game,generate,waveNumber,seedNumber,stages:C.stages,VERSION,GENERATOR,STEP:Base.STEP,DEFAULT_SEED};
});
