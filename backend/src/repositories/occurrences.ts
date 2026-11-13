import type { SqlExecutor } from './database.js';
import type { NearbyQuery, ReadPagination } from '../schemas/occurrences.js';
import type { NearbyOccurrence, OccurrenceDetail, OccurrenceSummary, PublicHistory, PublicReport } from '../dtos/occurrences.js';
import { MAX_NEARBY_RADIUS_METERS } from '../schemas/occurrences.js';

// Never use vw_ocorrencias_resumo as a public DTO: its count is cycle-only and it includes storage keys.
const visible = `s.exibe_no_mapa=TRUE AND s.codigo IN ('VALIDADA','ENCAMINHADA','EM_ANALISE','EM_RESOLUCAO','RESOLVIDA','REABERTA') AND o.arquivada_em IS NULL
  AND NOT EXISTS(SELECT 1 FROM acoes_moderacao removal WHERE removal.ocorrencia_id=o.id AND removal.tipo='REMOVER_PIN')`;
const point = 'ST_SetSRID(ST_MakePoint($2,$1),4326)::geography';
const baseColumns = `o.id,o.titulo,o.categoria_id,c.slug AS categoria_slug,c.nome AS categoria_nome,o.subcategoria_id,sc.nome AS subcategoria_nome,
  s.codigo AS status_codigo,s.nome AS status_nome,ST_Y(o.localizacao::geometry) AS latitude,ST_X(o.localizacao::geometry) AS longitude,
  o.endereco,o.numero,o.bairro,o.criado_em,o.atualizado_em,o.validada_em,o.resolvida_em,
  ciclo.id AS ciclo_id,ciclo.numero AS ciclo_numero,ciclo.iniciado_em AS ciclo_inicio,ciclo.encerrado_em AS ciclo_fim`;
const baseJoins = `FROM ocorrencias o JOIN categorias_ocorrencia c ON c.id=o.categoria_id JOIN status_ocorrencia s ON s.id=o.status_id
  LEFT JOIN subcategorias_ocorrencia sc ON sc.id=o.subcategoria_id AND sc.categoria_id=o.categoria_id
  LEFT JOIN LATERAL(SELECT id,numero,iniciado_em,encerrado_em FROM ocorrencia_ciclos WHERE ocorrencia_id=o.id ORDER BY numero DESC LIMIT 1) ciclo ON TRUE`;
const projection = `, totals AS (
  SELECT base.id,count(r.id) FILTER(WHERE r.ciclo_id=base.ciclo_id)::integer AS current_reports,
    count(DISTINCT r.usuario_id)::integer AS historical_participants
  FROM base LEFT JOIN relatos r ON r.ocorrencia_id=base.id AND r.excluido_em IS NULL GROUP BY base.id,base.ciclo_id
) SELECT base.id,base.titulo,base.categoria_id,base.categoria_slug,base.categoria_nome,base.subcategoria_id,base.subcategoria_nome,base.status_codigo,base.status_nome,
  base.latitude,base.longitude,base.endereco,base.numero,base.bairro,base.criado_em,base.atualizado_em,base.validada_em,base.resolvida_em,
  base.ciclo_numero,base.ciclo_inicio,base.ciclo_fim,totals.current_reports,totals.historical_participants,
  photo.id AS photo_id,channel.channel
  EXTRA_COLUMNS
  FROM base JOIN totals ON totals.id=base.id
  LEFT JOIN LATERAL(SELECT e.id FROM evidencias e JOIN relatos r ON r.id=e.relato_id AND r.excluido_em IS NULL
    WHERE e.ocorrencia_id=base.id AND e.publica_no_pin=TRUE AND e.aprovada_em IS NOT NULL AND e.aprovada_por_usuario_id IS NOT NULL
    AND e.excluida_em IS NULL ORDER BY e.criada_em,e.id LIMIT 1) photo ON TRUE
  LEFT JOIN LATERAL(SELECT jsonb_build_object('id',ch.id,'name',ch.nome,'type',ch.tipo,'url',ch.url,'phone',ch.telefone,'email',ch.email,
    'instructions',ch.instrucoes,'categoryInstructions',cc.instrucoes_especificas,'requiresGovBr',ch.requer_login_govbr,
    'organization',jsonb_build_object('id',org.id,'name',org.nome,'type',org.tipo)) AS channel
    FROM categoria_canais cc JOIN canais_denuncia ch ON ch.id=cc.canal_id AND ch.ativo=TRUE
    JOIN orgaos_responsaveis org ON org.id=ch.orgao_id AND org.ativo=TRUE
    WHERE cc.categoria_id=base.categoria_id AND cc.principal=TRUE LIMIT 1) channel ON TRUE`;
