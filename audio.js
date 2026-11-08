/* Grande Cerco 0.5.0. Original procedural score and effects; no downloaded audio. */
(function(root){
'use strict';
class SiegeAudio {
 constructor({context=null}={}){
  this.ctx=null;this.active=new Set();this.enabled=true;this.musicEnabled=true;this.volume=.58;this.available=true;
  this.counts={cannon:0,gate:0,impact:0,drum:0,horn:0,result:0};this.events=0;this.phase='';this.last={};
  this.maxVoices=40;this.maxObserved=0;this.nextBeat=0;this.beat=0;this.nextImpact=0;this.nextGate=0;this.nextStep=0;
  if(context)this.setup(context);
 }
 setup(ctx){
  this.ctx=ctx;this.fx=ctx.createGain();this.music=ctx.createGain();this.master=ctx.createGain();this.limiter=ctx.createDynamicsCompressor();
  this.limiter.threshold.value=-16;this.limiter.knee.value=14;this.limiter.ratio.value=9;this.limiter.attack.value=.004;this.limiter.release.value=.16;
  this.meter=ctx.createAnalyser();this.meter.fftSize=256;this.meterData=new Float32Array(256);
  this.fx.connect(this.limiter);this.music.connect(this.limiter);this.limiter.connect(this.master);this.master.connect(this.meter);this.meter.connect(ctx.destination);
  this.noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const a=this.noise.getChannelData(0);let seed=7153;
  for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[i]=(seed/4294967296*2-1);}
  this.apply();
 }
 async unlock(){
  try{
   if(!this.ctx){const C=root.AudioContext||root.webkitAudioContext;if(!C){this.available=false;return false;}this.setup(new C());}
   if(this.ctx.state==='suspended'||this.ctx.state==='interrupted')await this.ctx.resume();
   this.nextBeat=this.ctx.currentTime+.05;return this.ctx.state==='running';
  }catch{this.available=false;return false;}
 }
 apply(){if(!this.ctx)return;const t=this.ctx.currentTime;for(const [bus,value] of [[this.fx,this.enabled?.72:0],[this.music,this.musicEnabled?.38:0],[this.master,this.volume*.65]]){bus.gain.cancelScheduledValues(t);bus.gain.setTargetAtTime(value,t,.018);}}
 setEffects(v){this.enabled=!!v;this.apply();}
 setMusic(v){this.musicEnabled=!!v;this.apply();}
 setVolume(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));this.apply();}
 graph(source,{time,duration,volume=.2,pan=0,bus='fx',cutoff=0,attack=.005}={}){
  const c=this.ctx;if(!c||this.active.size>=this.maxVoices)return false;
  const gain=c.createGain(),nodes=[source,gain];let node=source;
  if(cutoff){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=cutoff;node.connect(f);nodes.push(f);node=f;}
  node.connect(gain);gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),time+attack);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  let out=gain;if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=Math.max(-.7,Math.min(.7,pan));gain.connect(p);out=p;nodes.push(p);}
  out.connect(bus==='music'?this.music:this.fx);this.active.add(source);this.maxObserved=Math.max(this.maxObserved,this.active.size);this.events++;
  source.onended=()=>{this.active.delete(source);for(const n of nodes)try{n.disconnect();}catch{}};
  source.start(time);source.stop(time+duration+.025);return true;
 }
 tone(freq,time,duration,volume=.18,type='triangle',bus='fx',endFreq=freq,pan=0,cutoff=0){
  if(!this.ctx||this.active.size>=this.maxVoices)return;const o=this.ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(freq,time);o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),time+duration);
  return this.graph(o,{time,duration,volume,pan,bus,cutoff,attack:type==='sawtooth'?.035:.004});
 }
 hiss(time,duration,volume,cutoff,pan=0,bus='fx'){if(!this.ctx||this.active.size>=this.maxVoices)return;const n=this.ctx.createBufferSource();n.buffer=this.noise;return this.graph(n,{time,duration,volume,cutoff,pan,bus});}
 cannon(time,pan=0){this.counts.cannon++;this.tone(120,time,.20,.55,'sine','fx',38,pan);this.hiss(time,.12,.28,1500,pan);this.hiss(time+.05,.25,.10,400,pan);}
 gate(time,m=4,pan=0){this.counts.gate++;this.tone(440,time,.16,.14,'sine','fx',660,pan);this.tone(660,time+.04,.18,.10,'triangle','fx',880,pan);if(m>=4)this.tone(880,time+.09,.22,.065,'sine','fx',1320,pan);}
 impact(time,weight=1){this.counts.impact++;this.tone(185,time,.08,.13,'triangle','fx',73);this.hiss(time,.06,.15*weight,2500);this.tone(970,time,.11,.04,'sine','fx',800);}
 drum(time,accent=false){this.counts.drum++;this.tone(accent?94:135,time,.26,accent?.45:.23,'sine','music',accent?42:70);this.hiss(time,.10,.10,700,0,'music');}
 horn(time,final=false){this.counts.horn++;const notes=final?[146.83,174.61,220]:[146.83,220];notes.forEach((f,i)=>this.tone(f,time+i*.07,.85,.11,'sawtooth','music',f,0,850));}
 result(time,win){this.counts.result++;const notes=win?[293.66,369.99,440,587.33]:[220,174.61,146.83];notes.forEach((f,i)=>{this.tone(f,time+i*.23,.65,.16,'sawtooth','music',f,0,1100);this.tone(f/2,time+i*.23,.7,.07,'triangle','music');});}
 stop(){for(const node of this.active)try{node.stop();}catch{}this.active.clear();this.nextBeat=0;this.last={};this.phase='';}
 async suspend(){this.stop();if(this.ctx&&this.ctx.state==='running')try{await this.ctx.suspend();}catch{}}
 reset(){this.stop();if(this.ctx)this.nextBeat=this.ctx.currentTime+.07;this.nextImpact=this.nextGate=this.nextStep=0;this.beat=0;}
 update(game){
  const c=this.ctx;if(!c||c.state!=='running')return;const now=c.currentTime,m=game.metrics;
  if(game.state==='paused'||game.state==='ready')return;
  if(game.state!=='playing'){
   if(this.last.state!==game.state){this.stop();if(this.musicEnabled)this.result(now,game.state==='won');this.last.state=game.state;}
   return;
  }
  if(this.enabled){
   if(m.shots>(this.last.shots||0))this.cannon(now,game.gunX/14);
   if(m.gatePasses>(this.last.gates||0)&&now>=this.nextGate){const gate=game.gates.find(g=>g.flash>.15);this.gate(now,gate?.m||3,(gate?.x||0)/14);this.nextGate=now+.22;}
   if(m.hits>(this.last.hits||0)&&now>=this.nextImpact){this.impact(now,.6+game.pressure*.4);this.nextImpact=now+.11;}
   if(game.blue.length>8&&now>=this.nextStep){this.hiss(now,.065,.025+Math.min(1,game.blue.length/300)*.04,380);this.nextStep=now+.29;}
   if(m.breaches>(this.last.breaches||0))this.tone(440,now,.30,.12,'triangle','fx',200);
  }
  if(this.musicEnabled){
   if(this.phase!==game.phase){this.horn(now,game.phase==='surge');this.phase=game.phase;}
   const bpm=game.phase==='assemble'?86:game.phase==='clash'?110:126;
   if(this.nextBeat<now-.15)this.nextBeat=now+.02;
   let scheduled=0;
   while(this.nextBeat<now+.12&&scheduled++<3){const t=this.nextBeat,i=this.beat++;
    if(i%2===0)this.drum(t,i%8===0);
    if(i%2===1&&game.phase!=='assemble')this.hiss(t,.075,.065,1800,0,'music');
    if(i%8===0)this.tone(i%16?110:73.416,t,1.5,.10,'triangle','music');
    if(i%4===0){const melody=[293.66,220,261.63,220,174.61,220,196,220];this.tone(melody[Math.floor(i/4)%8],t,.35,.055,'triangle','music');}
    this.nextBeat+=30/bpm;
   }
  }else this.nextBeat=now+.05;
  this.last={shots:m.shots,hits:m.hits,gates:m.gatePasses,breaches:m.breaches,state:game.state};
 }
 snapshot(){let peak=0;if(this.meter){this.meter.getFloatTimeDomainData(this.meterData);for(const v of this.meterData)peak=Math.max(peak,Math.abs(v));}return {state:this.ctx?.state||'locked',effects:this.enabled,music:this.musicEnabled,volume:this.volume,available:this.available,active:this.active.size,maxObserved:this.maxObserved,events:this.events,peak,counts:{...this.counts}};}
}
root.SiegeAudio=SiegeAudio;
})(typeof globalThis!=='undefined'?globalThis:this);
