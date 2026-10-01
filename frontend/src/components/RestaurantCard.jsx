import { Link } from 'react-router-dom';
import { ChevronRight, Clock, CupSoda, MapPin, Phone, UtensilsCrossed } from 'lucide-react';
import RestaurantLogo from './RestaurantLogo.jsx';
import { PaymentBadges, ServiceBadges } from './OptionBadges.jsx';
import { coverGradient } from '../utils/cuisines.js';
import { formatPrice } from '../utils/restaurantOptions.js';

export default function RestaurantCard({ restaurant, to }) {
  const { id, name, cuisine, description, address, phone, openingHours, currency, menu } = restaurant;
  const foodCount = menu?.foodCount ?? 0;
  const beverageCount = menu?.beverageCount ?? 0;

  const content = (
    <>
      <div className="rcard__cover" style={{ background: coverGradient(id) }}>
        <RestaurantLogo restaurant={restaurant} size={84} className="rcard__logo" />
        {cuisine && <span className="rcard__tag">{cuisine}</span>}
        {menu?.priceFrom != null && (
          <span className="rcard__price">from {formatPrice(menu.priceFrom, currency)}</span>
        )}
      </div>
      <div className="rcard__body">
        <h3 className="rcard__name">{name}</h3>
        <p className={`rcard__desc ${description ? '' : 'rcard__desc--muted'}`}>
          {description || 'This restaurant has not added a description yet.'}
        </p>

        <ServiceBadges services={restaurant.serviceOptions} />
        <PaymentBadges methods={restaurant.paymentMethods} short />

        <ul className="rcard__meta">
          <li>
            <UtensilsCrossed size={14} aria-hidden="true" /> {foodCount} dish{foodCount === 1 ? '' : 'es'}
            <span className="rcard__dot" aria-hidden="true">·</span>
            <CupSoda size={14} aria-hidden="true" /> {beverageCount} drink{beverageCount === 1 ? '' : 's'}
          </li>
          {openingHours && (
            <li>
              <Clock size={14} aria-hidden="true" /> {openingHours}
            </li>
          )}
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

        {to && (
          <span className="rcard__cta">
            See menu &amp; options <ChevronRight size={16} aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  );

  return to ? (
    <Link to={to} className="rcard rcard--link" aria-label={`${name}: see menu and options`}>
      {content}
    </Link>
  ) : (
    <article className="rcard">{content}</article>
  );
}
