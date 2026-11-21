export { roadTravelDestination } from '../domain/roadNavigation';

/** Stable IDs survive selection redraws, unlike Pixi's display-object click counter. */
export class RoadTravelClicks {
  private previous?: { key: string; x: number; y: number; at: number };
  clear() { this.previous=undefined; }
  tap(key: string, point: { x: number; y: number }, at: number) {
    const previous=this.previous;
    if (previous?.key===key && at>=previous.at && at-previous.at<=400 && Math.hypot(point.x-previous.x,point.y-previous.y)<=6) {
      this.clear(); return true;
    }
    this.previous={key,...point,at}; return false;
  }
}
