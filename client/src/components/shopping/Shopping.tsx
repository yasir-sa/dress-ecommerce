import { useNavigate } from 'react-router-dom';
import './Shopping.css';

export default function Shopping() {
  const navigate = useNavigate();
  const isLoggedIn = false; // API call later

  return (
    <div className="shop-page">

      {/* Navbar */}
      <nav className="shop-nav">
        <div className="shop-nav-logo" onClick={() => navigate('/')}>✦ Al-Noor Collection</div>
        <div className="shop-nav-links">
          <span onClick={() => navigate('/')}>Home</span>
          <span>Collections</span>
          <span>About</span>
          <span>Contact</span>
        </div>
        <div className="shop-nav-auth">
          {isLoggedIn ? (
            <>
              <button className="shop-btn-outline">My Account</button>
              <button className="shop-btn-solid">Logout</button>
            </>
          ) : (
            <>
              <button className="shop-btn-outline" onClick={() => navigate('/customer/login')}>Login</button>
              <button className="shop-btn-solid" onClick={() => navigate('/customer/register')}>Register</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="shop-hero">
        <div className="shop-hero-content">
          <p className="shop-hero-tag">✦ New Collection 2025 ✦</p>
          <h1>Modest Fashion<br /><span>Redefined</span></h1>
          <p className="shop-hero-sub">Premium Abayas & Purdah crafted with elegance, comfort and faith</p>
          <div className="shop-hero-btns">
            <button className="shop-btn-hero">Shop Collection</button>
            <button className="shop-btn-hero-outline">View Lookbook</button>
          </div>
        </div>
        <div className="shop-hero-badge">
          <span>MODESTY</span>
          <span className="dot">·</span>
          <span>ELEGANCE</span>
          <span className="dot">·</span>
          <span>FAITH</span>
        </div>
      </section>

      {/* Categories */}
      <section className="shop-categories">
        <h2 className="shop-section-title">Shop by Category</h2>
        <div className="shop-divider" />
        <div className="shop-cat-grid">
          {['Abaya', 'Purdah', 'Hijab', 'Accessories'].map(cat => (
            <div key={cat} className="shop-cat-card">
              <div className="shop-cat-icon">👗</div>
              <h3>{cat}</h3>
              <p>Explore Collection →</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="shop-featured">
        <h2 className="shop-section-title">Featured Products</h2>
        <div className="shop-divider" />
        <div className="shop-products-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="shop-product-card">
              <div className="shop-product-img">
                <span>✦</span>
              </div>
              <div className="shop-product-info">
                <h4>Premium Abaya {i}</h4>
                <p className="shop-product-price">₹2,499</p>
                <button className="shop-btn-cart">Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="shop-footer">
        <p className="shop-footer-logo">✦ Al-Noor Collection ✦</p>
        <p className="shop-footer-sub">Modest Fashion for the Modern Muslimah</p>
        <p className="shop-footer-copy">© 2025 Al-Noor Collection. All rights reserved.</p>
      </footer>

    </div>
  );
}
