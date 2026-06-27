import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutAdmin, getMe, setPassword, createAdmin, verifyNewAdmin, listAdmins, toggleAdminAccess, toggleRegisterPermission, deleteAdmin } from '../../services/authService';
import './Admin.css';

interface AdminInfo {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
  provider: string;
  role: string;
  has_password: boolean;
  can_register_admin: boolean;
}

interface ManagedAdmin {
  id: string;
  name: string;
  email: string;
  provider: string;
  role: string;
  can_access_admin_panel: boolean;
  can_register_admin: boolean;
  is_active: boolean;
  email_verified: boolean;
}

type PopupStep = 'form' | 'otp';

export default function Admin() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // password setup
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // create admin popup
  const [showPopup, setShowPopup] = useState(false);
  const [popupStep, setPopupStep] = useState<PopupStep>('form');
  const [caName, setCaName] = useState('');
  const [caEmail, setCaEmail] = useState('');
  const [caPassword, setCaPassword] = useState('');
  const [caCanRegister, setCaCanRegister] = useState(false);
  const [caCanAccess, setCaCanAccess] = useState(true);
  const [caOtp, setCaOtp] = useState('');
  const [caLoading, setCaLoading] = useState(false);
  const [caError, setCaError] = useState('');

  // manage admins
  const [adminList, setAdminList] = useState<ManagedAdmin[]>([]);
  const [adminListLoading, setAdminListLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [registerToggleLoading, setRegisterToggleLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // success toast
  const [toast, setToast] = useState('');

  useEffect(() => {
    getMe().then(res => {
      if (res.admin) setAdmin(res.admin);
      else navigate('/login');
    });
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/');
  };

  const handleSetPassword = async () => {
    if (!newPassword) { setPwMsg('Please enter a password.'); return; }
    setPwLoading(true);
    const res = await setPassword(newPassword);
    setPwLoading(false);
    setPwMsg(res.message);
    if (res.message?.includes('successfully')) {
      setAdmin(prev => prev ? { ...prev, has_password: true } : prev);
      setNewPassword('');
    }
  };

  const fetchAdminList = async () => {
    setAdminListLoading(true);
    const res = await listAdmins();
    setAdminListLoading(false);
    if (res.admins) setAdminList(res.admins);
  };

  const handleToggleRegister = async (id: string, current: boolean) => {
    setRegisterToggleLoading(id);
    const res = await toggleRegisterPermission(id, !current);
    setRegisterToggleLoading(null);
    if (res.admin) {
      setAdminList(prev => prev.map(a => a.id === id ? { ...a, can_register_admin: !current } : a));
      showToast(res.message);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!window.confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
    setDeleteLoading(id);
    const res = await deleteAdmin(id);
    setDeleteLoading(null);
    if (res.message?.includes('successfully')) {
      setAdminList(prev => prev.filter(a => a.id !== id));
      showToast(`✓ Admin "${name}" deleted.`);
    }
  };

  const handleToggleAccess = async (id: string, current: boolean) => {
    setToggleLoading(id);
    const res = await toggleAdminAccess(id, !current);
    setToggleLoading(null);
    if (res.admin) {
      setAdminList(prev => prev.map(a => a.id === id ? { ...a, can_access_admin_panel: !current } : a));
      showToast(res.message);
    }
  };

  const resetPopup = () => {
    setShowPopup(false);
    setPopupStep('form');
    setCaName(''); setCaEmail(''); setCaPassword('');
    setCaCanRegister(false); setCaCanAccess(true);
    setCaOtp(''); setCaError('');
  };

  const handleCreateAdminSendOtp = async () => {
    if (!caName || !caEmail || !caPassword) { setCaError('All fields are required.'); return; }
    setCaError('');
    setCaLoading(true);
    const res = await createAdmin({ name: caName, email: caEmail, password: caPassword, can_register_admin: caCanRegister, can_access_admin_panel: caCanAccess });
    setCaLoading(false);
    if (res.message?.toLowerCase().includes('otp sent')) {
      setPopupStep('otp');
    } else {
      setCaError(res.message || 'Something went wrong.');
    }
  };

  const handleVerifyNewAdmin = async () => {
    if (!caOtp) { setCaError('Please enter the OTP.'); return; }
    setCaError('');
    setCaLoading(true);
    const res = await verifyNewAdmin(caEmail, caOtp);
    setCaLoading(false);
    if (res.expired) {
      setCaError('OTP expired. Admin creation cancelled. Please try again.');
      setPopupStep('form');
      setCaOtp('');
      return;
    }
    if (res.admin) {
      resetPopup();
      showToast(`✓ Admin "${res.admin.name}" created successfully!`);
    } else {
      setCaError(res.message || 'Verification failed.');
    }
  };

  return (
    <div className="admin-page">

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Create Admin Popup */}
      {showPopup && (
        <div className="popup-overlay" onClick={e => e.target === e.currentTarget && resetPopup()}>
          <div className="popup-modal">
            <div className="popup-header">
              <h3>Create New Admin</h3>
              <button className="popup-close" onClick={resetPopup}>✕</button>
            </div>

            <div className="popup-steps">
              <span className={`popup-step ${popupStep === 'form' ? 'active' : 'done'}`}>1. Details</span>
              <span className="popup-step-line" />
              <span className={`popup-step ${popupStep === 'otp' ? 'active' : ''}`}>2. Verify OTP</span>
            </div>

            {popupStep === 'form' && (
              <div className="popup-body">
                <div className="field-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Admin full name" value={caName} onChange={e => { setCaName(e.target.value); setCaError(''); }} />
                </div>
                <div className="field-group">
                  <label>Gmail Address</label>
                  <input type="email" placeholder="admin@gmail.com" value={caEmail} onChange={e => { setCaEmail(e.target.value); setCaError(''); }} />
                </div>
                <div className="field-group">
                  <label>Password</label>
                  <input type="password" placeholder="Set a password" value={caPassword} onChange={e => { setCaPassword(e.target.value); setCaError(''); }} />
                </div>

                {admin?.role === 'MAIN' ? (
                  <div className="popup-permissions">
                    <p className="popup-perm-title">Permissions</p>
                    <label className="perm-row">
                      <input type="checkbox" checked={caCanAccess} onChange={e => setCaCanAccess(e.target.checked)} />
                      <span>Can access Admin Dashboard</span>
                    </label>
                  </div>
                ) : (
                  <div className="popup-permissions">
                    <p className="popup-perm-title" style={{ color: '#aaa', fontSize: '0.8rem' }}>
                      ✦ Permissions are set by the Main Admin only
                    </p>
                  </div>
                )}

                {caError && <p className="popup-error">{caError}</p>}
                <button className="popup-btn-primary" onClick={handleCreateAdminSendOtp} disabled={caLoading}>
                  {caLoading ? 'Sending OTP...' : 'Send OTP to Email'}
                </button>
              </div>
            )}

            {popupStep === 'otp' && (
              <div className="popup-body">
                <div className="otp-info-box">
                  <p>OTP sent to <strong>{caEmail}</strong></p>
                  <p className="otp-note">✦ Valid for 1 minute only</p>
                </div>
                <div className="field-group">
                  <label>Enter OTP</label>
                  <input type="text" placeholder="6-digit OTP" maxLength={6} value={caOtp} onChange={e => { setCaOtp(e.target.value); setCaError(''); }} />
                </div>
                {caError && <p className="popup-error">{caError}</p>}
                <button className="popup-btn-primary" onClick={handleVerifyNewAdmin} disabled={caLoading}>
                  {caLoading ? 'Verifying...' : 'Verify & Create Admin'}
                </button>
                <button className="popup-btn-ghost" onClick={() => { setPopupStep('form'); setCaOtp(''); setCaError(''); }}>
                  ← Back / Resend OTP
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="admin-header">
        <div className="admin-brand">
          <span className="admin-logo">✦ Al-Noor</span>
          <span className="admin-tag">Admin Portal</span>
        </div>
        <div className="admin-header-actions">
          {admin && (
            <div className="profile-trigger" ref={profileRef} onClick={() => setShowProfile(p => !p)}>
              {admin.profile_image
                ? <img src={admin.profile_image} className="profile-avatar" alt="profile" referrerPolicy="no-referrer" />
                : <div className="profile-initials">{admin.name.charAt(0).toUpperCase()}</div>
              }

              {showProfile && (
                <div className="profile-card" onClick={e => e.stopPropagation()}>
                  <div className="profile-card-avatar">
                    {admin.profile_image
                      ? <img src={admin.profile_image} alt="profile" referrerPolicy="no-referrer" />
                      : <div className="profile-initials-lg">{admin.name.charAt(0).toUpperCase()}</div>
                    }
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <p className="profile-card-name" style={{ margin: 0 }}>{admin.name}</p>
                    {admin.role === 'MAIN' && <span className="role-badge-main">MAIN</span>}
                  </div>
                  <p className="profile-card-email">{admin.email}</p>
                  <span className={`profile-card-provider ${admin.provider === 'GOOGLE' ? 'google' : 'manual'}`}>
                    {admin.provider === 'GOOGLE' ? '🔵 Google' : '🔑 Manual'}
                  </span>
                </div>
              )}
            </div>
          )}
          <button className="btn-home" onClick={() => navigate('/')}>Home</button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-welcome">
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-subtitle">Manage your Al-Noor Collection store</p>
          <div className="admin-divider" />
        </div>

        <div className="admin-cards">
          <div className="admin-card"><div className="card-icon">👗</div><h3>Products</h3><p>Manage your Abaya & Purdah collection</p></div>
          <div className="admin-card"><div className="card-icon">📦</div><h3>Orders</h3><p>View and manage customer orders</p></div>
          <div className="admin-card"><div className="card-icon">👥</div><h3>Customers</h3><p>View registered customers</p></div>
          <div className="admin-card"><div className="card-icon">📊</div><h3>Analytics</h3><p>Sales and performance reports</p></div>
          <div className="admin-card settings-card" onClick={() => setShowSettings(s => !s)}>
            <div className="card-icon">⚙️</div><h3>Settings</h3><p>Account & security options</p>
          </div>
        </div>

        {showSettings && admin && (
          <div className="settings-panel">
            <h2 className="settings-title">⚙️ Settings</h2>
            <div className="settings-divider" />

            {/* Password Setup */}
            {admin.provider === 'GOOGLE' && (
              <div className="settings-item">
                <div className="settings-item-info">
                  <span className="settings-item-label">Password Setup</span>
                  <span className="settings-item-desc">{admin.has_password ? 'Manual password already set.' : 'Set a password to also login manually.'}</span>
                </div>
                {admin.has_password ? (
                  <span className="settings-badge success">✓ Password Set</span>
                ) : (
                  <div className="settings-pw-form">
                    <input type="password" placeholder="Enter new password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPwMsg(''); }} className="settings-input" />
                    <button className="settings-btn" onClick={handleSetPassword} disabled={pwLoading}>{pwLoading ? 'Saving...' : 'Set Password'}</button>
                    {pwMsg && <p className={`settings-msg ${pwMsg.includes('successfully') ? 'success' : 'error'}`}>{pwMsg}</p>}
                  </div>
                )}
              </div>
            )}
            {admin.provider === 'MANUAL' && (
              <div className="settings-item">
                <div className="settings-item-info">
                  <span className="settings-item-label">Password Setup</span>
                  <span className="settings-item-desc">You registered manually — password already set.</span>
                </div>
                <span className="settings-badge success">✓ Password Set</span>
              </div>
            )}

            {/* Create Admin — MAIN or delegated (can_register_admin) */}
            {(admin.role === 'MAIN' || admin.can_register_admin) && (
              <>
                <div className="settings-divider" style={{ marginTop: '1.5rem' }} />

                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="settings-item-label">Create New Admin</span>
                    <span className="settings-item-desc">Register a new admin and set their permissions.</span>
                  </div>
                  <button className="settings-btn" onClick={() => setShowPopup(true)}>+ Create Admin</button>
                </div>
              </>
            )}

            {/* Manage Admins — MAIN only */}
            {admin.role === 'MAIN' && (
              <>
                <div className="settings-divider" style={{ marginTop: '1.2rem' }} />

                <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                  <div className="settings-item-info">
                    <span className="settings-item-label">Manage Admin Access</span>
                    <span className="settings-item-desc">Allow or revoke dashboard access for each admin.</span>
                  </div>
                  <button
                    className="settings-btn-outline"
                    onClick={fetchAdminList}
                    disabled={adminListLoading}
                  >
                    {adminListLoading ? 'Loading...' : adminList.length ? 'Refresh List' : 'View Admins'}
                  </button>

                  {adminList.length > 0 && (
                    <div className="admin-list">
                      {adminList.map(a => (
                        <div key={a.id} className="admin-list-row">
                          <div className="admin-list-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="admin-list-name">{a.name}</span>
                              {a.role === 'MAIN' && <span className="role-badge-main">MAIN</span>}
                            </div>
                            <span className="admin-list-email">{a.email}</span>
                            {!a.email_verified && <span className="badge-unverified">Unverified</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              className={`toggle-btn ${a.can_access_admin_panel ? 'allow' : 'revoked'}`}
                              onClick={() => handleToggleAccess(a.id, a.can_access_admin_panel)}
                              disabled={toggleLoading === a.id}
                            >
                              {toggleLoading === a.id ? '...' : a.can_access_admin_panel ? 'Dashboard Allow ✓' : 'Dashboard Revoked ✕'}
                            </button>
                            <button
                              className={`toggle-btn ${a.can_register_admin ? 'allow' : 'revoked'}`}
                              onClick={() => handleToggleRegister(a.id, a.can_register_admin)}
                              disabled={registerToggleLoading === a.id}
                            >
                              {registerToggleLoading === a.id ? '...' : a.can_register_admin ? 'Register Allow ✓' : 'Register Revoked ✕'}
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteAdmin(a.id, a.name)}
                              disabled={deleteLoading === a.id}
                            >
                              {deleteLoading === a.id ? '...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
