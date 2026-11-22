interface FactoryKey { key: string; code: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }
/** Browser editing inside fields is handled before this factory-only boundary. */
export function blocksFactoryShortcut(event: FactoryKey, dialogOpen: boolean) {
  if (!dialogOpen) return false;
  const key = event.key.toLowerCase(), command = event.ctrlKey || event.metaKey;
  if (command && !event.altKey && !event.shiftKey && ['z', 'c', 'v'].includes(key)) return true;
  if (!command && !event.altKey && !event.shiftKey && ['delete', 'backspace', 'r', 'a'].includes(key)) return true;
  return /^Digit[1-5]$/.test(event.code) || /^F[1-3]$/.test(event.code);
}
