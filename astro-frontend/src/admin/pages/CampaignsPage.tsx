import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '../utils/api';
import { useToast } from '../ToastContext';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  sentCount: number;
  openCount: number;
  budget?: number;
  spent?: number;
  createdAt: string;
}

const initialForm = {
  name: '',
  type: 'email',
  status: 'draft',
  budget: '0'
};

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const { showToast } = useToast();

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminFetch<{ campaigns: Campaign[] }>('/business/campaigns');
      if (data.campaigns) {
        setCampaigns(data.campaigns.map((campaign: Campaign) => ({
          ...campaign,
          sentCount: campaign.sentCount || 0,
          openCount: campaign.openCount || 0,
        })));
      }
    } catch {
      showToast('Error', 'Failed to load campaigns', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();

    if (!name) {
      showToast('Missing name', 'Give this campaign a clear name first', 'info');
      return;
    }

    try {
      setIsSaving(true);
      const data = await adminFetch<{ campaign?: Campaign }>('/business/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type: form.type,
          status: form.status,
          budget: Number(form.budget) || 0,
          spent: 0
        })
      });
      if (data.campaign) {
        setCampaigns(prev => [{ ...data.campaign, sentCount: 0, openCount: 0 }, ...prev]);
      } else {
        await fetchCampaigns();
      }

      setForm(initialForm);
      setShowCreateModal(false);
      showToast('Campaign Created', 'Draft campaign is ready for planning', 'success');
    } catch {
      showToast('Error', 'Failed to create campaign', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'an-badge-green';
      case 'draft': return 'an-badge-yellow';
      case 'paused': return 'an-badge-gray';
      case 'completed': return 'an-badge-blue';
      default: return 'an-badge-gray';
    }
  };

  const getEngagement = (c: Campaign) => {
    if (!c.sentCount) return c.status === 'draft' ? 'Draft setup' : 'Scheduled';
    const rate = Math.round(((c.openCount || 0) / c.sentCount) * 100);
    return `${rate}% open rate`;
  };

  return (
    <div>
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 5h10m-10 7h10m-10 7h10M3 5h4M3 12h4M3 19h4"/>
            </svg>
          </span>
          Campaigns
        </div>
        <div className="an-page-desc">Email and outreach campaign management</div>
        <div className="an-page-actions">
          <button className="an-btn an-btn-primary an-btn-sm" onClick={() => setShowCreateModal(true)}>+ New Campaign</button>
          <button className="an-btn an-btn-ghost an-btn-sm">Templates</button>
        </div>
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateCampaign} className="an-card" style={{ width: '100%', maxWidth: 520, padding: 24 }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--an-text)' }}>New Campaign</div>
                <div style={{ fontSize: 13, color: 'var(--an-text3)', marginTop: 4 }}>Create a draft campaign for email or outreach planning.</div>
              </div>
              <button type="button" className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowCreateModal(false)}>Close</button>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--an-text2)' }}>
                Campaign name
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. May product retouching win-back" className="an-search-input" style={{ width: '100%', padding: '10px 12px' }} autoFocus />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--an-text2)' }}>
                  Type
                  <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="an-search-input" style={{ width: '100%', padding: '10px 12px' }}>
                    <option value="email">Email</option>
                    <option value="outreach">Outreach</option>
                    <option value="retargeting">Retargeting</option>
                    <option value="newsletter">Newsletter</option>
                  </select>
                </label>

                <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--an-text2)' }}>
                  Status
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="an-search-input" style={{ width: '100%', padding: '10px 12px' }}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--an-text2)' }}>
                Budget
                <input type="number" min="0" step="1" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} placeholder="0" className="an-search-input" style={{ width: '100%', padding: '10px 12px' }} />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button type="button" className="an-btn an-btn-ghost" onClick={() => setShowCreateModal(false)} disabled={isSaving}>Cancel</button>
              <button type="submit" className="an-btn an-btn-primary" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create Campaign'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="an-grid3">
        {campaigns.map(c => (
          <div key={c.id} className="an-card" style={{ cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--an-blue-bg)', color: 'var(--an-blue-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--an-text)', marginBottom: 3 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: 'var(--an-text3)', marginBottom: 10 }}>{c.type} · {new Date(c.createdAt).toLocaleDateString()}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className={`an-badge ${getBadgeClass(c.status)}`}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span>
              <span style={{ fontSize: 12, color: 'var(--an-text2)' }}>{getEngagement(c)}</span>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && !isLoading && (
          <div className="an-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 0', color: 'var(--an-text3)' }}>
            No campaigns found. Start by creating a new one.
          </div>
        )}
      </div>
    </div>
  );
};
