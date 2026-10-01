import { Minus, Plus, Trash2 } from 'lucide-react';
import { MAX_QUANTITY } from '../../context/CartContext.jsx';

export default function QuantityStepper({ quantity, onChange, itemName, size = 'md' }) {
  return (
    <div className={`stepper stepper--${size}`} role="group" aria-label={`Quantity of ${itemName}`}>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(quantity - 1)}
        aria-label={quantity === 1 ? `Remove ${itemName}` : `One less ${itemName}`}
      >
        {quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
      </button>
      <span className="stepper__value" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= MAX_QUANTITY}
        aria-label={`One more ${itemName}`}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
