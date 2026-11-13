-- FSD 30.0: operational delivery attempt history, without message or token payload.
CREATE TABLE tentativas_email_auth (
    envio_id UUID NOT NULL REFERENCES envios_email_auth(id) ON DELETE CASCADE,
    tentativa INTEGER NOT NULL CHECK (tentativa BETWEEN 1 AND 3),
    claim_id UUID NOT NULL UNIQUE,
    iniciado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concluido_em TIMESTAMPTZ,
    resultado VARCHAR(24) CHECK (resultado IN ('DELIVERED','TEMPORARY','PERMANENT','INELIGIBLE','LEASE_EXPIRED')),
    PRIMARY KEY (envio_id,tentativa),
    CHECK ((concluido_em IS NULL) = (resultado IS NULL))
);
