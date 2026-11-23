// Proposal only. These IDs are audition assets, not game/save event IDs.
export const PALETTE = { key: 'F major', register: 'C2–C4', revision: 7 };
const pitches = {C:0,D:2,E:4,F:5,G:7,A:9,Bb:10};
export function pianoNoteFrequency(name) {
  const match=/^(Bb|[CDEFGA])([2-4])$/.exec(name.replaceAll(' ',''));
  if(!match)throw Error('Unsupported piano note: '+name);
  const midi=12*(Number(match[2])+1)+pitches[match[1]];
  return 440*2**((midi-69)/12);
}
const v=(at,hold,name,gain=.05)=>{const hz=pianoNoteFrequency(name);return [at,hold,hz,hz,gain,'piano'];};
const chord=(at,hold,names,gain=.045)=>names.map(name=>v(at,hold,name,gain));
export const cues = [
  {id:'select',name:'Select',harmony:'Single soft F-major chord',description:'F3–A3–C4 struck together once, with a gentler touch.',duration:.15,voices:[v(0,.12,'F3',.03),v(0,.12,'A3',.026),v(0,.12,'C4',.022)]},
  {id:'panel',name:'Open panel',harmony:'B-flat major, two-note rise',description:'B-flat2–D3, two gently spaced notes.',duration:.32,voices:[v(0,.1,'Bb2',.04),v(.14,.14,'D3',.03)]},
  {id:'place',name:'Place node',harmony:'F major, three-note rise',description:'F2–C3–A3, a soft rise with room between notes.',duration:.48,voices:[v(0,.12,'F2',.028),v(.14,.12,'C3',.025),v(.28,.16,'A3',.022)]},
  {id:'move',name:'Finish moving',harmony:'Single low F-major chord',description:'F2–A2–C3 struck together once, softly settling.',duration:.22,voices:[v(0,.16,'F2',.035),v(0,.16,'A2',.028),v(0,.16,'C3',.022)]},
  {id:'connect',name:'Connect cable',harmony:'G minor → F major',description:'A short G-minor pickup settles into a quiet F-major chord.',duration:.44,voices:[...chord(0,.1,['G2','Bb2','D3'],.028),v(.22,.18,'F2',.032),v(.22,.18,'A2',.025),v(.22,.18,'C3',.02)]},
  {id:'disconnect',name:'Disconnect cable',harmony:'Low suspended fall → F',description:'B-flat2–G2–F2, a spaced descent to a soft low F.',duration:.42,voices:[v(0,.1,'Bb2',.042),v(.13,.1,'G2',.033),v(.26,.13,'F2',.027)]},
  {id:'delete',name:'Remove nodes',harmony:'F major, three-note fall',description:'A3–F3–C3, three descending notes with a quiet C ending.',duration:.42,voices:[v(0,.1,'A3',.04),v(.13,.1,'F3',.032),v(.26,.13,'C3',.026)]},
  {id:'configure',name:'Apply configuration',harmony:'Open A minor, settling on A',description:'E2–A2–C3–A3, a gently spaced low arpeggio.',duration:.5,voices:[v(0,.1,'E2',.045),v(.105,.1,'A2',.037),v(.21,.1,'C3',.03),v(.315,.14,'A3',.024)]},
  {id:'queue',name:'Queue project',harmony:'Quiet suspended rise → C',description:'G2–B-flat2–C3, a small rising phrase that ends softly.',duration:.42,voices:[v(0,.1,'G2',.028),v(.12,.1,'Bb2',.024),v(.24,.14,'C3',.021)]},
  {id:'pause',name:'Pause',harmony:'D minor, falling wide',description:'A3–F3–D2, a slower, gently fading descent.',duration:.52,voices:[v(0,.12,'A3',.042),v(.16,.12,'F3',.034),v(.32,.16,'D2',.03)]},
  {id:'resume',name:'Resume',harmony:'C major over E, rising',description:'E2–G2–C3, a gently spaced answer ending on C.',duration:.52,voices:[v(0,.12,'E2',.045),v(.16,.12,'G2',.036),v(.32,.16,'C3',.03)]},
  {id:'complete',name:'Research complete',harmony:'C major → gentle rising run → soft F major',description:'A low ta-da with a slower E3–F3–G3–A3 run and a quiet held F-major finish.',duration:2.05,voices:[...chord(0,.12,['C3','E3','G3'],.032),v(.2,.13,'E3',.027),v(.35,.13,'F3',.028),v(.5,.13,'G3',.026),v(.65,.13,'A3',.024),v(.88,1.1,'F3',.046),v(.88,1.1,'A3',.035),v(.88,1.1,'C4',.027)]},
  {id:'upgrade',name:'Character upgrade',harmony:'B-flat major 7 → A minor 7 → falling run → F major',description:'Two unhurried arpeggios and a soft descent resolve into a low F-major chord.',duration:2.2,voices:[v(0,.13,'Bb2',.038),v(.11,.13,'D3',.032),v(.22,.13,'F3',.03),v(.33,.13,'A3',.026),v(.53,.12,'A2',.032),v(.64,.12,'C3',.03),v(.75,.12,'E3',.027),v(.86,.12,'G3',.025),v(1.06,.1,'A3',.028),v(1.17,.1,'G3',.027),v(1.28,.1,'F3',.026),v(1.39,.1,'E3',.024),v(1.6,.55,'F2',.045),v(1.6,.55,'A2',.035),v(1.6,.55,'C3',.026)]},
  {id:'unlock',name:'Activate Map Node',harmony:'Open B-flat add9',description:'B-flat2–D3–F3–C4, a gently opening phrase that settles on C.',duration:.64,voices:[v(0,.18,'Bb2',.04),v(.12,.18,'D3',.032),v(.24,.18,'F3',.027),v(.36,.24,'C4',.022)]},
  {id:'travel',name:'Travel',harmony:'Rising pickup → C',description:'F2–G2–B-flat2–C3, a soft outward phrase ending on C.',duration:.53,voices:[v(0,.1,'F2',.042),v(.12,.1,'G2',.036),v(.24,.1,'Bb2',.03),v(.36,.13,'C3',.026)]},
  {id:'save',name:'Manual save complete',harmony:'C major, closing downward',description:'C4–G3–E3–C2, a gently spaced close into the bass.',duration:.54,voices:[v(0,.1,'C4',.036),v(.12,.1,'G3',.03),v(.24,.1,'E3',.026),v(.36,.14,'C2',.023)]},
  {id:'reject',name:'Action unavailable',harmony:'Soft low F tonic',description:'One soft low F2 strike; informative rather than scolding.',duration:.15,voices:[v(0,.12,'F2',.08)]},
  {id:'attention',name:'Attention',harmony:'E half-diminished 7 → soft F-major answer',description:'A quiet questioning chord, then A3–C4 answering gently.',duration:.62,voices:[...chord(0,.1,['E3','G3','Bb3','D3'],.022),...chord(.36,.2,['A3','C4'],.03)]},
  {id:'victory',name:'Victory',harmony:'F → B-flat → C7 → soft F, with spacious runs',description:'An unhurried I–IV–V7–I cadence with quieter connecting notes and a soft held finish. Paperwork complete.',duration:3.25,voices:[...chord(0,.24,['F2','A2','C3'],.03),v(.22,.12,'A2',.022),v(.37,.12,'C3',.022),v(.52,.12,'D3',.022),...chord(.74,.24,['Bb2','D3','F3'],.028),v(.96,.12,'F3',.022),v(1.11,.12,'G3',.022),v(1.26,.12,'A3',.022),...chord(1.48,.24,['C3','E3','Bb3'],.026),v(1.7,.12,'G3',.022),v(1.85,.12,'E3',.022),v(2,.12,'C3',.022),v(2.24,.95,'F3',.04),v(2.24,.95,'A3',.031),v(2.24,.95,'C4',.024)]},
];
// The optional comparison moves the selection chord down one octave.
export const variants = [
  {id:'select-low',baseId:'select',name:'Select — lower pitch',harmony:'Single soft low F-major chord',description:'F2–A2–C3 struck together once; one octave lower with the same gentle touch.',duration:.15,voices:[v(0,.12,'F2',.03),v(0,.12,'A2',.026),v(0,.12,'C3',.022)]},
];

