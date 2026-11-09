import type { ReactNode } from 'react';

export function PanelHeader({ eyebrow, title, actions, onClose }: { eyebrow?: string; title: string; actions?: ReactNode; onClose(): void }) {
  return (
    <div className="panel-header">
      <div>{eyebrow && <small>{eyebrow}</small>}<h2>{title}</h2></div>
      {actions && <div className="panel-header-actions">{actions}</div>}
      <button
        onClick={onClose} aria-label={`Close ${title}`}
        data-tooltip="Close panel" data-tooltip-detail="Escape also closes open panels."
      >
        ×
      </button>
    </div>
  );
}
