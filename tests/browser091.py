from pathlib import Path
from playwright.sync_api import sync_playwright
from preview091 import load,ROOT
import json,hashlib,os
OUT=ROOT/'evidence-v091';rows=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for name,w,h,touch in [('phone360',360,740,True),('phone390',390,780,True),('phone393',393,852,True),('landscape',844,390,True),('desktop',1366,768,False)]:
  if os.environ.get('CASE') and name not in os.environ['CASE'].split(','):continue
  print('BEGIN',name,flush=True);page=browser.new_page(viewport={'width':w,'height':h},is_mobile=touch,has_touch=touch,device_scale_factor=1);page.set_default_timeout(15000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page)
  assert not page.locator('#error').is_visible(),page.locator('#error-message').inner_text()
  page.locator('#choose').click();assert page.locator('#secret-map-entry').is_disabled();assert page.locator('.stage-card').count()==6
  page.locator('#close-map').click();page.locator('#start').click();page.wait_for_timeout(200)
  assert page.evaluate('__gameTest.audio.ctx.state')=='running'
  pts=page.evaluate('__gameTest.projected()');assert 0<pts['cannon']['x']<w and 0<pts['cannon']['y']<h-100,(name,pts)
  if touch:
   cdp=page.context.new_cdp_session(page)
   cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':w*.3,'y':h*.67,'id':1}]})
   cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':w*.68,'y':h*.67,'id':1}]})
   cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
   assert page.evaluate('__gameTest.pointer') is None
  page.locator('#pause').click();a=page.evaluate('__gameTest.game.snapshot()');page.wait_for_timeout(100);assert a==page.evaluate('__gameTest.game.snapshot()')
  page.locator('#start').click();page.locator('#restart').click()
  # Full combat, same logic; accelerated only to check mechanics and result flow.
  page.evaluate('''()=>{const t=__gameTest,g=t.game;for(let i=0;i<2100&&g.state==='playing';i++){g.aim(g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);if(g.cannons>=3&&g.burstCooldown<=0)g.activateBurst();g.step();}g.visualAlpha=1;t.refresh();}''')
  main=page.evaluate('__gameTest.snapshot()');assert main['state']=='won';assert main['towersDestroyed']==3;assert main['firstClash']<5
  profile=page.evaluate('__gameTest.secret.profile');assert profile['coins']>120 and profile['seals']==3
  page.evaluate('__gameTest.refresh();__gameTest.result();');assert profile==page.evaluate('__gameTest.secret.profile')
  assert page.locator('#secret-result-entry').is_visible()
  # Native share is stubbed: no network, no publication, only explicit button invocation.
  page.evaluate("window.__shares=[];Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{__shares.push(data)}})")
  assert page.evaluate('__shares.length')==0;page.locator('#share').click();assert page.evaluate('__shares.length')==1
  assert '1200 abates' in page.evaluate('__shares[0].text')
  if name=='phone390':page.screenshot(path=str(OUT/'validated-result.png'))
  page.locator('#secret-result-entry').click();assert page.locator('#base-ui').is_visible()
  page.locator('#build-hall').click();page.locator('#build-west').click();page.locator('#build-east').click();page.locator('#build-wall').click()
  assert page.evaluate('__gameTest.secret.profile.coins')==profile['coins']-125
  assert page.evaluate('__gameTest.secret.world.maxHP()')==23
  # A ground tap is inverse-projected through the real base camera.
  point=page.evaluate('__gameTest.secret.view.point(2,4.5)')
  if touch:page.touchscreen.tap(point['x'],point['y'])
  else:page.mouse.click(point['x'],point['y'])
  assert abs(page.evaluate('__gameTest.secret.world.hero.tx')-2)<.05
  assert abs(page.evaluate('__gameTest.secret.world.hero.tz')-4.5)<.05
  if name=='phone390':page.screenshot(path=str(OUT/'validated-base.png'))
  page.locator('#base-raid').click();assert page.evaluate('__gameTest.secret.world.state')=='raid'
  page.locator('#base-pause').click();base=page.evaluate('__gameTest.secret.world.snapshot()');page.wait_for_timeout(100);assert base==page.evaluate('__gameTest.secret.world.snapshot()')
  page.locator('#base-pause').click();page.evaluate('''()=>{const g=__gameTest.secret.world;for(let i=0;i<1300&&g.state==='raid';i++){g.aim(0,1);g.step();}}''')
  assert page.evaluate('__gameTest.secret.world.state')=='won'
  dropped=page.evaluate('__gameTest.secret.world.coins.length');assert dropped>0
  if name=='phone390':page.screenshot(path=str(OUT/'validated-gold.png'))
  before=page.evaluate('__gameTest.secret.profile.coins')
  collected=page.evaluate('''()=>{const g=__gameTest.secret.world;let value=0;for(const c of [...g.coins]){value+=c.value;g.hero.x=c.x;g.hero.z=c.z;g.collect();}return value;}''')
  after=page.evaluate('__gameTest.secret.profile.coins');assert after>=before
  assert page.evaluate('__gameTest.secret.world.coins.length')==0
  # Switching orientation and returning must not advance an already-ended main match.
  page.set_viewport_size({'width':h,'height':w});page.wait_for_timeout(100);page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(100)
  page.locator('#base-exit').click();assert not page.locator('#base-ui').is_visible();assert page.evaluate('__gameTest.game.state')=='won'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.evaluate('Math.abs(__gameTest.renderer.pointerX(__gameTest.renderer.project(2.1,0,2.3).x)-2.1)<0.0001')
  assert page.evaluate('__gameTest.renderer.gl.getError()')==0
  # Repeated visits reuse the base meshes and context, no new buffers per visit.
  count=page.evaluate('''()=>{const t=__gameTest,gl=t.renderer.gl,a=gl.createBuffer.bind(gl);let made=0;gl.createBuffer=()=>{made++;return a();};for(let i=0;i<6;i++){t.secret.enter();t.secret.exit();}return made;}''')
  assert count==0,count
  assert not errors,errors
  rows.append({'viewport':name,'size':[w,h],'touch':touch,'passed':True,'battle':{k:main[k] for k in ['time','kills','firstClash','shots','towersDestroyed']},'coinsBeforeBuilding':profile['coins'],'drops':dropped,'shareCall':'stub, explicit click only','repeatVisitBuffers':count,'errors':errors})
  (OUT/('browser-'+name+'.json')).write_text(json.dumps(rows[-1],ensure_ascii=False,indent=2))
  page.close();print('PASS',name,flush=True)
 report={'version':'0.9.1','browser':browser.version,'rendering':'SwiftShader + Xvfb','transport':'production scripts loaded in memory; HTTP navigation blocked','physicalPhone':False,'shareNative':'not sent: browser method stubbed for activation test','sources':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['engine.js','rush.js','rush-view.js','visual091.js','visual091.css','haven.js','haven-view.js','haven-ui.js','play.js','index.html','rush.css']},'results':rows}
 (OUT/'browser-tests.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));browser.close();print('DONE',flush=True)
