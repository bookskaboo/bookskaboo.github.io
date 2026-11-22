import { describe, expect, it } from 'vitest';
import { blocksFactoryShortcut } from './factoryKeyboard';

const key = (key: string, code = key, modifiers = {}) => ({ key, code, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...modifiers });
describe('factory keyboard boundary', () => {
  it.each([
    key('Delete'), key('Backspace'), key('r'), key('a'),
    key('z', 'KeyZ', { ctrlKey: true }), key('z', 'KeyZ', { metaKey: true }),
    key('c', 'KeyC', { ctrlKey: true }), key('v', 'KeyV', { metaKey: true }),
    key('1', 'Digit1'), key('2', 'Digit2', { shiftKey: true }), key('3', 'Digit3', { ctrlKey: true }),
    key('F1'), key('F2'), key('F3'),
  ])('blocks editing or placement while a dialog is open: %j', event => {
    expect(blocksFactoryShortcut(event, true)).toBe(true);
    expect(blocksFactoryShortcut(event, false)).toBe(false);
  });
  it.each([key(' ' ,'Space'), key('Enter'), key('Tab'), key('Escape'), key('q'), key('b'), key('o'), key('m'), key('?', 'Slash', { shiftKey: true })])('retains dialog, Pause and navigation keys: %j', event => {
    expect(blocksFactoryShortcut(event, true)).toBe(false);
  });
});
