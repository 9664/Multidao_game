/* 0.7.1 campaign. Extends the reviewed 0.7 engine; the original scenario remains reproducible. */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./engine.js'):root.Multidao,node?require('./navigation.js'):root.CanyonNavigation,node?require('./levels.js'):root.CanyonLevels);
 if(node)module.exports=api;else root.MultidaoCampaign=api;
})(globalThis,(Base,Nav,Defaults)=>{
 'use strict';
 const {clamp,Road}=Nav,VERSION='0.7.1';
 const stages=[
  {id:'dawn',name:'Ponte da Aurora',theme:'sea',boss:'Sentinela das Marés',description:'Aprenda a investir nas torres antes de enfrentar o Sentinela.',width:2.8,turns:[-1.8,1.8],enemies:1200,gate:30,ammo:72,bossHP:280,bossEntryTime:24,upgrades:[4,7],reinforcements:[6,9],redSpeed:.72,salvoInterval:1.02},
  {id:'canyon',name:'Cânion do Guardião',theme:'canyon',boss:'Guardião do Desfiladeiro',description:'Estrada em S: sustente a frente nas curvas e amplie sua bateria.',width:2.4,turns:[-5,3],enemies:2200,gate:50,ammo:80,bossHP:480,bossEntryTime:28,upgrades:[6,10],reinforcements:[8,12],redSpeed:.8,salvoInterval:1.12},
  {id:'snow',name:'Muralha de Gelo',theme:'snow',boss:'Colosso do Inverno',description:'O portão ×99 alimenta uma batalha larga contra a horda do gelo.',width:3.0,turns:[0,0],enemies:2800,gate:99,ammo:68,bossHP:700,bossEntryTime:30,upgrades:[8,12],reinforcements:[9,13],redSpeed:.88,salvoInterval:1.25},
  {id:'sand',name:'Desfiladeiro Dourado',theme:'sand',boss:'Marechal das Dunas',description:'Passagem estreita e invasores rápidos: escolha a hora da rajada.',width:2.1,turns:[4,-3],enemies:2300,gate:50,ammo:82,bossHP:550,bossEntryTime:26,upgrades:[5,9],reinforcements:[7,11],redSpeed:1.0,salvoInterval:1.04,bossWindup:1.2,bossDamage:3},
  {id:'forge',name:'Forja Vulcânica',theme:'lava',boss:'Titã da Forja',description:'Uma ponte sobre lava e golpes de área mais amplos.',width:2.85,turns:[-3.6,4],enemies:3200,gate:75,ammo:84,bossHP:850,bossEntryTime:28,upgrades:[6,10],reinforcements:[9,13],redSpeed:.9,salvoInterval:1.12,bossWindup:1.2,bossAttackRadius:2.15,bossDamage:3},
  {id:'citadel',name:'Fortaleza Boreal',theme:'ice',boss:'Rei da Tempestade',description:'Cerco final: 4.000 invasores, ×99 e o comandante mais resistente.',width:3.2,turns:[1.5,-1.5],enemies:4000,gate:99,ammo:90,bossHP:1100,bossEntryTime:31,upgrades:[7,11],reinforcements:[10,14],redSpeed:.95,salvoInterval:1.18,bossWindup:1.15,bossRecovery:1.6,bossDamage:3}
 ];
 for(const s of stages)Object.freeze(s);Object.freeze(stages);
 class CampaignRoad extends Road{
  constructor(spec){super();this.spec=spec;this.controls=[[0,0],[16,0],[25,spec.turns[0]],[36,spec.turns[1]],[47,0],[72,0]];
   this.samples=[];let length=0,previous=null;
   for(let i=0;i<=720;i++){const t=i/10,x=this.center(t),z=5-t;if(previous)length+=Math.hypot(x-previous.x,z-previous.z);const p={s:length,x,z,t,width:this.widthAt(t)};this.samples.push(p);previous=p;}
   this.length=length;this.gateS=this.atT(15).s;this.plateauS=this.atT(49).s;
   for(let i=0;i<this.samples.length;i++){const a=this.samples[Math.max(0,i-1)],b=this.samples[Math.min(this.samples.length-1,i+1)],n=Math.hypot(b.x-a.x,b.z-a.z)||1;Object.assign(this.samples[i],{tx:(b.x-a.x)/n,tz:(b.z-a.z)/n});}
  }
  widthAt(t){const narrow=this.spec?.width||2.4,smooth=x=>x*x*(3-2*x);if(t<10)return 6.3;if(t<15)return 6.3-(6.3-narrow)*smooth((t-10)/5);if(t<44)return narrow;if(t<50)return narrow+(16.2-narrow)*smooth((t-44)/6);return 16.2;}
 }
 class Game extends Base.Game{
  constructor(options={}){super(options);this.overrides=options.config||{};if(Object.keys(this.overrides).length)this.reset(options.level||1);}
  reset(level=1){
   const n=clamp(Math.floor(Number(level)||1),1,stages.length),stage=stages[n-1];this.stage=stage;
   this.cfg={...Defaults.canyon,...stage,...(this.overrides||{})};
   this.cfg.enemies=(this.overrides?.enemies??stage.enemies)-(n-1)*80;
   this.road=new CampaignRoad(stage);this.baseSalvo=this.cfg.salvoInterval;
   super.reset(n);this.gates[0].w=2*this.road.spec.width-.2;this.gates[0].color=stage.gate>=75?'violet':'gold';
   this.burstLeft=0;this.burstCooldown=5;this.boss.name=stage.boss;
  }
  // Squared-distance rejection avoids Math.hypot for the many neighbours outside the contact radius.
  // This is the same repulsion force and radius as the reviewed engine, not a reduction in live units.
  separation(u,g){
   let s=0,l=0;const key=Math.floor(u.s)*64+Math.floor(u.l)+24;
   for(let ds=-1;ds<=1;ds++)for(let dl=-1;dl<=1;dl++){
    const bucket=g.get(key+ds*64+dl);if(!bucket)continue;
    for(let i=0;i<bucket.length;i++){const v=bucket[i];if(v===u)continue;let a=u.s-v.s,b=u.l-v.l,d2=a*a+b*b;if(d2>=.0961)continue;
     let d=Math.sqrt(d2);if(d<.001){a=(u.id>v.id?1:-1)*.01;b=.007;d=.013;}
     const k=(.31-d)/(.31*d);s+=a*k;l+=b*k;
    }
   }
   return {s:clamp(s,-2,2),l:clamp(l,-2,2)};
  }
  activateBurst(){if(this.state!=='playing'||this.burstCooldown>0||this.ammo<=0)return false;this.burstLeft=3;this.burstCooldown=16;this.emit('burst');return true;}
  step(dt=Base.STEP){if(this.state!=='playing')return;this.burstLeft=Math.max(0,this.burstLeft-dt);this.burstCooldown=Math.max(0,this.burstCooldown-dt);this.cfg.salvoInterval=this.baseSalvo*(this.burstLeft>0?.58:1);super.step(dt);}
  snapshot(){return {...super.snapshot(),version:VERSION,stage:this.stage.id,stageName:this.stage.name,burstLeft:this.burstLeft,burstCooldown:this.burstCooldown,campaignComplete:this.level===stages.length&&this.state==='won'};}
 }
 return {Game,CampaignRoad,stages,VERSION,STEP:Base.STEP};
});
