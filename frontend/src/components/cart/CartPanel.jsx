import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBasket } from 'lucide-react';
import QuantityStepper from './QuantityStepper.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatPrice } from '../../utils/restaurantOptions.js';

/** Cart summary for the restaurant page sidebar. */
export default function CartPanel({ restaurant }) {
  const cart = useCart();
  const isThisRestaurant = cart.restaurant?.id === restaurant.id;
  const items = isThisRestaurant ? cart.items : [];

  return (
    <section className="panel cart-panel" aria-labelledby="cart-title" id="cart">
      <header className="panel__header panel__header--row">
        <h2 id="cart-title">
          <ShoppingBasket size={20} aria-hidden="true" /> Your order
        </h2>
        {items.length > 0 && <span className="count-pill">{cart.count}</span>}
      </header>

      {items.length === 0 ? (
        <p className="muted">
          {cart.restaurant && !isThisRestaurant
            ? `Your cart has items from ${cart.restaurant.name}. Adding an item here will start a new order.`
            : 'Tap “Add” next to a dish or drink to start your order.'}
        </p>
      ) : (
        <>
          <ul className="cart-lines">
            {items.map((item) => (
              <li key={item.id} className="cart-line">
                <div className="cart-line__info">
                  <strong>{item.name}</strong>
                  <small>{formatPrice(item.price, restaurant.currency)} each</small>
                </div>
                <QuantityStepper
                  size="sm"
                  quantity={item.quantity}
                  itemName={item.name}
                  onChange={(q) => cart.setQuantity(item.id, q)}
                />
              </li>
            ))}
          </ul>
          <div className="cart-total">
            <span>Subtotal</span>
            <strong>{formatPrice(cart.subtotal, restaurant.currency)}</strong>
          </div>
          <Link to="/checkout" className="btn btn--primary btn--block">
            Proceed to checkout <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </>
      )}
    </section>
  );
}
