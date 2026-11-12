import { ITEM_ART_ACCENT, type ItemArt } from '../art/itemArt';
import { itemColorCss } from '../content/items';

export { ITEM_ART_GROUPS } from '../art/itemArt';

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeMarkup = (value: string) => value.replace(/[&<>"']/g, character => entities[character as keyof typeof entities]);

export function itemSvg({ id, name, drawing: [outline, accent, color], detail, accentColor = ITEM_ART_ACCENT }: ItemArt) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <title>${escapeMarkup(detail ? `${name} · ${detail}` : name)}</title>
  <path d="${outline}" stroke="${color ?? itemColorCss(id)}" stroke-width="1.55"/>
${accent ? `  <path d="${accent}" stroke="${accentColor}" stroke-width="1.25"/>\n` : ''}</svg>\n`;
}
