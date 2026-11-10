-- Voz da Rua
-- 006_occurrences.sql
-- Ocorrência principal geográfica.

CREATE TABLE ocorrencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    categoria_id UUID NOT NULL
        REFERENCES categorias_ocorrencia(id) ON DELETE RESTRICT,

    status_id UUID NOT NULL
        REFERENCES status_ocorrencia(id) ON DELETE RESTRICT,

    criado_por_usuario_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,

    titulo VARCHAR(160) NOT NULL,
    descricao TEXT NOT NULL,

    localizacao GEOGRAPHY(POINT, 4326) NOT NULL,

    endereco VARCHAR(255),
    numero VARCHAR(30),
    bairro VARCHAR(120),
    cep VARCHAR(10),

    cidade VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
    estado CHAR(2) NOT NULL DEFAULT 'SP',

    validada_em TIMESTAMPTZ,
    resolvida_em TIMESTAMPTZ,
    arquivada_em TIMESTAMPTZ,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_ocorrencias_titulo_nao_vazio
        CHECK (BTRIM(titulo) <> ''),

    CONSTRAINT ck_ocorrencias_descricao_nao_vazia
        CHECK (BTRIM(descricao) <> ''),

    CONSTRAINT ck_ocorrencias_cidade
        CHECK (cidade = 'São Paulo'),

    CONSTRAINT ck_ocorrencias_estado
        CHECK (estado = 'SP')
);

CREATE INDEX idx_ocorrencias_categoria
    ON ocorrencias (categoria_id);

CREATE INDEX idx_ocorrencias_status
    ON ocorrencias (status_id);

CREATE INDEX idx_ocorrencias_criado_por
    ON ocorrencias (criado_por_usuario_id);

CREATE INDEX idx_ocorrencias_criado_em
    ON ocorrencias (criado_em DESC);

CREATE INDEX idx_ocorrencias_bairro
    ON ocorrencias (bairro);

CREATE INDEX idx_ocorrencias_localizacao
    ON ocorrencias
    USING GIST (localizacao);

CREATE TRIGGER trg_ocorrencias_updated_at
BEFORE UPDATE ON ocorrencias
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();
