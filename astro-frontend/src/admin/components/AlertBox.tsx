import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X, ExternalLink, ChevronRight } from 'lucide-react';
import { cx } from '../../utils/theme';
import { API_BASE_URL } from '../../lib/apiConfig';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
  actionLink?: string;
  createdAt: string;
  expiresAt: string;
}

export const AlertBox: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts?limit=10&dismissed=false`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const result = await response.json();
      setAlerts(result.alerts || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/dismiss`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const getAlertStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bgVar: 'var(--an-red-bg)',
          borderVar: 'var(--an-red-text)',
          accentVar: 'var(--an-red-text)',
          icon: <AlertCircle size={18} />,
        };
      case 'warning':
        return {
          bgVar: 'var(--an-orange-bg)',
          borderVar: 'var(--an-orange-text)',
          accentVar: 'var(--an-orange-text)',
          icon: <AlertTriangle size={18} />,
        };
      case 'success':
        return {
          bgVar: 'var(--an-green-bg)',
          borderVar: 'var(--an-green-text)',
          accentVar: 'var(--an-green-text)',
          icon: <CheckCircle size={18} />,
        };
      case 'info':
        return {
          bgVar: 'var(--an-blue-bg)',
          borderVar: 'var(--an-blue-text)',
          accentVar: 'var(--an-blue-text)',
          icon: <Info size={18} />,
        };
    }
  };

  if (loading) return null;
  if (alerts.length === 0) return null;

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 3);

  return (
    <div
      className="mb-8 overflow-hidden"
      style={{
        borderRadius: 'var(--an-r-lg)',
        border: '1px solid var(--an-border)',
        background: 'var(--an-page)',
        boxShadow: 'var(--an-shadow-md)',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{
          borderBottom: '1px solid var(--an-border)',
          background: 'var(--an-sidebar)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <AlertCircle size={14} style={{ color: 'var(--an-text3)' }} />
          <h3 style={{ fontSize: 'var(--an-text-xs)', fontWeight: 700, color: 'var(--an-text)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--an-font)' }}>
            System Notifications
          </h3>
          <span style={{ fontSize: 'var(--an-text-xs)', color: 'var(--an-text3)' }}>[{alerts.length}]</span>
        </div>
        {alerts.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1"
            style={{ fontSize: 'var(--an-text-xs)', fontWeight: 600, color: 'var(--an-orange-text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--an-font)' }}
          >
            {showAll ? 'Show Fewer' : 'View All Messages'}
            <ChevronRight size={10} className={cx("transition-transform", showAll && "rotate-90")} />
          </button>
        )}
      </div>

      <div style={{ borderTop: 'none' }}>
        {displayedAlerts.map((alert, idx) => {
          const styles = getAlertStyles(alert.severity);
          return (
            <div
              key={alert.id}
              className="px-5 py-4 group relative"
              style={{
                background: styles.bgVar,
                borderTop: idx > 0 ? '1px solid var(--an-border)' : 'none',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5" style={{ color: styles.accentVar }}>{styles.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div style={{ fontSize: 'var(--an-text-md)', fontWeight: 700, color: 'var(--an-text)', lineHeight: 1 }}>{alert.title}</div>
                    <span style={{ fontSize: 'var(--an-text-2xs)', color: 'var(--an-text3)' }}>{alert.createdAt}</span>
                  </div>
                  <div style={{ fontSize: 'var(--an-text-base)', color: 'var(--an-text2)', lineHeight: 1.6 }}>{alert.message}</div>

                  {alert.actionLink && (
                    <div className="mt-3">
                      <a
                        href={alert.actionLink}
                        className="inline-flex items-center gap-1.5"
                        style={{
                          fontSize: 'var(--an-text-sm)',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 'var(--an-r-sm)',
                          background: 'var(--an-page)',
                          border: '1px solid var(--an-border)',
                          color: 'var(--an-text)',
                          textDecoration: 'none',
                        }}
                      >
                        {alert.action || 'View Details'}
                        <ExternalLink size={10} style={{ opacity: 0.6 }} />
                      </a>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="shrink-0 p-1.5 opacity-0 group-hover:opacity-100"
                  style={{
                    borderRadius: 'var(--an-r-sm)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--an-text3)',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
