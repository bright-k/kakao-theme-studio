"""Install a prepared local release, preserving user data and backing up source.

Usage: python3 scripts/install-update.py SOURCE TARGET
Requires macOS process/filesystem permissions when TARGET is outside the workspace.
Never copies .data or .test-data. Stops only a recorded Node launcher with matching cwd.
"""
from pathlib import Path
import sys, json, os, signal, subprocess, shutil, hashlib, time, datetime

source, target = (Path(x).resolve() for x in sys.argv[1:3])
if source == target or not (source/'package.json').is_file() or not (target/'AGENTS.md').is_file():
    raise SystemExit('Invalid source or existing target project.')
session_file = target/'.data/session.json'
if session_file.exists():
    session = json.loads(session_file.read_text())
    pid = session.get('pid')
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        pid = None
    if pid:
        cwd = subprocess.check_output(['/usr/sbin/lsof','-a','-p',str(pid),'-d','cwd','-Fn'],text=True)
        command = subprocess.check_output(['/bin/ps','-p',str(pid),'-o','command='],text=True)
        if 'n'+str(target) not in cwd.splitlines() or 'launch.mjs' not in command or 'node' not in command:
            raise SystemExit('Refusing to stop an unverified process.')
        process_list = subprocess.check_output(['/bin/ps','-axo','pid=,ppid=,comm='],text=True)
        if any(len(line.split())>=2 and line.split()[1]==str(pid) for line in process_list.splitlines()):
            raise SystemExit('A child process is active. Wait for build/key work to finish.')
        for d in (target/'.data/builds').glob('*'):
            if d.is_dir() and not (d/'build-report.json').exists() and time.time()-d.stat().st_mtime<300:
                raise SystemExit('A build appears active. Retry after completion.')
        os.kill(pid, signal.SIGTERM)
        for _ in range(50):
            try: os.kill(pid,0)
            except ProcessLookupError: break
            time.sleep(.1)

def persistent_hashes():
    result = {}
    for folder in ['projects','keys','assets','bindings','builds']:
        for p in (target/'.data'/folder).rglob('*'):
            if p.is_file(): result[str(p.relative_to(target/'.data'))] = hashlib.sha256(p.read_bytes()).hexdigest()
    return result

before = persistent_hashes()
stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
version = json.loads((source/'package.json').read_text())['version']
backup = target/'.upgrade-backups'/('before-'+version+'-'+stamp)
backup.mkdir(parents=True)
for name in ['src','public','templates','scripts','test','docs','README.md','AGENTS.md','package.json','pnpm-lock.yaml','Studio.command','.gitignore']:
    p = target/name
    if p.is_dir(): shutil.copytree(p,backup/name)
    elif p.is_file(): shutil.copy2(p,backup/name)
subprocess.run(['/usr/bin/rsync','-a','--exclude=.data','--exclude=.test-data','--exclude=.upgrade-backups','--exclude=.git','--exclude=.DS_Store','--exclude=test-results',str(source)+'/',str(target)+'/'],check=True)
after = persistent_hashes()
if before != after: raise SystemExit('Persistent data changed; inspect before continuing.')
summary = dict(toolVersion=version,persistentFilesUnchanged=True,verifiedFileCount=len(before),projectCount=len(list((target/'.data/projects').glob('*.json'))),keyCount=len(list((target/'.data/keys').glob('*.p12'))),sourceBackup=str(backup),privateDataCopied=False)
(target/'docs/upgrade-preservation.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
