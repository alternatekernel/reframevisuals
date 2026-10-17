import { boot, expect, test, type Widget } from '../support/fixtures';

const pasteFiles = (widget: Widget, files: Array<{ name: string; type: string }>) =>
  widget.composer.evaluate((el, list) => {
    const data = new DataTransfer();
    for (const file of list) data.items.add(new File([new Uint8Array([137, 80, 78, 71])], file.name, { type: file.type }));
    const event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event.defaultPrevented;
  }, files);

const installFakeSpeech = (page: Widget['page'], mode: 'supported' | 'unsupported' | 'denied') =>
  page.addInitScript(m => {
    const w = window as any;
    delete w.SpeechRecognition;
    delete w.webkitSpeechRecognition;
    if (m === 'unsupported') return;
    w.webkitSpeechRecognition = class {
      onstart: any; onend: any; onerror: any; onresult: any;
      start() { w.__rec = this; this.onstart?.(); }
      stop() { this.onend?.(); }
      abort() {}
    };
    if (m === 'denied') {
      Object.defineProperty(navigator, 'permissions', { value: { query: async () => ({ state: 'denied' }) } });
    }
  }, mode);

test.describe('C. Composer', () => {
  test('C12 Enter sends, Shift+Enter adds a line, IME Enter and blank input never send @mobile', async ({ page, backend, widget }) => {
    await boot(page, backend);
    await widget.open();

    await widget.composer.fill('line one');
    await widget.composer.press('Shift+Enter');
    await widget.composer.pressSequentially('line two');
    await expect(widget.composer).toHaveValue('line one\nline two');

    await widget.composer.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })));
    await widget.composer.fill('   ');
    await widget.composer.press('Enter');
    await expect(widget.sendButton).toBeDisabled();
    expect(backend.callsTo('chat')).toHaveLength(0);

    await widget.composer.fill('real message');
    await widget.composer.press('Enter');
    await expect(widget.bubble('real message')).toBeVisible();
    await expect(widget.composer).toHaveValue('');
    expect(backend.callsTo('chat')).toHaveLength(1);
  });

  test('C13 a second send while one is in flight is ignored and keeps the text', async ({ page, backend, widget }) => {
    backend.fault('chat', { delayMs: 2000 });
    await boot(page, backend);
    await widget.open();
    await widget.send('first');
    await widget.composer.fill('second');
    await widget.composer.press('Enter');
    await expect(widget.sendButton).toBeDisabled();
    await expect(widget.composer).toHaveValue('second');
    await expect(widget.bubble('Answer to: first')).toBeVisible();
    expect(backend.callsTo('chat')).toHaveLength(1);
    await expect(widget.sendButton).toBeEnabled();
  });

  test('C14 slash commands expand to their message', async ({ page, backend, widget }) => {
    await boot(page, backend);
    await widget.open();
    await widget.send('/pricing');
    await expect(widget.bubble('Show me your pricing')).toBeVisible();
    expect(backend.callsTo('chat')[0].body.content).toBe('Show me your pricing');
  });

  test('C15 input grows to 120px then scrolls; collapsed bar stays one line', async ({ page, backend, widget }) => {
    await boot(page, backend);
    await widget.open();
    await widget.composer.fill(Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n'));
    const open = await widget.composer.evaluate(el => ({ h: el.clientHeight, sh: el.scrollHeight, oy: getComputedStyle(el).overflowY }));
    expect(open.h).toBeLessThanOrEqual(122);
    expect(open.sh).toBeGreaterThan(open.h);
    expect(open.oy).toBe('auto');

    await widget.collapse();
    const collapsed = await widget.composer.evaluate(el => el.clientHeight);
    expect(collapsed).toBeLessThanOrEqual(42);
    await expect(widget.root.getByText('Draft', { exact: true })).toBeVisible();
    expect((await widget.root.boundingBox())!.height).toBeLessThanOrEqual(66);
  });

  test('C16 drafts persist across reloads and stay separate per conversation', async ({ page, backend, widget }) => {
    backend.seedConversation('conv-a', [{ role: 'user', content: 'thread A' }], 'Chat A');
    backend.seedConversation('conv-b', [{ role: 'user', content: 'thread B' }], 'Chat B');
    await boot(page, backend);
    await widget.open();
    await widget.type('unsent new-chat draft');
    await page.reload();
    await widget.open();
    await expect(widget.composer).toHaveValue('unsent new-chat draft');

    const chatA = widget.root.getByRole('button', { name: /Chat A/ });
    const chatB = widget.root.getByRole('button', { name: /Chat B/ });
    await chatA.click();
    await expect(widget.bubble('thread A')).toBeVisible();
    await expect(widget.composer).toHaveValue('');
    await widget.type('draft for A');
    await chatB.click();
    await expect(widget.bubble('thread B')).toBeVisible();
    await expect(widget.composer).toHaveValue('');
    await widget.type('draft for B');
    await chatA.click();
    await expect(widget.composer).toHaveValue('draft for A');
    await page.reload();
    await widget.open();
    await expect(widget.composer).toHaveValue('draft for A');
  });

  test('C16 text typed while the first message creates the conversation survives a reload', async ({ page, backend, widget }) => {
    backend.fault('chat', { delayMs: 1500 });
    await boot(page, backend);
    await widget.open();
    await widget.send('first message');
    await widget.type('follow-up I am still writing');
    await expect(widget.bubble('Answer to: first message')).toBeVisible();
    await expect(widget.composer).toHaveValue('follow-up I am still writing');
    await page.reload();
    await widget.open();
    await expect(widget.composer).toHaveValue('follow-up I am still writing');
  });

  test('C17 typing pings are throttled and stop after idle; none without a conversation', async ({ page, backend, widget }) => {
    // Seed the conversation BEFORE boot so it appears in the initial conversations list.
    backend.seedConversation('conv-a', [{ role: 'user', content: 'hi' }], 'Chat A');
    await boot(page, backend);
    await widget.open();
    await widget.composer.pressSequentially('no conversation yet', { delay: 30 });
    await page.waitForTimeout(3000);
    expect(backend.callsTo('typing')).toHaveLength(0);

    await widget.composer.fill('');
    await widget.root.getByRole('button', { name: /Chat A/ }).click();
    await expect(widget.bubble('hi')).toBeVisible();
    backend.resetCalls();
    await widget.composer.pressSequentially('typing for about three seconds..', { delay: 100 });
    const whileTyping = backend.callsTo('typing').filter(c => c.body.isTyping === true);
    expect(whileTyping.length).toBeGreaterThanOrEqual(1);
    expect(whileTyping.length).toBeLessThanOrEqual(3);
    await expect.poll(() => backend.callsTo('typing').filter(c => c.body.isTyping === false).length, { timeout: 5000 }).toBe(1);
  });

  test('C18 pasted images go to chat when open on Chats, to the order flow otherwise', async ({ page, backend, widget }) => {
    await boot(page, backend);
    // While collapsed, paste → opens order flow Files step.
    expect(await pasteFiles(widget, [{ name: 'collapsed.png', type: 'image/png' }])).toBe(true);
    await expect(widget.root.getByRole('heading', { name: 'New order' })).toBeVisible();
    await expect(widget.root.getByRole('button', { name: 'Exit order' }).first()).toBeVisible();
    expect(backend.callsTo('upload')).toHaveLength(0);

    // Exit order and open chat, then paste → uploads to chat.
    await widget.root.getByRole('button', { name: 'Exit order' }).first().click();
    await widget.open();
    await expect(widget.composer).toBeVisible();
    expect(await pasteFiles(widget, [{ name: 'chat.png', type: 'image/png' }])).toBe(true);
    await expect(widget.bubble('Uploaded 1 image(s)')).toBeVisible({ timeout: 15000 });
    await expect.poll(() => backend.callsTo('upload').length, { timeout: 10000 }).toBeGreaterThanOrEqual(1);

    // Plain-text paste is left to the browser.
    expect(await widget.composer.evaluate(el => {
      const data = new DataTransfer();
      data.setData('text/plain', 'hello');
      const event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });
      el.dispatchEvent(event);
      return event.defaultPrevented;
    })).toBe(false);
  });

  test('C19 dictation: transcript fills the composer; aborted is silent', async ({ page, backend, widget }) => {
    await installFakeSpeech(page, 'supported');
    await boot(page, backend);
    await widget.open();
    const mic = widget.root.getByRole('button', { name: 'Voice typing' });
    await mic.click();
    await expect(widget.root.getByRole('button', { name: 'Stop voice typing' })).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => (window as any).__rec.onresult({ results: [[{ transcript: 'price for ' }], [{ transcript: '300 photos' }]] }));
    await expect(widget.composer).toHaveValue('price for 300 photos');
    await page.evaluate(() => { const r = (window as any).__rec; r.onerror({ error: 'aborted' }); });
    await expect(page.locator('[data-modal-root]')).toHaveCount(0);
    await expect(mic).toHaveAttribute('aria-pressed', 'false');

    await mic.click();
    await page.evaluate(() => (window as any).__rec.onerror({ error: 'no-speech' }));
    await expect(page.locator('[data-modal-root]')).toContainText('No speech detected');
  });

  test('C19 dictation: unsupported browser and blocked microphone explain themselves', async ({ page, backend, widget }) => {
    await installFakeSpeech(page, 'unsupported');
    await boot(page, backend);
    await widget.open();
    await widget.root.getByRole('button', { name: 'Voice typing' }).click();
    await expect(page.locator('[data-modal-root]')).toContainText('Not supported');
  });

  test('C19 dictation: denied microphone permission', async ({ page, backend, widget }) => {
    await installFakeSpeech(page, 'denied');
    await boot(page, backend);
    await widget.open();
    await widget.root.getByRole('button', { name: 'Voice typing' }).click();
    await expect(page.locator('[data-modal-root]')).toContainText('Microphone blocked');
  });
});
