'use strict';
const {Game,STEP}=require('../engine.js');
function strategy(g,type){
 if(type==='center')g.aim(0);
 if(type==='upgrade')g.aim(g.cannons<3?-4.65:0);
 if(type==='reinforce')g.aim(g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);
 if(type==='alternate')g.aim(g.time<28?(Math.floor(g.time/6)%2?-4.65:4.65):0);
 if(type==='demo')g.aim(g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);
}
function audit(g){
 const m=g.metrics,fail=x=>{throw Error(x+' @ '+g.time)};
 if(g.blue.length+m.losses!==m.soldierShots+m.reinforcements+m.clones)fail('Blue conservation');
 if(g.red.length+m.kills+m.breaches!==g.initialEnemies)fail('Red conservation');
 if(g.ammo+m.shots!==g.cfg.ammo)fail('Ammo conservation');
 if(m.shots!==m.soldierShots+m.shellShots)fail('Shot types');
 if(m.clonesPlanned!==m.clones+g.queue.filter(q=>q.origin==='clone').length)fail('Clone queue');
 if(m.reinforcementsAwarded!==m.reinforcements+g.queue.filter(q=>q.origin==='reinforce').length)fail('Bonus queue');
 for(const u of [...g.blue,...g.red]){if(!g.road.legal(u))fail('Outside road '+u.id);for(const t of g.towers)if(t.state==='active'&&Math.abs(u.x-t.x)<t.radius+.10&&Math.abs(u.z-t.z)<t.radius+.10)fail('Inside tower '+u.id);}
 if(!g.road.legal(g.boss,g.boss.radius))fail('Boss outside road');
 if(g.state==='won'&&(g.boss.state!=='defeated'||g.red.length||g.health<=0))fail('Premature win');
}
function run(seed=20261108,type='demo'){
 const g=new Game({seed}),start=performance.now();g.start();let strikeHP=[];
 for(let i=0;i<90/STEP+1&&g.state==='playing';i++){strategy(g,type);g.step();if(i%30===0)audit(g);}
 audit(g);return {engineSHA256:require('node:crypto').createHash('sha256').update(require('node:fs').readFileSync(require.resolve('../engine.js'))).digest('hex'),seed,strategy:type,wallMs:Math.round(performance.now()-start),...g.snapshot()};
}
if(require.main===module)console.log(JSON.stringify(run(Number(process.argv[2])||20261108,process.argv[3]||'demo')));
module.exports={strategy,audit,run};
