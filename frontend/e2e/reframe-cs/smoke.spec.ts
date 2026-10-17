import { boot, expect, test } from '../support/fixtures';

test('harness: open, send, receive a reply @mobile', async ({ page, backend, widget, consoleProblems }) => {
  await boot(page, backend);
  await widget.open();
  await widget.send('Hello there');
  await expect(widget.bubble('Answer to: Hello there')).toBeVisible();
  expect(backend.callsTo('chat')).toHaveLength(1);
  expect(consoleProblems).toEqual([]);
});
