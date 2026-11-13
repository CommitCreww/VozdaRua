import { AuthLayout } from '../components/AuthLayout';
import { PasswordField } from '../components/PasswordField';
import { TextField } from '../components/TextField';
import { GitHubIcon, GoogleIcon } from '../components/Icons';

export function LoginPage() {
  return (
    <AuthLayout>
      <h1 id="login-title">Bem-vindo(a)!</h1>
      <p className="auth-subtitle">Use sua voz para evolução</p>
      <form onSubmit={(event) => event.preventDefault()}>
        <TextField id="email" label="E-mail" name="email" type="email" autoComplete="username" placeholder="Seu e-mail" icon="mail" />
        <PasswordField />
        <div className="support-action"><button type="button" disabled>Esqueceu a senha?</button></div>
        <button className="primary-button" type="submit" disabled>Entrar <span aria-hidden="true">→</span></button>
      </form>
      <div className="divider"><span>ou continue com</span></div>
      <div className="social-actions">
        <button type="button" disabled><GoogleIcon />Google</button>
        <button type="button" disabled><GitHubIcon />GitHub</button>
      </div>
      <p className="auth-footer">Ainda não tem conta? <button type="button" disabled>Criar conta</button></p>
      <p className="availability-note" role="status">Acesso temporariamente indisponível.</p>
    </AuthLayout>
  );
}
