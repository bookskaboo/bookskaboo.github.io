

export function ConfirmModal({ title, body, confirm, onCancel, onConfirm }: { title: string; body: string; confirm: string; onCancel(): void; onConfirm(): void }) { return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="confirm-modal glass"><span className="warning-icon">!</span><h2>{title}</h2><p>{body}</p><div><button onClick={onCancel}>CANCEL</button><button className="danger-button" onClick={onConfirm}>{confirm}</button></div></section></div>; }
