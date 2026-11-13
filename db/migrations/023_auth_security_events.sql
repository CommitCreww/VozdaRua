-- FSD 13.5,39,40: security events retain 30 days, not administrative audit 90 days.
CREATE TABLE eventos_seguranca_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    evento VARCHAR(24) NOT NULL CHECK (evento IN ('LOGIN_SUCCEEDED','LOGIN_FAILED','ACCESS_DENIED')),
    resultado VARCHAR(8) NOT NULL CHECK (resultado IN ('SUCCESS','FAILURE','DENIED')),
    request_id UUID,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((evento='LOGIN_SUCCEEDED' AND resultado='SUCCESS') OR
           (evento='LOGIN_FAILED' AND resultado='FAILURE') OR
           (evento='ACCESS_DENIED' AND resultado='DENIED'))
);
CREATE INDEX idx_eventos_seguranca_auth_criado ON eventos_seguranca_auth(criado_em);
