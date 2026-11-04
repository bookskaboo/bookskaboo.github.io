import { validateMod } from './modValidation';
import type { GameMod } from './modTypes';

export const MAX_MOD_CODE_LENGTH = 500000;
function checksum(bytes: Uint8Array) {
  let hash = 2166136261;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function exportMod(mod: GameMod): string {
  const bytes = new TextEncoder().encode(JSON.stringify(validateMod(mod)));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const code = `NODEMOD1.${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.${checksum(bytes)}`;
  if (code.length > MAX_MOD_CODE_LENGTH) throw new Error('This mod exceeds the 500,000-character share-code limit.');
  return code;
}

export function importMod(text: string): GameMod {
  if (text.length > MAX_MOD_CODE_LENGTH + 10000) throw new Error('Share code is too large.');
  const code = text.replace(/\s/g, '');
  if (code.length > MAX_MOD_CODE_LENGTH) throw new Error('Share code is too large.');
  const parts = /^NODEMOD1\.([A-Za-z0-9_-]+)\.([a-f\d]{8})$/i.exec(code);
  if (!parts) throw new Error('Paste a complete NODEMOD1 share code.');
  let bytes: Uint8Array;
  try { bytes = Uint8Array.from(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); }
  catch { throw new Error('The share code could not be decoded. Copy it again.'); }
  if (checksum(bytes) !== parts[2].toLowerCase()) throw new Error('The share code is incomplete or damaged. Copy it again.');
  let value: unknown;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new Error('The share code contains invalid settings.'); }
  return validateMod(value);
}
