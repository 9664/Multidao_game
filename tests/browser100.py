from pathlib import Path
from playwright.sync_api import sync_playwright
from preview100 import load,ROOT
import json,hashlib,os
OUT=ROOT/'evidence-v100';OUT.mkdir(exist_ok=True);results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for name,w,h,touch in [('phone360',360,740,True),('phone390',390,844,True),('phone393',393,852,True),('landscape',844,390,True),('desktop',1366,768,False)]:
  if os.environ.get('CASE') and name not in os.environ['CASE'].split(','):continue
  print('BEGIN',name,flush=True)
  page=b.new_page(viewport={'width':w,'height':h},is_mobile=touch,has_touch=touch,device_scale_factor=1);page.set_default_timeout(12000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page)
  assert not page.locator('#error').is_visible(),page.locator('#error-message').inner_text()
  assert page.evaluate('__gameTest.audio.ctx') is None
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('#doctrine-siege').click();assert page.evaluate('__gameTest.game.doctrine')=='siege'
  assert page.evaluate('__gameTest.game.cfg.towerDamage')==2
  if name=='phone390':page.screenshot(path=str(OUT/'home-final.png'))
  page.locator('#choose').click();assert page.locator('.stage-card').count()==9
  page.locator('#close-map').click();page.locator('#start').click();page.wait_for_timeout(150)
  assert page.evaluate('__gameTest.game.state')=='playing'
  assert page.evaluate('__gameTest.audio.ctx.state')=='running'
  if touch:
   cdp=page.context.new_cdp_session(page)
   for typ,x in [('touchStart',w*.25),('touchMove',w*.66)]:cdp.send('Input.dispatchTouchEvent',{'type':typ,'touchPoints':[{'x':x,'y':h*.55,'id':1}]})
   cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]});assert page.evaluate('__gameTest.pointer') is None
  else:page.keyboard.press('ArrowLeft')
  page.locator('#skill-meteor').click();assert page.evaluate('__gameTest.game.skillStats.casts')==1
  page.locator('#pause').click();frozen=page.evaluate('__gameTest.snapshot()');page.wait_for_timeout(100);assert page.evaluate('__gameTest.game.time')==frozen['time'] or abs(page.evaluate('__gameTest.game.time')-frozen['time'])<.001
  assert page.evaluate('__gameTest.audio.ctx.state')=='suspended'
  page.locator('#start').click()
  # Real simulation to first tactical choice, without injecting kills or rewards.
  page.evaluate("""()=>{const t=__gameTest,g=t.game;for(let i=0;i<800&&g.state==='playing';i++){g.aim(g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);g.step();}t.refresh();}""")
  assert page.evaluate('__gameTest.game.state')=='choosing'
  assert page.locator('#command-choice').is_visible()
  snapshot=page.evaluate('__gameTest.game.snapshot()');page.wait_for_timeout(150);assert snapshot==page.evaluate('__gameTest.game.snapshot()')
  if name=='phone390':page.screenshot(path=str(OUT/'choice-final.png'))
  before=page.evaluate('__gameTest.game.ammo');page.locator('[data-card="supply"]').click();assert page.evaluate('__gameTest.game.choices.includes("supply")')
  assert not page.locator('#command-choice').is_visible()
  # Second offer and real battle completion using the same engine.
  page.evaluate("""()=>{const t=__gameTest,g=t.game;for(let i=0;i<2400&&['playing','choosing'].includes(g.state);i++){if(g.choicePending)g.choose(g.offers[0]);if(g.state!=='playing')break;g.aim(g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);if(g.energy>=45&&g.skillCooldown.meteor<=0)g.cast('meteor');if(g.cannons>=3&&g.burstCooldown<=0)g.activateBurst();g.step();}g.visualAlpha=1;t.refresh();}""")
  state=page.evaluate('__gameTest.snapshot()');assert state['state']=='won',state
  assert state['kills']==1200
  assert state['choices'] and state['skillStats']['casts']>0
  xp=page.evaluate('__gameTest.command.xp');assert xp>0
  gold=page.evaluate('__gameTest.secret.profile.coins');assert gold>100
  page.evaluate('__gameTest.refresh();__gameTest.result()');assert xp==page.evaluate('__gameTest.command.xp');assert gold==page.evaluate('__gameTest.secret.profile.coins')
  if name=='phone390':page.screenshot(path=str(OUT/'result-final.png'))
  page.locator('#secret-result-entry').click();page.locator('#build-hall').click();page.locator('#build-west').click();page.locator('#base-raid').click();assert page.evaluate('__gameTest.secret.world.state')=='raid'
  page.locator('#base-pause').click();assert page.evaluate('__gameTest.secret.world.state')=='paused'
  page.locator('#base-exit').click();assert page.evaluate('__gameTest.game.state')=='won'
  page.locator('#start').click();assert page.evaluate('__gameTest.game.level')==2
  page.locator('#sound').click();assert page.evaluate('__gameTest.game.state')=='paused';page.locator('#effects').uncheck();page.locator('#music').uncheck();page.locator('#volume').fill('0');page.locator('#volume').dispatch_event('input');page.locator('#motion').uncheck();assert page.evaluate('__gameTest.renderer.reducedMotion')
  page.locator('#close-settings').click();page.locator('#start').click();page.locator('#quality').click();page.locator('#quality').click();assert page.locator('#quality').inner_text()=='LEVE'
  page.locator('#pause').click();page.set_viewport_size({'width':h,'height':w});page.wait_for_timeout(80);page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(80);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  count=page.evaluate("""()=>{const t=__gameTest,g=t.renderer.gl,a=g.createBuffer.bind(g),b=g.deleteBuffer.bind(g);let made=0,freed=0;g.createBuffer=()=>{made++;return a()};g.deleteBuffer=x=>{freed++;return b(x)};for(let i=0;i<6;i++)t.select(i+1);return {made,freed};}""")
  assert count['made']==count['freed'],count
  assert page.evaluate('__gameTest.renderer.gl.getError()')==0
  assert not errors,errors
  results.append({'viewport':name,'size':[w,h],'touchEmulated':touch,'passed':True,'firstBattle':state,'xp':xp,'gold':gold,'resources':count,'errors':errors})
  (OUT/('browser-'+name+'.json')).write_text(json.dumps(results[-1],indent=2));page.close();print('PASS',name,flush=True)
 report={'version':'1.0.0','browser':b.version,'graphics':'SwiftShader + Xvfb','transport':'production scripts loaded in memory','physicalPhones':False,'results':results,'hashes':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['tactics100.js','ascension-view100.js','ascension100.css','play.js','visual091.js','index.html']}}
 (OUT/('browser-batch-'+str(len(results))+'.json')).write_text(json.dumps(report,indent=2));b.close()
