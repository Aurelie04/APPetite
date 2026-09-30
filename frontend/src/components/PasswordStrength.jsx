import { Check, X } from 'lucide-react';
import { passwordChecks } from '../utils/validation.js';

const LEVELS = [
  { label: 'Too weak', tone: 'weak' },
  { label: 'Too weak', tone: 'weak' },
  { label: 'Weak', tone: 'weak' },
  { label: 'Fair', tone: 'fair' },
  { label: 'Almost there', tone: 'good' },
  { label: 'Strong', tone: 'strong' },
];

export default function PasswordStrength({ password, id }) {
  const checks = passwordChecks(password);
  const score = checks.filter((c) => c.passed).length;
  const level = LEVELS[score];

  return (
    <div className="strength" id={id} aria-live="polite">
      <div className="strength__head">
        <div className={`strength__bar strength__bar--${password ? level.tone : 'empty'}`}>
          <span style={{ width: `${(score / checks.length) * 100}%` }} />
        </div>
        <span className={`strength__label strength__label--${password ? level.tone : 'empty'}`}>
          {password ? level.label : 'Password strength'}
        </span>
      </div>
      <ul className="strength__rules">
        {checks.map((check) => (
          <li key={check.id} className={check.passed ? 'is-passed' : ''}>
            {check.passed ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
