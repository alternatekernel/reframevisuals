import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { FakeBackend, type FakeUser } from './fakeBackend';

export const CUSTOMER: FakeUser = { id: 'cust-1', name: 'Jane Doe', email: 'jane@example.test' };
export const ADMIN: FakeUser = { id: 'admin-1', name: 'Ada Admin', email: 'ada@example.test', role: 'admin' };

interface SeedOptions {
  /** localStorage entries written once, before the app boots. */
  local?: Record<string, string>;
  session?: Record<string, string>;
  /** Show the launcher immediately instead of the first-visit entrance delay. */
  skipIntro?: boolean;
  signedIn?: FakeUser | null;
}

/**
 * Seeds storage on the first document load only, so reloads inside a test keep
 * whatever the app wrote — that's what most persistence tests need to observe.
 */
export const seed = async (page: Page, backend: FakeBackend, options: SeedOptions = {}) => {
  const { local = {}, session = {}, skipIntro = true, signedIn = null } = options;
  backend.user = signedIn;
  const localEntries = {
    'reframe-cookie-consent': 'declined',
    ...(signedIn ? { portal_token: 'test-token', 'reframe-current-user': JSON.stringify(signedIn) } : {}),
    ...local,
  };
  const sessionEntries = { ...(skipIntro ? { reframe_cs_intro_seen: '1' } : {}), ...session };
  await page.addInitScript(([l, s]) => {
    if (sessionStorage.getItem('__e2e_seeded')) return;
    sessionStorage.setItem('__e2e_seeded', '1');
    for (const [key, value] of Object.entries(l)) localStorage.setItem(key, value);
    for (const [key, value] of Object.entries(s)) sessionStorage.setItem(key, value);
  }, [localEntries, sessionEntries] as const);
};

export class Widget {
  readonly root: Locator;
  constructor(readonly page: Page, variant: 'floating' | 'embedded' = 'floating') {
    this.root = page.getByRole(variant === 'floating' ? 'dialog' : 'region', { name: 'Reframe CS support chat' });
  }
  get composer() { return this.root.getByRole('textbox', { name: 'Message Reframe CS' }); }
  get log() { return this.root.getByRole('log'); }
  get badge() { return this.root.locator('[aria-label$="unread reply"], [aria-label$="unread replies"]'); }
  get minimize() { return this.root.getByRole('button', { name: 'Minimize Reframe CS' }); }
  get sendButton() { return this.root.getByRole('button', { name: 'Send message' }); }
  get jumpButton() { return this.log.getByRole('button', { name: /new message|Latest/ }); }
  bubble(text: string | RegExp) {
    return typeof text === 'string' ? this.log.getByText(text, { exact: true }) : this.log.getByText(text);
  }

  async isOpen() {
    return (await this.page.locator('body').getAttribute('data-reframe-cs-open')) === 'true';
  }

  async open() {
    // Clicking the composer (textarea's onFocus calls onExpand) works whether or not there is
    // a draft — unlike the aria-label which changes to "Send message" when text is present.
    await this.composer.click();
    await expect(this.minimize).toBeVisible();
  }

  async collapse() {
    await this.minimize.click();
    await expect(this.minimize).toBeHidden();
  }

  async type(text: string) {
    await this.composer.fill(text);
  }

  async send(text: string) {
    await this.composer.fill(text);
    await this.composer.press('Enter');
  }

  /** Distance in px between the thread's scroll position and its bottom. */
  async distanceFromBottom() {
    return this.log.evaluate(el => Math.round(el.scrollHeight - el.scrollTop - el.clientHeight));
  }

  async scrollThreadTo(top: number) {
    await this.log.evaluate((el, y) => { el.scrollTop = y; el.dispatchEvent(new Event('scroll')); }, top);
  }
}

export const setPageHidden = async (page: Page, hidden: boolean) => {
  await page.evaluate(isHidden => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => isHidden });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (isHidden ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
};

/** Collects uncaught page errors and React warnings so a test can assert none happened. */
export const watchConsole = (page: Page) => {
  const problems: string[] = [];
  page.on('pageerror', error => problems.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    // Pre-existing noise unrelated to the widget: unmocked site APIs and a Fragment prop elsewhere.
    if (/Failed to load resource|API Error|React\.Fragment|Session validation|status code 404|EventSource/i.test(text)) return;
    problems.push(text);
  });
  return problems;
};

export const test = base.extend<{ backend: FakeBackend; widget: Widget; consoleProblems: string[] }>({
  backend: async ({ page }, use) => {
    const backend = new FakeBackend(page);
    await backend.install();
    await use(backend);
  },
  widget: async ({ page }, use) => {
    await use(new Widget(page));
  },
  consoleProblems: async ({ page }, use) => {
    await use(watchConsole(page));
  },
});

export { expect };

/** Standard start: seeded storage, fake API, page loaded with the launcher visible. */
export const boot = async (page: Page, backend: FakeBackend, options: SeedOptions & { path?: string } = {}) => {
  await seed(page, backend, options);
  await page.goto(options.path ?? '/pricing');
  await expect(new Widget(page).root).toBeVisible();
  await expect(new Widget(page).root).toHaveCSS('opacity', '1');
};
