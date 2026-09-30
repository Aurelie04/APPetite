import {
  CupSoda,
  Croissant,
  Donut,
  Drumstick,
  Hamburger,
  IceCreamCone,
  Pizza,
  Popcorn,
  Salad,
  Sandwich,
  Soup,
  Cherry,
} from 'lucide-react';

const FLOATING_ICONS = [
  { Icon: Pizza, top: '8%', left: '4%', size: 46, delay: 0, rotate: -14 },
  { Icon: Hamburger, top: '72%', left: '6%', size: 54, delay: 1.5, rotate: 10 },
  { Icon: CupSoda, top: '18%', left: '44%', size: 38, delay: 3, rotate: 8 },
  { Icon: IceCreamCone, top: '84%', left: '38%', size: 42, delay: 2, rotate: -8 },
  { Icon: Drumstick, top: '10%', left: '88%', size: 44, delay: 0.8, rotate: 18 },
  { Icon: Salad, top: '62%', left: '92%', size: 48, delay: 2.6, rotate: -12 },
  { Icon: Donut, top: '42%', left: '2%', size: 36, delay: 4, rotate: 0 },
  { Icon: Sandwich, top: '90%', left: '70%', size: 44, delay: 1.1, rotate: 6 },
  { Icon: Soup, top: '4%', left: '64%', size: 36, delay: 3.6, rotate: -6 },
  { Icon: Popcorn, top: '48%', left: '52%', size: 30, delay: 5, rotate: 12 },
  { Icon: Croissant, top: '34%', left: '96%', size: 34, delay: 2.2, rotate: -20 },
  { Icon: Cherry, top: '94%', left: '14%', size: 30, delay: 4.4, rotate: 14 },
];

/** Full-screen animated backdrop using the logo palette (orange, magenta, purple, teal, green, yellow). */
export default function ColorfulBackground() {
  return (
    <div className="bg" aria-hidden="true">
      <div className="bg__blob bg__blob--orange" />
      <div className="bg__blob bg__blob--pink" />
      <div className="bg__blob bg__blob--purple" />
      <div className="bg__blob bg__blob--teal" />
      <div className="bg__blob bg__blob--yellow" />
      <div className="bg__blob bg__blob--green" />
      <div className="bg__veil" />
      {FLOATING_ICONS.map(({ Icon, top, left, size, delay, rotate }, i) => (
        <span
          key={i}
          className="bg__icon"
          style={{ top, left, animationDelay: `${delay}s`, '--rotate': `${rotate}deg` }}
        >
          <Icon size={size} strokeWidth={1.6} />
        </span>
      ))}
    </div>
  );
}
