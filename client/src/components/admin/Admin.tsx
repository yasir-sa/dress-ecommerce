import { useNavigate } from 'react-router-dom';
import './Admin.css';

export default function Admin() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <span className="admin-logo">✦ Al-Noor</span>
          <span className="admin-tag">Admin Portal</span>
        </div>
        <div className="admin-header-actions">
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
          <div className="admin-card">
            <div className="card-icon">👗</div>
            <h3>Products</h3>
            <p>Manage your Abaya & Purdah collection</p>
          </div>
          <div className="admin-card">
            <div className="card-icon">📦</div>
            <h3>Orders</h3>
            <p>View and manage customer orders</p>
          </div>
          <div className="admin-card">
            <div className="card-icon">👥</div>
            <h3>Customers</h3>
            <p>View registered customers</p>
          </div>
          <div className="admin-card">
            <div className="card-icon">📊</div>
            <h3>Analytics</h3>
            <p>Sales and performance reports</p>
          </div>
        </div>
      </main>
    </div>
  );
}
