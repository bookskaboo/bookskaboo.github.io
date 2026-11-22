// Original melody. Scientific pitch notation: C4 is middle C.
export const bassMelody={title:'Quiet Workshop',key:'F major',tempo:64,beatsPerBar:4,bars:16,durationSeconds:60,
 instrument:'Solo bowed double bass',
 phrases:[
  [['F2',2],['A2',1],['G2',1]],
  [['F2',3],['C2',1]],
  [['D2',2],['F2',1],['A2',1]],
  [['G2',2],['E2',1],['C2',1]],
  [['Bb2',2],['A2',1],['G2',1]],
  [['F2',2],['D2',2]],
  [['G2',2],['E2',1],['F2',1]],
  [['C2',3],['E2',1]],
  [['F2',2],['G2',1],['A2',1]],
  [['C3',2],['A2',2]],
  [['Bb2',2],['A2',1],['G2',1]],
  [['F2',3],['D2',1]],
  [['Bb2',2],['A2',1],['G2',1]],
  [['F2',2],['D2',2]],
  [['G2',2],['E2',2]],
  [['C2',2],['F2',2]],
 ]};
export function midiNote(name){const m=/^([A-G])(b|#)?(\d)$/.exec(name);if(!m)throw Error(`Invalid pitch: ${name}`);return 12*(Number(m[3])+1)+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]]+(m[2]==='b'?-1:m[2]==='#'?1:0);}
export const bassEvents=bassMelody.phrases.flatMap((bar,index)=>{let beat=index*4;return bar.map(([note,beats],step)=>{const event={bar:index+1,note,midi:midiNote(note),beat,beats,expression:.94+.045*Math.sin((index/16)*2*Math.PI)+[.035,0,-.025][step%3]};beat+=beats;return event;});});
