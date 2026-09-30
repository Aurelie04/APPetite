import { NavLink } from 'react-router-dom';
import { Store, UtensilsCrossed } from 'lucide-react';

const TABS = [
  { to: '/register', label: "I'm a client", hint: 'Order food', icon: UtensilsCrossed },
  { to: '/register/restaurant', label: 'I own a restaurant', hint: 'Sell on Appétite', icon: Store },
];

export default function AccountTypeTabs() {
  return (
    <nav className="tabs" aria-label="Account type">
      {TABS.map(({ to, label, hint, icon: Icon }) => (
        <NavLink key={to} to={to} end className={({ isActive }) => `tabs__item ${isActive ? 'tabs__item--active' : ''}`}>
          <Icon size={20} aria-hidden="true" />
          <span>
            <strong>{label}</strong>
            <small>{hint}</small>
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
