import { Check } from 'lucide-react';
import { PAYMENT_STATUSES, orderStatus, orderSteps } from '../../utils/orderStatus.js';
import { formatPrice, paymentMethod, serviceOption } from '../../utils/restaurantOptions.js';

export function StatusBadge({ status, owner = false }) {
  const meta = orderStatus(status);
  const Icon = meta.icon;
  return (
    <span className={`status-badge status-badge--${meta.tone}`}>
      <Icon size={14} aria-hidden="true" /> {owner ? meta.short : meta.label}
    </span>
  );
}

export function OrderProgress({ order }) {
  const steps = orderSteps(order.serviceOption);
  const current = steps.indexOf(order.status);
  return (
    <ol className="order-steps" aria-label="Order progress">
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={step} className={`order-steps__step order-steps__step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="order-steps__dot" aria-hidden="true">
              {state === 'done' && <Check size={12} strokeWidth={3} />}
            </span>
            <span className="order-steps__label">{orderStatus(step).short}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderItems({ order }) {
  return (
    <ul className="order-items">
      {order.items.map((item) => (
        <li key={item.id}>
          <span className="order-items__qty">{item.quantity}×</span>
          <span className="order-items__name">{item.name}</span>
          <span className="order-items__total">{formatPrice(item.lineTotal, order.currency)}</span>
        </li>
      ))}
    </ul>
  );
}

export function OrderMeta({ order }) {
  const service = serviceOption(order.serviceOption);
  const payment = paymentMethod(order.paymentMethod);
  const notCharged = order.paymentStatus === 'PENDING' && order.status === 'CANCELLED';
  const paymentStatus = notCharged
    ? { label: 'Not charged', tone: 'refunded' }
    : (PAYMENT_STATUSES[order.paymentStatus] ?? PAYMENT_STATUSES.PENDING);
  const ServiceIcon = service?.icon;
  const PaymentIcon = payment?.icon;
  return (
    <div className="order-meta">
      {service && (
        <span className="obadge obadge--service">
          <ServiceIcon size={14} aria-hidden="true" /> {service.label}
        </span>
      )}
      {payment && (
        <span className={`obadge ${payment.online ? 'obadge--online' : 'obadge--cash'}`}>
          <PaymentIcon size={14} aria-hidden="true" /> {payment.label}
        </span>
      )}
      <span className={`pay-status pay-status--${paymentStatus.tone}`}>{paymentStatus.label}</span>
    </div>
  );
}
