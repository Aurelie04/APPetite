import { useEffect, useState } from 'react';
import { Clock, Coins, MapPin, Phone, Save, Store, UtensilsCrossed } from 'lucide-react';
import FormField from '../FormField.jsx';
import Alert from '../Alert.jsx';
import LogoUploader from './LogoUploader.jsx';
import { restaurantApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useForm from '../../hooks/useForm.js';
import { CUISINES } from '../../utils/cuisines.js';
import { CURRENCIES } from '../../utils/restaurantOptions.js';
import { PHONE_RE, validateRestaurantName } from '../../utils/validation.js';

const DESCRIPTION_MAX = 500;
export const PROFILE_FIELDS = ['name', 'cuisine', 'address', 'phone', 'openingHours', 'description'];
const FORM_FIELDS = [...PROFILE_FIELDS, 'currency'];

function toForm(restaurant) {
  return Object.fromEntries(FORM_FIELDS.map((f) => [f, restaurant?.[f] ?? (f === 'currency' ? 'EUR' : '')]));
}

export default function ProfileTab({ restaurant, onSaved, onDraft }) {
  const { token } = useAuth();
  const { values, setValues, errors, setErrors, bind } = useForm(toForm(restaurant));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    onDraft?.(values);
  }, [values, onDraft]);

  const isDirty = FORM_FIELDS.some((f) => (restaurant[f] ?? '') !== values[f]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaved(false);
    const validation = {};
    const nameError = validateRestaurantName(values.name);
    if (nameError) validation.name = nameError;
    if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) validation.phone = 'Please enter a valid phone number';
    if (values.description.length > DESCRIPTION_MAX) validation.description = `Keep it under ${DESCRIPTION_MAX} characters`;
    if (/[<>]/.test(values.description + values.address + values.openingHours)) {
      validation.description = 'Please remove the < and > characters';
    }
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSaving(true);
    try {
      const updated = await restaurantApi.updateMine(token, values);
      onSaved(updated);
      setValues(toForm(updated));
      setSaved(true);
    } catch (err) {
      setSaveError(err.message);
      setErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="profile-title">
      <header className="panel__header">
        <h2 id="profile-title">Restaurant profile</h2>
        <p>This information is shown to clients browsing restaurants.</p>
      </header>

      <LogoUploader restaurant={restaurant} onChange={onSaved} />

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
        <div className="form__grid">
          <FormField
            label="Opening hours"
            icon={Clock}
            placeholder="Mon–Sun 11:00–23:00"
            maxLength={120}
            {...bind('openingHours')}
          />
          <FormField label="Menu currency" icon={Coins} as="select" {...bind('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </FormField>
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
  );
}
