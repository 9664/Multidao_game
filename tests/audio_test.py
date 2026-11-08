from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,json,wave
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'evidence-v070';OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox'])
 page=b.new_page();page.set_content('<button id="go">Start</button>');page.add_script_tag(content=(ROOT/'audio.js').read_text())
 page.evaluate("document.getElementById('go').onclick=async()=>{window.sound=new SiegeAudio();await sound.unlock();window.testGame={state:'playing',phase:'assemble',events:[{id:1,type:'shot',x:0}]};sound.update(testGame);sound.update(testGame);}")
 page.click('#go');page.wait_for_function('window.sound&&sound.ctx.state==="running"')
 assert page.evaluate('sound.counts.cannon')==1
 page.evaluate('sound.suspend()');page.wait_for_function('sound.ctx.state==="suspended"');assert page.evaluate('sound.active.size')==0
 out=page.evaluate('''async()=>{const c=new OfflineAudioContext(1,48000*6,48000),a=new SiegeAudio({context:c});a.cannon(.1);a.cannon(.3);a.cannon(.5);a.gate(1.1,50);a.horn(2,true);a.tone(220,3,.7,.19,'sawtooth','fx',330,0,700);a.impact(3.8);a.result(4.3,true);const b=await c.startRendering(),data=b.getChannelData(0);let peak=0,sum=0;const pcm=new Int16Array(data.length);for(let i=0;i<data.length;i++){peak=Math.max(peak,Math.abs(data[i]));sum+=data[i]*data[i];pcm[i]=Math.max(-1,Math.min(1,data[i]))*32767;}let binary='';const raw=new Uint8Array(pcm.buffer);for(let i=0;i<raw.length;i+=8192)binary+=String.fromCharCode(...raw.subarray(i,i+8192));return {peak,rms:Math.sqrt(sum/data.length),voices:a.maxObserved,pcm:btoa(binary)};}''')
 assert .01<out['peak']<.99 and out['rms']>.001 and out['voices']<=40,out
 raw=base64.b64decode(out.pop('pcm'))
 with wave.open(str(OUT/'audio-preview.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(48000);w.writeframes(raw)
 out.update({'eventDeduplication':True,'suspendDisconnectsVoices':True,'kind':'offline-rendered production synthesizer, not a microphone recording'})
 (OUT/'audio-test.json').write_text(json.dumps(out,indent=2));print(json.dumps(out));b.close()
