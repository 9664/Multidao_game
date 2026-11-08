"""Continuous, unaccelerated browser play. Automation moves only the visible aim slider.
Playwright video is silent; the game's Web Audio signal is tested separately.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from preview070 import load
import time,json,hashlib,shutil
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'evidence-v070';OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':390,'height':780},has_touch=True,is_mobile=True,device_scale_factor=1,record_video_dir=str(OUT/'video'),record_video_size={'width':390,'height':780})
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page);page.wait_for_timeout(800)
 page.screenshot(path=str(OUT/'review-opening.png'));page.locator('#start').click()
 page.evaluate('''window.__frameDeltas=[];window.__frameLast=performance.now();function collect(t){__frameDeltas.push(t-__frameLast);__frameLast=t;requestAnimationFrame(collect)}requestAnimationFrame(collect);''')
 start=time.time();lastAim=None;seen=set();events=[];flags=set();actions=[]
 while time.time()-start<200:
  s=page.evaluate('__gameTest.snapshot()')
  new=page.evaluate('__gameTest.game.events')
  for e in new:
   if e['id'] not in seen:events.append(e);seen.add(e['id'])
  if s['state'] in ('won','lost'):break
  aim=-4.65 if s['cannons']<2 else 4.65 if s['reinforcementsAwarded']<99 else -4.65 if s['cannons']<3 else 0
  if aim!=lastAim:
   page.locator('#aim').fill(str(aim));page.locator('#aim').dispatch_event('input');lastAim=aim;actions.append({'simTime':s['time'],'aim':aim})
  for condition,name in [(s['cannons']==2,'review-first-upgrade'),(s['cannons']==3,'review-battery'),(s['kills']>500,'review-clash'),(s['boss']['state']=='windup','review-boss-windup')]:
   if condition and name not in flags:page.screenshot(path=str(OUT/(name+'.png')));flags.add(name)
  page.wait_for_timeout(180)
 wall=time.time()-start;page.wait_for_timeout(1800);page.screenshot(path=str(OUT/'review-result.png'))
 frames=page.evaluate('__frameDeltas');s=page.evaluate('__gameTest.snapshot()');video=page.video.path()
 meta={'version':'0.7.0','continuous':True,'accelerated':False,'captureAudio':False,'loadedInMemory':True,'browser':b.version,'graphics':'SwiftShader','size':[390,780],'realSeconds':wall,'final':s,'actions':actions,'errors':errors,'frameDeltasMs':frames,'events':events,'sources':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['engine.js','renderer.js','audio.js','app.js','levels.js','navigation.js','index.html']}}
 c.close();b.close();shutil.copy2(video,OUT/'continuous-play.webm');(OUT/'continuous-play.json').write_text(json.dumps(meta,indent=2));print(json.dumps({k:v for k,v in meta.items() if k not in ['frameDeltasMs','events']},indent=2),flush=True)
 assert s['state']=='won',s
 assert s['cannons']==3 and s['reinforcements']==99 and s['bossStrikes']>0 and s['bossDamage']==600
 assert not errors,errors