// Frequency limits below are proposed real-wall-time limits for future integration.
export const actions = [
  ['Place a Production, Logistics or utility node', 'place', 'Start here', 'Only after successful placement; one cue for a pasted layout.', '120 ms; merge batch placements'],
  ['Finish moving nodes or placing a copied layout', 'move', 'Start here', 'At committed drop; remain silent while dragging or previewing.', 'One per drop'],
  ['Connect or replace a cable', 'connect', 'Start here', 'After a valid route is committed, including multi-connection batches.', '100 ms; one per gesture'],
  ['Disconnect a cable', 'disconnect', 'Start here', 'After removal; do not also play when deleting its node.', '100 ms; one per gesture'],
  ['Delete nodes', 'delete', 'Start here', 'After confirmation and actual deletion, once for the selection.', 'One per confirmed action'],
  ['Choose a recipe, Filter item or node configuration', 'configure', 'Start here', 'Only when the selected value actually changes; no sound for opening the picker.', '100 ms; one per apply'],
  ['Queue research or enable the bot Upgrade', 'queue', 'Start here', 'After acceptance; same cue for single-click action and double-click shortcut.', '150 ms'],
  ['Pause / resume research', 'pause/resume', 'Start here', 'After the control changes the processing state; preserve separate visual state.', '150 ms'],
  ['Pause / resume the game', 'pause/resume', 'Start here', 'After state changes; remain audible when entering pause.', '150 ms'],
  ['Complete ordinary research / earn a Map Point', 'complete', 'Start here', 'Once per new completion, including offscreen labs; never on save load.', 'Merge simultaneous completions over 400 ms'],
  ['Complete a character upgrade', 'upgrade', 'Start here', 'Replaces ordinary research completion for this event; Final upgrade is not victory.', 'Once per newly completed tier'],
  ['Activate a frontier Map Node', 'unlock', 'Start here', 'After a Map Point is spent and access opens; activation and visiting stay separate.', 'One per successful activation'],
  ['Travel through the Node Map or a Road', 'travel', 'Start here', 'Once after the active map changes, independent of Road shipment direction.', '250 ms; no sound for current map'],
  ['Attempt an unavailable placement, route or action', 'reject', 'Start here', 'On an explicit failed attempt with a visible reason; no pointer-hover rejection.', '500 ms across all rejected actions'],
  ['Select a node or project / open a panel', 'select/panel', 'Optional', 'Useful only at very low level; try disabled by default because these actions repeat.', '80 ms; selection or panel cue, never both'],
  ['Toggle a node or change Road flow', 'configure', 'Optional', 'After successful state change; reuse configuration feedback.', '100 ms'],
  ['Create or disband a control group', 'configure', 'Optional', 'After the group change commits; not while editing a name.', 'One per committed action'],
  ['Undo / redo a factory change', 'move/configure', 'Optional', 'After a successful undo/redo; suppress the original action cue.', '100 ms'],
  ['Manually save a slot', 'save', 'Optional', 'Only after browser storage confirms success; exporting merely requests a download.', 'One per completed manual save'],
  ['Discover an important feature on first visit', 'complete', 'Optional', 'Play once for the visit summary, rather than once per resource or discovery card.', 'One grouped notice per visit; travel yields'],
  ['New depletion or autosave-failure notice', 'attention', 'Start here', 'Once when a distinct warning first appears; persistent text remains authoritative.', '3 s shared cooldown; no repeating alarm'],
  ['Complete the separate victory project', 'victory', 'Optional', 'Once for the newly earned victory, replacing other completion cues.', 'Never on load, reopen or continued play'],
  ['Hover, pan, zoom, drag, type or close a panel', '', 'Silent', 'Keep navigation and continuous manipulation quiet.', 'No cue'],
  ['Produce an item, deliver a packet or refill a camp reserve', '', 'Silent', 'Factory scale must not turn routine throughput into a wall of clicks.', 'No cue'],
  ['Autosave succeeds / restore a saved factory', '', 'Silent', 'Background persistence and historical completions do not need applause.', 'No cue'],
  ['Wait for inputs, output space or camp suppression', '', 'Silent', 'Do not repeat warning sounds for ordinary machine waiting states.', 'No cue'],
];
