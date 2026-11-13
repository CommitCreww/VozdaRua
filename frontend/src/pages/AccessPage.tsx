import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordField } from '../components/PasswordField';
import { TextField } from '../components/TextField';
import { GitHubIcon, GoogleIcon } from '../components/Icons';
import { AuthRequestError, type AccessMode, type AuthConnection } from '../features/auth/contracts';
import { formText, validateAccess, type FieldErrors } from '../features/auth/validation';

const content: Record<AccessMode, { title: string; subtitle: string; action: string; pending: string }> = {
    login: { title: 'Bem-vindo(a)!', subtitle: 'Use sua voz para evolução', action: 'Entrar', pending: 'Entrando…' },
    register: { title: 'Criar conta', subtitle: 'Sua participação começa aqui. Juntos, podemos melhorar nossa cidade.', action: 'Cadastrar', pending: 'Cadastrando…' },
    forgot: { title: 'Recuperar acesso', subtitle: 'Informe seu e-mail para solicitar a recuperação de acesso.', action: 'Enviar link de recuperação', pending: 'Enviando…' },
    reset: { title: 'Definir nova senha', subtitle: 'Escolha uma nova senha para voltar a participar.', action: 'Redefinir senha', pending: 'Redefinindo…' },
    verify: { title: 'Confirme seu e-mail', subtitle: 'Falta só confirmar seu e-mail para você poder entrar.', action: 'Confirmar e-mail', pending: 'Confirmando…' },
    resend: { title: 'Reenviar confirmação', subtitle: 'Informe seu e-mail para solicitar uma nova confirmação.', action: 'Reenviar confirmação', pending: 'Enviando…' },
};

const successMessages: Partial<Record<AccessMode, string>> = {
    register: 'Solicitação recebida. Se aplicável, você receberá as instruções de confirmação por e-mail. Depois de confirmar, volte para entrar.',
    forgot: 'Se houver uma conta local elegível para este e-mail, você receberá as instruções de recuperação.',
    resend: 'Se houver uma conta aguardando confirmação, você receberá novas instruções por e-mail.',
    verify: 'E-mail confirmado! Agora você pode entrar com sua conta.',
    reset: 'Senha redefinida! Entre novamente com sua nova senha.',
};

export interface AccessPageProps {
    mode: AccessMode;
    connection?: AuthConnection;
}

