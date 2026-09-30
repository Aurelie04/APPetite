import { ArrowRight, LoaderCircle } from 'lucide-react';

export default function SubmitButton({ loading, children, loadingText = 'Please wait…' }) {
  return (
    <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
      {loading ? (
        <>
          <LoaderCircle size={18} className="spin" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        <>
          {children}
          <ArrowRight size={18} aria-hidden="true" />
        </>
      )}
    </button>
  );
}
