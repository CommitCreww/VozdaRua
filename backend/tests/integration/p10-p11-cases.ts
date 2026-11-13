import { createHash,randomBytes,randomUUID } from 'node:crypto';
import { beforeAll,afterAll,describe,it,expect } from 'vitest';
import type { Pool } from 'pg';
import type { createDatabase,TransactionalSqlExecutor } from '../../src/repositories/database.js';
import { composeAuthBackend } from '../../src/composition/auth.js';
import { readConfig } from '../../src/config/index.js';
import { createProfileRepository } from '../../src/repositories/profile.js';
import { mountExperimentalProfile } from '../../src/composition/profile.js';
import { createOccurrenceCatalog } from '../../src/repositories/catalog.js';
import { createMunicipalAreaRepository,type AreaArtifact } from '../../src/repositories/municipal-area.js';
import { stageMunicipalArea } from '../../src/services/municipal-area.js';
import { createOccurrenceReadRepository } from '../../src/repositories/occurrences.js';
import { mountExperimentalOccurrenceReads } from '../../src/composition/occurrences.js';
import { hashPassword } from '../../src/security/password.js';
import { hashAccountToken } from '../../src/security/tokens.js';
import { fixtureRatePolicies } from './auth-controls-cases.js';
import { syntheticArtifact } from '../fixtures/municipal-area.js';
import { experimental,recordExperiment } from './local-experiment.js';

