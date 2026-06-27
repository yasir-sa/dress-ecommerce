import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerAdmin, verifyOtp } from '../../services/authService';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popup, setPopup] = useState('');

  const handleSendOtp = async () => {
    if (!name || !email || !password) {
      setError('Please fill name, email and password first.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await registerAdmin(name, email, password);
    setLoading(false);
    if (res.message && !res.expired) {
      if (res.message.toLowerCase().includes('otp sent')) {
        setOtpSent(true);
        setError('');
      } else {
        setError(res.message);
      }
    } else {
      setError(res.message || 'Something went wrong.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) { setError('Please enter the OTP.'); return; }
    setError('');
    setLoading(true);
    const res = await verifyOtp(email, otp);
    setLoading(false);
    if (res.expired) {
      setPopup('OTP expired! Registration cancelled. Please register again.');
      setOtpSent(false);
      setOtp('');
      return;
    }
    if (res.admin) {
      navigate('/admin');
    } else {
      setError(res.message || 'Verification failed.');
    }
  };

  const closePopup = () => {
    setPopup('');
    setName('');
    setEmail('');
    setPassword('');
    setOtp('');
  };

  return (
    <div className="auth-page">
      {popup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p className="popup-icon">⏱</p>
            <p className="popup-msg">{popup}</p>
            <button className="popup-btn" onClick={closePopup}>Try Again</button>
          </div>
        </div>
      )}

      <div className="auth-card">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>

        <div className="auth-header">
          <p className="auth-brand">✦ Al-Noor Collection ✦</p>
          <span className="auth-role-tag">Admin Register</span>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Register your admin account</p>
        </div>

        <form className="auth-form" onSubmit={handleVerifyOtp}>
          <div className="field-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={otpSent}
            />
          </div>

          <div className="field-group">
            <label>Gmail Address</label>
            <div className="input-row">
              <input
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={otpSent}
              />
              <button
                type="button"
                className="btn-otp"
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading && !otpSent ? '...' : otpSent ? 'Resend' : 'Send OTP'}
              </button>
            </div>
          </div>

          <div className="field-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={otpSent}
            />
          </div>

          {otpSent && (
            <div className="field-group otp-group">
              <label>Enter OTP sent to your Gmail</label>
              <input
                type="text"
                placeholder="6-digit OTP"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
              />
              <p className="otp-note">✦ Valid for 1 minute only — check your Gmail inbox</p>
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          {otpSent && (
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          )}
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/login')}>Sign In</span>
        </p>
      </div>
    </div>
  );
}
