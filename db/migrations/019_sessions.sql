-- P05 / D03: opaque cookie value is never stored; only its SHA-256 hash.
CREATE TABLE sessoes (
    id_hash CHAR(64) PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    csrf_token_hash CHAR(64) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_atividade_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revogado_em TIMESTAMPTZ,
    CONSTRAINT ck_sessoes_id_hash CHECK (id_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT ck_sessoes_csrf_hash CHECK (csrf_token_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT ck_sessoes_atividade CHECK (ultima_atividade_em >= criado_em),
    CONSTRAINT ck_sessoes_revogacao CHECK (revogado_em IS NULL OR revogado_em >= criado_em)
);

CREATE INDEX idx_sessoes_usuario ON sessoes (usuario_id);
CREATE INDEX idx_sessoes_expiracao ON sessoes (ultima_atividade_em, criado_em) WHERE revogado_em IS NULL;
