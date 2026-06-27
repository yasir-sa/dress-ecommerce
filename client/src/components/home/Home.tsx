import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const [isAdminLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleAdminClick = () => {
    if (isAdminLoggedIn) {
      navigate('/admin');
    } else {
      navigate('/login');
    }
  };

  const handleUserLogin = () => {
    navigate('/login');
  };

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
          <button className="btn-user" onClick={handleUserLogin}>
            Shop Now
          </button>
          <button className="btn-admin" onClick={handleAdminClick}>
            Admin Portal
          </button>
        </div>
      </div>
      <p className="home-footer">MODESTY · ELEGANCE · FAITH</p>
    </div>
  );
}
