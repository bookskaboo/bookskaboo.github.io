import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Dialog } from './Dialog';
import { ConfirmModal } from './ConfirmModal';

describe('shared dialog semantics', () => {
  it('labels an active dialog and gives its empty state a keyboard focus fallback', () => {
    const html = renderToStaticMarkup(<Dialog aria-label="Options" onDismiss={() => {}}>Content</Dialog>);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Options"');
    expect(html).toContain('tabindex="-1"');
  });
  it('keeps guided practice nonmodal and collapsed maps outside the dialog registry', () => {
    expect(renderToStaticMarkup(<Dialog modal={false} onDismiss={() => {}} />)).not.toContain('aria-modal');
    const collapsed = renderToStaticMarkup(<Dialog as="aside" active={false} onDismiss={() => {}} />);
    expect(collapsed).toBe('<aside></aside>');
  });
  it('applies the same named dialog boundary to nested destructive confirmations', () => {
    const html = renderToStaticMarkup(<ConfirmModal title="Load imported save?" body="Replace this factory?" confirm="LOAD SAVE" onCancel={() => {}} onConfirm={() => {}} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Load imported save?"');
    expect(html.indexOf('CANCEL')).toBeLessThan(html.indexOf('LOAD SAVE'));
  });
});
