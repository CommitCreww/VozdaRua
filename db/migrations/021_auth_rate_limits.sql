-- P05 / FSD 13.9: policy numbers are supplied explicitly by the application.
CREATE TABLE limites_auth (
    acao VARCHAR(16) NOT NULL CHECK (acao IN ('register','resend','login','forgot','reset')),
    escopo VARCHAR(16) NOT NULL CHECK (escopo IN ('origin','identity','session','failure')),
    chave_hash CHAR(64) NOT NULL CHECK (chave_hash ~ '^[0-9a-f]{64}$'),
    quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    expira_em TIMESTAMPTZ NOT NULL,
    bloqueado_ate TIMESTAMPTZ,
    PRIMARY KEY (acao,escopo,chave_hash)
);
CREATE INDEX idx_limites_auth_expiracao ON limites_auth (expira_em);
