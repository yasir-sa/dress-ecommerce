import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../services/authService';
import './ForgotPassword.css';

type Step = 'email' | 'reset';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setError('');
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    if (res.message?.toLowerCase().includes('otp sent')) {
      setStep('reset');
    } else {
      setError(res.message || 'Something went wrong.');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) { setError('All fields are required.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    const res = await resetPassword(email, otp, newPassword, confirmPassword);
    setLoading(false);
    if (res.expired) {
      setError('OTP expired. Please request a new OTP.');
      setStep('email');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      return;
    }
    if (res.message?.includes('successfully')) {
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(res.message || 'Reset failed.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="back-btn" onClick={() => navigate('/login')}>← Back to Login</button>

        <div className="auth-header">
          <p className="auth-brand">✦ Al-Noor Collection ✦</p>
          <span className="auth-role-tag">Admin</span>
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">
            {step === 'email'
              ? 'Enter your Gmail to receive an OTP'
              : 'Enter the OTP sent to your Gmail and set a new password'}
          </p>
        </div>

        <div className="fp-steps">
          <div className={`fp-step ${step === 'email' ? 'active' : 'done'}`}>1. Email</div>
          <div className="fp-step-line" />
          <div className={`fp-step ${step === 'reset' ? 'active' : ''}`}>2. Reset</div>
        </div>

        {success ? (
          <div className="fp-success">
            <p className="fp-success-icon">✓</p>
            <p>{success}</p>
          </div>
        ) : (
          <>
            {step === 'email' && (
              <form className="auth-form" onSubmit={handleSendOtp}>
                <div className="field-group">
                  <label>Gmail Address</label>
                  <input
                    type="email"
                    placeholder="your registered gmail"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                  />
                </div>
                {error && <p className="auth-error">{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {step === 'reset' && (
              <form className="auth-form" onSubmit={handleReset}>
                <div className="field-group otp-group">
                  <label>OTP sent to {email}</label>
                  <input
                    type="text"
                    placeholder="6-digit OTP"
                    maxLength={6}
                    value={otp}
                    onChange={e => { setOtp(e.target.value); setError(''); }}
                  />
                  <p className="otp-note">✦ Valid for 1 minute only</p>
                </div>
                <div className="field-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setError(''); }}
                  />
                </div>
                <div className="field-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Retype new password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                  />
                </div>
                {error && <p className="auth-error">{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  className="btn-resend"
                  onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                >
                  Resend OTP
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
