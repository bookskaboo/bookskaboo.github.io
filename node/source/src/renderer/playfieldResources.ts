import type { Application } from 'pixi.js';

/** One mount's resources, including registrations made before asynchronous startup finishes. */
export class PlayfieldResources {
  private disposers: Array<() => void> = [];
  private ended = false;
  get disposed() { return this.ended; }

  add(dispose: () => void) {
    let active = true;
    const release = () => { if (active) { active = false; dispose(); } };
    if (this.ended) release(); else this.disposers.push(release);
    return release;
  }

  listen<T extends Event>(target: EventTarget, type: string, handler: (event: T) => void, options?: boolean | AddEventListenerOptions) {
    target.addEventListener(type, handler as EventListener, options);
    const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
    return this.add(() => target.removeEventListener(type, handler as EventListener, { capture }));
  }

  async initialize(start: () => Promise<void>, dispose: () => void) {
    let settled = false, released = false;
    const release = () => { if (!released) { released = true; dispose(); } };
    this.add(() => { if (settled) release(); });
    try { await start(); } catch (error) {
      settled = true;
      try { release(); } catch (cleanupError) { console.error('Playfield resource cleanup failed', cleanupError); }
      throw error;
    }
    settled = true;
    if (this.ended) { release(); return false; }
    return true;
  }

  dispose() {
    if (this.ended) return;
    this.ended = true;
    for (const release of this.disposers.splice(0).reverse()) {
      try { release(); } catch (error) { console.error('Playfield resource cleanup failed', error); }
    }
  }
}

/** Failed renderer creation has a stage but no renderer/plugins to destroy yet. */
export function destroyPlayfieldApplication(app: Application) {
  if (!app.renderer) { if (app.stage && !app.stage.destroyed) app.stage.destroy({ children: true }); return; }
  try { app.destroy(true, { children: true }); }
  catch (error) {
    // A partially initialized application plugin must not strand the canvas/context.
    try { app.ticker?.stop(); } catch { /* Ticker setup may not have completed. */ }
    try { if (app.stage && !app.stage.destroyed) app.stage.destroy({ children: true }); } catch { /* Continue renderer cleanup. */ }
    try { app.renderer?.destroy(true); } catch { /* Retain the original failure below. */ }
    console.error('Playfield application cleanup failed', error);
  }
}
