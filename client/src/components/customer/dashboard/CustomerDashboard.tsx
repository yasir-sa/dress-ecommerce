import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerMe, logoutCustomer } from '../../../services/customerService';
import './CustomerDashboard.css';

interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    getCustomerMe().then(res => {
      if (res.user) {
        setCustomer(res.user);
      } else {
        navigate('/customer/login');
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await logoutCustomer();
    navigate('/customer/login');
  };

  return (
    <div className="cdash-page">

      {/* Navbar */}
      <nav className="cdash-nav">
        <div className="cdash-logo">✦ Al-Noor Collection</div>
        <div className="cdash-nav-links">
          <span>Home</span>
          <span>Collections</span>
          <span>My Orders</span>
          <span>About</span>
        </div>
        <div className="cdash-nav-right">
          <div className="cdash-profile">
            {customer?.profile_image ? (
              <img src={customer.profile_image} className="cdash-avatar-img" alt="avatar" />
            ) : (
              <div className="cdash-avatar">👤</div>
            )}
            <span className="cdash-username">{customer?.name || 'My Account'}</span>
          </div>
          <button className="cdash-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="cdash-hero">
        <div className="cdash-hero-content">
          <p className="cdash-hero-tag">✦ New Collection 2025 ✦</p>
          <h1>Modest Fashion<br /><span>Redefined</span></h1>
          <p className="cdash-hero-sub">Premium Abayas & Purdah crafted with elegance, comfort and faith</p>
          <div className="cdash-hero-btns">
            <button className="cdash-btn-primary">Shop Collection</button>
            <button className="cdash-btn-outline">View Lookbook</button>
          </div>
        </div>
        <div className="cdash-hero-badge">
          <span>MODESTY</span><span className="dot">·</span>
          <span>ELEGANCE</span><span className="dot">·</span>
          <span>FAITH</span>
        </div>
      </section>

      {/* Categories */}
      <section className="cdash-section">
        <h2 className="cdash-section-title">Shop by Category</h2>
        <div className="cdash-divider" />
        <div className="cdash-cat-grid">
          {['Abaya', 'Purdah', 'Hijab', 'Accessories'].map(cat => (
            <div key={cat} className="cdash-cat-card">
              <div className="cdash-cat-icon">👗</div>
              <h3>{cat}</h3>
              <p>Explore →</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="cdash-section">
        <h2 className="cdash-section-title">Featured Products</h2>
        <div className="cdash-divider" />
        <div className="cdash-products-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="cdash-product-card">
              <div className="cdash-product-img"><span>✦</span></div>
              <div className="cdash-product-info">
                <h4>Premium Abaya {i}</h4>
                <p className="cdash-price">₹2,499</p>
                <button className="cdash-btn-cart">Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="cdash-footer">
        <p className="cdash-footer-logo">✦ Al-Noor Collection ✦</p>
        <p className="cdash-footer-sub">Modest Fashion for the Modern Muslimah</p>
        <p className="cdash-footer-copy">© 2025 Al-Noor Collection. All rights reserved.</p>
      </footer>

    </div>
  );
}
