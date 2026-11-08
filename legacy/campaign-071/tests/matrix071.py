from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import subprocess,json
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'evidence-v071';OUT.mkdir(exist_ok=True)
# All six stages, 3 deterministic seeds each. No changing difficulty at runtime.
def run(case):
 l,seed=case;p=subprocess.run(['node','tests/campaign-sim.cjs',str(l),str(seed)],cwd=ROOT,text=True,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr)
 result=json.loads(p.stdout);result['seed']=seed;return result
rows=[]
with ThreadPoolExecutor(max_workers=2) as pool:
 for f in as_completed([pool.submit(run,(l,s)) for l in range(1,7) for s in [20261108,1001,2026]]):
  r=f.result();rows.append(r);print(r['level'],r['seed'],r['state'],r['time'],flush=True)
  (OUT/'campaign-matrix.json').write_text(json.dumps(sorted(rows,key=lambda r:(r['level'],r['seed'])),ensure_ascii=False,indent=2))
print('COMPLETE',len(rows),flush=True)
