from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import subprocess,json,os
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'evidence-v092';OUT.mkdir(exist_ok=True)
cases=[(n,20261108,s,'campaign') for n in range(1,10) for s in ['upgrade','center']]
if os.getenv('FULL'):cases += [(n,42,'upgrade','campaign') for n in range(1,10)]+[(n,seed,'upgrade','endless') for n in [1,10,30,1000] for seed in [20261108,42]]+[(3,42,'idle','campaign'),(8,20261108,'balanced','campaign'),(8,42,'balanced','campaign'),(9,42,'battery','campaign')]
def run(c):
 p=subprocess.run(['node','tests/sim092.cjs',*map(str,c)],cwd=ROOT,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(str(c)+' '+p.stderr)
 return json.loads(p.stdout)
rows=[]
with ThreadPoolExecutor(max_workers=2) as pool:
 for f in as_completed([pool.submit(run,c) for c in cases]):
  r=f.result();rows.append(r);print(r['mode'],r['level'],r['strategy'],r['state'],r['time'],r['kills'],r['reason'],flush=True)
  (OUT/('matrix-final.json' if os.getenv('FULL') else 'matrix-tuning.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('COMPLETE',len(rows),flush=True)
