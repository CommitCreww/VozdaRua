import type { SqlExecutor } from './database.js';
import { validateOccurrencePaginationPolicy, type OccurrencePaginationPolicy, type ReadPagination } from '../schemas/occurrences.js';

export type SubcategoryMode = 'SEM_SUBCATEGORIA' | 'OPCIONAL' | 'OBRIGATORIA';
export function createOccurrenceCatalog(database: SqlExecutor, policy: OccurrencePaginationPolicy) {
  validateOccurrencePaginationPolicy(policy);
  const bounds = (paging: ReadPagination) => {
    if (!Number.isSafeInteger(paging.size) || paging.size<=0 || paging.size>policy.maxPageSize || !Number.isSafeInteger(paging.offset) || paging.offset<0 || paging.offset>policy.maxOffset) throw new Error('Invalid catalog pagination');
  };
  return {
    async categories(paging: ReadPagination) {
      bounds(paging);
      return database.query<{ id: string; slug: string; nome: string; subcategoria_modo: SubcategoryMode | null }>(
        'SELECT id,slug,nome,subcategoria_modo FROM categorias_ocorrencia WHERE ativo=TRUE ORDER BY nome,id LIMIT $1 OFFSET $2',[paging.size,paging.offset]);
    },
    async subcategories(category: string,paging: ReadPagination) {
      bounds(paging);
      return database.query<{ id: string; nome: string }>('SELECT id,nome FROM subcategorias_ocorrencia WHERE categoria_id=$1 AND ativo=TRUE ORDER BY nome,id LIMIT $2 OFFSET $3',[category,paging.size,paging.offset]);
    },
    async validateSelection(category: string, subcategory: string | null): Promise<'VALID'|'CATEGORY_INVALID'|'CONFIGURATION_PENDING'|'SUBCATEGORY_REQUIRED'|'SUBCATEGORY_FORBIDDEN'|'SUBCATEGORY_INVALID'> {
      const [row] = await database.query<{ modo: SubcategoryMode | null; active: boolean; sub_valid: boolean }>(
        `SELECT c.subcategoria_modo AS modo,c.ativo AS active,EXISTS(SELECT 1 FROM subcategorias_ocorrencia s
          WHERE s.id=$2 AND s.categoria_id=c.id AND s.ativo=TRUE) AS sub_valid FROM categorias_ocorrencia c WHERE c.id=$1`,[category,subcategory]);
      if (!row?.active) return 'CATEGORY_INVALID';
      if (!row.modo) return 'CONFIGURATION_PENDING';
      if (row.modo==='OBRIGATORIA' && !subcategory) return 'SUBCATEGORY_REQUIRED';
      if (row.modo==='SEM_SUBCATEGORIA' && subcategory) return 'SUBCATEGORY_FORBIDDEN';
      return subcategory && !row.sub_valid ? 'SUBCATEGORY_INVALID' : 'VALID';
    }
  };
}
