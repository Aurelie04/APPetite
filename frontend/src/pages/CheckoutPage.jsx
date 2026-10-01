import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info, Lock, MapPin, MessageSquare, Phone, RefreshCw, ShoppingBasket } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import Alert from '../components/Alert.jsx';
import ChoiceCard from '../components/ChoiceCard.jsx';
import FormField from '../components/FormField.jsx';
import RestaurantLogo from '../components/RestaurantLogo.jsx';
import QuantityStepper from '../components/cart/QuantityStepper.jsx';
import { orderApi, restaurantApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import useApiResource from '../hooks/useApiResource.js';
import { PAYMENT_METHODS, SERVICE_OPTIONS, formatPrice } from '../utils/restaurantOptions.js';
import { PHONE_RE } from '../utils/validation.js';

const ADDRESS_MAX = 200;
const NOTE_MAX = 300;

const CLIENT_HINTS = {
  DELIVERY: 'We bring it to your door',
  TAKEAWAY: 'Collect it at the restaurant',
  DINE_IN: 'Eat at the restaurant',
  CASH_ON_ARRIVAL: 'Pay in cash when you get your order',
};
const forClient = (option) => ({ ...option, hint: CLIENT_HINTS[option.value] ?? option.hint });

const contactKey = (email) => `appetite.contact.${email?.toLowerCase()}`;
function readContact(email) {
  try {
    return JSON.parse(localStorage.getItem(contactKey(email))) ?? {};
  } catch {
    return {};
  }
}

export default function CheckoutPage() {
  const { user, token, logout } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const restaurantId = cart.restaurant?.id;
  const { syncWithMenu } = cart;

  const fetcher = useCallback(
    (t) => (restaurantId ? restaurantApi.detail(t, restaurantId) : Promise.resolve(null)),
    [restaurantId],
  );
  const { data, error: loadError, loading, reload } = useApiResource(fetcher);
  const restaurant = data?.restaurant;
  const menu = useMemo(() => data?.menu ?? [], [data]);

  const [service, setService] = useState(null);
  const [payment, setPayment] = useState(null);
  const [form, setForm] = useState(() => ({ deliveryAddress: '', contactPhone: '', note: '', ...readContact(user?.email) }));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [removed, setRemoved] = useState([]);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!data) return;
    const available = new Set(menu.map((m) => m.id));
    const gone = cart.items.filter((i) => !available.has(i.id)).map((i) => i.name);
    if (gone.length) setRemoved(gone);
    syncWithMenu(menu);
    // Only re-check when fresh menu data arrives, not on every quantity change.
  }, [data, menu, syncWithMenu]);

  const trail = [{ label: 'Restaurants', to: '/client' }];

  if (!cart.items.length) {
    return (
      <DashboardLayout trail={trail} crumb="Checkout">
        <section className="panel empty">
          <ShoppingBasket size={40} aria-hidden="true" />
          <h2>Your cart is empty</h2>
          {removed.length > 0 && (
            <Alert type="warning">No longer on the menu: {removed.join(', ')}.</Alert>
          )}
          <p className="muted">Pick a restaurant and add a few dishes or drinks to get started.</p>
          <Link to="/client" className="btn btn--primary">
            Browse restaurants
          </Link>
        </section>
      </DashboardLayout>
    );
  }

  if (loading && !data) {
    return (
      <DashboardLayout trail={trail} crumb="Checkout">
        <div className="panel panel--loading" aria-busy="true">
          Checking the menu…
        </div>
      </DashboardLayout>
    );
  }

  if (loadError && !data) {
    return (
      <DashboardLayout trail={trail} crumb="Checkout">
        <div className="panel">
          <Alert>{loadError}</Alert>
          <button type="button" className="btn btn--ghost" onClick={reload}>
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const currency = restaurant.currency;
  const services = SERVICE_OPTIONS.filter((s) => restaurant.serviceOptions?.includes(s.value)).map(forClient);
  const payments = PAYMENT_METHODS.filter((m) => restaurant.paymentMethods?.includes(m.value)).map(forClient);
  const onArrival = payments.filter((m) => !m.online);
  const online = payments.filter((m) => m.online);

  const selectedService = services.some((s) => s.value === service) ? service : services[0]?.value;
  const selectedPayment = payments.some((m) => m.value === payment) ? payment : payments[0]?.value;
  const isDelivery = selectedService === 'DELIVERY';
  const isOnline = PAYMENT_METHODS.find((m) => m.value === selectedPayment)?.online;
  const canOrder = services.length > 0 && payments.length > 0;

  const setField = (field) => (e) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const validate = () => {
    const v = {};
    const address = form.deliveryAddress.trim();
    const phone = form.contactPhone.trim();
    if (isDelivery && !address) v.deliveryAddress = 'Please enter a delivery address';
    if (address.length > ADDRESS_MAX) v.deliveryAddress = `Keep it under ${ADDRESS_MAX} characters`;
    if (isDelivery && !phone) v.contactPhone = 'Please enter a phone number for the delivery';
    else if (phone && !PHONE_RE.test(phone)) v.contactPhone = 'Please enter a valid phone number';
    if (form.note.length > NOTE_MAX) v.note = `Keep it under ${NOTE_MAX} characters`;
    for (const field of ['deliveryAddress', 'note']) {
      if (/[<>]/.test(form[field])) v[field] = 'Please remove the < and > characters';
    }
    return v;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setPlacing(true);
    try {
      const contact = { deliveryAddress: form.deliveryAddress.trim(), contactPhone: form.contactPhone.trim() };
      const order = await orderApi.place(token, {
        restaurantId: restaurant.id,
        items: cart.items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        serviceOption: selectedService,
        paymentMethod: selectedPayment,
        deliveryAddress: isDelivery ? contact.deliveryAddress : null,
        contactPhone: contact.contactPhone || null,
        note: form.note.trim() || null,
      });
      localStorage.setItem(contactKey(user.email), JSON.stringify(contact));
      cart.clear();
      navigate(`/orders?placed=${order.id}`, { replace: true });
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setSubmitError(err.message);
      setErrors(err.fieldErrors ?? {});
      if (err.status === 400 && /menu|available/i.test(err.message)) reload();
      setPlacing(false);
    }
  };

  return (
    <DashboardLayout trail={trail} crumb="Checkout">
      <header className="checkout-head">
        <RestaurantLogo restaurant={restaurant} size={56} />
        <div>
          <p className="dash-hero__eyebrow">Checkout</p>
          <h1 className="checkout-head__title">
            Your order from <Link to={`/restaurants/${restaurant.id}`}>{restaurant.name}</Link>
          </h1>
        </div>
      </header>

      <form className="dash-grid checkout" onSubmit={handleSubmit} noValidate>
        <div className="stack">
          {removed.length > 0 && (
            <Alert type="warning">
              No longer on the menu, so we removed {removed.length === 1 ? 'it' : 'them'} from your cart:{' '}
              {removed.join(', ')}.
            </Alert>
          )}
          {!canOrder && (
            <Alert type="warning">This restaurant is not taking online orders right now. Please call them to order.</Alert>
          )}

          <section className="panel" aria-labelledby="items-title">
            <header className="panel__header panel__header--row">
              <h2 id="items-title">Items</h2>
              <Link to={`/restaurants/${restaurant.id}`} className="link-btn">
                Add more
              </Link>
            </header>
            <ul className="cart-lines">
              {cart.items.map((item) => (
                <li key={item.id} className="cart-line">
                  <div className="cart-line__info">
                    <strong>{item.name}</strong>
                    <small>{formatPrice(item.price, currency)} each</small>
                  </div>
                  <QuantityStepper
                    size="sm"
                    quantity={item.quantity}
                    itemName={item.name}
                    onChange={(q) => cart.setQuantity(item.id, q)}
                  />
                  <span className="cart-line__total">{formatPrice(item.price * item.quantity, currency)}</span>
                </li>
              ))}
            </ul>
          </section>

          {services.length > 0 && (
            <section className="panel" aria-labelledby="service-title">
              <header className="panel__header">
                <h2 id="service-title">How do you want it?</h2>
              </header>
              <fieldset className="option-group">
                <legend className="sr-only">Service</legend>
                <div className="option-grid">
                  {services.map((s) => (
                    <ChoiceCard
                      key={s.value}
                      type="radio"
                      name="service"
                      option={s}
                      checked={selectedService === s.value}
                      onChange={() => setService(s.value)}
                    />
                  ))}
                </div>
              </fieldset>

              {isDelivery && (
                <div className="form__grid">
                  <FormField
                    label="Delivery address"
                    icon={MapPin}
                    name="deliveryAddress"
                    placeholder="Street, number, apartment, city"
                    maxLength={ADDRESS_MAX}
                    autoComplete="street-address"
                    value={form.deliveryAddress}
                    onChange={setField('deliveryAddress')}
                    error={errors.deliveryAddress}
                  />
                  <FormField
                    label="Phone number"
                    icon={Phone}
                    type="tel"
                    name="contactPhone"
                    placeholder="+33 6 12 34 56 78"
                    autoComplete="tel"
                    value={form.contactPhone}
                    onChange={setField('contactPhone')}
                    error={errors.contactPhone}
                    hint="So the driver can reach you"
                  />
                </div>
              )}
              {!isDelivery && (
                <FormField
                  label="Phone number (optional)"
                  icon={Phone}
                  type="tel"
                  name="contactPhone"
                  placeholder="+33 6 12 34 56 78"
                  autoComplete="tel"
                  value={form.contactPhone}
                  onChange={setField('contactPhone')}
                  error={errors.contactPhone}
                  hint="The restaurant will call you if there's a problem with your order"
                />
              )}
            </section>
          )}

          {payments.length > 0 && (
            <section className="panel" aria-labelledby="payment-title">
              <header className="panel__header">
                <h2 id="payment-title">How do you want to pay?</h2>
                <p>Only the methods accepted by {restaurant.name} are shown.</p>
              </header>
              {onArrival.length > 0 && (
                <fieldset className="option-group">
                  <legend>Pay on arrival</legend>
                  <div className="option-grid">
                    {onArrival.map((m) => (
                      <ChoiceCard
                        key={m.value}
                        type="radio"
                        name="payment"
                        option={m}
                        checked={selectedPayment === m.value}
                        onChange={() => setPayment(m.value)}
                      />
                    ))}
                  </div>
                </fieldset>
              )}
              {online.length > 0 && (
                <fieldset className="option-group">
                  <legend>Pay online now</legend>
                  <div className="option-grid">
                    {online.map((m) => (
                      <ChoiceCard
                        key={m.value}
                        type="radio"
                        name="payment"
                        option={m}
                        checked={selectedPayment === m.value}
                        onChange={() => setPayment(m.value)}
                      />
                    ))}
                  </div>
                </fieldset>
              )}
              {isOnline && (
                <p className="notice">
                  <Info size={16} aria-hidden="true" />
                  Demo mode: online payments are simulated. No money is charged and the order is marked as paid.
                </p>
              )}
            </section>
          )}

          <section className="panel" aria-labelledby="note-title">
            <header className="panel__header">
              <h2 id="note-title">Note for the restaurant</h2>
            </header>
            <FormField
              label="Note (optional)"
              icon={MessageSquare}
              as="textarea"
              rows={3}
              name="note"
              maxLength={NOTE_MAX}
              placeholder="Allergies, no onions, door code…"
              value={form.note}
              onChange={setField('note')}
              error={errors.note}
              hint={`${form.note.length}/${NOTE_MAX} characters`}
            />
          </section>
        </div>

        <aside className="dash-side">
          <section className="panel checkout-summary" aria-labelledby="summary-title">
            <header className="panel__header">
              <h2 id="summary-title">Summary</h2>
            </header>
            <dl className="summary-list">
              <div>
                <dt>
                  {cart.count} {cart.count === 1 ? 'item' : 'items'}
                </dt>
                <dd>{formatPrice(cart.subtotal, currency)}</dd>
              </div>
              {isDelivery && (
                <div>
                  <dt>Delivery</dt>
                  <dd>Free</dd>
                </div>
              )}
              <div className="summary-list__total">
                <dt>Total</dt>
                <dd>{formatPrice(cart.subtotal, currency)}</dd>
              </div>
            </dl>
            {submitError && <Alert>{submitError}</Alert>}
            <button type="submit" className="btn btn--primary btn--block" disabled={placing || !canOrder}>
              {isOnline && <Lock size={16} aria-hidden="true" />}
              {placing
                ? 'Placing your order…'
                : isOnline
                  ? `Pay ${formatPrice(cart.subtotal, currency)} & order`
                  : 'Place order'}
            </button>
            <p className="muted checkout-summary__fine">
              {isOnline
                ? 'You pay now. If the restaurant declines your order, you are refunded.'
                : 'You pay when you get your order.'}{' '}
              You can cancel until the restaurant accepts it.
            </p>
          </section>
        </aside>
      </form>
    </DashboardLayout>
  );
}
