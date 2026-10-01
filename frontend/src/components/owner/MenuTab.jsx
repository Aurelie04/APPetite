import { useMemo, useState } from 'react';
import { CupSoda, Eye, EyeOff, Pencil, Plus, RefreshCw, Save, Tag, Trash2, UtensilsCrossed, X } from 'lucide-react';
import FormField from '../FormField.jsx';
import Alert from '../Alert.jsx';
import { menuApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useApiResource from '../../hooks/useApiResource.js';
import useForm from '../../hooks/useForm.js';
import { BEVERAGE_CATEGORIES, FOOD_CATEGORIES, formatPrice } from '../../utils/restaurantOptions.js';

const PRICE_RE = /^\d{1,5}([.,]\d{1,2})?$/;
const KINDS = [
  { value: 'FOOD', label: 'Food', icon: UtensilsCrossed },
  { value: 'BEVERAGE', label: 'Beverage', icon: CupSoda },
];
const EMPTY = { kind: 'FOOD', name: '', category: '', price: '', description: '', available: true };

function toForm(item) {
  return item
    ? { ...item, category: item.category ?? '', description: item.description ?? '', price: String(item.price) }
    : EMPTY;
}

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Give the item a name';
  else if (values.name.length > 80) errors.name = 'Keep the name under 80 characters';
  if (!PRICE_RE.test(values.price.trim())) errors.price = 'Enter a price like 7.50 (max 2 decimals)';
  if (values.category.length > 40) errors.category = 'Keep the category under 40 characters';
  if (values.description.length > 300) errors.description = 'Keep the description under 300 characters';
  for (const field of ['name', 'category', 'description']) {
    if (/[<>]/.test(values[field])) errors[field] = 'Please remove the < and > characters';
  }
  return errors;
}

function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.category || 'Other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()];
}

