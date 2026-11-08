/* One sampled centreline drives road mesh, collision, navigation and gates.
 * Units use arc-length s and a lateral offset. Nearby bends cannot shortcut. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.CanyonNavigation=api;})(globalThis,()=>{
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=t=>t*t*(3-2*t);
class Road{
 constructor(){
  // Progress t maps to -Z; smooth x transitions produce two broad S bends.
  this.controls=[[0,0],[16,0],[25,-5],[36,3],[47,0],[72,0]];
  this.samples=[];let s=0,previous=null;
  for(let t=0;t<=72.0001;t+=.1){const x=this.center(t),z=5-t;if(previous)s+=Math.hypot(x-previous.x,z-previous.z);const p={s,x,z,t,width:this.widthAt(t)};this.samples.push(p);previous=p;}
  this.length=s;this.gateS=this.atT(15).s;this.plateauS=this.atT(49).s;
  for(let i=0;i<this.samples.length;i++){const a=this.samples[Math.max(0,i-1)],b=this.samples[Math.min(this.samples.length-1,i+1)],n=Math.hypot(b.x-a.x,b.z-a.z)||1;Object.assign(this.samples[i],{tx:(b.x-a.x)/n,tz:(b.z-a.z)/n});}
 }
 center(t){for(let i=1;i<this.controls.length;i++){const a=this.controls[i-1],b=this.controls[i];if(t<=b[0])return a[1]+(b[1]-a[1])*smooth(clamp((t-a[0])/(b[0]-a[0]),0,1));}return 0;}
 widthAt(t){if(t<10)return 6.3;if(t<15)return 6.3-(6.3-2.4)*smooth((t-10)/5);if(t<44)return 2.4;if(t<50)return 2.4+13.8*smooth((t-44)/6);return 16.2;}
 atT(t){return this.samples[clamp(Math.round(t*10),0,this.samples.length-1)];}
 sample(s){s=clamp(s,0,this.length);let lo=0,hi=this.samples.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(this.samples[m].s<=s)lo=m;else hi=m;}const a=this.samples[lo],b=this.samples[hi],f=(s-a.s)/(b.s-a.s||1);return {x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f,width:a.width+(b.width-a.width)*f,tx:a.tx,tz:a.tz,s};}
 point(s,l=0){const p=this.sample(s);return {x:p.x-p.tz*l,z:p.z+p.tx*l};}
 pose(u){const p=this.point(u.s,u.l);u.x=p.x;u.z=p.z;return u;}
 legal(u,r=.135){return Number.isFinite(u.s)&&Number.isFinite(u.l)&&u.s>=0&&u.s<=this.length&&Math.abs(u.l)<=this.sample(u.s).width-r+1e-6;}
 move(u,ds,dl,r=.135){
  const n=Math.max(1,Math.ceil(Math.max(Math.abs(ds),Math.abs(dl))/.09));
  for(let i=0;i<n;i++){u.l=clamp(u.l+dl/n,-this.sample(u.s).width+r,this.sample(u.s).width-r);const next=clamp(u.s+ds/n,0,this.length);if(Math.abs(u.l)<=this.sample(next).width-r)u.s=next;}
  this.pose(u);
 }
 contains(x,z,r=0){let min=Infinity,closest=null;for(const p of this.samples){const d=(p.x-x)**2+(p.z-z)**2;if(d<min){min=d;closest=p;}}return closest&&Math.sqrt(min)<=closest.width-r;}
 sameReach(a,b,range){return Math.abs(a.s-b.s)<=range*1.25 && Math.hypot(a.x-b.x,a.z-b.z)<=range;}
 crossing(a,b,s){const p=this.sample(s),d=q=>(q.x-p.x)*p.tx+(q.z-p.z)*p.tz;const da=d(a),db=d(b);if(!(da<0&&db>=0))return false;const f=-da/(db-da),x=a.x+(b.x-a.x)*f,z=a.z+(b.z-a.z)*f;return Math.abs((x-p.x)*(-p.tz)+(z-p.z)*p.tx)<p.width-.1;}
}
return {Road,clamp};
});
