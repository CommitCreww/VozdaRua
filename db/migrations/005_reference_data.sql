-- Voz da Rua
-- 005_reference_data.sql
-- Categorias e estados possíveis das ocorrências.

CREATE TABLE categorias_ocorrencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    slug VARCHAR(80) NOT NULL,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    tipo_ambiente VARCHAR(20) NOT NULL DEFAULT 'AMBOS',
    icone VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_categorias_tipo_ambiente
        CHECK (tipo_ambiente IN ('PUBLICO', 'PRIVADO', 'AMBOS')),

    CONSTRAINT ck_categorias_slug_nao_vazio
        CHECK (BTRIM(slug) <> ''),

    CONSTRAINT ck_categorias_nome_nao_vazio
        CHECK (BTRIM(nome) <> '')
);

CREATE UNIQUE INDEX ux_categorias_slug
    ON categorias_ocorrencia (slug);

CREATE UNIQUE INDEX ux_categorias_nome_lower
    ON categorias_ocorrencia (LOWER(nome));

CREATE INDEX idx_categorias_ativo
    ON categorias_ocorrencia (ativo);

CREATE TRIGGER trg_categorias_updated_at
BEFORE UPDATE ON categorias_ocorrencia
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();


CREATE TABLE status_ocorrencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    codigo VARCHAR(40) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,

    exibe_no_mapa BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_status_codigo_nao_vazio
        CHECK (BTRIM(codigo) <> ''),

    CONSTRAINT ck_status_nome_nao_vazio
        CHECK (BTRIM(nome) <> '')
);

CREATE UNIQUE INDEX ux_status_ocorrencia_codigo
    ON status_ocorrencia (codigo);

CREATE UNIQUE INDEX ux_status_ocorrencia_nome_lower
    ON status_ocorrencia (LOWER(nome));


INSERT INTO status_ocorrencia (codigo, nome, descricao, exibe_no_mapa)
VALUES
    ('PENDENTE_VALIDACAO', 'Pendente de validação',
     'Ocorrência criada e aguardando análise da moderação.', FALSE),

    ('VALIDADA', 'Validada',
     'Ocorrência confirmada pela moderação.', TRUE),

    ('ENCAMINHADA', 'Encaminhada',
     'Ocorrência associada a um canal responsável para encaminhamento.', TRUE),

    ('EM_ANALISE', 'Em análise',
     'Problema em análise pelo responsável, quando essa informação estiver disponível.', TRUE),

    ('EM_RESOLUCAO', 'Em resolução',
     'Há indicação de que o problema está sendo tratado.', TRUE),

    ('RESOLVIDA', 'Resolvida',
     'Problema considerado solucionado.', TRUE),

    ('REJEITADA', 'Rejeitada',
     'Ocorrência considerada inválida pela moderação.', FALSE),

    ('DUPLICADA', 'Duplicada',
     'Ocorrência vinculada a outra ocorrência principal.', FALSE),

    ('ARQUIVADA', 'Arquivada',
     'Ocorrência retirada da visualização padrão sem exclusão do histórico.', FALSE),

    ('REABERTA', 'Reaberta',
     'Problema anteriormente resolvido e reaberto após nova análise.', TRUE)
ON CONFLICT (codigo) DO NOTHING;


INSERT INTO categorias_ocorrencia (slug, nome, descricao, tipo_ambiente)
VALUES
    ('buraco-via', 'Buraco na via',
     'Buracos, crateras ou danos semelhantes em ruas e avenidas.', 'PUBLICO'),

    ('calcada-irregular', 'Calçada irregular',
     'Problemas de conservação, nivelamento ou circulação em calçadas.', 'AMBOS'),

    ('falta-acessibilidade', 'Falta de acessibilidade',
     'Barreiras de acessibilidade em espaços públicos ou privados de uso público.', 'AMBOS'),

    ('iluminacao-publica', 'Iluminação pública',
     'Falhas ou ausência de iluminação em vias e espaços públicos.', 'PUBLICO'),

    ('sinalizacao', 'Sinalização',
     'Problemas relacionados a placas, faixas, semáforos ou sinalização urbana.', 'PUBLICO'),

    ('transporte-publico', 'Transporte público',
     'Problemas em ônibus, pontos, estações, metrô, trem ou estruturas relacionadas.', 'PUBLICO'),

    ('obstrucao-passagem', 'Obstrução de passagem',
     'Obstáculos que impedem ou dificultam circulação e mobilidade.', 'AMBOS'),

    ('estrutura-publica', 'Estrutura pública',
     'Problemas em equipamentos ou estruturas pertencentes ao poder público.', 'PUBLICO'),

    ('estrutura-privada', 'Estrutura privada',
     'Problemas de acesso, segurança ou acessibilidade em espaços privados de uso público.', 'PRIVADO'),

    ('outro', 'Outro',
     'Problemas que não se enquadram nas categorias anteriores.', 'AMBOS')
ON CONFLICT (slug) DO NOTHING;
