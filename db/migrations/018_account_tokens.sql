-- P04 / FSD 10.1, 13.4, 13.7: token hashes only; consumption is atomic in repository SQL.
CREATE TABLE tokens_conta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    tipo VARCHAR(24) NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL,
    consumido_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_tokens_conta_tipo CHECK (tipo IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')),
    CONSTRAINT ck_tokens_conta_hash CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT ck_tokens_conta_expiracao CHECK (expira_em > criado_em),
    CONSTRAINT ck_tokens_conta_consumo CHECK (consumido_em IS NULL OR consumido_em >= criado_em)
);

CREATE INDEX idx_tokens_conta_usuario_tipo ON tokens_conta (usuario_id, tipo, expira_em);
