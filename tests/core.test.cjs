'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {Game,Navigation,STEP}=require('../engine.js');
function play(g,seconds=90,inspect=false){g.start();for(let i=0;i<seconds/STEP&&g.state==='playing';i++){g.step();if(inspect){
 for(const u of [...g.blue,...g.red]){assert.ok(Number.isFinite(u.x)&&Number.isFinite(u.z));assert.equal(g.nav.solid(u.x,u.z),false,'unit entered wall');}
 assert.equal(g.red.length+g.metrics.kills+g.metrics.breaches,g.initialEnemies);
 assert.equal(g.blue.length+g.metrics.losses,g.metrics.shots+g.metrics.multiplied);
 }}return g.snapshot();}
test('auto fire creates soldiers and consumes exactly one charge',()=>{const g=new Game();play(g,1);assert.equal(g.metrics.shots,2);assert.equal(g.ammo,58);});
test('gate multiplies each troop once per row, including clones',()=>{
 const g=new Game({autoFire:false});g.blue=[];
 const u=g.add('blue',3.2,-1.31),children=[];g.crossGate(u,-1.2,children);assert.equal(children.length,3);assert.equal(u.mask,1);
 g.crossGate(u,-1.2,children);assert.equal(children.length,3);
 for(const c of children)g.add('blue',c.x,c.z,c.mask);
 const more=[];for(const a of g.blue){a.z=-8.41;g.crossGate(a,-8.3,more);}assert.equal(more.length,8);
 for(const c of more)g.add('blue',c.x,c.z,c.mask);assert.equal(g.blue.length,12);assert.ok(g.blue.every(a=>a.mask===3));
 const repeats=[];for(const a of g.blue)g.crossGate(a,-8.3,repeats);assert.equal(repeats.length,0);
});
test('swept movement cannot tunnel through walls',()=>{const n=new Navigation([{x:0,z:-5,w:4,d:.8}]),u={x:0,z:0};n.move(u,0,-15);assert.ok(u.z>-4.5);assert.equal(n.solid(u.x,u.z),false);});
for(const x of [-4,0,4])test('complete battle, collision and population invariants, aim '+x,()=>{const g=new Game();g.aim(x);const s=play(g,90,true);assert.equal(s.state,'won');assert.equal(s.kills,80);assert.equal(s.enemies,0);assert.ok(s.time<90);});
test('no-fire defence loses by actual breaches, not a fake counter',()=>{const g=new Game({autoFire:false});const s=play(g,90,true);assert.equal(s.state,'lost');assert.equal(s.health,0);assert.equal(s.breaches,3);assert.equal(s.kills,0);});
test('pause freezes simulation, resume progresses',()=>{const g=new Game();play(g,1);g.pause();const before=g.snapshot();g.update(.2);g.step();assert.deepEqual(g.snapshot(),before);g.pause();g.update(.1);assert.ok(g.time>before.time);});
test('restart restores all phase state and mirrored navigation',()=>{const g=new Game();play(g,3);g.reset(2);assert.equal(g.time,0);assert.equal(g.ammo,60);assert.equal(g.health,3);assert.equal(g.metrics.kills,0);assert.equal(g.blue.length,0);assert.equal(g.state,'ready');assert.equal(g.initialEnemies,96);assert.ok(g.walls[0].x>0);assert.ok(g.gates.find(a=>a.m===4).x<0);});
test('fixed-step result is independent of display frame rate',()=>{const results=[];for(const fps of [30,60,120]){const g=new Game({seed:7});g.start();for(let i=0;i<3*fps;i++)g.update(1/fps);results.push(g.snapshot());}assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);});
test('phase 2 also completes with valid paths and combat',()=>{const g=new Game({level:2,seed:44});g.aim(-2.8);const s=play(g,90,true);assert.ok(['won','lost'].includes(s.state));assert.ok(s.kills>0);assert.ok(s.time<=90.02);});
test('rapid aim changes remain finite and inside arena',()=>{const g=new Game({seed:97});g.start();for(let i=0;i<1200&&g.state==='playing';i++){g.aim(Math.sin(i*.017)*9);g.step();assert.ok(Math.abs(g.gunX)<=5.7);if(i%30===0)for(const u of [...g.blue,...g.red])assert.equal(g.nav.solid(u.x,u.z),false);}assert.ok(g.metrics.kills>0);});
