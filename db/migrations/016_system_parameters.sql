-- Voz da Rua
-- 016_system_parameters.sql
-- Parâmetros de negócio configuráveis.

CREATE TABLE parametros_sistema (
    chave VARCHAR(120) PRIMARY KEY,
    valor JSONB NOT NULL,
    descricao TEXT,

    atualizado_por_usuario_id UUID
        REFERENCES usuarios(id) ON DELETE SET NULL,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_parametros_sistema_chave
        CHECK (BTRIM(chave) <> '')
);

CREATE TRIGGER trg_parametros_sistema_updated_at
BEFORE UPDATE ON parametros_sistema
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();


INSERT INTO parametros_sistema (chave, valor, descricao)
VALUES
    (
        'ocorrencia.distancia_maxima_metros',
        '3000'::jsonb,
        'Distância máxima permitida entre a localização atual do usuário e a ocorrência.'
    ),
    (
        'moderacao.alerta_relatos',
        '10'::jsonb,
        'Quantidade de relatos únicos a partir da qual uma ocorrência recebe alerta de prioridade.'
    ),
    (
        'ocorrencia.janela_edicao_horas',
        '12'::jsonb,
        'Janela máxima para o autor editar ou excluir antes da validação.'
    ),
    (
        'ocorrencia.resolucao_comunitaria_minimo',
        '10001'::jsonb,
        'Quantidade mínima de confirmações únicas para resolução comunitária automática.'
    ),
    (
        'ocorrencia.reabertura_alerta_minimo',
        '1000'::jsonb,
        'Quantidade de sinalizações únicas necessárias para gerar alerta emergencial de reabertura.'
    ),
    (
        'plataforma.cidade',
        to_jsonb('São Paulo'::text),
        'Município inicialmente atendido pela plataforma.'
    ),
    (
        'plataforma.estado',
        to_jsonb('SP'::text),
        'UF inicialmente atendida pela plataforma.'
    ),
    (
        'plataforma.locale',
        to_jsonb('pt-BR'::text),
        'Idioma/locale inicial da plataforma.'
    )
ON CONFLICT (chave) DO NOTHING;
