/* Secret sanctuary: validated local coin ledger and small deterministic tower defence.
 * Gold has no real-money value. No purchase, paywall, network or random paid rewards. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MultidaoHaven=api;})(globalThis,()=>{
'use strict';
const KEY='multidao-haven-090',cap=1000000;
const integer=(v,fallback=0)=>Number.isSafeInteger(v)&&v>=0?Math.min(cap,v):fallback;
const BUILDINGS=Object.freeze({
 hall:{name:'Salão do Reino',costs:[40,80,140],x:0,z:-5.5,description:'Amplia a resistência da base.'},
 west:{name:'Torre do Poente',costs:[30,60,100],x:-4,z:-.8,description:'Arqueiros defendem o caminho.'},
 east:{name:'Torre do Nascente',costs:[30,60,100],x:4,z:-.8,description:'Arqueiros defendem o caminho.'},
 wall:{name:'Paliçada',costs:[25,55,95],x:0,z:3,description:'Reforça a resistência da fortaleza.'}
});
function clean(input){const a=input&&typeof input==='object'?input:{};
 const b={};for(const k of Object.keys(BUILDINGS))b[k]=Math.min(3,integer(a.buildings?.[k]));
 return {coins:integer(a.coins),earned:integer(a.earned),spent:integer(a.spent),seals:Math.min(3,integer(a.seals)),buildings:b,
  bestRaid:integer(a.bestRaid),raidsPlayed:integer(a.raidsPlayed),receipts:Array.isArray(a.receipts)?a.receipts.filter(x=>typeof x==='string'&&x.length<=100).slice(-128):[]};}
function load(storage){try{return clean(JSON.parse(storage.getItem(KEY)||'null'));}catch{return clean(null);}}
function save(storage,state){try{storage.setItem(KEY,JSON.stringify(clean(state)));return true;}catch{return false;}}
function unlock(state){return state.seals>=3;}
function credit(state,amount){const n=integer(amount);const accepted=Math.min(n,cap-state.coins);state.coins+=accepted;state.earned=Math.min(cap,state.earned+accepted);return accepted;}
function claimBattle(state,id,summary){
 if(typeof id!=='string'||!id||id.length>100)throw new Error('Identificador de partida inválido');
 if(state.receipts.includes(id))return {coins:0,seals:0,unlocked:false,duplicate:true};
 if(!['won','lost'].includes(summary.state))return {coins:0,seals:0,unlocked:false,pending:true};
 const m=summary.metrics||summary,was=unlock(state),towers=Math.min(4,integer(m.towersDestroyed));
 const amount=Math.min(350,Math.floor(integer(m.kills)/20)+12*towers+(summary.state==='won'?40:0)+(summary.boss?.state==='defeated'?25:0));
 const prev=state.seals;state.seals=Math.min(3,state.seals+towers);
 state.receipts.push(id);if(state.receipts.length>128)state.receipts.shift();
 return {coins:credit(state,amount),seals:state.seals-prev,unlocked:!was&&unlock(state),duplicate:false};
}
function purchase(state,key){const building=BUILDINGS[key];if(!building)return {ok:false,reason:'Construção desconhecida.'};
 if(!unlock(state))return {ok:false,reason:'Reúna três selos destruindo torres no cerco.'};
 const level=state.buildings[key],cost=building.costs[level];
 if(level>=3)return {ok:false,reason:'Nível máximo atingido.'};
 if(key!=='hall'&&state.buildings.hall===0)return {ok:false,reason:'Construa primeiro o Salão do Reino.'};
 if(state.coins<cost)return {ok:false,reason:'Faltam '+(cost-state.coins)+' moedas.'};
 state.coins-=cost;state.spent=Math.min(cap,state.spent+cost);state.buildings[key]++;
 return {ok:true,cost,level:state.buildings[key],key};
}
const STEP=1/30,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class Game{
 constructor(profile){this.profile=profile;this.hero={x:0,z:5,tx:0,tz:5,angle:0,walk:0};this.enemies=[];this.arrows=[];this.coins=[];this.effects=[];this.state='peace';this.time=0;this.accumulator=0;this.nextId=1;this.message='Toque no terreno para mover o comandante e recolher moedas.';this.raid=profile.bestRaid+1;this.hp=this.maxHP();this.kills=0;this.collected=0;this.towerClock={west:0,east:0,hero:0};this.scoreGranted=false;this.spawnClock=0;this.spawned=0;this.total=0;this.dirty=false;}
 maxHP(){return 12+this.profile.buildings.hall*6+this.profile.buildings.wall*5;}
 aim(x,z){if(!Number.isFinite(x)||!Number.isFinite(z))return;this.hero.tx=clamp(x,-7.2,7.2);this.hero.tz=clamp(z,-3.2,6.8);}
 build(key){if(this.state==='raid'||this.state==='paused')return {ok:false,reason:'Construa entre as invasões.'};const r=purchase(this.profile,key);if(r.ok){this.dirty=true;this.hp=this.maxHP();this.effects.push({x:BUILDINGS[key].x,z:BUILDINGS[key].z,type:'build',t:1});this.message=BUILDINGS[key].name+' · nível '+r.level;}else this.message=r.reason;return r;}
 startRaid(){
 if(!unlock(this.profile))return false;
 if(this.state==='raid'||this.state==='paused')return false;
 if(!this.profile.buildings.hall||!(this.profile.buildings.west||this.profile.buildings.east)){this.message='Construa o salão e pelo menos uma torre de arqueiros.';return false;}
 if(this.coins.length){this.message='Recolha as moedas no terreno antes da próxima invasão.';return false;}
 this.profile.raidsPlayed++;this.dirty=true;this.raid=this.profile.bestRaid+1;this.state='raid';this.time=0;this.hp=this.maxHP();this.enemies=[];this.arrows=[];this.effects=[];this.spawnClock=.7;this.spawned=0;this.total=Math.min(42,12+this.raid*3);this.kills=0;this.scoreGranted=false;
 this.message='Proteja o salão. Moedas caídas são recolhidas pelo comandante.';return true;
 }
 pause(){if(this.state==='raid')this.state='paused';else if(this.state==='paused')this.state='raid';this.accumulator=0;}
 nearest(x,z,range){let best=null,d=range*range;for(const e of this.enemies){if(e.hp<=0)continue;const n=(e.x-x)**2+(e.z-z)**2;if(n<d){best=e;d=n;}}return best;}
 shoot(x,z,source,damage,range,cadence,dt){this.towerClock[source]-=dt;if(this.towerClock[source]>0)return;const target=this.nearest(x,z,range);if(!target)return;this.towerClock[source]=cadence;this.arrows.push({id:this.nextId++,x,z,fromX:x,fromZ:z,target:target.id,damage,age:0});}
 collect(){for(let i=this.coins.length-1;i>=0;i--){const c=this.coins[i];if(Math.hypot(c.x-this.hero.x,c.z-this.hero.z)<1.1){const n=credit(this.profile,c.value);this.collected+=n;this.dirty=true;this.effects.push({x:c.x,z:c.z,type:'gold',t:.55});this.coins.splice(i,1);}}}
 step(dt=STEP){
 if(this.state==='paused')return;
 const h=this.hero,dx=h.tx-h.x,dz=h.tz-h.z,d=Math.hypot(dx,dz),travel=Math.min(d,5.2*dt);h.walk=d>.05?1:0;
 if(d>.001){const legal=(x,z)=>!['west','east'].some(k=>this.profile.buildings[k]>0&&Math.abs(x-BUILDINGS[k].x)<1.12&&Math.abs(z-BUILDINGS[k].z)<1.08);
   const x=h.x+dx/d*travel,z=h.z+dz/d*travel;if(legal(x,z)){h.x=x;h.z=z;}else if(legal(x,h.z))h.x=x;else if(legal(h.x,z))h.z=z;h.angle=Math.atan2(-dx,-dz);}
 this.effects=this.effects.filter(e=>(e.t-=dt)>0);this.collect();
 if(this.state!=='raid')return;this.time+=dt;this.spawnClock+=dt;
 if(this.spawnClock>=.8&&this.spawned<this.total){this.spawnClock-=.8;const lane=(this.spawned%5-2)*.36;this.enemies.push({id:this.nextId++,x:lane,z:8,hp:2+Math.floor(Math.min(this.raid,9)/3),angle:0,walk:1});this.spawned++;}
 for(const e of this.enemies)e.z-=dt*(.75+Math.min(this.raid,8)*.04);
 for(const key of ['west','east']){const level=this.profile.buildings[key],b=BUILDINGS[key];if(level)this.shoot(b.x,b.z,key,level,7,.80-level*.12,dt);}
 this.shoot(h.x,h.z,'hero',1,4.8,.6,dt);
 for(let i=this.arrows.length-1;i>=0;i--){const a=this.arrows[i],e=this.enemies.find(e=>e.id===a.target&&e.hp>0);a.age+=dt;if(!e||a.age>3){this.arrows.splice(i,1);continue;}
  const dx=e.x-a.x,dz=e.z-a.z,d=Math.hypot(dx,dz),step=12*dt;
  if(d<=step){e.hp-=a.damage;this.effects.push({x:e.x,z:e.z,type:'hit',t:.2});this.arrows.splice(i,1);}else{a.x+=dx/d*step;a.z+=dz/d*step;}}
 for(let i=this.enemies.length-1;i>=0;i--){const e=this.enemies[i];if(e.hp<=0){this.kills++;this.coins.push({id:this.nextId++,x:e.x,z:clamp(e.z,-2.7,6.5),value:3});this.enemies.splice(i,1);}else if(e.z< -4){this.hp--;this.enemies.splice(i,1);}}
 if(this.hp<=0||this.time>=40){this.state='lost';this.message='A defesa caiu. Recolha o ouro que ficou no terreno e reforce a base.';this.arrows=[];}
 else if(this.spawned===this.total&&!this.enemies.length){this.state='won';this.message='Fortaleza protegida! Recolha as moedas no terreno.';if(!this.scoreGranted){this.scoreGranted=true;this.profile.bestRaid=Math.max(this.profile.bestRaid,this.raid);credit(this.profile,30);this.dirty=true;this.message+=' +30 moedas pela defesa.';}}
 }
 update(seconds){this.accumulator+=clamp(Number(seconds)||0,0,.1);let i=0;while(this.accumulator+1e-10>=STEP&&i++<3){this.step();this.accumulator=Math.max(0,this.accumulator-STEP);}}
 snapshot(){return {state:this.state,time:this.time,hp:this.hp,raid:this.raid,kills:this.kills,total:this.total,spawned:this.spawned,coins:this.profile.coins,dropped:this.coins.length,arrows:this.arrows.length,buildings:{...this.profile.buildings}};}
}
return {KEY,BUILDINGS,clean,load,save,unlock,credit,claimBattle,purchase,Game,STEP};
});
