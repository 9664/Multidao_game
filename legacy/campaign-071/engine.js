/* Cerco do Cânion 0.7.0. Pure fixed-step simulation; presentation never decides damage. */
(function(root,factory){const api=factory(typeof module==='object'?require('./levels.js'):root.CanyonLevels,typeof module==='object'?require('./navigation.js'):root.CanyonNavigation);if(typeof module==='object')module.exports=api;else root.Multidao=api;})(globalThis,(Levels,Nav)=>{
'use strict';
const {Road,clamp}=Nav,STEP=Levels.step,VERSION=Levels.version,R=.135;
const hash=(s,l)=>Math.floor(s)*64+Math.floor(l)+24;
function grid(units){const g=new Map();for(const u of units)if(u.hp>0){const k=hash(u.s,u.l);if(!g.has(k))g.set(k,[]);g.get(k).push(u);}return g;}
class Game{
 constructor({level=1,seed=Levels.seed,autoFire=true,config={}}={}){this.seed=seed>>>0;this.autoFire=autoFire;this.cfg={...Levels.canyon,...config};this.road=new Road();this.reset(level);}
 random(){this.rng=(Math.imul(1664525,this.rng)+1013904223)>>>0;return this.rng/4294967296;}
 reset(level=1){
  this.level=clamp(Math.floor(Number(level)||1),1,20);this.rng=(this.seed+level*101)>>>0;this.time=0;this.tick=0;this.accumulator=0;this.state='ready';this.phase='assemble';
  this.nextId=1;this.events=[];this.eventId=0;this.effects=[];this.corpses=[];this.blue=[];this.red=[];this.queue=[];this.shells=[];this.shotQueue=[];this.gunX=0;this.aimX=0;this.cannons=1;this.fireClock=.75;
  this.ammo=this.cfg.ammo;this.health=this.cfg.defence;this.duration=this.cfg.duration;this.pressure=0;this.shock=0;this.reason='';this.frontS=this.road.plateauS;
  this.metrics={shots:0,salvos:0,soldierShots:0,shellShots:0,clones:0,clonesPlanned:0,reinforcements:0,reinforcementsAwarded:0,kills:0,losses:0,breaches:0,hits:0,gatePasses:0,towersDestroyed:0,bossDamage:0,bossStrikes:0,peakUnits:0,maxBlue:0,firstClash:null};
  this.gates=[{id:'canyon-x50',s:this.road.gateS,x:0,z:0,w:4.6,m:this.cfg.gate,color:'gold',flash:0}];Object.assign(this.gates[0],this.road.point(this.road.gateS));
  this.towers=[];for(const [kind,hps,x] of [['cannon',this.cfg.upgrades,-4.65],['reinforce',this.cfg.reinforcements,4.65]])for(let i=0;i<hps.length;i++)this.towers.push({id:kind+'-'+i,kind,x,z:-4.6,s:9.6,radius:.82,maxHP:hps[i],hp:hps[i],state:i===0?'active':'waiting',rewarded:false,readyAt:Infinity,flash:0,index:i});
  const count=Math.max(1,Math.round(this.cfg.enemies+(level-1)*80));this.initialEnemies=count;
  for(let i=0;i<count;i++){const l=-15.45+(i%96)*.324+(this.random()-.5)*.045,s=this.road.plateauS+1+Math.floor(i/96)*.39+this.random()*.08;this.add('red',s,l);}
  this.boss={id:'guardian',state:'dormant',s:this.road.plateauS+.5,l:0,radius:this.cfg.bossRadius,hp:this.cfg.bossHP,maxHP:this.cfg.bossHP,timer:0,attackId:0,struck:false,hit:0,walking:0,angle:Math.PI};this.road.pose(this.boss);
  this.metrics.peakUnits=count;
 }
 emit(type,data={}){const e={id:++this.eventId,type,time:this.time,...data};this.events.push(e);if(this.events.length>256)this.events.splice(0,this.events.length-256);return e;}
 effect(type,x,z,extra={}){if(this.effects.length<100)this.effects.push({type,x,z,t:.4,max:.4,...extra});}
 add(team,s,l,mask=0,origin='launch'){
  s=clamp(s,.15,this.road.length-.2);l=clamp(l,-this.road.sample(s).width+R,this.road.sample(s).width-R);
  const u={id:this.nextId++,team,s,l,hp:team==='blue'?this.cfg.blueHP:this.cfg.redHP,mask,origin,age:0,air:0,cooldown:this.random()*.4,walking:0,angle:team==='blue'?0:Math.PI,swing:0,hit:0,target:null,speed:.92+this.random()*.16};
  this.road.pose(u);this[team].push(u);return u;
 }
 aim(x){if(Number.isFinite(x))this.aimX=clamp(x,-5.35+(this.cannons-1)*.58,5.35-(this.cannons-1)*.58);}
 activeTower(kind){return this.towers.find(t=>t.kind===kind&&t.state==='active');}
 target(){return this.gunX< -2.8?this.activeTower('cannon'):this.gunX>2.8?this.activeTower('reinforce'):null;}
 start(){if(this.state==='ready'){this.state='playing';this.emit('start');}}
 pause(){if(this.state==='playing')this.state='paused';else if(this.state==='paused')this.state='playing';this.accumulator=0;}
 fire(cannon=0){
  if(this.ammo<=0)return;this.ammo--;this.metrics.shots++;
  const off=(cannon-(this.cannons-1)/2)*1.32,x=clamp(this.gunX+off,-5.6,5.6),target=this.target();
  if(target){this.metrics.shellShots++;this.shells.push({id:this.nextId++,x,z:1.4,y:.65,targetId:target.id,tx:target.x,tz:target.z,age:0});}
  else{this.metrics.soldierShots++;const u=this.add('blue',3.6,x,0,'launch');u.air=.5;}
  this.emit('shot',{x,cannon,kind:target?'shell':'soldier'});this.effect('muzzle',x,1.4,{t:.32,max:.32,cannon});this.shock=Math.max(this.shock,.016);
 }
 hitTower(t,damage){
  if(t.state!=='active')return;t.hp=Math.max(0,t.hp-damage);t.flash=.16;this.emit('towerHit',{x:t.x,z:t.z,damage,hp:t.hp});this.effect('stone',t.x,t.z);
  if(t.hp>0)return;t.state='destroyed';if(t.rewarded)return;t.rewarded=true;this.metrics.towersDestroyed++;
  if(t.kind==='cannon'){this.cannons=Math.min(3,this.cannons+1);this.emit('upgrade',{x:t.x,z:t.z,cannons:this.cannons});}
  else{this.metrics.reinforcementsAwarded+=this.cfg.reinforcementCount;this.enqueue(this.cfg.reinforcementCount,'reinforce',t.id);this.emit('reinforce',{x:t.x,z:t.z,count:this.cfg.reinforcementCount});}
  const next=this.towers.find(n=>n.kind===t.kind&&n.index===t.index+1);if(next)next.readyAt=this.time+1.1;
  this.effect('collapse',t.x,t.z,{t:.9,max:.9});
 }
 stepShells(dt){
  this.shells=this.shells.filter(b=>{
   b.age+=dt;const dx=b.tx-b.x,dz=b.tz-b.z,d=Math.hypot(dx,dz),travel=this.cfg.shellSpeed*dt,n=Math.max(1,Math.ceil(Math.min(travel,d)/.16));
   // Swept path validation: a shell cannot jump a cliff or hit a tower through another one.
   for(let k=0;k<n;k++){
    const step=Math.min(travel,d)/n;b.x+=dx/(d||1)*step;b.z+=dz/(d||1)*step;
    if(!this.road.contains(b.x,b.z,.08))return false;
    const t=this.towers.find(t=>t.state==='active'&&Math.hypot(b.x-t.x,b.z-t.z)<t.radius+.10);
    if(t){this.hitTower(t,this.cfg.towerDamage);return false;}
   }
   return d>travel && b.age<3;
  });
 }
 enqueue(count,origin,source){for(let i=0;i<count;i++)this.queue.push({origin,source,ordinal:i});}
 crossGate(u,old){
  if(u.mask&1)return;if(!this.road.crossing(old,u,this.gates[0].s))return;
  u.mask|=1;this.gates[0].flash=.28;this.metrics.gatePasses++;this.metrics.clonesPlanned+=this.cfg.gate-1;
  this.enqueue(this.cfg.gate-1,'clone',u.id);this.emit('gate',{x:u.x,z:u.z,m:this.cfg.gate});
 }
 drainQueue(){
  // Explicit pending queue. Cells are checked against living troops; excess stays pending.
  if(!this.queue.length)return;const occupied=grid([...this.blue,...this.red]);let produced=0;
  for(let row=0;row<8&&this.queue.length&&produced<36;row++)for(let col=0;col<13&&this.queue.length&&produced<36;col++){
   const s=this.gates[0].s+.3+row*.29,l=(col-6)*.30,key=hash(s,l);let busy=false;
   for(let dz=-1;dz<=1&&!busy;dz++)for(let dx=-1;dx<=1&&!busy;dx++)for(const u of occupied.get(key+dz*64+dx)||[])if((u.s-s)**2+(u.l-l)**2<.063){busy=true;break;}
   if(busy)continue;const item=this.queue.shift(),u=this.add('blue',s,l,1,item.origin);u.source=item.source;
   if(item.origin==='clone')this.metrics.clones++;else this.metrics.reinforcements++;produced++;
   if(!occupied.has(key))occupied.set(key,[]);occupied.get(key).push(u);
  }
 }
 closest(u,other){
  if(u.target&&u.target.hp>0&&this.road.sameReach(u,u.target,2.3)&&(this.tick+u.id)%5!==0)return u.target;
  u.target=null;if((this.tick+u.id)%4!==0)return null;let best=null,d=Infinity,key=hash(u.s,u.l);
  for(let ds=-2;ds<=2;ds++)for(let dl=-2;dl<=2;dl++)for(const e of other.get(key+ds*64+dl)||[]){if(e.hp<=0)continue;const dd=(u.s-e.s)**2+(u.l-e.l)**2;if(dd<d&&dd<4.5&&this.road.sameReach(u,e,2.2)){best=e;d=dd;}}
  u.target=best;return best;
 }
 separation(u,g){let s=0,l=0;const key=hash(u.s,u.l);for(let ds=-1;ds<=1;ds++)for(let dl=-1;dl<=1;dl++)for(const v of g.get(key+ds*64+dl)||[]){if(v===u)continue;let a=u.s-v.s,b=u.l-v.l,d=Math.hypot(a,b);if(d>=.31)continue;if(d<.001){a=(u.id>v.id?1:-1)*.01;b=.007;d=.013;}const force=(.31-d)/.31;s+=a/d*force;l+=b/d*force;}return {s:clamp(s,-2,2),l:clamp(l,-2,2)};}
 updateBoss(dt){
  const b=this.boss,c=this.cfg;b.hit=Math.max(0,b.hit-dt);b.timer-=dt;b.walking=0;
  if(b.state==='defeated')return;
  if(b.hp<=0){b.hp=0;b.state='defeated';this.emit('bossDefeated',{x:b.x,z:b.z});this.effect('collapse',b.x,b.z,{t:1,max:1});return;}
  if(b.state==='dormant'){
   if(this.time>=c.bossEntryTime||this.metrics.kills>=this.initialEnemies*c.bossEntryKills){b.state='entering';b.timer=.8;this.emit('bossEntry',{x:b.x,z:b.z});this.shock=.08;}
   return;
  }
  if(b.state==='entering'){if(b.timer<=0)b.state='advancing';return;}
  if(b.state==='windup'){
   if(b.timer<=0){b.state='strike';b.timer=.18;b.struck=false;}return;
  }
  if(b.state==='strike'){
   if(!b.struck){b.struck=true;this.metrics.bossStrikes++;const center={s:b.s-1.2,l:b.l,...this.road.point(b.s-1.2,b.l)};
    let victims=0;for(const u of this.blue)if(u.hp>0&&this.road.sameReach(u,center,c.bossAttackRadius)){u.hp-=c.bossDamage;u.hit=.18;victims++;}
    this.emit('bossStrike',{x:center.x,z:center.z,victims,attackId:b.attackId});this.effect('shock',center.x,center.z,{t:.5,max:.5});this.shock=.10;
   }
   if(b.timer<=0){b.state='recovery';b.timer=c.bossRecovery;}return;
  }
  if(b.state==='recovery'){if(b.timer<=0)b.state='advancing';return;}
  const close=this.blue.some(u=>u.hp>0&&this.road.sameReach(u,b,3.0));
  if(close){b.state='windup';b.timer=c.bossWindup;b.attackId++;this.emit('bossWindup',{attackId:b.attackId,x:b.x,z:b.z});}
  else{this.road.move(b,-c.bossSpeed*dt,-b.l*.8*dt,b.radius);b.walking=1;}
  if(b.s<1){this.health=0;this.reason='O Guardião atravessou a última defesa.';}
 }
 step(dt=STEP){
  if(this.state!=='playing')return;this.time+=dt;this.tick++;this.aim(this.aimX);this.gunX+=(this.aimX-this.gunX)*Math.min(1,dt*14);
  this.fireClock+=dt;if(this.autoFire&&this.ammo>0&&this.fireClock>=this.cfg.salvoInterval){this.fireClock-=this.cfg.salvoInterval;this.metrics.salvos++;for(let i=0;i<this.cannons;i++)this.shotQueue.push({at:this.time+i*this.cfg.stagger,cannon:i});}
  while(this.shotQueue.length&&this.shotQueue[0].at<=this.time+1e-8){this.fire(this.shotQueue.shift().cannon);}
  for(const t of this.towers){t.flash=Math.max(0,t.flash-dt);if(t.state==='waiting'&&t.readyAt<=this.time)t.state='active';}
  this.effects=this.effects.filter(e=>(e.t-=dt)>0);this.corpses=this.corpses.filter(e=>(e.t-=dt)>0);this.shock=Math.max(0,this.shock-dt*.2);this.gates[0].flash=Math.max(0,this.gates[0].flash-dt);
  this.stepShells(dt);this.drainQueue();this.updateBoss(dt);
  const all=[...this.blue,...this.red],g=grid(all),bg=grid(this.blue),rg=grid(this.red),damage=new Map();let active=0,front=0,totalHits=0;
  let farBlue=0;for(const u of this.blue)farBlue=Math.max(farBlue,u.s);
  for(const u of all){
   if(u.hp<=0)continue;u.age+=dt;u.air=Math.max(0,u.air-dt);u.cooldown-=dt;u.hit=Math.max(0,u.hit-dt);u.swing=Math.max(0,u.swing-dt);
   if(u.team==='red'&&this.time<7){u.walking=0;continue;}
   const red=u.team==='red',direction=red?-1:1;
   if(red&&u.s>farBlue+3.5&&u.s>this.road.plateauS+2){this.road.move(u,-this.cfg.redSpeed*dt,0);u.walking=1;continue;}
   const old={x:u.x,z:u.z},enemy=this.closest(u,red?bg:rg),boss=this.boss;
   let target=enemy;
   if(!red&&!['dormant','entering','defeated'].includes(boss.state)&&boss.hp>0&&this.road.sameReach(u,boss,2.1)&&(!enemy||Math.abs(u.s-boss.s)<Math.abs(u.s-enemy.s)+.8))target=boss;
   let vs=direction,vl=0,attacking=false;
   if(target){const ds=target.s-u.s,dl=target.l-u.l,d=Math.hypot(ds,dl)||1;vs=ds/d;vl=dl/d;attacking=this.road.sameReach(u,target,target===boss?1.18:.46);
    if(attacking){active++;front+=u.s;if(u.cooldown<=0){u.cooldown=red?this.cfg.redCadence:this.cfg.blueCadence;damage.set(target,(damage.get(target)||0)+1);u.swing=.23;totalHits++;}}
   }else{
    const ahead=this.road.sample(clamp(u.s+direction*2,0,this.road.length)),limit=ahead.width-.3;
    if(Math.abs(u.l)>limit)vl=-Math.sign(u.l)*2.5;
    // After the common gate, maintain a lane rather than converging every soldier to x=0.
   }
   const sep=this.separation(u,g),speed=(red?this.cfg.redSpeed:this.cfg.blueSpeed)*u.speed*(u.air>0?1.5:1),factor=attacking?.5:1.8;
   let ds=(attacking?0:vs*speed)*dt+sep.s*factor*dt,dl=(attacking?0:vl*speed)*dt+sep.l*factor*dt;
   if(u.s<13){for(const t of this.towers)if(t.state==='active'&&Math.abs(u.s-t.s)<2&&Math.abs(u.l-t.x)<1.1){dl=-Math.sign(t.x)*speed*dt;if(Math.abs(u.l-t.x)<1.05&&Math.abs(u.s+ds-t.s)<1.2)ds=0;}}
   this.road.move(u,ds,dl);u.walking=attacking?0:1;const p=this.road.sample(u.s);u.angle=Math.atan2(-p.tx*direction,-p.tz*direction);
   if(!red)this.crossGate(u,old);
  }
  for(const [u,n] of damage){const applied=Math.min(Math.max(0,u.hp),n);u.hp-=n;u.hit=.15;if(u===this.boss){this.metrics.bossDamage+=applied;if(applied)this.emit('bossHit',{damage:applied,hp:Math.max(0,u.hp)});}else if(u.hp<=0)this.effect('hit',u.x,u.z,{team:u.team});}
  if(totalHits){this.metrics.hits+=totalHits;this.emit('combat',{hits:totalHits});if(this.metrics.firstClash===null){this.metrics.firstClash=this.time;this.phase='clash';}}
  this.blue=this.blue.filter(u=>{if(u.hp>0)return true;this.metrics.losses++;return false;});
  this.red=this.red.filter(u=>{if(u.hp<=0){this.metrics.kills++;return false;}if(u.s<.7){u.hp=0;this.health--;this.metrics.breaches++;this.emit('breach');return false;}return true;});
  if(this.boss.hp<=0&&this.boss.state!=='defeated'){this.boss.hp=0;this.boss.state='defeated';this.emit('bossDefeated',{x:this.boss.x,z:this.boss.z});}
  if(active){this.frontS+=(front/active-this.frontS)*.08;this.pressure+=(Math.min(1,active/80)-this.pressure)*.08;}else this.pressure*=.95;
  if(this.boss.state!=='dormant')this.phase='guardian';
  this.metrics.peakUnits=Math.max(this.metrics.peakUnits,this.blue.length+this.red.length);this.metrics.maxBlue=Math.max(this.metrics.maxBlue,this.blue.length);
  this.finishCheck();
 }
 finishCheck(){
  let state='',reason='';
  if(this.health<=0){state='lost';reason=this.reason||'A última defesa caiu.';}
  else if(!this.red.length&&this.boss.state==='defeated'){state='won';reason='A horda e o Guardião foram derrotados.';}
  else if(this.time>=this.duration){state='lost';reason='O tempo do cerco acabou.';}
  else if(!this.ammo&&!this.blue.length&&!this.queue.length&&!this.shells.length&&!this.shotQueue.length){state='lost';reason='Não restam tropas nem cargas para defender o cânion.';}
  if(state&&this.state==='playing'){this.state=state;this.reason=reason;this.emit('result',{win:state==='won'});}
 }
 update(seconds){if(this.state!=='playing')return;this.accumulator+=clamp(Number(seconds)||0,0,.25);while(this.accumulator+1e-10>=STEP){this.step();this.accumulator=Math.max(0,this.accumulator-STEP);}}
 snapshot(){return {version:VERSION,state:this.state,level:this.level,time:+this.time.toFixed(3),phase:this.phase,blue:this.blue.length,enemies:this.red.length,initialEnemies:this.initialEnemies,pending:this.queue.length,pendingClones:this.queue.filter(q=>q.origin==='clone').length,pendingReinforcements:this.queue.filter(q=>q.origin==='reinforce').length,ammo:this.ammo,health:this.health,cannons:this.cannons,gunX:this.gunX,boss:{state:this.boss.state,hp:this.boss.hp,attackId:this.boss.attackId},...this.metrics};}
}
return {Game,VERSION,STEP,RADIUS:R};
});
