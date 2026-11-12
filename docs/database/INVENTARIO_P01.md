# Inventario fisico observado - P01

Capturado em 12/11/2026 no projeto Docker isolado `voz-da-rua-p01`. Apenas metadados, sem linhas de usuarios ou credenciais. Este inventario e evidencia; as migrations continuam sendo a fonte de verdade.

PostgreSQL: **17.11 (Debian 17.11-1.pgdg13+2)**; PostGIS: **3.6.4**.

Foram observadas **27 tabelas** pertencentes ao migrator (incluindo `schema_migrations` e `project_metadata`) e duas views da aplicacao. `spatial_ref_sys` e views internas de PostGIS sao geridas pela extensao e nao entram nesta contagem.

## `acoes_moderacao`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `ocorrencia_id` | `uuid` | sim |
| `moderador_id` | `uuid` | nao |
| `tipo` | `character varying(40)` | sim |
| `justificativa` | `text` | nao |
| `dados_antes` | `jsonb` | nao |
| `dados_depois` | `jsonb` | nao |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `acoes_moderacao_moderador_id_fkey`: `FOREIGN KEY (moderador_id) REFERENCES usuarios(id) ON DELETE SET NULL`
- `acoes_moderacao_ocorrencia_id_fkey`: `FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE CASCADE`
- `acoes_moderacao_pkey`: `PRIMARY KEY (id)`
- `ck_acoes_moderacao_tipo`: `CHECK (((tipo)::text = ANY ((ARRAY['VALIDAR'::character varying, 'REJEITAR'::character varying, 'MARCAR_DUPLICADA'::character varying, 'EDITAR'::character varying, 'DEFINIR_FOTO_PUBLICA'::character varying, 'REMOVER_PIN'::character varying, 'RESOLVER'::character varying, 'REABRIR'::character varying, 'ARQUIVAR'::character varying, 'RESTAURAR'::character varying])::text[])))`

Indices observados:

- `CREATE UNIQUE INDEX acoes_moderacao_pkey ON public.acoes_moderacao USING btree (id)`
- `CREATE INDEX idx_acoes_moderacao_ocorrencia ON public.acoes_moderacao USING btree (ocorrencia_id, criado_em DESC)`
- `CREATE INDEX idx_acoes_moderacao_moderador ON public.acoes_moderacao USING btree (moderador_id, criado_em DESC)`

## `alertas_moderacao`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `ocorrencia_id` | `uuid` | sim |
| `ciclo_id` | `uuid` | nao |
| `tipo` | `character varying(40)` | sim |
| `prioridade` | `character varying(20)` | sim |
| `status` | `character varying(20)` | sim |
| `contador_referencia` | `integer` | nao |
| `chave_deduplicacao` | `character varying(255)` | sim |
| `criado_em` | `timestamp with time zone` | sim |
| `visualizado_em` | `timestamp with time zone` | nao |
| `resolvido_em` | `timestamp with time zone` | nao |
| `resolvido_por_usuario_id` | `uuid` | nao |

Constraints observadas:

- `alertas_moderacao_ciclo_id_fkey`: `FOREIGN KEY (ciclo_id) REFERENCES ocorrencia_ciclos(id) ON DELETE CASCADE`
- `alertas_moderacao_ocorrencia_id_fkey`: `FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE CASCADE`
- `alertas_moderacao_pkey`: `PRIMARY KEY (id)`
- `alertas_moderacao_resolvido_por_usuario_id_fkey`: `FOREIGN KEY (resolvido_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL`
- `ck_alertas_moderacao_contador`: `CHECK (((contador_referencia IS NULL) OR (contador_referencia >= 0)))`
- `ck_alertas_moderacao_prioridade`: `CHECK (((prioridade)::text = ANY ((ARRAY['NORMAL'::character varying, 'ALTA'::character varying, 'EMERGENCIAL'::character varying])::text[])))`
- `ck_alertas_moderacao_status`: `CHECK (((status)::text = ANY ((ARRAY['PENDENTE'::character varying, 'VISUALIZADO'::character varying, 'RESOLVIDO'::character varying])::text[])))`
- `ck_alertas_moderacao_tipo`: `CHECK (((tipo)::text = ANY ((ARRAY['RELATOS_PRIORITARIOS'::character varying, 'REABERTURA_EMERGENCIAL'::character varying, 'DENUNCIA_OCORRENCIA'::character varying, 'OUTRO'::character varying])::text[])))`

Indices observados:

- `CREATE UNIQUE INDEX alertas_moderacao_pkey ON public.alertas_moderacao USING btree (id)`
- `CREATE UNIQUE INDEX ux_alertas_moderacao_chave ON public.alertas_moderacao USING btree (chave_deduplicacao)`
- `CREATE INDEX idx_alertas_moderacao_fila ON public.alertas_moderacao USING btree (status, prioridade, criado_em)`
- `CREATE INDEX idx_alertas_moderacao_ocorrencia ON public.alertas_moderacao USING btree (ocorrencia_id)`

