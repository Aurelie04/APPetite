import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, Store, User } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import AccountTypeTabs from '../components/AccountTypeTabs.jsx';
import FormField from '../components/FormField.jsx';
import Alert from '../components/Alert.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import TermsCheckbox from '../components/TermsCheckbox.jsx';
import PasswordStrength from '../components/PasswordStrength.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useForm from '../hooks/useForm.js';
import { validateCredentials, validatePersonName, validateRestaurantName } from '../utils/validation.js';
import { dashboardPath } from '../utils/roles.js';

export default function RestaurantRegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { values, errors, setErrors, bind } = useForm({
    fullName: '',
    restaurantName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const validation = validateCredentials(values, acceptTerms);
    const fullNameError = validatePersonName(values.fullName);
    const restaurantNameError = validateRestaurantName(values.restaurantName);
    if (fullNameError) validation.fullName = fullNameError;
    if (restaurantNameError) validation.restaurantName = restaurantNameError;
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setLoading(true);
    try {
      const user = await register('restaurant', {
        fullName: values.fullName.trim(),
        restaurantName: values.restaurantName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
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
      title="Register your restaurant"
      crumb="Restaurant sign up"
      subtitle="Create your restaurant admin account and start reaching hungry clients."
      footer={
        <>
          Already registered?{' '}
          <Link to="/" className="link link--strong">
            Sign in
          </Link>
        </>
      }
    >
      <AccountTypeTabs />
      <form className="form" onSubmit={handleSubmit} noValidate>
        {serverError && <Alert>{serverError}</Alert>}

        <div className="form__grid">
          <FormField label="Your name" icon={User} autoComplete="name" placeholder="Jane Doe" {...bind('fullName')} />
          <FormField
            label="Restaurant name"
            icon={Store}
            autoComplete="organization"
            placeholder="Burger Palace"
            {...bind('restaurantName')}
          />
        </div>
        <FormField
          label="Email address"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="contact@restaurant.com"
          {...bind('email')}
        />
        <div className="form__grid">
          <FormField
            label="Password"
            icon={Lock}
            type="password"
            autoComplete="new-password"
            placeholder="e.g. Burger@2026"
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
        <PasswordStrength password={values.password} />

        <TermsCheckbox
          checked={acceptTerms}
          error={errors.terms}
          onChange={(checked) => {
            setAcceptTerms(checked);
            setErrors((errs) => ({ ...errs, terms: undefined }));
          }}
        />

        <SubmitButton loading={loading} loadingText="Registering…">
          Register my restaurant
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
