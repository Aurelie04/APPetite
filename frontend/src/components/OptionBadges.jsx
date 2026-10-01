import { paymentMethod, serviceOption } from '../utils/restaurantOptions.js';

export function ServiceBadges({ services = [], className = '' }) {
  if (!services.length) return null;
  return (
    <ul className={`badges ${className}`} aria-label="Services">
      {services.map((value) => {
        const option = serviceOption(value);
        if (!option) return null;
        const Icon = option.icon;
        return (
          <li key={value} className="obadge obadge--service">
            <Icon size={13} aria-hidden="true" /> {option.label}
          </li>
        );
      })}
    </ul>
  );
}

export function PaymentBadges({ methods = [], short = false, className = '' }) {
  if (!methods.length) return null;
  return (
    <ul className={`badges ${className}`} aria-label="Payment methods">
      {methods.map((value) => {
        const method = paymentMethod(value);
        if (!method) return null;
        const Icon = method.icon;
        return (
          <li key={value} className={`obadge ${method.online ? 'obadge--online' : 'obadge--cash'}`}>
            <Icon size={13} aria-hidden="true" /> {short ? method.short : method.label}
          </li>
        );
      })}
    </ul>
  );
}
