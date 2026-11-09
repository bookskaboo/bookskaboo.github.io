import { LINE_ART } from '../../art/lineArt';

const DIAGRAM_NODES = [
  { icon: 'tree', name: 'Harvest', x: 79, y: 106, color: '#92b991' },
  { icon: 'pickaxe', name: 'Build', x: 210, y: 190, color: '#b7c6cb' },
  { icon: 'flame', name: 'Science', x: 341, y: 274, color: '#d4b87c' },
] as const;

export function WelcomeModal({ onClose, onTutorials }: { onClose(): void; onTutorials(): void }) {
  return <div className="modal-backdrop welcome-backdrop">
    <section className="welcome-modal glass" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <button className="close-welcome" aria-label="Close welcome" onClick={onClose}>×</button>
      <div className="welcome-art" aria-hidden="true">
        <svg viewBox="0 0 420 380" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path className="welcome-cable" d="M117 106C157 106 132 190 172 190 M248 190C288 190 263 274 303 274" />
          {DIAGRAM_NODES.map(({ icon, name, x, y, color }, index) =>
            <g key={icon} transform={`translate(${x} ${y})`} color={color}>
              <rect className="welcome-node-body" x="-38" y="-34" width="76" height="68" rx="10" />
              <path className="welcome-node-icon" transform="translate(-15 -15) scale(1.25)" d={LINE_ART[icon]} />
              <text className="welcome-node-label" y="55">{name}</text>
              {index === 0 ? <path className="welcome-wood-socket" d="M38 -8L40 -3L45 -5L43 0L45 5L40 3L38 8L36 3L31 5L33 0L31 -5L36 -3Z" />
                : <circle className="welcome-wood-socket" cx="-38" r="5" />}
              {index === 1 && <circle className="welcome-wood-socket" cx="38" r="5" />}
              {index === 2 && <circle className="welcome-charcoal-socket" cx="38" r="5" />}
            </g>)}
        </svg>
      </div>
      <div className="welcome-copy">
        <h1 id="welcome-title">NODE<span>Another Factory Game</span></h1>
        <p>Build a factory. Duh.</p>
        <div className="welcome-points">
          <span><b>Build</b><small>Place a machine. It will need somewhere to stand.</small></span>
          <span><b>Connect</b><small>Connect inputs to outputs. They need it spelled out.</small></span>
          <span><b>Research</b><small>Make Cores. Science prefers payment in advance.</small></span>
        </div>
        <div className="welcome-actions">
          <button className="primary-cta" onClick={onTutorials}>Tutorials <span aria-hidden="true">→</span></button>
          <button className="primary-cta" onClick={onClose}>Play <span aria-hidden="true">→</span></button>
        </div>
        <small className="privacy-note">Progress stays in this browser. The cloud has enough on its plate.</small>
      </div>
    </section>
  </div>;
}
