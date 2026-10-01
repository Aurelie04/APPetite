import { Bike, CircleCheck, ChefHat, CircleX, Clock, PackageCheck, ThumbsUp } from 'lucide-react';

export const ORDER_STATUSES = {
  PLACED: { label: 'Waiting for the restaurant', short: 'New', tone: 'new', icon: Clock },
  ACCEPTED: { label: 'Accepted by the restaurant', short: 'Accepted', tone: 'progress', icon: ThumbsUp },
  PREPARING: { label: 'Being prepared', short: 'Preparing', tone: 'progress', icon: ChefHat },
  READY: { label: 'Ready', short: 'Ready', tone: 'ready', icon: PackageCheck },
  OUT_FOR_DELIVERY: { label: 'On its way to you', short: 'Out for delivery', tone: 'ready', icon: Bike },
  COMPLETED: { label: 'Completed', short: 'Completed', tone: 'done', icon: CircleCheck },
  CANCELLED: { label: 'Cancelled', short: 'Cancelled', tone: 'cancelled', icon: CircleX },
};

export const orderStatus = (status) => ORDER_STATUSES[status] ?? ORDER_STATUSES.PLACED;

export const isActiveOrder = (order) => order.status !== 'COMPLETED' && order.status !== 'CANCELLED';

/** Progress steps shown to the client; delivery orders have an extra "on its way" step. */
export function orderSteps(serviceOption) {
  return serviceOption === 'DELIVERY'
    ? ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED']
    : ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];
}

/** Button label for the restaurant when moving an order from `from` to `to`. */
export function actionLabel(from, to, serviceOption) {
  if (to === 'CANCELLED') return from === 'PLACED' ? 'Decline' : 'Cancel order';
  if (to === 'ACCEPTED') return 'Accept order';
  if (to === 'PREPARING') return 'Start preparing';
  if (to === 'READY') return serviceOption === 'DELIVERY' ? 'Ready for delivery' : 'Mark as ready';
  if (to === 'OUT_FOR_DELIVERY') return 'Out for delivery';
  if (to === 'COMPLETED') {
    if (serviceOption === 'DELIVERY') return 'Delivered';
    return serviceOption === 'DINE_IN' ? 'Served' : 'Picked up';
  }
  return to;
}

export const PAYMENT_STATUSES = {
  PENDING: { label: 'To pay on arrival', tone: 'pending' },
  PAID: { label: 'Paid', tone: 'paid' },
  REFUNDED: { label: 'Refunded', tone: 'refunded' },
};

export function formatOrderTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? `Today, ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
