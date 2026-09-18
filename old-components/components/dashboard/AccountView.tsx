import { useEffect, useMemo, useState } from 'react';
import { layout } from '../../utils/theme';
import { Bell, User, Mail, Building, Phone, Briefcase, Trash2, Upload } from 'lucide-react';
import { useContent } from '../../context/ContentBase';
import { portalApi } from '../../services/portalApi';
import { useModal } from '../../context/ModalContext';

const NOTIF_KEY = 'reframe_notif_prefs';
const NOTIF_DEFAULTS = {
  proposalSent: true,
  assetsReady: true,
  orderComplete: true,
  revisionUpdate: true,
};
type NotifPrefs = typeof NOTIF_DEFAULTS;

const loadNotifPrefs = (): NotifPrefs => {
  try {
    const saved = localStorage.getItem(NOTIF_KEY);
    return saved ? { ...NOTIF_DEFAULTS, ...JSON.parse(saved) } : NOTIF_DEFAULTS;
  } catch {
    return NOTIF_DEFAULTS;
  }
};
import { DashboardFieldLabel, dashboardInlineFieldClass, dashboardInlineInputClass, dashboardInputClass, dashboardNoticeClass, dashboardPageDescriptionClass, dashboardPageTitleClass, dashboardPrimaryButtonClass, dashboardSecondaryButtonClass, dashboardSectionDescriptionClass, dashboardSectionTitleClass } from './dashboard-primitives';

