import { boot, CUSTOMER, expect, seed, test, Widget } from '../support/fixtures';

const pointerEvents = (widget: Widget) => widget.root.evaluate(el => (el as HTMLElement).style.pointerEvents);

/** Records, inside the page, how long after mounting the launcher became interactive. */
const recordEntrance = (page: Widget['page']) => page.addInitScript(() => {
  const marks: { mounted?: number; shown?: number } = {};
  (window as any).__entrance = marks;
  const check = () => {
    const el = document.querySelector('[role="dialog"][aria-label="Reframe CS support chat"]') as HTMLElement | null;
    if (!el) return;
    marks.mounted ??= performance.now();
    if (el.style.pointerEvents === 'auto') marks.shown ??= performance.now();
  };
  new MutationObserver(check).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
});
const entranceDelay = async (page: Widget['page']) => {
  await expect.poll(() => page.evaluate(() => (window as any).__entrance?.shown), { timeout: 5000 }).toBeTruthy();
  return page.evaluate(() => (window as any).__entrance.shown - (window as any).__entrance.mounted);
};

test.describe('A. Launcher & presence', () => {
  test('A1 first visit waits for the entrance delay; repeat visits appear fast', async ({ page, backend }) => {
    await recordEntrance(page);
    await seed(page, backend, { skipIntro: false });
    await page.goto('/pricing');
    expect(await entranceDelay(page)).toBeGreaterThan(1200);
    expect(await page.evaluate(() => sessionStorage.getItem('reframe_cs_intro_seen'))).toBe('1');

    await page.reload();
    expect(await entranceDelay(page)).toBeLessThan(800);
  });

  test('A1 reduced motion shows the launcher immediately', async ({ page, backend }) => {
    await recordEntrance(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seed(page, backend, { skipIntro: false });
    await page.goto('/pricing');
    expect(await entranceDelay(page)).toBeLessThan(300);
  });

  test('A2 idle prompt rotates on the collapsed bar @mobile', async ({ page, backend, widget }) => {
    await page.clock.install();
    await boot(page, backend);
    const isPhone = (page.viewportSize()?.width ?? 1280) < 768;
    const first = isPhone ? 'Ask anything about our editing services.' : 'Ask Reframe CS.';
    const second = isPhone ? 'How much for 500 product photos?' : 'Need pricing or turnaround?';
    await expect(widget.root.getByText(first, { exact: true })).toBeVisible();
    await page.clock.fastForward(5500);
    await expect(widget.root.getByText(second, { exact: true })).toBeVisible();
  });

  test('A3 nothing renders or polls on admin routes', async ({ page, backend }) => {
    await seed(page, backend, { local: { reframe_cs_conv_id: 'conv-a' } });
    backend.seedConversation('conv-a', [{ role: 'user', content: 'hi' }]);
    await page.goto('/admin');
    await page.waitForTimeout(2500);
    await expect(page.getByRole('dialog', { name: 'Reframe CS support chat' })).toHaveCount(0);
    expect(backend.callsTo('presence')).toHaveLength(0);
    expect(backend.callsTo('conversation')).toHaveLength(0);
    expect(backend.callsTo('realtime')).toHaveLength(0);
  });

  test('A4 launcher hands off to the landing-page showcase and comes back', async ({ page, backend, widget }) => {
    await boot(page, backend, { path: '/' });
    const showcase = new Widget(page, 'embedded');
    await showcase.root.scrollIntoViewIfNeeded();
    await expect.poll(() => pointerEvents(widget)).toBe('none');
    await expect(widget.root).toHaveCSS('opacity', '0');

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => pointerEvents(widget)).toBe('auto');
    await expect(widget.root).toHaveClass(/ring-4/);
    await expect(widget.root).toHaveCSS('opacity', '1');
  });

  test('A5 embedded showcase never acts like the floating launcher', async ({ page, backend }) => {
    await seed(page, backend, { signedIn: CUSTOMER });
    // Baseline: pings from the floating launcher alone (dev StrictMode may double effects).
    await page.goto('/pricing');
    await page.waitForTimeout(1500);
    const floatingOnly = backend.callsTo('presence').length;
    backend.resetCalls();

    await page.goto('/');
    const showcase = new Widget(page, 'embedded');
    await showcase.root.scrollIntoViewIfNeeded();
    await expect(showcase.composer).toBeVisible();
    const titleBefore = await page.title();

    await expect(showcase.root.getByRole('button', { name: 'Minimize Reframe CS' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 300);
    await expect(showcase.composer).toBeVisible();
    await expect(showcase.log).toBeVisible();
    expect(await page.locator('body').getAttribute('data-reframe-cs-open')).toBeNull();
    expect(await page.title()).toBe(titleBefore);
    // The embedded instance adds no presence pings of its own.
    expect(backend.callsTo('presence')).toHaveLength(floatingOnly);
  });
});
