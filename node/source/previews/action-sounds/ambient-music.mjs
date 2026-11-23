// Quiet string-only background, complementary to the separate piano action cues.
export const ambientMusic={title:'Quiet Workshop · Ambient Strings',key:'F major',tempo:64,bars:16,durationSeconds:60,
 // Four unhurried phrases: descending answer, small rise, a warmer reply,
 // then a return to F. Opening/closing F share one bow across the loop.
 // [pitch, start seconds, duration seconds, relative bow strength]
 cello:[['F3',0,5,.80],['E3',5,2.5,.94],['D3',7.5,2.5,.88],['C3',10,5,.76],
  ['A2',15,5,.74],['C3',20,2.5,.88],['D3',22.5,2.5,.96],['C3',25,5,.78],
  ['Bb2',30,5,.82],['D3',35,2.5,.96],['C3',37.5,2.5,.86],['A2',40,5,.74],
  ['G2',45,3.75,.72],['Bb2',48.75,2.5,.84],['C3',51.25,3.75,.78],['F3',55,5,.80]],
 bass:['F2','C2','F2','A2','F2','F2','F2','F2','F2','C2','C2','F2'].map((note,index)=>[note,index*5,5]),
};
