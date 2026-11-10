-- Voz da Rua
-- 017_views.sql
-- Views úteis para leitura do domínio.

CREATE OR REPLACE VIEW vw_ocorrencias_resumo AS
SELECT
    o.id,
    o.titulo,
    o.descricao,

    o.localizacao,
    ST_Y(o.localizacao::geometry) AS latitude,
    ST_X(o.localizacao::geometry) AS longitude,

    o.endereco,
    o.numero,
    o.bairro,
    o.cep,
    o.cidade,
    o.estado,

    c.id AS categoria_id,
    c.slug AS categoria_slug,
    c.nome AS categoria_nome,

    s.id AS status_id,
    s.codigo AS status_codigo,
    s.nome AS status_nome,
    s.exibe_no_mapa,

    ciclo.id AS ciclo_atual_id,
    ciclo.numero AS ciclo_atual_numero,

    COALESCE(relatos.total_relatos, 0) AS total_relatos,
    COALESCE(votos.total_votos_resolucao, 0) AS total_votos_resolucao,

    evidencia.id AS evidencia_publica_id,
    evidencia.storage_provider AS evidencia_publica_storage_provider,
    evidencia.arquivo_chave AS evidencia_publica_arquivo_chave,

    o.validada_em,
    o.resolvida_em,
    o.criado_em,
    o.atualizado_em

FROM ocorrencias o

JOIN categorias_ocorrencia c
    ON c.id = o.categoria_id

JOIN status_ocorrencia s
    ON s.id = o.status_id

LEFT JOIN LATERAL (
    SELECT oc.id, oc.numero
    FROM ocorrencia_ciclos oc
    WHERE oc.ocorrencia_id = o.id
    ORDER BY oc.numero DESC
    LIMIT 1
) ciclo ON TRUE

LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT AS total_relatos
    FROM relatos r
    WHERE r.ocorrencia_id = o.id
      AND r.ciclo_id = ciclo.id
      AND r.excluido_em IS NULL
) relatos ON TRUE

LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT AS total_votos_resolucao
    FROM votos_resolucao vr
    WHERE vr.ciclo_id = ciclo.id
) votos ON TRUE

LEFT JOIN LATERAL (
    SELECT
        e.id,
        e.storage_provider,
        e.arquivo_chave
    FROM evidencias e
    WHERE e.ocorrencia_id = o.id
      AND e.publica_no_pin = TRUE
      AND e.excluida_em IS NULL
    LIMIT 1
) evidencia ON TRUE;


CREATE OR REPLACE VIEW vw_usuarios_publicos AS
SELECT
    id,
    nome,
    criado_em
FROM usuarios
WHERE perfil_publico = TRUE
  AND status = 'ATIVO';
