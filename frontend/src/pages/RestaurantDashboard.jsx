import { useEffect, useState } from 'react';
import { Circle, CircleCheck, MapPin, Phone, RefreshCw, Save, Store, UtensilsCrossed } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';
import FormField from '../components/FormField.jsx';
import Alert from '../components/Alert.jsx';
import { restaurantApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useApiResource from '../hooks/useApiResource.js';
import useForm from '../hooks/useForm.js';
import { CUISINES } from '../utils/cuisines.js';
import { PHONE_RE, validateRestaurantName } from '../utils/validation.js';
import { displayName } from '../utils/roles.js';

const DESCRIPTION_MAX = 500;
const PROFILE_FIELDS = ['name', 'cuisine', 'address', 'phone', 'description'];

function toForm(restaurant) {
  return Object.fromEntries(PROFILE_FIELDS.map((f) => [f, restaurant?.[f] ?? '']));
}

export default function RestaurantDashboard() {
  const { token, user } = useAuth();
  const { data: restaurant, setData: setRestaurant, error: loadError, loading, reload } = useApiResource(restaurantApi.mine);
  const { values, setValues, errors, setErrors, bind } = useForm(toForm(null));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (restaurant) setValues(toForm(restaurant));
  }, [restaurant, setValues]);

  const isDirty = restaurant && PROFILE_FIELDS.some((f) => (restaurant[f] ?? '') !== values[f]);
  const completed = PROFILE_FIELDS.filter((f) => restaurant?.[f]).length;
  const progress = Math.round((completed / PROFILE_FIELDS.length) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaved(false);
    const validation = {};
    const nameError = validateRestaurantName(values.name);
    if (nameError) validation.name = nameError;
    if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) validation.phone = 'Please enter a valid phone number';
    if (values.description.length > DESCRIPTION_MAX) validation.description = `Keep it under ${DESCRIPTION_MAX} characters`;
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSaving(true);
    try {
      setRestaurant(await restaurantApi.updateMine(token, values));
      setSaved(true);
    } catch (err) {
      setSaveError(err.message);
      setErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  if (loading && !restaurant) {
    return (
      <DashboardLayout>
        <div className="panel panel--loading" aria-busy="true">
          Loading your restaurant…
        </div>
      </DashboardLayout>
    );
  }

  if (loadError && !restaurant) {
    return (
      <DashboardLayout>
        <div className="panel">
          <Alert>{loadError}</Alert>
          <button type="button" className="btn btn--ghost" onClick={reload}>
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const checklist = [
    { label: 'Create your restaurant account', done: true },
    { label: `Complete your profile (${progress}%)`, done: progress === 100 },
    { label: 'Add your menu', soon: true },
    { label: 'Start receiving orders', soon: true },
  ];

  return (
    <DashboardLayout>
      <section className="dash-hero">
        <div>
          <p className="dash-hero__eyebrow">Welcome back, {displayName(user).split(' ')[0]}</p>
          <h1 className="dash-hero__title">{restaurant?.name}</h1>
          <p className="dash-hero__subtitle">
            <span className="live-dot" aria-hidden="true" /> Visible to all clients on Appétite
          </p>
        </div>
      </section>

      <div className="dash-grid">
        <section className="panel" aria-labelledby="profile-title">
          <header className="panel__header">
            <h2 id="profile-title">Restaurant profile</h2>
            <p>This information is shown to clients browsing restaurants.</p>
          </header>

          <form className="form" onSubmit={handleSubmit} noValidate>
            {saveError && <Alert>{saveError}</Alert>}
            {saved && !isDirty && <Alert type="success">Your restaurant profile has been saved.</Alert>}

            <div className="form__grid">
              <FormField label="Restaurant name" icon={Store} {...bind('name')} />
              <FormField label="Cuisine" icon={UtensilsCrossed} as="select" {...bind('cuisine')}>
                <option value="">Choose a cuisine</option>
                {CUISINES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value}
                  </option>
                ))}
              </FormField>
            </div>
            <div className="form__grid">
              <FormField label="Address" icon={MapPin} placeholder="12 Rue de Paris, Lyon" {...bind('address')} />
              <FormField label="Phone" icon={Phone} type="tel" placeholder="+33 1 23 45 67 89" {...bind('phone')} />
            </div>
            <FormField
              label="Description"
              as="textarea"
              rows={4}
              maxLength={DESCRIPTION_MAX}
              placeholder="Tell clients what makes your food special…"
              hint={`${values.description.length}/${DESCRIPTION_MAX} characters`}
              {...bind('description')}
            />

            <div className="form__actions">
              <button type="submit" className="btn btn--primary" disabled={saving || !isDirty}>
                <Save size={18} aria-hidden="true" />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>

        <aside className="dash-side">
          <section className="panel" aria-labelledby="preview-title">
            <header className="panel__header">
              <h2 id="preview-title">Client preview</h2>
              <p>How your restaurant appears on the client dashboard.</p>
            </header>
            <RestaurantCard restaurant={{ ...restaurant, ...values, name: values.name || restaurant?.name }} />
          </section>

          <section className="panel" aria-labelledby="checklist-title">
            <header className="panel__header">
              <h2 id="checklist-title">Getting started</h2>
            </header>
            <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <ul className="checklist">
              {checklist.map(({ label, done, soon }) => (
                <li key={label} className={done ? 'checklist__item--done' : ''}>
                  {done ? <CircleCheck size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
                  <span>{label}</span>
                  {soon && <small className="soon">Coming soon</small>}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </DashboardLayout>
  );
}
