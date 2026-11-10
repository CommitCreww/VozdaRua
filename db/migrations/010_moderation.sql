-- Voz da Rua
-- 010_moderation.sql
-- Ações de moderação, denúncias sobre ocorrências, duplicidade e alertas.

CREATE TABLE acoes_moderacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ocorrencia_id UUID NOT NULL
        REFERENCES ocorrencias(id) ON DELETE CASCADE,

    moderador_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,

    tipo VARCHAR(40) NOT NULL,
    justificativa TEXT,

    dados_antes JSONB,
    dados_depois JSONB,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_acoes_moderacao_tipo
        CHECK (
            tipo IN (
                'VALIDAR',
                'REJEITAR',
                'MARCAR_DUPLICADA',
                'EDITAR',
                'DEFINIR_FOTO_PUBLICA',
                'REMOVER_PIN',
                'RESOLVER',
                'REABRIR',
                'ARQUIVAR',
                'RESTAURAR'
            )
        )
);

CREATE INDEX idx_acoes_moderacao_ocorrencia
    ON acoes_moderacao (ocorrencia_id, criado_em DESC);

CREATE INDEX idx_acoes_moderacao_moderador
    ON acoes_moderacao (moderador_id, criado_em DESC);


CREATE TABLE denuncias_ocorrencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ocorrencia_id UUID NOT NULL
        REFERENCES ocorrencias(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE RESTRICT,

    motivo VARCHAR(40) NOT NULL,
    comentario TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',

    analisada_por_usuario_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,

    analisada_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_denuncias_ocorrencia_motivo
        CHECK (
            motivo IN (
                'NAO_EXISTE',
                'JA_RESOLVIDO',
                'LOCALIZACAO_INCORRETA',
                'CONTEUDO_OFENSIVO',
                'IMAGEM_INADEQUADA',
                'DUPLICADA',
                'OUTRO'
            )
        ),

    CONSTRAINT ck_denuncias_ocorrencia_status
        CHECK (
            status IN (
                'PENDENTE',
                'PROCEDENTE',
                'IMPROCEDENTE',
                'ARQUIVADA'
            )
        ),

    CONSTRAINT ck_denuncias_ocorrencia_analise
        CHECK (
            (analisada_em IS NULL AND analisada_por_usuario_id IS NULL)
            OR (analisada_em IS NOT NULL AND analisada_por_usuario_id IS NOT NULL)
        )
);

CREATE UNIQUE INDEX ux_denuncia_pendente_usuario_ocorrencia
    ON denuncias_ocorrencia (usuario_id, ocorrencia_id)
    WHERE status = 'PENDENTE';

CREATE INDEX idx_denuncias_ocorrencia_status
    ON denuncias_ocorrencia (status, criado_em);

CREATE INDEX idx_denuncias_ocorrencia_ocorrencia
    ON denuncias_ocorrencia (ocorrencia_id);


CREATE TABLE ocorrencias_duplicadas (
    ocorrencia_duplicada_id UUID PRIMARY KEY
        REFERENCES ocorrencias(id) ON DELETE CASCADE,

    ocorrencia_principal_id UUID NOT NULL
        REFERENCES ocorrencias(id) ON DELETE RESTRICT,

    definido_por_usuario_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,

    justificativa TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_ocorrencias_duplicadas_diferentes
        CHECK (ocorrencia_duplicada_id <> ocorrencia_principal_id)
);

CREATE INDEX idx_ocorrencias_duplicadas_principal
    ON ocorrencias_duplicadas (ocorrencia_principal_id);


CREATE TABLE alertas_moderacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ocorrencia_id UUID NOT NULL
        REFERENCES ocorrencias(id) ON DELETE CASCADE,

    ciclo_id UUID
        REFERENCES ocorrencia_ciclos(id) ON DELETE CASCADE,

    tipo VARCHAR(40) NOT NULL,
    prioridade VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',

    contador_referencia INTEGER,
    chave_deduplicacao VARCHAR(255) NOT NULL,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    visualizado_em TIMESTAMPTZ,
    resolvido_em TIMESTAMPTZ,

    resolvido_por_usuario_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,

    CONSTRAINT ck_alertas_moderacao_tipo
        CHECK (
            tipo IN (
                'RELATOS_PRIORITARIOS',
                'REABERTURA_EMERGENCIAL',
                'DENUNCIA_OCORRENCIA',
                'OUTRO'
            )
        ),

    CONSTRAINT ck_alertas_moderacao_prioridade
        CHECK (prioridade IN ('NORMAL', 'ALTA', 'EMERGENCIAL')),

    CONSTRAINT ck_alertas_moderacao_status
        CHECK (status IN ('PENDENTE', 'VISUALIZADO', 'RESOLVIDO')),

    CONSTRAINT ck_alertas_moderacao_contador
        CHECK (contador_referencia IS NULL OR contador_referencia >= 0)
);

CREATE UNIQUE INDEX ux_alertas_moderacao_chave
    ON alertas_moderacao (chave_deduplicacao);

CREATE INDEX idx_alertas_moderacao_fila
    ON alertas_moderacao (status, prioridade, criado_em);

CREATE INDEX idx_alertas_moderacao_ocorrencia
    ON alertas_moderacao (ocorrencia_id);
