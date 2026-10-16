import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureGuestEmail, ensureLead, isPlaceholderEmail } from '../services/guestLeadService';
import { prisma } from '../database';

// Mocked so the shared capture path can be tested without a running database.
vi.mock('../database', () => {
  const mockPrisma = {
    customer: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    conversation: {
      findFirst: vi.fn(),
    },
    lead: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

const mocked = prisma as any;

describe('isPlaceholderEmail', () => {
  it('treats the synthetic guest address as "no way to reach them"', () => {
    expect(isPlaceholderEmail('guest_abc123@reframe.internal')).toBe(true);
    expect(isPlaceholderEmail(null)).toBe(true);
    expect(isPlaceholderEmail(undefined)).toBe(true);
    expect(isPlaceholderEmail('')).toBe(true);
  });

  it('treats a real address as reachable', () => {
    expect(isPlaceholderEmail('someone@example.com')).toBe(false);
  });
});

describe('captureGuestEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.customer.findUnique.mockResolvedValue({ id: 'guest_abc12345', email: 'guest_abc12345@reframe.internal' });
    mocked.customer.update.mockResolvedValue({});
    mocked.customer.create.mockResolvedValue({});
    mocked.conversation.findFirst.mockResolvedValue(null);
    mocked.lead.findFirst.mockResolvedValue(null);
    mocked.lead.create.mockResolvedValue({ id: 'lead_1' });
  });

  it('creates a Lead on first capture and links the conversation', async () => {
    const result = await captureGuestEmail('guest_abc12345', 'visitor@example.com', {
      source: 'chat',
      conversationId: 'conv_1',
      firstMessage: 'Do you retouch jewellery?',
    });

    expect(result.leadCreated).toBe(true);
    expect(result.conversationId).toBe('conv_1');

    const leadData = mocked.lead.create.mock.calls[0][0].data;
    expect(leadData.email).toBe('visitor@example.com');
    expect(leadData.source).toBe('chat');
    expect(leadData.notes).toContain('conv_1');
    expect(leadData.notes).toContain('Do you retouch jewellery?');
  });

  it('overwrites the @reframe.internal placeholder on the customer record', async () => {
    await captureGuestEmail('guest_abc12345', 'visitor@example.com');

    expect(mocked.customer.update).toHaveBeenCalledWith({
      where: { id: 'guest_abc12345' },
      data: { email: 'visitor@example.com' },
    });
  });

  it('creates the guest Customer row when one does not exist yet', async () => {
    mocked.customer.findUnique.mockResolvedValue(null);

    await captureGuestEmail('guest_abc12345', 'visitor@example.com');

    const created = mocked.customer.create.mock.calls[0][0].data;
    expect(created.id).toBe('guest_abc12345');
    expect(created.isGuest).toBe(true);
    expect(created.email).toContain('@reframe.internal');
  });

  it('does not duplicate a Lead when one already exists for that address', async () => {
    mocked.lead.findFirst.mockResolvedValue({ id: 'lead_existing', email: 'visitor@example.com' });

    const result = await captureGuestEmail('guest_abc12345', 'visitor@example.com');

    expect(result.leadCreated).toBe(false);
    expect(mocked.lead.create).not.toHaveBeenCalled();
  });

  it('falls back to the guest latest conversation when none is passed', async () => {
    mocked.conversation.findFirst.mockResolvedValue({ id: 'conv_latest' });

    const result = await captureGuestEmail('guest_abc12345', 'visitor@example.com');

    expect(result.conversationId).toBe('conv_latest');
  });
});

describe('ensureLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.lead.create.mockResolvedValue({ id: 'lead_1' });
  });

  it('records the inquiry source for form submissions with no guest identity', async () => {
    mocked.lead.findFirst.mockResolvedValue(null);

    const created = await ensureLead('form@example.com', { source: 'inquiry' });

    expect(created).toBe(true);
    expect(mocked.lead.create.mock.calls[0][0].data.source).toBe('inquiry');
  });

  it('returns false rather than throwing when the write fails', async () => {
    mocked.lead.findFirst.mockRejectedValue(new Error('db down'));

    await expect(ensureLead('form@example.com')).resolves.toBe(false);
  });
});
