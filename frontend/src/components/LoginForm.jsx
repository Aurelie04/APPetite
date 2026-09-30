import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPath } from '../utils/roles.js';
import FormField from './FormField.jsx';
import Alert from './Alert.jsx';
import SubmitButton from './SubmitButton.jsx';
import { validateEmail } from '../utils/validation.js';

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [serverErrorType, setServerErrorType] = useState('error');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    const emailError = validateEmail(form.email);
    if (emailError) next.email = emailError;
    if (!form.password) next.password = 'Please enter your password';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login({ email: form.email.trim(), password: form.password }, remember);
      navigate(dashboardPath(user.role));
    } catch (err) {
      setServerError(err.message);
      setServerErrorType(err.status === 429 ? 'warning' : 'error');
      setErrors(err.fieldErrors ?? {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {serverError && <Alert type={serverErrorType}>{serverError}</Alert>}

      <FormField
        label="Email address"
        icon={Mail}
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={update('email')}
        error={errors.email}
      />

      <FormField
        label="Password"
        icon={Lock}
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={form.password}
        onChange={update('password')}
        error={errors.password}
      />

      <div className="form__row">
        <label className="checkbox">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span className="checkbox__box" aria-hidden="true" />
          Remember me
        </label>
        <Link to="/forgot-password" className="link">
          Forgot password?
        </Link>
      </div>

      <SubmitButton loading={loading} loadingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
