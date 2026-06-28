import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerCustomer, verifyCustomerOtp, customerGoogleLogin } from '../../../services/customerService';
import './CustomerRegister.css';

type Step = 'form' | 'otp';

export default function CustomerRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    const res = await registerCustomer(name, email, password);
    setLoading(false);
    if (res.message?.toLowerCase().includes('otp')) {
      setStep('otp');
    } else {
      setError(res.message || 'Something went wrong.');
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    const res = await verifyCustomerOtp(email, otp);
    setLoading(false);
    if (res.user) {
      navigate('/customer/dashboard');
    } else if (res.expired) {
      setError('OTP expired. Please register again.');
      setStep('form');
      setOtp('');
    } else {
      setError(res.message || 'Invalid OTP.');
    }
  };

  return (
    <div className="cust-auth-page">
      <div className="cust-auth-card">
        <button className="cust-back-btn" onClick={() => step === 'otp' ? setStep('form') : navigate('/')}>
          ← {step === 'otp' ? 'Back' : 'Back to Home'}
        </button>

        <div className="cust-auth-header">
          <p className="cust-brand">✦ Al-Noor Collection ✦</p>
          <h2 className="cust-auth-title">Create Account</h2>
          <p className="cust-auth-sub">Join us for exclusive collections</p>
        </div>

        <div className="cust-steps">
          <span className={`cust-step ${step === 'form' ? 'active' : 'done'}`}>1. Details</span>
          <span className="cust-step-line" />
          <span className={`cust-step ${step === 'otp' ? 'active' : ''}`}>2. Verify OTP</span>
        </div>

        {error && <p className="cust-error">{error}</p>}

        {step === 'form' && (
          <form className="cust-auth-form" onSubmit={e => { e.preventDefault(); handleRegister(); }}>
            <div className="cust-field">
              <label>Full Name</label>
              <input type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="cust-field">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="cust-field">
              <label>Password</label>
              <input type="password" placeholder="Create a password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" className="cust-btn-primary" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <div className="cust-auth-form">
            <div className="cust-otp-info">
              <p>OTP sent to <strong>{email}</strong></p>
              <p className="cust-otp-note">✦ Valid for 1 minute only</p>
            </div>
            <div className="cust-field">
              <label>Enter OTP</label>
              <input type="text" placeholder="6-digit OTP" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
            </div>
            <button className="cust-btn-primary" onClick={handleVerify} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Register'}
            </button>
            <button className="cust-btn-ghost" onClick={() => { setStep('form'); setOtp(''); setError(''); }}>
              ← Resend OTP
            </button>
          </div>
        )}

        <div className="cust-divider"><span>or continue with</span></div>

        <button className="cust-btn-google" onClick={customerGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <p className="cust-auth-switch">
          Already have an account?{' '}
          <span onClick={() => navigate('/customer/login')}>Sign In</span>
        </p>
      </div>
    </div>
  );
}