export default function MenuTab({ currency, onMenuChanged }) {
  const { token } = useAuth();
  const { data: items, setData: setItems, error: loadError, loading, reload } = useApiResource(menuApi.list);
  const { values, setValues, errors, setErrors, bind } = useForm(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const sections = useMemo(
    () => KINDS.map((kind) => ({ ...kind, items: (items ?? []).filter((i) => i.kind === kind.value) })),
    [items],
  );

  const resetForm = () => {
    setEditingId(null);
    setValues(EMPTY);
    setErrors({});
  };

  const replaceItem = (saved) =>
    setItems((list) => {
      const exists = list.some((i) => i.id === saved.id);
      return exists ? list.map((i) => (i.id === saved.id ? saved : i)) : [...list, saved];
    });

  const toPayload = (v) => ({
    kind: v.kind,
    name: v.name.trim(),
    category: v.category.trim(),
    description: v.description.trim(),
    price: Number(v.price.trim().replace(',', '.')),
    available: v.available,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSaving(true);
    try {
      const payload = toPayload(values);
      const saved = editingId ? await menuApi.update(token, editingId, payload) : await menuApi.create(token, payload);
      replaceItem(saved);
      setMessage({ type: 'success', text: `${saved.name} ${editingId ? 'updated' : 'added to your menu'}.` });
      resetForm();
      onMenuChanged();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setMessage(null);
    setEditingId(item.id);
    setValues(toForm(item));
    setErrors({});
    document.getElementById('menu-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleAvailable = async (item) => {
    setMessage(null);
    try {
      replaceItem(await menuApi.update(token, item.id, { ...toPayload(toForm(item)), available: !item.available }));
      onMenuChanged();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove "${item.name}" from your menu?`)) return;
    setMessage(null);
    try {
      await menuApi.remove(token, item.id);
      setItems((list) => list.filter((i) => i.id !== item.id));
      if (editingId === item.id) resetForm();
      onMenuChanged();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const categories = values.kind === 'BEVERAGE' ? BEVERAGE_CATEGORIES : FOOD_CATEGORIES;

  return (
    <div className="stack">
      <section className="panel" id="menu-form" aria-labelledby="menu-form-title">
        <header className="panel__header">
          <h2 id="menu-form-title">{editingId ? 'Edit menu item' : 'Add to your menu'}</h2>
          <p>Add your dishes and drinks with their prices. Prices are shown in {currency}.</p>
        </header>

        <form className="form" onSubmit={handleSubmit} noValidate>
          {message && <Alert type={message.type}>{message.text}</Alert>}

          <div className="segmented" role="radiogroup" aria-label="Item type">
            {KINDS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={values.kind === value}
                className={`segmented__item ${values.kind === value ? 'segmented__item--active' : ''}`}
                onClick={() => setValues((v) => ({ ...v, kind: value }))}
              >
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          <div className="form__grid">
            <FormField
              label={values.kind === 'BEVERAGE' ? 'Drink name' : 'Dish name'}
              icon={values.kind === 'BEVERAGE' ? CupSoda : UtensilsCrossed}
              placeholder={values.kind === 'BEVERAGE' ? 'Fresh lemonade 50cl' : 'Double cheeseburger'}
              maxLength={80}
              {...bind('name')}
            />
            <FormField
              label={`Price (${currency})`}
              icon={Tag}
              inputMode="decimal"
              placeholder="7.50"
              {...bind('price')}
            />
          </div>
          <FormField
            label={values.kind === 'BEVERAGE' ? 'Category (type of drink)' : 'Category (type of food)'}
            placeholder={categories[0]}
            list="menu-categories"
            maxLength={40}
            hint="Pick a suggestion or type your own"
            {...bind('category')}
          />
          <datalist id="menu-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <FormField
            label="Description (optional)"
            as="textarea"
            rows={2}
            maxLength={300}
            placeholder="Ingredients, size, allergens…"
            {...bind('description')}
          />

          <label className="checkbox">
            <input
              type="checkbox"
              checked={values.available}
              onChange={(e) => setValues((v) => ({ ...v, available: e.target.checked }))}
            />
            <span className="checkbox__box" aria-hidden="true" />
            Available now (visible to clients)
          </label>

          <div className="form__actions form__actions--split">
            {editingId && (
              <button type="button" className="btn btn--ghost" onClick={resetForm}>
                <X size={16} aria-hidden="true" /> Cancel
              </button>
            )}
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {editingId ? <Save size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
              {saving ? 'Saving…' : editingId ? 'Save item' : 'Add item'}
            </button>
          </div>
        </form>
      </section>

      {loadError && (
        <div className="panel">
          <Alert>{loadError}</Alert>
          <button type="button" className="btn btn--ghost" onClick={reload}>
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      )}

      {loading && !items && <div className="panel panel--loading">Loading your menu…</div>}

      {items &&
        sections.map(({ value, label, icon: Icon, items: sectionItems }) => (
          <section key={value} className="panel" aria-labelledby={`menu-${value}`}>
            <header className="panel__header panel__header--row">
              <h2 id={`menu-${value}`}>
                <Icon size={20} aria-hidden="true" /> {value === 'FOOD' ? 'Food' : 'Beverages'}
              </h2>
              <span className="count-pill">{sectionItems.length}</span>
            </header>

            {sectionItems.length === 0 ? (
              <p className="muted">
                No {label.toLowerCase()} items yet. Use the form above to add your first{' '}
                {value === 'FOOD' ? 'dish' : 'drink'}.
              </p>
            ) : (
              groupByCategory(sectionItems).map(([category, list]) => (
                <div key={category} className="menu-group">
                  <h3 className="menu-group__title">{category}</h3>
                  <ul className="menu-list">
                    {list.map((item) => (
                      <li key={item.id} className={`menu-row ${item.available ? '' : 'menu-row--hidden'}`}>
                        <div className="menu-row__info">
                          <strong>{item.name}</strong>
                          {item.description && <p>{item.description}</p>}
                          {!item.available && <span className="menu-row__status">Hidden from clients</span>}
                        </div>
                        <span className="menu-row__price">{formatPrice(item.price, currency)}</span>
                        <div className="menu-row__actions">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => toggleAvailable(item)}
                            title={item.available ? 'Hide from clients' : 'Show to clients'}
                            aria-label={item.available ? `Hide ${item.name}` : `Show ${item.name}`}
                          >
                            {item.available ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => startEdit(item)}
                            title="Edit"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn icon-btn--danger"
                            onClick={() => remove(item)}
                            title="Delete"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>
        ))}
    </div>
  );
}
