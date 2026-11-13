-- FSD 10.8 / P11. Empty structure: choosing/importing an official source is a separate gate.
CREATE TABLE areas_municipais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL CHECK (BTRIM(nome) <> ''),
    codigo_oficial CHAR(7) NOT NULL CHECK (codigo_oficial='3550308'),
    fonte_url TEXT NOT NULL CHECK (BTRIM(fonte_url) <> ''),
    versao VARCHAR(120) NOT NULL CHECK (BTRIM(versao) <> ''),
    licenca TEXT NOT NULL CHECK (BTRIM(licenca) <> ''),
    licenca_url TEXT NOT NULL CHECK (BTRIM(licenca_url) <> ''),
    srid_origem INTEGER NOT NULL REFERENCES spatial_ref_sys(srid),
    artefato_sha256 CHAR(64) NOT NULL CHECK (artefato_sha256 ~ '^[a-f0-9]{64}$'),
    geometria geometry(MULTIPOLYGON,4326) NOT NULL,
    sintetica BOOLEAN NOT NULL DEFAULT FALSE,
    aprovada BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(codigo_oficial,fonte_url,versao),
    CHECK (ST_IsValid(geometria) AND NOT ST_IsEmpty(geometria) AND ST_NDims(geometria)=2),
    CHECK (NOT ativo OR (aprovada AND NOT sintetica))
);
CREATE UNIQUE INDEX ux_area_municipal_ativa ON areas_municipais(codigo_oficial) WHERE ativo;
CREATE INDEX idx_area_municipal_geometria ON areas_municipais USING GIST(geometria);
CREATE TRIGGER trg_areas_municipais_updated_at BEFORE UPDATE ON areas_municipais
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
