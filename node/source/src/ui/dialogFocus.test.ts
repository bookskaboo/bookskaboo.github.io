import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dialogBlocksPanelNavigation, hasOpenDialog, registerDialog } from './dialogFocus';

// Minimal DOM boundary: exercise the real registry and keyboard listener without a browser dependency.
class Control {
  isConnected = true;
  tabIndex = 0;
  disabled = false;
  hidden = false;
  zIndex = 'auto';
  id = '';
  tagName = 'BUTTON';
  parentElement: Control | null = null;
  children: Control[] = [];
  constructor(readonly label: string, readonly order = 0) {}
  getClientRects() { return this.hidden ? [] : [{}]; }
  closest() { return null; }
  matches() { return this.disabled; }
  getAttribute(name: string) { return name === 'aria-label' ? this.label : null; }
  querySelectorAll() { return this.children; }
  contains(target: unknown) { return target === this || this.children.includes(target as Control); }
  compareDocumentPosition(other: Control) { return this.order < other.order ? 4 : 2; }
  focus() { active = this; }
}
let active: Control | null;
let external: Control[];
let frames: Map<number, FrameRequestCallback>;
let tasks: Array<() => void>;
let doc: EventTarget;
let disposers: Array<() => void>;
const flush = () => { while (tasks.length) tasks.shift()!(); const pending = [...frames.values()]; frames.clear(); pending.forEach(frame => frame(0)); };
function open(element: Control, options: { panel?: boolean; origin?: Control; close?: () => void } = {}) {
  const close = options.close ?? vi.fn();
  const dispose = registerDialog(element as unknown as HTMLElement, { panel: options.panel, origin: options.origin as unknown as HTMLElement, close });
  disposers.push(dispose);
  return { close, dispose: () => { dispose(); disposers = disposers.filter(item => item !== dispose); } };
}
function press(key: string, shiftKey = false, repeat = false) {
  const event = new Event('keydown', { cancelable: true });
  Object.defineProperties(event, { key: { value: key }, shiftKey: { value: shiftKey }, repeat: { value: repeat } });
  doc.dispatchEvent(event);
  return event;
}
beforeEach(() => {
  active = null; external = []; frames = new Map(); tasks = []; disposers = []; doc = new EventTarget();
  Object.defineProperty(doc, 'activeElement', { get: () => active });
  Object.assign(doc, { querySelectorAll: () => external });
  vi.stubGlobal('document', doc); vi.stubGlobal('HTMLElement', Control);
  vi.stubGlobal('Node', { DOCUMENT_POSITION_FOLLOWING: 4 });
  vi.stubGlobal('getComputedStyle', (element: Control) => ({ zIndex: element.zIndex, visibility: element.hidden ? 'hidden' : 'visible' }));
  let frameId = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('queueMicrotask', (callback: () => void) => tasks.push(callback));
});
afterEach(() => { disposers.forEach(dispose => dispose()); flush(); vi.unstubAllGlobals(); });

describe('dialog keyboard controller', () => {
  it('cycles visible enabled controls and deliberate external controls in both directions', () => {
    const dialog = new Control('Options'), first = new Control('First'), hidden = new Control('Hidden'), disabled = new Control('Disabled'), last = new Control('Last'), pause = new Control('Pause');
    hidden.hidden = true; disabled.disabled = true;
    dialog.children = [first, hidden, disabled, last]; external = [pause];
    open(dialog); flush(); expect(active).toBe(first);
    press('Tab'); expect(active).toBe(last);
    press('Tab'); expect(active).toBe(pause);
    press('Tab'); expect(active).toBe(first);
    press('Tab', true); expect(active).toBe(pause);
  });
  it('gives an empty dialog a focus fallback and recovers focus that started outside', () => {
    const dialog = new Control('Empty'); open(dialog); flush(); expect(active).toBe(dialog);
    active = new Control('Background'); press('Tab'); expect(active).toBe(dialog);
  });
  it('routes Escape and Tab only to the top confirmation and consumes repeated Escape', () => {
    const panel = new Control('Save panel', 1), confirmation = new Control('Confirmation', 2);
    const parentButton = new Control('Parent'), cancel = new Control('Cancel');
    panel.children = [parentButton]; confirmation.children = [cancel];
    const parent = open(panel, { panel: true }); const child = open(confirmation); flush();
    expect(active).toBe(cancel); expect(dialogBlocksPanelNavigation()).toBe(true);
    press('Tab'); expect(active).toBe(cancel);
    expect(press('Escape', false, true).defaultPrevented).toBe(true);
    expect(child.close).not.toHaveBeenCalled();
    press('Escape'); expect(child.close).toHaveBeenCalledOnce(); expect(parent.close).not.toHaveBeenCalled();
  });
  it('ignores hidden dialogs and uses visible layer priority ahead of DOM order', () => {
    const panel = new Control('Panel', 3), confirmation = new Control('Confirmation', 1), hidden = new Control('Hidden', 4);
    panel.zIndex = '40'; confirmation.zIndex = '100'; hidden.hidden = true;
    open(panel, { panel: true }); const top = open(confirmation); const inactive = open(hidden); flush();
    press('Escape'); expect(top.close).toHaveBeenCalledOnce(); expect(inactive.close).not.toHaveBeenCalled();
  });
  it('restores the matching control after a subpanel remounts its opener without overwriting it next frame', () => {
    const oldOpener = new Control('Save / Load'); active = oldOpener;
    const save = new Control('Save', 2); save.children = [new Control('Close Save')];
    const child = open(save, { origin: oldOpener }); flush(); oldOpener.isConnected = false;
    child.dispose(); save.isConnected = false;
    const options = new Control('Options', 3), close = new Control('Close Options'), newOpener = new Control('Save / Load');
    options.children = [close, newOpener]; open(options); flush();
    expect(active).toBe(newOpener);
  });
  it('returns to the connected outer opener when an entire nested chain unmounts', () => {
    const opener = new Control('Options toolbar'); active = opener;
    const panel = new Control('Options', 1), openChild = new Control('Load'); panel.children = [openChild];
    const parent = open(panel); flush(); active = openChild;
    const confirmation = new Control('Confirm', 2); confirmation.children = [new Control('Cancel')];
    const child = open(confirmation); flush(); parent.dispose(); child.dispose();
    panel.isConnected = false; openChild.isConnected = false; confirmation.isConnected = false;
    flush(); expect(active).toBe(opener); expect(hasOpenDialog()).toBe(false);
  });
});
