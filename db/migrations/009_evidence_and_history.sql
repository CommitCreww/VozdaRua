-- Voz da Rua
-- 009_evidence_and_history.sql
-- Foto/evidência e histórico de status.

CREATE TABLE evidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ocorrencia_id UUID NOT NULL,
    relato_id UUID NOT NULL,

    enviado_por_usuario_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,

    tipo VARCHAR(20) NOT NULL DEFAULT 'FOTO',

    storage_provider VARCHAR(40),
    arquivo_chave TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamanho_bytes BIGINT,
    sha256 CHAR(64),

    largura_px INTEGER,
    altura_px INTEGER,

    publica_no_pin BOOLEAN NOT NULL DEFAULT FALSE,

    aprovada_por_usuario_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,

    aprovada_em TIMESTAMPTZ,

    criada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    excluida_em TIMESTAMPTZ,

    CONSTRAINT fk_evidencias_relato_ocorrencia
        FOREIGN KEY (relato_id, ocorrencia_id)
        REFERENCES relatos(id, ocorrencia_id)
        ON DELETE CASCADE,

    CONSTRAINT ck_evidencias_tipo
        CHECK (tipo = 'FOTO'),

    CONSTRAINT ck_evidencias_arquivo_chave
        CHECK (BTRIM(arquivo_chave) <> ''),

    CONSTRAINT ck_evidencias_tamanho
        CHECK (tamanho_bytes IS NULL OR tamanho_bytes > 0),

    CONSTRAINT ck_evidencias_dimensoes
        CHECK (
            (largura_px IS NULL OR largura_px > 0)
            AND (altura_px IS NULL OR altura_px > 0)
        ),

    CONSTRAINT ck_evidencias_aprovacao
        CHECK (
            (aprovada_em IS NULL AND aprovada_por_usuario_id IS NULL)
            OR (aprovada_em IS NOT NULL AND aprovada_por_usuario_id IS NOT NULL)
        )
);

CREATE UNIQUE INDEX ux_evidencias_uma_foto_ativa_por_relato
    ON evidencias (relato_id)
    WHERE excluida_em IS NULL;

CREATE UNIQUE INDEX ux_evidencias_uma_publica_por_ocorrencia
    ON evidencias (ocorrencia_id)
    WHERE publica_no_pin = TRUE AND excluida_em IS NULL;

CREATE INDEX idx_evidencias_ocorrencia
    ON evidencias (ocorrencia_id);

CREATE INDEX idx_evidencias_relato
    ON evidencias (relato_id);


CREATE TABLE historico_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ocorrencia_id UUID NOT NULL
        REFERENCES ocorrencias(id) ON DELETE CASCADE,

    status_anterior_id UUID
        REFERENCES status_ocorrencia(id) ON DELETE RESTRICT,

    status_novo_id UUID NOT NULL
        REFERENCES status_ocorrencia(id) ON DELETE RESTRICT,

    usuario_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,

    origem VARCHAR(20) NOT NULL,
    observacao TEXT,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_historico_status_origem
        CHECK (origem IN ('SISTEMA', 'USUARIO', 'MODERADOR', 'ADMIN'))
);

CREATE INDEX idx_historico_status_ocorrencia
    ON historico_status (ocorrencia_id, criado_em DESC);

CREATE INDEX idx_historico_status_status_novo
    ON historico_status (status_novo_id);
