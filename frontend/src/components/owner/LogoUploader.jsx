import { useRef, useState } from 'react';
import { ImageUp, Trash2 } from 'lucide-react';
import RestaurantLogo from '../RestaurantLogo.jsx';
import Alert from '../Alert.jsx';
import { restaurantApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_BYTES = 2 * 1024 * 1024;

export default function LogoUploader({ restaurant, onChange }) {
  const { token } = useAuth();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      onChange(await action());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError('Please choose a PNG, JPG, WEBP or GIF image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('The logo must be 2 MB or smaller.');
      return;
    }
    run(() => restaurantApi.uploadLogo(token, file));
  };

  return (
    <div className="logo-upload">
      <RestaurantLogo restaurant={restaurant} size={96} className="logo-upload__preview" />
      <div className="logo-upload__body">
        <strong>Restaurant logo</strong>
        <p>Square images look best. PNG, JPG, WEBP or GIF, up to 2 MB.</p>
        <div className="logo-upload__actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            <ImageUp size={16} aria-hidden="true" />
            {busy ? 'Uploading…' : restaurant?.logoUrl ? 'Change logo' : 'Upload logo'}
          </button>
          {restaurant?.logoUrl && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => run(() => restaurantApi.deleteLogo(token))}
              disabled={busy}
            >
              <Trash2 size={16} aria-hidden="true" /> Remove
            </button>
          )}
        </div>
        {error && <Alert>{error}</Alert>}
        <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} onChange={handleFile} hidden />
      </div>
    </div>
  );
}
