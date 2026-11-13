import type { ReactNode } from 'react';
import logo from '../assets/logo-voz-da-rua.webp';
import cityscape from '../assets/cidade-noturna.webp';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <header className="brand-header">
        <img src={logo} alt="" width="64" height="64" />
        <div className="brand-name">Voz da Rua</div>
      </header>
      <div className="cityscape" aria-hidden="true">
        <img src={cityscape} alt="" width="880" height="280" />
      </div>
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-panel-content">{children}</div>
        <svg className="bottom-wave" viewBox="0 0 390 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 30 C60 4 120 10 180 42 S290 14 390 15 V80 H0 Z" fill="currentColor" />
        </svg>
      </section>
    </main>
  );
}
