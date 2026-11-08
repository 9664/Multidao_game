from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import subprocess,json,time
ROOT=Path(__file__).resolve().parent.parent
(ROOT/'evidence-v070').mkdir(exist_ok=True)
cases=[(1001+i,['center','upgrade','reinforce','alternate'][i%4]) for i in range(20)]
def run(case):
 seed,strategy=case
 p=subprocess.run(['node','tests/simulate.cjs',str(seed),strategy],cwd=ROOT,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr)
 return json.loads(p.stdout)
start=time.time();results=[]
with ThreadPoolExecutor(max_workers=3) as pool:
 for f in as_completed([pool.submit(run,c) for c in cases]):
  r=f.result();results.append(r);print(r['seed'],r['strategy'],r['state'],r['time'],flush=True)
  (ROOT/'evidence-v070/matrix.json').write_text(json.dumps({'elapsedSeconds':time.time()-start,'results':sorted(results,key=lambda r:r['seed'])},indent=2))
print('COMPLETE',len(results),time.time()-start,flush=True)
