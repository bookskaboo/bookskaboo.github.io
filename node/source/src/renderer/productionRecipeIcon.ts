import { Container, Graphics, GraphicsPath } from 'pixi.js';
import { ITEM_ART, ITEM_ART_ACCENT, itemFallbackGlyph } from '../art/itemArt';
import { getNodeArt } from '../art/nodeArt';
import { recipeArtItem } from '../art/recipeArt';
import { ITEM_COLORS } from '../content/items';
import { NODE_DEFINITIONS } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import { getNodeSize, STANDARD_NODE_WIDTH } from '../domain/nodeGeometry';
import type { MachineNode, Recipe } from '../domain/types';
import { modNode } from '../mods/modRules';
import { drawLineArt, drawNodeIcon } from './drawNodeIcon';
import { nodeHeaderHeight } from './playfieldDrawing';

export function productionRecipeIconLayout(node: MachineNode) {
  const widthScale = Math.min(1, getNodeSize(node).w / STANDARD_NODE_WIDTH);
  return {
    size: 60 * widthScale,
    widthScale,
    // Local coordinates are centered on the whole node. The header starts one unit inside the frame.
    centerY: (1 + nodeHeaderHeight(node)) / 2,
  };
}

export function createProductionRecipeIcon(initial: MachineNode) {
  const { size, centerY } = productionRecipeIconLayout(initial);
  const root = new Container({ eventMode: 'none', visible: false });
  root.position.y = centerY;
  let displayed: Recipe | undefined;

  return {
    root,
    update(node: MachineNode, show: boolean) {
      const recipe = show ? RECIPES[node.batch?.recipeId ?? node.recipeId ?? node.lastRecipeId ?? ''] : undefined;
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
