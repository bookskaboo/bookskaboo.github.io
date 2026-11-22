import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type ComponentPropsWithoutRef } from 'react';
import { registerDialog } from '../dialogFocus';

interface DialogProps extends ComponentPropsWithoutRef<'section'> {
  as?: 'section' | 'aside';
  onDismiss(): void;
  active?: boolean;
  modal?: boolean;
  panel?: boolean;
  initialFocus?(): HTMLElement | null | undefined;
}

export const Dialog = forwardRef<HTMLElement, DialogProps>(function Dialog({ as: Tag = 'section', onDismiss, active = true, modal = true, panel = false, initialFocus, ...props }, forwardedRef) {
  const element = useRef<HTMLElement>(null);
  const callbacks = useRef({ onDismiss, initialFocus });
  // Capture before React removes the opening panel's focused control in commit.
  const openingOrigin = typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null;
  callbacks.current = { onDismiss, initialFocus };
  useImperativeHandle(forwardedRef, () => element.current!, []);
  useLayoutEffect(() => {
    if (!active || !element.current) return;
    return registerDialog(element.current, { panel, origin: openingOrigin, close: () => callbacks.current.onDismiss(), initialFocus: () => callbacks.current.initialFocus?.() });
  }, [active, panel]);
  return <Tag {...props} ref={element} tabIndex={props.tabIndex ?? (active ? -1 : undefined)} role={active ? 'dialog' : props.role}
    aria-modal={active && modal ? true : undefined} data-node-dialog={active ? '' : undefined} />;
});
