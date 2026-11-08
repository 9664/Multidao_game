from pathlib import Path
from playwright.sync_api import sync_playwright
from preview071 import load
import json,time,hashlib
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'evidence-v071';OUT.mkdir(exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for name,w,h,touch in [('mobile360',360,740,True),('mobile390',390,780,True),('mobile393',393,852,True),('landscape',844,390,True),('desktop',1366,768,False)]:
  print('START',name,flush=True);page=browser.new_page(viewport={'width':w,'height':h},is_mobile=touch,has_touch=touch);page.set_default_timeout(12000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page)
  assert not page.locator('#error').is_visible(),page.locator('#error-message').inner_text()
  assert page.evaluate('__gameTest.audio.ctx') is None
  page.locator('#choose').click();assert page.locator('.stage-card').count()==6
  page.locator('.stage-card').nth(2).click();assert page.evaluate('__gameTest.game.level')==3
  assert 'Muralha de Gelo' in page.locator('#title').inner_text()
  page.locator('#start').click();page.wait_for_timeout(180)
  assert page.evaluate('__gameTest.audio.ctx.state')=='running'
  pts=page.evaluate('__gameTest.projected()')
  assert 5<pts['cannon']['x']<w-5 and 50<pts['cannon']['y']<h-90,(name,pts)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  if touch:
   cdp=page.context.new_cdp_session(page)
   for typ,x in [('touchStart',w*.28),('touchMove',w*.70)]:cdp.send('Input.dispatchTouchEvent',{'type':typ,'touchPoints':[{'x':x,'y':h*.68,'id':1}]})
   cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
   assert page.evaluate('__gameTest.pointer') is None
   assert page.evaluate('__gameTest.game.aimX')>0
  else:page.keyboard.press('ArrowLeft');assert page.evaluate('__gameTest.game.aimX')<0
  page.locator('#pause').click();frozen=page.evaluate('__gameTest.game.snapshot()');page.wait_for_timeout(150);assert frozen==page.evaluate('__gameTest.game.snapshot()');assert page.evaluate('__gameTest.audio.ctx.state')=='suspended'
  page.locator('#start').click();page.locator('#sound').click();assert page.evaluate('__gameTest.game.state')=='paused'
  page.locator('#music').uncheck();page.locator('#effects').uncheck();page.locator('#volume').fill('0');page.locator('#volume').dispatch_event('input');page.locator('#motion').uncheck()
  assert page.evaluate('__gameTest.audio.volume')==0
  assert page.evaluate('__gameTest.renderer.reducedMotion') is True
  page.locator('#close-settings').click();page.locator('#start').click();page.locator('#quality').click();assert page.locator('#quality').inner_text()=='HD';page.locator('#quality').click();assert page.locator('#quality').inner_text()=='LEVE'
  # Reset and advance only for deterministic state coverage, not performance measurement.
  page.locator('#restart').click();page.evaluate('__gameTest.advance(6)');page.locator('#burst').click();assert page.evaluate('__gameTest.game.burstLeft')>0
  page.locator('#map-button').click();assert page.evaluate('__gameTest.game.state')=='paused'
  page.locator('.stage-card').nth(0).click();page.locator('#start').click();page.evaluate('__gameTest.advance(4);__gameTest.game.pause()')
  page.set_viewport_size({'width':h,'height':w});page.wait_for_timeout(100);page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(100)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.evaluate('__gameTest.renderer.gl.getError()')==0
  if name=='mobile390':
   # Exercise six real campaign scenarios with the same strategy, including final victory.
   for level in range(1,7):
    page.evaluate('''level=>{const t=__gameTest;t.select(level);t.begin();const g=t.game;for(let i=0;i<1100&&g.state==='playing';i++){g.aim(g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);if(g.cannons>=3&&g.burstCooldown<=0)g.activateBurst();g.step();}t.refresh();if(g.state==='playing')g.pause();}''',level)
    state=page.evaluate('__gameTest.snapshot()');assert state['kills']>0;assert state['render']['units']==state['blue']+state['enemies'];assert state['render']['visible']+state['render']['culled']==state['render']['units']
    page.screenshot(path=str(OUT/f'phase-{level}.png'))
    results.append({'scenario':level,'snapshot':state,'passed':True})
   page.evaluate('''()=>{const t=__gameTest,g=t.game;if(g.state==='paused')g.pause();for(let i=0;i<2400&&g.state==='playing';i++){g.aim(0);if(g.burstCooldown<=0)g.activateBurst();g.step();}t.refresh();}''')
   assert page.evaluate('__gameTest.game.state')=='won'
   assert page.locator('#start').inner_text()=='VOLTAR À CAMPANHA'
   page.screenshot(path=str(OUT/'campaign-complete.png'))
   page.locator('#start').click();assert page.locator('#map').is_visible();assert '★' in page.locator('.stage-card').nth(5).inner_text()
   page.screenshot(path=str(OUT/'campaign-map.png'))
  resources=page.evaluate('''()=>{const t=__gameTest,g=t.renderer.gl;let made=0,freed=0;const a=g.createBuffer.bind(g),b=g.deleteBuffer.bind(g);g.createBuffer=()=>{made++;return a();};g.deleteBuffer=v=>{freed++;return b(v);};const ctx=t.audio.ctx;for(let i=0;i<6;i++)t.select(i+1);return {made,freed,sameAudio:ctx===t.audio.ctx};}''')
  assert resources=={'made':6,'freed':6,'sameAudio':True}
  assert not errors,errors
  results.append({'viewport':name,'passed':True,'size':[w,h],'touch':touch,'errors':errors,'resources':resources})
  page.close();print('PASS',name,flush=True)
 page=browser.new_page();page.evaluate('HTMLCanvasElement.prototype.getContext=()=>null');load(page);assert page.locator('#error').is_visible();results.append({'case':'WebGL unavailable','passed':True});page.close()
 page=browser.new_page();page.evaluate('window.AudioContext=undefined;window.webkitAudioContext=undefined');load(page);page.locator('#start').click();page.wait_for_timeout(120);assert page.evaluate('__gameTest.game.state')=='playing';assert page.evaluate('__gameTest.audio.available') is False;results.append({'case':'audio unavailable','passed':True});page.close()
 report={'version':'0.7.1','browser':browser.version,'graphics':'SwiftShader','mode':'production files loaded in memory; mobile viewports and touch emulated','physical_devices':False,'sources':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['campaign.js','campaign-renderer.js','campaign.css','play.js','index.html']},'results':results}
 (OUT/'browser-tests.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print('COMPLETE',len(results),flush=True);browser.close()
