// Keep these in sync with backend ValidationPatterns / StrongPasswordValidator.
export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
export const PERSON_NAME_RE = /^\p{L}[\p{L} '.-]{1,99}$/u;
export const RESTAURANT_NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} '&.,!-]{1,119}$/u;
export const PHONE_RE = /^[+0-9 ()-]{6,20}$/;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 100;

export const PASSWORD_RULES = [
  { id: 'length', label: `At least ${PASSWORD_MIN} characters`, test: (p) => p.length >= PASSWORD_MIN },
  { id: 'upper', label: 'An uppercase letter', test: (p) => /\p{Lu}/u.test(p) },
  { id: 'lower', label: 'A lowercase letter', test: (p) => /\p{Ll}/u.test(p) },
  { id: 'number', label: 'A number', test: (p) => /\p{Nd}/u.test(p) },
  { id: 'special', label: 'A special character (!@#$…)', test: (p) => /[^\p{L}\p{N}\s]/u.test(p) },
];

export function passwordChecks(password) {
  return PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) }));
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters`;
  if (/\s/.test(password)) return 'Password must not contain spaces';
  const missing = passwordChecks(password).filter((c) => !c.passed);
  if (missing.length) return 'Password is too weak — it must meet every rule below';
  return null;
}

export function validateEmail(email) {
  const value = email.trim();
  if (!value) return 'Email is required';
  if (value.length > 150 || !EMAIL_RE.test(value)) return 'Please enter a valid email address (e.g. name@example.com)';
  return null;
}

export function validatePersonName(name) {
  const value = name.trim();
  if (!value) return 'Please enter your name';
  if (!PERSON_NAME_RE.test(value)) {
    return 'Name must be 2–100 characters and contain only letters, spaces, apostrophes, dots or hyphens';
  }
  return null;
}

export function validateRestaurantName(name) {
  const value = name.trim();
  if (!value) return 'Please enter the name of your restaurant';
  if (!RESTAURANT_NAME_RE.test(value)) {
    return "Restaurant name must be 2–120 characters and may contain letters, numbers, spaces and ' & . , ! -";
  }
  return null;
}

function collect(entries) {
  return Object.fromEntries(entries.filter(([, message]) => message));
}

/** Shared checks for the email / password / confirmation / terms part of both sign-up forms. */
export function validateCredentials({ email, password, confirmPassword }, acceptTerms) {
  return collect([
    ['email', validateEmail(email)],
    ['password', validatePassword(password)],
    ['confirmPassword', confirmPassword !== password && 'Passwords do not match'],
    ['terms', !acceptTerms && 'Please accept the terms to continue'],
  ]);
}

export function validateNewPassword({ password, confirmPassword }) {
  return collect([
    ['password', validatePassword(password)],
    ['confirmPassword', confirmPassword !== password && 'Passwords do not match'],
  ]);
}
