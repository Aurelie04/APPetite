import logo from '../assets/logo.jpg';

/**
 * The source logo is a circular emblem on a cream, patterned canvas.
 * We crop to the emblem and feather its edge with a radial mask so it melts into the colourful page.
 */
export default function BlendedLogo({ size = 420, className = '' }) {
  return (
    <div className={`logo ${className}`} style={{ '--logo-size': `${size}px` }}>
      <div className="logo__halo" />
      <div className="logo__ring" />
      <div className="logo__img" role="img" aria-label="Appétite - Fast-Food & Délices" style={{ backgroundImage: `url(${logo})` }} />
    </div>
  );
}
