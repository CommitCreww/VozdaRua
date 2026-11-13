-- P04 / FSD 14.1: independent, versioned terms acceptance and privacy acknowledgement.
-- No legal text or retention policy is selected by this migration.
CREATE TABLE aceites_legais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    termos_versao TEXT NOT NULL CHECK (BTRIM(termos_versao) <> ''),
    termos_aceitos_em TIMESTAMPTZ NOT NULL,
    privacidade_versao TEXT NOT NULL CHECK (BTRIM(privacidade_versao) <> ''),
    privacidade_ciente_em TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_aceites_legais_usuario ON aceites_legais (usuario_id);
