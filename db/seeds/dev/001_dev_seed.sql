-- Voz da Rua
-- Seed de desenvolvimento
-- Este arquivo é SOMENTE para ambiente local/dev.
-- É idempotente: pode ser executado novamente sem duplicar os registros principais.

BEGIN;

-- ============================================================
-- 1. USUÁRIOS
-- ============================================================

INSERT INTO usuarios (
    id, nome, email, senha_hash, papel, status,
    perfil_publico, exibir_nome_nos_relatos,
    email_verificado_em
)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Lucas Dev',  'lucas.dev@vozdarua.local', NULL, 'CIDADAO', 'ATIVO', TRUE,  TRUE,  CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000002', 'Maria Dev',  'maria.dev@vozdarua.local', NULL, 'CIDADAO', 'ATIVO', FALSE, FALSE, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000003', 'João Dev',   'joao.dev@vozdarua.local',  NULL, 'CIDADAO', 'ATIVO', TRUE,  FALSE, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000004', 'Ana Dev',    'ana.dev@vozdarua.local',   NULL, 'CIDADAO', 'ATIVO', TRUE,  TRUE,  CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000005', 'Bruno Dev',  'bruno.dev@vozdarua.local', NULL, 'CIDADAO', 'ATIVO', FALSE, FALSE, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000006', 'Carla Dev',  'carla.dev@vozdarua.local', NULL, 'CIDADAO', 'ATIVO', TRUE,  FALSE, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000007', 'Diego Dev',  'diego.dev@vozdarua.local', NULL, 'CIDADAO', 'ATIVO', FALSE, FALSE, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000008', 'Elisa Dev',  'elisa.dev@vozdarua.local', NULL, 'CIDADAO', 'ATIVO', TRUE,  TRUE,  CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000009', 'Fábio Dev',  'fabio.dev@vozdarua.local', NULL, 'CIDADAO', 'ATIVO', FALSE, FALSE, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000010', 'Gabi Dev',   'gabi.dev@vozdarua.local',  NULL, 'CIDADAO', 'ATIVO', TRUE,  FALSE, CURRENT_TIMESTAMP),

    ('90000000-0000-0000-0000-000000000001', 'Moderador Dev', 'moderador.dev@vozdarua.local', NULL, 'MODERADOR', 'ATIVO', FALSE, FALSE, CURRENT_TIMESTAMP),
    ('90000000-0000-0000-0000-000000000002', 'Admin Dev',     'admin.dev@vozdarua.local',     NULL, 'ADMIN',     'ATIVO', FALSE, FALSE, CURRENT_TIMESTAMP),

    ('90000000-0000-0000-0000-000000000003', 'Usuário Banido Dev', 'banido.dev@vozdarua.local', NULL, 'CIDADAO', 'BANIDO', FALSE, FALSE, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;


-- Identidades externas falsas, apenas para testar o modelo.
INSERT INTO identidades_auth (
    id, usuario_id, provedor, subject_externo, email_provedor
)
VALUES
    (
        '11000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'GOOGLE',
        'dev-google-lucas-001',
        'lucas.dev@vozdarua.local'
    ),
    (
        '11000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000003',
        'GITHUB',
        'dev-github-joao-003',
        'joao.dev@vozdarua.local'
    )
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. ÓRGÃO / CANAL DE DENÚNCIA
-- ============================================================

INSERT INTO orgaos_responsaveis (
    id, nome, tipo, descricao, site, cidade, estado, ativo
)
VALUES (
    '80000000-0000-0000-0000-000000000001',
    'Prefeitura de São Paulo',
    'PUBLICO',
    'Órgão de referência usado no ambiente de desenvolvimento.',
    'https://www.capital.sp.gov.br/',
    'São Paulo',
    'SP',
    TRUE
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO canais_denuncia (
    id, orgao_id, nome, tipo, url, instrucoes,
    requer_login_govbr, ativo
)
VALUES (
    '81000000-0000-0000-0000-000000000001',
    '80000000-0000-0000-0000-000000000001',
    'Portal SP156',
    'SITE',
    'https://sp156.prefeitura.sp.gov.br/',
    'Acesse o canal oficial, autentique-se quando solicitado, escolha o serviço correspondente e informe os dados do problema.',
    TRUE,
    TRUE
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO categoria_canais (
    categoria_id, canal_id, principal, prioridade, instrucoes_especificas
)
SELECT
    c.id,
    '81000000-0000-0000-0000-000000000001',
    TRUE,
    10,
    'Utilize o canal oficial indicado e informe endereço, descrição e evidência do problema.'
FROM categorias_ocorrencia c
WHERE c.slug IN (
    'buraco-via',
    'calcada-irregular',
    'falta-acessibilidade',
    'iluminacao-publica',
    'sinalizacao',
    'obstrucao-passagem',
    'estrutura-publica'
)
ON CONFLICT (categoria_id, canal_id) DO NOTHING;


-- ============================================================
-- 3. OCORRÊNCIA 1 — VALIDADA, COM 10 RELATOS
-- Centro / Sé
-- ============================================================

INSERT INTO ocorrencias (
    id,
    categoria_id,
    status_id,
    criado_por_usuario_id,
    titulo,
    descricao,
    localizacao,
    endereco,
    numero,
    bairro,
    cep,
    cidade,
    estado,
    validada_em,
    criado_em,
    atualizado_em
)
SELECT
    '20000000-0000-0000-0000-000000000001',
    c.id,
    s.id,
    '10000000-0000-0000-0000-000000000001',
    'Buraco próximo à faixa de pedestres',
    'Buraco na via próximo à região da Praça da Sé. Ocorrência criada para testes de desenvolvimento.',
    ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326)::geography,
    'Praça da Sé',
    NULL,
    'Sé',
    '01001-000',
    'São Paulo',
    'SP',
    CURRENT_TIMESTAMP - INTERVAL '20 hours',
    CURRENT_TIMESTAMP - INTERVAL '24 hours',
    CURRENT_TIMESTAMP - INTERVAL '20 hours'
FROM categorias_ocorrencia c
JOIN status_ocorrencia s ON s.codigo = 'VALIDADA'
WHERE c.slug = 'buraco-via'
ON CONFLICT (id) DO NOTHING;


INSERT INTO ocorrencia_ciclos (
    id, ocorrencia_id, numero, motivo_abertura,
    aberto_por_usuario_id, iniciado_em
)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    1,
    'INICIAL',
    '10000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP - INTERVAL '24 hours'
)
ON CONFLICT (id) DO NOTHING;


-- Dez cidadãos diferentes participam deste ciclo.
INSERT INTO relatos (
    id, ocorrencia_id, ciclo_id, usuario_id, tipo,
    texto, proximidade_validada, distancia_verificada_metros, criado_em
)
VALUES
    ('40000000-0000-0000-0000-000000000001',
     '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     'INICIAL',
     'Buraco grande próximo à faixa. É necessário desviar ao atravessar.',
     TRUE, 85, CURRENT_TIMESTAMP - INTERVAL '24 hours'),

    ('40000000-0000-0000-0000-000000000002',
     '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000002',
     'CONFIRMACAO',
     'Também passei pelo local e o problema continua.',
     TRUE, 210, CURRENT_TIMESTAMP - INTERVAL '22 hours'),

    ('40000000-0000-0000-0000-000000000003',
     '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000003',
     'CONFIRMACAO',
     NULL,
     TRUE, 410, CURRENT_TIMESTAMP - INTERVAL '21 hours'),

    ('40000000-0000-0000-0000-000000000004',
     '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000004',
     'CONFIRMACAO',
     'Vi hoje cedo.',
     TRUE, 330, CURRENT_TIMESTAMP - INTERVAL '20 hours'),

    ('40000000-0000-0000-0000-000000000005',
     '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000005',
     'CONFIRMACAO',
     NULL,
     TRUE, 520, CURRENT_TIMESTAMP - INTERVAL '19 hours'),

    ('40000000-0000-0000-0000-000000000006',
     '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000006',
     'CONFIRMACAO',
     NULL,
     TRUE, 670, CURRENT_TIMESTAMP - INTERVAL '18 hours'),

    ('40000000-0000-0000-0000-000000000007',
     '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000007',
     'CONFIRMACAO',
     'Continua visível e atrapalhando.',
     TRUE, 780, CURRENT_TIMESTAMP - INTERVAL '17 hours'),

    ('40000000-0000-0000-0000-000000000008',
     '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000008',
     'CONFIRMACAO',
     NULL,
     TRUE, 880, CURRENT_TIMESTAMP - INTERVAL '16 hours'),

    ('40000000-0000-0000-0000-000000000009',
     '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000009',
     'CONFIRMACAO',
     NULL,
     TRUE, 920, CURRENT_TIMESTAMP - INTERVAL '15 hours'),

    ('40000000-0000-0000-0000-000000000010',
     '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000010',
     'CONFIRMACAO',
     'Confirmado.',
     TRUE, 1030, CURRENT_TIMESTAMP - INTERVAL '14 hours')
ON CONFLICT (id) DO NOTHING;


INSERT INTO evidencias (
    id,
    ocorrencia_id,
    relato_id,
    enviado_por_usuario_id,
    tipo,
    storage_provider,
    arquivo_chave,
    mime_type,
    tamanho_bytes,
    sha256,
    largura_px,
    altura_px,
    publica_no_pin,
    aprovada_por_usuario_id,
    aprovada_em
)
VALUES (
    '50000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'FOTO',
    'DEV_PLACEHOLDER',
    'dev/ocorrencias/20000000-0000-0000-0000-000000000001/foto.jpg',
    'image/jpeg',
    245000,
    NULL,
    1280,
    960,
    TRUE,
    '90000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP - INTERVAL '20 hours'
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO historico_status (
    id, ocorrencia_id, status_anterior_id, status_novo_id,
    usuario_id, origem, observacao, criado_em
)
SELECT
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    NULL,
    s.id,
    '10000000-0000-0000-0000-000000000001',
    'USUARIO',
    'Ocorrência criada pelo usuário.',
    CURRENT_TIMESTAMP - INTERVAL '24 hours'
FROM status_ocorrencia s
WHERE s.codigo = 'PENDENTE_VALIDACAO'
ON CONFLICT (id) DO NOTHING;


INSERT INTO historico_status (
    id, ocorrencia_id, status_anterior_id, status_novo_id,
    usuario_id, origem, observacao, criado_em
)
SELECT
    '60000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    anterior.id,
    novo.id,
    '90000000-0000-0000-0000-000000000001',
    'MODERADOR',
    'Ocorrência validada no ambiente de desenvolvimento.',
    CURRENT_TIMESTAMP - INTERVAL '20 hours'
FROM status_ocorrencia anterior
CROSS JOIN status_ocorrencia novo
WHERE anterior.codigo = 'PENDENTE_VALIDACAO'
  AND novo.codigo = 'VALIDADA'
ON CONFLICT (id) DO NOTHING;


INSERT INTO acoes_moderacao (
    id, ocorrencia_id, moderador_id, tipo, justificativa, criado_em
)
VALUES (
    '70000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001',
    'VALIDAR',
    'Ocorrência de desenvolvimento validada para testar publicação no mapa.',
    CURRENT_TIMESTAMP - INTERVAL '20 hours'
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO alertas_moderacao (
    id, ocorrencia_id, ciclo_id, tipo, prioridade,
    status, contador_referencia, chave_deduplicacao, criado_em
)
VALUES (
    '71000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'RELATOS_PRIORITARIOS',
    'ALTA',
    'PENDENTE',
    10,
    'dev:ocorrencia:20000000-0000-0000-0000-000000000001:10-relatos',
    CURRENT_TIMESTAMP - INTERVAL '14 hours'
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 4. OCORRÊNCIA 2 — PENDENTE
-- Região aproximada do Tatuapé
-- ============================================================

INSERT INTO ocorrencias (
    id,
    categoria_id,
    status_id,
    criado_por_usuario_id,
    titulo,
    descricao,
    localizacao,
    endereco,
    numero,
    bairro,
    cidade,
    estado,
    criado_em,
    atualizado_em
)
SELECT
    '20000000-0000-0000-0000-000000000002',
    c.id,
    s.id,
    '10000000-0000-0000-0000-000000000003',
    'Calçada com passagem irregular',
    'Trecho de calçada com dificuldade de circulação. Registro utilizado para testar fila de moderação.',
    ST_SetSRID(ST_MakePoint(-46.5765, -23.5405), 4326)::geography,
    'Rua de teste — região do Tatuapé',
    NULL,
    'Tatuapé',
    'São Paulo',
    'SP',
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM categorias_ocorrencia c
JOIN status_ocorrencia s ON s.codigo = 'PENDENTE_VALIDACAO'
WHERE c.slug = 'calcada-irregular'
ON CONFLICT (id) DO NOTHING;


INSERT INTO ocorrencia_ciclos (
    id, ocorrencia_id, numero, motivo_abertura,
    aberto_por_usuario_id, iniciado_em
)
VALUES (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    1,
    'INICIAL',
    '10000000-0000-0000-0000-000000000003',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO relatos (
    id, ocorrencia_id, ciclo_id, usuario_id, tipo,
    texto, proximidade_validada, distancia_verificada_metros, criado_em
)
VALUES (
    '40000000-0000-0000-0000-000000000011',
    '20000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    'INICIAL',
    'A passagem está difícil principalmente para cadeira de rodas.',
    TRUE,
    95,
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO evidencias (
    id,
    ocorrencia_id,
    relato_id,
    enviado_por_usuario_id,
    tipo,
    storage_provider,
    arquivo_chave,
    mime_type,
    tamanho_bytes,
    largura_px,
    altura_px,
    publica_no_pin
)
VALUES (
    '50000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000011',
    '10000000-0000-0000-0000-000000000003',
    'FOTO',
    'DEV_PLACEHOLDER',
    'dev/ocorrencias/20000000-0000-0000-0000-000000000002/foto.jpg',
    'image/jpeg',
    198000,
    1280,
    960,
    FALSE
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO historico_status (
    id, ocorrencia_id, status_anterior_id, status_novo_id,
    usuario_id, origem, observacao, criado_em
)
SELECT
    '60000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    NULL,
    s.id,
    '10000000-0000-0000-0000-000000000003',
    'USUARIO',
    'Ocorrência criada e aguardando moderação.',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM status_ocorrencia s
WHERE s.codigo = 'PENDENTE_VALIDACAO'
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 5. OCORRÊNCIA 3 — RESOLVIDA
-- Região aproximada da Avenida Paulista
-- ============================================================

INSERT INTO ocorrencias (
    id,
    categoria_id,
    status_id,
    criado_por_usuario_id,
    titulo,
    descricao,
    localizacao,
    endereco,
    numero,
    bairro,
    cidade,
    estado,
    validada_em,
    resolvida_em,
    criado_em,
    atualizado_em
)
SELECT
    '20000000-0000-0000-0000-000000000003',
    c.id,
    s.id,
    '10000000-0000-0000-0000-000000000004',
    'Iluminação pública com falha',
    'Ocorrência resolvida utilizada para testar histórico, resolução e futura reabertura.',
    ST_SetSRID(ST_MakePoint(-46.6544, -23.5615), 4326)::geography,
    'Avenida Paulista',
    NULL,
    'Bela Vista',
    'São Paulo',
    'SP',
    CURRENT_TIMESTAMP - INTERVAL '12 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '13 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM categorias_ocorrencia c
JOIN status_ocorrencia s ON s.codigo = 'RESOLVIDA'
WHERE c.slug = 'iluminacao-publica'
ON CONFLICT (id) DO NOTHING;


INSERT INTO ocorrencia_ciclos (
    id, ocorrencia_id, numero, motivo_abertura,
    aberto_por_usuario_id, iniciado_em, encerrado_em
)
VALUES (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000003',
    1,
    'INICIAL',
    '10000000-0000-0000-0000-000000000004',
    CURRENT_TIMESTAMP - INTERVAL '13 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO relatos (
    id, ocorrencia_id, ciclo_id, usuario_id, tipo,
    texto, proximidade_validada, distancia_verificada_metros, criado_em
)
VALUES
    (
        '40000000-0000-0000-0000-000000000012',
        '20000000-0000-0000-0000-000000000003',
        '30000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000004',
        'INICIAL',
        'Poste sem iluminação durante a noite.',
        TRUE,
        150,
        CURRENT_TIMESTAMP - INTERVAL '13 days'
    ),
    (
        '40000000-0000-0000-0000-000000000013',
        '20000000-0000-0000-0000-000000000003',
        '30000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000006',
        'CONFIRMACAO',
        'Também encontrei o local escuro.',
        TRUE,
        280,
        CURRENT_TIMESTAMP - INTERVAL '12 days'
    )
ON CONFLICT (id) DO NOTHING;


INSERT INTO evidencias (
    id,
    ocorrencia_id,
    relato_id,
    enviado_por_usuario_id,
    tipo,
    storage_provider,
    arquivo_chave,
    mime_type,
    tamanho_bytes,
    largura_px,
    altura_px,
    publica_no_pin,
    aprovada_por_usuario_id,
    aprovada_em
)
VALUES (
    '50000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000012',
    '10000000-0000-0000-0000-000000000004',
    'FOTO',
    'DEV_PLACEHOLDER',
    'dev/ocorrencias/20000000-0000-0000-0000-000000000003/foto.jpg',
    'image/jpeg',
    220000,
    1280,
    960,
    TRUE,
    '90000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP - INTERVAL '12 days'
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO votos_resolucao (
    id, ciclo_id, usuario_id,
    proximidade_validada, distancia_verificada_metros, criado_em
)
VALUES
    (
        '72000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000001',
        TRUE, 320, CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        '72000000-0000-0000-0000-000000000002',
        '30000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000002',
        TRUE, 410, CURRENT_TIMESTAMP - INTERVAL '4 days'
    )
ON CONFLICT (id) DO NOTHING;


INSERT INTO acoes_moderacao (
    id, ocorrencia_id, moderador_id, tipo, justificativa, criado_em
)
VALUES (
    '70000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    '90000000-0000-0000-0000-000000000001',
    'RESOLVER',
    'Problema marcado como resolvido pelo moderador no ambiente dev.',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 6. SOCIAL
-- ============================================================

INSERT INTO posts (
    id, usuario_id, ocorrencia_id, conteudo, status, criado_em
)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        'Passei pela região novamente. O problema continua visível e está vinculado a esta ocorrência.',
        'PUBLICADO',
        CURRENT_TIMESTAMP - INTERVAL '6 hours'
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000004',
        NULL,
        'Primeiro post de teste da área Social do Voz da Rua.',
        'PUBLICADO',
        CURRENT_TIMESTAMP - INTERVAL '4 hours'
    )
ON CONFLICT (id) DO NOTHING;


INSERT INTO comentarios (
    id, post_id, usuario_id, conteudo, criado_em
)
VALUES
    (
        'a1000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000003',
        'Também passei pela região.',
        CURRENT_TIMESTAMP - INTERVAL '5 hours'
    ),
    (
        'a1000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        'Legal ver a comunidade começando a usar a área Social.',
        CURRENT_TIMESTAMP - INTERVAL '3 hours'
    )
ON CONFLICT (id) DO NOTHING;


INSERT INTO curtidas_posts (
    post_id, usuario_id, criado_em
)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000003',
        CURRENT_TIMESTAMP - INTERVAL '5 hours'
    ),
    (
        'a0000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000004',
        CURRENT_TIMESTAMP - INTERVAL '4 hours'
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '3 hours'
    )
ON CONFLICT (post_id, usuario_id) DO NOTHING;


INSERT INTO seguidores (
    seguidor_id, seguido_id, criado_em
)
VALUES
    (
        '10000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000004',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    )
ON CONFLICT (seguidor_id, seguido_id) DO NOTHING;


-- ============================================================
-- 7. NOTIFICAÇÕES DEV
-- ============================================================

INSERT INTO notificacoes (
    id, usuario_id, tipo, titulo, mensagem, ocorrencia_id, criada_em
)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'OCORRENCIA_VALIDADA',
        'Ocorrência validada',
        'Sua ocorrência foi validada pela moderação.',
        '20000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '20 hours'
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000004',
        'OCORRENCIA_RESOLVIDA',
        'Problema resolvido',
        'Uma ocorrência que você relatou foi marcada como resolvida.',
        '20000000-0000-0000-0000-000000000003',
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    )
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8. AUDITORIA DEV
-- ============================================================

INSERT INTO logs_auditoria (
    id, usuario_id, papel_ator, acao, entidade, entidade_id, dados, request_id, criado_em
)
VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        '90000000-0000-0000-0000-000000000001',
        'MODERADOR',
        'OCORRENCIA_VALIDADA',
        'ocorrencias',
        '20000000-0000-0000-0000-000000000001',
        '{"ambiente":"dev"}'::jsonb,
        'seed-dev-001',
        CURRENT_TIMESTAMP - INTERVAL '20 hours'
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        '90000000-0000-0000-0000-000000000001',
        'MODERADOR',
        'OCORRENCIA_RESOLVIDA',
        'ocorrencias',
        '20000000-0000-0000-0000-000000000003',
        '{"ambiente":"dev"}'::jsonb,
        'seed-dev-002',
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    )
ON CONFLICT (id) DO NOTHING;

COMMIT;
