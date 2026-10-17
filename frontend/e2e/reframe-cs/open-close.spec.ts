import { boot, expect, test, Widget } from '../support/fixtures';

const recordStateEvents = (page: Widget['page']) => page.evaluate(() => {
  (window as any).__csStates = [];
  window.addEventListener('reframe-cs:state', e => (window as any).__csStates.push((e as CustomEvent).detail.open));
});
const stateEvents = (page: Widget['page']) => page.evaluate(() => (window as any).__csStates as boolean[]);

test.describe('B. Open / close', () => {
  test('B6 opens from the chevron, the bar, and the input, always on Chats @mobile', async ({ page, backend, widget }) => {
    await boot(page, backend);
    await widget.open();
    await expect(widget.root.getByRole('heading', { name: 'Human support' })).toBeVisible();
    await widget.collapse();

    await widget.composer.click();
    await expect(widget.minimize).toBeVisible();
    await widget.collapse();

    await widget.root.getByRole('button', { name: /^(Upload Images|Voice typing)$/ }).first().waitFor();
    await widget.root.click({ position: { x: 300, y: 32 } }).catch(() => widget.composer.click());
    await expect(widget.minimize).toBeVisible();
  });

  test('B7 collapses via minimize, Escape and outside click, broadcasting state each time', async ({ page, backend, widget }) => {
    await boot(page, backend);
    await recordStateEvents(page);

    await widget.open();
    expect(await widget.isOpen()).toBe(true);
    await widget.collapse();
    expect(await widget.isOpen()).toBe(false);

    await widget.open();
    await page.keyboard.press('Escape');
    await expect(widget.minimize).toBeHidden();

    await widget.open();
    await page.mouse.click(10, 400);
    await expect(widget.minimize).toBeHidden();
    expect(await widget.isOpen()).toBe(false);

    expect(await stateEvents(page)).toEqual([true, false, true, false, true, false]);
  });

  test('B7 regression: clicking outside right after opening stays closed', async ({ page, backend, widget }) => {
    await boot(page, backend);
    await widget.open();
    // Within the 250ms window where the input focus is still queued.
    await page.mouse.click(10, 400);
    await page.waitForTimeout(600);
    await expect(widget.minimize).toBeHidden();
    expect(await widget.isOpen()).toBe(false);
  });

  test('B8 Escape closes the message sheet first and leaves the widget open', async ({ page, backend, widget }) => {
    await boot(page, backend);
    await widget.open();
    await widget.send('Right-click me');
    await widget.bubble('Right-click me').click({ button: 'right' });
    const sheet = widget.root.getByRole('menu', { name: 'Message actions' });
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(widget.minimize).toBeVisible();
  });

  test('B8/B9 confirm modal: Escape and clicks inside it never collapse the widget', async ({ page, backend, widget }) => {
    backend.seedConversation('conv-a', [{ role: 'user', content: 'old chat' }], 'Old chat');
    await boot(page, backend);
    await widget.open();
    const row = widget.root.getByRole('listitem').filter({ hasText: 'Old chat' });
    await row.hover();
    await row.getByRole('button', { name: 'Delete chat' }).click();
    const modal = page.locator('[data-modal-root]');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(widget.minimize).toBeVisible();

    if (await modal.isVisible()) {
      await modal.getByRole('button', { name: /cancel/i }).click();
    }
    await expect(modal).toBeHidden();
    await expect(widget.minimize).toBeVisible();
    await expect(row).toBeVisible();
  });

  test('B10 outside click does not close an order in progress', async ({ page, backend, widget }) => {
    await boot(page, backend);
    await widget.open();
    await widget.root.getByRole('button', { name: 'New order' }).click();
    await expect(widget.root.getByRole('heading', { name: 'New order' })).toBeVisible();
    await page.mouse.click(10, 400);
    await expect(widget.minimize).toBeVisible();
    await expect(widget.root.getByRole('heading', { name: 'New order' })).toBeVisible();
  });

  test('B11 reframe-cs:open — default, no-focus, prompt prefill, feedback escalation', async ({ page, backend, widget }) => {
    await boot(page, backend);

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('reframe-cs:open', { detail: { focus: false } })));
    await expect(widget.minimize).toBeVisible();
    await expect(widget.composer).not.toBeFocused();
    await widget.collapse();

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('reframe-cs:open', { detail: { prompt: 'I need 200 edits' } })));
    await expect(widget.composer).toHaveValue('I need 200 edits');
    await widget.collapse();

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('reframe-cs:open', {
      detail: { mode: 'feedback-escalation', pageTitle: 'Pricing', pagePath: '/pricing', issueType: 'bug' },
    })));
    await expect(widget.bubble(/Context: Pricing \(\/pricing\)/)).toBeVisible();
    await expect(widget.bubble(/Issue type: bug/)).toBeVisible();
    for (const label of ['Bug report', 'Feature request', 'General question']) {
      await expect(widget.log.getByRole('button', { name: label })).toBeVisible();
    }
    // The escalation clears any half-typed draft rather than mixing it into the report.
    await expect(widget.composer).toHaveValue('');
  });

  test('B11 the embedded showcase ignores reframe-cs:open', async ({ page, backend }) => {
    await boot(page, backend, { path: '/' });
    const showcase = new Widget(page, 'embedded');
    await showcase.root.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('reframe-cs:open', { detail: { prompt: 'only floating' } })));
    await expect(showcase.composer).toHaveValue('');
  });
});
