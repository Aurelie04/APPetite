import { useMemo, useState } from 'react';
import { RefreshCw, Search, Store } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';
import Alert from '../components/Alert.jsx';
import { restaurantApi } from '../api/client.js';
import useApiResource from '../hooks/useApiResource.js';

const ALL = 'All';

export default function ClientDashboard() {
  const { data: restaurants, error, loading, reload } = useApiResource(restaurantApi.list);
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState(ALL);

  const cuisines = useMemo(() => {
    const set = new Set((restaurants ?? []).map((r) => r.cuisine).filter(Boolean));
    return [ALL, ...[...set].sort()];
  }, [restaurants]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (restaurants ?? []).filter((r) => {
      if (cuisine !== ALL && r.cuisine !== cuisine) return false;
      if (!q) return true;
      return [r.name, r.cuisine, r.description, r.address].some((v) => v?.toLowerCase().includes(q));
    });
  }, [restaurants, query, cuisine]);

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
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="panel empty">
          <Store size={40} aria-hidden="true" />
          <h2>{restaurants?.length ? 'No restaurant matches your search' : 'No restaurants yet'}</h2>
          <p>
            {restaurants?.length
              ? 'Try another keyword or cuisine.'
              : 'Restaurants will appear here as soon as they register on Appétite.'}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
