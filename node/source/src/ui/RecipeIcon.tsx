import type { LineArtId } from '../art/lineArt';
import { cargoMaterial } from '../content/botAssembly';
import type { ItemId, NodeKind, Recipe } from '../domain/types';
import { IconGlyph, NodeIcon } from './NodeIcon';

const PRODUCT_ART: Partial<Record<ItemId, LineArtId>> = {
  charcoal: 'charcoal', brick: 'brick', motor: 'motor', 'circuit-a': 'circuit-a',
  coolant: 'coolant', 'conductive-slurry': 'slurry',
  'hydraulic-actuator': 'piston', 'advanced-actuator': 'servo-piston',
  'ceramic-electrode': 'circuit-b', 'logic-substrate': 'circuit-c', 'precision-controller': 'controller',
  'refined-mithril': 'gem', 'mithril-mesh': 'mesh',
  'simple-robot-frame': 'bot-frame', 'sealed-frame': 'sealed-frame', 'mithril-frame': 'mythril-frame', 'servo-frame': 'servo-frame',
  'simple-robot-gun': 'bot-gun', 'cooled-gun': 'cooled-gun', 'focused-gun': 'focused-gun', 'pulse-cannon': 'pulse-cannon',
  'suppression-bot': 'bot',
  'core-half-a': 'core-half-a', 'core-half-b': 'core-half-b', 'final-core': 'final-core',
  slag: 'slag', 'metallic-fines': 'fines', 'glassy-crust': 'crust', 'spent-flux': 'flux',
  'mineral-aggregate': 'mountain', 'metal-residue': 'fines',
  wood: 'tree', stone: 'stone-rune', iron: 'iron-ingot', copper: 'copper-ingot', mythril: 'gem', water: 'lake',
  alpha: 'dragon', 'foundry-component': 'foundry', 'reclamation-component': 'reclamation', 'grove-component': 'grove',
  power: 'zap', 'forest-growth': 'sprout',
};

export function MaterialIcon({ item, fallback }: { item?: ItemId; fallback: NodeKind }) {
  const icon = item && (PRODUCT_ART[cargoMaterial(item)] ?? (
    item.endsWith('-gear') ? 'cog' :
    item.endsWith('-wire') ? 'spool' :
    item.endsWith('-plate') ? 'plate' :
    item.endsWith('-core') ? 'core' : undefined
  ));
  return icon ? <IconGlyph icon={icon} /> : <NodeIcon kind={fallback} inheritColor />;
}

export function RecipeIcon({ recipe, node }: { recipe: Recipe; node: NodeKind }) {
  return <MaterialIcon item={Object.keys(recipe.outputs)[0] as ItemId | undefined} fallback={node} />;
}
