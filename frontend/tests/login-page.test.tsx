import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { LoginPage } from '../src/pages/LoginPage';
import { TextField } from '../src/components/TextField';
import { PasswordField } from '../src/components/PasswordField';

afterEach(cleanup);

describe('Tela inicial de acesso', () => {
  it('renderiza os textos e campos aprovados com labels reais', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Bem-vindo(a)!' })).toBeTruthy();
    expect(screen.getByText('Use sua voz para evolução')).toBeTruthy();
    expect(screen.getByLabelText('E-mail')).toHaveProperty('type', 'email');
    expect(screen.getByLabelText('Senha')).toHaveProperty('type', 'password');
    expect(screen.getByText('ou continue com')).toBeTruthy();
  });

  it('usa logo e paisagem como ativos separados dos controles', () => {
    const { container } = render(<LoginPage />);
    const logo = container.querySelector('.brand-header img');
    const cityscape = container.querySelector('.cityscape img');
    expect(logo?.getAttribute('src')).toContain('logo-voz-da-rua.webp');
    expect(cityscape?.getAttribute('src')).toContain('cidade-noturna.webp');
    expect(cityscape?.getAttribute('alt')).toBe('');
  });

  it('associa mensagens de erro aos campos sem depender apenas de cor', () => {
    render(<><TextField id="test-email" label="E-mail de teste" error="E-mail inválido" icon="mail" /><PasswordField error="Senha inválida" /></>);
    expect(screen.getByLabelText('E-mail de teste').getAttribute('aria-describedby')).toBe('test-email-error');
    expect(screen.getByLabelText('E-mail de teste').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Senha').getAttribute('aria-describedby')).toBe('password-error');
    expect(screen.getAllByRole('alert').map((node) => node.textContent)).toEqual(['E-mail inválido', 'Senha inválida']);
  });

  it('permite alternar a visibilidade local da senha', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(screen.getByLabelText('Senha')).toHaveProperty('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(screen.getByLabelText('Senha')).toHaveProperty('type', 'password');
  });

  it('mantém ações dependentes de integração desabilitadas', () => {
    render(<LoginPage />);
    for (const name of ['Entrar', 'Google', 'GitHub']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${name.replace('?', '\\?')}$`, 'i') })).toHaveProperty('disabled', true);
    }
    expect(screen.getByRole('status').textContent).toContain('indisponível');
    expect(screen.getByRole('link', { name: 'Criar conta' }).getAttribute('href')).toBe('/cadastro');
    expect(screen.getByRole('link', { name: 'Esqueceu a senha?' }).getAttribute('href')).toBe('/recuperar-acesso');
  });
});
