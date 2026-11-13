import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccessPage } from '../src/pages/AccessPage';
import { AccessRoutes } from '../src/routes/AccessRoutes';
import { AuthRequestError, type AuthConnection, type AccessMode, type LoginResult } from '../src/features/auth/contracts';
import { validateAccess } from '../src/features/auth/validation';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// Synthetic fixtures only; never mounted by AccessRoutes or sent to the backend.
function connection(): AuthConnection {
    return {
        api: {
            login: vi.fn(async () => ({ account: { id: 'fixture', role: 'CIDADAO' as const, status: 'ATIVO' as const }, csrfToken: 'test-only' })),
            register: vi.fn(async () => ({ status: 'accepted' as const })),
            forgot: vi.fn(async () => ({ status: 'accepted' as const })),
            resend: vi.fn(async () => ({ status: 'accepted' as const })),
            verify: vi.fn(async () => ({ status: 'verified' as const })),
            reset: vi.fn(async () => ({ status: 'reset' as const })),
        },
        onAuthenticated: vi.fn(),
        legalDocuments: { termsVersion: 'TEST-ONLY', privacyVersion: 'TEST-ONLY' },
    };
}

const password = 'Minha frase de teste segura';
const token = 'a'.repeat(43);
function enter(label: string, value: string) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
function submit() {
    const form = document.querySelector('form');
    if (!form) throw new Error('Expected form');
    fireEvent.submit(form);
}