export function AccessPage({ mode, connection }: AccessPageProps) {
    const [errors, setErrors] = useState<FieldErrors>({});
    const [pending, setPending] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [success, setSuccess] = useState(false);
    const [unverified, setUnverified] = useState(false);
    const busy = useRef(false);
    const mounted = useRef(true);
    const feedbackRef = useRef<HTMLDivElement>(null);
    const copy = content[mode];
    const titleId = mode === 'login' ? 'login-title' : `${mode}-title`;
    const legalReady = Boolean(connection?.legalDocuments?.termsVersion && connection.legalDocuments.privacyVersion);
    const available = Boolean(connection) && (mode !== 'register' || legalReady);

    useEffect(() => {
        mounted.current = true;
        document.title = `${copy.title} — Voz da Rua`;
        return () => { mounted.current = false; };
    }, [copy.title]);
    useEffect(() => { if (feedback) feedbackRef.current?.focus(); }, [feedback]);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy.current || !available || !connection) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        const nextErrors = validateAccess(mode, data);
        setErrors(nextErrors);
        setFeedback('');
        setUnverified(false);
        if (Object.keys(nextErrors).length) {
            const first = form.elements.namedItem(Object.keys(nextErrors)[0]);
            if (first instanceof HTMLElement) first.focus();
            return;
        }
        busy.current = true;
        setPending(true);
        try {
            const email = formText(data, 'email').trim().toLowerCase();
            const password = formText(data, 'password');
            const passwordConfirmation = formText(data, 'passwordConfirmation');
            const token = formText(data, 'token');
            switch (mode) {
                case 'login': {
                    const result = await connection.api.login({ email, password });
                    if (!mounted.current) return;
                    form.reset();
                    connection.onAuthenticated(result);
                    return;
                }
                case 'register':
                    await connection.api.register({ name: formText(data, 'name').trim(), email, password, passwordConfirmation,
                        termsAccepted: data.get('termsAccepted') === 'on', privacyAcknowledged: data.get('privacyAcknowledged') === 'on' });
                    break;
                case 'forgot': await connection.api.forgot({ email }); break;
                case 'resend': await connection.api.resend({ email }); break;
                case 'verify': await connection.api.verify({ token }); break;
                case 'reset': await connection.api.reset({ token, password, passwordConfirmation }); break;
            }
            if (!mounted.current) return;
            form.reset();
            setSuccess(true);
            setFeedback(successMessages[mode] ?? 'Solicitação concluída.');
        } catch (error) {
            if (!mounted.current) return;
            const code = error instanceof AuthRequestError ? error.code : '';
            if (code === 'EMAIL_UNVERIFIED' && mode === 'login') {
                setUnverified(true);
                setFeedback('Confirme seu e-mail antes de entrar. Você pode solicitar uma nova confirmação.');
            } else if (code === 'RATE_LIMITED') {
                setFeedback('Muitas tentativas. Aguarde um pouco antes de tentar novamente.');
            } else if (code === 'UNAUTHORIZED' && mode === 'login') {
                setFeedback('Não foi possível entrar. Confira o e-mail e a senha.');
            } else if (code === 'INVALID_INPUT' && (mode === 'verify' || mode === 'reset')) {
                setFeedback('Não foi possível concluir. Confira os dados e solicite um novo código se ele expirou ou já foi utilizado.');
            } else if (code === 'INVALID_INPUT') {
                setFeedback('Não foi possível concluir. Confira os dados informados e tente novamente.');
            } else {
                setFeedback('Não foi possível conectar. Verifique sua conexão e tente novamente.');
            }
        } finally {
            busy.current = false;
            if (mounted.current) setPending(false);
        }
    }

    const hasEmail = ['login', 'register', 'forgot', 'resend'].includes(mode);
    const hasPassword = ['login', 'register', 'reset'].includes(mode);
    return (
        <AuthLayout titleId={titleId}>
            {mode !== 'login' && <a className="back-link" href="/login"><span aria-hidden="true">←</span> Voltar para o login</a>}
            <h1 id={titleId}>{copy.title}</h1>
            <p className="auth-subtitle">{copy.subtitle}</p>
            {!available && <p className="availability-note availability-banner" role="status">
                {mode === 'register' ? 'O cadastro ainda não está disponível. Os documentos de Termos de Uso e Política de Privacidade serão disponibilizados antes da abertura.' : 'Acesso temporariamente indisponível. Você pode conhecer as telas e voltar mais tarde.'}
            </p>}
            {feedback && <div ref={feedbackRef} tabIndex={-1} className={`form-feedback${success ? ' is-success' : ''}`} role={success ? 'status' : 'alert'}>
                <p>{feedback}</p>
                {unverified && <a href="/reenviar-confirmacao">Reenviar confirmação</a>}
            </div>}
            {success ? <div className="success-actions">
                {mode === 'register' || mode === 'resend' ? <a className="primary-button" href="/confirmar-email">Confirmar meu e-mail <span aria-hidden="true">→</span></a> : null}
                {mode === 'forgot' && <a className="primary-button" href="/redefinir-senha">Já tenho um código <span aria-hidden="true">→</span></a>}
                <a className={mode === 'verify' || mode === 'reset' ? 'primary-button' : 'back-link'} href="/login">Voltar para o login</a>
            </div> : <form onSubmit={submit} noValidate aria-busy={pending}>
                <fieldset disabled={pending}>
                    {mode === 'register' && <TextField id="name" name="name" label="Nome" autoComplete="name" maxLength={120} required placeholder="Como você se chama?" error={errors.name} />}
                    {hasEmail && <TextField id="email" name="email" label="E-mail" type="email" inputMode="email" autoComplete={mode === 'login' ? 'username' : 'email'} maxLength={255} required placeholder="Seu e-mail" icon="mail" error={errors.email} />}
                    {(mode === 'reset' || mode === 'verify') && <TextField id="token" name="token" label="Código recebido por e-mail" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={43} required placeholder="Cole o código completo" error={errors.token} />}
                    {hasPassword && <PasswordField required label={mode === 'reset' ? 'Nova senha' : 'Senha'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} hint={mode === 'login' ? undefined : 'De 15 a 128 caracteres. Uma frase fácil de lembrar também vale.'} error={errors.password} />}
                    {(mode === 'register' || mode === 'reset') && <PasswordField id="passwordConfirmation" label={mode === 'reset' ? 'Confirmar nova senha' : 'Confirmar senha'} autoComplete="new-password" required error={errors.passwordConfirmation} />}
                    {mode === 'login' && <div className="support-action"><a href="/recuperar-acesso">Esqueceu a senha?</a></div>}
                    {mode === 'register' && <div className="legal-consents">
                        <div className="consent-row">
                            <input id="termsAccepted" name="termsAccepted" type="checkbox" required disabled={!legalReady} aria-invalid={Boolean(errors.termsAccepted)} aria-describedby={errors.termsAccepted ? 'terms-error' : undefined} />
                            <label htmlFor="termsAccepted">Li e aceito os <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer">Termos de Uso</a>.</label>
                        </div>
                        {errors.termsAccepted && <p className="field-error" id="terms-error" role="alert">{errors.termsAccepted}</p>}
                        <div className="consent-row">
                            <input id="privacyAcknowledged" name="privacyAcknowledged" type="checkbox" required disabled={!legalReady} aria-invalid={Boolean(errors.privacyAcknowledged)} aria-describedby={errors.privacyAcknowledged ? 'privacy-error' : undefined} />
                            <label htmlFor="privacyAcknowledged">Li e estou ciente da <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.</label>
                        </div>
                        {errors.privacyAcknowledged && <p className="field-error" id="privacy-error" role="alert">{errors.privacyAcknowledged}</p>}
                        <p className="field-hint">Seu perfil começa privado. Você escolhe depois o que compartilhar.</p>
                    </div>}
                    <button className="primary-button" type="submit" disabled={pending || !available}>{pending ? copy.pending : copy.action} <span aria-hidden="true">→</span></button>
                </fieldset>
            </form>}
            {mode === 'login' && <>
                <div className="divider"><span>ou continue com</span></div>
                <div className="social-actions">
                    <button type="button" disabled aria-describedby="oauth-availability"><GoogleIcon />Google</button>
                    <button type="button" disabled aria-describedby="oauth-availability"><GitHubIcon />GitHub</button>
                </div>
                <p id="oauth-availability" className="field-hint social-note">A entrada com Google e GitHub ainda não está disponível.</p>
                <p className="auth-footer">Ainda não tem conta? <a href="/cadastro">Criar conta</a></p>
                <a className="secondary-link" href="/confirmar-email">Já tenho um código de confirmação</a>
            </>}
            {!success && mode === 'forgot' && <a className="secondary-link" href="/redefinir-senha">Já tenho um código de recuperação</a>}
            {!success && mode === 'verify' && <a className="secondary-link" href="/reenviar-confirmacao">Não recebeu? Reenviar confirmação</a>}
            {!success && mode === 'reset' && <a className="secondary-link" href="/recuperar-acesso">Solicitar nova recuperação</a>}
        </AuthLayout>
    );
}
