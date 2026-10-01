import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

export const MAX_QUANTITY = 20;
const CartContext = createContext(null);
const EMPTY = { restaurant: null, items: [] };

const storageKey = (user) => (user?.email ? `appetite.cart.${user.email.toLowerCase()}` : null);

function readCart(key) {
  if (!key) return EMPTY;
  try {
    const cart = JSON.parse(localStorage.getItem(key));
    return cart?.restaurant && Array.isArray(cart.items) ? cart : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Restaurant fields kept with the cart so checkout can show them before the menu is reloaded. */
const pickRestaurant = (r) => ({ id: r.id, name: r.name, currency: r.currency, logoUrl: r.logoUrl, cuisine: r.cuisine });
const pickItem = (i) => ({ id: i.id, name: i.name, price: Number(i.price), kind: i.kind });

/** One cart per signed-in client, holding items from a single restaurant. */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const key = storageKey(user);
  const [state, setState] = useState(() => ({ key, cart: readCart(key) }));
  // Switching accounts loads that account's cart (state is adjusted during render, not in an effect).
  const cart = state.key === key ? state.cart : readCart(key);
  if (state.key !== key) setState({ key, cart });

  useEffect(() => {
    if (!key) return;
    if (cart.items.length) localStorage.setItem(key, JSON.stringify(cart));
    else localStorage.removeItem(key);
  }, [key, cart]);

  const update = useCallback((fn) => setState((s) => ({ ...s, cart: fn(s.cart) })), []);

  const add = useCallback(
    (restaurant, item) =>
      update((c) => {
        const base = c.restaurant?.id === restaurant.id ? c : { restaurant: pickRestaurant(restaurant), items: [] };
        const existing = base.items.find((i) => i.id === item.id);
        const items = existing
          ? base.items.map((i) => (i.id === item.id ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + 1) } : i))
          : [...base.items, { ...pickItem(item), quantity: 1 }];
        return { restaurant: base.restaurant, items };
      }),
    [update],
  );

  const setQuantity = useCallback(
    (itemId, quantity) =>
      update((c) => {
        const items =
          quantity <= 0
            ? c.items.filter((i) => i.id !== itemId)
            : c.items.map((i) => (i.id === itemId ? { ...i, quantity: Math.min(MAX_QUANTITY, quantity) } : i));
        return items.length ? { ...c, items } : EMPTY;
      }),
    [update],
  );

  /** Refreshes names and prices from the latest menu and drops items that are no longer available. */
  const syncWithMenu = useCallback(
    (menu) =>
      update((c) => {
        const byId = new Map(menu.map((m) => [m.id, m]));
        const items = c.items
          .filter((i) => byId.has(i.id))
          .map((i) => ({ ...i, ...pickItem(byId.get(i.id)), quantity: i.quantity }));
        const changed =
          items.length !== c.items.length || items.some((i, idx) => i.price !== c.items[idx].price || i.name !== c.items[idx].name);
        if (!changed) return c;
        return items.length ? { ...c, items } : EMPTY;
      }),
    [update],
  );

  const clear = useCallback(() => update(() => EMPTY), [update]);

  const value = useMemo(() => {
    const count = cart.items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = Math.round(cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
    const quantityOf = (itemId) => cart.items.find((i) => i.id === itemId)?.quantity ?? 0;
    return { ...cart, count, subtotal, quantityOf, add, setQuantity, syncWithMenu, clear };
  }, [cart, add, setQuantity, syncWithMenu, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
