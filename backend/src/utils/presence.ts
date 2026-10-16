type PresenceRecord = {
  customerId: string;
  lastActiveAt: string;
  path?: string;
};

const PRESENCE_TTL_MS = 90_000;
const customerPresence = new Map<string, PresenceRecord>();

export const markCustomerActive = (customerId: string, path?: string) => {
  const record: PresenceRecord = {
    customerId,
    lastActiveAt: new Date().toISOString(),
    path,
  };
  customerPresence.set(customerId, record);
  return record;
};

export const clearCustomerPresence = (customerId?: string | null) => {
  if (customerId) customerPresence.delete(customerId);
};

export const getCustomerPresence = (customerId?: string | null) => {
  if (!customerId) return { activeStatus: 'inactive' as const, lastActiveAt: null };
  const record = customerPresence.get(customerId);
  if (!record) return { activeStatus: 'inactive' as const, lastActiveAt: null };

  const isActive = Date.now() - new Date(record.lastActiveAt).getTime() <= PRESENCE_TTL_MS;
  return {
    activeStatus: isActive ? 'active' as const : 'inactive' as const,
    lastActiveAt: record.lastActiveAt,
  };
};

export const attachPresenceToCustomer = <T extends { id?: string | null }>(customer?: T | null) => {
  if (!customer?.id) return customer;
  return {
    ...customer,
    ...getCustomerPresence(customer.id),
  };
};
