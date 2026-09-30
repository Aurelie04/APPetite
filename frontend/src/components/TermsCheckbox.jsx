export default function TermsCheckbox({ checked, onChange, error }) {
  return (
    <div>
      <label className="checkbox">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="checkbox__box" aria-hidden="true" />
        I agree to the terms of service and privacy policy
      </label>
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}
