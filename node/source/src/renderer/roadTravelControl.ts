import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { label } from './playfieldDrawing';

/** One square arrow size for every direction, independent of field zoom. */
export const ROAD_TRAVEL_ARROW_SIZE = 32;

/** A screen-sized travel action in the unplayable space beyond the field edge. */
export function createRoadTravelControl(dx: number, dy: number, travel: () => void) {
  const root = new Container(); root.label = 'road-travel-control';
  root.eventMode = 'static'; root.cursor = 'pointer'; root.hitArea = new Rectangle(-28, -32, 56, 64);
  const title = label('Travel', 12, 0xff777f, '500'); title.anchor.set(.5); title.y = -22; title.eventMode = 'none';
  const arrow = new Graphics(); arrow.eventMode = 'none';
  const half = ROAD_TRAVEL_ARROW_SIZE / 2;
  arrow.poly([-half,-6, 0,-6, 0,-half, half,0, 0,half, 0,6, -half,6]).fill(0xf16570).stroke({color:0x25161b,width:1.5});
  arrow.rotation = Math.atan2(dy, dx); arrow.y = 8;
  root.addChild(title, arrow);
  let press: {x:number;y:number} | undefined;
  root.on('pointerdown', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    press = event.button===0 && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey ? {...event.global} : undefined;
  });
  root.on('pointertap', (event: FederatedPointerEvent) => {
    event.stopPropagation(); const start = press; press = undefined;
    if (start && event.button===0 && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && Math.hypot(event.global.x-start.x,event.global.y-start.y)<=4) travel();
  });
  root.on('pointerupoutside', () => { press=undefined; });
  root.on('pointercancel', () => { press=undefined; });
  return root;
}

export function positionRoadTravelControl(control: Container, size: {w:number;h:number}, dx: number, dy: number, zoom: number) {
  control.scale.set(1 / zoom);
  control.position.set(dx * (size.w/2 + 38/zoom), dy * (size.h/2 + 42/zoom));
  return new Rectangle(Math.min(-size.w/2,control.x-28/zoom),Math.min(-size.h/2,control.y-32/zoom),
    Math.max(size.w/2,control.x+28/zoom)-Math.min(-size.w/2,control.x-28/zoom),
    Math.max(size.h/2,control.y+32/zoom)-Math.min(-size.h/2,control.y-32/zoom));
}
