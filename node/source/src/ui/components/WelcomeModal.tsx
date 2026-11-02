

export function WelcomeModal({ onClose, onTutorials }: { onClose(): void; onTutorials(): void }) {
  return <div className="modal-backdrop welcome-backdrop">
    <section className="welcome-modal glass" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <button className="close-welcome" aria-label="Close welcome" onClick={onClose}>×</button>
      <div className="welcome-art" aria-hidden="true">
        <div className="diagram-node n1">Fe</div><div className="diagram-node n2">E</div><div className="diagram-node n3">S</div><div className="diagram-node n4">Q</div>
        <svg viewBox="0 0 500 280" preserveAspectRatio="none"><path d="M72 194 C150 194 130 86 218 86 S300 194 364 194" /><path d="M218 86 C290 86 272 48 416 48" /></svg><i className="scan-line" />
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
