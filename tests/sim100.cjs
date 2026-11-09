const fs=require('fs'),{Game}=require('../tactics100'),{audit}=require('./sim092.cjs');
function run(stage,doctrine='guard',seed=20261108,mode='campaign'){
 const g=new Game({level:stage,doctrine,seed,mode,wave:stage,runSeed:seed});g.start();let steps=0;const t=performance.now();
 while(['playing','choosing'].includes(g.state)&&steps<2400){
  if(g.choicePending)g.choose(g.choiceTier===1?'supply':'reserve');
  if(g.state!=='playing')break;
  g.aim(stage===8&&g.time<5?0:g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);
  if(g.cannons>=3&&g.burstCooldown<=0)g.activateBurst();
  if(g.time>4){if(g.energy>=45&&g.skillCooldown.meteor<=0)g.cast('meteor');else if(g.energy>=35&&g.skillCooldown.frost<=0&&g.time>12)g.cast('frost');}
  g.step();if(steps++%30===0)audit(g);
 }
 audit(g);return {...g.snapshot(),seed,steps,wallMs:performance.now()-t};
}
if(require.main===module)console.log(JSON.stringify(run(Number(process.argv[2])||1,process.argv[3]||'guard',Number(process.argv[4])||20261108,process.argv[5]||'campaign')));
module.exports={run};
