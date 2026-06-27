import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>

        <div className="auth-header">
          <p className="auth-brand">✦ Al-Noor Collection ✦</p>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join our modest fashion community</p>
        </div>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <div className="field-group">
            <label>Full Name</label>
            <input type="text" placeholder="Your full name" />
          </div>

          <div className="field-group">
            <label>Gmail Address</label>
            <div className="input-row">
              <input type="email" placeholder="you@gmail.com" />
              <button
                type="button"
                className="btn-otp"
                onClick={() => setOtpSent(true)}
              >
                {otpSent ? 'Resend' : 'Send OTP'}
              </button>
            </div>
          </div>

          {otpSent && (
            <div className="field-group otp-group">
              <label>Enter OTP sent to your Gmail</label>
              <input type="text" placeholder="6-digit OTP" maxLength={6} />
              <p className="otp-note">✦ Check your Gmail inbox for the verification code</p>
            </div>
          )}

          <div className="field-group">
            <label>Password</label>
            <input type="password" placeholder="Create a strong password" />
          </div>

          <button type="submit" className="btn-primary">Create Account</button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/login')}>Sign In</span>
        </p>
      </div>
    </div>
  );
}
