import { validateMod } from './modValidation';
import { emptyMod, type GameMod } from './modTypes';

export const MAX_MOD_CODE_LENGTH = 500000;
export const MAX_MOD_FILE_BYTES = 2_000_000;
const TEXT_FORMAT = 'NODE Mod Pack';

function checkFileSize(bytes: number) {
  if (bytes > MAX_MOD_FILE_BYTES) throw new Error('Mod text files must be 2 MB or smaller.');
}

/** A plain, editable representation of the same pack stored in a save. */
export function exportModText(mod: GameMod): string {
  const text = `${JSON.stringify({ format: TEXT_FORMAT, ...validateMod(mod) }, null, 2)}\n`;
  checkFileSize(new TextEncoder().encode(text).length);
  return text;
}

export function modTextFilename(name: string): string {
  const slug = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').slice(0, 60).replace(/^-|-$/g, '');
  return `${slug ? `node-${slug}` : 'node-mod-pack'}.node-mod.txt`;
}

export async function readModTextFile(file: Blob): Promise<GameMod> {
  checkFileSize(file.size);
  let value: unknown;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    value = JSON.parse(text);
  } catch {
    throw new Error('Use a UTF-8 text file containing valid JSON. Check commas, quotes, and brackets.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value) || !('format' in value) || value.format !== TEXT_FORMAT) {
    throw new Error('Choose a NODE Mod Pack text file. Export a draft to see the format.');
  }
  const { format: _format, ...pack } = value;
  // A hand-written pack may omit empty sections. Require its own version and name.
  return validateMod({ ...emptyMod(), version: undefined, name: undefined, ...pack });
}

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
