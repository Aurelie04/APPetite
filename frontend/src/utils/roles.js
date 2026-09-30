export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  RESTAURANT: 'RESTAURANT',
};

export function dashboardPath(role) {
  return role === ROLES.RESTAURANT ? '/restaurant' : '/client';
}

export function displayName(user) {
  if (!user) return '';
  return user.fullName?.trim() || user.email?.split('@')[0] || '';
}
