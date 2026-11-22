export const DIALOG_CONTROLS = 'button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]';
const EXTERNAL_CONTROLS = '.pause-button:not(:disabled), .autosave-warning button:not(:disabled), .notification-stack button:not(:disabled)';
interface DialogEntry {
  element: HTMLElement;
  close(): void;
  initialFocus?(): HTMLElement | null | undefined;
  origin: HTMLElement | null;
  panel?: boolean;
}
const dialogs = new Set<DialogEntry>();
const visible = (element: HTMLElement) => element.isConnected && element.getClientRects().length > 0 &&
  !element.closest('[hidden], [inert], [aria-hidden="true"]') && getComputedStyle(element).visibility !== 'hidden';
function layer(element: HTMLElement) {
  const levels: number[] = [];
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    const index = Number.parseInt(getComputedStyle(node).zIndex);
    if (Number.isFinite(index)) levels.unshift(index);
  }
  return levels;
}
function topDialog() {
  return [...dialogs].filter(entry => visible(entry.element)).sort((a, b) => {
    const first = layer(a.element), second = layer(b.element);
    for (let i = 0; i < Math.max(first.length, second.length); i++) {
      const difference = (first[i] ?? 0) - (second[i] ?? 0);
      if (difference) return difference;
    }
    return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  }).at(-1);
}
export function hasOpenDialog() { return Boolean(topDialog()); }
export function dialogBlocksPanelNavigation() { const top = topDialog(); return Boolean(top && !top.panel); }
function controls(entry: DialogEntry) {
  const extra = entry.element.closest('.training-session') ? `${EXTERNAL_CONTROLS}, .tutorial-callout button:not(:disabled)` : EXTERNAL_CONTROLS;
  return [...new Set([...entry.element.querySelectorAll<HTMLElement>(DIALOG_CONTROLS), ...document.querySelectorAll<HTMLElement>(extra)])]
    .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && visible(element));
}
function focusFirst(entry: DialogEntry) {
  const preferred = entry.initialFocus?.();
  const first = controls(entry).find(control => entry.element.contains(control));
  (preferred && visible(preferred) ? preferred : first ?? entry.element).focus({ preventScroll: true });
}
function restoredOrigin(entry: DialogEntry, top?: DialogEntry) {
  const origin = entry.origin;
  if (!origin) return undefined;
  if (visible(origin)) return origin;
  // Returning from a subpanel can remount the originating panel's controls.
  return top && controls(top).find(candidate =>
    (origin.id && candidate.id === origin.id) ||
    (origin.getAttribute('aria-label') && candidate.getAttribute('aria-label') === origin.getAttribute('aria-label') && candidate.tagName === origin.tagName));
}
function keydown(event: KeyboardEvent) {
  const entry = topDialog();
  if (!entry || event.defaultPrevented) return;
  if (event.key === 'Escape') {
    event.preventDefault(); event.stopImmediatePropagation();
    if (!event.repeat) entry.close();
  } else if (event.key === 'Tab') {
    const available = controls(entry);
    const current = available.indexOf(document.activeElement as HTMLElement);
    const next = current < 0 ? event.shiftKey ? available.length - 1 : 0
      : (current + (event.shiftKey ? -1 : 1) + available.length) % available.length;
    event.preventDefault(); event.stopImmediatePropagation();
    (available[next] ?? entry.element).focus({ preventScroll: true });
  }
}
/** One active keyboard scope even when multiple dialogs are mounted or nested. */
export function registerDialog(element: HTMLElement, options: Omit<DialogEntry, 'element' | 'origin'> & { origin?: HTMLElement | null }) {
  const entry: DialogEntry = { ...options, element, origin: options.origin ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null) };
  if (!dialogs.size) document.addEventListener('keydown', keydown, true);
  dialogs.add(entry);
  const frame = requestAnimationFrame(() => {
    // A closing subpanel may already have restored focus into this remounted one.
    if (topDialog() === entry && (!element.contains(document.activeElement) || document.activeElement === element)) focusFirst(entry);
  });
  return () => {
    cancelAnimationFrame(frame);
    const wasTop = topDialog() === entry;
    const ownedFocus = element.contains(document.activeElement);
    dialogs.delete(entry);
    if (!dialogs.size) document.removeEventListener('keydown', keydown, true);
    // A replaced panel may have unmounted its opener. Never focus a detached node.
    queueMicrotask(() => {
      const top = topDialog();
      if (!wasTop && !ownedFocus && top && controls(top).includes(document.activeElement as HTMLElement)) return;
      const origin = restoredOrigin(entry, top);
      if (origin && (!top || controls(top).includes(origin))) origin.focus({ preventScroll: true });
      else if (top) focusFirst(top);
    });
  };
}
