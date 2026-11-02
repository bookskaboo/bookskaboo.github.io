import { NodeIcon } from './NodeIcon';
import { TUTORIAL_NAMES } from '../tutorials/tutorialRuntime';
import type { ProgressiveTutorialKind } from '../tutorials/tutorialUnlocks';

export function TutorialUnlockInvitation({ kind, onStart, onLater }: { kind: ProgressiveTutorialKind; onStart(): void; onLater(): void }) {
  const expansion = kind === 'expansion';
  const name = TUTORIAL_NAMES[kind];
  return <div className="modal-backdrop tutorial-unlock-backdrop">
    <section className="modal glass tutorial-unlock-modal" role="dialog" aria-modal="true" aria-labelledby="tutorial-unlock-title">
      <header className="panel-header"><div><small>TUTORIAL UNLOCKED · {expansion ? 'EXPLORATION' : 'MONSTER CAMP'}</small><h2 id="tutorial-unlock-title">{expansion ? 'The world has more factory space.' : 'The neighbors have objections.'}</h2></div><button onClick={onLater} aria-label={`Dismiss ${name} tutorial invitation`}>×</button></header>
      <div className="tutorial-unlock-copy"><span className="tutorial-unlock-icon"><NodeIcon kind={expansion ? 'road' : 'monster-camp'} /></span>
        <p>{expansion ? 'Exploration unlocked the Node Map and your first Map Point. Apparently, one map was not enough responsibility.' : 'Your new map comes with a Monster Camp. Apparently, the land was already under management.'}</p>
        {expansion ? <p>The <b>Expansion tutorial</b> shows you how to activate the map left of Home, travel between maps, and send Wood home through a Road pair. Materials travel right. Ambition remains unsupervised.</p>
          : <p>The <b>Monster Camps tutorial</b> covers camp borders, Suppression Bots, and the regular Attack Power check. Bring enough bots. A strongly worded cable is insufficient.</p>}
        <small>Practice in a separate factory. Your current factory keeps its progress and its dignity.</small>
      </div>
      <footer className="tutorial-unlock-actions"><button onClick={onLater}>Maybe later</button><button className="primary-cta" onClick={onStart} autoFocus>Start {name} <span aria-hidden="true">→</span></button></footer>
      <p className="tutorial-unlock-reminder">You can return through Options → Tutorials. {expansion ? 'The extra land will wait.' : 'The neighbors can wait.'}</p>
    </section>
  </div>;
}