const AccountView = () => {
  const { currentUser, setCurrentUser } = useContent();
  const { showConfirm } = useModal();
  const names = useMemo(() => currentUser?.name?.split(' ') || ['User'], [currentUser?.name]);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatarUrl || null);
  const [form, setForm] = useState({
    firstName: names[0] || '',
    lastName: names.slice(1).join(' ') || '',
    email: currentUser?.email || '',
    companyName: currentUser?.companyName || '',
    contactPhone: currentUser?.contactPhone || '',
    industry: currentUser?.industry || '',
  });
  const [saving, setSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(loadNotifPrefs);

  const toggleNotif = (key: keyof NotifPrefs) => {
    setNotifPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', text: 'Please upload an image file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          uploadAvatar(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (base64Data: string) => {
    setSaving(true);
    setStatus(null);
    try {
      const response = await portalApi.updateProfile({
        avatarUrl: base64Data,
      });
      const user = response.data?.data;
      if (response.data?.success && user) {
        setCurrentUser(user);
        localStorage.setItem('reframe-current-user', JSON.stringify(user));
        setStatus({ type: 'success', text: 'Profile picture updated.' });
      } else {
        throw new Error(response.data?.message || 'Profile picture update failed');
      }
    } catch (error: any) {
      setStatus({ type: 'error', text: error?.response?.data?.message || error.message || 'Could not update profile picture.' });
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = async () => {
    const confirmed = await showConfirm({
      title: 'Remove profile picture?',
      message: 'Your profile picture will be removed from your account.',
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (!confirmed) return;
    setSaving(true);
    setStatus(null);
    try {
      const response = await portalApi.updateProfile({
        avatarUrl: null,
      });
      const user = response.data?.data;
      if (response.data?.success && user) {
        setCurrentUser(user);
        localStorage.setItem('reframe-current-user', JSON.stringify(user));
        setStatus({ type: 'success', text: 'Profile picture removed.' });
      } else {
        throw new Error(response.data?.message || 'Profile picture removal failed');
      }
    } catch (error: any) {
      setStatus({ type: 'error', text: error?.response?.data?.message || error.message || 'Could not remove profile picture.' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setForm({
      firstName: names[0] || '',
      lastName: names.slice(1).join(' ') || '',
      email: currentUser?.email || '',
      companyName: currentUser?.companyName || '',
      contactPhone: currentUser?.contactPhone || '',
      industry: currentUser?.industry || '',
    });
    setAvatarPreview(currentUser?.avatarUrl || null);
  }, [currentUser, names]);

  const updateField = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const saveProfile = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const name = `${form.firstName} ${form.lastName}`.trim();
      const response = await portalApi.updateProfile({
        name,
        email: form.email,
        companyName: form.companyName,
        contactEmail: form.email,
        contactPhone: form.contactPhone,
        industry: form.industry,
      });
      const user = response.data?.data;
      if (response.data?.success && user) {
        setCurrentUser(user);
        localStorage.setItem('reframe-current-user', JSON.stringify(user));
        setStatus({ type: 'success', text: 'Profile updated.' });
      } else {
        throw new Error(response.data?.message || 'Profile update failed');
      }
    } catch (error: any) {
      setStatus({ type: 'error', text: error?.response?.data?.message || error.message || 'Could not save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const clearProfileData = async () => {
    const confirmed = await showConfirm({
      title: 'Clear optional profile data?',
      message: 'This will remove optional fields like company name, phone, and industry. Your login email and account will remain active.',
      confirmLabel: 'Clear Data',
      variant: 'danger',
    });
    if (!confirmed) return;
    setSaving(true);
    setStatus(null);
    try {
      await portalApi.deleteProfileData();
      const refreshed = await portalApi.getMe();
      const user = refreshed.data?.data;
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('reframe-current-user', JSON.stringify(user));
      }
      setStatus({ type: 'success', text: 'Optional profile data cleared.' });
    } catch (error: any) {
      setStatus({ type: 'error', text: error?.response?.data?.message || 'Could not clear profile data.' });
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className={`${layout.compactShell} px-4 sm:px-6 xl:px-8`}>
        <header className="py-6 lg:py-8 border-b border-borderSubtle">
          <h1 className={dashboardPageTitleClass} style={{ letterSpacing: '-1.12px' }}>Account</h1>
          <p className={dashboardPageDescriptionClass}>Manage your profile and preferences</p>
        </header>

        <div className="py-6 lg:py-8 space-y-7 lg:space-y-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-brand-ink text-2xl font-bold text-white">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                currentUser?.name?.[0] || <User size={32} color="#ffffff" />
              )}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-text-primary">{currentUser?.customerCode || 'Customer profile'}</div>
              <div className="text-[12px] mt-1 text-text-secondary">Photo uploads are saved securely to your account profile.</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className={dashboardSecondaryButtonClass}>
                  <Upload size={15} />
                  <span className="ml-2">{saving ? 'Uploading...' : 'Upload picture'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={saving} />
                </label>
                <button onClick={removeAvatar} disabled={saving} className={dashboardSecondaryButtonClass}>Remove picture</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <DashboardFieldLabel>First Name</DashboardFieldLabel>
              <input type="text" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} className={dashboardInputClass} />
            </div>
            <div>
              <DashboardFieldLabel>Last Name</DashboardFieldLabel>
              <input type="text" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} className={dashboardInputClass} />
            </div>
          </div>

          <div>
            <DashboardFieldLabel>Email</DashboardFieldLabel>
            <div className={dashboardInlineFieldClass}>
              <Mail size={16} className="text-text-secondary" />
              <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className={dashboardInlineInputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <DashboardFieldLabel>Studio / Company</DashboardFieldLabel>
              <div className={dashboardInlineFieldClass}>
                <Building size={16} className="text-text-secondary" />
                <input type="text" value={form.companyName} onChange={(e) => updateField('companyName', e.target.value)} placeholder="Your studio or brand" className={dashboardInlineInputClass} />
              </div>
            </div>
            <div>
              <DashboardFieldLabel>Phone</DashboardFieldLabel>
              <div className={dashboardInlineFieldClass}>
                <Phone size={16} className="text-text-secondary" />
                <input type="tel" value={form.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} placeholder="Optional" className={dashboardInlineInputClass} />
              </div>
            </div>
          </div>

          <div>
            <DashboardFieldLabel>Industry</DashboardFieldLabel>
            <div className={dashboardInlineFieldClass}>
              <Briefcase size={16} className="text-text-secondary" />
              <input type="text" value={form.industry} onChange={(e) => updateField('industry', e.target.value)} placeholder="Fashion, jewelry, e-commerce..." className={dashboardInlineInputClass} />
            </div>
          </div>

          {status && <div className={dashboardNoticeClass(status.type)}>{status.text}</div>}

          <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button onClick={saveProfile} disabled={saving} className={dashboardPrimaryButtonClass}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={clearProfileData} disabled={saving} className={`${dashboardSecondaryButtonClass} gap-2`}>
              <Trash2 size={15} /> Clear optional data
            </button>
          </div>

          <div className="border-t border-borderSubtle pt-8">
            <h2 className={dashboardSectionTitleClass}>
              <span className="flex items-center gap-2"><Bell size={16} />Email Notifications</span>
            </h2>
            <p className={dashboardSectionDescriptionClass}>Choose which updates Reframe sends to your inbox.</p>
            <div className="mt-4 space-y-3">
              {([
                { key: 'proposalSent', label: 'Pricing proposal ready', desc: 'When the team sends a quote for your review' },
                { key: 'assetsReady', label: 'Assets ready for review', desc: 'When edited files are delivered to your portal' },
                { key: 'orderComplete', label: 'Order finalized', desc: 'When you approve and the project closes' },
                { key: 'revisionUpdate', label: 'Revision processed', desc: 'When revised assets are re-delivered' },
              ] as { key: keyof NotifPrefs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-start justify-between gap-4 rounded-xl border border-borderSubtle px-4 py-3">
                  <div>
                    <div className="text-[13px] font-medium text-text-primary">{label}</div>
                    <div className="text-[12px] text-text-secondary mt-0.5">{desc}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifPrefs[key]}
                    onClick={() => toggleNotif(key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${notifPrefs[key] ? 'bg-brand-ink' : 'bg-black/10'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ${notifPrefs[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-black/30">
              Preferences are saved to this browser. To change email delivery settings across devices, contact support.
            </p>
          </div>

          <div className="border-t border-borderSubtle pt-8">
            <h2 className={dashboardSectionTitleClass}>Security Essentials</h2>
            <p className={dashboardSectionDescriptionClass}>
              Password and advanced security controls are managed by our support team.
            </p>
            <div className="mb-8 rounded-2xl border border-dashed border-borderLight bg-bg-secondary px-4 py-5 text-[13px] text-text-secondary">
              To change your password, set up MFA, or manage active sessions,{' '}
              <a href="mailto:support@reframevisuals.com" className="font-medium text-text-primary underline underline-offset-2">
                contact support
              </a>
              {' '}and we'll assist you within 24 hours.
            </div>

            <h2 className={dashboardSectionTitleClass}>Integrations</h2>
            <p className={dashboardSectionDescriptionClass}>Storefront and cloud storage integrations are coming soon. <a href="mailto:support@reframevisuals.com" className="font-medium text-text-primary underline underline-offset-2">Let us know</a> which integrations you need.</p>
          </div>
        </div>
      </div>
  );
};

export default AccountView;
