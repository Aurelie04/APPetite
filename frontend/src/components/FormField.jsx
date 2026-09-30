import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Labelled input with icon and error message. Use `as="textarea"` or `as="select"` (with <option> children). */
export default function FormField({ label, icon: Icon, error, type = 'text', as = 'input', hint, children, ...inputProps }) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = as === 'input' && type === 'password';
  const Control = as;

  return (
    <div className={`field ${error ? 'field--error' : ''} ${as !== 'input' ? `field--${as}` : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <div className="field__control">
        {Icon && <Icon className="field__icon" size={18} aria-hidden="true" />}
        <Control
          id={id}
          type={as === 'input' ? (isPassword && revealed ? 'text' : type) : undefined}
          className={`field__input ${Icon ? '' : 'field__input--plain'}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        >
          {children}
        </Control>
        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
          >
            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      ) : (
        hint && <p className="field__hint">{hint}</p>
      )}
    </div>
  );
}
