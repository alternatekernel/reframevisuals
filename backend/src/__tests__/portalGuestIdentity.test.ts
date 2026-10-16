import { describe, it, expect } from 'vitest';
import { isGuestIdFormat } from '../middleware/portalMiddleware';

describe('isGuestIdFormat', () => {
  it('accepts the guest ID formats the clients generate', () => {
    expect(isGuestIdFormat('3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe(true);
    expect(isGuestIdFormat('guest_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c')).toBe(true);
    expect(isGuestIdFormat('guest-temp-1758300000000')).toBe(true);
  });

  it('rejects a registered customer cuid passed as a guest ID', () => {
    // Regression: this shape used to pass, letting any caller read another
    // customer's conversations by sending their ID as X-Guest-ID.
    expect(isGuestIdFormat('cmrusobk8001t6w92mufv6svz')).toBe(false);
  });

  it('rejects junk and non-string input', () => {
    expect(isGuestIdFormat('')).toBe(false);
    expect(isGuestIdFormat('short')).toBe(false);
    expect(isGuestIdFormat('guest_abc')).toBe(false);
    expect(isGuestIdFormat(null)).toBe(false);
    expect(isGuestIdFormat(12345678)).toBe(false);
  });
});
