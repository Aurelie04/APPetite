import { CircleAlert, CircleCheck } from 'lucide-react';

export default function Alert({ type = 'error', children }) {
  const Icon = type === 'success' ? CircleCheck : CircleAlert;
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} className="alert__icon" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
