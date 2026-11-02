import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'scripts/progression.test.ts', '--maxWorkers=1'], {
  stdio: 'inherit', env: { ...process.env, GAME_PROGRESSION: '1' },
});
if (result.status === 0) await import('./summarize-progression.mjs');
process.exit(result.status ?? 1);