interface OccurrenceRow {
  id: string; titulo: string; descricao?: string; categoria_id: string; categoria_slug: string; categoria_nome: string;
  subcategoria_id: string | null; subcategoria_nome: string | null;
  status_codigo: string; status_nome: string; latitude: number; longitude: number; endereco: string | null; numero: string | null; bairro: string | null;
  criado_em: Date; atualizado_em: Date; validada_em: Date | null; resolvida_em: Date | null;
  ciclo_numero: number | null; ciclo_inicio: Date | null; ciclo_fim: Date | null; current_reports: number; historical_participants: number;
  photo_id: string | null; channel: OccurrenceSummary['officialChannel']; distance_meters?: number;
}
const iso = (date: Date | null) => date ? date.toISOString() : null;
function summary(row: OccurrenceRow): OccurrenceSummary {
  return { id: row.id, title: row.titulo, category: { id: row.categoria_id, slug: row.categoria_slug, name: row.categoria_nome },
    subcategory: row.subcategoria_id && row.subcategoria_nome ? { id: row.subcategoria_id,name: row.subcategoria_nome } : null,
    status: { code: row.status_codigo, name: row.status_nome }, location: { lat: row.latitude, lng: row.longitude },
    address: { street: row.endereco, number: row.numero, neighborhood: row.bairro },
    dates: { createdAt: row.criado_em.toISOString(), updatedAt: row.atualizado_em.toISOString(), validatedAt: iso(row.validada_em), resolvedAt: iso(row.resolvida_em) },
    currentCycle: row.ciclo_numero !== null && row.ciclo_inicio ? { number: row.ciclo_numero, startedAt: row.ciclo_inicio.toISOString(), endedAt: iso(row.ciclo_fim) } : null,
    counts: { currentCycleReports: row.current_reports, historicalParticipants: row.historical_participants },
    publicPhoto: row.photo_id ? { id: row.photo_id } : null, officialChannel: row.channel };
}

export function createOccurrenceReadRepository(database: SqlExecutor) {
  return {
    async covers(area: string, lat: number, lng: number) {
      const [row] = await database.query<{ valid: boolean; inside: boolean }>(`SELECT ST_IsValid(geom) AND GeometryType(geom)='MULTIPOLYGON' AS valid,
        ST_Covers(geom,ST_SetSRID(ST_MakePoint($3,$2),4326)) AS inside FROM(SELECT ST_SetSRID(ST_GeomFromGeoJSON($1),4326) AS geom) a`, [area,lat,lng]);
      return row;
    },
    async nearby(query: NearbyQuery, area: string): Promise<NearbyOccurrence[]> {
      const rows = await database.query<OccurrenceRow>(`WITH area AS(SELECT ST_SetSRID(ST_GeomFromGeoJSON($8),4326) AS geom), base AS(
        SELECT ${baseColumns},ST_Distance(o.localizacao,${point}) AS distance_meters ${baseJoins} CROSS JOIN area a
        WHERE ${visible} AND ST_Covers(a.geom,o.localizacao::geometry) AND ST_Covers(a.geom,${point}::geometry)
          AND ST_DWithin(o.localizacao,${point},LEAST($3,${MAX_NEARBY_RADIUS_METERS})) AND ($4::uuid IS NULL OR o.categoria_id=$4) AND ($5::text IS NULL OR s.codigo=$5)
        ORDER BY distance_meters ASC,o.atualizado_em DESC,o.id ASC LIMIT $6 OFFSET $7
      ) ${projection.replace('EXTRA_COLUMNS', ',base.distance_meters')}
        ORDER BY base.distance_meters ASC,base.atualizado_em DESC,base.id ASC`,
      [query.lat,query.lng,query.radius,query.category ?? null,query.status ?? null,query.size + 1,query.offset,area]);
      return rows.map((row) => ({ ...summary(row), distanceMeters: row.distance_meters! }));
    },
    async detail(id: string): Promise<OccurrenceDetail | null> {
      const [row] = await database.query<OccurrenceRow>(`WITH base AS(SELECT ${baseColumns},o.descricao ${baseJoins} WHERE o.id=$1 AND ${visible})
        ${projection.replace('EXTRA_COLUMNS', ',base.descricao')}`, [id]);
      return row ? { ...summary(row), description: row.descricao! } : null;
    },
    async reports(id: string, paging: ReadPagination): Promise<PublicReport[]> {
      const rows = await database.query<{ id: string; tipo: string; texto: string | null; criado_em: Date; editado_em: Date | null }>(
        `SELECT r.id,r.tipo,r.texto,r.criado_em,r.editado_em FROM relatos r JOIN ocorrencias o ON o.id=r.ocorrencia_id JOIN status_ocorrencia s ON s.id=o.status_id
          WHERE o.id=$1 AND ${visible} AND r.excluido_em IS NULL ORDER BY r.criado_em DESC,r.id ASC LIMIT $2 OFFSET $3`, [id,paging.size + 1,paging.offset]);
      return rows.map((r) => ({ id: r.id, type: r.tipo, text: r.texto, createdAt: r.criado_em.toISOString(), editedAt: iso(r.editado_em) }));
    },
    async history(id: string, paging: ReadPagination): Promise<PublicHistory[]> {
      const rows = await database.query<{ id: string; previous: string | null; status: string; criado_em: Date }>(
        `SELECT h.id,previous.codigo AS previous,next.codigo AS status,h.criado_em FROM historico_status h
          JOIN ocorrencias o ON o.id=h.ocorrencia_id JOIN status_ocorrencia s ON s.id=o.status_id
          LEFT JOIN status_ocorrencia previous ON previous.id=h.status_anterior_id JOIN status_ocorrencia next ON next.id=h.status_novo_id
          WHERE o.id=$1 AND ${visible} ORDER BY h.criado_em DESC,h.id ASC LIMIT $2 OFFSET $3`, [id,paging.size + 1,paging.offset]);
      return rows.map((r) => ({ id: r.id, previousStatus: r.previous, status: r.status, createdAt: r.criado_em.toISOString() }));
    }
  };
}