## `canais_denuncia`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `orgao_id` | `uuid` | sim |
| `nome` | `character varying(180)` | sim |
| `tipo` | `character varying(30)` | sim |
| `url` | `character varying(1000)` | nao |
| `telefone` | `character varying(40)` | nao |
| `email` | `character varying(255)` | nao |
| `instrucoes` | `text` | nao |
| `requer_login_govbr` | `boolean` | sim |
| `ativo` | `boolean` | sim |
| `criado_em` | `timestamp with time zone` | sim |
| `atualizado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `canais_denuncia_orgao_id_fkey`: `FOREIGN KEY (orgao_id) REFERENCES orgaos_responsaveis(id) ON DELETE CASCADE`
- `canais_denuncia_pkey`: `PRIMARY KEY (id)`
- `ck_canais_denuncia_nome`: `CHECK ((btrim((nome)::text) <> ''::text))`
- `ck_canais_denuncia_tipo`: `CHECK (((tipo)::text = ANY ((ARRAY['SITE'::character varying, 'FORMULARIO'::character varying, 'EMAIL'::character varying, 'TELEFONE'::character varying, 'APP'::character varying, 'OUTRO'::character varying])::text[])))`

Indices observados:

- `CREATE UNIQUE INDEX canais_denuncia_pkey ON public.canais_denuncia USING btree (id)`
- `CREATE INDEX idx_canais_denuncia_orgao ON public.canais_denuncia USING btree (orgao_id)`
- `CREATE INDEX idx_canais_denuncia_ativo ON public.canais_denuncia USING btree (ativo)`

## `categoria_canais`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `categoria_id` | `uuid` | sim |
| `canal_id` | `uuid` | sim |
| `principal` | `boolean` | sim |
| `prioridade` | `integer` | sim |
| `instrucoes_especificas` | `text` | nao |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `categoria_canais_canal_id_fkey`: `FOREIGN KEY (canal_id) REFERENCES canais_denuncia(id) ON DELETE CASCADE`
- `categoria_canais_categoria_id_fkey`: `FOREIGN KEY (categoria_id) REFERENCES categorias_ocorrencia(id) ON DELETE CASCADE`
- `categoria_canais_pkey`: `PRIMARY KEY (categoria_id, canal_id)`
- `ck_categoria_canais_prioridade`: `CHECK ((prioridade >= 0))`

Indices observados:

- `CREATE UNIQUE INDEX categoria_canais_pkey ON public.categoria_canais USING btree (categoria_id, canal_id)`
- `CREATE UNIQUE INDEX ux_categoria_canal_principal ON public.categoria_canais USING btree (categoria_id) WHERE (principal = true)`
- `CREATE INDEX idx_categoria_canais_canal ON public.categoria_canais USING btree (canal_id)`

## `categorias_ocorrencia`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `slug` | `character varying(80)` | sim |
| `nome` | `character varying(120)` | sim |
| `descricao` | `text` | nao |
| `tipo_ambiente` | `character varying(20)` | sim |
| `icone` | `character varying(100)` | nao |
| `ativo` | `boolean` | sim |
| `criado_em` | `timestamp with time zone` | sim |
| `atualizado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `categorias_ocorrencia_pkey`: `PRIMARY KEY (id)`
- `ck_categorias_nome_nao_vazio`: `CHECK ((btrim((nome)::text) <> ''::text))`
- `ck_categorias_slug_nao_vazio`: `CHECK ((btrim((slug)::text) <> ''::text))`
- `ck_categorias_tipo_ambiente`: `CHECK (((tipo_ambiente)::text = ANY ((ARRAY['PUBLICO'::character varying, 'PRIVADO'::character varying, 'AMBOS'::character varying])::text[])))`

Indices observados:

- `CREATE UNIQUE INDEX categorias_ocorrencia_pkey ON public.categorias_ocorrencia USING btree (id)`
- `CREATE UNIQUE INDEX ux_categorias_slug ON public.categorias_ocorrencia USING btree (slug)`
- `CREATE UNIQUE INDEX ux_categorias_nome_lower ON public.categorias_ocorrencia USING btree (lower((nome)::text))`
- `CREATE INDEX idx_categorias_ativo ON public.categorias_ocorrencia USING btree (ativo)`

## `comentarios`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `post_id` | `uuid` | sim |
| `usuario_id` | `uuid` | sim |
| `conteudo` | `text` | sim |
| `criado_em` | `timestamp with time zone` | sim |
| `editado_em` | `timestamp with time zone` | nao |
| `excluido_em` | `timestamp with time zone` | nao |

Constraints observadas:

- `ck_comentarios_conteudo`: `CHECK ((btrim(conteudo) <> ''::text))`
- `ck_comentarios_editado_em`: `CHECK (((editado_em IS NULL) OR (editado_em >= criado_em)))`
- `ck_comentarios_excluido_em`: `CHECK (((excluido_em IS NULL) OR (excluido_em >= criado_em)))`
- `comentarios_pkey`: `PRIMARY KEY (id)`
- `comentarios_post_id_fkey`: `FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE`
- `comentarios_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE`

Indices observados:

- `CREATE UNIQUE INDEX comentarios_pkey ON public.comentarios USING btree (id)`
- `CREATE INDEX idx_comentarios_post ON public.comentarios USING btree (post_id, criado_em)`
- `CREATE INDEX idx_comentarios_usuario ON public.comentarios USING btree (usuario_id, criado_em DESC)`

## `curtidas_posts`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `post_id` | `uuid` | sim |
| `usuario_id` | `uuid` | sim |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `curtidas_posts_pkey`: `PRIMARY KEY (post_id, usuario_id)`
- `curtidas_posts_post_id_fkey`: `FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE`
- `curtidas_posts_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE`

Indices observados:

