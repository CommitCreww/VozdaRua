-- Voz da Rua
-- 015_audit.sql
-- Auditoria técnica e administrativa.

CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,

    papel_ator VARCHAR(20),

    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100) NOT NULL,
    entidade_id UUID,

    dados JSONB,
    request_id VARCHAR(100),

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_logs_auditoria_acao
        CHECK (BTRIM(acao) <> ''),

    CONSTRAINT ck_logs_auditoria_entidade
        CHECK (BTRIM(entidade) <> ''),

    CONSTRAINT ck_logs_auditoria_papel
        CHECK (
            papel_ator IS NULL
            OR papel_ator IN ('CIDADAO', 'MODERADOR', 'ADMIN', 'SISTEMA')
        )
);

CREATE INDEX idx_logs_auditoria_usuario
    ON logs_auditoria (usuario_id, criado_em DESC);

CREATE INDEX idx_logs_auditoria_entidade
    ON logs_auditoria (entidade, entidade_id, criado_em DESC);

CREATE INDEX idx_logs_auditoria_criado_em
    ON logs_auditoria (criado_em DESC);
