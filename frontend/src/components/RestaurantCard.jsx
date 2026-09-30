import { MapPin, Phone } from 'lucide-react';
import { coverGradient, cuisineIcon } from '../utils/cuisines.js';

export default function RestaurantCard({ restaurant }) {
  const { id, name, cuisine, description, address, phone } = restaurant;
  const Icon = cuisineIcon(cuisine);

  return (
    <article className="rcard">
      <div className="rcard__cover" style={{ background: coverGradient(id) }}>
        <Icon size={44} strokeWidth={1.6} aria-hidden="true" />
        {cuisine && <span className="rcard__tag">{cuisine}</span>}
      </div>
      <div className="rcard__body">
        <h3 className="rcard__name">{name}</h3>
        <p className={`rcard__desc ${description ? '' : 'rcard__desc--muted'}`}>
          {description || 'This restaurant has not added a description yet.'}
        </p>
        <ul className="rcard__meta">
          {address && (
            <li>
              <MapPin size={14} aria-hidden="true" /> {address}
            </li>
          )}
          {phone && (
            <li>
              <Phone size={14} aria-hidden="true" /> {phone}
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}
