import { useState } from 'react';
import { EyeIcon, LockIcon } from './Icons';

export function PasswordField({ error }: { error?: string } = {}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor="password">Senha</label>
      <div className="field-control password-control">
        <LockIcon className="field-icon" />
        <input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" className="has-icon" aria-invalid={error ? true : undefined} aria-describedby={error ? 'password-error' : undefined} />
        <button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visible} onClick={() => setVisible(!visible)}>
          <EyeIcon hidden={visible} />
        </button>
      </div>
      {error && <p className="field-error" id="password-error" role="alert">{error}</p>}
    </div>
  );
}
