import { Link } from 'react-router-dom';
import { House, LogOut, ReceiptText, ShoppingBasket } from 'lucide-react';
import ColorfulBackground from './ColorfulBackground.jsx';
import BlendedLogo from './BlendedLogo.jsx';
import PageNav from './PageNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { ROLES, displayName } from '../utils/roles.js';

export default function DashboardLayout({ children, crumb, trail }) {
  const { user, logout } = useAuth();
  const cart = useCart();
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
          {isRestaurant ? (
            <Link to="/restaurant?tab=orders" className="nav__link nav__link--keep" aria-label="Orders">
              <ReceiptText size={16} aria-hidden="true" /> <span className="hide-sm">Orders</span>
            </Link>
          ) : (
            <>
              <Link to="/orders" className="nav__link nav__link--keep" aria-label="My orders">
                <ReceiptText size={16} aria-hidden="true" /> <span className="hide-sm">My orders</span>
              </Link>
              {cart.count > 0 && (
                <Link
                  to="/checkout"
                  className="nav__cart"
                  aria-label={`Cart, ${cart.count} ${cart.count === 1 ? 'item' : 'items'}`}
                >
                  <ShoppingBasket size={18} aria-hidden="true" />
                  <span className="nav__cart-count">{cart.count}</span>
                </Link>
              )}
            </>
          )}
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
        <PageNav
          current={crumb ?? (isRestaurant ? 'My restaurant' : 'Restaurants')}
          trail={trail}
          fallback={trail?.length ? trail[trail.length - 1].to : '/'}
          className="page-nav--dashboard"
        />
        {children}
      </main>
    </div>
  );
}
