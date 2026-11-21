import { useEffect, useState } from 'react';
import { STAGES } from '../../src/content/botUpgrades';
import { RobotAssemblyArt } from '../../src/ui/upgrades/RobotPortrait';
import { ROBOT_ASSEMBLIES } from '../../src/ui/upgrades/robotAssembly';

function AssemblyExample({ tier, replay }: { tier: number; replay: number }) {
  const [paid, setPaid] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { if (replay) { setPaid(0); setPlaying(true); } }, [replay]);
  useEffect(() => {
    if (!playing) return;
    if (paid >= 5) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setPaid(value => value + 1), 2400);
    return () => window.clearTimeout(timer);
  }, [playing, paid]);
  const previous = STAGES[tier - 1], next = STAGES[tier];
  return <article className="robot-animation-example" data-animation-tier={tier}>
    <div className="tier-art-heading"><span>{previous.label} → {next.label}</span><h2>{next.module}</h2></div>
    <RobotAssemblyArt tier={tier - 1} progress={paid / 5} processingProgress={playing && paid < 5 ? (paid + 1) / 5 : undefined} label={`${previous.role} to ${next.role}; ${paid} of 5 Core sets paid${playing && paid < 5 ? '; next Core set processing' : ''}`} />
    <h3>{next.role}</h3><p>{ROBOT_ASSEMBLIES[tier - 1].description}</p>
    <label className="robot-payment-scrubber">Paid Core sets <output>{paid}/5</output><input aria-label={`${next.module} paid Core sets`} type="range" min="0" max="5" step="1" value={paid} onChange={event => { setPlaying(false); setPaid(Number(event.target.value)); }} /></label>
    <div className="robot-animation-actions"><button onClick={() => { if (paid === 5) setPaid(0); setPlaying(value => !value); }}>{playing ? 'Pause preview' : paid === 5 ? 'Replay upgrade' : 'Play upgrade'}</button><button onClick={() => { setPlaying(false); setPaid(0); }}>Reset</button></div>
  </article>;
}

export function RobotAnimationGallery() {
  const [replay, setReplay] = useState(0);
  return <section className="tier-art-page" aria-labelledby="animation-title">
    <header><small>Character development</small><h1 id="animation-title">Some assembly required.</h1>
      <p>The next robot parts flash while a Core set processes, then settle when it is consumed. The fifth set finishes the existing tier artwork.</p>
      <p>Preview processing takes 2.4 seconds per set.</p>
      <p>These controls preview payments only. They do not spend Cores or change your factory.</p>
      <button onClick={() => setReplay(value => value + 1)}>Play all seven upgrades</button></header>
    <div className="tier-art-grid robot-animation-grid">{STAGES.slice(1).map((stage, index) => <AssemblyExample key={stage.label} tier={index + 1} replay={replay} />)}</div>
  </section>;
}
