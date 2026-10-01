import { Check } from 'lucide-react';

/** Large selectable card; `type="radio"` for single choice, `checkbox` for multiple. */
export default function ChoiceCard({ option, checked, onChange, type = 'checkbox', name, disabled = false }) {
  const Icon = option.icon;
  return (
    <label className={`option-card ${checked ? 'option-card--checked' : ''} ${disabled ? 'option-card--disabled' : ''}`}>
      <input type={type} name={name} value={option.value} checked={checked} onChange={onChange} disabled={disabled} />
      <span className="option-card__icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <span className="option-card__text">
        <strong>{option.label}</strong>
        {option.hint && <small>{option.hint}</small>}
      </span>
      <span className="option-card__check" aria-hidden="true">
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
    </label>
  );
}
