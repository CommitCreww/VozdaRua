-- Voz da Rua
-- 014_notifications.sql
-- Notificações internas.

CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,

    tipo VARCHAR(60) NOT NULL,
    titulo VARCHAR(180) NOT NULL,
    mensagem TEXT NOT NULL,

    ocorrencia_id UUID
        REFERENCES ocorrencias(id) ON DELETE CASCADE,

    post_id UUID
        REFERENCES posts(id) ON DELETE CASCADE,

    lida_em TIMESTAMPTZ,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_notificacoes_tipo
        CHECK (BTRIM(tipo) <> ''),

    CONSTRAINT ck_notificacoes_titulo
        CHECK (BTRIM(titulo) <> ''),

    CONSTRAINT ck_notificacoes_mensagem
        CHECK (BTRIM(mensagem) <> '')
);

CREATE INDEX idx_notificacoes_usuario_nao_lidas
    ON notificacoes (usuario_id, criada_em DESC)
    WHERE lida_em IS NULL;

CREATE INDEX idx_notificacoes_usuario
    ON notificacoes (usuario_id, criada_em DESC);
