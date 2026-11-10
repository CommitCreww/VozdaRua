-- Voz da Rua
-- 012_forwarding.sql
-- Órgãos/responsáveis e canais oficiais de denúncia.

CREATE TABLE orgaos_responsaveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome VARCHAR(180) NOT NULL,
    tipo VARCHAR(20) NOT NULL,

    descricao TEXT,

    site VARCHAR(500),
    telefone VARCHAR(40),
    email VARCHAR(255),

    cidade VARCHAR(100),
    estado CHAR(2),

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_orgaos_responsaveis_tipo
        CHECK (tipo IN ('PUBLICO', 'PRIVADO', 'OUTRO')),

    CONSTRAINT ck_orgaos_responsaveis_nome
        CHECK (BTRIM(nome) <> '')
);

CREATE INDEX idx_orgaos_responsaveis_nome
    ON orgaos_responsaveis (nome);

CREATE INDEX idx_orgaos_responsaveis_ativo
    ON orgaos_responsaveis (ativo);

CREATE TRIGGER trg_orgaos_responsaveis_updated_at
BEFORE UPDATE ON orgaos_responsaveis
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();


CREATE TABLE canais_denuncia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    orgao_id UUID NOT NULL
        REFERENCES orgaos_responsaveis(id) ON DELETE CASCADE,

    nome VARCHAR(180) NOT NULL,
    tipo VARCHAR(30) NOT NULL,

    url VARCHAR(1000),
    telefone VARCHAR(40),
    email VARCHAR(255),

    instrucoes TEXT,
    requer_login_govbr BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_canais_denuncia_tipo
        CHECK (
            tipo IN (
                'SITE',
                'FORMULARIO',
                'EMAIL',
                'TELEFONE',
                'APP',
                'OUTRO'
            )
        ),

    CONSTRAINT ck_canais_denuncia_nome
        CHECK (BTRIM(nome) <> '')
);

CREATE INDEX idx_canais_denuncia_orgao
    ON canais_denuncia (orgao_id);

CREATE INDEX idx_canais_denuncia_ativo
    ON canais_denuncia (ativo);

CREATE TRIGGER trg_canais_denuncia_updated_at
BEFORE UPDATE ON canais_denuncia
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();


CREATE TABLE categoria_canais (
    categoria_id UUID NOT NULL
        REFERENCES categorias_ocorrencia(id) ON DELETE CASCADE,

    canal_id UUID NOT NULL
        REFERENCES canais_denuncia(id) ON DELETE CASCADE,

    principal BOOLEAN NOT NULL DEFAULT FALSE,
    prioridade INTEGER NOT NULL DEFAULT 100,

    instrucoes_especificas TEXT,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (categoria_id, canal_id),

    CONSTRAINT ck_categoria_canais_prioridade
        CHECK (prioridade >= 0)
);

CREATE UNIQUE INDEX ux_categoria_canal_principal
    ON categoria_canais (categoria_id)
    WHERE principal = TRUE;

CREATE INDEX idx_categoria_canais_canal
    ON categoria_canais (canal_id);
