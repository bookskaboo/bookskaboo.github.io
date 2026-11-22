import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { CameraState, GameState, NodeKind } from '../../src/domain/types';
import { getNodeSize } from '../../src/domain/nodeGeometry';
import { NODE_DEFINITIONS, isNodeUnlocked } from '../../src/content/nodes';
import { getNodeModule } from '../../src/content/nodeModules';
import { getResearchProject } from '../../src/content/research';
import { PixiPlayfield } from '../../src/renderer/PixiPlayfield';
import { BuildPanel } from '../../src/ui/panels/BuildPanel';
import { NodeRecipePicker } from '../../src/ui/NodeRecipePicker';
import { ResearchPanel } from '../../src/ui/ResearchPanel';
import { RecipesPanel } from '../../src/ui/RecipesPanel';
import { NodeMinimap } from '../../src/ui/NodeMinimap';
import { NodeIcon } from '../../src/ui/NodeIcon';
import { UiTooltipLayer } from '../../src/ui/components/UiTooltipLayer';
import { hasOpenDialog } from '../../src/ui/dialogFocus';
import { createSoundFactory } from './fixture';
import { PreviewAudio, type CueId } from './audio';
import { soundSnapshot, changedSound } from './events';
import manifest from '../../outputs/action-sounds/manifest.json';
import '../../src/styles.css';
import './playground.css';

