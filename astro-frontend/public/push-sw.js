self.addEventListener('push', (event) => {
  if (!event || !event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Reframe Chat', body: event.data.text() };
  }

  const title = payload.title || 'Reframe Chat';
  const options = {
    body: payload.body || 'New message received.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.tag || 'reframe-chat',
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/admin/chats'));
});
