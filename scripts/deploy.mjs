import { execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: 'inherit' });
run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);
const temp = mkdtempSync(join(tmpdir(), 'hacard-pages-'));
try {
  run('git', ['clone', '--single-branch', '--branch', 'gh-pages', 'https://github.com/cocardtcg/hacard-web.git', temp]);
  // Keep branch history; remove only files in the disposable deployment checkout.
  run('git', ['rm', '-r', '--ignore-unmatch', '.'], temp);
  cpSync(join(root, 'dist'), temp, { recursive: true });
  run('git', ['add', '.'], temp);
  try { execFileSync('git', ['diff', '--cached', '--quiet'], { cwd: temp }); console.log('Already deployed.'); }
  catch { run('git', ['commit', '-m', 'Deploy Hacard website'], temp); run('git', ['push', 'origin', 'gh-pages'], temp); }
} finally { rmSync(temp, { recursive: true, force: true }); }
