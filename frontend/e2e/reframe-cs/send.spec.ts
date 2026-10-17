import { boot, expect, test } from '../support/fixtures';

const LOCAL_FALLBACK = /I can help with/;

test.describe('D. Sending & replies', () => {
  test('D20 the instant local answer is replaced in place by the server reply @mobile', async ({ page, backend, widget }) => {
    backend.fault('chat', { delayMs: 1500 });
    await boot(page, backend);
    await widget.open();
    await widget.send('zebra question');
    await expect(widget.log.getByText(LOCAL_FALLBACK)).toBeVisible();
    // Once the server replies the local placeholder must disappear and the server reply appear.
    await expect(widget.bubble('Answer to: zebra question')).toBeVisible();
    await expect(widget.log.getByText(LOCAL_FALLBACK)).toHaveCount(0);
    // A timestamp should be shown for the reply.
    await expect(widget.log.getByText(/^\d{1,2}:\d{2}/).last()).toBeVisible();
  });

  test('D21 awaitingHuman drops the local answer and shows the server thread', async ({ page, backend, widget }) => {
    backend.chatReply = () => ({ awaitingHuman: true });
    await boot(page, backend);
    await widget.open();
    await widget.send('zebra question');
    await expect(widget.bubble('zebra question')).toBeVisible();
    await expect(widget.log.getByText(LOCAL_FALLBACK)).toHaveCount(0);
    expect(backend.callsTo('conversation').length).toBeGreaterThan(0);
  });

  for (const [label, fault, reply] of [
    ['server error', { status: 500 }, null],
    ['network failure', { abort: true }, null],
    ['empty reply', null, { message: { id: 9, role: 'assistant', content: '' } }],
  ] as const) {
    test(`D22 ${label}: message marked undelivered, local answer kept, retry works`, async ({ page, backend, widget }) => {
      if (fault) backend.fault('chat', { ...fault, times: 1 });
      const realReply = backend.chatReply;
      if (reply) backend.chatReply = () => reply as any;
      await boot(page, backend);
      await widget.open();
      await widget.send('zebra question');
      const retry = widget.root.getByRole('button', { name: /Not delivered · Retry/ });
      await expect(retry).toBeVisible();
      await expect(widget.log.getByText(LOCAL_FALLBACK)).toBeVisible();

      backend.chatReply = realReply;
      await retry.click();
      await expect(widget.bubble('Answer to: zebra question')).toBeVisible();
      await expect(retry).toHaveCount(0);
      await expect(widget.bubble('zebra question')).toHaveCount(1);
      await expect(widget.log.getByText(LOCAL_FALLBACK)).toHaveCount(0);
    });
  }

  test('D22 an undelivered message and its local answer are not restored after reload', async ({ page, backend, widget }) => {
    backend.fault('chat', { status: 500 });
    await boot(page, backend);
    await widget.open();
    await widget.send('zebra question');
    await expect(widget.root.getByRole('button', { name: /Not delivered/ })).toBeVisible();
    await page.reload();
    await widget.open();
    await expect(widget.bubble('zebra question')).toHaveCount(0);
    await expect(widget.log.getByText(LOCAL_FALLBACK)).toHaveCount(0);
    await expect(widget.log.getByText('How can I help?')).toBeVisible();
  });

  test('D23 a failed message stays in its own conversation', async ({ page, backend, widget }) => {
    backend.seedConversation('conv-a', [{ role: 'user', content: 'thread A' }], 'Chat A');
    backend.seedConversation('conv-b', [{ role: 'user', content: 'thread B' }], 'Chat B');
    await boot(page, backend);
    await widget.open();
    await widget.root.getByRole('button', { name: /Chat A/ }).click();
    await expect(widget.bubble('thread A')).toBeVisible();
    backend.fault('chat', { status: 500 });
    await widget.send('lost in A');
    await expect(widget.root.getByRole('button', { name: /Not delivered/ })).toBeVisible();

    await widget.root.getByRole('button', { name: /Chat B/ }).click();
    await expect(widget.bubble('thread B')).toBeVisible();
    await expect(widget.bubble('lost in A')).toHaveCount(0);
    await widget.root.getByRole('button', { name: 'New chat' }).click();
    await expect(widget.bubble('lost in A')).toHaveCount(0);
  });

  test('D24 the first message creates a conversation and lists it', async ({ page, backend, widget }) => {
    await boot(page, backend);
    await widget.open();
    const listCallsBefore = backend.callsTo('conversations').length;
    await widget.send('start a thread');
    await expect(widget.bubble('Answer to: start a thread')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('reframe_cs_conv_id'))).toBe('conv-1');
    await expect.poll(() => backend.callsTo('conversations').length).toBeGreaterThan(listCallsBefore);
    await expect(widget.root.getByRole('heading', { name: 'New conversation' })).toBeVisible();
    await expect(widget.root.getByRole('button', { name: /New conversation/ })).toHaveAttribute('aria-current', 'true');
  });

  test('D25 handoff offer escalates to a human; a failed escalation keeps the offer', async ({ page, backend, widget }) => {
    backend.chatReply = () => ({
      message: { id: 77, role: 'assistant', content: 'Checking billing', createdAt: new Date().toISOString() },
      aiData: { intentAnalysis: { needHumanHandoff: true } },
    });
    await boot(page, backend);
    await widget.open();
    await widget.send('refund my invoice');
    const talk = widget.root.getByRole('button', { name: 'Talk to a human' });
    await expect(talk).toBeVisible();

    backend.fault('escalate', { status: 500, times: 1 });
    await talk.click();
    await page.waitForTimeout(500);
    await expect(talk).toBeVisible();
    await expect(widget.log.getByText(/notified the team/)).toHaveCount(0);

    await talk.click();
    await expect(widget.log.getByText(/notified the team/)).toBeVisible();
    await expect(talk).toHaveCount(0);
    expect(backend.callsTo('escalate')).toHaveLength(2);
  });

  test('D26 suggested actions: internal link navigates and collapses; plain text sends', async ({ page, backend, widget }) => {
    await boot(page, backend);
    await widget.open();
    await widget.log.getByRole('button', { name: /Assurance Support/ }).click();
    // Verify via the backend call — avoids strict-mode issues when the button text matches a message.
    await expect.poll(() => backend.callsTo('chat').length).toBeGreaterThan(0);
    expect(backend.callsTo('chat')[0].body.content).toBe('Assurance Support');
    // The user message bubble should appear in the log (use first() since greeting may also contain text).
    await expect(widget.bubble('Assurance Support')).toBeVisible();

    await widget.log.getByRole('button', { name: /Our Services/ }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(widget.minimize).toBeHidden();
  });

  test('D26 suggested actions: external links open a new tab', async ({ page, backend, widget, context }) => {
    backend.chatReply = () => ({
      message: { id: 5, role: 'assistant', content: 'See docs', createdAt: new Date().toISOString() },
      aiData: { suggestedActions: [{ text: 'External docs', url: 'https://example.com/docs' }] },
    });
    await context.route('https://example.com/**', route => route.fulfill({ body: 'ok' }));
    await boot(page, backend);
    await widget.open();
    await widget.send('docs please');
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      widget.log.getByRole('button', { name: /External docs/ }).click(),
    ]);
    expect(popup.url()).toContain('example.com/docs');
    await expect(page).toHaveURL(/\/pricing$/);
  });

  test('D27 contact card: only on the latest ask, validates, handles errors, remembers success', async ({ page, backend, widget }) => {
    backend.chatReply = ({ content }) => ({
      message: { id: Math.random(), role: 'assistant', content: `Reply to ${content}`, metadata: { requestContact: true }, createdAt: new Date().toISOString() },
    });
    await boot(page, backend);
    await widget.open();
    await widget.send('one');
    await expect(widget.bubble('Reply to one')).toBeVisible();
    await widget.send('two');
    await expect(widget.bubble('Reply to two')).toBeVisible();
    const email = widget.log.getByRole('textbox', { name: 'Email address' });
    await expect(email).toHaveCount(1);

    await email.fill('not-an-email');
    await widget.log.getByRole('button', { name: 'Save' }).click();
    await expect(widget.log.getByRole('alert')).toHaveText('Enter a valid email address.');

    backend.fault('capture-email', { status: 500, body: { success: false, message: 'Mailbox unavailable' }, times: 1 });
    await email.fill('jane@example.test');
    await widget.log.getByRole('button', { name: 'Save' }).click();
    await expect(widget.log.getByRole('alert')).toHaveText('Mailbox unavailable');

    await widget.log.getByRole('button', { name: 'Save' }).click();
    await expect(email).toHaveCount(0);
    expect(backend.callsTo('capture-email').at(-1)!.body).toEqual({ conversationId: 'conv-1', email: 'jane@example.test' });

    await page.reload();
    await widget.open();
    await widget.send('three');
    await expect(widget.bubble('Reply to three')).toBeVisible();
    await expect(widget.log.getByRole('textbox', { name: 'Email address' })).toHaveCount(0);
  });

  test('D27 contact card can be skipped', async ({ page, backend, widget }) => {
    backend.chatReply = () => ({
      message: { id: 3, role: 'assistant', content: 'Reply', metadata: { requestContact: true }, createdAt: new Date().toISOString() },
    });
    await boot(page, backend);
    await widget.open();
    await widget.send('hello');
    await widget.log.getByRole('button', { name: 'Skip' }).click();
    await expect(widget.log.getByRole('textbox', { name: 'Email address' })).toHaveCount(0);
  });
});
