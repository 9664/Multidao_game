"""Actual production scripts, touch emulation, WebGL/SwiftShader. Not physical-phone testing."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from preview080 import load,ROOT
import json,hashlib
OUT=ROOT/'evidence-v080';OUT.mkdir(exist_ok=True);results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for name,w,h,touch in [('mobile360',360,740,True),('mobile390',390,780,True),('mobile393',393,852,True),('landscape',844,390,True),('desktop',1366,768,False)]:
  print('BEGIN',name,flush=True)
  page=browser.new_page(viewport={'width':w,'height':h},is_mobile=touch,has_touch=touch,device_scale_factor=1)
  page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page)
  assert not page.locator('#error').is_visible(),page.locator('#error-message').inner_text()
  assert page.evaluate('__gameTest.audio.ctx') is None
  page.locator('#choose').click()
  assert page.locator('.stage-card').count()==6
  assert page.locator('#resume-infinite').is_visible()
  if name=='mobile390':page.screenshot(path=str(OUT/'mode-selection.png'))
  page.locator('#resume-infinite').click();page.locator('#start').click();page.wait_for_timeout(300)
  assert page.evaluate('__gameTest.game.mode')=='endless'
  assert page.evaluate('__gameTest.audio.ctx.state')=='running'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  if touch:
   cdp=page.context.new_cdp_session(page)
   for kind,x in [('touchStart',w*.27),('touchMove',w*.7)]:cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':x,'y':h*.7,'id':1}]})
   cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
   assert page.evaluate('__gameTest.pointer') is None
   assert page.evaluate('__gameTest.game.aimX')>1
  else:page.keyboard.press('ArrowLeft');assert page.evaluate('__gameTest.game.aimX')<0
  pts=page.evaluate('__gameTest.projected()')
  assert 0<pts['cannon']['x']<w and 50<pts['cannon']['y']<h-80,(name,pts)
  page.locator('#pause').click();before=page.evaluate('__gameTest.game.snapshot()');page.wait_for_timeout(130);assert before==page.evaluate('__gameTest.game.snapshot()')
  assert page.evaluate('__gameTest.audio.ctx.state')=='suspended'
  page.locator('#start').click();page.locator('#sound').click();assert page.evaluate('__gameTest.game.state')=='paused'
  page.locator('#music').uncheck();page.locator('#effects').uncheck();page.locator('#volume').fill('0');page.locator('#volume').dispatch_event('input');page.locator('#motion').uncheck();assert page.evaluate('__gameTest.renderer.reducedMotion') is True
  page.locator('#close-settings').click();page.locator('#start').click()
  page.locator('#quality').click();assert page.locator('#quality').inner_text()=='HD'
  page.locator('#quality').click();assert page.locator('#quality').inner_text()=='LEVE'
  page.locator('#restart').click();page.evaluate('__gameTest.advance(6)');page.locator('#burst').click();assert page.evaluate('__gameTest.game.burstLeft')>0
  page.locator('#map-button').click();assert page.evaluate('__gameTest.game.state')=='paused'
  page.locator('.stage-card').nth(2).click();assert page.evaluate('__gameTest.game.mode')=='campaign'
  assert page.evaluate('__gameTest.game.level')==3;page.locator('#start').click();page.locator('#pause').click()
  page.set_viewport_size({'width':h,'height':w});page.wait_for_timeout(150);page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(150)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  # Isolated transition fixture, not represented as a full combat victory.
  page.evaluate('''()=>{const t=__gameTest;t.loadEndless(6,123);t.game.start();t.game.red=[];t.game.boss.state='defeated';t.game.boss.hp=0;t.game.finishCheck();t.refresh();}''')
  assert page.locator('#start').inner_text()=='PRÓXIMA ONDA';assert page.evaluate('__gameTest.save.endless.best')>=6
  assert page.evaluate('__gameTest.save.endless.checkpoint')==7
  page.locator('#start').click();assert page.evaluate('__gameTest.game.wave')==7
  # Pause and context resource accounting across six scenario changes.
  counts=page.evaluate('''()=>{const t=__gameTest,gl=t.renderer.gl;let made=0,freed=0;const a=gl.createBuffer.bind(gl),b=gl.deleteBuffer.bind(gl);gl.createBuffer=()=>{made++;return a();};gl.deleteBuffer=x=>{freed++;b(x);};const audio=t.audio.ctx;for(let i=0;i<6;i++)t.loadEndless(i+1,123);return {made,freed,sameAudio:audio===t.audio.ctx};}''')
  assert counts=={'made':12,'freed':12,'sameAudio':True},counts
  if name=='mobile390':
   page.evaluate('''()=>{const t=__gameTest;t.loadEndless(10,20261108);const g=t.game;g.start();for(let i=0;i<840&&g.state==='playing';i++){g.aim(g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);if(g.cannons>=3&&g.burstCooldown<=0)g.activateBurst();g.step();}g.visualAlpha=1;t.refresh();g.pause();document.getElementById('overlay').hidden=true;}''')
   state=page.evaluate('__gameTest.snapshot()');assert state['kills']>0
   assert state['render']['units']==state['blue']+state['enemies']
   assert state['render']['visible']+state['render']['culled']==state['render']['units']
   page.screenshot(path=str(OUT/'wave-10-battle.png'))
   page.evaluate('''()=>{const t=__gameTest,g=t.game;g.pause();for(let i=0;i<2000&&g.state==='playing';i++){g.aim(0);if(g.burstCooldown<=0)g.activateBurst();g.step();}g.visualAlpha=1;t.refresh();}''')
   real=page.evaluate('__gameTest.snapshot()');results.append({'case':'full wave 10 combat (accelerated simulation)','result':real})
   page.screenshot(path=str(OUT/'wave-10-result.png'))
  assert page.evaluate('__gameTest.renderer.gl.getError()')==0
  assert not errors,errors
  results.append({'viewport':name,'size':[w,h],'touchEmulated':touch,'passed':True,'errors':errors,'resourceBalance':counts})
  page.close();print('PASS',name,flush=True)
 # Explicit recovery cases.
 page=browser.new_page();page.evaluate('HTMLCanvasElement.prototype.getContext=()=>null');load(page);assert page.locator('#error').is_visible();page.close();results.append({'case':'WebGL unavailable','passed':True})
 page=browser.new_page();page.evaluate('window.AudioContext=undefined;window.webkitAudioContext=undefined');load(page);page.locator('#start').click();page.wait_for_timeout(120);assert page.evaluate('__gameTest.game.state')=='playing';assert page.evaluate('__gameTest.audio.available') is False;page.close();results.append({'case':'audio unavailable','passed':True})
 report={'version':'0.8.0','browser':browser.version,'graphics':'SwiftShader / Xvfb','transport':'production files loaded in memory','physicalDevice':False,'sources':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['fast-road.js','endless.js','polish.js','progress.js','play.js','index.html','campaign.css','polish.css']},'results':results}
 (OUT/'browser-tests.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));browser.close();print('COMPLETE',flush=True)
