import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../../services/authService';
import { getCustomerMe } from '../../services/customerService';
import './Home.css';

export default function Home() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getMe().then(res => { if (res.admin) setIsAdminLoggedIn(true); });
    getCustomerMe().then(res => { if (res.user) setIsCustomerLoggedIn(true); });
  }, []);

  return (
    <div className="home">
      <div className="home-content">
        <p className="home-logo">✦ Al-Noor Collection ✦</p>
        <h1 className="home-title">
          Modest Fashion for the <span>Modern Muslimah</span>
        </h1>
        <div className="home-divider" />
        <p className="home-subtitle">
          Discover our exclusive collection of premium Purdah &amp; Abaya designs —
          crafted with elegance, comfort, and faith in every thread.
        </p>
        <div className="home-buttons">
          <button className="btn-user" onClick={() => navigate(isCustomerLoggedIn ? '/customer/dashboard' : '/customer/login')}>
            Shop Now
          </button>
          <button className="btn-admin" onClick={() => navigate(isAdminLoggedIn ? '/admin' : '/login')}>
            {isAdminLoggedIn ? 'Go to Dashboard' : 'Admin Portal'}
          </button>
        </div>
      </div>
      <p className="home-footer">MODESTY · ELEGANCE · FAITH</p>
    </div>
  );
}
