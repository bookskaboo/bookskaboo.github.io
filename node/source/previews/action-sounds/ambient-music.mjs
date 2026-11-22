// Quiet string-only background, complementary to the separate piano action cues.
export const ambientMusic={title:'Quiet Workshop · Ambient Strings',key:'F major',tempo:64,bars:16,durationSeconds:60,
 cello:['F3','A2','C3','A2','Bb2','A2','G2','F3'].map((note,index)=>[note,index*7.5,7.5]),
 bass:['F2','C2','F2','A2','F2','F2','F2','F2','F2','C2','C2','F2'].map((note,index)=>[note,index*5,5]),
};
