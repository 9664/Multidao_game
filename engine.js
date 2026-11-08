/* Multidão 0.5.0 — Grande Cerco — deterministic simulation, independent of rendering and the DOM. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Multidao = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '0.5.0';
  const STEP = 1 / 60, RADIUS = .17, LIMIT = 12.15;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance2 = (a, b) => (a.x-b.x)**2 + (a.z-b.z)**2;
  // The upper courtyard widens into a funnel; both navigation and art use this profile.
  const halfWidth = z => 6.25 + clamp((-z - 15) / 6, 0, 1) * 5.9;
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
      this.walls=walls; this.cell=.4; this.x0=-12.8; this.z0=-42; this.w=64; this.h=117;
      this.blocked=new Uint8Array(this.w*this.h);
      for(let i=0;i<this.blocked.length;i++) { const p=this.point(i); this.blocked[i]=this.solid(p.x,p.z,.25)?1:0; }
      this.forward=this.field(2); this.backward=this.field(this.h-3);
    }
    solid(x,z,pad=RADIUS) {
      if(Math.abs(x) > halfWidth(z) || z < -41.6 || z > 4.4)return true;
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
        const z=clamp(u.z+dz/n,-41.5,4.3);
        if(!this.solid(u.x,z))u.z=z;
      }
    }
  }
  // Broad phase spatial hashing: enemies are never searched as an all-vs-all crowd.
  const bucketKey=(x,z)=>(Math.floor(z)+44)*32+Math.floor(x)+16;
  function spatial(units) {
    const grid=new Map();
    for(const u of units){const k=bucketKey(u.x,u.z);let b=grid.get(k);if(!b){b=[];grid.set(k,b);}b.push(u);}
    return grid;
  }
  class Game {
    constructor({level=1,seed=20261108,autoFire=true}={}) {
      this.seed=seed>>>0;this.autoFire=autoFire;this.reset(level);
    }
    random() { this.rng=(Math.imul(1664525,this.rng)+1013904223)>>>0;return this.rng/4294967296; }
    reset(level=this.level) {
      this.level=clamp(Math.floor(Number(level)||1),1,20);this.rng=(this.seed+this.level*101)>>>0;
      this.state='ready';this.phase='assemble';this.time=0;this.tick=0;this.accumulator=0;
      this.nextId=1;this.fireClock=.55;this.gunX=3.15;this.aimX=3.15;
      this.ammo=80;this.health=5;this.duration=120;this.blue=[];this.red=[];this.effects=[];this.corpses=[];
      this.frontZ=-21;this.pressure=0;this.reason='';this.shock=0;
      this.metrics={shots:0,kills:0,losses:0,breaches:0,hits:0,multiplied:0,gatePasses:0,maxBlue:0,peakUnits:0,firstClash:null};
      const side=this.level%2?1:-1;
      this.walls=[{x:0,z:-5.8,w:2.7,d:.85},{x:-3.5*side,z:-11.7,w:2.9,d:.85},{x:3.4*side,z:-15.2,w:2.6,d:.85}];
      this.gates=[{id:0,row:0,x:-3.2,z:-1.5,w:6,m:2,flash:0},{id:1,row:0,x:3.2,z:-1.5,w:6,m:5,flash:0},
        {id:2,row:1,x:-3.2,z:-9,w:6,m:3,flash:0},{id:3,row:1,x:3.2,z:-9,w:6,m:4,flash:0}];
      if(side<0){for(const g of this.gates)g.x*=-1;this.gunX=this.aimX=-3.15;}
      this.nav=new Navigation(this.walls);
      this.initialEnemies=Math.min(960,720+(this.level-1)*48);
      for(let i=0;i<this.initialEnemies;i++)this.add('red',-11.1+(i%36)*.635+(this.random()-.5)*.08,-22.6-Math.floor(i/36)*.64-this.random()*.08);
      this.metrics.peakUnits=this.initialEnemies;
    }
    add(team,x,z,mask=0,air=0) {
      const u={id:this.nextId++,team,x:clamp(x,-halfWidth(z),halfWidth(z)),z,hp:2,mask,air,age:0,
        cooldown:this.random()*.45,angle:team==='blue'?0:Math.PI,walking:0,swing:0,hit:0,target:null};
      if(this.nav.solid(u.x,u.z)) {
        const p=this.nav.point(this.nav.index(u.x,u.z));let found=false;
        for(let ring=1;ring<24&&!found;ring++)for(let k=0;k<16;k++) {
          const a=k*Math.PI/8,nx=p.x+Math.cos(a)*ring*.2,nz=p.z+Math.sin(a)*ring*.2;
          if(!this.nav.solid(nx,nz,.25)){u.x=nx;u.z=nz;found=true;break;}
        }
        if(!found)throw new Error('No navigable spawn position');
      }
      this[team].push(u);return u;
    }
    start() { if(this.state==='ready')this.state='playing'; }
    pause() { if(this.state==='playing')this.state='paused';else if(this.state==='paused')this.state='playing';this.accumulator=0; }
    aim(x) { if(Number.isFinite(x))this.aimX=clamp(x,-5.7,5.7); }
    effect(e) { if(this.effects.length<100)this.effects.push(e); }
    fire() {
      if(this.ammo<=0)return;this.ammo--;this.metrics.shots++;
      this.add('blue',this.gunX+(this.random()-.5)*.12,2.55,0,.52);
      this.effect({type:'muzzle',x:this.gunX,z:2.5,t:.35,max:.35});this.shock=Math.max(this.shock,.018);
    }
    crossGate(u,oldZ,children) {
      for(const g of this.gates) {
        const bit=1<<g.row;
        if((u.mask&bit)||oldZ<g.z||u.z>g.z||Math.abs(u.x-g.x)>g.w/2)continue;
        u.mask|=bit;g.flash=.32;this.metrics.gatePasses++;
        for(let k=1;k<g.m;k++)children.push({x:clamp(u.x+(k-(g.m-1)/2)*.38+(this.random()-.5)*.12,-6.1,6.1),z:u.z+.12+k*.15,mask:u.mask});
        this.metrics.multiplied+=g.m-1;break;
      }
    }
    nearest(u,grid) {
      // Stable targets refreshed at 7.5Hz, not 60 global scans per second.
      if(u.target&&u.target.hp>0&&distance2(u,u.target)<36&&(this.tick+u.id)%8!==0)return u.target;
      let best=null,score=Infinity;const key=bucketKey(u.x,u.z);
      for(let ring=0;ring<=5;ring++){
        for(let dz=-ring;dz<=ring;dz++)for(let dx=-ring;dx<=ring;dx++){
          if(ring&&Math.abs(dx)!==ring&&Math.abs(dz)!==ring)continue;
          const bucket=grid.get(key+dz*32+dx);if(!bucket)continue;
          for(const e of bucket){if(e.hp<=0)continue;const d=distance2(u,e);if(d>30)continue;
            const s=d+(this.targetLoad.get(e.id)||0)*.16;
            if(s<score&&this.nav.clear(u,e)){score=s;best=e;}
          }
        }
        if(best&&ring>=2)break;
      }
      if(best)this.targetLoad.set(best.id,(this.targetLoad.get(best.id)||0)+1);
      u.target=best;return best;
    }
    separate(u,grid) {
      let x=0,z=0;const key=bucketKey(u.x,u.z);
      for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)for(const v of grid.get(key+dz*32+dx)||[]) {
        if(v.id===u.id)continue;let ax=u.x-v.x,az=u.z-v.z,d2=ax*ax+az*az;
        if(d2>=.1936)continue;
        if(d2<.0001){ax=(u.id>v.id?1:-1)*.01;az=.003;d2=.000109;}
        const d=Math.sqrt(d2),force=(.44-d)/.44;x+=ax/d*force;z+=az/d*force;
      }return {x:clamp(x,-2,2),z:clamp(z,-2,2)};
    }
    step(dt=STEP) {
      if(this.state!=='playing')return;
      this.time+=dt;this.tick++;this.gunX+=(this.aimX-this.gunX)*Math.min(1,dt*16);
      this.fireClock+=dt;while(this.autoFire&&this.ammo>0&&this.fireClock>=.55){this.fireClock-=.55;this.fire();}
      this.effects=this.effects.filter(e=>(e.t-=dt)>0);this.corpses=this.corpses.filter(e=>(e.t-=dt)>0);
      this.shock=Math.max(0,this.shock-dt*.22);for(const g of this.gates)g.flash=Math.max(0,g.flash-dt);
      const all=[...this.blue,...this.red],grid=spatial(all),blueGrid=spatial(this.blue),redGrid=spatial(this.red),children=[],damage=new Map();
      this.targetLoad=new Map();let attackers=0,front=0;
      for(const u of all) {
        if(u.hp<=0)continue;
        u.age+=dt;u.air=Math.max(0,u.air-dt);u.cooldown-=dt;u.swing=Math.max(0,u.swing-dt);u.hit=Math.max(0,u.hit-dt);
        if(u.team==='red'&&this.time<6){u.walking=0;continue;}
        const oldZ=u.z,enemy=this.nearest(u,u.team==='blue'?redGrid:blueGrid);
        let dir=this.nav.direction(u),attacking=false;
        if(enemy) {
          const dx=enemy.x-u.x,dz=enemy.z-u.z,d=Math.hypot(dx,dz);
          dir={x:dx/(d||1),z:dz/(d||1)};attacking=d<.68;
          if(attacking){attackers++;front+=u.z;
            if(u.cooldown<=0){u.cooldown=u.team==='blue'?.61:.83;u.swing=.23;damage.set(enemy,(damage.get(enemy)||0)+1);this.metrics.hits++;}
          }
        }else if(u.team==='blue'&&u.z<-18){
          // Give each soldier a distinct lane in the wider courtyard.
          const lane=-10.5+(u.id%31)*.7;dir.x+=clamp((lane-u.x)*.12,-.65,.65);
        }
        const sep=this.separate(u,grid),speed=u.team==='blue'?(u.air>0?6.4:3.0):(.62+Math.min(this.level,8)*.025)*(this.phase==='surge'?1.25:1);
        let vx=(attacking?0:dir.x*speed)+sep.x*(attacking?.65:2.1),vz=(attacking?0:dir.z*speed)+sep.z*(attacking?.65:2.1);
        this.nav.move(u,vx*dt,vz*dt);u.walking=attacking?0:Math.min(1,Math.hypot(vx,vz));
        if(Math.hypot(dir.x,dir.z)>.01)u.angle=Math.atan2(-dir.x,-dir.z);
        if(u.team==='blue')this.crossGate(u,oldZ,children);
      }
      if(attackers){this.frontZ+=(front/attackers-this.frontZ)*.04;this.pressure+=(Math.min(1,attackers/85)-this.pressure)*.03;}
      else this.pressure*=.98;
      for(const [u,n] of damage){u.hp-=n;u.hit=.16;if(u.hp<=0){
        this.effect({type:'hit',team:u.team,x:u.x,z:u.z,t:.4,max:.4});
        if(this.corpses.length<80)this.corpses.push({x:u.x,z:u.z,angle:u.angle,team:u.team,t:.5});
      }}
      for(const c of children)this.add('blue',c.x,c.z,c.mask);
      this.blue=this.blue.filter(u=>{if(u.hp>0)return true;this.metrics.losses++;return false;});
      this.red=this.red.filter(u=>{
        if(u.hp<=0){this.metrics.kills++;return false;}
        if(u.z>=3.65){u.hp=0;this.health--;this.metrics.breaches++;return false;}return true;
      });
      if(this.metrics.hits>0&&this.metrics.firstClash===null){this.metrics.firstClash=this.time;this.phase='clash';this.shock=.11;}
      if(this.metrics.firstClash!==null&&this.red.length<=this.initialEnemies*.23)this.phase='surge';
      this.metrics.maxBlue=Math.max(this.metrics.maxBlue,this.blue.length);this.metrics.peakUnits=Math.max(this.metrics.peakUnits,this.blue.length+this.red.length);
      if(this.health<=0){this.state='lost';this.reason='Cinco invasores atravessaram a defesa.';}
      else if(!this.red.length){this.state='won';this.reason='A horda foi derrotada. O reino resistiu!';}
      else if(!this.ammo&&!this.blue.length){this.state='lost';this.reason='Seus reforços acabaram. Experimente outra rota.';}
      else if(this.time>=this.duration){this.state='lost';this.reason='O tempo do cerco acabou.';}
    }
    update(seconds) {
      if(this.state!=='playing')return;
      this.accumulator+=Math.max(0,Math.min(Number(seconds)||0,.25));
      while(this.accumulator+1e-10>=STEP){this.step(STEP);this.accumulator=Math.max(0,this.accumulator-STEP);}
    }
    snapshot(){return {version:VERSION,level:this.level,state:this.state,phase:this.phase,time:+this.time.toFixed(3),
      blue:this.blue.length,enemies:this.red.length,initialEnemies:this.initialEnemies,ammo:this.ammo,health:this.health,
      gunX:this.gunX,pressure:+this.pressure.toFixed(3),...this.metrics};}
  }
  return {VERSION,STEP,RADIUS,halfWidth,Game,Navigation};
});
