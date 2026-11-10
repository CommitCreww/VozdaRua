-- Voz da Rua
-- 007_occurrence_cycles.sql
-- Ciclos permitem que um problema seja resolvido e posteriormente reapareça.

CREATE TABLE ocorrencia_ciclos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ocorrencia_id UUID NOT NULL
        REFERENCES ocorrencias(id) ON DELETE CASCADE,

    numero INTEGER NOT NULL,
    motivo_abertura VARCHAR(40) NOT NULL,

    aberto_por_usuario_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,

    iniciado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    encerrado_em TIMESTAMPTZ,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_ocorrencia_ciclos_numero
        CHECK (numero > 0),

    CONSTRAINT ck_ocorrencia_ciclos_motivo
        CHECK (
            motivo_abertura IN (
                'INICIAL',
                'REABERTURA_MODERACAO',
                'REABERTURA_COMUNIDADE'
            )
        ),

    CONSTRAINT ck_ocorrencia_ciclos_datas
        CHECK (encerrado_em IS NULL OR encerrado_em >= iniciado_em),

    CONSTRAINT ux_ocorrencia_ciclos_ocorrencia_numero
        UNIQUE (ocorrencia_id, numero),

    CONSTRAINT ux_ocorrencia_ciclos_id_ocorrencia
        UNIQUE (id, ocorrencia_id)
);

CREATE UNIQUE INDEX ux_ocorrencia_um_ciclo_aberto
    ON ocorrencia_ciclos (ocorrencia_id)
    WHERE encerrado_em IS NULL;

CREATE INDEX idx_ocorrencia_ciclos_ocorrencia
    ON ocorrencia_ciclos (ocorrencia_id);

CREATE INDEX idx_ocorrencia_ciclos_iniciado_em
    ON ocorrencia_ciclos (iniciado_em DESC);
