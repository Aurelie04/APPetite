import { Link } from 'react-router-dom';
import { House, LogOut } from 'lucide-react';
import ColorfulBackground from './ColorfulBackground.jsx';
import BlendedLogo from './BlendedLogo.jsx';
import PageNav from './PageNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES, displayName } from '../utils/roles.js';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const isRestaurant = user?.role === ROLES.RESTAURANT;

  return (
    <div className="page page--dashboard">
      <ColorfulBackground />
      <header className="nav nav--dashboard">
        <Link to="/dashboard" className="nav__brand">
          <BlendedLogo size={46} className="logo--mini" />
          <span className="nav__name">Appétite</span>
        </Link>
        <div className="nav__actions">
          <Link to="/" className="nav__link">
            <House size={16} aria-hidden="true" /> <span className="hide-sm">Home</span>
          </Link>
          <div className="user-chip">
            <span className="user-chip__avatar" aria-hidden="true">
              {displayName(user).charAt(0).toUpperCase()}
            </span>
            <span className="user-chip__text">
              <strong>{displayName(user)}</strong>
              <small className={`role-pill ${isRestaurant ? 'role-pill--restaurant' : 'role-pill--client'}`}>
                {isRestaurant ? 'Restaurant admin' : 'Client'}
              </small>
            </span>
          </div>
          <button type="button" className="btn btn--ghost" onClick={logout}>
            <LogOut size={16} /> <span className="hide-sm">Sign out</span>
          </button>
        </div>
      </header>
      <main className="dashboard">
        <PageNav current={isRestaurant ? 'My restaurant' : 'Restaurants'} className="page-nav--dashboard" />
        {children}
      </main>
    </div>
  );
}
