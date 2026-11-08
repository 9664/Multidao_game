const {Game,STEP}=require('../campaign');
function strategy(g){g.aim(g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);if(g.cannons>=3&&g.burstCooldown<=0)g.activateBurst();}
function audit(g){const m=g.metrics;if(g.blue.length+m.losses!==m.soldierShots+m.clones+m.reinforcements)throw Error('blue');if(g.red.length+m.kills+m.breaches!==g.initialEnemies)throw Error('red');if(g.ammo+m.shots!==g.cfg.ammo)throw Error('ammo');for(const u of [...g.blue,...g.red])if(!g.road.legal(u))throw Error('road '+u.id);}
function run(level,seed=20261108,burst=true){let g=new Game({level,seed});g.start();const start=performance.now();for(let i=0;i<90/STEP+2&&g.state==='playing';i++){strategy(g);g.step();if(i%60===0)audit(g);}audit(g);return {...g.snapshot(),wallMs:Math.round(performance.now()-start)};}
if(require.main===module)console.log(JSON.stringify(run(Number(process.argv[2])||1,Number(process.argv[3])||20261108)));
module.exports={run,audit,strategy};
