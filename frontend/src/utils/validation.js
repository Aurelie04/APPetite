export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[+0-9 ()-]{6,20}$/;

/** Shared checks for the email / password / confirmation / terms part of both sign-up forms. */
export function validateCredentials({ email, password, confirmPassword }, acceptTerms) {
  const errors = {};
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
  if (!acceptTerms) errors.terms = 'Please accept the terms to continue';
  return errors;
}
