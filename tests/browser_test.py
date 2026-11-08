"""WebGL + Web Audio tests using mobile viewport/touch emulation.
Default: files loaded in memory because this runtime blocks browser navigation.
Set BASE_URL to test an HTTP site in an unrestricted browser environment.
Run: xvfb-run -a python tests/browser_test.py
Physical phones and Safari are not tested by this suite.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from visual_local import load
import json, base64, os
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'evidence-v050';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('BASE_URL')
def navigate(page):
    if BASE: page.goto(BASE+'?test=1&v=0.5.0',wait_until='networkidle')
    else: load(page)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 browser_version=browser.version
 for name,w,h,mobile in [('android-360',360,740,True),('android-390',390,780,True),('mobile-393',393,852,True),('landscape',844,390,True),('desktop',1366,768,False)]:
  print('START',name,flush=True)
  page=browser.new_page(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
  page.set_default_timeout(10000)
  errors=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('requestfailed',lambda r:requests.append(r.url))
  navigate(page)
  assert not page.locator('#error').is_visible(), page.locator('#error-message').inner_text()
  assert page.evaluate('!!window.__gameTest.renderer.gl')
  assert page.evaluate('window.__gameTest.renderer.gl.getError()')==0
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.evaluate('window.__gameTest.audio.ctx') is None, 'audio must wait for gesture'
  if name=='android-390':page.screenshot(path=str(OUT/'menu-390.png'))
  page.locator('#start').click()
  page.wait_for_timeout(1100)
  assert page.evaluate('window.__gameTest.audio.ctx.state')=='running'
  assert page.evaluate('window.__gameTest.audio.events')>0
  peaks=[]
  for _ in range(6):
   peaks.append(page.evaluate('window.__gameTest.audio.snapshot().peak'));page.wait_for_timeout(50)
  assert max(peaks)>0.00001, peaks
  bounds=page.locator('#game').bounding_box();pts=page.evaluate('window.__gameTest.projected()')
  for key in ['cannon','front','castle']:
   assert 0<pts[key]['x']<bounds['width'] and 0<pts[key]['y']<bounds['height'],(name,pts,bounds)
  if name=='android-390':page.screenshot(path=str(OUT/'formation-390.png'))
  if mobile:
   cdp=page.context.new_cdp_session(page);y=bounds['y']+bounds['height']*.8
   for kind,x in [('touchStart',w*.25),('touchMove',w*.75)]:
    cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':x,'y':y,'id':1}]})
   cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   assert page.evaluate('window.__gameTest.game.aimX')>2
  else:
   page.keyboard.press('ArrowLeft');assert page.evaluate('window.__gameTest.game.aimX')<3.15
  page.locator('#pause').click()
  frozen=page.evaluate('window.__gameTest.game.snapshot()');page.wait_for_timeout(200)
  assert frozen==page.evaluate('window.__gameTest.game.snapshot()')
  assert frozen['state']=='paused'
  assert page.evaluate('window.__gameTest.audio.ctx.state')=='suspended'
  assert page.evaluate('window.__gameTest.audio.active.size')==0
  page.locator('#start').click();page.wait_for_timeout(100)
  assert page.evaluate('window.__gameTest.game.state')=='playing'
  assert page.evaluate('window.__gameTest.audio.ctx.state')=='running'
  page.locator('#sound').click()
  page.locator('#music').uncheck();page.wait_for_timeout(400)
  assert page.evaluate('window.__gameTest.audio.music.gain.value')<.001
  assert page.evaluate('window.__gameTest.audio.enabled') is True
  page.locator('#effects').uncheck();page.wait_for_timeout(400)
  assert page.evaluate('window.__gameTest.audio.fx.gain.value')<.001, page.evaluate('({enabled:__gameTest.audio.enabled,gain:__gameTest.audio.fx.gain.value,state:__gameTest.audio.ctx.state,time:__gameTest.audio.ctx.currentTime})')
  page.locator('#music').check();page.locator('#effects').check()
  page.locator('#volume').fill('25');page.locator('#volume').dispatch_event('input')
  assert page.evaluate('window.__gameTest.audio.volume')==.25
  page.locator('#motion').uncheck();assert page.evaluate('window.__gameTest.renderer.reducedMotion') is True
  page.locator('#close-settings').click()
  page.locator('#quality').click();assert page.locator('#quality').inner_text()=='LEVE'
  page.locator('#quality').click()
  print('CONTROLS OK',name,flush=True)
  page.locator('#restart').click()
  page.evaluate('window.__gameTest.advance(11)')
  state=page.evaluate('window.__gameTest.snapshot()')
  assert state['kills']>0 and state['enemies']<720
  assert page.evaluate('Number(document.getElementById("enemies").textContent.replaceAll(".",""))===window.__gameTest.game.red.length')
  assert page.evaluate('__gameTest.renderer.lastStats.units===__gameTest.game.blue.length+__gameTest.game.red.length')
  assert state['render']['drawCalls']<=7
  if name=='android-390':page.screenshot(path=str(OUT/'battle-390.png'))
  page.evaluate('window.__gameTest.advance(50)')
  won=page.evaluate('window.__gameTest.snapshot()')
  assert won['state']=='won' and won['enemies']==0 and won['kills']==720
  assert page.locator('#start').inner_text()=='PRÓXIMO CERCO'
  assert won['audio']['counts']['result']>=1
  if name=='android-390':page.screenshot(path=str(OUT/'victory-390.png'))
  page.locator('#start').click();assert page.evaluate('window.__gameTest.game.level')==2
  assert int(page.locator('#enemies').inner_text())==768
  counters=page.evaluate('''() => {const t=__gameTest,g=t.renderer.gl;let created=0,deleted=0;const c=g.createBuffer.bind(g),d=g.deleteBuffer.bind(g);g.createBuffer=()=>{created++;return c();};g.deleteBuffer=b=>{deleted++;d(b);};for(let i=0;i<6;i++)t.begin(1);return {created,deleted};}''')
  assert counters=={'created':6,'deleted':6}
  assert page.evaluate('window.__gameTest.renderer.gl.getError()')==0
  assert not errors,errors
  assert not requests,requests
  results.append({'viewport':name,'size':[w,h],'touch':mobile,'passed':True,'victory':won,'errors':errors,'audio_peak_observed':max(peaks),'buffer_balance':counters})
  page.close()
  print('PASS',name,flush=True)
 # No WebGL must produce actionable recovery, not a blank canvas.
 page=browser.new_page(viewport={'width':390,'height':780})
 (page.add_init_script if BASE else page.evaluate)('HTMLCanvasElement.prototype.getContext=()=>null')
 navigate(page)
 assert page.locator('#error').is_visible();assert 'WebGL' in page.locator('#error-message').inner_text()
 results.append({'case':'WebGL unavailable','passed':True,'result':'Visible recovery message'});page.close()
 # Audio unsupported is not a game failure.
 page=browser.new_page(viewport={'width':390,'height':780})
 (page.add_init_script if BASE else page.evaluate)('window.AudioContext=undefined;window.webkitAudioContext=undefined;')
 navigate(page);page.locator('#start').click();page.wait_for_timeout(150)
 assert not page.locator('#error').is_visible()
 assert page.evaluate('__gameTest.game.state')=='playing'
 assert page.evaluate('__gameTest.audio.available') is False
 results.append({'case':'Web Audio unavailable','passed':True,'result':'Game remains playable without audio'});page.close()
 # Offline rendering tests the actual sound graph and produces an audible evidence WAV.
 page=browser.new_page();navigate(page)
 print('OFFLINE AUDIO',flush=True)
 offline=page.evaluate('''async () => {
 const sampleRate=48000,duration=4,c=new OfflineAudioContext(1,sampleRate*duration,sampleRate),a=new SiegeAudio({context:c});
 a.setVolume(.65);a.cannon(.05,-.3);a.gate(.55,5,.3);a.impact(1.1);a.drum(1.5,true);a.horn(1.9);a.result(2.4,true);
 const b=await c.startRendering(),data=b.getChannelData(0);let peak=0,sum=0;
 const bytes=new ArrayBuffer(44+data.length*2),v=new DataView(bytes);const str=(offset,s)=>{for(let i=0;i<s.length;i++)v.setUint8(offset+i,s.charCodeAt(i));};
 str(0,'RIFF');v.setUint32(4,36+data.length*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,data.length*2,true);
 for(let i=0;i<data.length;i++){peak=Math.max(peak,Math.abs(data[i]));sum+=data[i]*data[i];v.setInt16(44+i*2,Math.max(-1,Math.min(1,data[i]))*32767,true);}
 let binary='';const raw=new Uint8Array(bytes);for(let i=0;i<raw.length;i+=8192)binary+=String.fromCharCode(...raw.subarray(i,i+8192));
 return {peak,rms:Math.sqrt(sum/data.length),sampleRate,duration,maxVoices:a.maxObserved,wav:btoa(binary)};
 }''')
 OUT.joinpath('audio-preview.wav').write_bytes(base64.b64decode(offline.pop('wav')))
 assert 0.01<offline['peak']<.95,offline
 assert offline['rms']>.001
 assert offline['maxVoices']<=40
 results.append({'case':'Original sound graph, offline-rendered','passed':True,**offline})
 browser.close()
report={'version':'0.5.0','browser':f'Chromium {browser_version} + software WebGL (SwiftShader), headed virtual display','loading':BASE or 'Production files loaded in memory; this runtime blocks HTTP browser navigation','physical_device_test':False,'results':results}
OUT.joinpath('browser-tests.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
