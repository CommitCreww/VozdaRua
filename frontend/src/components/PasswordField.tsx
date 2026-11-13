import { useState, type InputHTMLAttributes } from 'react';
import { EyeIcon, LockIcon } from './Icons';

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    label?: string;
    error?: string;
    hint?: string;
};

export function PasswordField({ error, hint, id = 'password', name = id, label = 'Senha', autoComplete = 'current-password', ...props }: PasswordFieldProps = {}) {
  const [visible, setVisible] = useState(false);
  const description = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-control password-control">
        <LockIcon className="field-icon" />
        <input {...props} id={id} name={name} type={visible ? 'text' : 'password'} autoComplete={autoComplete} placeholder="Sua senha" className="has-icon" aria-invalid={error ? true : undefined} aria-describedby={description} />
        <button type="button" disabled={props.disabled} aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLocaleLowerCase('pt-BR')}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>
          <EyeIcon hidden={visible} />
        </button>
      </div>
      {hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}
