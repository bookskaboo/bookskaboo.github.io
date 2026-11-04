import { useEffect, useState } from 'react';

export function useGridSnapKey() {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const editable = (target: EventTarget | null) => target instanceof HTMLElement && (target.matches('input, select, textarea') || target.isContentEditable);
    const keyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || editable(event.target)) { setHeld(false); return; }
      if (event.key.toLowerCase() === 'a') setHeld(true);
    };
    const keyUp = (event: KeyboardEvent) => { if (event.key.toLowerCase() === 'a') setHeld(false); };
    const reset = () => setHeld(false);
    const focus = (event: FocusEvent) => { if (editable(event.target)) reset(); };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', reset);
    window.addEventListener('focusin', focus);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', reset);
      window.removeEventListener('focusin', focus);
    };
  }, []);
  return held;
}
