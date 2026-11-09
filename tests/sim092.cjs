'use strict';
const {Game,STEP}=require('../impact092');
function audit(g){const m=g.metrics;
 if(g.red.length+m.kills+m.breaches!==g.initialEnemies)throw Error('enemy conservation');
 if(g.blue.length+m.losses!==m.soldierShots+m.clones+m.reinforcements)throw Error('ally conservation');
 if(g.ammo+m.shots!==g.cfg.ammo)throw Error('ammo conservation');
 if(m.shellShots!==m.shellHits+m.shellMisses+g.shells.length)throw Error('shell accounting');
 if(m.clonesPlanned!==m.clones+g.queue.filter(q=>q.origin==='clone').length)throw Error('clone queue');
 if(m.reinforcementsAwarded!==m.reinforcements+g.queue.filter(q=>q.origin==='reinforce').length)throw Error('bonus queue');
 for(const u of [...g.blue,...g.red])if(!g.road.legal(u))throw Error('unit off route '+u.id);
 if(!g.road.legal(g.boss,g.boss.radius))throw Error('boss off route');
 if(g.state==='won'&&(g.red.length||g.boss.state!=='defeated'||g.health<=0))throw Error('premature win');
}
function strategy(g,type){
 if(type==='center')g.aim(0);
 else if(type==='upgrade')g.aim(g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);
 else if(type==='battery')g.aim(g.cannons<3?-4.65:0);
 else if(type==='balanced')g.aim(g.time<5?0:g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);
 else if(type==='idle')g.autoFire=false;
 if(type!=='idle'&&g.cannons>=3&&g.burstCooldown<=0)g.activateBurst();
}
function run(level=1,seed=20261108,type='upgrade',mode='campaign'){
 const g=new Game({level,seed,mode,wave:level,runSeed:seed});g.start();const started=performance.now();let peakBlue=0,firstEmpty=null;
 for(let i=0;i<75/STEP&&g.state==='playing';i++){strategy(g,type);g.step();peakBlue=Math.max(peakBlue,g.blue.length);if(firstEmpty===null&&g.ammo===0)firstEmpty=g.time;if(i%30===0)audit(g);}
 audit(g);return {seed,strategy:type,...g.snapshot(),reason:g.reason,firstEmpty,peakBlue,wallMs:performance.now()-started};
}
if(require.main===module)console.log(JSON.stringify(run(Number(process.argv[2])||1,Number(process.argv[3])||20261108,process.argv[4]||'upgrade',process.argv[5]||'campaign')));
module.exports={run,audit,strategy};
