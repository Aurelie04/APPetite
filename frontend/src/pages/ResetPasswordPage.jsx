import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import Alert from '../components/Alert.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import { authApi } from '../api/client.js';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const next = {};
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await authApi.resetPassword({ token, password: form.password });
      setSuccessMessage(res.message);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const backLink = (
    <Link to="/" className="link link--strong link--icon">
      <ArrowLeft size={16} /> Back to sign in
    </Link>
  );

  if (!token) {
    return (
      <AuthLayout title="Invalid reset link" footer={backLink}>
        <Alert>This password reset link is missing its token. Please request a new one.</Alert>
        <Link to="/forgot-password" className="btn btn--primary btn--block">
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Make it strong — at least 8 characters." footer={backLink}>
      {successMessage ? (
        <div className="form">
          <Alert type="success">{successMessage}</Alert>
          <Link to="/" className="btn btn--primary btn--block">
            Go to sign in
          </Link>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          {serverError && <Alert>{serverError}</Alert>}
          <FormField
            label="New password"
            icon={KeyRound}
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
          />
          <FormField
            label="Confirm new password"
            icon={ShieldCheck}
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            error={errors.confirmPassword}
          />
          <SubmitButton loading={loading} loadingText="Updating…">
            Update password
          </SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
