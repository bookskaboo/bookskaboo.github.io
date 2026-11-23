/** One decoded PCM buffer; crossing the loop point never restarts a media element. */
export class AmbientLoopPlayer {
  constructor(uri){this.uri=uri;this.volume=.15;this.muted=false;this.loop=true;this.duration=60;this.offset=0;this.startedAt=0;this.request=0;this.loading=false;this.onchange=()=>{};this.onprogress=()=>{};}
  get paused(){return !this.source;}
  get currentTime(){const position=this.offset+(this.source?this.context.currentTime-this.startedAt:0);return this.loop?position%this.duration:Math.min(position,this.duration);}
  update(){if(this.gain)this.gain.gain.setValueAtTime(this.muted?0:this.volume,this.context.currentTime);if(this.source)this.source.loop=this.loop;this.onchange();}
  async play(){
    if(this.source)return;
    const request=++this.request;this.loading=true;this.onchange();
    try{
      this.context??=new AudioContext();
      const context=this.context;
      if(!this.gain){this.gain=context.createGain();this.gain.connect(context.destination);}
      await context.resume();
      if(request!==this.request)return;
      if(!this.buffer){const binary=atob(this.uri.split(',')[1]),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);this.buffer=await context.decodeAudioData(bytes.buffer);this.duration=this.buffer.duration;}
      if(request!==this.request)return;
      const source=this.context.createBufferSource();source.buffer=this.buffer;source.loop=this.loop;source.loopStart=0;source.loopEnd=this.duration;source.connect(this.gain);
      if(this.offset>=this.duration)this.offset=0;
      this.source=source;this.startedAt=this.context.currentTime;
      source.onended=()=>{source.disconnect();if(this.source===source){this.source=undefined;this.offset=this.duration;clearInterval(this.timer);this.onchange();this.onprogress();}};
      this.update();source.start(0,this.offset);this.timer=setInterval(()=>this.onprogress(),200);
    }finally{if(request===this.request){this.loading=false;this.onchange();this.onprogress();}}
  }
  pause(){++this.request;if(this.source){this.offset=this.currentTime;const source=this.source;this.source=undefined;source.stop();source.disconnect();}clearInterval(this.timer);this.loading=false;this.onchange();this.onprogress();}
  async dispose(){this.pause();const context=this.context;this.context=undefined;this.gain=undefined;await context?.close();}
}
