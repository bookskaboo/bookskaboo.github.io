import { expect, it } from 'vitest';
import { benchmarkStats, emptyBenchmark, sampledFrameInterval } from './benchmark';

it('excludes warmup overlap and finishes exactly at the fixed sample boundary', () => {
  expect(sampledFrameInterval(4000, 6000, 5000, 25000)).toBe(1000);
  expect(sampledFrameInterval(29990, 30030, 5000, 25000)).toBe(10);
  expect(sampledFrameInterval(30030, 31000, 5000, 25000)).toBe(0);
  expect(sampledFrameInterval(2000, 3000, 5000, 25000)).toBe(0);
  expect(sampledFrameInterval(0, 6000, 5000, 25000)).toBe(0);
});

it('computes FPS from retained intervals instead of dividing a rolling count by all elapsed time', () => {
  const stats = benchmarkStats([10, 20, 30, 40], [2, 5, 1], 900, true);
  expect(stats.averageFps).toBe(40); expect(stats.meanFrameMs).toBe(25);
  expect(stats.frameP95).toBe(40); expect(stats.slowFrames).toBe(1); expect(stats.tickP95).toBe(5);
  expect(stats.complete).toBe(true);
  expect(benchmarkStats([], [], 0, false)).toEqual(emptyBenchmark());
});
