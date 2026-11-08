"""Run with: xvfb-run -a python tests/browser_test.py.
Tests load the production files into a browser document without external requests.
Mobile viewports and touch are emulated. This is NOT a physical-device test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from visual_local import load
import json
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'evidence'
OUT.mkdir(exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for name,w,h,mobile in [('android-360',360,740,True),('android-390',390,780,True),('mobile-393',393,852,True),('landscape',844,390,True),('desktop',1366,768,False)]:
  page=browser.new_page(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
  page.set_default_timeout(5000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  load(page)
  assert not page.locator('#error').is_visible()
  assert page.evaluate('!!window.__gameTest.renderer.gl')
  assert page.evaluate('window.__gameTest.renderer.gl.getError()')==0
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('#start').click()
  page.wait_for_timeout(250)
  bounds=page.locator('#game').bounding_box()
  pts=page.evaluate('window.__gameTest.projected()')
  for key in ['cannon','front']:
   assert 0<pts[key]['x']<bounds['width'] and 0<pts[key]['y']<bounds['height'],(name,pts,bounds)
  if mobile:
   cdp=page.context.new_cdp_session(page)
   y=bounds['y']+bounds['height']*.8
   for kind,x in [('touchStart',w*.25),('touchMove',w*.75)]:
    cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':x,'y':y,'id':1}]})
   cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   page.wait_for_timeout(180)
   assert page.evaluate('window.__gameTest.game.aimX')>2
  else:
   page.keyboard.press('ArrowLeft')
   assert page.evaluate('window.__gameTest.game.aimX')<2.8
  page.locator('#pause').click()
  frozen=page.evaluate('window.__gameTest.snapshot()')
  page.wait_for_timeout(180)
  assert frozen==page.evaluate('window.__gameTest.snapshot()')
  assert frozen['state']=='paused'
  page.locator('#start').click()
  assert page.evaluate('window.__gameTest.game.state')=='playing'
  page.locator('#quality').click()
  assert page.locator('#quality').inner_text()=='LEVE'
  page.locator('#quality').click()
  page.locator('#restart').click()
  page.evaluate('window.__gameTest.advance(8)')
  state=page.evaluate('window.__gameTest.snapshot()')
  assert state['kills']>0 and state['enemies']<80
  assert int(page.locator('#enemies').inner_text())==page.evaluate('window.__gameTest.game.red.length')
  if name=='android-390':page.screenshot(path=str(OUT/'verified-battle-390.png'))
  page.evaluate('window.__gameTest.advance(40)')
  won=page.evaluate('window.__gameTest.snapshot()')
  assert won['state']=='won' and won['enemies']==0 and won['kills']==80
  assert page.locator('#start').inner_text()=='PRÓXIMA FASE'
  if name=='android-390':page.screenshot(path=str(OUT/'verified-victory-390.png'))
  page.locator('#start').click()
  assert page.evaluate('window.__gameTest.game.level')==2
  assert int(page.locator('#enemies').inner_text())==96
  # A fresh world buffer replaces (rather than leaks alongside) the old one.
  counters=page.evaluate('''() => {const t=__gameTest,g=t.renderer.gl;let created=0,deleted=0;const c=g.createBuffer.bind(g),d=g.deleteBuffer.bind(g);g.createBuffer=()=>{created++;return c();};g.deleteBuffer=b=>{deleted++;d(b);};for(let i=0;i<6;i++)t.begin(1);return {created,deleted};}''')
  assert counters=={'created':6,'deleted':6},counters
  assert page.evaluate('window.__gameTest.renderer.gl.getError()')==0
  assert not errors,errors
  results.append({'viewport':name,'size':[w,h],'touch':mobile,'passed':True,'victory':won,'errors':errors,'buffer_balance':counters})
  page.close()
 # Explicit unsupported-WebGL recovery: actionable error, not a blank screen.
 page=browser.new_page(viewport={'width':390,'height':780})
 page.evaluate('HTMLCanvasElement.prototype.getContext=()=>null')
 load(page)
 assert page.locator('#error').is_visible()
 assert 'WebGL' in page.locator('#error-message').inner_text()
 results.append({'case':'WebGL unavailable','passed':True,'result':'Visible recovery message'})
 browser.close()
report={'version':'0.4.0','browser':'Chromium 144 + software WebGL (SwiftShader), headed virtual display','loading':'Production HTML and JS loaded in memory; no live-site navigation','physical_device_test':False,'results':results}
OUT.joinpath('browser-tests.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
