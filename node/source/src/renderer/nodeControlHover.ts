export const JOINT_CONTROL_GRACE_MS = 400;

/** Keep controls reachable across the small gaps around compact nodes. */
export class NodeControlHover {
  private active?: string;
  private lingering?: { id: string; until: number };
  private pressed?: string;

  enter(id: string) { this.active = id; this.lingering = undefined; }
  leave(id: string, now: number, graceMs = 0) {
    if (this.active !== id) return;
    this.active = undefined; this.lingering = { id, until: now + graceMs };
  }
  press(id: string) { this.pressed = id; this.enter(id); }
  release() { this.pressed = undefined; }
  visible(id: string, now: number) { return this.active === id || this.pressed === id || Boolean(this.lingering?.id === id && now < this.lingering.until); }
  clear() { this.active = undefined; this.lingering = undefined; this.pressed = undefined; }
}
