import { Banknote, Bike, CreditCard, ShoppingBag, Smartphone, UtensilsCrossed, Wallet } from 'lucide-react';

/** Keep in sync with RestaurantService.SUPPORTED_CURRENCIES on the backend. */
export const CURRENCIES = [
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'USD', label: 'US dollar ($)' },
  { code: 'GBP', label: 'British pound (£)' },
  { code: 'CHF', label: 'Swiss franc (CHF)' },
  { code: 'CAD', label: 'Canadian dollar (CA$)' },
  { code: 'ZAR', label: 'South African rand (R)' },
  { code: 'NGN', label: 'Nigerian naira (₦)' },
  { code: 'GHS', label: 'Ghanaian cedi (GH₵)' },
  { code: 'KES', label: 'Kenyan shilling (KSh)' },
  { code: 'MAD', label: 'Moroccan dirham (MAD)' },
  { code: 'XOF', label: 'West African CFA franc (F CFA)' },
  { code: 'XAF', label: 'Central African CFA franc (FCFA)' },
];

export const PAYMENT_METHODS = [
  { value: 'CASH_ON_ARRIVAL', label: 'Cash on arrival', short: 'Cash', icon: Banknote, online: false,
    hint: 'Clients pay in cash when the order arrives or is collected' },
  { value: 'CARD_ONLINE', label: 'Card (online)', short: 'Card', icon: CreditCard, online: true,
    hint: 'Visa, Mastercard and other bank cards' },
  { value: 'MOBILE_MONEY', label: 'Mobile money', short: 'Mobile money', icon: Smartphone, online: true,
    hint: 'M-Pesa, MTN MoMo, Orange Money…' },
  { value: 'PAYPAL', label: 'PayPal', short: 'PayPal', icon: Wallet, online: true,
    hint: 'Pay with a PayPal account' },
];

export const SERVICE_OPTIONS = [
  { value: 'DELIVERY', label: 'Delivery', icon: Bike, hint: 'You deliver orders to the client' },
  { value: 'TAKEAWAY', label: 'Takeaway', icon: ShoppingBag, hint: 'Clients collect their order' },
  { value: 'DINE_IN', label: 'Dine-in', icon: UtensilsCrossed, hint: 'Clients can eat at your restaurant' },
];

export const FOOD_CATEGORIES = ['Burgers', 'Pizzas', 'Chicken', 'Sandwiches', 'Tacos', 'Salads', 'Sides', 'Combos', 'Desserts'];
export const BEVERAGE_CATEGORIES = ['Soft drinks', 'Juices', 'Water', 'Hot drinks', 'Milkshakes', 'Beer & wine'];

export const paymentMethod = (value) => PAYMENT_METHODS.find((m) => m.value === value);
export const serviceOption = (value) => SERVICE_OPTIONS.find((s) => s.value === value);

export function acceptsOnline(methods = []) {
  return methods.some((m) => paymentMethod(m)?.online);
}

export function formatPrice(amount, currency = 'EUR') {
  if (amount === null || amount === undefined || amount === '') return '';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(
      Number(amount),
    );
  } catch {
    return `${Number(amount).toFixed(2)} ${currency}`;
  }
}
