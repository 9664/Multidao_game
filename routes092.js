/* Impacto e Variedade: terrain, formations and explicit, bounded difficulty. */
(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./campaign'):root.MultidaoCampaign,node?require('./navigation'):root.CanyonNavigation,node?require('./fast-road'):root.SiegePerformance);if(node)module.exports=api;else root.MultidaoRoutes092=api;})(globalThis,(Campaign,Nav,Performance)=>{
'use strict';
const {clamp}=Nav,VERSION='0.9.2',GENERATOR=2;
const formations=Object.freeze({block:'Bloco compacto',serpent:'Serpente',wedge:'Cunha',columns:'Duas colunas',pulses:'Pelotões alternados',flanks:'Centro e flancos'});
const formats=Object.freeze({classic:'Estrada sinuosa',bridge:'Ponte suspensa',forest:'Clareiras e ruínas',bastions:'Pátios e gargalos',chicane:'Passarelas em zigue-zague'});
const stages=Campaign.stages.map((s,i)=>({...s,format:i===0?'bridge':'classic',formation:['block','serpent','wedge','columns','pulses','flanks'][i],rank:i+1}));
stages.push(
 {id:'grove',name:'Ruínas da Floresta',theme:'forest',format:'forest',formation:'pulses',rank:7,boss:'Guardião das Raízes',description:'Clareiras largas alternam com passagens entre ruínas. Pelotões chegam separados.',width:2.7,turns:[-3.1,3.1],enemies:2800,gate:75,ammo:88,bossHP:900,bossEntryTime:18,upgrades:[7,11],reinforcements:[9,13],redSpeed:1.05,bossDamage:3},
 {id:'bastions',name:'Bastiões da Cidadela',theme:'bastion',format:'bastions',formation:'columns',rank:8,boss:'Marechal de Bronze',description:'Três pátios ligados por gargalos. Sustente a frente antes de investir nas torres.',width:2.5,turns:[0,0],enemies:3400,gate:99,ammo:88,bossHP:1200,bossEntryTime:17,upgrades:[8,12],reinforcements:[10,14],redSpeed:1.08,bossDamage:3},
 {id:'harbor',name:'Passarelas do Porto',theme:'sea',format:'chicane',formation:'flanks',rank:9,boss:'Almirante do Cerco',description:'Cotovelos alternados sobre o mar. A elite concentra a pressão no fim da campanha.',width:2.8,turns:[3.6,-3.6],enemies:3600,gate:99,ammo:90,bossHP:1350,bossEntryTime:17,upgrades:[8,13],reinforcements:[10,14],redSpeed:1.10,bossDamage:3}
);
for(const s of stages){s.upgrades=Object.freeze([...s.upgrades]);s.reinforcements=Object.freeze([...s.reinforcements]);Object.freeze(s);}Object.freeze(stages);
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
function blendProfile(t,points){for(let i=1;i<points.length;i++)if(t<=points[i][0]){const a=points[i-1],b=points[i];return a[1]+(b[1]-a[1])*smooth((t-a[0])/(b[0]-a[0]));}return points[points.length-1][1];}
class Road extends Nav.Road{
 constructor(spec){super();this.spec=spec;
  const [a,b]=spec.turns;
  this.controls=spec.format==='forest'?[[0,0],[16,0],[25,-3.1],[35,3.1],[44,0],[72,0]]:
    spec.format==='bastions'?[[0,0],[72,0]]:
    spec.format==='chicane'?[[0,0],[16,0],[23,3.6],[31,-3.6],[39,3.6],[47,0],[72,0]]:
    spec.format==='bridge'?[[0,0],[16,0],[30,-.8],[44,.8],[50,0],[72,0]]:
    [[0,0],[16,0],[25,a],[36,b],[47,0],[72,0]];
  this.samples=[];let s=0,old=null;
  for(let i=0;i<=720;i++){const t=i/10,x=this.center(t),z=5-t;if(old)s+=Math.hypot(x-old.x,z-old.z);const p={s,x,z,t,width:this.widthAt(t)};this.samples.push(p);old=p;}
  this.length=s;this.gateS=this.atT(15).s;this.plateauS=this.atT(49).s;
  for(let i=0;i<this.samples.length;i++){const a=this.samples[Math.max(0,i-1)],b=this.samples[Math.min(this.samples.length-1,i+1)],n=Math.hypot(b.x-a.x,b.z-a.z)||1;Object.assign(this.samples[i],{tx:(b.x-a.x)/n,tz:(b.z-a.z)/n});}
  Performance.accelerateRoad(this);
 }
 widthAt(t){const w=this.spec?.width||2.4,f=this.spec?.format||'classic';if(t<10)return 6.3;if(t<15)return 6.3-(6.3-w)*smooth((t-10)/5);
  let edge=w;
  if(f==='forest')edge=blendProfile(t,[[15,w],[21,3.3],[26,3.3],[30,2.1],[35,3.3],[39,3.3],[43,2.1],[44,w]]);
  if(f==='bastions')edge=blendProfile(t,[[15,w],[19,5.1],[23,5.1],[27,1.85],[30,5.1],[34,5.1],[38,1.85],[41,5.1],[44,w]]);
  if(f==='bridge')edge=blendProfile(t,[[15,w],[20,2.1],[39,2.1],[44,w]]);
  if(t<44)return edge;if(t<50)return w+(16.2-w)*smooth((t-44)/6);return 16.2;
 }
}
function random(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function difficulty(rank){const p=1-Math.exp(-Math.max(0,rank-1)/12);return {redHP:rank<3?2:rank<4?3:rank<6?4:rank<8?5:rank<9?8:10,eliteRate:rank===1?0:Math.min(.15,.01+.011*(rank-1)),runnerRate:Math.min(.14,.025+.008*(rank-1)),redCadence:1.00-.29*p,speedFactor:1+Math.min(.13,(rank-1)*.014),bossRecovery:Math.max(1.10,1.55-.035*(rank-1)),rank};}
function generate(wave,seed=20261108){wave=Number.isSafeInteger(wave)&&wave>0?wave:1;seed=seed>>>0;const cycle=Math.floor((wave-1)/stages.length),order=Array.from({length:stages.length},(_,i)=>i),r=random(seed^Math.imul(cycle+1,0x45d9f3b));
 for(let i=order.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const base=stages[order[(wave-1)%stages.length]],q=random(seed^Math.imul(wave,0x9e3779b1)^Math.floor(wave/4294967296)),p=1-Math.exp(-(wave-1)/20),event=wave%10===0?'commander':wave%5===0?'elite':'siege';
 const formation=Object.keys(formations)[Math.floor(q()*Object.keys(formations).length)],format=base.format;
 return {...base,id:'endless-'+wave,mode:'endless',wave,seed,generator:GENERATOR,rank:wave,event,formation,format,
  enemies:Math.min(3600,Math.round((1100+p*2350+(q()-.5)*160)/20)*20),gate:wave<4?50:wave<9?75:99,ammo:88,
  bossHP:Math.round((320+p*850)*(event==='commander'?1.15:1)),redSpeed:.85+.22*p,
  upgrades:[5+Math.floor(p*3),8+Math.floor(p*4)],reinforcements:[8,12],
  turns:format==='classic'?[(q()-.5)*7,(q()-.5)*6]:base.turns,
  bossWindup:event==='commander'?1.25:1.15,bossAttackRadius:event==='commander'?2.1:1.8,bossDamage:wave>=10?3:2,
  description:'Onda '+wave+' · '+formats[format]+'. Formação: '+formations[formation]+'.',boss:base.boss+(event==='commander'?' · Comandante':event==='elite'?' · Elite':'')};
}
function arrange(game){
 const n=game.initialEnemies,front=Math.min(n,Math.max(96,Math.floor(n*.28))),cols=12,rows=Math.ceil(front/cols),start=game.gates[0].s+9.7,end=game.road.plateauS+.5,r=random((game.seed+game.level*101+(game.runSeed||0))>>>0),f=game.stage.formation;
 game.red=[];game.nextId=1;game.eliteCount=0;game.runnerCount=0;
 function spawn(i,s,slot,row,totalRows){const p=game.road.sample(s),w=Math.max(.3,Math.min(p.width-.27,s<game.road.plateauS?3.8:15.2)),j=(r()-.5)*.10;
  let l=slot*w;
  if(f==='wedge')l=slot*w*(.18+.82*Math.min(1,row/Math.max(1,totalRows*.55)));
  if(f==='columns')l=(slot<0?-.62:.62)*w+slot*w*.20;
  if(f==='serpent')l=w*(Math.sin(s*.38)*.35+slot*.48);
  if(f==='flanks')l=Math.abs(slot)<.30?slot*w*.8:Math.sign(slot)*(.65+Math.abs(slot)*.26)*w;
  if(f==='pulses')l=(row%12<6?-.20:.20)*w+slot*w*.69;
  const u=game.add('red',s,clamp(l+j,-w,w)),roll=r();
  u.kind=roll<game.cfg.eliteRate?'armored':roll<game.cfg.eliteRate+game.cfg.runnerRate?'runner':'regular';
  if(u.kind==='armored'){u.hp+=3;u.speed*=.86;u.attackCadence=game.cfg.redCadence*.90;game.eliteCount++;}
  if(u.kind==='runner'){u.speed*=1.25;u.attackCadence=game.cfg.redCadence;game.runnerCount++;}
  u.maxHP=u.hp;u.px=u.x;u.pz=u.z;u.pa=u.angle;
 }
 for(let i=0;i<front;i++){const row=Math.floor(i/cols),progress=row/Math.max(1,rows-1);let s=start+(end-start)*progress;
  if(f==='pulses')s+=Math.floor(row/6)*.28;s=Math.min(end,s);spawn(i,s,((i%cols)/11*2-1),row,rows);}
 const rest=n-front,c=64,ranks=Math.ceil(rest/c),last=game.road.length-.4;
 for(let i=0;i<rest;i++){const row=Math.floor(i/c),s=end+.6+(last-end-.6)*row/Math.max(1,ranks-1);spawn(front+i,Math.min(last,s),i%c/(c-1)*2-1,row,ranks);}
 game.metrics.peakUnits=n;
}
return {VERSION,GENERATOR,stages,formations,formats,Road,generate,difficulty,arrange};
});
