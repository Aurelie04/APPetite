import { Link } from 'react-router-dom';
import ColorfulBackground from './ColorfulBackground.jsx';
import BlendedLogo from './BlendedLogo.jsx';
import PageNav from './PageNav.jsx';

export default function AuthLayout({ title, subtitle, children, footer, crumb }) {
  return (
    <div className="page page--auth">
      <ColorfulBackground />
      <div className="page-nav-bar">
        <PageNav current={crumb ?? title} />
      </div>
      <main className="auth">
        <Link to="/" className="auth__logo" aria-label="Back to home">
          <BlendedLogo size={190} />
        </Link>
        <section className="card card--auth">
          <header className="card__header">
            <h1 className="card__title">{title}</h1>
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </header>
          {children}
          {footer && <footer className="card__footer">{footer}</footer>}
        </section>
      </main>
    </div>
  );
}
