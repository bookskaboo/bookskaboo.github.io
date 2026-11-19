export interface SocketPoint { key: string; x: number; y: number; side?: string }

function inwardDistance(socket: SocketPoint, x: number, y: number) {
  return socket.side === 'east' ? socket.x - x : socket.side === 'west' ? x - socket.x
    : socket.side === 'north' ? y - socket.y : socket.side === 'south' ? socket.y - y : 0;
}

/** Rank geometry before compatibility, so a rejected socket never silently selects its neighbor. */
export function nearestSocket<T extends SocketPoint>(sockets: readonly T[], x: number, y: number, radius: number): T | undefined {
  let best: T | undefined; let distance = radius;
  for (const socket of sockets) {
    const next = Math.hypot(socket.x - x, socket.y - y);
    // Touching bodies can share a socket position. Approach from the intended
    // body's side to select its port; exact-center ties stay deterministic.
    const sameSpot = best && socket.x === best.x && socket.y === best.y;
    const preference = sameSpot && best ? inwardDistance(socket, x, y) - inwardDistance(best, x, y) : 0;
    if (next <= distance && (!best || next < distance || preference > 0 || (preference === 0 && socket.key < best.key))) { best = socket; distance = next; }
  }
  return best;
}

/** Reserve the inward face for selecting a compact node's body. Coordinates are screen pixels. */
export function socketHitContains(dx: number, dy: number, side: string, compact: boolean) {
  if (Math.hypot(dx, dy) > 10) return false;
  const inward = side === 'west' ? dx : side === 'east' ? -dx : side === 'north' ? dy : -dy;
  return inward <= (compact ? 2 : 5);
}
