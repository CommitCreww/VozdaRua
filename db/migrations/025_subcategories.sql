-- FSD 10.2 / P11. No catalog values or modes are invented for legacy categories.
ALTER TABLE categorias_ocorrencia ADD COLUMN subcategoria_modo VARCHAR(20)
    CHECK (subcategoria_modo IN ('SEM_SUBCATEGORIA','OPCIONAL','OBRIGATORIA'));

CREATE TABLE subcategorias_ocorrencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID NOT NULL REFERENCES categorias_ocorrencia(id) ON DELETE RESTRICT,
    nome VARCHAR(120) NOT NULL CHECK (BTRIM(nome) <> ''),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id,categoria_id)
);
CREATE UNIQUE INDEX ux_subcategoria_nome ON subcategorias_ocorrencia(categoria_id,LOWER(nome));
CREATE TRIGGER trg_subcategorias_updated_at BEFORE UPDATE ON subcategorias_ocorrencia
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

ALTER TABLE ocorrencias ADD COLUMN subcategoria_id UUID;
ALTER TABLE ocorrencias ADD CONSTRAINT fk_ocorrencia_subcategoria_categoria
    FOREIGN KEY (subcategoria_id,categoria_id) REFERENCES subcategorias_ocorrencia(id,categoria_id) ON DELETE RESTRICT;
CREATE INDEX idx_ocorrencias_subcategoria ON ocorrencias(subcategoria_id);

CREATE FUNCTION fn_validar_subcategoria_ocorrencia() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE mode VARCHAR(20); enabled BOOLEAN;
BEGIN
    SELECT subcategoria_modo,ativo INTO mode,enabled FROM categorias_ocorrencia WHERE id=NEW.categoria_id FOR SHARE;
    IF enabled IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Invalid category selection' USING ERRCODE='23514'; END IF;
    IF mode IS NULL THEN RAISE EXCEPTION 'Category configuration pending' USING ERRCODE='23514'; END IF;
    IF (mode='SEM_SUBCATEGORIA' AND NEW.subcategoria_id IS NOT NULL)
       OR (mode='OBRIGATORIA' AND NEW.subcategoria_id IS NULL) THEN
        RAISE EXCEPTION 'Invalid subcategory selection' USING ERRCODE='23514';
    END IF;
    IF NEW.subcategoria_id IS NOT NULL THEN
        SELECT ativo INTO enabled FROM subcategorias_ocorrencia WHERE id=NEW.subcategoria_id AND categoria_id=NEW.categoria_id FOR SHARE;
        IF enabled IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Invalid subcategory selection' USING ERRCODE='23514'; END IF;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_ocorrencia_subcategoria BEFORE INSERT OR UPDATE OF categoria_id,subcategoria_id ON ocorrencias
    FOR EACH ROW EXECUTE FUNCTION fn_validar_subcategoria_ocorrencia();

CREATE FUNCTION fn_validar_modo_subcategoria() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF (NEW.subcategoria_modo='SEM_SUBCATEGORIA' AND EXISTS(SELECT 1 FROM ocorrencias WHERE categoria_id=NEW.id AND subcategoria_id IS NOT NULL))
       OR (NEW.subcategoria_modo='OBRIGATORIA' AND EXISTS(SELECT 1 FROM ocorrencias WHERE categoria_id=NEW.id AND subcategoria_id IS NULL)) THEN
        RAISE EXCEPTION 'Category mode conflicts with existing occurrences' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_categoria_subcategoria_modo BEFORE UPDATE OF subcategoria_modo ON categorias_ocorrencia
    FOR EACH ROW EXECUTE FUNCTION fn_validar_modo_subcategoria();

INSERT INTO parametros_sistema(chave,valor,descricao)
    VALUES('ocorrencia.duplicidade_raio_metros','100'::jsonb,'Raio de sugestao de duplicidade, em metros (FSD 10.9).')
    ON CONFLICT(chave) DO NOTHING;
