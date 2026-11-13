import type { AccessMode } from './contracts';

export type FieldErrors = Record<string, string>;
export const formText = (data: FormData, field: string) => {
    const value = data.get(field);
    return typeof value === 'string' ? value : '';
};

export function validateAccess(mode: AccessMode, data: FormData): FieldErrors {
    const errors: FieldErrors = {};
    if (['login', 'register', 'forgot', 'resend'].includes(mode)) {
        const email = formText(data, 'email').trim();
        if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Informe um e-mail válido.';
    }
    if (mode === 'register') {
        const name = formText(data, 'name');
        if (!name.trim() || name.length > 120) errors.name = 'Informe seu nome, com até 120 caracteres.';
        if (data.get('termsAccepted') !== 'on') errors.termsAccepted = 'Leia e aceite os Termos de Uso.';
        if (data.get('privacyAcknowledged') !== 'on') errors.privacyAcknowledged = 'Confirme a ciência da Política de Privacidade.';
    }
    const password = formText(data, 'password');
    if (mode === 'login' && !password) errors.password = 'Informe sua senha.';
    if (mode === 'register' || mode === 'reset') {
        const length = [...password].length;
        if (length < 15 || length > 128) errors.password = 'Use de 15 a 128 caracteres. Você pode usar uma frase.';
        if (!formText(data, 'passwordConfirmation') || password !== formText(data, 'passwordConfirmation')) errors.passwordConfirmation = 'As senhas precisam ser iguais.';
    }
    if ((mode === 'reset' || mode === 'verify') && !/^[A-Za-z0-9_-]{43}$/.test(formText(data, 'token'))) errors.token = 'Informe o código completo, com 43 caracteres.';
    return errors;
}
