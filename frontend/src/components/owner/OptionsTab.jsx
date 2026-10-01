import { useState } from 'react';
import { Banknote, Globe, Save } from 'lucide-react';
import Alert from '../Alert.jsx';
import ChoiceCard from '../ChoiceCard.jsx';
import { restaurantApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PAYMENT_METHODS, SERVICE_OPTIONS, paymentMethod } from '../../utils/restaurantOptions.js';

const sameSet = (a, b) => a.length === b.length && a.every((v) => b.includes(v));
const ON_ARRIVAL = PAYMENT_METHODS.filter((m) => !m.online);
const ONLINE = PAYMENT_METHODS.filter((m) => m.online);

const orList = (items) => new Intl.ListFormat('en', { type: 'disjunction' }).format(items);

function checkoutSummary(payments, services) {
  if (!payments.length || !services.length) return null;
  const cash = payments.some((p) => !paymentMethod(p)?.online);
  const online = payments.filter((p) => paymentMethod(p)?.online).map((p) => paymentMethod(p).short);
  const ways = [cash && 'in cash when they get their order', online.length && `online with ${orList(online)}`].filter(Boolean);
  const how = orList(SERVICE_OPTIONS.filter((s) => services.includes(s.value)).map((s) => s.label.toLowerCase()));
  return `Clients can order ${how} and pay ${orList(ways)}.`;
}

export default function OptionsTab({ restaurant, onSaved }) {
  const { token } = useAuth();
  const [payments, setPayments] = useState(restaurant.paymentMethods ?? []);
  const [services, setServices] = useState(restaurant.serviceOptions ?? []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const toggle = (setter) => (value) => {
    setMessage(null);
    setter((list) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]));
  };
  const togglePayment = toggle(setPayments);
  const toggleService = toggle(setServices);

  const isDirty =
    !sameSet(payments, restaurant.paymentMethods ?? []) || !sameSet(services, restaurant.serviceOptions ?? []);
  const cashOn = payments.some((p) => ON_ARRIVAL.some((m) => m.value === p));
  const onlineOn = payments.some((p) => ONLINE.some((m) => m.value === p));
  const summary = checkoutSummary(payments, services);

  const setGroup = (group, enabled) => {
    setMessage(null);
    const values = group.map((m) => m.value);
    setPayments((list) =>
      enabled ? [...new Set([...list, ...values])] : list.filter((v) => !values.includes(v)),
    );
  };

  const handleSave = async () => {
    if (!payments.length) {
      setMessage({ type: 'error', text: 'Turn on cash or at least one online method so clients can pay.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const updated = await restaurantApi.updateOptions(token, { paymentMethods: payments, serviceOptions: services });
      onSaved(updated);
      setPayments(updated.paymentMethods);
      setServices(updated.serviceOptions);
      setMessage({ type: 'success', text: 'Saved. Checkout now offers exactly these options.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="options-title">
      <header className="panel__header">
        <h2 id="options-title">Payments &amp; services</h2>
        <p>Choose how clients pay you and how they get their food. Checkout only offers what you turn on here.</p>
      </header>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      <div className="pay-switches" role="group" aria-label="Payment types">
        <button
          type="button"
          className={`pay-switch ${cashOn ? 'pay-switch--on' : ''}`}
          aria-pressed={cashOn}
          onClick={() => setGroup(ON_ARRIVAL, !cashOn)}
        >
          <Banknote size={22} aria-hidden="true" />
          <span>
            <strong>Cash</strong>
            <small>{cashOn ? 'On: clients pay when they get the order' : 'Off'}</small>
          </span>
          <span className="pay-switch__toggle" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`pay-switch ${onlineOn ? 'pay-switch--on' : ''}`}
          aria-pressed={onlineOn}
          onClick={() => setGroup(ONLINE, !onlineOn)}
        >
          <Globe size={22} aria-hidden="true" />
          <span>
            <strong>Online</strong>
            <small>{onlineOn ? 'On: clients pay at checkout' : 'Off'}</small>
          </span>
          <span className="pay-switch__toggle" aria-hidden="true" />
        </button>
      </div>

      <fieldset className="option-group">
        <legend>Cash on arrival</legend>
        <div className="option-grid">
          {ON_ARRIVAL.map((m) => (
            <ChoiceCard key={m.value} option={m} checked={payments.includes(m.value)} onChange={() => togglePayment(m.value)} />
          ))}
        </div>
      </fieldset>

      <fieldset className="option-group">
        <legend>Online at checkout</legend>
        <div className="option-grid">
          {ONLINE.map((m) => (
            <ChoiceCard key={m.value} option={m} checked={payments.includes(m.value)} onChange={() => togglePayment(m.value)} />
          ))}
        </div>
      </fieldset>

      <fieldset className="option-group">
        <legend>Services</legend>
        <div className="option-grid">
          {SERVICE_OPTIONS.map((s) => (
            <ChoiceCard key={s.value} option={s} checked={services.includes(s.value)} onChange={() => toggleService(s.value)} />
          ))}
        </div>
      </fieldset>

      {summary ? (
        <p className="notice notice--ok">{summary}</p>
      ) : (
        <p className="notice notice--warn">
          {payments.length
            ? 'Pick at least one service (delivery, takeaway or dine-in) so clients can order.'
            : 'Turn on cash or an online method so clients can order.'}
        </p>
      )}

      <div className="form__actions">
        <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving || !isDirty}>
          <Save size={18} aria-hidden="true" />
          {saving ? 'Saving…' : 'Save options'}
        </button>
      </div>
    </section>
  );
}
