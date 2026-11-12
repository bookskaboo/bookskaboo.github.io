import { ITEM_ART, ITEM_ART_ACCENT } from '../art/itemArt';
import { ITEM_COLORS, itemColorCss } from '../content/items';
import type { ItemId, NodeKind } from '../domain/types';
import { IconGlyph, NodeIcon } from './NodeIcon';

export function MaterialIcon({ item, fallback }: { item?: ItemId; fallback?: NodeKind }) {
  const art = item && ITEM_ART.get(item);
  if (art) {
    const [outline, accent, color] = art.drawing;
    return <svg className="node-icon item-icon" data-item-art={art.id} viewBox="0 0 24 24"
      aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={outline} stroke={color ?? itemColorCss(art.id)} strokeWidth="1.55" />
      {accent && <path d={accent} stroke={art.accentColor ?? ITEM_ART_ACCENT} strokeWidth="1.25" />}
    </svg>;
  }
  const glyph = item?.endsWith('-gear') ? 'cog' : item?.endsWith('-wire') ? 'spool' :
    item?.endsWith('-plate') ? 'plate' : item?.endsWith('-core') ? 'core' : undefined;
  if (fallback && !glyph) return <NodeIcon kind={fallback} inheritColor />;
  const color = item && ITEM_COLORS[item] !== undefined ? itemColorCss(item) : undefined;
  return <IconGlyph icon={glyph ?? 'package'} color={color} />;
}
