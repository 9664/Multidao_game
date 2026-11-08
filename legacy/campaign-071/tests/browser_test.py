"""Production scripts, Chromium/SwiftShader, touch emulation. Not physical phones."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from preview070 import load
import json,hashlib,time
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'evidence-v070';OUT.mkdir(exist_ok=True)
rows=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for name,w,h,mobile in [('phone360',360,740,True),('phone390',390,780,True),('phone393',393,852,True),('landscape',844,390,True),('desktop',1366,768,False)]:
  print('BEGIN',name,flush=True);page=b.new_page(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1);page.set_default_timeout(15000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page)
  assert not page.locator('#error').is_visible()
  assert page.evaluate('__gameTest.audio.ctx') is None
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('#start').click();page.wait_for_timeout(300)
  assert page.evaluate('__gameTest.audio.ctx.state')=='running'
  pts=page.evaluate('__gameTest.projected()')
  for q in [pts['cannon'],*pts['gates']]:assert 5<q['x']<w-5 and 50<q['y']<h-80,(name,q)
  # Project a known battery-plane point through the displayed shaken matrix.
  error=page.evaluate('''()=>{const t=__gameTest;t.game.shock=.1;t.renderer.render(t.game);const p=t.renderer.project(1.5,0,2.3);return Math.abs(t.renderer.pointerX(p.x)-1.5);}''');assert error<.001
  if mobile:
   cdp=page.context.new_cdp_session(page)
   for typ,x in [('touchStart',w*.35),('touchMove',w*.70)]:cdp.send('Input.dispatchTouchEvent',{'type':typ,'touchPoints':[{'x':x,'y':h*.68,'id':1}]})
   cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
   assert page.evaluate('__gameTest.pointer') is None
   assert page.evaluate('__gameTest.game.aimX')>1
  else:page.keyboard.press('ArrowLeft');assert page.evaluate('__gameTest.game.aimX')<0
  page.locator('#aim').fill('-4');page.locator('#aim').dispatch_event('input');assert page.evaluate('__gameTest.game.aimX')<0
  page.locator('#pause').click();before=page.evaluate('__gameTest.game.snapshot()');page.wait_for_timeout(200);assert before==page.evaluate('__gameTest.game.snapshot()')
  assert page.evaluate('__gameTest.audio.ctx.state')=='suspended'
  assert page.evaluate('__gameTest.audio.active.size')==0
  page.locator('#start').click();page.wait_for_timeout(100)
  page.locator('#sound').click();page.locator('#effects').uncheck();page.locator('#music').uncheck()
  assert page.evaluate('__gameTest.audio.enabled||__gameTest.audio.musicEnabled') is False
  page.locator('#volume').fill('0');page.locator('#volume').dispatch_event('input');page.wait_for_timeout(300)
  assert page.evaluate('__gameTest.audio.master.gain.value')<.001
  page.locator('#motion').uncheck();assert page.evaluate('__gameTest.renderer.reducedMotion') is True
  page.locator('#close-settings').click();page.locator('#quality').click();assert page.locator('#quality').inner_text()=='LEVE'
  page.locator('#quality').click();page.locator('#restart').click()
  # Orientation change in the same document, retaining listeners and state.
  page.set_viewport_size({'width':h,'height':w});page.wait_for_timeout(100);page.set_viewport_size({'width':w,'height':h})
  page.wait_for_timeout(100);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  # Explicitly emulated visibility event, not labelled a physical OS background test.
  page.evaluate("Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))")
  assert page.evaluate('__gameTest.game.state')=='paused'
  page.evaluate("delete document.hidden");page.locator('#start').click()
  if name=='phone390':
   page.evaluate('__gameTest.game.aim(-4.65);__gameTest.advance(13);__gameTest.game.aim(0);__gameTest.advance(18);__gameTest.game.pause()')
   page.wait_for_timeout(2500);page.screenshot(path=str(OUT/'browser-battle-390.png'))
   s=page.evaluate('__gameTest.snapshot()');assert s['kills']>0 and s['boss']['state']!='dormant'
   assert s['render']['units']==s['blue']+s['enemies']
  counters=page.evaluate('''()=>{const t=__gameTest,g=t.renderer.gl;let made=0,freed=0;const a=g.createBuffer.bind(g),b=g.deleteBuffer.bind(g);g.createBuffer=()=>{made++;return a();};g.deleteBuffer=v=>{freed++;return b(v);};const context=t.audio.ctx;for(let i=0;i<10;i++)t.begin(1);return {made,freed,sameAudio:context===t.audio.ctx,voices:t.audio.active.size};}''')
  assert counters=={'made':10,'freed':10,'sameAudio':True,'voices':0},counters
  assert page.evaluate('__gameTest.renderer.gl.getError()')==0
  if name=='phone360':
   page.evaluate('__gameTest.renderer.gl.getExtension("WEBGL_lose_context").loseContext()');page.wait_for_timeout(250)
   assert page.locator('#error').is_visible();assert page.evaluate('__gameTest.game.state')=='paused'
  assert not errors,errors
  rows.append({'viewport':name,'size':[w,h],'passed':True,'errors':errors,'pointerProjectionError':error,'restartResources':counters});page.close();print('PASS',name,flush=True)
 # Unavailable subsystems recover without fabricated success.
 page=b.new_page();page.evaluate('HTMLCanvasElement.prototype.getContext=()=>null');load(page);assert page.locator('#error').is_visible();rows.append({'case':'WebGL unavailable','passed':True});page.close()
 page=b.new_page();page.evaluate('window.AudioContext=undefined;window.webkitAudioContext=undefined');load(page);page.locator('#start').click();page.wait_for_timeout(100);assert page.evaluate('__gameTest.game.state')=='playing';assert not page.locator('#error').is_visible();rows.append({'case':'audio unavailable','passed':True});page.close()
 report={'version':'0.7.0','browser':b.version,'physicalPhone':False,'transport':'production scripts loaded in memory; browser localhost navigation blocked','hiddenTab':'visibilitychange emulated','sources':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['engine.js','renderer.js','audio.js','app.js','navigation.js','levels.js','index.html']},'results':rows}
 (OUT/'browser-tests.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True);b.close()