const names = Object.fromEntries(manifest.assets.map(a => [a.id, a.name]));
const buildKinds: NodeKind[] = ['kiln', 'refiner', 'woodenChest', 'joint'];
type Panel = 'build' | 'research' | 'map' | 'recipes' | undefined;
function Playground() {
  const [engine] = useState(createSoundFactory), [audio] = useState(() => new PreviewAudio());
  const [revision, refresh] = useState(0), [panel, setPanel] = useState<Panel>();
  const [selected, setSelected] = useState<string[]>([]), [cable, setCable] = useState<string>();
  const [placing, setPlacing] = useState<NodeKind>(), [recipeNode, setRecipeNode] = useState<string>();
  const [category, setCategory] = useState('All'), [skipWarnings, setSkipWarnings] = useState(false);
  const [guideRecipe, setGuideRecipe] = useState<string>();
  const [ready, setReady] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const [muted, setMuted] = useState(false), [volume, setVolume] = useState(60), [optional, setOptional] = useState(false), [low, setLow] = useState(false);
  const [music, setMusic] = useState(true), [musicVolume, setMusicVolume] = useState(15);
  const [message, setMessage] = useState('Enable sound, then place a node or disconnect and reconnect a cable.');
  const [heard, setHeard] = useState<string[]>([]), [notice, setNotice] = useState<{title: string; detail: string}>();
  const [saved, setSaved] = useState<GameState>();
  const header = useRef<HTMLElement>(null), viewport = useRef<HTMLDivElement>(null), host = useRef<HTMLElement>(null);
  const previous = useRef(soundSnapshot(engine.getState())), quiet = useRef(false);
  const [focus, setFocus] = useState<{camera: CameraState; nonce: number}>();
  const game = engine.getState(), sector = engine.getSector(), node = sector.nodes.find(n => selected.includes(n.id));
  const recipe = sector.nodes.find(n => n.id === recipeNode);
  const close = () => { setPanel(undefined); setRecipeNode(undefined); };
  const fit = () => {
    const box = viewport.current?.getBoundingClientRect(), nodes = engine.getSector().nodes;
    if (!box || !nodes.length) return;
    const left = Math.min(...nodes.map(n => n.x - getNodeSize(n).w / 2)), right = Math.max(...nodes.map(n => n.x + getNodeSize(n).w / 2));
    const top = Math.min(...nodes.map(n => n.y - getNodeSize(n).h / 2)), bottom = Math.max(...nodes.map(n => n.y + getNodeSize(n).h / 2));
    const zoom = Math.max(.15, Math.min(.65, (box.width - 60) / (right - left), (box.height - 55) / (bottom - top)));
    const camera = { zoom, x: (box.width - (left + right) * zoom) / 2, y: box.top + (box.height - (top + bottom) * zoom) / 2 };
    engine.setCamera(camera); setFocus(old => ({camera, nonce: (old?.nonce ?? 0) + 1}));
  };
  useLayoutEffect(() => {
    const resize = () => { host.current!.style.setProperty('--hud-clear', `${header.current!.getBoundingClientRect().height}px`); requestAnimationFrame(fit); };
    const observer = new ResizeObserver(resize); observer.observe(header.current!); window.addEventListener('resize', resize); resize();
    return () => {observer.disconnect(); window.removeEventListener('resize', resize);};
  }, [engine]);
  useEffect(() => {
    audio.onPlayed = cue => setHeard(old => [`${names[cue] ?? cue}`, ...old].slice(0, 5));
    const unsubscribe = engine.subscribe(() => {
      const next = soundSnapshot(engine.getState()), cue = quiet.current ? undefined : changedSound(previous.current, next);
      previous.current = next; refresh(n => n + 1);
      if (cue) {
        audio.play(cue);
        if (['complete', 'upgrade', 'victory'].includes(cue)) {
          const event = engine.getState().researchLog?.at(-1);
          setNotice({title: cue === 'upgrade' ? 'Character upgraded' : cue === 'victory' ? 'Victory' : 'Research complete', detail: event?.message ?? 'New factory capability unlocked.'});
        }
      }
    });
    engine.startRealtimeClock(); const timer = window.setInterval(() => engine.tickRealtime(), 100);
    const visibility = () => { void audio.setHidden(document.hidden).catch(e => setError(`Audio could not resume: ${String(e)}`)); if (document.hidden) engine.stopRealtimeClock(); else engine.startRealtimeClock(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { unsubscribe(); clearInterval(timer); engine.stopRealtimeClock(); document.removeEventListener('visibilitychange', visibility); void audio.dispose(); };
  }, [audio, engine]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(undefined), 4500); return () => clearTimeout(timer); }, [notice]);
  const rejected = (detail: string) => { setMessage(detail); audio.play('reject'); };
  const open = (next: Panel) => { setPanel(next); setRecipeNode(undefined); audio.play('panel', true); };
  const configure = (id: string) => {
    const target = engine.getSector().nodes.find(n => n.id === id); if (!target) return;
    setSelected([id]);
    if (target.kind === 'researchCenter') open('research');
    else if (getNodeModule(target.kind).controls.configuration === 'recipe') { setRecipeNode(id); setPanel(undefined); audio.play('panel', true); }
    else setMessage('This node has no recipe to choose. Drag it, wire it or delete it.');
  };
  const undo = () => {
    const before = JSON.stringify(soundSnapshot(engine.getState())); quiet.current = true; engine.undo(); quiet.current = false;
    if (JSON.stringify(soundSnapshot(engine.getState())) !== before) { audio.play('move'); setMessage('Factory change undone.'); } else setMessage('Nothing to undo yet.');
    setSelected([]); setCable(undefined); setRecipeNode(undefined);
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (hasOpenDialog() || target.closest('input,select,textarea,button,a,[contenteditable=true]')) return;
      if (event.key === 'Escape') { close(); setPlacing(undefined); }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); if (cable) engine.deleteConnection(cable); else engine.deleteNodes(selected); setSelected([]); setCable(undefined); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [selected, cable, engine]);
  const reset = () => {
    audio.stop(); quiet.current = true; engine.replaceState(structuredClone(createSoundFactory().getState())); quiet.current = false;
    previous.current = soundSnapshot(engine.getState()); close(); setSelected([]); setCable(undefined); setPlacing(undefined); setNotice(undefined); setHeard([]); setSaved(undefined);
    setMessage('Test factory reset. The paperwork was temporary.'); requestAnimationFrame(fit);
  };
  const testNotice = (cue: CueId, title: string, detail: string) => { audio.play(cue); setNotice({title, detail}); };
  const travel = (id: string) => {
    if (id === engine.getState().activeSectorId) return;
    if (!engine.getState().sectors[id]?.unlocked) { rejected('Activate that Map Node before traveling.'); return; }
    engine.switchSector(id); close(); setSelected([]); setCable(undefined); setRecipeNode(undefined); setPlacing(undefined); requestAnimationFrame(fit);
    setMessage(id === '5,5' ? 'Back at the supplied test factory.' : 'Travel complete. Home keeps the factory you left behind.');
  };
  const woodRoute = sector.connections.find(c => c.from === 'wood-cart' && c.to === 'test-kiln');
  const activeProject = game.research.selected ? getResearchProject(game.research.selected)?.name : undefined;
  return <main className="sound-playground" ref={host}><header className="sound-test-header" ref={header}>
    <div className="sound-test-heading"><div><h1>Sound test factory</h1><p>F major · varied voicings · C2–C4 · revision 6</p></div><a href={location.pathname.includes('/previews/')?'../../outputs/action-sounds/f-major-revision-6.html':'f-major-revision-6.html'}>F-major chords and cues</a></div>
    <div className="sound-test-toolbar">
      <button className="sound-enable" disabled={loading} onClick={async () => { setLoading(true); setError(''); try { await audio.enable(); setReady(true); setMessage('Sound enabled. The factory is accepting feedback.'); } catch (e) {setError(`Audio could not start: ${String(e)}`);} finally {setLoading(false);} }}>{loading ? 'Loading sounds…' : ready ? 'Sound enabled' : 'Enable sound'}</button>
      <label>Effects volume <input aria-label="Effects volume" type="range" min="0" max="100" value={volume} onChange={e => {const v = Number(e.target.value); setVolume(v); audio.volume = v / 100; audio.update();}}/><output>{volume}%</output></label>
      <label><input type="checkbox" checked={muted} onChange={e => {setMuted(e.target.checked); audio.muted = e.target.checked; audio.update(); if(e.target.checked)audio.stop();}}/>Mute</label>
      <label><input type="checkbox" checked={optional} onChange={e => {setOptional(e.target.checked); audio.optional = e.target.checked;}}/>Selection / panel sounds</label>
      <label>Selection pitch <select value={low ? 'low' : 'original'} onChange={e => {const low = e.target.value === 'low';setLow(low);audio.lowSelect = low;audio.play('select');}}><option value="original">Original</option><option value="low">Lower</option></select></label>
    </div>
    <div className="sound-test-toolbar" aria-label="Background music controls">
      <label><input type="checkbox" checked={music} onChange={e => {setMusic(e.target.checked); audio.music = e.target.checked; audio.update();}}/>Ambient music</label>
      <label>Music volume <input aria-label="Music volume" type="range" min="0" max="100" value={musicVolume} onChange={e => {const v = Number(e.target.value); setMusicVolume(v); audio.musicVolume = v / 100; audio.update();}}/><output>{musicVolume}%</output></label>
      <span>{ready ? music ? muted ? 'Music muted' : 'Ambient strings looping' : 'Music off' : 'Starts quietly with Enable sound'}</span>
    </div>
    <nav className="sound-test-toolbar" aria-label="Factory actions"><button onClick={() => open('build')}>Build</button><button onClick={() => open('research')}>Upgrades</button><button onClick={() => open('map')}>Node Map</button><button className="pause-button" onClick={() => engine.togglePause()}>{game.paused ? 'Resume game' : 'Pause game'}</button><button onClick={undo}>Undo</button><button onClick={fit}>Fit factory</button><button onClick={reset}>Reset test</button><span>{sector.id === '5,5' ? 'Home' : 'Neighbor'} · {Math.floor(game.playTimeMs / 1000)} s · {sector.nodes.length} nodes · {sector.connections.length} cables</span></nav>
    {error && <p role="alert">{error}</p>}
  </header>
  <aside className="sound-test-sidebar" aria-label="Sound test controls">
    <h2>Build and connect</h2><p>Pick a node, then click empty space. Drag bodies to move them. Drag between sockets to wire them.</p>
    <div className="sound-node-palette">{buildKinds.map(kind => <button key={kind} aria-pressed={placing === kind} onClick={() => {close();setPlacing(kind);setMessage(`Click empty space to place ${NODE_DEFINITIONS[kind].name}.`);}}><NodeIcon kind={kind}/>{NODE_DEFINITIONS[kind].name}</button>)}</div>
    {placing && <button onClick={() => setPlacing(undefined)}>Cancel placement</button>}
    <p className="sound-test-selection">{node ? `${node.name} selected` : cable ? 'Cable selected' : 'Click a node or cable to select it.'}</p>
    <div className="sound-test-buttons"><button disabled={!node} onClick={() => node && configure(node.id)}>Configure selected</button><button disabled={!node && !cable} onClick={() => {if(cable)engine.deleteConnection(cable);else engine.deleteNodes(selected);setSelected([]);setCable(undefined);setRecipeNode(undefined);}}>Delete selected</button></div>
    <button disabled={sector.id !== '5,5'} onClick={() => {if(woodRoute)engine.deleteConnection(woodRoute.id);else if(!engine.connect('wood-cart','test-kiln'))rejected('Wood route unavailable. Reset the test if its nodes were removed.');}}>{woodRoute ? 'Disconnect Wood route' : 'Connect Wood route'}</button>
    <button disabled={sector.id !== '5,5'} onClick={() => {if(!engine.connect('test-kiln','test-lab'))rejected('Action unavailable: a Research Center accepts Cores, not Charcoal.');}}>Try incompatible cable</button>
    <h2>Research and travel</h2><p>The Research Center starts with 10 Simple and 10 Basic Cores. Queue Assembler, or use Upgrade. Five ordinary 5-second lab cycles play the completion cue.</p>
    <button disabled={game.research.completed.includes('assembler')} onClick={() => {const result=engine.queueResearch('assembler');setMessage(result==='added'?'Assembler queued. Research consumes supplied Cores at normal speed.':`Research was not queued: ${result}.`);if(result!=='added')audio.play('reject');}}>Queue Assembler research</button>
    <p>{activeProject ? `${activeProject} · ${game.research.paused ? 'research paused' : 'processing supplied Cores'}` : 'No active research project.'}</p>
    <button onClick={() => engine.setResearchPaused(!game.research.paused)}>{game.research.paused ? 'Resume research' : 'Pause research'}</button>
    <div className="sound-test-buttons"><button disabled={Boolean(game.sectors['6,5']?.unlocked)} onClick={() => {if(!engine.unlockSector(6,5))rejected('Neighbor activation is unavailable.');}}>Activate neighbor</button><button disabled={!game.sectors['6,5']?.unlocked} onClick={() => travel(game.activeSectorId==='5,5'?'6,5':'5,5')}>{game.activeSectorId==='5,5'?'Travel to neighbor':'Return Home'}</button></div>
    <h2>Notice previews</h2><p>These buttons rehearse rare notices. They do not award progress.</p>
    <div className="sound-test-buttons"><button onClick={() => testNotice('complete','Research complete','Preview: Assembler research completed.')}>Research notice</button><button onClick={() => testNotice('upgrade','Character upgraded','Preview: new hardware. Same employee.')}>Upgrade notice</button><button onClick={() => testNotice('attention','Attention','Preview: an important factory notice needs attention.')}>Warning notice</button><button onClick={() => testNotice('victory','Victory','Preview: assignment complete. Somehow.')}>Victory notice</button></div>
    <h2>Temporary snapshot</h2><p>Save and restore this test in memory. Reloading discards it.</p><div className="sound-test-buttons"><button onClick={() => {setSaved(structuredClone(engine.getState()));audio.play('save');setMessage('Test snapshot saved in memory.');}}>Save test snapshot</button><button disabled={!saved} onClick={() => {quiet.current=true;engine.replaceState(saved!);quiet.current=false;setSelected([]);setCable(undefined);close();setNotice(undefined);audio.stop();setMessage('Test snapshot restored silently.');requestAnimationFrame(fit);}}>Restore test snapshot</button></div>
    <h2>Last sounds</h2><ol aria-label="Recently played sounds">{heard.length ? heard.map((name,i)=><li key={`${i}-${name}`}>{name}</li>) : <li>No sounds played yet.</li>}</ol><p role="status" className="sound-test-message">{message}</p>
  </aside>
  <PixiPlayfield viewportRef={viewport} engine={engine} revision={revision} selectedIds={selected} selectedConnection={cable} placing={placing} snapToGrid={false} showRecipeIcons cameraFocus={focus}
    onSelect={ids => {if(ids.some(id=>!selected.includes(id)))audio.play('select',true);setSelected(ids);if(ids.length)setCable(undefined);}}
    onNodeContextMenu={id => configure(id)} onCopyRecipe={() => false}
    onPlace={(kind,x,y,repeat)=>{const id=engine.placeNode(kind,x,y);if(!id)rejected(engine.getNodePlacementError(kind,x,y));else{setSelected([id]);if(!repeat)setPlacing(undefined);setMessage(`${NODE_DEFINITIONS[kind].name} placed.`);}}}
    onConnect={(a,b,ap,bp,replace)=>engine.connectPorts(a,ap,b,bp,replace)} onConnectionRejected={f=>rejected(f.detail)}
    onConnectionSelect={setCable} onDeleteConnection={id=>engine.deleteConnection(id)} onDeleteNode={id=>{engine.deleteNodes([id]);setSelected([]);}}
    onCycleInputPorts={id=>engine.cycleNodeInputOrder(id)} onCycleOutputPorts={id=>engine.cycleNodeOutputPosition(id)} onRotate={id=>engine.rotateNode(id)} onConfigure={configure} onClonePlacement={setPlacing}
    onCamera={camera=>engine.setCamera(camera)}/>
  {panel==='build'&&<BuildPanel game={game} category={category} setCategory={setCategory} canBuild={kind=>isNodeUnlocked(kind,game.research.unlocked)} showAllNodes={false} onChoose={kind=>{setPlacing(kind);close();}} onClose={close}/>}
  {panel==='research'&&<ResearchPanel game={game} engine={engine} onClose={close} onOpenRecipe={id=>{setGuideRecipe(id);setPanel('recipes');}} onOpenMap={()=>open('map')}/>}
  {panel==='recipes'&&<RecipesPanel game={game} initialRecipeId={guideRecipe} persistView={false} backToResearch onClose={()=>setPanel('research')}/>}
  {panel==='map'&&<NodeMinimap game={game} engine={engine} expanded persistLayout={false} onClose={close} onTravel={travel} onOpenMap={()=>{}} onHoverChange={()=>{}}/>}
  {recipe&&<NodeRecipePicker game={game} engine={engine} node={recipe} persistView={false} skipWarnings={skipWarnings} onSkipWarnings={setSkipWarnings} onClose={()=>setRecipeNode(undefined)}/>}
  {notice&&<div className="sound-test-notice" role="status"><strong>{notice.title}</strong><span>{notice.detail}</span><button aria-label="Dismiss notice" onClick={()=>setNotice(undefined)}>×</button></div>}
  <UiTooltipLayer/>
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Playground/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
