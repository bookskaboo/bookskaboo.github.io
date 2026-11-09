import { LINE_ART, type LineArtId } from '../art/lineArt';
import { getNodeArt } from '../art/nodeArt';
import { getNodeDisplayDefinition, NODE_DEFINITIONS } from '../content/nodes';
import type { MachineNode, NodeKind } from '../domain/types';
import { modNode } from '../mods/modRules';

interface Props {
  kind: NodeKind;
  node?: MachineNode;
  completedResearch?: readonly string[];
  className?: string;
  title?: string;
  inheritColor?: boolean;
}

export function NodeIcon({ kind, node, completedResearch, className = '', title, inheritColor }: Props) {
  const custom = modNode(kind)?.icon;
  const color = inheritColor ? undefined : (node ? getNodeDisplayDefinition(node) : NODE_DEFINITIONS[kind]).accentCss;
  if (custom) return <span className={`node-icon mod-node-glyph ${className}`} style={{ color }} title={title} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>{custom}</span>;
  return <IconGlyph icon={getNodeArt(kind, node, completedResearch)} className={className} title={title} color={color} />;
}

export function IconGlyph({ icon, className = '', title, color }: { icon: LineArtId; className?: string; title?: string; color?: string }) {
  return <svg className={`node-icon ${className}`.trim()} style={{ color }} viewBox="0 0 24 24" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {title && <title>{title}</title>}
    <path d={LINE_ART[icon]} />
  </svg>;
}