describe('Jornada pública de acesso', () => {
    it.each([
        ['/login', 'Bem-vindo(a)!'], ['/cadastro', 'Criar conta'], ['/recuperar-acesso', 'Recuperar acesso'],
        ['/redefinir-senha', 'Definir nova senha'], ['/confirmar-email', 'Confirme seu e-mail'], ['/reenviar-confirmacao', 'Reenviar confirmação'],
    ])('abre %s sem liberar operações ainda indisponíveis', (path, title) => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        render(<AccessRoutes path={path} />);
        expect(screen.getByRole('heading', { name: title })).toBeTruthy();
        expect(document.querySelector('button[type="submit"]')).toHaveProperty('disabled', true);
        submit();
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(screen.queryByRole('navigation')).toBeNull();
        expect(document.title).toContain(title);
    });

    it.each(['/termos-de-uso', '/politica-de-privacidade'])('não publica texto jurídico fictício em %s', (path) => {
        render(<AccessRoutes path={path} />);
        expect(screen.getByText(/Este documento ainda não está disponível/)).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Voltar ao cadastro' }).getAttribute('href')).toBe('/cadastro');
    });

    it.each(['/home', '/moderacao', '/constructor', '/desconhecida'])('não libera área interna ou rota desconhecida %s', (path) => {
        render(<AccessRoutes path={path} />);
        expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeTruthy();
    });

    it('valida campos, associa erros e posiciona foco sem chamar API', () => {
        const client = connection();
        render(<AccessPage mode="login" connection={client} />);
        submit();
        expect(client.api.login).not.toHaveBeenCalled();
        expect(screen.getByLabelText('E-mail').getAttribute('aria-invalid')).toBe('true');
        expect(document.activeElement).toBe(screen.getByLabelText('E-mail'));
        expect(screen.getAllByRole('alert')).toHaveLength(2);
    });

    it('impede envio duplicado, preserva senha e só entrega sessão após resposta', async () => {
        const client = connection();
        let resolve!: (result: LoginResult) => void;
        client.api.login = vi.fn(() => new Promise<LoginResult>((done) => { resolve = done; }));
        const storage = vi.spyOn(Storage.prototype, 'setItem');
        render(<AccessPage mode="login" connection={client} />);
        enter('E-mail', 'Pessoa@EXAMPLE.INVALID');
        enter('Senha', ` ${password} `);
        submit();
        submit();
        expect(client.api.login).toHaveBeenCalledTimes(1);
        expect(client.api.login).toHaveBeenCalledWith({ email: 'pessoa@example.invalid', password: ` ${password} ` });
        expect(client.onAuthenticated).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Entrando…' })).toHaveProperty('disabled', true);
        const result: LoginResult = { account: { id: 'fixture', role: 'ADMIN', status: 'BANIDO' }, csrfToken: 'fixture-only' };
        await act(async () => resolve(result));
        expect(client.onAuthenticated).toHaveBeenCalledWith(result);
        expect(screen.getByLabelText('Senha')).toHaveProperty('value', '');
        expect(storage).not.toHaveBeenCalled();
    });

    it.each([
        ['UNAUTHORIZED', 'Confira o e-mail e a senha'],
        ['EMAIL_UNVERIFIED', 'Confirme seu e-mail antes de entrar'],
        ['RATE_LIMITED', 'Muitas tentativas'],
        ['UNEXPECTED', 'Verifique sua conexão'],
    ])('trata %s sem autenticar ou expor mensagem interna', async (code, message) => {
        const client = connection();
        client.api.login = vi.fn(async () => { throw code === 'UNEXPECTED' ? new Error('SQL /private internal detail') : new AuthRequestError(code); });
        render(<AccessPage mode="login" connection={client} />);
        enter('E-mail', 'pessoa@example.invalid');
        enter('Senha', password);
        submit();
        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toContain(message);
        expect(alert.textContent).not.toContain('SQL');
        await waitFor(() => expect(document.activeElement).toBe(alert));
        expect(client.onAuthenticated).not.toHaveBeenCalled();
        if (code === 'EMAIL_UNVERIFIED') expect(screen.getByRole('link', { name: 'Reenviar confirmação' }).getAttribute('href')).toBe('/reenviar-confirmacao');
    });

    it('não pede aceites de documentos ainda indisponíveis', () => {
        const client = connection();
        delete client.legalDocuments;
        render(<AccessPage mode="register" connection={client} />);
        expect(screen.getByRole('button', { name: 'Cadastrar' })).toHaveProperty('disabled', true);
        for (const checkbox of screen.getAllByRole('checkbox')) {
            expect(checkbox).toHaveProperty('disabled', true);
            expect(checkbox).toHaveProperty('checked', false);
        }
        submit();
        expect(client.api.register).not.toHaveBeenCalled();
    });

    it('exige aceites independentes, mantém cadastro sem sessão e limpa segredos no sucesso', async () => {
        const client = connection();
        render(<AccessPage mode="register" connection={client} />);
        enter('Nome', 'Pessoa de teste');
        enter('E-mail', 'pessoa@example.invalid');
        enter('Senha', password);
        enter('Confirmar senha', password);
        const [terms, privacy] = screen.getAllByRole('checkbox');
        expect(terms).toHaveProperty('checked', false);
        expect(privacy).toHaveProperty('checked', false);
        await userEvent.click(terms);
        submit();
        expect(client.api.register).not.toHaveBeenCalled();
        expect(screen.getByRole('alert').textContent).toContain('Política de Privacidade');
        await userEvent.click(privacy);
        submit();
        expect((await screen.findByRole('status')).textContent).toContain('Se aplicável');
        expect(client.api.register).toHaveBeenCalledWith({ name: 'Pessoa de teste', email: 'pessoa@example.invalid', password,
            passwordConfirmation: password, termsAccepted: true, privacyAcknowledged: true });
        expect(client.onAuthenticated).not.toHaveBeenCalled();
        expect(screen.queryByLabelText('Senha')).toBeNull();
    });

    it('alterna apenas o campo de senha escolhido', async () => {
        render(<AccessPage mode="register" />);
        await userEvent.click(screen.getByRole('button', { name: 'Mostrar confirmar senha' }));
        expect(screen.getByLabelText('Confirmar senha')).toHaveProperty('type', 'text');
        expect(screen.getByLabelText('Senha')).toHaveProperty('type', 'password');
        expect(screen.getByLabelText('Senha').getAttribute('autocomplete')).toBe('new-password');
    });

    it.each(['forgot', 'resend'] as const)('%s oferece resposta neutra e não concede sessão', async (mode) => {
        const client = connection();
        render(<AccessPage mode={mode} connection={client} />);
        enter('E-mail', 'pessoa@example.invalid');
        submit();
        expect((await screen.findByRole('status')).textContent).toContain('Se houver uma conta');
        expect(client.api[mode]).toHaveBeenCalledWith({ email: 'pessoa@example.invalid' });
        expect(client.onAuthenticated).not.toHaveBeenCalled();
    });

    it.each(['verify', 'reset'] as const)('%s valida token e conclui sem autenticação automática', async (mode) => {
        const client = connection();
        render(<AccessPage mode={mode} connection={client} />);
        if (mode === 'reset') { enter('Nova senha', password); enter('Confirmar nova senha', password); }
        submit();
        expect(client.api[mode]).not.toHaveBeenCalled();
        expect(screen.getByRole('alert').textContent).toContain('43 caracteres');
        enter('Código recebido por e-mail', token);
        submit();
        await screen.findByRole('status');
        expect(client.api[mode]).toHaveBeenCalledTimes(1);
        expect(client.onAuthenticated).not.toHaveBeenCalled();
        expect(screen.queryByLabelText('Código recebido por e-mail')).toBeNull();
    });

    it.each(['verify', 'reset'] as const)('%s trata token expirado/reutilizado sem afirmar sucesso', async (mode) => {
        const client = connection();
        client.api[mode] = vi.fn(async () => { throw new AuthRequestError('INVALID_INPUT'); });
        render(<AccessPage mode={mode} connection={client} />);
        enter('Código recebido por e-mail', token);
        if (mode === 'reset') { enter('Nova senha', password); enter('Confirmar nova senha', password); }
        submit();
        expect((await screen.findByRole('alert')).textContent).toContain('expirou ou já foi utilizado');
        expect(client.onAuthenticated).not.toHaveBeenCalled();
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('descarta resposta de login recebida após desmontar a tela', async () => {
        const client = connection();
        let resolve!: (result: LoginResult) => void;
        client.api.login = vi.fn(() => new Promise<LoginResult>((done) => { resolve = done; }));
        const { unmount } = render(<AccessPage mode="login" connection={client} />);
        enter('E-mail', 'pessoa@example.invalid'); enter('Senha', password); submit();
        unmount();
        await act(async () => resolve({ account: { id: 'fixture', role: 'CIDADAO', status: 'ATIVO' }, csrfToken: 'fixture-only' }));
        expect(client.onAuthenticated).not.toHaveBeenCalled();
    });

    it('recupera estado após falha de rede, sem retry automático', async () => {
        const client = connection();
        client.api.forgot = vi.fn(async () => { throw new TypeError('Network failure'); });
        render(<AccessPage mode="forgot" connection={client} />);
        enter('E-mail', 'pessoa@example.invalid'); submit();
        await screen.findByRole('alert');
        await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar link de recuperação' })).toHaveProperty('disabled', false));
        expect(client.api.forgot).toHaveBeenCalledTimes(1);
    });
});

describe('Política de entrada conforme contrato do backend', () => {
    it.each([14, 15, 128, 129])('conta %i pontos de código, inclusive Unicode', (length) => {
        const data = new FormData();
        data.set('token', token); data.set('password', '🔒'.repeat(length)); data.set('passwordConfirmation', '🔒'.repeat(length));
        expect(Boolean(validateAccess('reset', data).password)).toBe(length < 15 || length > 128);
    });
    it('não aplica política de criação como bloqueio de login', () => {
        const data = new FormData(); data.set('email', 'pessoa@example.invalid'); data.set('password', 'curta');
        expect(validateAccess('login', data)).toEqual({});
    });
    it.each(['register', 'reset'] satisfies AccessMode[])('recusa confirmação diferente em %s', (mode) => {
        const data = new FormData(); data.set('password', password); data.set('passwordConfirmation', `${password} `);
        expect(validateAccess(mode, data).passwordConfirmation).toBeTruthy();
    });
});
