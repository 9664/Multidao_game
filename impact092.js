/* v0.9.2: real ballistic resolution + independently budgeted visual shot history. */
(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./rush'):root.MultidaoRush,node?require('./routes092'):root.MultidaoRoutes092);if(node)module.exports=api;else root.MultidaoImpact092=api;})(globalThis,(Previous,Routes)=>{
'use strict';
const VERSION='0.9.2',STEP=Previous.STEP,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class Game extends Previous.Game{
 reset(number=1){
  const endless=this.mode==='endless',n=endless?Previous.waveNumber(number):clamp(Math.floor(Number(number)||1),1,Routes.stages.length);
  super.reset(endless?n:Math.min(n,6));
  const spec=endless?Routes.generate(n,this.runSeed):Routes.stages[n-1],balance=Routes.difficulty(n);
  this.level=n;this.wave=endless?n:this.wave;this.stage={...spec};
  this.cfg={...this.cfg,...spec,...balance,...(this.overrides||{})};
  this.cfg.cleanupPursuit=true;
  this.cfg.redSpeed=Math.min(1.35,(spec.redSpeed||.9)*balance.speedFactor);this.cfg.enemyDelay=0;
  this.cfg.blueSpeed=3.8;this.cfg.salvoInterval=this.baseSalvo=.38;this.cfg.stagger=.075;this.cfg.shellSpeed=32;
  this.cfg.bossWindup=Math.max(1.10,spec.bossWindup||1.10);this.cfg.bossEntryTime=18;
  this.road=new Routes.Road(spec);this.initialEnemies=Math.max(1,Math.floor(this.cfg.enemies));this.ammo=this.cfg.ammo;this.duration=70;
  const gate=this.gates[0];gate.s=this.road.gateS;Object.assign(gate,this.road.point(gate.s));gate.w=spec.width*2-.2;gate.m=this.cfg.gate;gate.color=this.cfg.gate>=75?'violet':'gold';
  for(const t of this.towers){t.hp=t.maxHP=(t.kind==='cannon'?this.cfg.upgrades:this.cfg.reinforcements)[t.index];}
  this.boss.s=this.road.plateauS+.5;this.boss.hp=this.boss.maxHP=this.cfg.bossHP;this.boss.name=spec.boss;this.road.pose(this.boss);this.boss.px=this.boss.x;this.boss.pz=this.boss.z;
  this.frontS=this.road.plateauS;Routes.arrange(this);
  this.shotVisuals=[];this.nextShot=1;this.ammoAnnounced=false;
  Object.assign(this.metrics,{shellHits:0,shellMisses:0,shotVisualCreated:0});
 }
 add(team,s,l,mask=0,origin='launch'){
  const u=super.add(team,s,l,mask,origin);
  if(team==='blue'){u.hp=(this.cfg.blueHP||3)+Math.max(0,(this.cannons||1)-1);u.maxHP=u.hp;}
  return u;
 }
 /* Priority flash effects may replace an expendable hit particle, never an actual soldier. */
 effect(type,x,z,extra={}){
  if(type==='muzzle'&&this.effects.length>=100){const i=this.effects.findIndex(e=>e.type!=='muzzle');if(i>=0)this.effects.splice(i,1);}
  return super.effect(type,x,z,extra);
 }
 fire(cannon=0){
  if(this.ammo<=0)return;
  const old=this.metrics.shots;super.fire(cannon);if(this.metrics.shots===old)return;
  const shot=this.metrics.shellShots+this.metrics.soldierShots,ev=this.events[this.events.length-1];
  const isShell=ev?.type==='shot'&&ev.kind==='shell';const unit=isShell?this.shells[this.shells.length-1]:this.blue[this.blue.length-1];
  const x=unit.x,z=1.04;
  if(isShell){unit.z=z;unit.px=x;unit.pz=z;unit.y=.85;}
  else{unit.s=3.96;this.road.pose(unit);unit.launchLift=true;unit.px=unit.x;unit.pz=unit.z;}
  const visual={id:this.nextShot++,serial:shot,cannon,kind:isShell?'shell':'soldier',born:this.time,x,y:.85,z,px:x,py:.85,pz:z,sx:x,sz:z,done:false,until:Infinity,reason:null,entity:unit};
  unit.visual=visual;this.shotVisuals.push(visual);this.metrics.shotVisualCreated++;
  // At most ~30 live visual records at the designed maximum fire rate; hard bound handles hostile input.
  if(this.shotVisuals.length>96)this.shotVisuals.splice(0,this.shotVisuals.length-96);
 }
 resolveShell(b,reason){
  if(b.resolved)return;b.resolved=true;
  if(reason==='hit')this.metrics.shellHits++;else this.metrics.shellMisses++;
  const v=b.visual;if(v){v.x=b.x;v.z=b.z;v.y=.85;v.done=true;v.reason=reason;v.until=this.time+.24;v.entity=null;}
  this.emit('shellResolved',{shot:b.id,x:b.x,z:b.z,reason});
  this.effect('stone',b.x,b.z,{t:.24,max:.24});
 }
 stepShells(dt){
  this.shells=this.shells.filter(b=>{
   b.px=b.x;b.pz=b.z;b.age+=dt;
   if(b.visual){b.visual.px=b.x;b.visual.pz=b.z;b.visual.py=.85;}
   const dx=b.tx-b.x,dz=b.tz-b.z,d=Math.hypot(dx,dz),travel=Math.min(this.cfg.shellSpeed*dt,d),n=Math.max(1,Math.ceil(travel/.12));
   for(let k=0;k<n;k++){
    b.x+=dx/(d||1)*travel/n;b.z+=dz/(d||1)*travel/n;
    if(!this.road.contains(b.x,b.z,.08)){this.resolveShell(b,'terrain');return false;}
    const t=this.towers.find(t=>t.state==='active'&&Math.hypot(b.x-t.x,b.z-t.z)<t.radius+.10);
    if(t){this.hitTower(t,this.cfg.towerDamage);this.resolveShell(b,'hit');return false;}
   }
   if(b.visual){b.visual.x=b.x;b.visual.z=b.z;}
   if(d<=travel+1e-9||b.age>=3){this.resolveShell(b,'empty-target');return false;}
   return true;
  });
 }
 step(dt=STEP){
  if(this.state!=='playing')return;
  this.shotVisuals=this.shotVisuals.filter(v=>!v.done||v.until>this.time);
  for(const v of this.shotVisuals){if(!v.done){v.px=v.x;v.py=v.y;v.pz=v.z;}}
  super.step(dt);
  for(const v of this.shotVisuals){if(v.done||v.kind!=='soldier')continue;const u=v.entity;
   v.x=u.x;v.z=u.z;v.y=u.air>0?.25+.8*u.air/.5+.6*Math.sin((.5-u.air)*Math.PI/.5):.25;
   if(u.air<=0||u.hp<=0){v.done=true;v.reason=u.hp<=0?'unit-defeated':'landed';v.until=this.time+.12;v.entity=null;if(u.visual===v)delete u.visual;}
  }
  if(this.ammo===0&&!this.ammoAnnounced){this.ammoAnnounced=true;this.emit('ammoEmpty');}
 }
 next(){if(this.state!=='won')return false;if(this.mode==='campaign'&&this.level===Routes.stages.length)return false;if(this.level>=Number.MAX_SAFE_INTEGER)return false;this.reset(this.level+1);return true;}
 snapshot(){return {...super.snapshot(),version:VERSION,generator:Routes.GENERATOR,formation:this.stage.formation,format:this.stage.format,difficulty:this.level,eliteCount:this.eliteCount,runnerCount:this.runnerCount,activeShots:this.shells.length,shotVisuals:this.shotVisuals.length,ammoEmpty:this.ammo===0,campaignComplete:this.mode==='campaign'&&this.level===Routes.stages.length&&this.state==='won'};}
}
return {...Previous,VERSION,GENERATOR:Routes.GENERATOR,Game,stages:Routes.stages,generate:Routes.generate,formations:Routes.formations,formats:Routes.formats};
});
