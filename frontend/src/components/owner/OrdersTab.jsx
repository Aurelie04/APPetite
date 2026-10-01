import { useState } from 'react';
import { Inbox, Mail, MapPin, MessageSquare, Phone, RefreshCw } from 'lucide-react';
import Alert from '../Alert.jsx';
import { OrderItems, OrderMeta, StatusBadge } from '../orders/OrderParts.jsx';
import { restaurantOrderApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { actionLabel, formatOrderTime, isActiveOrder } from '../../utils/orderStatus.js';
import { formatPrice } from '../../utils/restaurantOptions.js';

const FILTERS = [
  { id: 'active', label: 'In progress', test: isActiveOrder },
  { id: 'COMPLETED', label: 'Completed', test: (o) => o.status === 'COMPLETED' },
  { id: 'CANCELLED', label: 'Cancelled', test: (o) => o.status === 'CANCELLED' },
  { id: 'all', label: 'All', test: () => true },
];

function OwnerOrderCard({ order, busy, onMove }) {
  return (
    <article
      className={`order-card ${order.status === 'PLACED' ? 'order-card--new' : ''}`}
      aria-labelledby={`owner-order-${order.id}`}
    >
      <header className="order-card__head">
        <div className="order-card__title">
          <h3 id={`owner-order-${order.id}`}>Order #{order.id}</h3>
          <small>{formatOrderTime(order.createdAt)}</small>
        </div>
        <StatusBadge status={order.status} owner />
      </header>

      <ul className="order-card__details">
        <li>
          <Mail size={15} aria-hidden="true" /> {order.customerEmail}
        </li>
        {order.contactPhone && (
          <li>
            <Phone size={15} aria-hidden="true" />{' '}
            <a href={`tel:${order.contactPhone.replace(/\s/g, '')}`} className="link">
              {order.contactPhone}
            </a>
          </li>
        )}
        {order.deliveryAddress && (
          <li>
            <MapPin size={15} aria-hidden="true" /> {order.deliveryAddress}
          </li>
        )}
        {order.note && (
          <li className="order-card__note">
            <MessageSquare size={15} aria-hidden="true" /> {order.note}
          </li>
        )}
      </ul>

      <OrderItems order={order} />

      <div className="order-card__total">
        <span>Total</span>
        <strong>{formatPrice(order.total, order.currency)}</strong>
      </div>

      <OrderMeta order={order} />

      {order.nextStatuses.length > 0 && (
        <footer className="order-card__actions">
          {order.nextStatuses.map((next) => {
            const cancel = next === 'CANCELLED';
            return (
              <button
                key={next}
                type="button"
                className={`btn btn--sm ${cancel ? 'btn--ghost btn--danger' : 'btn--primary'}`}
                onClick={() => onMove(order, next)}
                disabled={busy}
              >
                {actionLabel(order.status, next, order.serviceOption)}
              </button>
            );
          })}
        </footer>
      )}
    </article>
  );
}

export default function OrdersTab({ orders, error, loading, onReload, onUpdated, restaurant, onOpenOptions }) {
  const { token } = useAuth();
  const [filter, setFilter] = useState('active');
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const list = orders ?? [];
  const { test } = FILTERS.find((f) => f.id === filter);
  const visible = list.filter(test);
  const canReceive = restaurant.paymentMethods?.length > 0 && restaurant.serviceOptions?.length > 0;

  const handleMove = async (order, next) => {
    if (next === 'CANCELLED') {
      const verb = order.status === 'PLACED' ? 'Decline' : 'Cancel';
      const refund = order.paymentStatus === 'PAID' ? ' The client will be refunded.' : '';
      if (!window.confirm(`${verb} order #${order.id}?${refund}`)) return;
    }
    setActionError('');
    setBusyId(order.id);
    try {
      onUpdated(await restaurantOrderApi.updateStatus(token, order.id, next));
    } catch (err) {
      setActionError(err.message);
      onReload();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="panel" aria-labelledby="orders-title">
      <header className="panel__header panel__header--row">
        <div>
          <h2 id="orders-title">Orders</h2>
          <p>New orders appear here automatically. Accept them so the client knows you are on it.</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onReload} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" /> Refresh
        </button>
      </header>

      {!canReceive && (
        <Alert type="warning">
          Clients can&apos;t order yet. Choose at least one payment method and one service.{' '}
          <button type="button" className="link-btn" onClick={onOpenOptions}>
            Set them up now
          </button>
        </Alert>
      )}
      {actionError && <Alert>{actionError}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="filters filters--tight" role="toolbar" aria-label="Filter orders">
        {FILTERS.map((f) => {
          const count = list.filter(f.test).length;
          return (
            <button
              key={f.id}
              type="button"
              className={`filter ${filter === f.id ? 'filter--active' : ''}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {loading && !orders ? (
        <p className="muted" aria-busy="true">
          Loading orders…
        </p>
      ) : visible.length === 0 ? (
        <div className="empty">
          <Inbox size={36} aria-hidden="true" />
          <p>{filter === 'active' ? 'No orders waiting. New ones will show up here.' : 'Nothing here yet.'}</p>
        </div>
      ) : (
        <div className="order-list order-list--grid">
          {visible.map((o) => (
            <OwnerOrderCard key={o.id} order={o} busy={busyId === o.id} onMove={handleMove} />
          ))}
        </div>
      )}
    </section>
  );
}
