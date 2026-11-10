-- Voz da Rua
-- 013_social.sql
-- Feed social, comentários, curtidas e seguidores.

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,

    ocorrencia_id UUID
        REFERENCES ocorrencias(id) ON DELETE SET NULL,

    conteudo TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLICADO',

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_em TIMESTAMPTZ,
    removido_em TIMESTAMPTZ,

    CONSTRAINT ck_posts_conteudo
        CHECK (BTRIM(conteudo) <> ''),

    CONSTRAINT ck_posts_status
        CHECK (status IN ('PUBLICADO', 'OCULTO', 'REMOVIDO')),

    CONSTRAINT ck_posts_editado_em
        CHECK (editado_em IS NULL OR editado_em >= criado_em),

    CONSTRAINT ck_posts_removido_em
        CHECK (removido_em IS NULL OR removido_em >= criado_em)
);

CREATE INDEX idx_posts_usuario
    ON posts (usuario_id, criado_em DESC);

CREATE INDEX idx_posts_ocorrencia
    ON posts (ocorrencia_id, criado_em DESC);

CREATE INDEX idx_posts_feed
    ON posts (criado_em DESC)
    WHERE status = 'PUBLICADO' AND removido_em IS NULL;


CREATE TABLE comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id UUID NOT NULL
        REFERENCES posts(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,

    conteudo TEXT NOT NULL,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_em TIMESTAMPTZ,
    excluido_em TIMESTAMPTZ,

    CONSTRAINT ck_comentarios_conteudo
        CHECK (BTRIM(conteudo) <> ''),

    CONSTRAINT ck_comentarios_editado_em
        CHECK (editado_em IS NULL OR editado_em >= criado_em),

    CONSTRAINT ck_comentarios_excluido_em
        CHECK (excluido_em IS NULL OR excluido_em >= criado_em)
);

CREATE INDEX idx_comentarios_post
    ON comentarios (post_id, criado_em);

CREATE INDEX idx_comentarios_usuario
    ON comentarios (usuario_id, criado_em DESC);


CREATE TABLE curtidas_posts (
    post_id UUID NOT NULL
        REFERENCES posts(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (post_id, usuario_id)
);

CREATE INDEX idx_curtidas_posts_usuario
    ON curtidas_posts (usuario_id, criado_em DESC);


CREATE TABLE seguidores (
    seguidor_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,

    seguido_id UUID NOT NULL
        REFERENCES usuarios(id) ON DELETE CASCADE,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (seguidor_id, seguido_id),

    CONSTRAINT ck_seguidores_nao_seguir_si_mesmo
        CHECK (seguidor_id <> seguido_id)
);

CREATE INDEX idx_seguidores_seguido
    ON seguidores (seguido_id, criado_em DESC);
