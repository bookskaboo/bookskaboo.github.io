export interface SocketPoint { key: string; x: number; y: number }

/** Rank geometry before compatibility, so a rejected socket never silently selects its neighbor. */
export function nearestSocket<T extends SocketPoint>(sockets: readonly T[], x: number, y: number, radius: number): T | undefined {
  let best: T | undefined; let distance = radius;
  for (const socket of sockets) {
    const next = Math.hypot(socket.x - x, socket.y - y);
    if (next <= distance && (!best || next < distance || socket.key < best.key)) { best = socket; distance = next; }
  }
  return best;
}

/** Reserve the inward face for selecting a compact node's body. Coordinates are screen pixels. */
export function socketHitContains(dx: number, dy: number, side: string, compact: boolean) {
  if (Math.hypot(dx, dy) > 10) return false;
  const inward = side === 'west' ? dx : side === 'east' ? -dx : side === 'north' ? dy : -dy;
  return inward <= (compact ? 2 : 5);
}
