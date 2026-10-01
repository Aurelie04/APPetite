import { Link } from 'react-router-dom';
import { BadgePercent, Clock, Flame, LayoutDashboard, Leaf, LogOut, Star, Store, Truck } from 'lucide-react';
import ColorfulBackground from '../components/ColorfulBackground.jsx';
import BlendedLogo from '../components/BlendedLogo.jsx';
import LoginForm from '../components/LoginForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES, dashboardPath, displayName } from '../utils/roles.js';

const FEATURES = [
  { icon: Truck, label: 'Fast delivery', tone: 'orange' },
  { icon: Leaf, label: 'Fresh ingredients', tone: 'green' },
  { icon: BadgePercent, label: 'Daily deals', tone: 'pink' },
];

const STATS = [
  { value: '50+', label: 'Restaurants' },
  { value: 'On time', label: 'Every delivery' },
  { value: '4.9', label: 'Customer rating', icon: Star },
];

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const isRestaurant = user?.role === ROLES.RESTAURANT;

  return (
    <div className="page page--landing">
      <ColorfulBackground />

      <header className="nav">
        <Link to="/" className="nav__brand">
          <BlendedLogo size={46} className="logo--mini" />
          <span className="nav__name">Appétite</span>
        </Link>
        <div className="nav__actions">
          {isAuthenticated ? (
            <Link to={dashboardPath(user?.role)} className="btn btn--ghost">
              <LayoutDashboard size={16} aria-hidden="true" /> My dashboard
            </Link>
          ) : (
            <>
              <Link to="/register/restaurant" className="nav__link">
                <Store size={16} aria-hidden="true" /> For restaurants
              </Link>
              <Link to="/register" className="btn btn--ghost">
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="hero">
        <section className="hero__intro">
          <div className="hero__visual">
            <BlendedLogo size={340} className="logo--hero" />
            <div className="badge badge--hot">
              <Flame size={16} /> Hot deals today
            </div>
            <div className="badge badge--time">
              <Clock size={16} /> Always on time
            </div>
          </div>

          <h1 className="hero__title">
            Craving something <span className="gradient-text">delicious?</span>
          </h1>
          <p className="hero__subtitle">
            Burgers, pizzas, tacos and sweet treats from your favourite fast-food spots — hot, fresh and just a few
            taps away.
          </p>

          <ul className="chips">
            {FEATURES.map(({ icon: Icon, label, tone }) => (
              <li key={label} className={`chip chip--${tone}`}>
                <Icon size={16} aria-hidden="true" /> {label}
              </li>
            ))}
          </ul>

          <dl className="stats">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="stats__item">
                <dt className="stats__value">
                  {value}
                  {Icon && <Icon size={18} className="stats__star" aria-hidden="true" />}
                </dt>
                <dd className="stats__label">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {isAuthenticated ? (
          <section className="card card--login card--signed-in" aria-labelledby="welcome-title">
            <span className="user-chip__avatar user-chip__avatar--lg" aria-hidden="true">
              {displayName(user).charAt(0).toUpperCase()}
            </span>
            <header className="card__header">
              <span className="card__eyebrow">You're signed in</span>
              <h2 id="welcome-title" className="card__title">
                Welcome back, {displayName(user)}!
              </h2>
              <p className="card__subtitle">
                {isRestaurant
                  ? 'Manage your restaurant profile and see how clients find you.'
                  : 'Browse every restaurant on Appétite and find your next meal.'}
              </p>
            </header>
            <Link to={dashboardPath(user?.role)} className="btn btn--primary btn--block">
              <LayoutDashboard size={18} aria-hidden="true" />
              {isRestaurant ? 'Go to my restaurant dashboard' : 'Go to my dashboard'}
            </Link>
            <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
              <LogOut size={16} aria-hidden="true" /> Sign out
            </button>
          </section>
        ) : (
          <section className="card card--login" aria-labelledby="login-title">
            <header className="card__header">
              <span className="card__eyebrow">Welcome back</span>
              <h2 id="login-title" className="card__title">
                Sign in to order
              </h2>
              <p className="card__subtitle">Your next favourite meal is waiting.</p>
            </header>

            <LoginForm />

            <footer className="card__footer card__footer--stacked">
              <span>
                New to Appétite?{' '}
                <Link to="/register" className="link link--strong">
                  Create an account
                </Link>
              </span>
              <span>
                Own a restaurant?{' '}
                <Link to="/register/restaurant" className="link link--strong">
                  Register it here
                </Link>
              </span>
            </footer>
          </section>
        )}
      </main>

      <footer className="site-footer">© {new Date().getFullYear()} Appétite · Fast-Food &amp; Délices</footer>
    </div>
  );
}
