'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Game,Navigation,STEP,VERSION}=require('../engine.js');
function audit(g){
 for(const u of [...g.blue,...g.red]){assert.ok(Number.isFinite(u.x)&&Number.isFinite(u.z));assert.equal(g.nav.solid(u.x,u.z),false,`${u.team} ${u.id} entered wall ${u.x},${u.z}`);}
 assert.equal(g.red.length+g.metrics.kills+g.metrics.breaches,g.initialEnemies);
 assert.equal(g.blue.length+g.metrics.losses,g.metrics.shots+g.metrics.multiplied);
 assert.equal(g.ammo+g.metrics.shots,36);
}
function play(g,s=100){g.start();for(let i=0;i<s/STEP&&g.state==='playing';i++){g.step();if(i%30===0)audit(g);}audit(g);return g.snapshot();}
test('version, 4000 actual enemies, three separate route gates',()=>{const g=new Game();assert.equal(VERSION,'0.6.0');assert.equal(g.red.length,4000);assert.deepEqual(g.gates.map(g=>g.m),[20,50,99]);audit(g);});
for(const [x,n,index] of [[-4.1,50,1],[0,20,0],[4.1,99,2]])test(`one shot at ${x} selects only ×${n}`,()=>{const g=new Game({autoFire:false});g.gunX=x;g.aim(x);g.fire();play(g,15);assert.equal(g.metrics.multiplied,n-1);assert.equal(g.metrics.gatePasses,1);assert.equal(g.gates[index].passed,1);assert.equal(g.metrics.shots,1);});
test('clone mask prevents multiplication when a clone re-crosses gate',()=>{const g=new Game({autoFire:false});const u=g.add('blue',4.25,-15.6);const a=[];g.crossGate(u,-15.4,a);assert.equal(a.length,98);const b=[];for(const c of a){const v=g.add('blue',c.x,-15.6,c.mask);g.crossGate(v,-15.4,b);}assert.equal(b.length,0);});
test('large displacement cannot tunnel through walls',()=>{const n=new Navigation([{x:0,z:-5,w:4,d:.8}]),u={x:0,z:0};n.move(u,0,-15);assert.ok(u.z>-4.5);assert.equal(n.solid(u.x,u.z),false);});
test('invaders hold formation initially',()=>{const g=new Game();const positions=g.red.map(u=>[u.x,u.z]);play(g,3);assert.deepEqual(g.red.map(u=>[u.x,u.z]),positions);});
const battles=new Map();
for(const x of [-4.1,0,4.1])test(`full battle at ${x} has a finite result and correct counts`,()=>{const g=new Game();g.aim(x);const s=play(g);battles.set(x,s);console.log('BATTLE',JSON.stringify({aim:x,...s}));assert.ok(['won','lost'].includes(s.state));assert.ok(s.kills>0);assert.ok(s.time<=100.02);if(s.state==='won')assert.equal(s.enemies,0);});
test('default path can actually win',()=>{const s=battles.get(4.1);assert.equal(s.state,'won');assert.equal(s.kills,4000);assert.equal(s.breaches,0);});
test('no firing loses by physical invasion',()=>{const g=new Game({autoFire:false});const s=play(g);assert.equal(s.state,'lost');assert.ok(s.breaches>=5);assert.equal(s.kills,0);});
test('pause is stable and resume progresses',()=>{const g=new Game();play(g,2);g.pause();const before=g.snapshot();g.update(.25);g.step();assert.deepEqual(g.snapshot(),before);g.pause();g.update(.1);assert.ok(g.time>before.time);});
test('restart resets troops, ammunition, effects, and route state',()=>{const g=new Game();play(g,10);g.reset(2);assert.equal(g.state,'ready');assert.equal(g.ammo,36);assert.equal(g.health,5);assert.equal(g.time,0);assert.equal(g.blue.length,0);assert.equal(g.effects.length,0);assert.equal(g.metrics.kills,0);assert.equal(g.red.length,4144);assert.ok(g.gates.every(x=>!x.passed));});
test('display rate does not change simulation',()=>{let out=[];for(const fps of [30,60,120]){const g=new Game({seed:7});g.start();for(let i=0;i<3*fps;i++)g.update(1/fps);out.push(g.snapshot());}assert.deepEqual(out[0],out[1]);assert.deepEqual(out[1],out[2]);});
test('rapid aim changes and collisions remain valid',()=>{const g=new Game({seed:97});g.start();for(let i=0;i<2200&&g.state==='playing';i++){g.aim(Math.sin(i*.013)*8);g.step();assert.ok(Math.abs(g.gunX)<=5.7);if(i%30===0)audit(g);}assert.ok(g.metrics.kills>0);});
test('explicit timeout prevents endless walking',()=>{const g=new Game({autoFire:false});g.start();g.time=99.999;g.step();assert.equal(g.state,'lost');assert.match(g.reason,/tempo/);});
test('particles cannot grow unbounded',()=>{const g=new Game();play(g,16);assert.ok(g.effects.length<=100);assert.ok(g.corpses.length<=80);});
