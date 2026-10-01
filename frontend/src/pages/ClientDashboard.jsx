import { useMemo, useState } from 'react';
import { RefreshCw, Search, Store } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';
import Alert from '../components/Alert.jsx';
import { restaurantApi } from '../api/client.js';
import useApiResource from '../hooks/useApiResource.js';
import { SERVICE_OPTIONS, acceptsOnline } from '../utils/restaurantOptions.js';

const ALL = 'All';

/** Quick filters on services and payment options; a restaurant must match every selected one. */
const OPTION_FILTERS = [
  ...SERVICE_OPTIONS.map((s) => ({ id: s.value, label: s.label, test: (r) => r.serviceOptions?.includes(s.value) })),
  { id: 'CASH', label: 'Cash on arrival', test: (r) => r.paymentMethods?.includes('CASH_ON_ARRIVAL') },
  { id: 'ONLINE', label: 'Pay online', test: (r) => acceptsOnline(r.paymentMethods) },
];

export default function ClientDashboard() {
  const { data: restaurants, error, loading, reload } = useApiResource(restaurantApi.list);
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState(ALL);
  const [options, setOptions] = useState([]);

  const cuisines = useMemo(() => {
    const set = new Set((restaurants ?? []).map((r) => r.cuisine).filter(Boolean));
    return [ALL, ...[...set].sort()];
  }, [restaurants]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const activeFilters = OPTION_FILTERS.filter((f) => options.includes(f.id));
    return (restaurants ?? []).filter((r) => {
      if (cuisine !== ALL && r.cuisine !== cuisine) return false;
      if (!activeFilters.every((f) => f.test(r))) return false;
      if (!q) return true;
      return [r.name, r.cuisine, r.description, r.address].some((v) => v?.toLowerCase().includes(q));
    });
  }, [restaurants, query, cuisine, options]);

  const toggleOption = (id) => setOptions((list) => (list.includes(id) ? list.filter((o) => o !== id) : [...list, id]));
  const hasFilters = query || cuisine !== ALL || options.length > 0;

  return (
    <DashboardLayout>
      <section className="dash-hero">
        <div>
          <h1 className="dash-hero__title">
            What are you <span className="gradient-text">craving</span> today?
          </h1>
          <p className="dash-hero__subtitle">
            {restaurants
              ? `${restaurants.length} restaurant${restaurants.length === 1 ? '' : 's'} on Appétite`
              : 'Browse every restaurant on Appétite'}
          </p>
        </div>
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search restaurants, cuisines, addresses…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search restaurants"
          />
        </label>
      </section>

      {cuisines.length > 1 && (
        <div className="filters" role="toolbar" aria-label="Filter by cuisine">
          {cuisines.map((c) => (
            <button
              key={c}
              type="button"
              className={`filter ${cuisine === c ? 'filter--active' : ''}`}
              onClick={() => setCuisine(c)}
              aria-pressed={cuisine === c}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {restaurants?.length > 0 && (
        <div className="filters filters--options" role="toolbar" aria-label="Filter by services and payment">
          {OPTION_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`filter filter--option ${options.includes(id) ? 'filter--active' : ''}`}
              onClick={() => toggleOption(id)}
              aria-pressed={options.includes(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="panel">
          <Alert>{error}</Alert>
          <button type="button" className="btn btn--ghost" onClick={reload}>
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      )}

      {loading && (
        <div className="grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rcard rcard--skeleton" aria-hidden="true" />
          ))}
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="grid">
          {visible.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} to={`/restaurants/${r.id}`} />
          ))}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="panel empty">
          <Store size={40} aria-hidden="true" />
          <h2>{restaurants?.length ? 'No restaurant matches your filters' : 'No restaurants yet'}</h2>
          <p>
            {restaurants?.length
              ? 'Try another keyword, cuisine or option.'
              : 'Restaurants will appear here as soon as they register on Appétite.'}
          </p>
          {hasFilters && restaurants?.length > 0 && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setQuery('');
                setCuisine(ALL);
                setOptions([]);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
