/* Shared, explicit balance configuration. No adaptive or hidden difficulty. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.CanyonLevels=api;})(globalThis,()=>Object.freeze({
  version:'0.7.0',step:1/30,seed:20261108,
  canyon:Object.freeze({enemies:4000,ammo:90,defence:5,duration:90,gate:50,
    salvoInterval:1.12,stagger:.13,shellSpeed:19,towerDamage:1,
    upgrades:[6,10],reinforcements:[9,13],reinforcementCount:99,
    blueHP:3,redHP:2,blueSpeed:3.15,redSpeed:.8,blueCadence:.48,redCadence:1.05,
    bossHP:600,bossRadius:.92,bossEntryTime:30,bossEntryKills:.45,
    bossSpeed:1.45,bossWindup:1,bossRecovery:1.25,bossDamage:2,bossAttackRadius:1.8})
}));
