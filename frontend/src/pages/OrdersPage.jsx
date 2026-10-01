import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, MessageSquare, Phone, ReceiptText, RefreshCw, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import Alert from '../components/Alert.jsx';
import RestaurantLogo from '../components/RestaurantLogo.jsx';
import { OrderItems, OrderMeta, OrderProgress, StatusBadge } from '../components/orders/OrderParts.jsx';
import { orderApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useApiResource from '../hooks/useApiResource.js';
import usePolling from '../hooks/usePolling.js';
import { formatOrderTime, isActiveOrder } from '../utils/orderStatus.js';
import { formatPrice } from '../utils/restaurantOptions.js';

const REFRESH_MS = 15000;

function ClientOrderCard({ order, highlighted, onCancel, cancelling }) {
  const active = isActiveOrder(order);
  const phone = order.restaurant.phone;
  return (
    <article className={`order-card ${highlighted ? 'order-card--highlight' : ''}`} aria-labelledby={`order-${order.id}`}>
      <header className="order-card__head">
        <RestaurantLogo restaurant={order.restaurant} size={48} />
        <div className="order-card__title">
          <h3 id={`order-${order.id}`}>
            <Link to={`/restaurants/${order.restaurant.id}`}>{order.restaurant.name}</Link>
          </h3>
          <small>
            Order #{order.id} · {formatOrderTime(order.createdAt)}
          </small>
        </div>
        <StatusBadge status={order.status} />
      </header>

      {active && <OrderProgress order={order} />}

      <OrderItems order={order} />

      <div className="order-card__total">
        <span>Total</span>
        <strong>{formatPrice(order.total, order.currency)}</strong>
      </div>

      <OrderMeta order={order} />

      {(order.deliveryAddress || order.note) && (
        <ul className="order-card__details">
          {order.deliveryAddress && (
            <li>
              <MapPin size={15} aria-hidden="true" /> {order.deliveryAddress}
            </li>
          )}
          {order.note && (
            <li>
              <MessageSquare size={15} aria-hidden="true" /> {order.note}
            </li>
          )}
        </ul>
      )}

      {active && (order.cancellable || phone) && (
        <footer className="order-card__actions">
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="btn btn--ghost btn--sm">
              <Phone size={15} aria-hidden="true" /> Call restaurant
            </a>
          )}
          {order.cancellable && (
            <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={() => onCancel(order)} disabled={cancelling}>
              <X size={15} aria-hidden="true" /> {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
        </footer>
      )}
    </article>
  );
}

export default function OrdersPage() {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const placedId = Number(params.get('placed')) || null;
  const { data, setData, error, loading, reload, refresh } = useApiResource(orderApi.mine);
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const orders = data ?? [];
  const active = orders.filter(isActiveOrder);
  const past = orders.filter((o) => !isActiveOrder(o));
  usePolling(refresh, REFRESH_MS, active.length > 0);

  const placed = placedId && orders.find((o) => o.id === placedId);

  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel your order from ${order.restaurant.name}?`)) return;
    setActionError('');
    setCancellingId(order.id);
    try {
      const updated = await orderApi.cancel(token, order.id);
      setData((list) => list.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      setActionError(err.message);
      refresh();
    } finally {
      setCancellingId(null);
    }
  };

  const dismissPlaced = () => {
    params.delete('placed');
    setParams(params, { replace: true });
  };

  return (
    <DashboardLayout trail={[{ label: 'Restaurants', to: '/client' }]} crumb="My orders">
      <section className="dash-hero">
        <div>
          <p className="dash-hero__eyebrow">Track your food</p>
          <h1 className="dash-hero__title">My orders</h1>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={reload} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" /> Refresh
        </button>
      </section>

      {placed && (
        <Alert type="success">
          <span className="alert__row">
            <span>
              Order #{placed.id} sent to <strong>{placed.restaurant.name}</strong>.{' '}
              {placed.paymentStatus === 'PAID'
                ? 'Your payment went through.'
                : `Have ${formatPrice(placed.total, placed.currency)} ready when you get it.`}{' '}
              This page updates by itself.
            </span>
            <button type="button" className="icon-btn" onClick={dismissPlaced} aria-label="Dismiss">
              <X size={16} />
            </button>
          </span>
        </Alert>
      )}
      {actionError && <Alert>{actionError}</Alert>}
      {error && <Alert>{error}</Alert>}

      {loading && !data ? (
        <div className="panel panel--loading" aria-busy="true">
          Loading your orders…
        </div>
      ) : orders.length === 0 ? (
        <section className="panel empty">
          <ReceiptText size={40} aria-hidden="true" />
          <h2>No orders yet</h2>
          <p>When you order from a restaurant, you can follow it here.</p>
          <Link to="/client" className="btn btn--primary">
            Browse restaurants
          </Link>
        </section>
      ) : (
        <div className="stack">
          {active.length > 0 && (
            <section aria-labelledby="active-title" className="order-section">
              <h2 id="active-title" className="order-section__title">
                In progress <span className="count-pill">{active.length}</span>
              </h2>
              <div className="order-list">
                {active.map((o) => (
                  <ClientOrderCard
                    key={o.id}
                    order={o}
                    highlighted={o.id === placedId}
                    onCancel={handleCancel}
                    cancelling={cancellingId === o.id}
                  />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section aria-labelledby="past-title" className="order-section">
              <h2 id="past-title" className="order-section__title">
                Past orders
              </h2>
              <div className="order-list">
                {past.map((o) => (
                  <ClientOrderCard key={o.id} order={o} highlighted={o.id === placedId} onCancel={handleCancel} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
