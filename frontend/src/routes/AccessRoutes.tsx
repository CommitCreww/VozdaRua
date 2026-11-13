import { useEffect } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { AccessPage } from '../pages/AccessPage';
import type { AccessMode } from '../features/auth/contracts';

const accessRoutes: Readonly<Record<string, AccessMode>> = {
    '/': 'login', '/login': 'login', '/cadastro': 'register', '/recuperar-acesso': 'forgot',
    '/redefinir-senha': 'reset', '/confirmar-email': 'verify', '/reenviar-confirmacao': 'resend',
};

export function AccessRoutes({ path = window.location.pathname }: { path?: string }) {
    const mode = Object.hasOwn(accessRoutes, path) ? accessRoutes[path] : undefined;
    const legalTitle = path === '/termos-de-uso' ? 'Termos de Uso' : path === '/politica-de-privacidade' ? 'Política de Privacidade' : undefined;
    useEffect(() => {
        if (!mode) document.title = `${legalTitle ?? 'Página não encontrada'} — Voz da Rua`;
    }, [mode, legalTitle]);
    if (mode) return <AccessPage key={mode} mode={mode} />;
    return <AuthLayout titleId="information-title">
        <h1 id="information-title">{legalTitle ?? 'Página não encontrada'}</h1>
        <p className="auth-subtitle">{legalTitle
            ? 'Este documento ainda não está disponível. O cadastro será liberado após a disponibilização dos documentos necessários.'
            : 'Este endereço não está disponível. Volte para a tela de acesso.'}</p>
        <a className="primary-button" href={legalTitle ? '/cadastro' : '/login'}>{legalTitle ? 'Voltar ao cadastro' : 'Ir para o login'}</a>
    </AuthLayout>;
}
