

export function RailButton({ tone, icon, label, shortcut, active, disabled, onClick }: { tone: string; icon: string; label: string; shortcut?: string; active: boolean; disabled?: boolean; onClick(): void }) { return <button className={`rail-button ${tone}-trigger ${active ? 'active' : ''}`} disabled={disabled} data-tooltip={label} data-tooltip-detail={disabled ? 'Available when the lesson calls for it.' : shortcut ? `${shortcut} · Open ${label}` : `Open ${label}`} onClick={onClick}><i>{icon}</i><span>{label}</span>{shortcut && <kbd>{shortcut}</kbd>}</button>; }
