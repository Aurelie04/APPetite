import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Circle, CircleCheck, CreditCard, ExternalLink, ReceiptText, RefreshCw, Store, UtensilsCrossed } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';
import Alert from '../components/Alert.jsx';
import ProfileTab, { PROFILE_FIELDS } from '../components/owner/ProfileTab.jsx';
import MenuTab from '../components/owner/MenuTab.jsx';
import OptionsTab from '../components/owner/OptionsTab.jsx';
import OrdersTab from '../components/owner/OrdersTab.jsx';
import { restaurantApi, restaurantOrderApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useApiResource from '../hooks/useApiResource.js';
import usePolling from '../hooks/usePolling.js';
import { displayName } from '../utils/roles.js';

const ORDERS_REFRESH_MS = 15000;

const TABS = [
  { id: 'orders', label: 'Orders', icon: ReceiptText },
  { id: 'profile', label: 'Profile & logo', icon: Store },
  { id: 'menu', label: 'Menu & prices', icon: UtensilsCrossed },
  { id: 'options', label: 'Payments & services', icon: CreditCard },
];

export default function RestaurantDashboard() {
  const { token, user } = useAuth();
  const { data: restaurant, setData: setRestaurant, error: loadError, loading, reload } = useApiResource(restaurantApi.mine);
  const orders = useApiResource(restaurantOrderApi.list);
  const { setData: setOrders } = orders;
  usePolling(orders.refresh, ORDERS_REFRESH_MS);
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(null);
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'profile';
  const newOrders = orders.data?.filter((o) => o.status === 'PLACED').length ?? 0;

  const handleOrderUpdated = useCallback(
    (updated) => setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o))),
    [setOrders],
  );

  const selectTab = (id) => {
    setDraft(null);
    setParams(id === 'profile' ? {} : { tab: id });
  };

  const refreshSummary = useCallback(() => {
    restaurantApi.mine(token).then(setRestaurant).catch(() => {});
  }, [token, setRestaurant]);

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

  const profileDone = PROFILE_FIELDS.filter((f) => restaurant[f]).length;
  const checklist = [
    { label: 'Create your restaurant account', done: true },
    { label: `Complete your profile (${profileDone}/${PROFILE_FIELDS.length})`, done: profileDone === PROFILE_FIELDS.length, tab: 'profile' },
    { label: 'Upload your logo', done: Boolean(restaurant.logoUrl), tab: 'profile' },
    { label: 'Add food to your menu', done: restaurant.menu?.foodCount > 0, tab: 'menu' },
    { label: 'Add beverages', done: restaurant.menu?.beverageCount > 0, tab: 'menu' },
    {
      label: 'Choose payment methods & services',
      done: restaurant.serviceOptions?.length > 0 && restaurant.paymentMethods?.length > 0,
      tab: 'options',
    },
  ];
  const progress = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
  const preview = draft ? { ...restaurant, ...draft, name: draft.name || restaurant.name } : restaurant;

  return (
    <DashboardLayout>
      <section className="dash-hero">
        <div>
          <p className="dash-hero__eyebrow">Welcome back, {displayName(user).split(' ')[0]}</p>
          <h1 className="dash-hero__title">{restaurant.name}</h1>
          <p className="dash-hero__subtitle">
            <span className="live-dot" aria-hidden="true" /> Visible to all clients on Appétite
          </p>
        </div>
        <Link to={`/restaurants/${restaurant.id}`} className="btn btn--ghost">
          <ExternalLink size={16} aria-hidden="true" /> View my public page
        </Link>
      </section>

      <div className="dash-tabs" role="tablist" aria-label="Manage your restaurant">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            className={`dash-tab ${tab === id ? 'dash-tab--active' : ''}`}
            onClick={() => selectTab(id)}
          >
            <Icon size={17} aria-hidden="true" /> {label}
            {id === 'orders' && newOrders > 0 && (
              <span className="tab-badge" aria-label={`${newOrders} new`}>
                {newOrders}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'orders' ? (
        <div role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
          <OrdersTab
            orders={orders.data}
            error={orders.error}
            loading={orders.loading}
            onReload={orders.reload}
            onUpdated={handleOrderUpdated}
            restaurant={restaurant}
            onOpenOptions={() => selectTab('options')}
          />
        </div>
      ) : (
      <div className="dash-grid">
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'profile' && <ProfileTab restaurant={restaurant} onSaved={setRestaurant} onDraft={setDraft} />}
          {tab === 'menu' && <MenuTab currency={restaurant.currency} onMenuChanged={refreshSummary} />}
          {tab === 'options' && <OptionsTab restaurant={restaurant} onSaved={setRestaurant} />}
        </div>

        <aside className="dash-side">
          <section className="panel" aria-labelledby="preview-title">
            <header className="panel__header">
              <h2 id="preview-title">Client preview</h2>
              <p>How your restaurant appears on the client dashboard.</p>
            </header>
            <RestaurantCard restaurant={preview} />
          </section>

          <section className="panel" aria-labelledby="checklist-title">
            <header className="panel__header">
              <h2 id="checklist-title">Getting started</h2>
            </header>
            <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <ul className="checklist">
              {checklist.map(({ label, done, tab: target }) => (
                <li key={label} className={done ? 'checklist__item--done' : ''}>
                  {done ? <CircleCheck size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
                  {!done && target ? (
                    <button type="button" className="link-btn" onClick={() => selectTab(target)}>
                      {label}
                    </button>
                  ) : (
                    <span>{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
      )}
    </DashboardLayout>
  );
}
