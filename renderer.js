/* Grande Cerco 0.6.0 — instanced WebGL, near/far troop models and procedural FX. All art is procedural and original. */
(function(root){
'use strict';
const VERT=`
attribute vec3 aPosition; attribute vec3 aNormal; attribute vec3 aColor;
attribute vec2 aPart; attribute vec3 aOffset; attribute vec4 aParams; attribute vec3 aTint;
uniform mat4 uVP; uniform float uTime; varying vec3 vColor; varying float vAlpha;
void main(){
 vec3 p=aPosition; bool fx=aPart.x==9.0; if(fx)p*=max(.001,aParams.y); float wave=sin(uTime*12.0+aParams.z);
 if(abs(aPart.x)==1.0){p.z+=wave*.14*aPart.x*aParams.y;p.y+=max(0.0,wave*aPart.x)*.07*aParams.y;}
 if(aPart.x==2.0){p.z-=aParams.w*.24;}
 if(aPart.x!=9.0)p.y+=abs(wave)*.025*aParams.y;
 float c=cos(aParams.x),s=sin(aParams.x);
 mat3 rot=mat3(c,0.,-s,0.,1.,0.,s,0.,c);
 vec3 n=rot*aNormal;
 float light=.57+.43*max(0.,dot(normalize(n),normalize(vec3(-.5,1.,.6))));
 vec3 col=mix(aColor,aColor*aTint,aPart.y);
 vColor=mix(col,vec3(1.,.92,.65),fx?0.:min(.65,aParams.w*.55))*light;
 vAlpha=fx?1.-aParams.w:1.;
 gl_Position=uVP*vec4(rot*p+aOffset,1.);
}`;
const FRAG=`precision mediump float; varying vec3 vColor; varying float vAlpha; void main(){gl_FragColor=vec4(vColor,vAlpha);}`;
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function view(eye,target){const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
function ortho(w,h){return new Float32Array([1/w,0,0,0,0,1/h,0,0,0,0,-2/100,0,0,0,-1,1]);}
function perspective(aspect){const f=1/Math.tan(43*Math.PI/360),n=1,far=200;return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]);}
class Geometry {
 constructor(){this.v=[];}
 rotBox(x,y,z,w,h,d,color,angle){const g=new Geometry();g.box(0,0,0,w,h,d,color);const c=Math.cos(angle),s=Math.sin(angle);for(let i=0;i<g.v.length;i+=11){const v=g.v;const px=v[i],pz=v[i+2],nx=v[i+3],nz=v[i+5];v[i]=x+px*c+pz*s;v[i+1]+=y;v[i+2]=z-px*s+pz*c;v[i+3]=nx*c+nz*s;v[i+5]=-nx*s+nz*c;}this.v.push(...g.v);}

 tri(a,b,c,color,part=0,tint=0){const n=norm(cross(sub(b,a),sub(c,a)));for(const p of [a,b,c])this.v.push(...p,...n,...color,part,tint);}
 box(x,y,z,w,h,d,color,part=0,tint=0){
  const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(a=>[x+a[0]*w/2,y+a[1]*h/2,z+a[2]*d/2]);
  for(const f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){this.tri(p[f[0]],p[f[1]],p[f[2]],color,part,tint);this.tri(p[f[0]],p[f[2]],p[f[3]],color,part,tint);}
 }
 cylinder(x,y,z,r,h,n,color,axis='y',top=r,part=0,tint=0){
  const tr=p=>axis==='z'?[x+p[0],y-p[2],z+p[1]]:axis==='x'?[x+p[1],y+p[0],z+p[2]]:[x+p[0],y+p[1],z+p[2]];
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;
   const p=[tr([Math.cos(a)*r,-h/2,Math.sin(a)*r]),tr([Math.cos(b)*r,-h/2,Math.sin(b)*r]),tr([Math.cos(b)*top,h/2,Math.sin(b)*top]),tr([Math.cos(a)*top,h/2,Math.sin(a)*top])];
   this.tri(p[0],p[2],p[1],color,part,tint);this.tri(p[0],p[3],p[2],color,part,tint);
   this.tri(tr([0,-h/2,0]),p[0],p[1],color,part,tint);this.tri(tr([0,h/2,0]),p[2],p[3],color,part,tint);
  }
 }
}
const C={stone:[.38,.39,.42],edge:[.51,.52,.55],road:[.57,.54,.56],grass:[.91,.93,.96],gold:[.96,.69,.25],wood:[.39,.23,.12],steel:[.37,.45,.50],dark:[.14,.20,.21],blue:[.04,.38,1],red:[.90,.035,.085]};
const identity=[0,0,0,0,0,0,0,1,1,1];
class Renderer {
 constructor(canvas){
  this.canvas=canvas;this.quality=1.5;this.reducedMotion=false;this.drawCalls=0;this.instanceCapacity=0;this.instanceData=new Float32Array(10240);
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'high-performance'});
  if(!gl)throw new Error('Seu navegador não disponibilizou WebGL. Abra o link no Chrome ou Safari atualizado.');
  this.gl=gl;this.ext=gl.getExtension('ANGLE_instanced_arrays');
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
  const vs=shader(gl.VERTEX_SHADER,VERT),fs=shader(gl.FRAGMENT_SHADER,FRAG),p=gl.createProgram();
  gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));gl.deleteShader(vs);gl.deleteShader(fs);
  this.program=p;gl.useProgram(p);this.attr={};
  for(const n of ['aPosition','aNormal','aColor','aPart','aOffset','aParams','aTint'])this.attr[n]=gl.getAttribLocation(p,n);
  this.vpLoc=gl.getUniformLocation(p,'uVP');this.timeLoc=gl.getUniformLocation(p,'uTime');this.instance=gl.createBuffer();
  gl.enable(gl.DEPTH_TEST);gl.clearColor(.74,.81,.85,1);
  this.unit=this.mesh(this.unitGeometry());this.farUnit=this.mesh(this.farGeometry());this.cannon=this.mesh(this.cannonGeometry());
  const shadow=new Geometry();shadow.cylinder(0,.012,0,.21,.008,6,[.35,.34,.37]);this.shadow=this.mesh(shadow);
  const spark=new Geometry();spark.cylinder(0,0,0,.10,.16,5,[1,1,1],'y',.04,9,1);this.spark=this.mesh(spark);
  this.resize();
 }
 mesh(geo){const gl=this.gl,b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geo.v),gl.STATIC_DRAW);return {buffer:b,count:geo.v.length/11};}
 unitGeometry(){
  const g=new Geometry(),white=[.96,.97,1],metal=[.77,.82,.82],skin=[.88,.67,.45];
  g.box(0,.51,0,.34,.40,.24,white,0,1);
  g.box(-.095,.19,0,.13,.30,.16,C.dark,-1);g.box(.095,.19,0,.13,.30,.16,C.dark,1);
  g.box(0,.68,0,.40,.09,.28,metal);g.box(0,.34,0,.36,.08,.25,C.gold);
  g.cylinder(0,.89,0,.19,.24,7,white,'y',.17,0,1);g.cylinder(0,1.05,0,.19,.13,8,white,'y',.04,0,1);
  g.box(0,.89,-.181,.24,.055,.025,C.dark);g.box(0,.80,-.16,.14,.06,.07,skin);
  g.box(-.26,.53,-.10,.25,.36,.07,white,0,1);g.box(-.26,.53,-.145,.055,.30,.025,C.gold);
  g.box(.24,.56,0,.11,.28,.12,white,2,1);g.box(.29,.77,-.10,.05,.44,.045,metal,2);g.box(.29,.60,-.10,.19,.055,.065,C.gold,2);
  for(let i=0;i<g.v.length;i+=11){g.v[i]*=.60;g.v[i+1]*=.60;g.v[i+2]*=.60;}return g;
 }
 farGeometry(){const g=new Geometry();g.cylinder(0,.34,0,.125,.36,5,[1,1,1],'y',.105,0,1);g.cylinder(0,.61,0,.128,.20,5,[1,1,1],'y',.07,0,1);g.box(0,.12,0,.16,.19,.12,C.dark);return g;}
 cannonGeometry(){
  const g=new Geometry();g.box(0,.38,0,1.15,.35,1.25,[.11,.31,.60]);
  for(const x of [-.68,.68]){g.cylinder(x,.35,0,.35,.20,12,C.dark,'x');g.cylinder(x*1.02,.35,0,.12,.22,8,C.gold,'x');}
  g.cylinder(0,.75,-.40,.27,1.35,12,C.steel,'z',.23);g.cylinder(0,.75,-1.06,.27,.12,12,C.gold,'z');g.cylinder(0,.75,-1.13,.19,.025,12,[.04,.06,.07],'z');
  g.box(0,.46,.46,.44,.22,.22,C.gold);for(let i=0;i<g.v.length;i+=11){g.v[i]*=1.30;g.v[i+1]*=1.30;g.v[i+2]*=1.30;}return g;
 }
 rebuild(game){
  if(this.world)this.gl.deleteBuffer(this.world.buffer);
  const g=new Geometry(),half=Multidao.halfWidth;
  g.box(0,-.30,-18,100,.40,100,C.grass);
  const outline=[[-6.65,14],[6.65,14],[6.65,-15],[20.55,-21],[20.55,-60],[-20.55,-60],[-20.55,-21],[-6.65,-15]];
  for(let i=0;i<outline.length;i++)g.tri([0,-.055,-16],[outline[i][0],-.055,outline[i][1]],[outline[(i+1)%outline.length][0],-.055,outline[(i+1)%outline.length][1]],C.road);
  // Shallow, low-contrast paving, not a visible checkerboard.
  for(let z=-60;z<14;z+=1.7)for(let x=-half(z)+.65;x<half(z)-.5;x+=2.25){const v=((Math.floor((x+24)*7)+Math.floor(-z)*11)%5)*.003;g.box(x,-.045,z,2.23,.01,1.68,[.58+v,.55+v,.57+v]);}
  // The parapet follows the widening battle entrance. No back castle in frame.
  for(let z=-60;z<14;z+=.72)for(const side of [-1,1]){
    const x=side*(half(z)+.28),angle=z>-21&&z<-15?-side*Math.atan(13.9/6):0;
    g.rotBox(x,.38,z,.48,.76,z>-21&&z<-15?1.98:.76,C.stone,angle);
    if(Math.floor((z+43)/.72)%2===0)g.rotBox(x,.83,z,.50,.18,.43,C.edge,angle);
    g.rotBox(x+side*.30,.013,z,.18,.02,.75,[.42,.41,.44],angle);
  }
  for(const w of game.walls){
    g.box(w.x+.16,-.005,w.z+.23,w.w+.34,.018,w.d+.46,[.47,.44,.47]);g.box(w.x,.36,w.z,w.w,.72,w.d,C.stone);g.box(w.x,.76,w.z,w.w+.025,.09,w.d+.025,C.edge);
    const n=Math.max(1,Math.floor(w.w/.58));
    for(let j=0;j<n;j++)for(let row=0;row<3;row++)g.box(w.x-w.w/2+(j+.5)*w.w/n,.14+row*.23,w.z+w.d/2+.006,w.w/n-.015,.215,.016,[.43+row*.006,.44+row*.006,.47+row*.006]);
  }
  for(const a of game.gates){
    for(const x of [a.x-a.w/2,a.x+a.w/2]){g.box(x,.65,a.z,.14,1.30,.18,C.gold);g.box(x,.10,a.z,.28,.20,.28,C.stone);}
    g.box(a.x,1.20,a.z,a.w,.12,.19,C.gold);g.box(a.x,.005,a.z,a.w,.025,.10,[.29,.53,.65]);
  }
  // Sparse winter scenery stays outside the playable road.
  for(let i=0;i<14;i++){
    const z=-18+i*2.1,x=(i%2?1:-1)*(half(z)+1.2+(i%3)*.7);
    g.cylinder(x,.34,z,.09,.68,5,[.45,.40,.36]);
    g.cylinder(x,.8,z,.36,1.1,6,[.77,.82,.87],'y',0);g.cylinder(x,1.04,z,.28,.82,6,[.99,.99,1],'y',0);
  }
  this.world=this.mesh(g);
 }
 resize(){
  const rect=this.canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,this.quality);
  this.width=Math.max(1,rect.width);this.height=Math.max(1,rect.height);
  const w=Math.round(this.width*ratio),h=Math.round(this.height*ratio);
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  const aspect=this.width/this.height,proj=perspective(aspect);
  // Portrait is deliberately close: the army continues beyond the upper edge.
  // On landscape, fit the playable depth instead of cropping the cannon.
  if(aspect<.85){
    const scale=Math.max(.92,.52/aspect);
    this.vp=multiply(proj,view([0,40.5*scale,20.6*scale],[0,0,-7.56]));
  }else this.vp=multiply(proj,view([0,35,30],[0,0,-13]));
  this.baseVP=new Float32Array(this.vp);
  this.gl.viewport(0,0,w,h);this.gl.uniformMatrix4fv(this.vpLoc,false,this.vp);
 }
 project(x,y,z){const m=this.vp,ww=m[3]*x+m[7]*y+m[11]*z+m[15];return {x:((m[0]*x+m[4]*y+m[8]*z+m[12])/ww+1)*this.width/2,y:(1-(m[1]*x+m[5]*y+m[9]*z+m[13])/ww)*this.height/2};}
 pointerX(clientX){const r=this.canvas.getBoundingClientRect(),center=this.project(0,0,3.65),unit=this.project(1,0,3.65);return (clientX-r.left-center.x)/(unit.x-center.x);}
 draw(mesh,instances){
  if(!mesh||!instances.length)return;this.drawCalls++;const gl=this.gl,a=this.attr,ext=this.ext;
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
  for(const [n,size,offset] of [['aPosition',3,0],['aNormal',3,3],['aColor',3,6],['aPart',2,9]]){gl.enableVertexAttribArray(a[n]);gl.vertexAttribPointer(a[n],size,gl.FLOAT,false,44,offset*4);if(ext)ext.vertexAttribDivisorANGLE(a[n],0);}
  if(ext){
   gl.bindBuffer(gl.ARRAY_BUFFER,this.instance);const size=instances.length*10;
   if(size>this.instanceData.length)this.instanceData=new Float32Array(Math.ceil(size/10240)*10240);
   for(let i=0;i<instances.length;i++)this.instanceData.set(instances[i],i*10);
   if(this.instanceCapacity<this.instanceData.byteLength){gl.bufferData(gl.ARRAY_BUFFER,this.instanceData.byteLength,gl.DYNAMIC_DRAW);this.instanceCapacity=this.instanceData.byteLength;}
   gl.bufferSubData(gl.ARRAY_BUFFER,0,this.instanceData.subarray(0,size));
   for(const [n,size,offset] of [['aOffset',3,0],['aParams',4,3],['aTint',3,7]]){gl.enableVertexAttribArray(a[n]);gl.vertexAttribPointer(a[n],size,gl.FLOAT,false,40,offset*4);ext.vertexAttribDivisorANGLE(a[n],1);}
   ext.drawArraysInstancedANGLE(gl.TRIANGLES,0,mesh.count,instances.length);
  }else{
   for(const n of ['aOffset','aParams','aTint'])gl.disableVertexAttribArray(a[n]);
   for(const v of instances){gl.vertexAttrib3f(a.aOffset,...v.slice(0,3));gl.vertexAttrib4f(a.aParams,...v.slice(3,7));gl.vertexAttrib3f(a.aTint,...v.slice(7));gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
  }
 }
 render(game){
  const gl=this.gl;this.drawCalls=0;
  this.vp.set(this.baseVP);if(!this.reducedMotion&&game.shock>0){this.vp[12]+=Math.sin(game.time*57)*game.shock*.14;this.vp[13]+=Math.cos(game.time*43)*game.shock*.08;}
  gl.uniformMatrix4fv(this.vpLoc,false,this.vp);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(this.timeLoc,game.time);
  this.draw(this.world,[identity]);
  const units=[...game.blue,...game.red],shadows=[],near=[],far=[];
  for(const u of units){const tint=u.team==='blue'?C.blue:C.red,y=u.air>0?.15+Math.sin((.52-u.air)/.52*Math.PI)*.70+u.air*.8:0;
    if(this.quality>1||u.z>-18)shadows.push([u.x,0,u.z,0,0,0,0,1,1,1]);
    const distant=(u.z<-17&&!u.target)||(this.quality===1&&u.z<-12&&u.id%3!==0);
    (distant?far:near).push([u.x,y,u.z,u.angle,u.walking,u.id*.73,Math.max(u.hit*4,u.swing*3),...tint]);
  }
  this.draw(this.shadow,shadows);this.draw(this.farUnit,far);this.draw(this.unit,near);
  const recoil=game.effects.find(e=>e.type==='muzzle');this.draw(this.cannon,[[game.gunX,0,3.65+(recoil?recoil.t*.7:0),0,0,0,0,1,1,1]]);
  const particles=[];
  for(const e of game.effects){const t=1-e.t/e.max,n=e.type==='muzzle'?7:(this.quality>1?3:1);for(let i=0;i<n;i++){const a=i*Math.PI*2/n;
    const smoke=e.type==='muzzle'&&i<4;
    particles.push([e.x+Math.cos(a)*t*.52,.4+Math.sin(t*Math.PI)*.7,e.z+Math.sin(a)*t*.52,0,smoke?1+t*5:1.1,0,t*.85,...(smoke?[.85,.86,.85]:e.type==='muzzle'?C.gold:e.team==='red'?C.red:C.blue)]);
  }}
  if(game.state==='won'){for(let i=0;i<70;i++){const a=i*2.4,t=(game.time*.9+i*.07)%1;particles.push([Math.sin(a)*9,2+t*4,-12+Math.cos(a)*9,0,1.1,0,.1,...(i%2?C.gold:C.blue)]);}}
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);this.draw(this.spark,particles);gl.depthMask(true);gl.disable(gl.BLEND);
  this.lastStats={near:near.length,far:far.length,units:units.length,drawCalls:this.drawCalls,instanced:!!this.ext};
 }
}
root.MultidaoRenderer=Renderer;
})(typeof globalThis!=='undefined'?globalThis:this);
