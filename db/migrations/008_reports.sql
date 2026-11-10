-- Voz da Rua
-- 008_reports.sql
-- Relatos formais ligados a ocorrências e ciclos.

CREATE TABLE relatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ocorrencia_id UUID NOT NULL
        REFERENCES ocorrencias(id) ON DELETE CASCADE,

    ciclo_id UUID NOT NULL,

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE RESTRICT,

    tipo VARCHAR(30) NOT NULL,
    texto VARCHAR(1200),

    proximidade_validada BOOLEAN NOT NULL DEFAULT FALSE,
    distancia_verificada_metros INTEGER,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_em TIMESTAMPTZ,
    excluido_em TIMESTAMPTZ,

    CONSTRAINT fk_relatos_ciclo_ocorrencia
        FOREIGN KEY (ciclo_id, ocorrencia_id)
        REFERENCES ocorrencia_ciclos(id, ocorrencia_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_relatos_id_ocorrencia
        UNIQUE (id, ocorrencia_id),

    CONSTRAINT ck_relatos_tipo
        CHECK (tipo IN ('INICIAL', 'CONFIRMACAO', 'REABERTURA')),

    CONSTRAINT ck_relatos_distancia
        CHECK (
            distancia_verificada_metros IS NULL
            OR distancia_verificada_metros >= 0
        ),

    CONSTRAINT ck_relatos_edicao
        CHECK (editado_em IS NULL OR editado_em >= criado_em),

    CONSTRAINT ck_relatos_exclusao
        CHECK (excluido_em IS NULL OR excluido_em >= criado_em)
);

CREATE UNIQUE INDEX ux_relatos_usuario_ciclo_ativo
    ON relatos (ciclo_id, usuario_id)
    WHERE excluido_em IS NULL;

CREATE INDEX idx_relatos_ocorrencia
    ON relatos (ocorrencia_id);

CREATE INDEX idx_relatos_ciclo
    ON relatos (ciclo_id);

CREATE INDEX idx_relatos_usuario
    ON relatos (usuario_id);

CREATE INDEX idx_relatos_criado_em
    ON relatos (criado_em DESC);

CREATE INDEX idx_relatos_ocorrencia_ativos
    ON relatos (ocorrencia_id, criado_em DESC)
    WHERE excluido_em IS NULL;