export function p10p11Cases(fixture:{ database():ReturnType<typeof createDatabase>;openDatabase():ReturnType<typeof createDatabase>;admin():Pool;now():Date }) {
  describe('P10/P11 backend preparatorio, banco real isolado',() => {
    let app:ReturnType<typeof composeAuthBackend>; const extras:ReturnType<typeof composeAuthBackend>[]=[];
    let ownerId='';let otherId='';let email='';let cookie='';let csrf='';let areaId='';
    const password='frase sintetica perfil p10 p11'; const posts:string[]=[];
    const profile=createProfileRepository;
    const admin:TransactionalSqlExecutor={async query<Row>(sql:string,values?:readonly unknown[]){return(await fixture.admin().query(sql,values?[...values]:undefined)).rows as Row[];},
      async transaction(work){const client=await fixture.admin().connect();try{await client.query('BEGIN');const value=await work({async query<Row>(sql:string,values?:readonly unknown[]){return(await client.query(sql,values?[...values]:undefined)).rows as Row[];}});await client.query('COMMIT');return value;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}};
    let artifact:AreaArtifact; let staged:ReturnType<typeof createMunicipalAreaRepository>;
    const headers=()=>({cookie,origin:'https://example.test','x-csrf-token':csrf});
    const patch=(payload:unknown,custom=headers())=>app.app.inject({method:'PATCH',url:'/api/v1/me/privacy',headers:custom,payload:payload as Record<string,unknown>});
    async function login(){const result=await app.app.inject({method:'POST',url:'/api/v1/auth/login',payload:{email,password}});expect(result.statusCode).toBe(200);cookie=String(result.headers['set-cookie']).split(';')[0]!;csrf=result.json().csrfToken;}
    function build(repository:ReturnType<typeof profile>){const config=readConfig({APP_ENV:'test'});const root=composeAuthBackend({config,database:fixture.openDatabase(),ratePolicies:fixtureRatePolicies(),rateKey:randomBytes(32),legal:{termsVersion:'test-only',privacyVersion:'test-only'},origin:'https://example.test',now:fixture.now});
      const session=root.mountExperimentalHttp();mountExperimentalProfile(root.app,config,{repository,session,origin:'https://example.test',now:fixture.now});
      mountExperimentalOccurrenceReads(root.app,config,{repository:createOccurrenceReadRepository(fixture.database()),session,area:createMunicipalAreaRepository(fixture.database()).experimentalSource('test',areaId)},{maxPageSize:3,maxOffset:30});return root;}
    async function lockVisible(pattern:string){for(let i=0;i<60;i++){const row=await fixture.admin().query<{waiting:boolean}>("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE $1) AS waiting",[pattern]);if(row.rows[0]!.waiting)return;await new Promise((resolve)=>setTimeout(resolve,25));}throw new Error('Synthetic lock contention not observed');}
    beforeAll(async()=>{
      staged=createMunicipalAreaRepository(admin);artifact=syntheticArtifact({sourceSrid:4674});areaId=await stageMunicipalArea(staged,artifact);
      app=build(profile(fixture.database()));const passwordHash=await hashPassword(password);
      for(let i=0;i<2;i++){const accountEmail=`${randomUUID()}@example.test`;const tokenHash=randomBytes(32).toString('hex');await app.controls.accounts.register({name:`Pessoa sintética P10 ${i}`,email:accountEmail,passwordHash,termsVersion:'test-only',privacyVersion:'test-only',tokenHash,expiresAt:new Date(fixture.now().getTime()+86400000)});expect(await app.controls.accounts.confirmEmail(tokenHash,fixture.now())).toBe(true);const account=(await app.controls.accounts.findByEmail(accountEmail))!;if(i===0){ownerId=account.id;email=accountEmail;}else otherId=account.id;}
      await fixture.admin().query("INSERT INTO identidades_auth(usuario_id,provedor,subject_externo,email_provedor) VALUES($1,'GOOGLE','private-external-subject','private-provider@example.test')",[ownerId]);
      for(const status of ['PUBLICADO','OCULTO','REMOVIDO']){const result=await fixture.admin().query<{id:string}>("INSERT INTO posts(usuario_id,conteudo,status,removido_em) VALUES($1,'Conteúdo sintético',$2::varchar,CASE WHEN $2::varchar='REMOVIDO' THEN clock_timestamp() ELSE NULL END) RETURNING id",[ownerId,status]);posts.push(result.rows[0]!.id);}
      await fixture.admin().query('INSERT INTO seguidores(seguidor_id,seguido_id) VALUES($1,$2)',[otherId,ownerId]);await login();
    },60000);
    afterAll(async()=>{await Promise.all([app,...extras].filter(Boolean).map((r)=>r.app.close()));});

    it('GET /me retorna somente o titular e metodos sem subject/token/hash',async()=>{
      const result=await app.app.inject({method:'GET',url:'/api/v1/me',headers:{cookie}});expect(result.statusCode).toBe(200);expect(result.headers['cache-control']).toBe('private, no-store');
      expect(result.json()).toMatchObject({id:ownerId,email,authenticationMethods:['LOCAL','GOOGLE'],privacy:{perfil_publico:false,exibir_nome_nos_relatos:false}});
      expect(result.body).not.toMatch(/senha_hash|csrf|subject|private-provider|private-external/);expect(result.body).not.toContain(otherId);
      expect((await app.app.inject({method:'GET',url:'/api/v1/me?id='+otherId,headers:{cookie}})).statusCode).toBe(422);
    });
    it('nega acesso sem sessao, CSRF/origem invalidos, mass assignment e rotas cadastrais/exclusao nao implementadas',async()=>{
      expect((await app.app.inject({method:'GET',url:'/api/v1/me'})).statusCode).toBe(401);
      expect((await patch({perfil_publico:true},{cookie,origin:'https://evil.example.test','x-csrf-token':csrf})).statusCode).toBe(403);
      expect((await patch({perfil_publico:true},{cookie,origin:'https://example.test','x-csrf-token':'wrong'})).statusCode).toBe(403);
      for(const payload of [{perfil_publico:true,papel:'ADMIN'},{perfil_publico:true,id:otherId},{status:'ATIVO'},{perfil_publico:'true'},{}])expect((await patch(payload)).statusCode).toBe(422);
      expect((await app.app.inject({method:'PATCH',url:'/api/v1/me',headers:headers(),payload:{name:'Alteração não contratada'}})).statusCode).toBe(404);
      // DELETE is not invoked: no destructive action is part of this sprint.
      const other=(await profile(fixture.database()).self(otherId))!;expect(other.privacy.perfil_publico).toBe(false);
    });
    it('publico/privado/publico preserva posts e seguidores sem ressuscitar removidos/ocultos',async()=>{
      const repository=profile(fixture.database());expect(await repository.isPostPublicVisible(posts[0]!)).toBe(false);
      expect((await patch({perfil_publico:true,exibir_nome_nos_relatos:true})).statusCode).toBe(200);expect(await repository.isPostPublicVisible(posts[0]!)).toBe(true);
      expect((await patch({perfil_publico:false})).statusCode).toBe(200);expect(await repository.isPostPublicVisible(posts[0]!)).toBe(false);
      expect((await patch({perfil_publico:true})).statusCode).toBe(200);expect(await repository.isPostPublicVisible(posts[0]!)).toBe(true);
      expect(await repository.isPostPublicVisible(posts[1]!)).toBe(false);expect(await repository.isPostPublicVisible(posts[2]!)).toBe(false);
      expect((await fixture.admin().query('SELECT 1 FROM seguidores WHERE seguidor_id=$1 AND seguido_id=$2',[otherId,ownerId])).rowCount).toBe(1);
      const logs=await fixture.admin().query('SELECT dados,request_id FROM logs_auditoria WHERE usuario_id=$1 AND acao=$2',[ownerId,'PRIVACIDADE_ATUALIZADA']);expect(logs.rows).toHaveLength(3);expect(logs.rows.every((r)=>r.dados===null&&r.request_id)).toBe(true);
    });
    it('duas atualizacoes concorrentes nao perdem preferencia de campo distinto',async()=>{
      await patch({perfil_publico:false,exibir_nome_nos_relatos:false});
      const results=await Promise.all([patch({perfil_publico:true}),patch({exibir_nome_nos_relatos:true})]);expect(results.map((r)=>r.statusCode)).toEqual([200,200]);
      expect((await profile(fixture.database()).self(ownerId))!.privacy).toEqual({perfil_publico:true,exibir_nome_nos_relatos:true});
    });
    it('falha de auditoria reverte privacidade e retorna erro sem detalhes SQL',async()=>{
      const proxy:TransactionalSqlExecutor={query:(sql,values)=>fixture.database().query(sql,values),transaction:(work)=>fixture.database().transaction((sql)=>work({async query<Row>(statement:string,values?:readonly unknown[]){if(statement.includes('INSERT INTO logs_auditoria'))throw new Error('SQL password=private');return sql.query<Row>(statement,values);}}))};
      const failed=build(profile(proxy));extras.push(failed);const before=(await profile(fixture.database()).self(ownerId))!.privacy;
      const result=await failed.app.inject({method:'PATCH',url:'/api/v1/me/privacy',headers:headers(),payload:{perfil_publico:!before.perfil_publico}});expect(result.statusCode).toBe(503);expect(result.body).not.toMatch(/SQL|password|private/);expect((await profile(fixture.database()).self(ownerId))!.privacy).toEqual(before);
    });
    it('banimento concorrente e revalidado dentro da transacao antes da escrita',async()=>{
      const client=await fixture.admin().connect();let committed=false;let pending:ReturnType<typeof patch>|undefined;const before=(await profile(fixture.database()).self(ownerId))!.privacy;
      try{await client.query('BEGIN');await client.query("UPDATE usuarios SET status='BANIDO',papel='ADMIN' WHERE id=$1",[ownerId]);pending=patch({perfil_publico:!before.perfil_publico});await lockVisible('%SELECT status,papel,email_verificado_em FROM usuarios%');await client.query('COMMIT');committed=true;expect((await pending).statusCode).toBe(403);expect((await profile(fixture.database()).self(ownerId))!.privacy).toEqual(before);expect((await app.app.inject({method:'GET',url:'/api/v1/me',headers:{cookie}})).statusCode).toBe(200);}
      finally{if(!committed)await client.query('ROLLBACK');client.release();await pending;await fixture.admin().query("UPDATE usuarios SET status='ATIVO',papel='CIDADAO' WHERE id=$1",[ownerId]);}
    },15000);
    it('sessao revogada impede alteracao mesmo com CSRF previamente valido',async()=>{
      await app.controls.sessions.revoke(hashAccountToken(cookie.split('=')[1]!),fixture.now());expect((await patch({perfil_publico:false})).statusCode).toBe(401);await login();
    });
    it('expiracao absoluta enquanto aguarda lock impede escrita com instante de autorizacao antigo',async()=>{
      const client=await fixture.admin().connect();let committed=false;let pending:ReturnType<typeof patch>|undefined;const before=(await profile(fixture.database()).self(ownerId))!.privacy;
      try{
        await client.query('BEGIN');await client.query('SELECT id FROM usuarios WHERE id=$1 FOR UPDATE',[ownerId]);
        pending=patch({perfil_publico:!before.perfil_publico});await lockVisible('%SELECT status,papel,email_verificado_em FROM usuarios%');
        const expires=new Date(fixture.now().getTime()+100);
        await client.query('UPDATE sessoes SET criado_em=$2 WHERE id_hash=$1',[hashAccountToken(cookie.split('=')[1]!),new Date(expires.getTime()-12*60*60*1000)]);
        await new Promise((resolve)=>setTimeout(resolve,150));await client.query('COMMIT');committed=true;
        expect((await pending).statusCode).toBe(401);expect((await profile(fixture.database()).self(ownerId))!.privacy).toEqual(before);
      }finally{if(!committed)await client.query('ROLLBACK');client.release();await pending;await login();}
    },15000);
    it('upgrade preserva categorias/IDs/ocorrencia legada sem atribuir modos/subcategorias',async()=>{
      const legacy=await fixture.database().query<{subcategoria_id:string|null;subcategoria_modo:string|null}>("SELECT o.subcategoria_id,c.subcategoria_modo FROM ocorrencias o JOIN categorias_ocorrencia c ON c.id=o.categoria_id WHERE o.titulo='Legacy P11 upgrade'");expect(legacy).toHaveLength(1);expect(legacy[0]).toEqual({subcategoria_id:null,subcategoria_modo:null});
      const [category]=await fixture.database().query<{id:string}>("SELECT id FROM categorias_ocorrencia WHERE slug='buraco-via'");const catalog=createOccurrenceCatalog(fixture.database(),{maxPageSize:20,maxOffset:100});expect(await catalog.validateSelection(category!.id,null)).toBe('CONFIGURATION_PENDING');
      expect((await fixture.database().query<{valor:number}>("SELECT valor FROM parametros_sistema WHERE chave='ocorrencia.duplicidade_raio_metros'"))[0]!.valor).toBe(100);
    });

    const categories:Record<string,string>={};const subs:Record<string,string>={};
    async function category(mode:string|null){const id=randomUUID();await fixture.admin().query('INSERT INTO categorias_ocorrencia(id,slug,nome,subcategoria_modo) VALUES($1,$2,$3,$4)',[id,'fixture-'+id,'Fixture '+id,mode]);return id;}
    async function occurrence(cat:string,sub:string|null){return fixture.admin().query(`INSERT INTO ocorrencias(categoria_id,subcategoria_id,status_id,titulo,descricao,localizacao)
      SELECT $1,$2,id,'Fixture taxonomy','Somente teste',ST_SetSRID(ST_MakePoint(-46.65,-23.55),4326)::geography FROM status_ocorrencia WHERE codigo='VALIDADA' RETURNING id`,[cat,sub]);}
    it('catalogo valida modos sem inventar subcategorias operacionais e FK/trigger impedem vinculo cruzado',async()=>{
      for(const mode of ['SEM_SUBCATEGORIA','OPCIONAL','OBRIGATORIA']){categories[mode]=await category(mode);if(mode!=='SEM_SUBCATEGORIA'){const result=await fixture.admin().query<{id:string}>("INSERT INTO subcategorias_ocorrencia(categoria_id,nome) VALUES($1,'Subcategoria sintética de fixture') RETURNING id",[categories[mode]]);subs[mode]=result.rows[0]!.id;}}
      const catalog=createOccurrenceCatalog(fixture.database(),{maxPageSize:2,maxOffset:10});
      expect(await catalog.validateSelection(categories.OBRIGATORIA!,null)).toBe('SUBCATEGORY_REQUIRED');expect(await catalog.validateSelection(categories.SEM_SUBCATEGORIA!,subs.OPCIONAL!)).toBe('SUBCATEGORY_FORBIDDEN');
      expect(await catalog.validateSelection(categories.OPCIONAL!,subs.OBRIGATORIA!)).toBe('SUBCATEGORY_INVALID');expect(await catalog.validateSelection(categories.OPCIONAL!,null)).toBe('VALID');
      await expect(occurrence(categories.OBRIGATORIA!,null)).rejects.toMatchObject({code:'23514'});await expect(occurrence(categories.SEM_SUBCATEGORIA!,subs.OPCIONAL!)).rejects.toMatchObject({code:'23514'});await expect(occurrence(categories.OPCIONAL!,subs.OBRIGATORIA!)).rejects.toMatchObject({code:'23514'});
      const valid=await occurrence(categories.OBRIGATORIA!,subs.OBRIGATORIA!);expect(valid.rowCount).toBe(1);
      expect((await createOccurrenceReadRepository(fixture.database()).detail(valid.rows[0].id))!.subcategory).toEqual({id:subs.OBRIGATORIA,name:'Subcategoria sintética de fixture'});
      expect(await catalog.subcategories(categories.OPCIONAL!,{page:1,size:2,offset:0})).toHaveLength(1);
    });
    it('subcategoria inativa e troca de modo incompatível sao rejeitadas preservando historia',async()=>{
      await fixture.admin().query('UPDATE subcategorias_ocorrencia SET ativo=FALSE WHERE id=$1',[subs.OPCIONAL]);await expect(occurrence(categories.OPCIONAL!,subs.OPCIONAL!)).rejects.toMatchObject({code:'23514'});
      await expect(fixture.admin().query("UPDATE categorias_ocorrencia SET subcategoria_modo='SEM_SUBCATEGORIA' WHERE id=$1",[categories.OBRIGATORIA])).rejects.toMatchObject({code:'23514'});
      await occurrence(categories.OPCIONAL!,null);await expect(fixture.admin().query("UPDATE categorias_ocorrencia SET subcategoria_modo='OBRIGATORIA' WHERE id=$1",[categories.OPCIONAL])).rejects.toMatchObject({code:'23514'});
    });
    it('mudanca concorrente de modo e insercao respeitam o lock e a obrigatoriedade',async()=>{
      const cat=await category('OPCIONAL');const client=await fixture.admin().connect();let committed=false;let pending:Promise<string>|undefined;
      try{await client.query('BEGIN');await client.query("UPDATE categorias_ocorrencia SET subcategoria_modo='OBRIGATORIA' WHERE id=$1",[cat]);pending=occurrence(cat,null).then(()=> 'ACCEPTED',(error:unknown)=>String((error as {code:string}).code));await lockVisible('%INSERT INTO ocorrencias(categoria_id,subcategoria_id%');await client.query('COMMIT');committed=true;expect(await pending).toBe('23514');}
      finally{if(!committed)await client.query('ROLLBACK');client.release();await pending;}
    },15000);
    it('importacao transforma CRS explicitamente, valida topologia e mantem versao inativa/sintetica',async()=>{
      const [row]=await fixture.database().query<{srid:number;original:number;type:string;valid:boolean;active:boolean;approved:boolean;synthetic:boolean;points:number}>(`SELECT ST_SRID(geometria) AS srid,srid_origem AS original,GeometryType(geometria) AS type,ST_IsValid(geometria) AS valid,ativo AS active,aprovada AS approved,sintetica AS synthetic,ST_NPoints(geometria) AS points FROM areas_municipais WHERE id=$1`,[areaId]);
      expect(row).toMatchObject({srid:4326,original:4674,type:'MULTIPOLYGON',valid:true,active:false,approved:false,synthetic:true});expect(row!.points).toBeGreaterThanOrEqual(5);expect(await createMunicipalAreaRepository(fixture.database()).source().load()).toBeNull();
      await expect(fixture.admin().query('UPDATE areas_municipais SET ativo=TRUE,aprovada=TRUE WHERE id=$1',[areaId])).rejects.toMatchObject({code:'23514'});
      await expect(stageMunicipalArea(createMunicipalAreaRepository(fixture.database()),syntheticArtifact())).rejects.toThrow('staging failed');
    });
    it('importacao e idempotente e versao conflitante/invalida nunca substitui geometria',async()=>{
      expect(await stageMunicipalArea(staged,artifact)).toBe(areaId);
      const changed=JSON.stringify({type:'Polygon',coordinates:[[[-46.8,-23.6],[-46.6,-23.6],[-46.6,-23.5],[-46.8,-23.5],[-46.8,-23.6]]]});
      await expect(stageMunicipalArea(staged,{...artifact,geoJson:changed,sha256:createHash('sha256').update(changed).digest('hex')})).rejects.toThrow('staging failed');
      const invalid=JSON.stringify({type:'Polygon',coordinates:[[[-46.7,-23.6],[-46.6,-23.5],[-46.7,-23.5],[-46.6,-23.6],[-46.7,-23.6]]]});const bad=syntheticArtifact({geoJson:invalid,sha256:createHash('sha256').update(invalid).digest('hex')});await expect(stageMunicipalArea(staged,bad)).rejects.toThrow('staging failed');
      expect((await fixture.database().query('SELECT id FROM areas_municipais WHERE versao=$1',[bad.version]))).toHaveLength(0);
    });
    it('staging rejeita coordenadas fora dos intervalos geograficos apos transformacao',async()=>{
      for(const ring of [
        [[-46.7,91],[-46.6,91],[-46.6,92],[-46.7,92],[-46.7,91]],
        [[181,-23.6],[182,-23.6],[182,-23.5],[181,-23.5],[181,-23.6]],
        [[330000,7390000],[331000,7390000],[331000,7391000],[330000,7391000],[330000,7390000]]
      ]){
        const geoJson=JSON.stringify({type:'Polygon',coordinates:[ring]});
        const invalid=syntheticArtifact({geoJson,sha256:createHash('sha256').update(geoJson).digest('hex'),sourceSrid:4326});
        await expect(stageMunicipalArea(staged,invalid)).rejects.toThrow('configuration invalid');
        expect(await fixture.database().query('SELECT id FROM areas_municipais WHERE versao=$1',[invalid.version])).toHaveLength(0);
      }
    });
    it('constraint geográfica rejeita dados fora do domínio mesmo sem o service',async()=>{
      const geoJson=JSON.stringify({type:'Polygon',coordinates:[[[-46.7,91],[-46.6,91],[-46.6,92],[-46.7,92],[-46.7,91]]]});
      const [diagnostic]=await fixture.database().query<{topologyAccepted:boolean;withinGeographicBounds:boolean}>(`SELECT
        GeometryType(g)='MULTIPOLYGON' AND ST_IsValid(g) AND NOT ST_IsEmpty(g) AND ST_NDims(g)=2 AS "topologyAccepted",
        ST_XMin(Box3D(g))>=-180 AND ST_XMax(Box3D(g))<=180 AND ST_YMin(Box3D(g))>=-90 AND ST_YMax(Box3D(g))<=90 AS "withinGeographicBounds"
        FROM(SELECT ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($1),4326)) AS g) a`,[geoJson]);
      expect(diagnostic).toEqual({topologyAccepted:true,withinGeographicBounds:false});
      await expect(fixture.admin().query(`INSERT INTO areas_municipais(nome,codigo_oficial,fonte_url,versao,licenca,licenca_url,srid_origem,artefato_sha256,geometria,sintetica)
        SELECT nome,codigo_oficial,fonte_url,$2,licenca,licenca_url,4326,$3,ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($4),4326)),TRUE FROM areas_municipais WHERE id=$1`,
      [areaId,randomUUID(),createHash('sha256').update(geoJson).digest('hex'),geoJson])).rejects.toMatchObject({code:'23514',constraint:'ck_area_geographic_bounds'});
    });
    it('transforma coordenadas métricas 31983 sem confundi-las com graus e preserva versão anterior',async()=>{
      const [projected]=await fixture.database().query<{geoJson:string}>(`SELECT ST_AsGeoJSON(ST_Transform(geometria,31983),17,0) AS "geoJson" FROM areas_municipais WHERE id=$1`,[areaId]);
      const geoJson=projected!.geoJson;const projectedArtifact=syntheticArtifact({sourceSrid:31983,geoJson,sha256:createHash('sha256').update(geoJson).digest('hex')});
      const id=await stageMunicipalArea(staged,projectedArtifact);
      const [row]=await fixture.database().query<{srid:number;within:boolean;original:number}>(`SELECT ST_SRID(geometria) AS srid,srid_origem AS original,
        ST_XMin(Box3D(geometria))>=-180 AND ST_XMax(Box3D(geometria))<=180 AND ST_YMin(Box3D(geometria))>=-90 AND ST_YMax(Box3D(geometria))<=90 AS within
        FROM areas_municipais WHERE id=$1`,[id]);expect(row).toEqual({srid:4326,original:31983,within:true});
      expect(await fixture.database().query('SELECT id FROM areas_municipais WHERE id=$1',[areaId])).toHaveLength(1);
    });
    it('fonte versionada do banco alimenta P12 e PostGIS cobre interior/fronteira/exterior',async()=>{
      const source=createMunicipalAreaRepository(fixture.database()).experimentalSource('test',areaId);const loaded=(await source.load())!;const vertex=JSON.parse(loaded.geoJson).coordinates[0][0][0] as number[];
      const reader=createOccurrenceReadRepository(fixture.database());expect(await reader.covers(loaded.geoJson,-23.55,-46.65)).toEqual({valid:true,inside:true});expect(await reader.covers(loaded.geoJson,vertex[1]!,vertex[0]!)).toEqual({valid:true,inside:true});expect(await reader.covers(loaded.geoJson,0,0)).toEqual({valid:true,inside:false});
      const [legacy]=await fixture.database().query<{id:string}>("SELECT id FROM ocorrencias WHERE titulo='Legacy P11 upgrade'");expect((await app.app.inject({method:'GET',url:'/api/v1/occurrences/'+legacy!.id,headers:{cookie}})).statusCode).toBe(200);
    });
    it('geography usa metros e limites inclusivos de 100 m e 3000 m',async()=>{
      const probe:{threshold:number;bearing:number;measuredDistance:number;within:boolean}[]=[];
      for(const threshold of [100,3000]){
        const rows=await fixture.database().query<{requested:number;bearing:number;distance:number;inside:boolean}>(`WITH p AS(SELECT ST_SetSRID(ST_MakePoint(-46.65,-23.55),4326)::geography AS g)
          SELECT n AS requested,b AS bearing,ST_Distance(g,ST_Project(g,n,b)) AS distance,ST_DWithin(g,ST_Project(g,n,b),$1) AS inside
          FROM p CROSS JOIN unnest($2::double precision[]) n CROSS JOIN unnest($3::double precision[]) b ORDER BY n,b`,
        [threshold,[threshold-0.1,threshold,threshold+0.1],[0,Math.PI/4,Math.PI/2,3*Math.PI/4,Math.PI,5*Math.PI/4,3*Math.PI/2,7*Math.PI/4]]);
        expect(rows.filter((r)=>r.requested<threshold).every((r)=>r.inside)).toBe(true);expect(rows.filter((r)=>r.requested>threshold).every((r)=>!r.inside)).toBe(true);
        const boundary=rows.filter((r)=>r.requested===threshold);boundary.forEach((r)=>expect(r.distance).toBeCloseTo(threshold,5));
        // Coordinate projection has finite precision. Preserve every probe, without adding radius epsilon.
        expect(boundary.some((r)=>r.inside)).toBe(true);probe.push(...boundary.map((r)=>({threshold,bearing:r.bearing,measuredDistance:r.distance,within:r.inside})));
      }
      if(experimental)recordExperiment('p11ThresholdProbe',probe);
    });
  });
}
