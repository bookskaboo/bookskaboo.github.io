import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function UiTooltipLayer() {
  const [tip, setTip] = useState<{ title: string; detail?: string; flavor?: string; tone?: string; x: number; y: number }>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!tip || !tooltipRef.current) return;
    const height = tooltipRef.current.getBoundingClientRect().height;
    const y = Math.max(8, Math.min(tip.y, window.innerHeight - height - 8));
    if (y !== tip.y) setTip(current => current ? { ...current, y } : current);
  }, [tip]);
  const targetRef = useRef<HTMLElement | null>(null); const visibleTargetRef = useRef<HTMLElement | null>(null); const timerRef = useRef<number | null>(null); const pointRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const clear = () => { if (timerRef.current) window.clearTimeout(timerRef.current); timerRef.current = null; targetRef.current = null; visibleTargetRef.current = null; setTip(undefined); };
    const begin = (target: HTMLElement, x: number, y: number, immediate = false) => {
      pointRef.current = { x, y };
      if (targetRef.current === target) { if (visibleTargetRef.current === target) setTip((current) => current ? { ...current, x: Math.max(8, Math.min(window.innerWidth - 286, x + 15)), y: Math.max(8, Math.min(window.innerHeight - 100, y + 17)) } : current); return; }
      if (timerRef.current) window.clearTimeout(timerRef.current);
      targetRef.current = target; visibleTargetRef.current = null; setTip(undefined);
      const reveal = () => { if (targetRef.current !== target || !target.isConnected) return; visibleTargetRef.current = target; const point = pointRef.current; const tone = target.dataset.tooltipTone ?? getComputedStyle(target).getPropertyValue('--tooltip-tone').trim(); setTip({ title: target.dataset.tooltip ?? '', detail: target.dataset.tooltipDetail, flavor: target.dataset.tooltipFlavor, tone: tone || undefined, x: Math.max(8, Math.min(window.innerWidth - 286, point.x + 15)), y: Math.max(8, Math.min(window.innerHeight - 132, point.y + 17)) }); };
      if (immediate) reveal(); else timerRef.current = window.setTimeout(reveal, Number(target.dataset.tooltipDelay ?? 260));
    };
    const tooltipTarget = (value: EventTarget | null) => value instanceof Element ? value.closest<HTMLElement>('[data-tooltip]') : null;
    const over = (event: PointerEvent) => { const target = tooltipTarget(event.target); if (target) begin(target, event.clientX, event.clientY); else clear(); };
    const move = (event: PointerEvent) => { const target = tooltipTarget(event.target); if (target) begin(target, event.clientX, event.clientY); else clear(); };
    const out = (event: PointerEvent) => { const target = tooltipTarget(event.target); if (!target) return; const related = event.relatedTarget; if (related instanceof Node && target.contains(related)) return; if (targetRef.current === target) clear(); };
    const focus = (event: FocusEvent) => { const target = tooltipTarget(event.target); if (!target) return; const rect = target.getBoundingClientRect(); begin(target, rect.left + rect.width / 2, rect.bottom, true); };
    const blur = (event: FocusEvent) => { const target = tooltipTarget(event.target); if (target && targetRef.current === target) clear(); };
    const observer = new MutationObserver(() => { if (targetRef.current && !targetRef.current.isConnected) clear(); });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('keydown', clear);
    document.addEventListener('pointerover', over); document.addEventListener('pointermove', move); document.addEventListener('pointerout', out); document.addEventListener('focusin', focus); document.addEventListener('focusout', blur);
    return () => { observer.disconnect(); document.removeEventListener('keydown', clear); if (timerRef.current) window.clearTimeout(timerRef.current); document.removeEventListener('pointerover', over); document.removeEventListener('pointermove', move); document.removeEventListener('pointerout', out); document.removeEventListener('focusin', focus); document.removeEventListener('focusout', blur); };
  }, []);
  return tip ? <div ref={tooltipRef} className="ui-hover-tooltip" role="tooltip" style={{ left: tip.x, top: tip.y, '--tooltip-tone': tip.tone || '#87939b' } as React.CSSProperties}>{tip.title && <b>{tip.title}</b>}{tip.detail && <span>{tip.detail}</span>}{tip.flavor && <em>{tip.flavor}</em>}</div> : null;
}
