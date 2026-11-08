/* Multidão 0.4.0 — deterministic simulation, independent of rendering and the DOM. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Multidao = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '0.4.0';
  const STEP = 1 / 60, RADIUS = .20, LIMIT = 6.25;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance2 = (a, b) => (a.x-b.x)**2 + (a.z-b.z)**2;
  class Heap {
    constructor() { this.a = []; }
    push(v) {
      const a=this.a; let i=a.length; a.push(v);
      while(i) { const p=(i-1)>>1; if(a[p][0]<=v[0])break; a[i]=a[p]; i=p; } a[i]=v;
    }
    pop() {
      const a=this.a, first=a[0], last=a.pop();
      if(a.length) { let i=0; while(i*2+1<a.length) { let j=i*2+1; if(j+1<a.length&&a[j+1][0]<a[j][0])j++; if(a[j][0]>=last[0])break; a[i]=a[j];i=j;} a[i]=last; }
      return first;
    }
  }
  class Navigation {
    constructor(walls) {
      this.walls=walls; this.cell=.4; this.x0=-6.4; this.z0=-25.6; this.w=32; this.h=76;
      this.blocked=new Uint8Array(this.w*this.h);
      for(let i=0;i<this.blocked.length;i++) { const p=this.point(i); this.blocked[i]=this.solid(p.x,p.z,.29)?1:0; }
      this.forward=this.field(2); this.backward=this.field(this.h-3);
    }
    solid(x,z,pad=RADIUS) {
      if(x < -LIMIT || x > LIMIT || z < -25.2 || z > 4.4)return true;
      return this.walls.some(w=>Math.abs(x-w.x)<w.w/2+pad && Math.abs(z-w.z)<w.d/2+pad);
    }
    point(i) { return {x:this.x0+(i%this.w+.5)*this.cell,z:this.z0+(Math.floor(i/this.w)+.5)*this.cell}; }
    index(x,z) { return clamp(Math.floor((z-this.z0)/this.cell),0,this.h-1)*this.w+clamp(Math.floor((x-this.x0)/this.cell),0,this.w-1); }
    neighbors(i) {
      const out=[],x=i%this.w,z=Math.floor(i/this.w);
      for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++) {
        if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;
        if(nx<0||nx>=this.w||nz<0||nz>=this.h)continue;
        const j=nz*this.w+nx;
        if(this.blocked[j] || (dx&&dz&&(this.blocked[z*this.w+nx]||this.blocked[nz*this.w+x])))continue;
        out.push([j,dx&&dz?Math.SQRT2:1]);
      } return out;
    }
    field(row) {
      const costs=new Float64Array(this.w*this.h).fill(Infinity),heap=new Heap();
      for(let x=0;x<this.w;x++) {const i=row*this.w+x;if(!this.blocked[i]){costs[i]=0;heap.push([0,i]);}}
      while(heap.a.length) { const [cost,i]=heap.pop(); if(cost>costs[i])continue;
        for(const [j,d] of this.neighbors(i))if(cost+d<costs[j]){costs[j]=cost+d;heap.push([cost+d,j]);}
      } return costs;
    }
    direction(u) {
      const i=this.index(u.x,u.z),costs=u.team==='blue'?this.forward:this.backward;
      // Follow the potential gradient, not a shared waypoint: formations keep their width.
      const cx=i%this.w,cz=Math.floor(i/this.w),current=costs[i];
      const valueAt=(x,z)=>x<0||x>=this.w||z<0||z>=this.h||this.blocked[z*this.w+x]?current+3:costs[z*this.w+x];
      const gx=valueAt(cx-1,cz)-valueAt(cx+1,cz),gz=valueAt(cx,cz-1)-valueAt(cx,cz+1),length=Math.hypot(gx,gz);
      if(Number.isFinite(length)&&length>.01)return {x:gx/length,z:gz/length};
      let best=-1,value=Infinity;
      for(const [j] of this.neighbors(i)) {
        if(costs[j]>=costs[i] && !this.blocked[i])continue;
        const p=this.point(j),score=costs[j]+Math.hypot(p.x-u.x,p.z-u.z)*.15;
        if(score<value){best=j;value=score;}
      }
      if(best<0)return {x:0,z:0};
      const p=this.point(best),dx=p.x-u.x,dz=p.z-u.z,n=Math.hypot(dx,dz)||1;
      return {x:dx/n,z:dz/n};
    }
    clear(a,b) {
      const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.3));
      for(let i=1;i<n;i++)if(this.solid(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,.23))return false;
      return true;
    }
    move(u,dx,dz) {
      // Fixed steps and radius-expanded rectangles prevent tunnelling and corner cutting.
      const n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.1));
      for(let i=0;i<n;i++) {
        const x=clamp(u.x+dx/n,-LIMIT,LIMIT);
        if(!this.solid(x,u.z))u.x=x;
        const z=clamp(u.z+dz/n,-25.1,4.3);
        if(!this.solid(u.x,z))u.z=z;
      }
    }
  }
  class Game {
    constructor({level=1,seed=20261108,autoFire=true}={}) {
      this.seed=seed>>>0;this.autoFire=autoFire;this.reset(level);
    }
    random() { this.rng=(Math.imul(1664525,this.rng)+1013904223)>>>0;return this.rng/4294967296; }
    reset(level=this.level) {
      this.level=Math.max(1,Math.floor(level));this.rng=(this.seed+this.level*101)>>>0;
      this.state='ready';this.time=0;this.accumulator=0;this.nextId=1;this.fireClock=.4;
      this.gunX=2.8;this.aimX=2.8;this.ammo=60;this.health=3;this.blue=[];this.red=[];this.effects=[];
      this.metrics={shots:0,kills:0,losses:0,breaches:0,hits:0,multiplied:0,maxBlue:0};
      const side=this.level%2?1:-1;
      this.walls=[{x:-2.7*side,z:-5.1,w:6.6,d:.8},{x:2.7*side,z:-12.1,w:6,d:.8}];
      this.gates=[{id:0,row:0,x:-3.2,z:-1.3,w:6,m:2,flash:0},{id:1,row:0,x:3.2,z:-1.3,w:6,m:4,flash:0},
        {id:2,row:1,x:-3.2,z:-8.4,w:6,m:2,flash:0},{id:3,row:1,x:3.2,z:-8.4,w:6,m:3,flash:0}];
      if(side<0)for(const g of this.gates)g.x*=-1;
      this.nav=new Navigation(this.walls);
      this.initialEnemies=Math.min(180,64+this.level*16);
      for(let i=0;i<this.initialEnemies;i++)this.add('red',-5.6+(i%15)*.8+(this.random()-.5)*.12,-16.5-Math.floor(i/15)*.88-(this.random()*.12));
      this.reason='';
    }
    add(team,x,z,mask=0,air=0) {
      const u={id:this.nextId++,team,x:clamp(x,-6.1,6.1),z,hp:2,mask,air,age:0,cooldown:this.random()*.25,
        angle:team==='blue'?0:Math.PI,walking:1,swing:0,hit:0};
      if(this.nav.solid(u.x,u.z)) {
        const p=this.nav.point(this.nav.index(u.x,u.z));
        let found=false;
        for(let ring=1;ring<12&&!found;ring++)for(let k=0;k<16;k++) {
          const a=k*Math.PI/8,nx=p.x+Math.cos(a)*ring*.2,nz=p.z+Math.sin(a)*ring*.2;
          if(!this.nav.solid(nx,nz,.3)){u.x=nx;u.z=nz;found=true;break;}
        }
      }
      this[team].push(u);return u;
    }
    start() { this.state='playing'; }
    pause() { if(this.state==='playing')this.state='paused';else if(this.state==='paused')this.state='playing'; this.accumulator=0; }
    aim(x) { if(Number.isFinite(x))this.aimX=clamp(x,-5.7,5.7); }
    fire() {
      if(this.ammo<=0)return;
      this.ammo--;this.metrics.shots++;
      this.add('blue',this.gunX+(this.random()-.5)*.12,2.55,0,.52);
      this.effects.push({type:'muzzle',x:this.gunX,z:2.5,t:.16,max:.16});
    }
    crossGate(u,oldZ,children) {
      for(const g of this.gates) {
        const bit=1<<g.row;
        if((u.mask&bit)||oldZ<g.z||u.z>g.z||Math.abs(u.x-g.x)>g.w/2)continue;
        u.mask|=bit;g.flash=.3;
        for(let k=1;k<g.m;k++)children.push({x:clamp(u.x+(k-(g.m-1)/2)*.36+(this.random()-.5)*.10,-6.1,6.1),z:u.z+.18+k*.16,mask:u.mask});
        this.metrics.multiplied+=g.m-1;break;
      }
    }
    nearest(u,enemies) {
      let best=null,score=Infinity;
      for(const e of enemies) {
        if(e.hp<=0)continue;const d=distance2(u,e);
        if(d>22 && !(u.team==='blue'&&u.z<-22))continue;
        const weighted=d+(this.targetLoad.get(e.id)||0)*.30;
        if(weighted<score&&this.nav.clear(u,e)){score=weighted;best=e;}
      }
      if(best)this.targetLoad.set(best.id,(this.targetLoad.get(best.id)||0)+1);
      return best;
    }
    spatial(units) {
      const map=new Map();
      for(const u of units){const key=Math.floor(u.x)+','+Math.floor(u.z);if(!map.has(key))map.set(key,[]);map.get(key).push(u);}
      return map;
    }
    separate(u,grid) {
      let x=0,z=0;const cx=Math.floor(u.x),cz=Math.floor(u.z);
      for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const v of grid.get((cx+a)+','+(cz+b))||[]) {
        if(v.id===u.id)continue;let dx=u.x-v.x,dz=u.z-v.z,d=Math.hypot(dx,dz);
        if(d<.01){dx=(u.id>v.id?1:-1)*.01;dz=.003;d=.011;}
        if(d<.49){const force=(.49-d)/.49;x+=dx/d*force;z+=dz/d*force;}
      }return {x:clamp(x,-2,2),z:clamp(z,-2,2)};
    }
    step(dt=STEP) {
      if(this.state!=='playing')return;
      this.time+=dt;this.gunX+=(this.aimX-this.gunX)*Math.min(1,dt*16);this.fireClock+=dt;
      while(this.autoFire&&this.ammo>0&&this.fireClock>=.60){this.fireClock-=.60;this.fire();}
      this.effects=this.effects.filter(e=>(e.t-=dt)>0);
      for(const g of this.gates)g.flash=Math.max(0,g.flash-dt);
      this.targetLoad=new Map();
      const all=[...this.blue,...this.red],grid=this.spatial(all),children=[],damage=new Map();
      for(const u of all) {
        if(u.hp<=0)continue;
        u.age+=dt;u.air=Math.max(0,u.air-dt);u.cooldown-=dt;u.swing=Math.max(0,u.swing-dt);u.hit=Math.max(0,u.hit-dt);
        const oldZ=u.z,enemy=this.nearest(u,u.team==='blue'?this.red:this.blue);
        let dir=this.nav.direction(u),attacking=false;
        if(enemy) {
          const dx=enemy.x-u.x,dz=enemy.z-u.z,d=Math.hypot(dx,dz);
          dir={x:dx/(d||1),z:dz/(d||1)};
          attacking=d<.78;
          if(attacking && u.cooldown<=0){u.cooldown=.58;u.swing=.22;damage.set(enemy,(damage.get(enemy)||0)+1);this.metrics.hits++;}
        }
        const sep=this.separate(u,grid),speed=u.team==='blue'?(u.air>0?6.4:3.1):(.78+Math.min(this.level,8)*.035);
        let vx=(attacking?0:dir.x*speed)+sep.x*1.7,vz=(attacking?0:dir.z*speed)+sep.z*1.7;
        if(attacking){vx=sep.x*.5;vz=sep.z*.5;}
        this.nav.move(u,vx*dt,vz*dt);
        u.walking=attacking?0:Math.min(1,Math.hypot(vx,vz));
        if(Math.hypot(dir.x,dir.z)>.01)u.angle=Math.atan2(-dir.x,-dir.z);
        if(u.team==='blue')this.crossGate(u,oldZ,children);
      }
      for(const [u,n] of damage){u.hp-=n;u.hit=.16;if(u.hp<=0)this.effects.push({type:'hit',team:u.team,x:u.x,z:u.z,t:.36,max:.36});}
      for(const c of children)this.add('blue',c.x,c.z,c.mask);
      this.blue=this.blue.filter(u=>{if(u.hp>0)return true;this.metrics.losses++;return false;});
      this.red=this.red.filter(u=>{
        if(u.hp<=0){this.metrics.kills++;return false;}
        if(u.z>=3.65){this.health--;this.metrics.breaches++;return false;}
        return true;
      });
      this.metrics.maxBlue=Math.max(this.metrics.maxBlue,this.blue.length);
      if(this.health<=0){this.state='lost';this.reason='Sua defesa foi atravessada.';}
      else if(!this.red.length){this.state='won';this.reason='Todos os invasores foram derrotados.';}
      else if(this.time>=90){this.state='lost';this.reason='O tempo do cerco acabou.';}
    }
    update(seconds) {
      if(this.state!=='playing')return;
      this.accumulator+=Math.max(0,Math.min(seconds,.25));
      while(this.accumulator>=STEP){this.step(STEP);this.accumulator-=STEP;}
    }
    snapshot() { return {version:VERSION,level:this.level,state:this.state,time:+this.time.toFixed(3),blue:this.blue.length,
      enemies:this.red.length,initialEnemies:this.initialEnemies,ammo:this.ammo,health:this.health,gunX:this.gunX,...this.metrics}; }
  }
  return {VERSION,STEP,RADIUS,Game,Navigation};
});
