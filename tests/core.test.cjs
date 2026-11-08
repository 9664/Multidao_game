'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Game,Navigation,STEP,VERSION,halfWidth}=require('../engine.js');
function invariants(g){
 for(const u of [...g.blue,...g.red]){assert.ok(Number.isFinite(u.x)&&Number.isFinite(u.z));assert.equal(g.nav.solid(u.x,u.z),false,`unit ${u.id} in solid at ${u.x},${u.z}`);}
 assert.equal(g.red.length+g.metrics.kills+g.metrics.breaches,g.initialEnemies);
 assert.equal(g.blue.length+g.metrics.losses,g.metrics.shots+g.metrics.multiplied);
 assert.equal(g.metrics.shots+g.ammo,80);
}
function play(g,seconds=120,check=false){g.start();for(let i=0;i<seconds/STEP&&g.state==='playing';i++){g.step();if(check&&i%12===0)invariants(g);}invariants(g);return g.snapshot();}
test('0.5.0 has 720 real invaders, all navigable from the first frame',()=>{const g=new Game();assert.equal(VERSION,'0.5.0');assert.equal(g.red.length,720);assert.equal(g.initialEnemies,720);invariants(g);assert.ok(halfWidth(-30)>halfWidth(0));});
test('auto fire consumes one charge per actual soldier',()=>{const g=new Game();play(g,1);assert.equal(g.metrics.shots,2);assert.equal(g.ammo,78);assert.ok(g.blue.length>=2);});
test('invaders hold their initial formation during preparation',()=>{const g=new Game();const before=g.red.map(u=>[u.x,u.z]);play(g,3);assert.deepEqual(g.red.map(u=>[u.x,u.z]),before);assert.equal(g.metrics.hits,0);});
test('multipliers are exact: one ×5 then ×4 equals 20, including clones',()=>{
 const g=new Game({autoFire:false});g.blue=[];const u=g.add('blue',3.2,-1.51),children=[];
 g.crossGate(u,-1.4,children);assert.equal(children.length,4);assert.equal(u.mask,1);g.crossGate(u,-1.4,children);assert.equal(children.length,4);
 for(const c of children)g.add('blue',c.x,c.z,c.mask);
 const more=[];for(const a of g.blue){a.z=-9.01;g.crossGate(a,-8.9,more);}assert.equal(more.length,15);
 for(const c of more)g.add('blue',c.x,c.z,c.mask);assert.equal(g.blue.length,20);assert.ok(g.blue.every(a=>a.mask===3));
 const repeats=[];for(const a of g.blue)g.crossGate(a,-8.9,repeats);assert.equal(repeats.length,0);
});
test('swept collision never tunnels through a wall',()=>{const n=new Navigation([{x:0,z:-5,w:4,d:.8}]),u={x:0,z:0};n.move(u,0,-15);assert.ok(u.z>-4.5);assert.equal(n.solid(u.x,u.z),false);});
for(const x of [-4,0,4])test('full battle at aim '+x+' preserves collision and troop accounting',()=>{const g=new Game();g.aim(x);const s=play(g,120,true);assert.ok(['won','lost'].includes(s.state));assert.ok(s.kills>0);assert.ok(s.firstClash>0);assert.ok(s.time<=120.02);if(s.state==='won')assert.equal(s.kills+s.breaches,720);});
test('default grand siege reaches a real victory and 850+ concurrent combatants',()=>{const s=play(new Game(),120,true);assert.equal(s.state,'won');assert.equal(s.kills,720);assert.equal(s.enemies,0);assert.ok(s.peakUnits>=850);assert.ok(s.maxBlue>=250);assert.ok(s.time>15);});
test('no firing loses from actual breaches without imaginary kills',()=>{const s=play(new Game({autoFire:false}),120,true);assert.equal(s.state,'lost');assert.ok(s.health<=0);assert.ok(s.breaches>=5);assert.equal(s.kills,0);});
test('pause freezes the simulation and resume advances it',()=>{const g=new Game();play(g,2);g.pause();const before=g.snapshot();g.update(.2);g.step();assert.deepEqual(g.snapshot(),before);g.pause();g.update(.1);assert.ok(g.time>before.time);});
test('restart clears transient combat effects and mirrors phase two',()=>{const g=new Game();play(g,10);g.reset(2);assert.equal(g.time,0);assert.equal(g.ammo,80);assert.equal(g.health,5);assert.equal(g.effects.length,0);assert.equal(g.corpses.length,0);assert.equal(g.blue.length,0);assert.equal(g.state,'ready');assert.equal(g.initialEnemies,768);assert.ok(g.gates.find(a=>a.m===5).x<0);});
test('simulation is independent of 30/60/120Hz rendering',()=>{const out=[];for(const fps of [30,60,120]){const g=new Game({seed:7});g.start();for(let i=0;i<3*fps;i++)g.update(1/fps);out.push(g.snapshot());}assert.deepEqual(out[0],out[1]);assert.deepEqual(out[1],out[2]);});
test('mirrored second siege has a reachable result and real casualties',()=>{const g=new Game({level:2,seed:44});const s=play(g,120,true);assert.ok(['won','lost'].includes(s.state));assert.ok(s.kills>200);});
test('rapid aim changes do not create invalid positions',()=>{const g=new Game({seed:97});g.start();for(let i=0;i<2100&&g.state==='playing';i++){g.aim(Math.sin(i*.017)*9);g.step();assert.ok(Math.abs(g.gunX)<=5.7);if(i%12===0)invariants(g);}assert.ok(g.metrics.kills>0);});
test('120 seconds timeout is an explicit defeat, not endless walking',()=>{const g=new Game({autoFire:false});g.start();g.time=119.999;g.step();assert.equal(g.state,'lost');assert.match(g.reason,/tempo/);});
test('effects remain bounded without removing real troops',()=>{const g=new Game();play(g,15,true);assert.ok(g.effects.length<=100);assert.ok(g.corpses.length<=80);assert.equal(g.blue.length+g.metrics.losses,g.metrics.shots+g.metrics.multiplied);});
test('difficulty is finite and starts with 960 actual enemies at level 20',()=>{const g=new Game({level:999});assert.equal(g.level,20);assert.equal(g.red.length,960);invariants(g);});
