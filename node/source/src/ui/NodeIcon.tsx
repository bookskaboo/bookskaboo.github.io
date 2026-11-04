import { getNodeModule, type NodeIconId } from '../content/nodeModules';
import type { NodeKind } from '../domain/types';
import { modNode } from '../mods/modRules';

interface Props { kind: NodeKind; className?: string; title?: string }

export function NodeIcon({ kind, className = '', title }: Props) {
  const custom = modNode(kind)?.icon;
  if (custom) return <span className={`node-icon mod-node-glyph ${className}`} title={title} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>{custom}</span>;
  return <IconGlyph icon={getNodeModule(kind).appearance.icon} className={className} title={title} />;
}

export function IconGlyph({ icon, className = '', title }: { icon: NodeIconId; className?: string; title?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const glyph = (() => {
    switch (icon) {
      case 'gem': return <><path d="M4 8 8 3h8l4 5-8 13Z" /><path d="m4 8 8 13 8-13M8 3l4 5 4-5M4 8h16" /></>;
      case 'mountain': return <><path d="m3 19 7-13 3.2 5.2L15 8l6 11Z" /><path d="m8 10 2 2 2-2" /></>;
      case 'tree': return <><path d="M12 22v-7" /><path d="M8 22h8" /><path d="M12 3c-4 0-6 3-6 6 0 2 1 3 2.5 4.2C8 16 10 18 12 18s4-2 3.5-4.8C17 12 18 11 18 9c0-3-2-6-6-6Z" /></>;
      case 'lake': return <><path d="M3 8c2-2 4 2 6 0s4 2 6 0 4 2 6 0M3 13c2-2 4 2 6 0s4 2 6 0 4 2 6 0M3 18c2-2 4 2 6 0s4 2 6 0 4 2 6 0" /></>;
      case 'pickaxe': return <><path d="m14 5 5 5M17 3l4 4-2 3-5-5Z" /><path d="M16.5 8.5 6 19" /><path d="m4 18 2 2" /></>;
      case 'mining-drill': return <><path d="M5 18h14M7 18l1-7h8l1 7M9 11V7h6v4M10 7V4h4v3" /><path d="m12 11-2 4h4Z" /></>;
      case 'flame': return <path d="M13 2c1 5-3 6-3 10 0 1.6 1 2.5 2 3.5.2-2 1.5-3 3-4.5 1.2 1.5 3 3.5 3 6a6 6 0 0 1-12 0c0-4 3-7 7-15Z" />;
      case 'smelter': return <><path d="M5 5h14l-2 10H7Z" /><path d="M8 19h8M9 15v4M15 15v4" /><path d="M9 9c1-2 2-2 3 0s2 2 3 0" /></>;
      case 'cog': return <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /><circle cx="12" cy="12" r="7" /></>;
      case 'hammer': return <><path d="m14 4 6 6-3 3-6-6Z" /><path d="m13 9-9 9 2 2 9-9" /></>;
      case 'atom': return <><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><ellipse cx="12" cy="12" rx="9" ry="3.8" /><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" /></>;
      case 'split': return <><path d="M4 12h6M10 12c4 0 3-6 7-6h3M10 12c4 0 3 6 7 6h3" /><path d="m18 4 2 2-2 2M18 16l2 2-2 2" /></>;
      case 'merge': return <><path d="M4 6h3c4 0 3 6 7 6h6M4 18h3c4 0 3-6 7-6" /><path d="m18 10 2 2-2 2" /></>;
      case 'cable': return <><circle cx="7" cy="7" r="3" /><circle cx="17" cy="17" r="3" /><path d="M9 9c2 2 4 4 6 6" /></>;
      case 'road': return <><path d="m8 3-3 18M16 3l3 18" /><path d="M12 4v3M12 10v4M12 17v3" /></>;
      case 'zap': return <path d="m13 2-8 12h6l-1 8 9-13h-6Z" />;
      case 'filter': return <><path d="M3 4h18l-7 8v6l-4 2v-8Z" /><path d="M8 8h8" /></>;
      case 'package': return <><path d="m4 7 8-4 8 4v10l-8 4-8-4Z" /><path d="m4 7 8 4 8-4M12 11v10M8 5l8 4" /></>;
      case 'archive': return <><path d="M4 7h16v13H4Z" /><path d="M3 4h18v4H3ZM9 12h6" /></>;
      case 'sprout': return <><path d="M12 21v-9" /><path d="M12 14c-5 0-7-3-7-7 5 0 7 3 7 7ZM12 11c5 0 7-3 7-7-5 0-7 3-7 7Z" /></>;
      case 'flask': return <><path d="M9 3h6M10 3v6l-5 9c-.6 1 .2 3 2 3h10c1.8 0 2.6-2 2-3l-5-9V3" /><path d="M8 15h8" /></>;
      case 'camp': return <><path d="m3 19 6-10 6 10ZM10 19l5-8 6 8" /><path d="M12 6V2M12 3h5l-2 2 2 2h-5" /></>;
      case 'hole': return <><ellipse cx="12" cy="13" rx="9" ry="6" /><ellipse cx="12" cy="13" rx="5" ry="3" /><path d="m5 8 2 2M19 8l-2 2" /></>;
    }
  })();
  return <svg className={`node-icon ${className}`.trim()} viewBox="0 0 24 24" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} {...common}>{title && <title>{title}</title>}{glyph}</svg>;
}
