import { useEffect, useRef, useState } from 'react';
import type { GameEngine } from '../../simulation/engine';
import { BOT_UPGRADES, STAGES, botUpgradeBenefits } from '../../content/botUpgrades';

function completionCopy(id?: string) {
  const index = BOT_UPGRADES.findIndex(upgrade => upgrade.id === id);
  if (index < 0) return undefined;
  const upgrade = BOT_UPGRADES[index];
  return { id: upgrade.id, label: `${upgrade.label} complete`,
    message: `${STAGES[index + 1].role}. ${botUpgradeBenefits(upgrade.id, true)}` };
}

/** Live completions only; stage/save loads do not replay old promotions. */
export function UpgradeCompletionNotice({ engine, previewCompletion }: { engine: GameEngine; previewCompletion?: string }) {
  const [notice, setNotice] = useState<ReturnType<typeof completionCopy>>();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dismiss = () => { clearTimeout(timer.current); setNotice(undefined); };
  useEffect(() => {
    clearTimeout(timer.current);
    setNotice(undefined);
    const seen = new Set(engine.getState().research.completed);
    const show = (id?: string) => {
      const next = completionCopy(id);
      if (!next) return;
      clearTimeout(timer.current);
      setNotice(next);
      timer.current = setTimeout(() => setNotice(undefined), 4500);
    };
    // The explicit external completion fixture can preview the same notice.
    if (previewCompletion) show(previewCompletion);
    const unsubscribe = engine.subscribe(() => {
      const completed = engine.getState().research.completed;
      const fresh = BOT_UPGRADES.filter(upgrade => completed.includes(upgrade.id) && !seen.has(upgrade.id));
      fresh.forEach(upgrade => seen.add(upgrade.id));
      if (fresh.length) show(fresh.at(-1)!.id);
    });
    return () => { unsubscribe(); clearTimeout(timer.current); };
  }, [engine, previewCompletion]);
  return <div className="notification-stack upgrade-completion-stack" role="status" aria-label="Upgrade completion notice" aria-live="polite" aria-atomic="true">
    {notice && <article key={notice.id} className="notification research upgrade-completion-notice" data-upgrade-completion={notice.id}>
      <i aria-hidden="true">⌁</i><div className="notification-content"><small>{notice.label}</small><b>{notice.message}</b></div>
      <button type="button" aria-label="Dismiss upgrade notification" onClick={dismiss}>×</button><span aria-hidden="true" />
    </article>}
  </div>;
}
