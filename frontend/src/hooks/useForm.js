import { useCallback, useState } from 'react';

export default function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const bind = useCallback(
    (field) => ({
      name: field,
      value: values[field] ?? '',
      error: errors[field],
      onChange: (e) => {
        const { value } = e.target;
        setValues((v) => ({ ...v, [field]: value }));
        setErrors((errs) => ({ ...errs, [field]: undefined }));
      },
    }),
    [values, errors],
  );

  return { values, setValues, errors, setErrors, bind };
}
