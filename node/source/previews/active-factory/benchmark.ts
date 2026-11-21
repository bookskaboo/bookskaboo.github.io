export const emptyBenchmark = () => ({ frameP95: 0, frameP99: 0, tickP95: 0, slowFrames: 0, count: 0, seconds: 0, averageFps: 0, meanFrameMs: 0, complete: false });

/** Clip boundary frames so loading stalls before warmup cannot enter a fixed sample. */
export function sampledFrameInterval(previous: number, now: number, start: number, windowMs: number) {
  if (!previous) return 0;
  return Math.max(0, Math.min(now, windowMs ? start + windowMs : Infinity) - Math.max(previous, start));
}

export function benchmarkStats(frames: number[], ticks: number[], seconds: number, complete: boolean) {
  const sorted = [...frames].sort((a, b) => a - b), sortedTicks = [...ticks].sort((a, b) => a - b);
  const percentile = (values: number[], fraction: number) => values[Math.max(0, Math.ceil(values.length * fraction) - 1)] ?? 0;
  const meanFrameMs = frames.length ? frames.reduce((sum, ms) => sum + ms, 0) / frames.length : 0;
  return { frameP95: percentile(sorted, .95), frameP99: percentile(sorted, .99), tickP95: percentile(sortedTicks, .95),
    slowFrames: frames.filter(ms => ms > 33.4).length, count: frames.length, seconds, meanFrameMs,
    averageFps: meanFrameMs ? 1000 / meanFrameMs : 0, complete };
}
