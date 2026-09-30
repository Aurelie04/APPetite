import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import Alert from '../components/Alert.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import { authApi } from '../api/client.js';
import { validateEmail } from '../utils/validation.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      setResult(await authApi.forgotPassword({ email: email.trim() }));
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPath = result?.resetUrl ? new URL(result.resetUrl).pathname + new URL(result.resetUrl).search : null;

  return (
    <AuthLayout
      title="Forgot your password?"
      crumb="Forgot password"
      subtitle="Enter the email linked to your account and we'll send you a reset link."
      footer={
        <Link to="/" className="link link--strong link--icon">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      }
    >
      {result ? (
        <div className="form">
          <Alert type="success">{result.message}</Alert>
          {resetPath && (
            <div className="dev-note">
              <strong>Development mode:</strong> no email server is configured yet, so here is your reset link:
              <Link to={resetPath} className="link link--strong">
                Reset my password
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          {serverError && <Alert>{serverError}</Alert>}
          <FormField
            label="Email address"
            icon={Mail}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            error={error}
          />
          <SubmitButton loading={loading} loadingText="Sending link…">
            Send reset link
          </SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
