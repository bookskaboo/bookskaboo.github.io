import { useEffect, useState } from 'react';

export function useRecipeIconToggle(enabled: boolean) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!enabled) return;
    let pressedAlt: string | undefined;
    const clear = () => { pressedAlt = undefined; };
    const keyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const editing = target instanceof HTMLElement && (target.matches('input, select, textarea') || target.isContentEditable);
      if (event.key !== 'Alt' || event.ctrlKey || event.metaKey || event.shiftKey || editing || event.defaultPrevented) {
        clear();
        return;
      }
      event.preventDefault();
      if (event.repeat) return;
      // Only an unchorded tap should toggle the icons.
      pressedAlt = pressedAlt === undefined ? event.code : undefined;
    };
    const keyUp = (event: KeyboardEvent) => {
      if (event.key !== 'Alt') return;
      if (pressedAlt === event.code) {
        event.preventDefault();
        setVisible(current => !current);
      }
      clear();
    };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('pointerdown', clear, true);
    window.addEventListener('blur', clear);
    window.addEventListener('focusin', clear);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('pointerdown', clear, true);
      window.removeEventListener('blur', clear);
      window.removeEventListener('focusin', clear);
    };
  }, [enabled]);
  return visible;
}
