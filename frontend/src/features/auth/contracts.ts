export type AccessMode = 'login' | 'register' | 'forgot' | 'reset' | 'verify' | 'resend';

export interface LoginResult {
    account: { id: string; role: 'CIDADAO' | 'MODERADOR' | 'ADMIN'; status: 'ATIVO' | 'BANIDO' };
    csrfToken: string;
}

export interface RegistrationInput {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    termsAccepted: boolean;
    privacyAcknowledged: boolean;
}

// Port for reviewed integration and isolated UI tests. No operational adapter is mounted.
export interface AuthApi {
    login(input: { email: string; password: string }): Promise<LoginResult>;
    register(input: RegistrationInput): Promise<{ status: 'accepted' }>;
    forgot(input: { email: string }): Promise<{ status: 'accepted' }>;
    resend(input: { email: string }): Promise<{ status: 'accepted' }>;
    verify(input: { token: string }): Promise<{ status: 'verified' }>;
    reset(input: { token: string; password: string; passwordConfirmation: string }): Promise<{ status: 'reset' }>;
}

export interface AuthConnection {
    api: AuthApi;
    onAuthenticated(result: LoginResult): void;
    legalDocuments?: { termsVersion: string; privacyVersion: string };
}

export class AuthRequestError extends Error {
    constructor(public readonly code: string) {
        super('Não foi possível concluir a solicitação.');
    }
}
