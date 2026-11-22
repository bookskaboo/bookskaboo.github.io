import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    // Generated snapshots and the deployment checkout can contain source copies.
    // Keep the retired fixture's evidence-link notice out of test discovery.
    exclude: [...configDefaults.exclude, 'outputs/**', 'scripts/stress.test.ts'],
  },
}));
