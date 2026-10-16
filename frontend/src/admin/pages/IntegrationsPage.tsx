import React, { useEffect, useState } from 'react';
import { useToast } from '../ToastContext';
import { Modal } from '../components/Modal';
import { adminApi, TelegramStatus, SlackStatus } from '../services/adminApi';

const createKeySuffix = () => {
  const bytes = new Uint8Array(2);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return Date.now().toString(16).slice(-4);
};

const INITIAL_INTEGRATIONS = [
  {
    name: 'Telegram', connected: true, av: 'TG', desc: 'Order, lead, payment, and live chat alerts delivered to the admin Telegram group.',
    iconBg: 'var(--an-blue-bg)', iconFg: 'var(--an-blue-text)', status: 'Checking...', lastEvent: 'Webhook replies enabled',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
  },
  {
    name: 'Slack', connected: true, av: 'SL', desc: 'Unified bot delivering order, lead, payment, and two-way live chat alerts to a single Slack channel.',
    iconBg: 'var(--an-lavender-bg, var(--an-blue-bg))', iconFg: 'var(--an-lavender-text, var(--an-blue-text))', status: 'Checking...', lastEvent: 'Thread replies enabled',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3v8a2 2 0 11-2-2h8"/><path d="M21 10h-8a2 2 0 112-2V0"/><path d="M10 21v-8a2 2 0 112 2H4"/><path d="M3 14h8a2 2 0 11-2 2v8"/></svg>
  },
  {
    name: 'Stripe', connected: true, av: 'ST', desc: 'Automated invoicing and payment reconciliation for all global clients.',
    iconBg: 'var(--an-blue-bg)', iconFg: 'var(--an-blue-text)', status: '● Online', lastEvent: 'Sync: 12m ago',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h16M4 14h16M8 6h8M8 18h8"/></svg>
  },
  {
    name: 'Zapier', connected: false, av: 'ZP', desc: 'Trigger automation workflows across 5,000+ apps.',
    iconBg: 'var(--an-orange-bg)', iconFg: 'var(--an-orange-text)', status: '○ Paused', lastEvent: 'Last sync: 3 days ago',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
  },
  {
    name: 'Shopify', connected: false, av: 'SP', desc: 'Sync orders and customer data directly from your Shopify store.',
    iconBg: 'var(--an-green-bg)', iconFg: 'var(--an-green-text)', status: '○ Not connected', lastEvent: 'Never connected',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
  },
  {
    name: 'Google Drive', connected: true, av: 'GD', desc: 'Store and organize all assets in your Google Drive folders.',
    iconBg: 'var(--an-blue-bg)', iconFg: 'var(--an-blue-text)', status: '● Syncing', lastEvent: 'Sync: 5m ago',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
  },
  {
    name: 'HubSpot', connected: false, av: 'HS', desc: 'Sync contacts and deals with your HubSpot CRM.',
    iconBg: 'var(--an-orange-bg)', iconFg: 'var(--an-orange-text)', status: '○ Not connected', lastEvent: 'Last sync: 30 days ago',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-6.5l-4.25 4.25m-4.5 4.5L7.5 16.5m9 0l-4.25-4.25m-4.5-4.5L3.5 7.5"/></svg>
  },
];

const INITIAL_API_KEYS = [
  { id: '1', name: 'Production API', key: 'rv_live_••••••••••4f2a', perm: 'Full access', permCls: 'an-badge-orange', last: '2m ago', status: 'Active', statusCls: 'an-badge-green' },
  { id: '2', name: 'Zapier Webhook', key: 'rv_live_••••••••••9c1b', perm: 'Read only', permCls: 'an-badge-gray', last: '3 days ago', status: 'Paused', statusCls: 'an-badge-orange' },
  { id: '3', name: 'Analytics Service', key: 'rv_live_••••••••••7d8e', perm: 'Analytics only', permCls: 'an-badge-blue', last: '1h ago', status: 'Active', statusCls: 'an-badge-green' },
];

