-- Voz da Rua
-- 011_resolution_and_reopening.sql
-- Confirmações comunitárias de resolução e sinalizações de reabertura.

CREATE TABLE votos_resolucao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ciclo_id UUID NOT NULL
        REFERENCES ocorrencia_ciclos(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE RESTRICT,

    proximidade_validada BOOLEAN NOT NULL DEFAULT FALSE,
    distancia_verificada_metros INTEGER,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_votos_resolucao_distancia
        CHECK (
            distancia_verificada_metros IS NULL
            OR distancia_verificada_metros >= 0
        ),

    CONSTRAINT ux_votos_resolucao_ciclo_usuario
        UNIQUE (ciclo_id, usuario_id)
);

CREATE INDEX idx_votos_resolucao_ciclo
    ON votos_resolucao (ciclo_id);

CREATE INDEX idx_votos_resolucao_usuario
    ON votos_resolucao (usuario_id);


CREATE TABLE sinalizacoes_reabertura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ocorrencia_id UUID NOT NULL
        REFERENCES ocorrencias(id) ON DELETE CASCADE,

    ciclo_resolvido_id UUID NOT NULL,

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE RESTRICT,

    texto VARCHAR(1200),

    proximidade_validada BOOLEAN NOT NULL DEFAULT FALSE,
    distancia_verificada_metros INTEGER,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sinalizacoes_reabertura_ciclo_ocorrencia
        FOREIGN KEY (ciclo_resolvido_id, ocorrencia_id)
        REFERENCES ocorrencia_ciclos(id, ocorrencia_id)
        ON DELETE CASCADE,

    CONSTRAINT ck_sinalizacoes_reabertura_distancia
        CHECK (
            distancia_verificada_metros IS NULL
            OR distancia_verificada_metros >= 0
        ),

    CONSTRAINT ux_sinalizacoes_reabertura_ciclo_usuario
        UNIQUE (ciclo_resolvido_id, usuario_id)
);

CREATE INDEX idx_sinalizacoes_reabertura_ocorrencia
    ON sinalizacoes_reabertura (ocorrencia_id);

CREATE INDEX idx_sinalizacoes_reabertura_ciclo
    ON sinalizacoes_reabertura (ciclo_resolvido_id);
