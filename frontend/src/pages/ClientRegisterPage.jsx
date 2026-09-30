import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import AccountTypeTabs from '../components/AccountTypeTabs.jsx';
import FormField from '../components/FormField.jsx';
import Alert from '../components/Alert.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import TermsCheckbox from '../components/TermsCheckbox.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useForm from '../hooks/useForm.js';
import { validateCredentials } from '../utils/validation.js';
import { dashboardPath } from '../utils/roles.js';

export default function ClientRegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { values, errors, setErrors, bind } = useForm({ email: '', password: '', confirmPassword: '' });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const validation = validateCredentials(values, acceptTerms);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setLoading(true);
    try {
      const user = await register('client', { email: values.email.trim(), password: values.password });
      navigate(dashboardPath(user.role));
    } catch (err) {
      setServerError(err.message);
      setErrors(err.fieldErrors ?? {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your client account"
      subtitle="Discover every restaurant on Appétite and get your favourite food fast."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/" className="link link--strong">
            Sign in
          </Link>
        </>
      }
    >
      <AccountTypeTabs />
      <form className="form" onSubmit={handleSubmit} noValidate>
        {serverError && <Alert>{serverError}</Alert>}

        <FormField
          label="Email address"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...bind('email')}
        />
        <div className="form__grid">
          <FormField
            label="Password"
            icon={Lock}
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            {...bind('password')}
          />
          <FormField
            label="Confirm password"
            icon={ShieldCheck}
            type="password"
            autoComplete="new-password"
            placeholder="Repeat it"
            {...bind('confirmPassword')}
          />
        </div>

        <TermsCheckbox
          checked={acceptTerms}
          error={errors.terms}
          onChange={(checked) => {
            setAcceptTerms(checked);
            setErrors((errs) => ({ ...errs, terms: undefined }));
          }}
        />

        <SubmitButton loading={loading} loadingText="Creating account…">
          Create client account
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
