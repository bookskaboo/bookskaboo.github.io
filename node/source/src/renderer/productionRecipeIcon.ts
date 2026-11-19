import { Container, Graphics, GraphicsPath } from 'pixi.js';
import { ITEM_ART, ITEM_ART_ACCENT, itemFallbackGlyph } from '../art/itemArt';
import { getNodeArt } from '../art/nodeArt';
import { recipeArtItem } from '../art/recipeArt';
import { ITEM_COLORS } from '../content/items';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies, NODE_DEFINITIONS } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import { getNodeSize, getPortAnchor, STANDARD_NODE_WIDTH } from '../domain/nodeGeometry';
import type { MachineNode, Recipe } from '../domain/types';
import { modNode } from '../mods/modRules';
import { drawLineArt, drawNodeIcon } from './drawNodeIcon';
import { nodeHeaderHeight } from './playfieldDrawing';

export function productionRecipeIconLayout(node: MachineNode) {
  const { w, h } = getNodeSize(node);
  const widthScale = Math.min(1, w / STANDARD_NODE_WIDTH);
  const size = 60 * widthScale;
  const inputs = getEffectiveNodeInputFamilies(node, []);
  const outputs = getEffectiveNodeOutputFamilies(node);
  if (Math.max(inputs.length, outputs.length) < 3) {
    // Local coordinates are centered on the whole node. The header starts one unit inside the frame.
    return { size, widthScale, centerY: (1 + nodeHeaderHeight(node)) / 2 };
  }

  const lowestPort = Math.max(
    ...inputs.map((_, index) => getPortAnchor(node, 'input', index).y),
    ...outputs.map((_, index) => getPortAnchor(node, 'output', index).y),
  );
  // Buffer boxes end 15 units below their socket. The progress track starts 22 units above the frame bottom.
  const top = lowestPort + 15 + 6;
  const bottom = h / 2 - 22 - 6;
  return { size: Math.max(0, Math.min(size, bottom - top)), widthScale, centerY: (top + bottom) / 2 };
}

export function createProductionRecipeIcon(initial: MachineNode) {
  const { size, centerY } = productionRecipeIconLayout(initial);
  const root = new Container({ eventMode: 'none', visible: false });
  root.position.y = centerY;
  let displayed: Recipe | undefined;

  return {
    root,
    update(node: MachineNode, show: boolean) {
      const recipe = show && size > 0 ? RECIPES[node.batch?.recipeId ?? node.recipeId ?? node.lastRecipeId ?? ''] : undefined;
      root.visible = Boolean(recipe);
      if (!recipe || recipe === displayed) return;
      displayed = recipe;
      root.removeChildren().forEach(child => child.destroy());

      const item = recipeArtItem(recipe, node.kind);
      const art = item && ITEM_ART.get(item);
      if (art) {
        const [outline, accent, color] = art.drawing;
        const graphic = new Graphics().path(new GraphicsPath(outline))
          .stroke({ color: color ?? ITEM_COLORS[art.id], width: 1.55, cap: 'round', join: 'round' });
        if (accent) graphic.path(new GraphicsPath(accent))
          .stroke({ color: art.accentColor ?? ITEM_ART_ACCENT, width: 1.25, cap: 'round', join: 'round' });
        graphic.position.set(-size / 2);
        graphic.scale.set(size / 24);
        root.addChild(graphic);
        return;
      }

      const glyph = itemFallbackGlyph(item);
      const color = NODE_DEFINITIONS[node.kind].accent;
      if (glyph) drawLineArt(root, glyph, 0, 0, size, item ? ITEM_COLORS[item] ?? color : color);
      else drawNodeIcon(root, getNodeArt(node.kind), 0, 0, size, color, modNode(node.kind)?.icon);
    },
  };
}