- `CREATE UNIQUE INDEX curtidas_posts_pkey ON public.curtidas_posts USING btree (post_id, usuario_id)`
- `CREATE INDEX idx_curtidas_posts_usuario ON public.curtidas_posts USING btree (usuario_id, criado_em DESC)`

## `denuncias_ocorrencia`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `ocorrencia_id` | `uuid` | sim |
| `usuario_id` | `uuid` | sim |
| `motivo` | `character varying(40)` | sim |
| `comentario` | `text` | nao |
| `status` | `character varying(20)` | sim |
| `analisada_por_usuario_id` | `uuid` | nao |
| `analisada_em` | `timestamp with time zone` | nao |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_denuncias_ocorrencia_analise`: `CHECK ((((analisada_em IS NULL) AND (analisada_por_usuario_id IS NULL)) OR ((analisada_em IS NOT NULL) AND (analisada_por_usuario_id IS NOT NULL))))`
- `ck_denuncias_ocorrencia_motivo`: `CHECK (((motivo)::text = ANY ((ARRAY['NAO_EXISTE'::character varying, 'JA_RESOLVIDO'::character varying, 'LOCALIZACAO_INCORRETA'::character varying, 'CONTEUDO_OFENSIVO'::character varying, 'IMAGEM_INADEQUADA'::character varying, 'DUPLICADA'::character varying, 'OUTRO'::character varying])::text[])))`
- `ck_denuncias_ocorrencia_status`: `CHECK (((status)::text = ANY ((ARRAY['PENDENTE'::character varying, 'PROCEDENTE'::character varying, 'IMPROCEDENTE'::character varying, 'ARQUIVADA'::character varying])::text[])))`
- `denuncias_ocorrencia_analisada_por_usuario_id_fkey`: `FOREIGN KEY (analisada_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL`
- `denuncias_ocorrencia_ocorrencia_id_fkey`: `FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE CASCADE`
- `denuncias_ocorrencia_pkey`: `PRIMARY KEY (id)`
- `denuncias_ocorrencia_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT`

Indices observados:

- `CREATE UNIQUE INDEX denuncias_ocorrencia_pkey ON public.denuncias_ocorrencia USING btree (id)`
- `CREATE UNIQUE INDEX ux_denuncia_pendente_usuario_ocorrencia ON public.denuncias_ocorrencia USING btree (usuario_id, ocorrencia_id) WHERE ((status)::text = 'PENDENTE'::text)`
- `CREATE INDEX idx_denuncias_ocorrencia_status ON public.denuncias_ocorrencia USING btree (status, criado_em)`
- `CREATE INDEX idx_denuncias_ocorrencia_ocorrencia ON public.denuncias_ocorrencia USING btree (ocorrencia_id)`

## `evidencias`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `ocorrencia_id` | `uuid` | sim |
| `relato_id` | `uuid` | sim |
| `enviado_por_usuario_id` | `uuid` | nao |
| `tipo` | `character varying(20)` | sim |
| `storage_provider` | `character varying(40)` | nao |
| `arquivo_chave` | `text` | sim |
| `mime_type` | `character varying(100)` | sim |
| `tamanho_bytes` | `bigint` | nao |
| `sha256` | `character(64)` | nao |
| `largura_px` | `integer` | nao |
| `altura_px` | `integer` | nao |
| `publica_no_pin` | `boolean` | sim |
| `aprovada_por_usuario_id` | `uuid` | nao |
| `aprovada_em` | `timestamp with time zone` | nao |
| `criada_em` | `timestamp with time zone` | sim |
| `excluida_em` | `timestamp with time zone` | nao |

Constraints observadas:

- `ck_evidencias_aprovacao`: `CHECK ((((aprovada_em IS NULL) AND (aprovada_por_usuario_id IS NULL)) OR ((aprovada_em IS NOT NULL) AND (aprovada_por_usuario_id IS NOT NULL))))`
- `ck_evidencias_arquivo_chave`: `CHECK ((btrim(arquivo_chave) <> ''::text))`
- `ck_evidencias_dimensoes`: `CHECK ((((largura_px IS NULL) OR (largura_px > 0)) AND ((altura_px IS NULL) OR (altura_px > 0))))`
- `ck_evidencias_tamanho`: `CHECK (((tamanho_bytes IS NULL) OR (tamanho_bytes > 0)))`
- `ck_evidencias_tipo`: `CHECK (((tipo)::text = 'FOTO'::text))`
- `evidencias_aprovada_por_usuario_id_fkey`: `FOREIGN KEY (aprovada_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL`
- `evidencias_enviado_por_usuario_id_fkey`: `FOREIGN KEY (enviado_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL`
- `evidencias_pkey`: `PRIMARY KEY (id)`
- `fk_evidencias_relato_ocorrencia`: `FOREIGN KEY (relato_id, ocorrencia_id) REFERENCES relatos(id, ocorrencia_id) ON DELETE CASCADE`

Indices observados:

- `CREATE UNIQUE INDEX evidencias_pkey ON public.evidencias USING btree (id)`
- `CREATE UNIQUE INDEX ux_evidencias_uma_foto_ativa_por_relato ON public.evidencias USING btree (relato_id) WHERE (excluida_em IS NULL)`
- `CREATE UNIQUE INDEX ux_evidencias_uma_publica_por_ocorrencia ON public.evidencias USING btree (ocorrencia_id) WHERE ((publica_no_pin = true) AND (excluida_em IS NULL))`
- `CREATE INDEX idx_evidencias_ocorrencia ON public.evidencias USING btree (ocorrencia_id)`
- `CREATE INDEX idx_evidencias_relato ON public.evidencias USING btree (relato_id)`

## `historico_status`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `ocorrencia_id` | `uuid` | sim |
| `status_anterior_id` | `uuid` | nao |
| `status_novo_id` | `uuid` | sim |
| `usuario_id` | `uuid` | nao |
| `origem` | `character varying(20)` | sim |
| `observacao` | `text` | nao |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_historico_status_origem`: `CHECK (((origem)::text = ANY ((ARRAY['SISTEMA'::character varying, 'USUARIO'::character varying, 'MODERADOR'::character varying, 'ADMIN'::character varying])::text[])))`
- `historico_status_ocorrencia_id_fkey`: `FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE CASCADE`
- `historico_status_pkey`: `PRIMARY KEY (id)`
- `historico_status_status_anterior_id_fkey`: `FOREIGN KEY (status_anterior_id) REFERENCES status_ocorrencia(id) ON DELETE RESTRICT`
- `historico_status_status_novo_id_fkey`: `FOREIGN KEY (status_novo_id) REFERENCES status_ocorrencia(id) ON DELETE RESTRICT`
- `historico_status_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL`

Indices observados:

- `CREATE UNIQUE INDEX historico_status_pkey ON public.historico_status USING btree (id)`
- `CREATE INDEX idx_historico_status_ocorrencia ON public.historico_status USING btree (ocorrencia_id, criado_em DESC)`
- `CREATE INDEX idx_historico_status_status_novo ON public.historico_status USING btree (status_novo_id)`

## `identidades_auth`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `usuario_id` | `uuid` | sim |
| `provedor` | `character varying(40)` | sim |
| `subject_externo` | `character varying(255)` | sim |
| `email_provedor` | `character varying(255)` | nao |
| `criado_em` | `timestamp with time zone` | sim |
| `ultimo_login_em` | `timestamp with time zone` | nao |

Constraints observadas:

- `ck_identidades_auth_provedor`: `CHECK (((provedor)::text = ANY ((ARRAY['GOOGLE'::character varying, 'GITHUB'::character varying, 'OIDC'::character varying])::text[])))`
- `identidades_auth_pkey`: `PRIMARY KEY (id)`
- `identidades_auth_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE`

Indices observados:

- `CREATE UNIQUE INDEX identidades_auth_pkey ON public.identidades_auth USING btree (id)`
- `CREATE UNIQUE INDEX ux_identidades_auth_provedor_subject ON public.identidades_auth USING btree (provedor, subject_externo)`
- `CREATE UNIQUE INDEX ux_identidades_auth_usuario_provedor ON public.identidades_auth USING btree (usuario_id, provedor)`
- `CREATE INDEX idx_identidades_auth_usuario ON public.identidades_auth USING btree (usuario_id)`

## `logs_auditoria`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `usuario_id` | `uuid` | nao |
| `papel_ator` | `character varying(20)` | nao |
| `acao` | `character varying(100)` | sim |
| `entidade` | `character varying(100)` | sim |
| `entidade_id` | `uuid` | nao |
| `dados` | `jsonb` | nao |
| `request_id` | `character varying(100)` | nao |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_logs_auditoria_acao`: `CHECK ((btrim((acao)::text) <> ''::text))`
- `ck_logs_auditoria_entidade`: `CHECK ((btrim((entidade)::text) <> ''::text))`
- `ck_logs_auditoria_papel`: `CHECK (((papel_ator IS NULL) OR ((papel_ator)::text = ANY ((ARRAY['CIDADAO'::character varying, 'MODERADOR'::character varying, 'ADMIN'::character varying, 'SISTEMA'::character varying])::text[]))))`
- `logs_auditoria_pkey`: `PRIMARY KEY (id)`
- `logs_auditoria_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL`

Indices observados:

- `CREATE UNIQUE INDEX logs_auditoria_pkey ON public.logs_auditoria USING btree (id)`
- `CREATE INDEX idx_logs_auditoria_usuario ON public.logs_auditoria USING btree (usuario_id, criado_em DESC)`
- `CREATE INDEX idx_logs_auditoria_entidade ON public.logs_auditoria USING btree (entidade, entidade_id, criado_em DESC)`
- `CREATE INDEX idx_logs_auditoria_criado_em ON public.logs_auditoria USING btree (criado_em DESC)`

## `notificacoes`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `usuario_id` | `uuid` | sim |
| `tipo` | `character varying(60)` | sim |
| `titulo` | `character varying(180)` | sim |
| `mensagem` | `text` | sim |
| `ocorrencia_id` | `uuid` | nao |
| `post_id` | `uuid` | nao |
| `lida_em` | `timestamp with time zone` | nao |
| `criada_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_notificacoes_mensagem`: `CHECK ((btrim(mensagem) <> ''::text))`
- `ck_notificacoes_tipo`: `CHECK ((btrim((tipo)::text) <> ''::text))`
- `ck_notificacoes_titulo`: `CHECK ((btrim((titulo)::text) <> ''::text))`
- `notificacoes_ocorrencia_id_fkey`: `FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE CASCADE`
- `notificacoes_pkey`: `PRIMARY KEY (id)`
- `notificacoes_post_id_fkey`: `FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE`
- `notificacoes_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE`

Indices observados:

- `CREATE UNIQUE INDEX notificacoes_pkey ON public.notificacoes USING btree (id)`
- `CREATE INDEX idx_notificacoes_usuario_nao_lidas ON public.notificacoes USING btree (usuario_id, criada_em DESC) WHERE (lida_em IS NULL)`
- `CREATE INDEX idx_notificacoes_usuario ON public.notificacoes USING btree (usuario_id, criada_em DESC)`

## `ocorrencia_ciclos`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `ocorrencia_id` | `uuid` | sim |
| `numero` | `integer` | sim |
| `motivo_abertura` | `character varying(40)` | sim |
| `aberto_por_usuario_id` | `uuid` | nao |
| `iniciado_em` | `timestamp with time zone` | sim |
| `encerrado_em` | `timestamp with time zone` | nao |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_ocorrencia_ciclos_datas`: `CHECK (((encerrado_em IS NULL) OR (encerrado_em >= iniciado_em)))`
- `ck_ocorrencia_ciclos_motivo`: `CHECK (((motivo_abertura)::text = ANY ((ARRAY['INICIAL'::character varying, 'REABERTURA_MODERACAO'::character varying, 'REABERTURA_COMUNIDADE'::character varying])::text[])))`
- `ck_ocorrencia_ciclos_numero`: `CHECK ((numero > 0))`
- `ocorrencia_ciclos_aberto_por_usuario_id_fkey`: `FOREIGN KEY (aberto_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL`
- `ocorrencia_ciclos_ocorrencia_id_fkey`: `FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE CASCADE`
- `ocorrencia_ciclos_pkey`: `PRIMARY KEY (id)`
- `ux_ocorrencia_ciclos_id_ocorrencia`: `UNIQUE (id, ocorrencia_id)`
- `ux_ocorrencia_ciclos_ocorrencia_numero`: `UNIQUE (ocorrencia_id, numero)`

Indices observados:

- `CREATE UNIQUE INDEX ocorrencia_ciclos_pkey ON public.ocorrencia_ciclos USING btree (id)`
- `CREATE UNIQUE INDEX ux_ocorrencia_ciclos_ocorrencia_numero ON public.ocorrencia_ciclos USING btree (ocorrencia_id, numero)`
- `CREATE UNIQUE INDEX ux_ocorrencia_ciclos_id_ocorrencia ON public.ocorrencia_ciclos USING btree (id, ocorrencia_id)`
- `CREATE UNIQUE INDEX ux_ocorrencia_um_ciclo_aberto ON public.ocorrencia_ciclos USING btree (ocorrencia_id) WHERE (encerrado_em IS NULL)`
- `CREATE INDEX idx_ocorrencia_ciclos_ocorrencia ON public.ocorrencia_ciclos USING btree (ocorrencia_id)`
- `CREATE INDEX idx_ocorrencia_ciclos_iniciado_em ON public.ocorrencia_ciclos USING btree (iniciado_em DESC)`

## `ocorrencias`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `categoria_id` | `uuid` | sim |
| `status_id` | `uuid` | sim |
| `criado_por_usuario_id` | `uuid` | nao |
| `titulo` | `character varying(160)` | sim |
| `descricao` | `text` | sim |
| `localizacao` | `geography(Point,4326)` | sim |
| `endereco` | `character varying(255)` | nao |
| `numero` | `character varying(30)` | nao |
| `bairro` | `character varying(120)` | nao |
| `cep` | `character varying(10)` | nao |
| `cidade` | `character varying(100)` | sim |
| `estado` | `character(2)` | sim |
| `validada_em` | `timestamp with time zone` | nao |
| `resolvida_em` | `timestamp with time zone` | nao |
| `arquivada_em` | `timestamp with time zone` | nao |
| `criado_em` | `timestamp with time zone` | sim |
| `atualizado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_ocorrencias_cidade`: `CHECK (((cidade)::text = 'São Paulo'::text))`
- `ck_ocorrencias_descricao_nao_vazia`: `CHECK ((btrim(descricao) <> ''::text))`
- `ck_ocorrencias_estado`: `CHECK ((estado = 'SP'::bpchar))`
- `ck_ocorrencias_titulo_nao_vazio`: `CHECK ((btrim((titulo)::text) <> ''::text))`
- `ocorrencias_categoria_id_fkey`: `FOREIGN KEY (categoria_id) REFERENCES categorias_ocorrencia(id) ON DELETE RESTRICT`
- `ocorrencias_criado_por_usuario_id_fkey`: `FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL`
- `ocorrencias_pkey`: `PRIMARY KEY (id)`
- `ocorrencias_status_id_fkey`: `FOREIGN KEY (status_id) REFERENCES status_ocorrencia(id) ON DELETE RESTRICT`

Indices observados:

- `CREATE UNIQUE INDEX ocorrencias_pkey ON public.ocorrencias USING btree (id)`
- `CREATE INDEX idx_ocorrencias_categoria ON public.ocorrencias USING btree (categoria_id)`
- `CREATE INDEX idx_ocorrencias_status ON public.ocorrencias USING btree (status_id)`
- `CREATE INDEX idx_ocorrencias_criado_por ON public.ocorrencias USING btree (criado_por_usuario_id)`
- `CREATE INDEX idx_ocorrencias_criado_em ON public.ocorrencias USING btree (criado_em DESC)`
- `CREATE INDEX idx_ocorrencias_bairro ON public.ocorrencias USING btree (bairro)`
- `CREATE INDEX idx_ocorrencias_localizacao ON public.ocorrencias USING gist (localizacao)`

## `ocorrencias_duplicadas`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `ocorrencia_duplicada_id` | `uuid` | sim |
| `ocorrencia_principal_id` | `uuid` | sim |
| `definido_por_usuario_id` | `uuid` | nao |
| `justificativa` | `text` | nao |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_ocorrencias_duplicadas_diferentes`: `CHECK ((ocorrencia_duplicada_id <> ocorrencia_principal_id))`
- `ocorrencias_duplicadas_definido_por_usuario_id_fkey`: `FOREIGN KEY (definido_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL`
- `ocorrencias_duplicadas_ocorrencia_duplicada_id_fkey`: `FOREIGN KEY (ocorrencia_duplicada_id) REFERENCES ocorrencias(id) ON DELETE CASCADE`
- `ocorrencias_duplicadas_ocorrencia_principal_id_fkey`: `FOREIGN KEY (ocorrencia_principal_id) REFERENCES ocorrencias(id) ON DELETE RESTRICT`
- `ocorrencias_duplicadas_pkey`: `PRIMARY KEY (ocorrencia_duplicada_id)`

Indices observados:

- `CREATE UNIQUE INDEX ocorrencias_duplicadas_pkey ON public.ocorrencias_duplicadas USING btree (ocorrencia_duplicada_id)`
- `CREATE INDEX idx_ocorrencias_duplicadas_principal ON public.ocorrencias_duplicadas USING btree (ocorrencia_principal_id)`

## `orgaos_responsaveis`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `nome` | `character varying(180)` | sim |
| `tipo` | `character varying(20)` | sim |
| `descricao` | `text` | nao |
| `site` | `character varying(500)` | nao |
| `telefone` | `character varying(40)` | nao |
| `email` | `character varying(255)` | nao |
| `cidade` | `character varying(100)` | nao |
| `estado` | `character(2)` | nao |
| `ativo` | `boolean` | sim |
| `criado_em` | `timestamp with time zone` | sim |
| `atualizado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_orgaos_responsaveis_nome`: `CHECK ((btrim((nome)::text) <> ''::text))`
- `ck_orgaos_responsaveis_tipo`: `CHECK (((tipo)::text = ANY ((ARRAY['PUBLICO'::character varying, 'PRIVADO'::character varying, 'OUTRO'::character varying])::text[])))`
- `orgaos_responsaveis_pkey`: `PRIMARY KEY (id)`

Indices observados:

- `CREATE UNIQUE INDEX orgaos_responsaveis_pkey ON public.orgaos_responsaveis USING btree (id)`
- `CREATE INDEX idx_orgaos_responsaveis_nome ON public.orgaos_responsaveis USING btree (nome)`
- `CREATE INDEX idx_orgaos_responsaveis_ativo ON public.orgaos_responsaveis USING btree (ativo)`

## `parametros_sistema`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `chave` | `character varying(120)` | sim |
| `valor` | `jsonb` | sim |
| `descricao` | `text` | nao |
| `atualizado_por_usuario_id` | `uuid` | nao |
| `criado_em` | `timestamp with time zone` | sim |
| `atualizado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_parametros_sistema_chave`: `CHECK ((btrim((chave)::text) <> ''::text))`
- `parametros_sistema_atualizado_por_usuario_id_fkey`: `FOREIGN KEY (atualizado_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL`
- `parametros_sistema_pkey`: `PRIMARY KEY (chave)`

Indices observados:

- `CREATE UNIQUE INDEX parametros_sistema_pkey ON public.parametros_sistema USING btree (chave)`

## `posts`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `usuario_id` | `uuid` | sim |
| `ocorrencia_id` | `uuid` | nao |
| `conteudo` | `text` | sim |
| `status` | `character varying(20)` | sim |
| `criado_em` | `timestamp with time zone` | sim |
| `editado_em` | `timestamp with time zone` | nao |
| `removido_em` | `timestamp with time zone` | nao |

Constraints observadas:

- `ck_posts_conteudo`: `CHECK ((btrim(conteudo) <> ''::text))`
- `ck_posts_editado_em`: `CHECK (((editado_em IS NULL) OR (editado_em >= criado_em)))`
- `ck_posts_removido_em`: `CHECK (((removido_em IS NULL) OR (removido_em >= criado_em)))`
- `ck_posts_status`: `CHECK (((status)::text = ANY ((ARRAY['PUBLICADO'::character varying, 'OCULTO'::character varying, 'REMOVIDO'::character varying])::text[])))`
- `posts_ocorrencia_id_fkey`: `FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE SET NULL`
- `posts_pkey`: `PRIMARY KEY (id)`
- `posts_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE`

Indices observados:

- `CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id)`
- `CREATE INDEX idx_posts_usuario ON public.posts USING btree (usuario_id, criado_em DESC)`
- `CREATE INDEX idx_posts_ocorrencia ON public.posts USING btree (ocorrencia_id, criado_em DESC)`
- `CREATE INDEX idx_posts_feed ON public.posts USING btree (criado_em DESC) WHERE (((status)::text = 'PUBLICADO'::text) AND (removido_em IS NULL))`

## `project_metadata`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `key` | `text` | sim |
| `value` | `text` | sim |
| `updated_at` | `timestamp with time zone` | sim |

Constraints observadas:

- `project_metadata_pkey`: `PRIMARY KEY (key)`

Indices observados:

- `CREATE UNIQUE INDEX project_metadata_pkey ON public.project_metadata USING btree (key)`

## `relatos`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `ocorrencia_id` | `uuid` | sim |
| `ciclo_id` | `uuid` | sim |
| `usuario_id` | `uuid` | sim |
| `tipo` | `character varying(30)` | sim |
| `texto` | `character varying(1200)` | nao |
| `proximidade_validada` | `boolean` | sim |
| `distancia_verificada_metros` | `integer` | nao |
| `criado_em` | `timestamp with time zone` | sim |
| `editado_em` | `timestamp with time zone` | nao |
| `excluido_em` | `timestamp with time zone` | nao |

Constraints observadas:

- `ck_relatos_distancia`: `CHECK (((distancia_verificada_metros IS NULL) OR (distancia_verificada_metros >= 0)))`
- `ck_relatos_edicao`: `CHECK (((editado_em IS NULL) OR (editado_em >= criado_em)))`
- `ck_relatos_exclusao`: `CHECK (((excluido_em IS NULL) OR (excluido_em >= criado_em)))`
- `ck_relatos_tipo`: `CHECK (((tipo)::text = ANY ((ARRAY['INICIAL'::character varying, 'CONFIRMACAO'::character varying, 'REABERTURA'::character varying])::text[])))`
- `fk_relatos_ciclo_ocorrencia`: `FOREIGN KEY (ciclo_id, ocorrencia_id) REFERENCES ocorrencia_ciclos(id, ocorrencia_id) ON DELETE CASCADE`
- `relatos_ocorrencia_id_fkey`: `FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE CASCADE`
- `relatos_pkey`: `PRIMARY KEY (id)`
- `relatos_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT`
- `ux_relatos_id_ocorrencia`: `UNIQUE (id, ocorrencia_id)`

Indices observados:

- `CREATE UNIQUE INDEX relatos_pkey ON public.relatos USING btree (id)`
- `CREATE UNIQUE INDEX ux_relatos_id_ocorrencia ON public.relatos USING btree (id, ocorrencia_id)`
- `CREATE UNIQUE INDEX ux_relatos_usuario_ciclo_ativo ON public.relatos USING btree (ciclo_id, usuario_id) WHERE (excluido_em IS NULL)`
- `CREATE INDEX idx_relatos_ocorrencia ON public.relatos USING btree (ocorrencia_id)`
- `CREATE INDEX idx_relatos_ciclo ON public.relatos USING btree (ciclo_id)`
- `CREATE INDEX idx_relatos_usuario ON public.relatos USING btree (usuario_id)`
- `CREATE INDEX idx_relatos_criado_em ON public.relatos USING btree (criado_em DESC)`
- `CREATE INDEX idx_relatos_ocorrencia_ativos ON public.relatos USING btree (ocorrencia_id, criado_em DESC) WHERE (excluido_em IS NULL)`

## `schema_migrations`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `filename` | `text` | sim |
| `applied_at` | `timestamp with time zone` | sim |

Constraints observadas:

- `schema_migrations_pkey`: `PRIMARY KEY (filename)`

Indices observados:

- `CREATE UNIQUE INDEX schema_migrations_pkey ON public.schema_migrations USING btree (filename)`

## `seguidores`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `seguidor_id` | `uuid` | sim |
| `seguido_id` | `uuid` | sim |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_seguidores_nao_seguir_si_mesmo`: `CHECK ((seguidor_id <> seguido_id))`
- `seguidores_pkey`: `PRIMARY KEY (seguidor_id, seguido_id)`
- `seguidores_seguido_id_fkey`: `FOREIGN KEY (seguido_id) REFERENCES usuarios(id) ON DELETE CASCADE`
- `seguidores_seguidor_id_fkey`: `FOREIGN KEY (seguidor_id) REFERENCES usuarios(id) ON DELETE CASCADE`

Indices observados:

- `CREATE UNIQUE INDEX seguidores_pkey ON public.seguidores USING btree (seguidor_id, seguido_id)`
- `CREATE INDEX idx_seguidores_seguido ON public.seguidores USING btree (seguido_id, criado_em DESC)`

## `sinalizacoes_reabertura`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `ocorrencia_id` | `uuid` | sim |
| `ciclo_resolvido_id` | `uuid` | sim |
| `usuario_id` | `uuid` | sim |
| `texto` | `character varying(1200)` | nao |
| `proximidade_validada` | `boolean` | sim |
| `distancia_verificada_metros` | `integer` | nao |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_sinalizacoes_reabertura_distancia`: `CHECK (((distancia_verificada_metros IS NULL) OR (distancia_verificada_metros >= 0)))`
- `fk_sinalizacoes_reabertura_ciclo_ocorrencia`: `FOREIGN KEY (ciclo_resolvido_id, ocorrencia_id) REFERENCES ocorrencia_ciclos(id, ocorrencia_id) ON DELETE CASCADE`
- `sinalizacoes_reabertura_ocorrencia_id_fkey`: `FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE CASCADE`
- `sinalizacoes_reabertura_pkey`: `PRIMARY KEY (id)`
- `sinalizacoes_reabertura_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT`
- `ux_sinalizacoes_reabertura_ciclo_usuario`: `UNIQUE (ciclo_resolvido_id, usuario_id)`

Indices observados:

- `CREATE UNIQUE INDEX sinalizacoes_reabertura_pkey ON public.sinalizacoes_reabertura USING btree (id)`
- `CREATE UNIQUE INDEX ux_sinalizacoes_reabertura_ciclo_usuario ON public.sinalizacoes_reabertura USING btree (ciclo_resolvido_id, usuario_id)`
- `CREATE INDEX idx_sinalizacoes_reabertura_ocorrencia ON public.sinalizacoes_reabertura USING btree (ocorrencia_id)`
- `CREATE INDEX idx_sinalizacoes_reabertura_ciclo ON public.sinalizacoes_reabertura USING btree (ciclo_resolvido_id)`

## `status_ocorrencia`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `codigo` | `character varying(40)` | sim |
| `nome` | `character varying(100)` | sim |
| `descricao` | `text` | nao |
| `exibe_no_mapa` | `boolean` | sim |
| `ativo` | `boolean` | sim |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_status_codigo_nao_vazio`: `CHECK ((btrim((codigo)::text) <> ''::text))`
- `ck_status_nome_nao_vazio`: `CHECK ((btrim((nome)::text) <> ''::text))`
- `status_ocorrencia_pkey`: `PRIMARY KEY (id)`

Indices observados:

- `CREATE UNIQUE INDEX status_ocorrencia_pkey ON public.status_ocorrencia USING btree (id)`
- `CREATE UNIQUE INDEX ux_status_ocorrencia_codigo ON public.status_ocorrencia USING btree (codigo)`
- `CREATE UNIQUE INDEX ux_status_ocorrencia_nome_lower ON public.status_ocorrencia USING btree (lower((nome)::text))`

## `usuarios`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `nome` | `character varying(120)` | sim |
| `email` | `character varying(255)` | sim |
| `senha_hash` | `character varying(255)` | nao |
| `papel` | `character varying(20)` | sim |
| `status` | `character varying(20)` | sim |
| `perfil_publico` | `boolean` | sim |
| `exibir_nome_nos_relatos` | `boolean` | sim |
| `email_verificado_em` | `timestamp with time zone` | nao |
| `ultimo_acesso_em` | `timestamp with time zone` | nao |
| `criado_em` | `timestamp with time zone` | sim |
| `atualizado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_usuarios_email_nao_vazio`: `CHECK ((btrim((email)::text) <> ''::text))`
- `ck_usuarios_nome_nao_vazio`: `CHECK ((btrim((nome)::text) <> ''::text))`
- `ck_usuarios_papel`: `CHECK (((papel)::text = ANY ((ARRAY['CIDADAO'::character varying, 'MODERADOR'::character varying, 'ADMIN'::character varying])::text[])))`
- `ck_usuarios_status`: `CHECK (((status)::text = ANY ((ARRAY['ATIVO'::character varying, 'BANIDO'::character varying])::text[])))`
- `usuarios_pkey`: `PRIMARY KEY (id)`

Indices observados:

- `CREATE UNIQUE INDEX usuarios_pkey ON public.usuarios USING btree (id)`
- `CREATE UNIQUE INDEX ux_usuarios_email_lower ON public.usuarios USING btree (lower((email)::text))`
- `CREATE INDEX idx_usuarios_papel ON public.usuarios USING btree (papel)`
- `CREATE INDEX idx_usuarios_status ON public.usuarios USING btree (status)`
- `CREATE INDEX idx_usuarios_perfil_publico ON public.usuarios USING btree (perfil_publico) WHERE (perfil_publico = true)`

## `votos_resolucao`

| Campo | Tipo fisico | NOT NULL |
|---|---|---|
| `id` | `uuid` | sim |
| `ciclo_id` | `uuid` | sim |
| `usuario_id` | `uuid` | sim |
| `proximidade_validada` | `boolean` | sim |
| `distancia_verificada_metros` | `integer` | nao |
| `criado_em` | `timestamp with time zone` | sim |

Constraints observadas:

- `ck_votos_resolucao_distancia`: `CHECK (((distancia_verificada_metros IS NULL) OR (distancia_verificada_metros >= 0)))`
- `ux_votos_resolucao_ciclo_usuario`: `UNIQUE (ciclo_id, usuario_id)`
- `votos_resolucao_ciclo_id_fkey`: `FOREIGN KEY (ciclo_id) REFERENCES ocorrencia_ciclos(id) ON DELETE CASCADE`
- `votos_resolucao_pkey`: `PRIMARY KEY (id)`
- `votos_resolucao_usuario_id_fkey`: `FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT`

Indices observados:

- `CREATE UNIQUE INDEX votos_resolucao_pkey ON public.votos_resolucao USING btree (id)`
- `CREATE UNIQUE INDEX ux_votos_resolucao_ciclo_usuario ON public.votos_resolucao USING btree (ciclo_id, usuario_id)`
- `CREATE INDEX idx_votos_resolucao_ciclo ON public.votos_resolucao USING btree (ciclo_id)`
- `CREATE INDEX idx_votos_resolucao_usuario ON public.votos_resolucao USING btree (usuario_id)`

## Views da aplicacao

- `vw_ocorrencias_resumo`
- `vw_usuarios_publicos`

A view de ocorrencias contabiliza relatos do ciclo selecionado; nao substitui o total historico DISTINCT de pessoas exigido pelo FSD. Nenhuma migration nova ou alteracao de modelo foi criada nesta P01.
