import {midiNote} from './bass-melody.mjs';
// A lighter variation, keeping the original key, tempo and one-minute period.
export const celloMelody={title:'Quiet Workshop · Lighter Cello',key:'F major',tempo:64,beatsPerBar:4,bars:16,durationSeconds:60,
 instrument:'Soft bowed cello section',
 phrases:[
  [['F3',1],['A2',1],['C3',2]],
  [['A2',1],['Bb2',.5],['C3',.5],['A2',1],['G2',1]],
  [['F2',1],['A2',1],['C3',2]],
  [['G2',1],['A2',1],['C3',1],['E3',1]],
  [['F3',2],['E3',1],['D3',1]],
  [['C3',1],['A2',1],['F2',2]],
  [['Bb2',1],['D3',1],['C3',1],['Bb2',1]],
  [['A2',2],['G2',1],['E3',1]],
  [['F3',1],['E3',.5],['D3',.5],['C3',1],['A2',1]],
  [['G2',1],['A2',1],['C3',2]],
  [['Bb2',1],['C3',1],['D3',1],['F3',1]],
  [['E3',1],['C3',1],['A2',2]],
  [['Bb2',1],['D3',1],['F3',2]],
  [['C3',1],['A2',1],['G2',1],['F2',1]],
  [['G2',1],['A2',1],['C3',1],['E3',1]],
  [['C3',1],['E3',1],['F3',2]],
 ]};
export const celloEvents=celloMelody.phrases.flatMap((bar,index)=>{let beat=index*4;return bar.map(([note,beats],step)=>{const event={bar:index+1,note,midi:midiNote(note),beat,beats,expression:.94+.035*Math.sin(index/16*2*Math.PI)+[.035,-.01,0,-.025][step%4]};beat+=beats;return event;});});
