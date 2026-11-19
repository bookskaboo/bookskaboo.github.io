import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BOT_BUILDS, BOT_FRAMES, BOT_GUNS, type BotFrame, type BotGun } from '../../src/content/botAssembly';
import { ITEM_NAMES } from '../../src/content/items';
import { BotPlantPanel } from '../../src/ui/BotPlantPanel';
import { NodeIcon } from '../../src/ui/NodeIcon';
import '../../src/styles.css';
import './preview.css';

type Supply = { frame: BotFrame | ''; gun: BotGun | '' };

const presets: { label: string; supply: Supply }[] = [
  { label: 'Empty', supply: { frame: '', gun: '' } },
  { label: 'Basic pair', supply: { frame: BOT_FRAMES[0], gun: BOT_GUNS[0] } },
  { label: 'Final pair', supply: { frame: BOT_FRAMES[4], gun: BOT_GUNS[4] } },
];

function BotPlantPreview() {
  const [supply, setSupply] = useState<Supply>(presets[0].supply);
  const [open, setOpen] = useState(true);
  const build = BOT_BUILDS.find(({ frame, gun }) => frame === supply.frame && gun === supply.gun);

  return <main className="bot-preview">
    <h1>Bot Plant test page</h1>
    <div className="preview-layout">
      <section className="preview-field" aria-label="Bot Plant preview">
        {open ? <BotPlantPanel frame={supply.frame || undefined} gun={supply.gun || undefined} attackPower={build?.ap} onClose={() => setOpen(false)} />
          : <button type="button" className="preview-button open-plant" onClick={() => setOpen(true)}><NodeIcon kind="botPlant" /> Open Bot Plant</button>}
      </section>
      <section className="preview-controls" aria-labelledby="controls-title">
        <h2 id="controls-title">Test controls</h2>
        <div className="preview-supply">
          <label htmlFor="frame-supply">Frame supply</label>
          <select id="frame-supply" value={supply.frame} onChange={event => setSupply({ ...supply, frame: event.target.value as Supply['frame'] })}>
            <option value="">Empty</option>
            {BOT_FRAMES.map(frame => <option key={frame} value={frame}>{ITEM_NAMES[frame]}</option>)}
          </select>
        </div>
        <div className="preview-supply">
          <label htmlFor="gun-supply">Gun supply</label>
          <select id="gun-supply" value={supply.gun} onChange={event => setSupply({ ...supply, gun: event.target.value as Supply['gun'] })}>
            <option value="">Empty</option>
            {BOT_GUNS.map(gun => <option key={gun} value={gun}>{ITEM_NAMES[gun]}</option>)}
          </select>
        </div>
        <div className="preview-presets" aria-label="Supply presets">
          {presets.map(preset => <button type="button" className="preview-button" key={preset.label}
            aria-pressed={supply.frame === preset.supply.frame && supply.gun === preset.supply.gun}
            onClick={() => { setSupply(preset.supply); setOpen(true); }}>{preset.label}</button>)}
        </div>
      </section>
    </div>
  </main>;
}

createRoot(document.getElementById('root')!).render(<BotPlantPreview />);
