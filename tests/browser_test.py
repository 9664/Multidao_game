"""Production files tested in Chromium with WebGL and touch emulation, not physical phones."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from preview import load
import json
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'evidence';OUT.mkdir(exist_ok=True)
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for name,w,h,mobile in [('portrait-390',390,780,True),('portrait-360',360,740,True),('landscape',844,390,True),('desktop',1366,768,False)]:
  print('START',name,flush=True)
  page=b.new_page(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_default_timeout(10000)
  load(page)
  assert not page.locator('#error').is_visible(),page.locator('#error-message').inner_text()
  assert page.evaluate('!!__gameTest.renderer.gl')
  assert page.evaluate('__gameTest.audio.ctx') is None
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('#start').click()
  page.wait_for_timeout(350)
  assert page.evaluate('__gameTest.audio.ctx.state')=='running'
  pts=page.evaluate('__gameTest.projected()')
  for q in [pts['cannon'],pts['front'],*pts['gates']]:
   assert 0<q['x']<w and 0<q['y']<h,(name,q,w,h)
  if mobile:
   session=page.context.new_cdp_session(page)
   for kind,x in [('touchStart',w*.72),('touchMove',w*.27)]:
    session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':x,'y':h*.75,'id':1}]})
   session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   assert page.evaluate('__gameTest.game.aimX')<0
  else:
   page.keyboard.press('ArrowLeft');assert page.evaluate('__gameTest.game.aimX')<4.1
  page.locator('#pause').click();frozen=page.evaluate('__gameTest.game.snapshot()')
  page.wait_for_timeout(200);assert page.evaluate('__gameTest.game.snapshot()')==frozen
  assert page.evaluate('__gameTest.audio.ctx.state')=='suspended'
  page.locator('#start').click();page.wait_for_timeout(100)
  assert page.evaluate('__gameTest.game.state')=='playing'
  assert page.evaluate('__gameTest.audio.ctx.state')=='running'
  page.locator('#sound').click();page.locator('#music').uncheck();page.locator('#effects').uncheck()
  assert page.evaluate('__gameTest.audio.musicEnabled') is False
  assert page.evaluate('__gameTest.audio.enabled') is False
  page.locator('#motion').uncheck();assert page.evaluate('__gameTest.renderer.reducedMotion') is True
  page.locator('#volume').fill('20');page.locator('#volume').dispatch_event('input');assert page.evaluate('__gameTest.audio.volume')==.2
  page.locator('#close-settings').click();page.locator('#quality').click();assert page.locator('#quality').inner_text()=='LEVE'
  page.locator('#quality').click();page.locator('#restart').click()
  page.evaluate('__gameTest.advance(15.5);__gameTest.game.pause()')
  page.wait_for_timeout(2700) # let phase announcement disappear, without advancing the army
  state=page.evaluate('__gameTest.snapshot()')
  assert state['kills']>0 and state['enemies']<4000
  assert page.evaluate('Number(document.getElementById("enemies").textContent.replaceAll(".",""))===__gameTest.game.red.length')
  assert state['render']['units']==state['blue']+state['enemies']
  assert state['render']['drawCalls']<=7
  assert page.evaluate('__gameTest.renderer.gl.getError()')==0
  page.screenshot(path=str(OUT/(name+'-battle.png')))
  if name=='portrait-390':
   page.evaluate('__gameTest.game.pause();__gameTest.advance(70)')
   won=page.evaluate('__gameTest.snapshot()');assert won['state']=='won' and won['kills']==4000
   assert page.locator('#start').inner_text()=='PRÓXIMO CERCO'
   page.screenshot(path=str(OUT/'victory.png'))
   page.locator('#start').click();assert page.evaluate('__gameTest.game.level')==2
   assert page.evaluate('__gameTest.game.red.length')==4144
   counters=page.evaluate('''()=>{const t=__gameTest,g=t.renderer.gl;let created=0,deleted=0;const c=g.createBuffer.bind(g),d=g.deleteBuffer.bind(g);g.createBuffer=()=>{created++;return c();};g.deleteBuffer=b=>{deleted++;d(b);};for(let i=0;i<4;i++)t.begin(1);return {created,deleted};}''')
   assert counters=={'created':4,'deleted':4}
  assert not errors,errors
  results.append({'viewport':name,'size':[w,h],'passed':True,'errors':errors,'battle':state,'projected':pts})
  page.close();print('PASS',name,flush=True)
 # A missing WebGL context is handled explicitly, not a blank page.
 page=b.new_page();page.evaluate('HTMLCanvasElement.prototype.getContext=()=>null');load(page)
 assert page.locator('#error').is_visible();assert 'WebGL' in page.locator('#error-message').inner_text();page.close()
 results.append({'case':'WebGL unavailable','passed':True})
 page=b.new_page();page.evaluate('window.AudioContext=undefined;window.webkitAudioContext=undefined');load(page)
 page.locator('#start').click();page.wait_for_timeout(150)
 assert page.evaluate('__gameTest.game.state')=='playing';assert not page.locator('#error').is_visible();page.close()
 results.append({'case':'Audio unavailable','passed':True})
 report={'version':'0.6.0','browser':b.version,'mode':'Chromium with SwiftShader, four viewports and emulated touch; production files loaded in memory','physical_devices_tested':False,'results':results}
 OUT.joinpath('browser-tests.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps(report,ensure_ascii=False,indent=2),flush=True);b.close()
