import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, House } from 'lucide-react';

/** Back arrow + quick link to the landing page, shown at the top of every page except the landing page. */
export default function PageNav({ current, fallback = '/', className = '' }) {
  const navigate = useNavigate();

  const goBack = () => {
    // React Router stores the position in its history stack as `idx`; 0 means this app has no previous page.
    const canGoBack = (window.history.state?.idx ?? 0) > 0;
    if (canGoBack) navigate(-1);
    else navigate(fallback);
  };

  return (
    <nav className={`page-nav ${className}`} aria-label="Page navigation">
      <button type="button" className="page-nav__back" onClick={goBack} aria-label="Go back" title="Go back">
        <ArrowLeft size={18} strokeWidth={2.5} />
      </button>
      <ol className="page-nav__crumbs">
        <li>
          <Link to="/" className="page-nav__home">
            <House size={15} aria-hidden="true" /> Home
          </Link>
        </li>
        {current && (
          <li aria-current="page">
            <ChevronRight size={14} className="page-nav__sep" aria-hidden="true" />
            <span>{current}</span>
          </li>
        )}
      </ol>
    </nav>
  );
}
