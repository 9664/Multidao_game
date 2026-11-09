const {Game,STEP}=require('../rush');
const level=Number(process.argv[2])||1,seed=Number(process.argv[3])||20261108,strategy=process.argv[4]||'upgrade',g=new Game({level,seed});
g.start();const start=performance.now();let guard=true;
for(let i=0;i<80/STEP&&g.state==='playing';i++){
 const aim=strategy==='center'?0:g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0;g.aim(aim);if(g.cannons>=3&&g.burstCooldown<=0)g.activateBurst();g.step();
 if(i%60===0){const m=g.metrics;if(g.blue.length+m.losses!==m.soldierShots+m.clones+m.reinforcements)throw Error('blue');if(g.red.length+m.kills+m.breaches!==g.initialEnemies)throw Error('red');if(m.shots+g.ammo!==g.cfg.ammo)throw Error('ammo');for(const u of [...g.red,...g.blue])if(!g.road.legal(u))throw Error('road '+u.id);}
}
console.log(JSON.stringify({elapsed:performance.now()-start,strategy,...g.snapshot()}));
