import { Link } from 'react-router-dom';
import ColorfulBackground from './ColorfulBackground.jsx';
import BlendedLogo from './BlendedLogo.jsx';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="page page--auth">
      <ColorfulBackground />
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
