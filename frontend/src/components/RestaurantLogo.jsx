import { useState } from 'react';
import { apiUrl } from '../api/client.js';
import { coverGradient, cuisineIcon } from '../utils/cuisines.js';

/** The restaurant's uploaded logo, or its cuisine icon on a colourful gradient when there is none. */
export default function RestaurantLogo({ restaurant, size = 64, className = '' }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const url = apiUrl(restaurant?.logoUrl);
  const Icon = cuisineIcon(restaurant?.cuisine);
  const showImage = url && failedUrl !== url;

  return (
    <span
      className={`rlogo ${showImage ? 'rlogo--image' : ''} ${className}`}
      style={{ width: size, height: size, background: showImage ? '#fff' : coverGradient(restaurant?.id) }}
    >
      {showImage ? (
        <img src={url} alt={`${restaurant?.name ?? 'Restaurant'} logo`} onError={() => setFailedUrl(url)} />
      ) : (
        <Icon size={Math.round(size * 0.48)} strokeWidth={1.7} aria-hidden="true" />
      )}
    </span>
  );
}
