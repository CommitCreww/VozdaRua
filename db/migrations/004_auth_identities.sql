-- Voz da Rua
-- 004_auth_identities.sql
-- Identidades externas/OIDC vinculadas à conta Voz da Rua.

CREATE TABLE identidades_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,

    provedor VARCHAR(40) NOT NULL,
    subject_externo VARCHAR(255) NOT NULL,

    email_provedor VARCHAR(255),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_login_em TIMESTAMPTZ,

    CONSTRAINT ck_identidades_auth_provedor
        CHECK (provedor IN ('GOOGLE', 'GITHUB', 'OIDC'))
);

CREATE UNIQUE INDEX ux_identidades_auth_provedor_subject
    ON identidades_auth (provedor, subject_externo);

CREATE UNIQUE INDEX ux_identidades_auth_usuario_provedor
    ON identidades_auth (usuario_id, provedor);

CREATE INDEX idx_identidades_auth_usuario
    ON identidades_auth (usuario_id);
