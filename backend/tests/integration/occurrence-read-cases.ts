import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Pool } from 'pg';
import type { createDatabase } from '../../src/repositories/database.js';
import { createOccurrenceReadRepository } from '../../src/repositories/occurrences.js';
import { composeAuthBackend } from '../../src/composition/auth.js';
import { mountExperimentalOccurrenceReads } from '../../src/composition/occurrences.js';
import { readConfig } from '../../src/config/index.js';
import { hashPassword } from '../../src/security/password.js';
import { hashAccountToken } from '../../src/security/tokens.js';
import { fixtureRatePolicies } from './auth-controls-cases.js';
import type { MunicipalArea } from '../../src/services/occurrences.js';

const fixtureArea: MunicipalArea = { source: 'synthetic-p12-not-official', version: 'test-only-v1', geoJson: JSON.stringify({
  type: 'MultiPolygon', coordinates: [[[[-46.70,-23.62],[-46.56,-23.62],[-46.56,-23.48],[-46.70,-23.48],[-46.70,-23.62]]]]
}) };
export function occurrenceReadCases(fixture: { database(): ReturnType<typeof createDatabase>; openDatabase(): ReturnType<typeof createDatabase>; admin(): Pool; now(): Date }) {
  describe('P12 preparatoria HTTP + PostgreSQL/PostGIS reais, dados sinteticos', () => {
    let composition: ReturnType<typeof composeAuthBackend>;
    let cookie = ''; let bannedCookie = ''; let email = ''; let ownerId = ''; let bannedId = '';
    let currentArea: MunicipalArea | null = fixtureArea;
    const password = 'frase sintetica para leitura p12';
    const ids: Record<string,string> = {}; const category = randomUUID(); const category2 = randomUUID();
    let publicPhoto = ''; const privateNames: string[] = []; const userIds: string[] = [];
    const cookieHeader = () => ({ cookie });
    const base = '/api/v1/occurrences';
    const nearby = (extra: Record<string,string> = {}) => base+'/nearby?'+new URLSearchParams({ lat: '-23.55',lng: '-46.63',radius: '3000',category,page: '1',size: '3',...extra });
    const request = (url: string, headers: Record<string,string> = cookieHeader()) => composition.app.inject({ method: 'GET',url,headers });
    async function allNearby(extra: Record<string,string> = {}) {
      const items: { id: string; distanceMeters: number }[] = [];
      for (let page = 1; page <= 10; page++) {
        const response = await request(nearby({ ...extra,page: String(page) })); expect(response.statusCode).toBe(200);
        const result = response.json<{ items: typeof items; hasMore: boolean }>(); items.push(...result.items);
        if (!result.hasMore) return items;
      }
      throw new Error('Unexpected synthetic pagination');
    }
    async function login(accountEmail: string) {
      const result = await composition.app.inject({ method: 'POST', url: '/api/v1/auth/login',payload: { email: accountEmail,password } });
      expect(result.statusCode).toBe(200); return String(result.headers['set-cookie']).split(';')[0]!;
    }
    beforeAll(async () => {
      const config = readConfig({ APP_ENV: 'test' });
      composition = composeAuthBackend({ config,database: fixture.openDatabase(),ratePolicies: fixtureRatePolicies(),rateKey: randomBytes(32),
        legal: { termsVersion: 'test-only',privacyVersion: 'test-only' },origin: 'https://example.test',now: fixture.now });
      const auth = composition.mountExperimentalHttp();
      mountExperimentalOccurrenceReads(composition.app,config,{ repository: createOccurrenceReadRepository(fixture.database()), session: auth,
        area: { async load() { return currentArea; } } },{ maxPageSize: 3,maxOffset: 100 }); // Explicit fixtures, not operational thresholds.
      const passwordHash = await hashPassword(password);
      for (let i = 0; i < 4; i++) {
        const accountEmail = `${randomUUID()}@example.test`; const name = `NOME_PRIVADO_P12_${i}`; const tokenHash = randomBytes(32).toString('hex');
        await composition.controls.accounts.register({ name,email: accountEmail,passwordHash,termsVersion: 'test-only',privacyVersion: 'test-only',tokenHash,expiresAt: new Date(fixture.now().getTime()+86400000) });
        expect(await composition.controls.accounts.confirmEmail(tokenHash,fixture.now())).toBe(true);
        const account = (await composition.controls.accounts.findByEmail(accountEmail))!;
        privateNames.push(name); userIds.push(account.id);
        if (i === 0) { ownerId = account.id; email = accountEmail; cookie = await login(accountEmail); }
        if (i === 1) {
          bannedId = account.id;
          await fixture.admin().query("UPDATE usuarios SET papel='ADMIN' WHERE id=$1",[account.id]);
          bannedCookie = await login(accountEmail);
          await fixture.admin().query("UPDATE usuarios SET status='BANIDO' WHERE id=$1",[account.id]);
        }
      }
      await fixture.admin().query("INSERT INTO categorias_ocorrencia(id,slug,nome,subcategoria_modo) VALUES($1,$2,$3,'SEM_SUBCATEGORIA'),($4,$5,$6,'SEM_SUBCATEGORIA')",
        [category,`synthetic-${category}`,'Categoria sintética P12',category2,`synthetic-${category2}`,'Categoria sintética sem principal']);
      const statuses = Object.fromEntries((await fixture.admin().query<{ id: string; codigo: string }>('SELECT id,codigo FROM status_ocorrencia')).rows.map((r) => [r.codigo,r.id]));
      async function occurrence(label: string,distance: number,options: { status?: string; category?: string; lng?: number; lat?: number; updated?: string; archived?: boolean } = {}) {
        const [row] = (await fixture.admin().query<{ id: string }>(`INSERT INTO ocorrencias(categoria_id,status_id,criado_por_usuario_id,titulo,descricao,localizacao,endereco,numero,bairro,
          criado_em,atualizado_em,validada_em,resolvida_em,arquivada_em) VALUES($1,$2,$3,$4,$5,
          CASE WHEN $8::double precision=0 THEN ST_SetSRID(ST_MakePoint($6,$7),4326)::geography ELSE ST_Project(ST_SetSRID(ST_MakePoint($6,$7),4326)::geography,$8,0) END,$9,'10','Bairro sintético','2026-01-01',$10,
          CASE WHEN $11::boolean THEN NULL ELSE '2026-01-02'::timestamptz END,CASE WHEN $12::boolean THEN '2026-01-03'::timestamptz ELSE NULL END,
          CASE WHEN $13::boolean THEN '2026-01-04'::timestamptz ELSE NULL END) RETURNING id`,
        [options.category ?? category,statuses[options.status ?? 'VALIDADA'],ownerId,label,'Descrição coletiva sintética',options.lng ?? -46.63,options.lat ?? -23.55,distance,
          'Rua sintética',options.updated ?? '2026-01-02',options.status === 'PENDENTE_VALIDACAO',options.status === 'RESOLVIDA',options.archived ?? false])).rows;
        ids[label] = row!.id;
        await fixture.admin().query("INSERT INTO ocorrencia_ciclos(ocorrencia_id,numero,motivo_abertura,iniciado_em) VALUES($1,1,'INICIAL','2026-01-01')",[row!.id]);
        return row!.id;
      }
      const near = await occurrence('near',10);
      await occurrence('tie-old',100,{ updated: '2026-01-03' }); await occurrence('tie-new',100,{ updated: '2026-01-04' });
      await occurrence('below',2999); await occurrence('boundary',3000); await occurrence('above',3001);
      for (const status of ['PENDENTE_VALIDACAO','REJEITADA','DUPLICADA','ARQUIVADA']) await occurrence(status,20,{ status });
      await occurrence('archived-flag',30,{ archived: true }); await occurrence('resolved',1500,{ status: 'RESOLVIDA' });
      const removed = await occurrence('removed-pin',25);
      await fixture.admin().query("INSERT INTO acoes_moderacao(ocorrencia_id,moderador_id,tipo,justificativa) VALUES($1,$2,'REMOVER_PIN','Motivo interno sintético')",[removed,userIds[1]]);
      await occurrence('other-category',200,{ category: category2 });
      await occurrence('city-border',0,{ lng: -46.70 }); await occurrence('outside-city',0,{ lng: -46.70001 });
      const [{ id: oldCycle }] = (await fixture.admin().query<{ id: string }>('SELECT id FROM ocorrencia_ciclos WHERE ocorrencia_id=$1',[near])).rows as [{ id: string }];
      await fixture.admin().query("UPDATE ocorrencia_ciclos SET encerrado_em='2026-01-03' WHERE id=$1",[oldCycle]);
      const [{ id: newCycle }] = (await fixture.admin().query<{ id: string }>("INSERT INTO ocorrencia_ciclos(ocorrencia_id,numero,motivo_abertura,iniciado_em) VALUES($1,2,'REABERTURA_MODERACAO','2026-01-04') RETURNING id",[near])).rows as [{ id: string }];
      const reports: string[] = [];
      for (const [cycle,owner,type,removed] of [[oldCycle,userIds[0],'INICIAL',false],[oldCycle,userIds[1],'CONFIRMACAO',false],
        [newCycle,userIds[0],'REABERTURA',false],[newCycle,userIds[2],'CONFIRMACAO',false],[newCycle,userIds[3],'CONFIRMACAO',true]] as const) {
        const [{ id }] = (await fixture.admin().query<{ id: string }>(`INSERT INTO relatos(ocorrencia_id,ciclo_id,usuario_id,tipo,texto,criado_em,excluido_em)
          VALUES($1,$2,$3,$4,'Texto coletivo sintético','2026-01-05',CASE WHEN $5::boolean THEN '2026-01-06'::timestamptz ELSE NULL END) RETURNING id`,[near,cycle,owner,type,removed])).rows as [{ id: string }];
        reports.push(id);
      }
      const [{ id: photoId }] = (await fixture.admin().query<{ id: string }>(`INSERT INTO evidencias(ocorrencia_id,relato_id,arquivo_chave,mime_type,publica_no_pin,aprovada_por_usuario_id,aprovada_em)
        VALUES($1,$2,'private-original-must-never-leak','image/png',TRUE,$3,'2026-01-06') RETURNING id`,[near,reports[2],userIds[1]])).rows as [{ id: string }];
      publicPhoto = photoId;
      await fixture.admin().query("INSERT INTO evidencias(ocorrencia_id,relato_id,arquivo_chave,mime_type) VALUES($1,$2,'another-private-original','image/png')",[near,reports[3]]);
      const [{ id: unapprovedReport }] = (await fixture.admin().query<{ id: string }>(`INSERT INTO relatos(ocorrencia_id,ciclo_id,usuario_id,tipo)
        SELECT $1,id,$2,'INICIAL' FROM ocorrencia_ciclos WHERE ocorrencia_id=$1 RETURNING id`,[ids['other-category'],ownerId])).rows as [{ id: string }];
      await fixture.admin().query("INSERT INTO evidencias(ocorrencia_id,relato_id,arquivo_chave,mime_type,publica_no_pin) VALUES($1,$2,'unapproved-private-key','image/png',TRUE)",[ids['other-category'],unapprovedReport]);
      await fixture.admin().query(`INSERT INTO historico_status(ocorrencia_id,status_anterior_id,status_novo_id,usuario_id,origem,observacao,criado_em)
        VALUES($1,NULL,$2,$3,'USUARIO','private-moderation-note','2026-01-01'),($1,$2,$4,$3,'MODERADOR','private-moderation-note','2026-01-02'),
        ($1,$4,$5,$3,'SISTEMA','private-moderation-note','2026-01-03')`,[near,statuses.PENDENTE_VALIDACAO,ownerId,statuses.VALIDADA,statuses.REABERTA]);
      const [{ id: organization }] = (await fixture.admin().query<{ id: string }>("INSERT INTO orgaos_responsaveis(nome,tipo) VALUES('Órgão sintético P12','PUBLICO') RETURNING id")).rows as [{ id: string }];
      const [{ id: channel }] = (await fixture.admin().query<{ id: string }>("INSERT INTO canais_denuncia(orgao_id,nome,tipo,url,instrucoes) VALUES($1,'Canal sintético','SITE','https://canal.example.test/','Instrução sintética') RETURNING id",[organization])).rows as [{ id: string }];
      await fixture.admin().query('INSERT INTO categoria_canais(categoria_id,canal_id,principal) VALUES($1,$2,TRUE),($3,$2,FALSE)',[category,channel,category2]);
    },60000);
    afterAll(async () => { await composition?.app.close(); });

    it('orders by real geography distance, then update, with deterministic pagination',async () => {
      const first = await request(nearby()); expect(first.statusCode).toBe(200);
      const body = first.json(); expect(body.items.map((r: { id: string }) => r.id)).toEqual([ids.near,ids['tie-new'],ids['tie-old']]);
      expect(body.hasMore).toBe(true); expect(body.items[0].distanceMeters).toBeCloseTo(10,3);
      expect(body.items.every((r: { distanceMeters: number }) => r.distanceMeters >= 0 && r.distanceMeters <= 3000)).toBe(true);
      expect(first.headers['cache-control']).toBe('private, no-store');
    });
    it('paginates without overlaps, bounds offsets and page sizes, and handles an empty page',async () => {
      const one = (await request(nearby({ size: '2' }))).json(); const two = (await request(nearby({ size: '2',page: '2' }))).json();
      expect(new Set([...one.items,...two.items].map((i: { id: string }) => i.id)).size).toBe(4);
      expect((await request(nearby({ page: '50',size: '2' }))).json().items).toEqual([]);
      expect((await request(nearby({ page: '999' }))).statusCode).toBe(422); expect((await request(nearby({ size: '4' }))).statusCode).toBe(422);
      expect((await request(nearby({ size: '2' }))).json()).toEqual(one);
    });
    it('enforces below/equal/above 3000 m and clamps an oversized radius',async () => {
      const items = await allNearby(); const found = items.map((r) => r.id);
      expect(found).toContain(ids.below); expect(found).toContain(ids.boundary); expect(found).not.toContain(ids.above);
      expect((await allNearby({ radius: '9000' })).map((r) => r.id)).toEqual(found);
    });
    it('filters category/status and never promotes hidden states through a query',async () => {
      const other = (await request(nearby({ category: category2 }))).json(); expect(other.items.map((r: { id: string }) => r.id)).toEqual([ids['other-category']]);
      const resolved = (await request(nearby({ status: 'RESOLVIDA' }))).json(); expect(resolved.items.map((r: { id: string }) => r.id)).toEqual([ids.resolved]);
      expect((await request(nearby({ status: 'PENDENTE_VALIDACAO' }))).json().items).toEqual([]);
      expect((await request(nearby({ category: "' OR 1=1 --" }))).statusCode).toBe(422);
    });
    it('uses ST_Covers for municipal border and excludes nearby pins outside the synthetic area',async () => {
      expect((await request(nearby({ lat: '0',lng: '0' }))).statusCode).toBe(422);
      const border = await request(nearby({ lng: '-46.70',radius: '500' })); expect(border.statusCode).toBe(200);
      expect(border.json().items.map((r: { id: string }) => r.id)).toEqual([ids['city-border']]);
      expect((await request(base+'/'+ids['outside-city'])).statusCode).toBe(404);
    });
    it('hides pending, rejected, duplicated and archived occurrences on every ID read',async () => {
      for (const label of ['PENDENTE_VALIDACAO','REJEITADA','DUPLICADA','ARQUIVADA','archived-flag','removed-pin']) {
        for (const suffix of ['', '/reports?page=1&size=1','/history?page=1&size=1','/official-channel']) expect((await request(base+'/'+ids[label]+suffix)).statusCode).toBe(404);
      }
      expect((await request(base+'/'+randomUUID())).statusCode).toBe(404);
    });
    it('separates current-cycle reports from historical DISTINCT participants and projects only public photo metadata',async () => {
      const result = await request(base+'/'+ids.near); expect(result.statusCode).toBe(200); const detail = result.json();
      expect(detail.counts).toEqual({ currentCycleReports: 2,historicalParticipants: 3 }); expect(detail.currentCycle.number).toBe(2);
      expect(detail.publicPhoto).toEqual({ id: publicPhoto }); expect(detail.description).toBe('Descrição coletiva sintética');
      expect(detail.dates.createdAt).toMatch(/Z$/);
      for (const value of [...privateNames,...userIds,'private-original-must-never-leak','another-private-original',email,'private-moderation-note']) expect(result.body).not.toContain(value);
      const unapproved = await request(base+'/'+ids['other-category']); expect(unapproved.json().publicPhoto).toBeNull(); expect(unapproved.body).not.toContain('unapproved-private-key');
    });
    it('paginates active reports and hides reporter identity and deleted content',async () => {
      const one = (await request(base+'/'+ids.near+'/reports?page=1&size=2')).json(); const two = (await request(base+'/'+ids.near+'/reports?page=2&size=2')).json();
      expect(one.hasMore).toBe(true); expect(two.hasMore).toBe(false); expect([...one.items,...two.items]).toHaveLength(4);
      expect(new Set([...one.items,...two.items].map((r: { id: string }) => r.id)).size).toBe(4);
      for (const row of [...one.items,...two.items]) expect(Object.keys(row).sort()).toEqual(['createdAt','editedAt','id','text','type']);
    });
    it('paginates history without exposing moderation actor or notes',async () => {
      const one = await request(base+'/'+ids.near+'/history?page=1&size=2'); const two = await request(base+'/'+ids.near+'/history?page=2&size=2');
      expect(one.json().hasMore).toBe(true); expect(two.json().hasMore).toBe(false);
      expect([...one.json().items,...two.json().items]).toHaveLength(3);
      expect(one.body).not.toContain('private-moderation-note'); expect(one.body).not.toContain(ownerId);
    });
    it('returns only a registered principal channel or the literal absence message without a status transition',async () => {
      const channel = await request(base+'/'+ids.near+'/official-channel'); expect(channel.statusCode).toBe(200);
      expect(channel.json().channel.url).toBe('https://canal.example.test/');
      const missing = await request(base+'/'+ids['other-category']+'/official-channel');
      expect(missing.json()).toEqual({ channel: null,message: 'Canal oficial ainda não cadastrado' });
      expect((await request(base+'/'+ids.near)).json().status.code).toBe('VALIDADA');
      const organization = channel.json().channel.organization.id;
      await fixture.admin().query('UPDATE orgaos_responsaveis SET ativo=FALSE WHERE id=$1',[organization]);
      try { expect((await request(base+'/'+ids.near+'/official-channel')).json()).toEqual({ channel: null,message: 'Canal oficial ainda não cadastrado' }); }
      finally { await fixture.admin().query('UPDATE orgaos_responsaveis SET ativo=TRUE WHERE id=$1',[organization]); }
    });
    it('requires authentication on all five GET routes',async () => {
      for (const url of [nearby(),base+'/'+ids.near,base+'/'+ids.near+'/reports?page=1&size=1',base+'/'+ids.near+'/history?page=1&size=1',base+'/'+ids.near+'/official-channel']) {
        expect((await request(url,{})).statusCode).toBe(401);
      }
    });
    it('revalidates BANIDO/ADMIN in read-only mode without widening visibility',async () => {
      expect(bannedId).toBeTruthy(); expect((await request(base+'/'+ids.near,{ cookie: bannedCookie })).statusCode).toBe(200);
      expect((await request(base+'/'+ids.PENDENTE_VALIDACAO,{ cookie: bannedCookie })).statusCode).toBe(404);
      expect((await composition.app.inject({ method: 'POST',url: base,headers: { cookie: bannedCookie },payload: {} })).statusCode).toBe(404);
    });
    it('rejects revoked and expired real sessions',async () => {
      await fixture.admin().query('UPDATE usuarios SET email_verificado_em=NULL WHERE id=$1',[ownerId]);
      try { expect((await request(nearby())).statusCode).toBe(401); }
      finally { await fixture.admin().query('UPDATE usuarios SET email_verificado_em=clock_timestamp() WHERE id=$1',[ownerId]); }
      await composition.controls.sessions.revoke(hashAccountToken(cookie.split('=')[1]!),fixture.now());
      expect((await request(nearby())).statusCode).toBe(401); cookie = await login(email);
      const at = fixture.now();
      await fixture.admin().query('UPDATE sessoes SET criado_em=$2,ultima_atividade_em=$3 WHERE id_hash=$1',[hashAccountToken(cookie.split('=')[1]!),new Date(at.getTime()-7200000),new Date(at.getTime()-1860000)]);
      expect((await request(nearby())).statusCode).toBe(401); cookie = await login(email);
    });
    it('fails closed when the municipal source is unavailable, never using city text as fallback',async () => {
      currentArea = null;
      try {
        const result = await request(nearby()); expect(result.statusCode).toBe(503); expect(result.body).not.toMatch(/-23\.55|-46\.63|SQL/);
        currentArea = { ...fixtureArea,geoJson: JSON.stringify({ type: 'MultiPolygon',coordinates: [[[[-46.7,-23.6],[-46.6,-23.5],[-46.7,-23.5],[-46.6,-23.6],[-46.7,-23.6]]]] }) };
        const invalid = await request(nearby()); expect(invalid.statusCode).toBe(503); expect(invalid.body).not.toMatch(/PostGIS|Topology|coordinates/);
      }
      finally { currentArea = fixtureArea; }
    });
    it('uses the spatial GiST index definition and an application role without occurrence write privileges',async () => {
      const [role] = await fixture.database().query<{ read: boolean; write: boolean }>("SELECT has_table_privilege(current_user,'ocorrencias','SELECT') AS read,has_table_privilege(current_user,'ocorrencias','INSERT') AS write");
      expect(role).toEqual({ read: true,write: false });
      const index = await fixture.admin().query("SELECT indexdef FROM pg_indexes WHERE tablename='ocorrencias' AND indexname='idx_ocorrencias_localizacao'");
      expect(index.rows[0].indexdef).toContain('USING gist');
    });
  });
}
