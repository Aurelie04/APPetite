import {
  Beef,
  Coffee,
  Drumstick,
  Hamburger,
  IceCreamCone,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
} from 'lucide-react';

export const CUISINES = [
  { value: 'Burgers', icon: Hamburger },
  { value: 'Pizza', icon: Pizza },
  { value: 'Chicken', icon: Drumstick },
  { value: 'Sandwiches', icon: Sandwich },
  { value: 'Tacos & Mexican', icon: Beef },
  { value: 'Asian', icon: Soup },
  { value: 'Healthy', icon: Salad },
  { value: 'Desserts', icon: IceCreamCone },
  { value: 'Café & Bakery', icon: Coffee },
  { value: 'Other', icon: UtensilsCrossed },
];

export function cuisineIcon(cuisine) {
  return CUISINES.find((c) => c.value === cuisine)?.icon ?? UtensilsCrossed;
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #ff7a18, #ff2e7e)',
  'linear-gradient(135deg, #8b3dff, #ff2e7e)',
  'linear-gradient(135deg, #13b5a6, #2f6bff)',
  'linear-gradient(135deg, #ffc93c, #ff7a18)',
  'linear-gradient(135deg, #5cc93b, #13b5a6)',
  'linear-gradient(135deg, #ef3b36, #8b3dff)',
];

export function coverGradient(seed = 0) {
  return COVER_GRADIENTS[Math.abs(Number(seed) || 0) % COVER_GRADIENTS.length];
}
