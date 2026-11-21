import { NAMES, randomFrom, type Terrain } from '../domain/mapTerrain';
type Point = { x: number; y: number };
const SIZE = 768;
const xy = (p: Point) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;

/** Voronoi cells on a torus: irregular neighbors, with identical shared edges. */
function groundCells(random: () => number) {
  const sites: Point[] = [];
  for (let i=0;i<11;i++) {
    let candidate: Point = {x:0,y:0};
    for(let attempt=0;attempt<60;attempt++) {
      candidate={x:random()*SIZE,y:random()*SIZE};
      if(sites.every(p=>Math.hypot(Math.min(Math.abs(p.x-candidate.x),SIZE-Math.abs(p.x-candidate.x)),Math.min(Math.abs(p.y-candidate.y),SIZE-Math.abs(p.y-candidate.y)))>105))break;
    }
    sites.push(candidate);
  }
  const neighbors=sites.flatMap(p=>[-SIZE,0,SIZE].flatMap(x=>[-SIZE,0,SIZE].map(y=>({x:p.x+x,y:p.y+y}))));
  return sites.map(site=>{
    let polygon: Point[]=[{x:-SIZE,y:-SIZE},{x:SIZE*2,y:-SIZE},{x:SIZE*2,y:SIZE*2},{x:-SIZE,y:SIZE*2}];
    for(const neighbor of neighbors) {
      const nx=neighbor.x-site.x,ny=neighbor.y-site.y;
      if(Math.abs(nx)+Math.abs(ny)<.001)continue;
      const limit=(neighbor.x**2+neighbor.y**2-site.x**2-site.y**2)/2;
      const clipped: Point[]=[];
      for(let i=0;i<polygon.length;i++) {
        const a=polygon[i],b=polygon[(i+1)%polygon.length];
        const da=a.x*nx+a.y*ny-limit,db=b.x*nx+b.y*ny-limit;
        if(da<=.000001)clipped.push(a);
        if((da<0)!==(db<0)) {const t=da/(da-db);clipped.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
      }
      polygon=clipped;
    }
    return {site,polygon};
  });
}

function softOutline(points: Point[]) {
  const n=points.length;
  return `M${xy(points[0])}`+points.map((p,i)=>{
    const prev=points[(i+n-1)%n],next=points[(i+1)%n],after=points[(i+2)%n];
    return `C${xy({x:p.x+(next.x-prev.x)/6,y:p.y+(next.y-prev.y)/6})} ${xy({x:next.x-(after.x-p.x)/6,y:next.y-(after.y-p.y)/6})} ${xy(next)}`;
  }).join('')+'Z';
}

export const PALETTE: Record<Terrain, { base: string; patch: string; line: string; accent: string; description: string }> = {
  badlands: { base: '#242025', patch: '#3a2d2e', line: '#77615a', accent: '#c9957f', description: 'Connected clay cracks across broad, weathered plates. The trees have declined the invitation.' },
  grassland: { base: '#1e2827', patch: '#293b32', line: '#56745e', accent: '#9bbd94', description: 'Sprawling grass patches with a few quiet blades. Reasonably cooperative ground.' },
  desert: { base: '#2a2621', patch: '#41392a', line: '#8b7958', accent: '#cdb685', description: 'Long, soft dune contours across open sand. Shade remains a separate project.' },
  rocky: { base: '#24272e', patch: '#353c46', line: '#6e7887', accent: '#a5b2c6', description: 'Joined stone slabs with broad, flat facets. Geology has supplied extra paperwork.' },
};

/** Periodic 768-unit ground forms. Wrapped copies continue across every tile edge. */
export function tileSvg(kind: Terrain, variant = 0, strength = 1) {
  const p = PALETTE[kind], random = randomFrom(7711 + variant * 919 + Object.keys(PALETTE).indexOf(kind) * 371);
  const point = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  let shapes = '';
  if (kind === 'grassland') {
    for (let i=0;i<5;i++) {
      const x=random()*SIZE,y=random()*SIZE,rx=75+random()*210,ry=60+random()*160,rotation=random()*Math.PI;
      const count=8+Math.floor(random()*5);
      const outline=Array.from({length:count},(_,j)=>{
        const angle=(j+(random()-.5)*.45)*Math.PI*2/count,radius=.58+random()*.65;
        const dx=Math.cos(angle)*rx*radius,dy=Math.sin(angle)*ry*radius;
        return {x:x+dx*Math.cos(rotation)-dy*Math.sin(rotation),y:y+dx*Math.sin(rotation)+dy*Math.cos(rotation)};
      });
      shapes += `<path d="${softOutline(outline)}" fill="${p.patch}" opacity="${.5+random()*.35}"/>`;
      const blades=1+Math.floor(random()*4);
      for(let blade=0;blade<blades;blade++) {
        const anchor=outline[Math.floor(random()*count)],bx=x+(anchor.x-x)*.6,by=y+(anchor.y-y)*.6;
        shapes += `<path d="M${point(bx-6,by)}q-5 -4 -7 -11m8 11q1 -10 6 -16m-2 16q6 -7 12 -8" fill="none" stroke="${p.line}" stroke-width="1.2" opacity=".5"/>`;
      }
    }
  } else if (kind === 'desert') {
    for(let i=0;i<3;i++) {
      const base=70+i*256+(random()-.5)*100,amplitudes=[35+random()*40,12+random()*26,5+random()*15];
      const phases=amplitudes.map(()=>random()*Math.PI*2),depth=25+random()*75;
      const yAt=(x:number,offset:number)=>base+offset*(depth+18*Math.sin(x/SIZE*Math.PI*2+phases[1]))+amplitudes.reduce((sum,a,j)=>sum+a*Math.sin(x/SIZE*Math.PI*2*(j+1)+phases[j]),0);
      const slope=(x:number,offset:number)=>offset*18*Math.PI*2/SIZE*Math.cos(x/SIZE*Math.PI*2+phases[1])+amplitudes.reduce((sum,a,j)=>sum+a*Math.PI*2*(j+1)/SIZE*Math.cos(x/SIZE*Math.PI*2*(j+1)+phases[j]),0);
      const wave=(offset:number,reverse=false)=>{
        const step=(reverse?-1:1)*SIZE/12,start=reverse?SIZE:0;
        let result=`${reverse?'L':'M'}${point(start,yAt(start,offset))}`;
        for(let j=0;j<12;j++) {const a=start+j*step,b=a+step;result+=`C${point(a+step/3,yAt(a,offset)+slope(a,offset)*step/3)} ${point(b-step/3,yAt(b,offset)-slope(b,offset)*step/3)} ${point(b,yAt(b,offset))}`;}
        return result;
      };
      shapes += `<path d="${wave(0)}${wave(1,true)}Z" fill="${p.patch}" opacity="${.4+random()*.25}"/><path d="${wave(0)}" fill="none" stroke="${p.line}" stroke-width="1.5" opacity=".55"/>${i===1?`<path d="${wave(.35)}" fill="none" stroke="${p.line}" stroke-width=".8" opacity=".14"/>`:''}`;
    }
  } else {
    for(const {site,polygon} of groundCells(random)) {
      const edgePoints=polygon.flatMap((a,i)=>{
        if(kind==='rocky')return [a];
        const b=polygon[(i+1)%polygon.length],mx=((a.x+b.x)/2%SIZE+SIZE)%SIZE,my=((a.y+b.y)/2%SIZE+SIZE)%SIZE;
        const wobble=Math.sin(Math.round(mx)*.071+Math.round(my)*.039+variant)*4;
        return [a,{x:a.x+(b.x-a.x)/3+wobble,y:a.y+(b.y-a.y)/3-wobble},{x:a.x+(b.x-a.x)*2/3+wobble,y:a.y+(b.y-a.y)*2/3-wobble}];
      });
      const contour=`M${edgePoints.map(xy).join('L')}Z`;
      shapes += `<path d="${contour}" fill="${p.patch}" opacity="${.12+random()*.5}"/><path d="${contour}" fill="none" stroke="${p.line}" stroke-width="${kind==='badlands'?1.5:1.3}" opacity="${kind==='badlands'?.48:.36}"/>`;
      if(kind==='badlands') {
        if(random()>.35) {const a=polygon[Math.floor(random()*polygon.length)],end={x:site.x+(random()-.5)*45,y:site.y+(random()-.5)*45};shapes+=`<path d="M${xy(a)}L${point((a.x+end.x)/2+13,(a.y+end.y)/2-7)} ${xy(end)}" fill="none" stroke="${p.line}" stroke-width="1" opacity=".38"/>`;}
      } else {
        const j=Math.floor(random()*polygon.length),a=polygon[j],b=polygon[(j+1)%polygon.length],c=polygon[(j+2)%polygon.length];
        shapes+=`<path d="M${xy(a)}L${xy(b)} ${xy(c)} ${xy(site)}Z" fill="${p.line}" opacity="${.04+random()*.07}"/>`;
      }
    }
  }
  const wrapped=[-768,0,768].flatMap(x=>[-768,0,768].map(y=>`<g transform="translate(${x} ${y})">${shapes}</g>`)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 768" width="768" height="768" role="img" aria-label="${NAMES[kind]} irregular natural ground tile variant ${variant+1}"><rect width="768" height="768" fill="${p.base}"/><g opacity="${Math.max(0, Math.min(2, strength)) * .36}">${wrapped}</g></svg>`;
}

