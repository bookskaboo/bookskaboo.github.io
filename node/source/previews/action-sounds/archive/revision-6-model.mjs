// Proposal only. These IDs are audition assets, not game/save event IDs.
export const PALETTE = { key: 'F major', register: 'C2–C4', revision: 6 };
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
  {id:'select',name:'Select',harmony:'Single F-major chord',description:'F3–A3–C4 struck together once.',duration:.16,voices:[v(0,.13,'F3',.04),v(0,.13,'A3',.035),v(0,.13,'C4',.03)]},
  {id:'panel',name:'Open panel',harmony:'B-flat major, two-note rise',description:'B-flat2–D3, two short rising notes.',duration:.28,voices:[v(0,.14,'Bb2',.055),v(.07,.16,'D3',.05)]},
  {id:'place',name:'Place node',harmony:'F major, three-note rise',description:'F2–C3–A3, three soft, clearly spaced notes.',duration:.4,voices:[v(0,.14,'F2',.035),v(.085,.14,'C3',.035),v(.17,.18,'A3',.035)]},
  {id:'move',name:'Finish moving',harmony:'Single low F-major chord',description:'F2–A2–C3 struck together once, a low settling chord.',duration:.24,voices:[v(0,.18,'F2',.045),v(0,.18,'A2',.035),v(0,.18,'C3',.03)]},
  {id:'connect',name:'Connect cable',harmony:'G minor → C major',description:'A short ii–V answer, with G and E coming forward.',duration:.32,voices:[...chord(0,.11,['G2','Bb2','D3'],.035),...chord(.13,.16,['C3','E3','G3'],.045)]},
  {id:'disconnect',name:'Disconnect cable',harmony:'Low E diminished, falling',description:'B-flat2–G2–E2, a descent one octave lower.',duration:.3,voices:[v(0,.12,'Bb2',.06),v(.06,.13,'G2',.055),v(.12,.15,'E2',.06)]},
  {id:'delete',name:'Remove nodes',harmony:'D minor, three-note fall',description:'A3–F3–D3, three descending notes.',duration:.3,voices:[v(0,.13,'A3',.055),v(.06,.14,'F3',.055),v(.12,.15,'D3',.06)]},
  {id:'configure',name:'Apply configuration',harmony:'Open A minor 7 over E',description:'E2–A2–C3–G3, a wide, low arpeggio.',duration:.36,voices:[v(0,.15,'E2',.065),v(.045,.15,'A2',.055),v(.09,.15,'C3',.05),v(.135,.16,'G3',.055)]},
  {id:'queue',name:'Queue project',harmony:'Quiet G minor',description:'G2–B-flat2–D3, a quiet, compact rising phrase.',duration:.28,voices:[v(0,.13,'G2',.038),v(.045,.13,'Bb2',.032),v(.09,.15,'D3',.035)]},
  {id:'pause',name:'Pause',harmony:'D minor, falling wide',description:'A3–F3–D2, settling into the bass.',duration:.36,voices:[v(0,.16,'A3',.06),v(.08,.16,'F3',.06),v(.16,.17,'D2',.07)]},
  {id:'resume',name:'Resume',harmony:'C major over E, rising',description:'E2–G2–C3, a low, clear upward answer.',duration:.36,voices:[v(0,.16,'E2',.07),v(.08,.16,'G2',.065),v(.16,.17,'C3',.065)]},
  {id:'complete',name:'Research complete',harmony:'C major → rising run → sustained F major',description:'A low ta-da with an E3–F3–G3–A3 run into the held F-major chord.',duration:1.62,voices:[...chord(0,.1,['C3','E3','G3'],.04),v(.13,.11,'E3',.04),v(.2,.11,'F3',.04),v(.27,.11,'G3',.04),v(.34,.11,'A3',.04),v(.46,1.1,'F3',.065),v(.46,1.1,'A3',.055),v(.46,1.1,'C4',.045)]},
  {id:'upgrade',name:'Character upgrade',harmony:'B-flat major 7 → A minor 7 → descending run → D minor 7',description:'Two rising arpeggios, then A3–G3–F3–E3 into a low D-minor finish.',duration:1.5,voices:[v(0,.16,'Bb2',.05),v(.07,.16,'D3',.045),v(.14,.16,'F3',.04),v(.21,.16,'A3',.04),v(.35,.14,'A2',.035),v(.42,.14,'C3',.035),v(.49,.14,'E3',.035),v(.56,.14,'G3',.035),v(.7,.12,'A3',.04),v(.77,.12,'G3',.04),v(.84,.12,'F3',.04),v(.91,.12,'E3',.04),v(1.05,.4,'D2',.06),v(1.05,.4,'F3',.045),v(1.05,.4,'C4',.035)]},
  {id:'unlock',name:'Activate Map Node',harmony:'Open B-flat major 9',description:'B-flat2–D3–A3–C4, an open major-ninth color.',duration:.46,voices:[v(0,.28,'Bb2',.055),v(.045,.28,'D3',.045),v(.09,.28,'A3',.04),v(.135,.28,'C4',.035)]},
  {id:'travel',name:'Travel',harmony:'G minor 7 staircase',description:'F2–G2–B-flat2–D3, stepping outward from the tonic.',duration:.44,voices:[v(0,.14,'F2',.06),v(.075,.14,'G2',.06),v(.15,.14,'Bb2',.06),v(.225,.17,'D3',.075)]},
  {id:'save',name:'Manual save complete',harmony:'C major, closing downward',description:'C4–G3–E3–C2, a brief close into the bass.',duration:.34,voices:[v(0,.12,'C4',.05),v(.05,.12,'G3',.05),v(.1,.13,'E3',.055),v(.15,.15,'C2',.065)]},
  {id:'reject',name:'Action unavailable',harmony:'Low F tonic',description:'One low F2 strike; informative rather than scolding.',duration:.16,voices:[v(0,.14,'F2',.12)]},
  {id:'attention',name:'Attention',harmony:'E half-diminished 7, upper answer',description:'E3–G3–B-flat3–D3, then G3–B-flat3 calling again.',duration:.58,voices:[...chord(0,.12,['E3','G3','Bb3','D3'],.03),...chord(.29,.24,['G3','Bb3'],.055)]},
  {id:'victory',name:'Victory',harmony:'F → B-flat → C7 → sustained F, with connecting runs',description:'An I–IV–V7–I cadence with three-note runs between chords and a held finish. Paperwork complete.',duration:2.5,voices:[...chord(0,.3,['F2','A2','C3'],.04),v(.14,.12,'A2',.03),v(.23,.12,'C3',.03),v(.32,.12,'D3',.03),...chord(.44,.3,['Bb2','D3','F3'],.035),v(.58,.12,'F3',.03),v(.67,.12,'G3',.03),v(.76,.12,'A3',.03),...chord(.9,.3,['C3','E3','Bb3'],.035),v(1.04,.12,'G3',.03),v(1.13,.12,'E3',.03),v(1.22,.12,'C3',.03),...chord(1.38,1.05,['F3','A3','C4'],.055)]},
];
// The optional comparison moves the selection chord down one octave.
export const variants = [
  {id:'select-low',baseId:'select',name:'Select — lower pitch',harmony:'Single low F-major chord',description:'F2–A2–C3 struck together once; one octave lower.',duration:.16,voices:[v(0,.13,'F2',.04),v(0,.13,'A2',.035),v(0,.13,'C3',.03)]},
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
