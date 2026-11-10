-- Voz da Rua
-- 003_users.sql
-- Usuários, papéis, banimento e preferências básicas de privacidade.

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha_hash VARCHAR(255),

    papel VARCHAR(20) NOT NULL DEFAULT 'CIDADAO',
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',

    perfil_publico BOOLEAN NOT NULL DEFAULT FALSE,
    exibir_nome_nos_relatos BOOLEAN NOT NULL DEFAULT FALSE,

    email_verificado_em TIMESTAMPTZ,
    ultimo_acesso_em TIMESTAMPTZ,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_usuarios_nome_nao_vazio
        CHECK (BTRIM(nome) <> ''),

    CONSTRAINT ck_usuarios_email_nao_vazio
        CHECK (BTRIM(email) <> ''),

    CONSTRAINT ck_usuarios_papel
        CHECK (papel IN ('CIDADAO', 'MODERADOR', 'ADMIN')),

    CONSTRAINT ck_usuarios_status
        CHECK (status IN ('ATIVO', 'BANIDO'))
);

CREATE UNIQUE INDEX ux_usuarios_email_lower
    ON usuarios (LOWER(email));

CREATE INDEX idx_usuarios_papel
    ON usuarios (papel);

CREATE INDEX idx_usuarios_status
    ON usuarios (status);

CREATE INDEX idx_usuarios_perfil_publico
    ON usuarios (perfil_publico)
    WHERE perfil_publico = TRUE;

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();
