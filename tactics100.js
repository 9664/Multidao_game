/* Ascensão 1.0: explicit loadouts, real area skills and mid-battle decisions.
 * Rendering never applies damage. Gold/progress from 0.9.x remain untouched. */
(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./impact092'):root.MultidaoImpact092);if(node)module.exports=api;else root.MultidaoAscension=api;})(globalThis,(Base)=>{
'use strict';
const VERSION='1.0.0',STEP=Base.STEP,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const doctrines=Object.freeze({
 guard:Object.freeze({name:'Vanguarda',tag:'RESISTÊNCIA',description:'+1 de vida para novos soldados. Disparos no ritmo normal.',hp:1,cadence:1,ammo:0,tower:1}),
 siege:Object.freeze({name:'Artilharia',tag:'DESTRUIÇÃO',description:'Dano dobrado contra torres. Salvas 20% mais espaçadas.',hp:0,cadence:1.2,ammo:0,tower:2}),
 swarm:Object.freeze({name:'Enxame',tag:'VELOCIDADE',description:'Salvas 18% mais próximas. −1 de vida por soldado e −6 cargas.',hp:-1,cadence:.82,ammo:-6,tower:1})
});
const skills=Object.freeze({
 meteor:Object.freeze({name:'Impacto',cost:45,cooldown:10,delay:.65,radius:2.6,damage:6,description:'Bombardeia a frente mais próxima após 0,65 s.'}),
 frost:Object.freeze({name:'Geada',cost:35,cooldown:12,delay:.30,radius:3.3,duration:4,description:'Reduz em 55% a velocidade dos inimigos atingidos por 4 s.'})
});
const cards=Object.freeze({
 supply:Object.freeze({name:'Suprimentos',type:'MUNIÇÃO',text:'+12 cargas reais para a bateria.',icon:'ammo'}),
 fortify:Object.freeze({name:'Aço temperado',type:'TROPAS',text:'+1 de vida para soldados criados a partir de agora.',icon:'shield'}),
 cadence:Object.freeze({name:'Engrenagem leve',type:'BATERIA',text:'Reduz em 12% o intervalo entre salvas.',icon:'bolt'}),
 reserve:Object.freeze({name:'Guarda real',type:'REFORÇOS',text:'120 soldados entram pela fila, após o multiplicador.',icon:'flag'}),
 energy:Object.freeze({name:'Foco do comando',type:'HABILIDADES',text:'+45 de energia, limitada a 100.',icon:'spark'}),
 repair:Object.freeze({name:'Última muralha',type:'DEFESA',text:'Recupera até 2 pontos de defesa, no máximo 5.',icon:'castle'})
});
// A finer separation grid excludes distant neighbours before the original force calculation.
const CELL=.34,STRIDE=512;
function fineGrid(source){const cells=new Map();for(const list of source.values())for(const u of list){const k=Math.floor(u.s/CELL)*STRIDE+Math.floor(u.l/CELL);let a=cells.get(k);if(!a)cells.set(k,a=[]);a.push(u);}return cells;}
function force(u,cells){const key=Math.floor(u.s/CELL)*STRIDE+Math.floor(u.l/CELL);let s=0,l=0;for(let ds=-2;ds<=2;ds++)for(let dl=-2;dl<=2;dl++){const a=cells.get(key+ds*STRIDE+dl);if(!a)continue;for(const v of a){if(u===v)continue;let x=u.s-v.s,y=u.l-v.l,d2=x*x+y*y;if(d2>=.0961)continue;let d=Math.sqrt(d2);if(d<.001){x=(u.id>v.id?1:-1)*.01;y=.007;d=.013;}const k=(.31-d)/(.31*d);s+=x*k;l+=y*k;}}return {s:clamp(s,-2,2),l:clamp(l,-2,2)};}
class Game extends Base.Game{
 constructor(options={}){super(options);this.doctrine=doctrines[options.doctrine]?options.doctrine:'guard';this.reset(this.mode==='endless'?this.wave:options.level||1);}
 reset(n=1){super.reset(n);this.doctrine=doctrines[this.doctrine]?this.doctrine:'guard';this.armorBonus=0;this.energy=50;this.skillCooldown={meteor:0,frost:0};this.casts=[];this.skillFX=[];this.nextCast=1;this.skillStats={casts:0,impactDamage:0,frozen:0};this.choicePending=false;this.offers=[];this.choices=[];this.choiceTier=0;this._sepTick=-1;this._sepCells=null;
  const d=doctrines[this.doctrine];this.cfg.blueHP=Math.max(1,this.cfg.blueHP+d.hp);this.baseSalvo*=d.cadence;this.cfg.salvoInterval=this.baseSalvo;this.cfg.towerDamage=d.tower;this.cfg.ammo=Math.max(12,this.cfg.ammo+d.ammo);this.ammo=this.cfg.ammo;this.firstSupply=this.cfg.ammo;
 }
 setDoctrine(id){if(this.state!=='ready'||!doctrines[id])return false;this.doctrine=id;this.reset(this.level);return true;}
 separation(u,source){if(this._sepTick!==this.tick){this._sepCells=fineGrid(source);this._sepTick=this.tick;}return force(u,this._sepCells);}
 add(team,s,l,mask=0,origin='launch'){const u=super.add(team,s,l,mask,origin);if(team==='blue'&&this.armorBonus){u.hp+=this.armorBonus;u.maxHP=u.hp;}return u;}
 choose(id){if(!this.choicePending||this.state!=='choosing'||!this.offers.includes(id))return false;
  if(id==='supply'){this.ammo+=12;this.cfg.ammo+=12;this.ammoAnnounced=false;}
  else if(id==='fortify')this.armorBonus++;
  else if(id==='cadence'){this.baseSalvo*=.88;this.cfg.salvoInterval=this.baseSalvo;}
  else if(id==='reserve'){this.metrics.reinforcementsAwarded+=120;this.enqueue(120,'reinforce','command-'+this.choiceTier);}
  else if(id==='energy')this.energy=Math.min(100,this.energy+45);
  else if(id==='repair')this.health=Math.min(this.cfg.defence,this.health+2);
  this.choices.push(id);this.choicePending=false;this.offers=[];this.accumulator=0;this.state='playing';this.emit('commandChoice',{card:id});return true;
 }
 targetFront(){let target=null;for(const u of this.red)if(u.hp>0&&(!target||u.s<target.s))target=u;const b=this.boss;if(b.hp>0&&!['dormant','entering','defeated'].includes(b.state)&&(!target||b.s<target.s))target=b;if(!target)return null;return {s:target.s,l:clamp(target.l,-this.road.sample(target.s).width+.2,this.road.sample(target.s).width-.2)};}
 cast(id){const skill=skills[id];if(!skill||this.state!=='playing'||this.energy<skill.cost||this.skillCooldown[id]>0)return false;const target=this.targetFront();if(!target)return false;
  this.energy-=skill.cost;this.skillCooldown[id]=skill.cooldown;const p=this.road.point(target.s,target.l);this.casts.push({id:this.nextCast++,skill:id,...target,...p,born:this.time,at:this.time+skill.delay});this.skillStats.casts++;this.emit('skillCast',{skill:id,x:p.x,z:p.z});return true;
 }
 resolveCast(c){const skill=skills[c.skill],victims=[];for(const u of this.red)if(u.hp>0&&this.road.sameReach(c,u,skill.radius))victims.push(u);const b=this.boss;if(b.hp>0&&!['dormant','entering','defeated'].includes(b.state)&&this.road.sameReach(c,b,skill.radius+b.radius*.3))victims.push(b);
  if(c.skill==='meteor'){for(const u of victims){const damage=u===b?32:skill.damage,applied=Math.min(u.hp,damage);u.hp-=applied;u.hit=.18;this.skillStats.impactDamage+=applied;if(u===b)this.metrics.bossDamage+=applied;}this.shock=Math.max(this.shock,.085);}
  else{for(const u of victims){if(u===b){b.frostUntil=this.time+2;continue;}if(u.frostSpeed===undefined)u.frostSpeed=u.speed;u.speed=u.frostSpeed*.45;u.frostUntil=this.time+skill.duration;this.skillStats.frozen++;}}
  this.skillFX.push({...c,radius:skill.radius,t:c.skill==='meteor'?.65:1.2,max:c.skill==='meteor'?.65:1.2});this.emit('skillImpact',{skill:c.skill,x:c.x,z:c.z,victims:victims.length});
 }
 updateBoss(dt){const base=this.cfg.bossSpeed;if(this.boss.frostUntil>this.time)this.cfg.bossSpeed=base*.6;super.updateBoss(dt);this.cfg.bossSpeed=base;}
 step(dt=STEP){if(this.state!=='playing')return;
  this.energy=Math.min(100,this.energy+dt*2);for(const id of Object.keys(skills))this.skillCooldown[id]=Math.max(0,this.skillCooldown[id]-dt);
  this.skillFX=this.skillFX.filter(e=>(e.t-=dt)>0);
  for(const u of this.red)if(u.frostSpeed!==undefined&&u.frostUntil<=this.time){u.speed=u.frostSpeed;delete u.frostSpeed;delete u.frostUntil;}
  const ready=this.casts.filter(c=>c.at<=this.time+dt+1e-9);this.casts=this.casts.filter(c=>c.at>this.time+dt+1e-9);for(const c of ready)this.resolveCast(c);
  const kills=this.metrics.kills;super.step(dt);this.energy=Math.min(100,this.energy+(this.metrics.kills-kills)*.025);
  // Existing combat accounts for all deaths, including those caused by an area skill above.
  const thresholds=[Math.max(40,Math.min(120,Math.floor(this.initialEnemies*.12))),Math.max(160,Math.min(450,Math.floor(this.initialEnemies*.45)))];
  if(this.state==='playing'&&this.choiceTier<2&&this.metrics.kills>=thresholds[this.choiceTier]){this.offers=this.choiceTier===0?['supply','fortify','cadence']:['reserve','energy','repair'];this.choiceTier++;this.choicePending=true;this.state='choosing';this.accumulator=0;this.emit('commandOffer',{tier:this.choiceTier});}
 }
 snapshot(){return {...super.snapshot(),version:VERSION,doctrine:this.doctrine,energy:+this.energy.toFixed(2),skillCooldown:{...this.skillCooldown},skillStats:{...this.skillStats},choicePending:this.choicePending,offers:[...this.offers],choices:[...this.choices],castsPending:this.casts.length,armorBonus:this.armorBonus};}
}
const KEY='multidao-command-100';
function clean(input){const a=input&&typeof input==='object'?input:{},n=v=>Number.isSafeInteger(v)&&v>=0?Math.min(v,10000000):0;return {xp:n(a.xp),battles:n(a.battles),wins:n(a.wins),doctrine:doctrines[a.doctrine]?a.doctrine:'guard',achievements:Array.isArray(a.achievements)?[...new Set(a.achievements.filter(v=>['victory','untouched','tactician','battery'].includes(v)))]:[],receipts:Array.isArray(a.receipts)?a.receipts.filter(v=>typeof v==='string'&&v.length<=100).slice(-128):[]};}
function load(storage){try{return clean(JSON.parse(storage.getItem(KEY)||'null'));}catch{return clean(null);}}
function save(storage,profile){try{storage.setItem(KEY,JSON.stringify(clean(profile)));return true;}catch{return false;}}
function rank(xp){const levels=[0,150,400,800,1400,2400],names=['Recruta','Capitão','Comandante','Marechal','Lenda','Soberano'];let i=0;while(i<levels.length-1&&xp>=levels[i+1])i++;return {name:names[i],index:i,xp,progress:i===levels.length-1?1:(xp-levels[i])/(levels[i+1]-levels[i]),next:levels[i+1]||null};}
function claim(profile,id,game){if(typeof id!=='string'||!id||id.length>100||!['won','lost'].includes(game.state)||profile.receipts.includes(id))return {xp:0,newAchievements:[]};const before=rank(profile.xp).index,xp=Math.min(700,Math.floor(game.metrics.kills/10)+(game.state==='won'?60:0));profile.xp=Math.min(10000000,profile.xp+xp);profile.battles++;if(game.state==='won')profile.wins++;const earned=[];const check={victory:game.state==='won',untouched:game.state==='won'&&game.health>=5,tactician:game.skillStats.casts>=2,battery:game.cannons===3};for(const [k,yes] of Object.entries(check))if(yes&&!profile.achievements.includes(k)){profile.achievements.push(k);earned.push(k);}profile.receipts.push(id);if(profile.receipts.length>128)profile.receipts.shift();return {xp,newAchievements:earned,promoted:rank(profile.xp).index>before};}
return {...Base,Game,VERSION,doctrines,skills,cards,Grid:{fineGrid,force},Command:{KEY,clean,load,save,rank,claim}};
});
