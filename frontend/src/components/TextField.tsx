import type { InputHTMLAttributes } from 'react';
import { MailIcon } from './Icons';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; icon?: 'mail'; error?: string };

export function TextField({ label, id, icon, error, ...props }: TextFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-control">
        {icon === 'mail' && <MailIcon className="field-icon" />}
        <input id={id} className={icon ? 'has-icon' : undefined} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      </div>
      {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}
