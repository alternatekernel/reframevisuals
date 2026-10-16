type MessageStatus = 'sent' | 'delivered' | 'seen';

export const initialMessageStatus = (): MessageStatus => 'sent';

export const buildMessageCreateStatus = () => ({
  status: 'sent' as MessageStatus,
});

export const buildDeliveredStatusPatch = () => ({
  status: 'delivered' as MessageStatus,
  deliveredAt: new Date(),
});

export const buildSeenStatusPatch = () => ({
  status: 'seen' as MessageStatus,
  deliveredAt: new Date(),
  seenAt: new Date(),
});