export const IntegrationsPage: React.FC = () => {
  const { showToast } = useToast();
  
  // State for integrations - toggles persist
  const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS);
  const [apiKeys, setApiKeys] = useState(INITIAL_API_KEYS);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [showGenerateKey, setShowGenerateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [testingTelegram, setTestingTelegram] = useState<string | null>(null);
  const [slackStatus, setSlackStatus] = useState<SlackStatus | null>(null);
  const [testingSlack, setTestingSlack] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    adminApi.telegram.getStatus().then((res) => {
      if (!mounted) return;
      if (res.data?.data) {
        setTelegramStatus(res.data.data);
        setIntegrations(prev => prev.map(int => int.name === 'Telegram'
          ? {
              ...int,
              connected: res.data!.data!.configured,
              status: res.data!.data!.configured ? '● Live' : '○ Needs configuration',
              lastEvent: Object.values(res.data!.data!.topics || {}).every(Boolean) ? 'All topics configured' : 'Topic IDs pending',
            }
          : int
        ));
      }
    });
    adminApi.slack.getStatus().then((res) => {
      if (!mounted) return;
      if (res.data?.data) {
        setSlackStatus(res.data.data);
        setIntegrations(prev => prev.map(int => int.name === 'Slack'
          ? {
              ...int,
              connected: res.data!.data!.configured,
              status: res.data!.data!.configured ? '● Live' : '○ Needs configuration',
              lastEvent: Object.values(res.data!.data!.channels || {}).every(Boolean) ? 'All channels configured' : 'Channel IDs pending',
            }
          : int
        ));
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleToggle = (name: string) => {
    setIntegrations(prev => prev.map(int => {
      if (int.name === name) {
        const newConnected = !int.connected;
        showToast(
          newConnected ? 'Integration Connected' : 'Integration Disconnected',
          `${name} has been ${newConnected ? 'connected' : 'disconnected'}`,
          newConnected ? 'success' : 'info'
        );
        return { 
          ...int, 
          connected: newConnected,
          status: newConnected ? '● Live' : '○ Paused',
        };
      }
      return int;
    }));
  };

  const handleRevokeKey = (id: string, name: string) => {
    if (confirm(`Revoke API key "${name}"? This action cannot be undone.`)) {
      setApiKeys(prev => prev.filter(k => k.id !== id));
      showToast('Key Revoked', `${name} has been revoked`, 'success');
    }
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      showToast('Error', 'Please enter a name for the API key', 'error');
      return;
    }

    const newKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `rv_live_••••••••••${createKeySuffix()}`,
      perm: 'Full access',
      permCls: 'an-badge-orange',
      last: 'Just now',
      status: 'Active',
      statusCls: 'an-badge-green',
    };

    setApiKeys(prev => [...prev, newKey]);
    showToast('Key Generated', 'New API key created successfully', 'success');
    setShowGenerateKey(false);
    setNewKeyName('');
  };

  const handleAddIntegration = (integrationName: string) => {
    setIntegrations(prev => prev.map(int => 
      int.name === integrationName ? { ...int, connected: true, status: '● Live' } : int
    ));
    showToast('Integration Added', `${integrationName} has been connected`, 'success');
    setShowAddIntegration(false);
  };

  const handleTelegramTest = async (topic = 'system') => {
    setTestingTelegram(topic);
    const res = await adminApi.telegram.sendTest(topic);
    setTestingTelegram(null);
    if (res.error) {
      showToast('Telegram test failed', res.error.message || 'Could not send test message', 'error');
      return;
    }
    showToast('Telegram test sent', 'Check the admin Telegram group for the test notification.', 'success');
  };

  const handleSlackTest = async (topic = 'system') => {
    setTestingSlack(topic);
    const res = await adminApi.slack.sendTest(topic);
    setTestingSlack(null);
    if (res.error) {
      showToast('Slack test failed', res.error.message || 'Could not send test message', 'error');
      return;
    }
    showToast('Slack test sent', 'Check your Slack channel for the test notification.', 'success');
  };

  return (
    <div>
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
          </span>
          Integrations
        </div>
        <div className="an-page-desc">
          {integrations.filter(i => i.connected).length} active connections
        </div>
        <div className="an-page-actions">
          <button className="an-btn an-btn-primary an-btn-sm" onClick={() => setShowAddIntegration(true)}>+ Add Integration</button>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowGenerateKey(true)}>+ Generate API Key</button>
        </div>
      </div>

      <div className="an-int-grid" style={{ marginBottom: 20 }}>
        {integrations.map(int => (
          <div key={int.name} className={`an-int-card${int.connected ? ' connected' : ''}`}>
            <div className="an-int-top">
              <div className="an-int-icon" style={{ background: int.iconBg, color: int.iconFg }}>
                {int.svg}
              </div>
              <span className={`an-badge ${int.connected ? 'an-badge-green' : 'an-badge-gray'}`}>
                {int.connected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <div className="an-int-name">{int.name}</div>
            <div className="an-int-desc">{int.desc}</div>
            {int.name === 'Telegram' && telegramStatus && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                <span className={`an-badge ${telegramStatus.botTokenConfigured ? 'an-badge-green' : 'an-badge-gray'}`}>Bot token</span>
                <span className={`an-badge ${telegramStatus.adminChatConfigured ? 'an-badge-green' : 'an-badge-gray'}`}>Admin chat</span>
                <span className={`an-badge ${telegramStatus.webhookSecretConfigured ? 'an-badge-green' : 'an-badge-gray'}`}>Webhook secret</span>
                {Object.entries(telegramStatus.topics || {}).map(([topic, configured]) => (
                  <span key={topic} className={`an-badge ${configured ? 'an-badge-green' : 'an-badge-gray'}`}>{topic}</span>
                ))}
                <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {(['urgent', 'orders', 'payments', 'leads', 'chat', 'system'] as const).map(topic => (
                    <button
                      key={topic}
                      className="an-btn an-btn-ghost an-btn-sm"
                      onClick={() => handleTelegramTest(topic)}
                      disabled={!int.connected || Boolean(testingTelegram)}
                    >
                      {testingTelegram === topic ? 'Sending...' : `Test ${topic}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {int.name === 'Slack' && slackStatus && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                <span className={`an-badge ${slackStatus.botTokenConfigured ? 'an-badge-green' : 'an-badge-gray'}`}>Bot token</span>
                <span className={`an-badge ${slackStatus.signingSecretConfigured ? 'an-badge-green' : 'an-badge-gray'}`}>Signing secret</span>
                <span className={`an-badge ${slackStatus.defaultChannelConfigured ? 'an-badge-green' : 'an-badge-gray'}`}>Channel</span>
              </div>
            )}
            <div className="an-int-foot">
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: int.connected ? 'var(--an-green-text)' : 'var(--an-text3)' }}>{int.status}</div>
                <div style={{ fontSize: 11, color: 'var(--an-text3)', marginTop: 1 }}>{int.lastEvent}</div>
              </div>
              {int.name === 'Telegram' ? (
                <button
                  className="an-btn an-btn-ghost an-btn-sm"
                  onClick={() => handleTelegramTest('system')}
                  disabled={!int.connected || Boolean(testingTelegram)}
                >
                  {testingTelegram === 'system' ? 'Sending...' : 'Send test'}
                </button>
              ) : int.name === 'Slack' ? (
                <button
                  className="an-btn an-btn-ghost an-btn-sm"
                  onClick={() => handleSlackTest('system')}
                  disabled={!int.connected || Boolean(testingSlack)}
                >
                  {testingSlack === 'system' ? 'Sending...' : 'Send test'}
                </button>
              ) : (
                <button
                  className={`an-toggle${int.connected ? ' on' : ''}`}
                  onClick={() => handleToggle(int.name)}
                >
                  <div className="an-toggle-thumb" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="an-card-flush">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--an-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="an-sec-title">API Keys & Webhooks</div>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowGenerateKey(true)}>+ Generate key</button>
        </div>
        <div className="an-tbl-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Key</th><th>Permissions</th><th>Last Used</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {apiKeys.map(k => (
                <tr key={k.id}>
                  <td className="an-td-main">{k.name}</td>
                  <td><code style={{ fontSize: 11, background: 'var(--an-sidebar)', padding: '3px 8px', borderRadius: 4, color: 'var(--an-text2)' }}>{k.key}</code></td>
                  <td><span className={`an-badge ${k.permCls}`}>{k.perm}</span></td>
                  <td className="an-td-mono">{k.last}</td>
                  <td><span className={`an-badge ${k.statusCls}`}>{k.status}</span></td>
                  <td>
                    <button 
                      className="an-btn an-btn-ghost an-btn-sm"
                      onClick={() => handleRevokeKey(k.id, k.name)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Integration Modal */}
      <Modal
        isOpen={showAddIntegration}
        onClose={() => setShowAddIntegration(false)}
        title="Add Integration"
        footer={
          <button className="an-btn an-btn-ghost" onClick={() => setShowAddIntegration(false)}>Close</button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--an-text2)', marginBottom: 8 }}>
            Select an integration to connect:
          </p>
          {integrations.filter(i => !i.connected).map(int => (
            <button
              key={int.name}
              onClick={() => handleAddIntegration(int.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 8,
                border: '1px solid var(--an-border)',
                background: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--an-border2)';
                e.currentTarget.style.background = 'var(--an-sidebar)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--an-border)';
                e.currentTarget.style.background = 'white';
              }}
            >
              <div className="an-int-icon" style={{ background: int.iconBg, color: int.iconFg, width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {int.svg}
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>{int.name}</div>
                <div style={{ fontSize: 11, color: 'var(--an-text3)' }}>{int.desc.slice(0, 60)}...</div>
              </div>
            </button>
          ))}
          {integrations.filter(i => !i.connected).length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--an-text3)', fontSize: 13 }}>
              All integrations are already connected!
            </div>
          )}
        </div>
      </Modal>

      {/* Generate API Key Modal */}
      <Modal
        isOpen={showGenerateKey}
        onClose={() => setShowGenerateKey(false)}
        title="Generate API Key"
        footer={
          <>
            <button className="an-btn an-btn-ghost" onClick={() => setShowGenerateKey(false)}>Cancel</button>
            <button className="an-btn an-btn-primary" onClick={handleGenerateKey}>Generate Key</button>
          </>
        }
      >
        <form onSubmit={handleGenerateKey} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Key Name *</label>
            <input 
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              style={{ width: '100%', height: 36, borderRadius: 8, border: '1px solid var(--an-border)', padding: '0 12px', fontSize: 13 }}
              placeholder="e.g., Production API, Analytics Service"
              required
            />
          </div>
          <div style={{ padding: 12, background: 'var(--an-orange-bg)', borderRadius: 8, fontSize: 12, color: 'var(--an-orange-text)', border: '1px solid rgba(173,87,0,.12)' }}>
            <strong>⚠ Important:</strong> Copy your API key immediately after generation. For security reasons, you won't be able to see it again.
          </div>
        </form>
      </Modal>
    </div>
  );
};
