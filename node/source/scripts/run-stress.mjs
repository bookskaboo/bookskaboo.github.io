import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'scripts/stress.test.ts', '--maxWorkers=1'], {
  stdio: 'inherit', env: { ...process.env, GAME_STRESS: '1' },
});
if (result.status === 0) await import('./summarize-stress.mjs');
process.exit(result.status ?? 1);
