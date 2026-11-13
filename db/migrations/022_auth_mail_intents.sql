-- P06 / FSD 30.0,34: durable requests, no recoverable raw token payload.
CREATE TABLE envios_email_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    tipo VARCHAR(24) NOT NULL CHECK (tipo IN ('EMAIL_VERIFICATION','PASSWORD_RESET')),
    solicitacao_hash CHAR(64) NOT NULL UNIQUE REFERENCES tokens_conta(token_hash),
    expira_em TIMESTAMPTZ NOT NULL,
    estado VARCHAR(12) NOT NULL DEFAULT 'PENDING' CHECK (estado IN ('PENDING','PROCESSING','SENT','FAILED')),
    tentativas INTEGER NOT NULL DEFAULT 0 CHECK (tentativas BETWEEN 0 AND 3),
    proxima_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claim_id UUID,
    lease_ate TIMESTAMPTZ,
    resultado VARCHAR(24) CHECK (resultado IN ('DELIVERED','TEMPORARY','PERMANENT','EXPIRED','EXHAUSTED','INELIGIBLE')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((estado='PROCESSING') = (claim_id IS NOT NULL AND lease_ate IS NOT NULL))
);
CREATE INDEX idx_envios_email_auth_pendentes ON envios_email_auth (proxima_em,lease_ate) WHERE estado IN ('PENDING','PROCESSING');
