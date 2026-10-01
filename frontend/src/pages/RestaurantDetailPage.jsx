import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Clock, CupSoda, MapPin, Phone, Plus, RefreshCw, UtensilsCrossed } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import RestaurantLogo from '../components/RestaurantLogo.jsx';
import Alert from '../components/Alert.jsx';
import { PaymentBadges, ServiceBadges } from '../components/OptionBadges.jsx';
import CartPanel from '../components/cart/CartPanel.jsx';
import QuantityStepper from '../components/cart/QuantityStepper.jsx';
import { restaurantApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import useApiResource from '../hooks/useApiResource.js';
import { coverGradient } from '../utils/cuisines.js';
import { ROLES, dashboardPath } from '../utils/roles.js';
import { PAYMENT_METHODS, formatPrice } from '../utils/restaurantOptions.js';

const SECTIONS = [
  { kind: 'FOOD', label: 'Food', icon: UtensilsCrossed },
  { kind: 'BEVERAGE', label: 'Beverages', icon: CupSoda },
];

function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.category || 'Other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()];
}

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const fetcher = useCallback((token) => restaurantApi.detail(token, id), [id]);
  const { data, error, loading, reload } = useApiResource(fetcher);
  const [section, setSection] = useState('ALL');

  const restaurant = data?.restaurant;
  const menu = useMemo(() => data?.menu ?? [], [data]);
  const isOwnerView = user?.role === ROLES.RESTAURANT;
  const trail = [{ label: isOwnerView ? 'My restaurant' : 'Restaurants', to: dashboardPath(user?.role) }];
  const cart = useCart();
  const { syncWithMenu } = cart;
  const cartIsHere = restaurant && cart.restaurant?.id === restaurant.id;

  useEffect(() => {
    if (cartIsHere) syncWithMenu(menu);
  }, [cartIsHere, menu, syncWithMenu]);

  if (loading && !data) {
    return (
      <DashboardLayout trail={trail} crumb="Loading…">
        <div className="panel panel--loading" aria-busy="true">
          Loading restaurant…
        </div>
      </DashboardLayout>
    );
  }

  if (error && !data) {
    return (
      <DashboardLayout trail={trail} crumb="Restaurant">
        <div className="panel">
          <Alert>{error}</Alert>
          <button type="button" className="btn btn--ghost" onClick={reload}>
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const visibleSections = SECTIONS.filter((s) => section === 'ALL' || section === s.kind);
  const payments = restaurant.paymentMethods ?? [];
  const onArrival = PAYMENT_METHODS.filter((m) => !m.online && payments.includes(m.value)).map((m) => m.value);
  const online = PAYMENT_METHODS.filter((m) => m.online && payments.includes(m.value)).map((m) => m.value);
  const takesOrders = !isOwnerView && payments.length > 0 && (restaurant.serviceOptions?.length ?? 0) > 0;

  const addToCart = (item) => {
    if (cart.restaurant && !cartIsHere) {
      const ok = window.confirm(
        `Your cart has items from ${cart.restaurant.name}. Start a new order from ${restaurant.name} instead?`,
      );
      if (!ok) return;
    }
    cart.add(restaurant, item);
  };

  return (
    <DashboardLayout trail={trail} crumb={restaurant.name}>
      {isOwnerView && (
        <Alert type="success">This is how clients see your restaurant page.</Alert>
      )}
      {!isOwnerView && !takesOrders && (
        <Alert type="warning">
          This restaurant is not taking online orders yet. You can still call them to order.
        </Alert>
      )}

      <section className="rdetail-hero" style={{ '--cover': coverGradient(restaurant.id) }}>
        <RestaurantLogo restaurant={restaurant} size={120} className="rdetail-hero__logo" />
        <div className="rdetail-hero__info">
          {restaurant.cuisine && <span className="rcard__tag rdetail-hero__tag">{restaurant.cuisine}</span>}
          <h1 className="dash-hero__title">{restaurant.name}</h1>
          <p className="rdetail-hero__desc">
            {restaurant.description || 'This restaurant has not added a description yet.'}
          </p>
          <ul className="rdetail-hero__meta">
            {restaurant.openingHours && (
              <li>
                <Clock size={16} aria-hidden="true" /> {restaurant.openingHours}
              </li>
            )}
            {restaurant.address && (
              <li>
                <MapPin size={16} aria-hidden="true" /> {restaurant.address}
              </li>
            )}
            {restaurant.phone && (
              <li>
                <Phone size={16} aria-hidden="true" />{' '}
                <a href={`tel:${restaurant.phone.replace(/\s/g, '')}`} className="link">
                  {restaurant.phone}
                </a>
              </li>
            )}
          </ul>
        </div>
      </section>

      <div className="dash-grid dash-grid--detail">
        <div className="stack">
          <div className="filters" role="toolbar" aria-label="Menu sections">
            {[{ kind: 'ALL', label: 'Full menu' }, ...SECTIONS].map(({ kind, label }) => (
              <button
                key={kind}
                type="button"
                className={`filter ${section === kind ? 'filter--active' : ''}`}
                aria-pressed={section === kind}
                onClick={() => setSection(kind)}
              >
                {label}
                {kind !== 'ALL' && ` (${menu.filter((i) => i.kind === kind).length})`}
              </button>
            ))}
          </div>

          {visibleSections.map(({ kind, label, icon: Icon }) => {
            const items = menu.filter((i) => i.kind === kind);
            return (
              <section key={kind} className="panel" aria-labelledby={`section-${kind}`}>
                <header className="panel__header panel__header--row">
                  <h2 id={`section-${kind}`}>
                    <Icon size={20} aria-hidden="true" /> {label}
                  </h2>
                  <span className="count-pill">{items.length}</span>
                </header>
                {items.length === 0 ? (
                  <p className="muted">No {label.toLowerCase()} on the menu yet.</p>
                ) : (
                  groupByCategory(items).map(([category, list]) => (
                    <div key={category} className="menu-group">
                      <h3 className="menu-group__title">{category}</h3>
                      <ul className="menu-list">
                        {list.map((item) => {
                          const quantity = cartIsHere ? cart.quantityOf(item.id) : 0;
                          return (
                            <li key={item.id} className={`menu-row ${quantity ? 'menu-row--in-cart' : ''}`}>
                              <div className="menu-row__info">
                                <strong>{item.name}</strong>
                                {item.description && <p>{item.description}</p>}
                              </div>
                              <span className="menu-row__price">{formatPrice(item.price, restaurant.currency)}</span>
                              {takesOrders && (
                                <div className="menu-row__order">
                                  {quantity > 0 ? (
                                    <QuantityStepper
                                      size="sm"
                                      quantity={quantity}
                                      itemName={item.name}
                                      onChange={(q) => cart.setQuantity(item.id, q)}
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn--sm btn--add"
                                      onClick={() => addToCart(item)}
                                      aria-label={`Add ${item.name} to your order`}
                                    >
                                      <Plus size={16} aria-hidden="true" /> Add
                                    </button>
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                )}
              </section>
            );
          })}
        </div>

        <aside className="dash-side">
          {takesOrders && <CartPanel restaurant={restaurant} />}

          <section className="panel" aria-labelledby="services-title">
            <header className="panel__header">
              <h2 id="services-title">Services</h2>
            </header>
            {restaurant.serviceOptions?.length ? (
              <ServiceBadges services={restaurant.serviceOptions} className="badges--lg" />
            ) : (
              <p className="muted">The restaurant has not listed its services yet.</p>
            )}
          </section>

          <section className="panel" aria-labelledby="payments-title">
            <header className="panel__header">
              <h2 id="payments-title">How you can pay</h2>
            </header>
            {onArrival.length > 0 && (
              <div className="pay-group">
                <h3>On arrival</h3>
                <PaymentBadges methods={onArrival} className="badges--lg" />
              </div>
            )}
            {online.length > 0 && (
              <div className="pay-group">
                <h3>Online</h3>
                <PaymentBadges methods={online} className="badges--lg" />
              </div>
            )}
            {!payments.length && <p className="muted">No payment methods listed yet.</p>}
          </section>
        </aside>
      </div>

      {takesOrders && cartIsHere && cart.count > 0 && (
        <div className="cart-bar">
          <span>
            <strong>{cart.count}</strong> {cart.count === 1 ? 'item' : 'items'} ·{' '}
            {formatPrice(cart.subtotal, restaurant.currency)}
          </span>
          <Link to="/checkout" className="btn btn--primary btn--sm">
            Checkout <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
