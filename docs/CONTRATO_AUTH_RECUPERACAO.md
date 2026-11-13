# Contrato de recuperação local — P06

Implementação incremental autorizada pela sprint de backend de 12/11/2026. Fontes: PRD 6.3, FSD 11–13.9, DT 5.6 (D03/D04). Não libera as rotas no servidor operacional nem conclui P04–P06.

| Operação | Entrada JSON fechada | Resposta |
|---|---|---|
| POST `/api/v1/auth/password/forgot` | `email`: string normalizada, até 255 caracteres | 202 `{status:"accepted"}` igualmente para conta local existente, externa ou ausente; 422 formato inválido; 429 rate gate |
| POST `/api/v1/auth/password/reset` | `token`: 43 caracteres base64url; `password`, `passwordConfirmation`: strings, política D04 | 200 `{status:"reset"}`; 422 senha inválida, divergente ou token inválido/expirado/consumido; 429 rate gate |

Ambas são públicas, independentes de papel/status e não concedem sessão. Recuperação não transforma conta externa em conta local, não confirma e-mail e não altera banimento. Identidade no reset deriva exclusivamente do hash do token; IDs, e-mail e campos administrativos adicionais são rejeitados. Cookies recebidos não autorizam nem preservam sessões: reset público revoga todas as sessões e exige novo login. Não há paginação, ordenação ou ownership por ID público. Erros seguem FSD 12; falhas inesperadas usam o handler genérico existente.

O rate gate recebe ação, origem e identidade (e-mail no forgot, hash do token no reset), nunca token bruto. Limites/cooldown persistentes continuam gate obrigatório antes de exposição. A política de senha é idêntica ao cadastro. Token de reset: CSPRNG 32 bytes, SHA-256 persistido, 30 minutos. Tokens de confirmação não servem para reset.

O repository deve consumir token PASSWORD_RESET válido, atualizar senha, invalidar os demais tokens de reset da conta e revogar todas as sessões na mesma transação; rollback integral em qualquer falha. Serializar pelo usuário e revalidar token após obter o lock, evitando dois resets simultâneos com tokens diferentes. Criação de sessão deve usar o mesmo lock de usuário e revalidar a credencial contra reset concorrente. Não chamar e-mail dentro da transação SQL.

Envio usa porta desacoplada; persistência do hash seguida de envio isolado ainda não garante entrega durável. Não expor operacionalmente antes de integrar intenção durável e transporte aprovado. Eventos de segurança/auditoria e revisão humana permanecem gates da integração, sem registrar senha, token ou cookie.

Casos de aceite: resposta neutra; conta externa ignorada; expiração no limite; token usado/inexistente/tipo incorreto; senha inválida não consome token; replay; reset revoga duas sessões e permite login somente com senha nova; banimento e verificação preservados; falha de dependência não retorna sucesso. Testes simulados não comprovam transação, concorrência ou revogação entre processos no PostgreSQL real.

## Persistência complementar P04/P05

`createAuthRepository` implementa os contratos existentes de cadastro, leitura interna, reenvio e confirmação. Cadastro transaciona usuário CIDADAO/ATIVO privado, manifestações legais independentes e hash do token; unicidade usa o índice físico `LOWER(email)`. Confirmação bloqueia usuário, revalida/consome token e registra confirmação na mesma transação, invalidando tokens de confirmação irmãos, sem criar sessão. Reenvio retorna booleano após revalidar conta local não confirmada sob lock; o Service só encaminha mensagem quando o token foi persistido. Texto e versões legais finais continuam pendentes; fixtures não são versões de produção.

Migration 020 cria `aceites_legais`: usuário, versão/data dos Termos e versão/data da ciência da Política, sem restringir a um único registro por usuário nem definir retenção. Migrations 001–019 preservadas. `scripts/db-auth-grants.sh` é um passo administrativo opcional exclusivamente de desenvolvimento após 018–020: SELECT/INSERT/UPDATE nos tokens/sessões e SELECT/INSERT nos aceites. Não concede DDL, DELETE ou privilégios futuros automáticos. Não foi executado contra banco nesta entrega.

`createSessionStore` implementa o store D03: leitura por hash, inserção após lock/revalidação da credencial local, renovação por UPDATE condicionado à validade/revogação, revogação individual/por conta/de outras sessões e rotação transacional. Rotação exige mesmo usuário e preserva criação/limite absoluto; conflito ao inserir novo ID reverte a revogação do anterior. `Database.transaction` mantém todas as consultas no mesmo cliente, com rollback, release e descarte quando rollback/BEGIN falhar. Nenhum schema é criado pelo runtime.

## Testes SQL preparados

`backend/tests/integration/auth-postgres.test.ts` usa Testcontainers com PostgreSQL/PostGIS real e credencial de aplicação sem DDL. Valida baseline limpa, upgrade com usuário preexistente, constraints, rollback, consumo concorrente, expiração/revogação e jornada HTTP com repositories reais (e-mail/rate gate explicitamente simulados). **Não executado:** P01 ainda bloqueada. A suíte padrão marca os casos como skipped.

Para execução futura, primeiro revisar imagem corrigida PG17/PostGIS3.6 e registrar o digest aprovado em `backend/tests/integration/approved-images.json`; o arquivo está vazio. Só depois selecionar a referência exata com `AUTH_SQL_INTEGRATION_IMAGE` e executar Vitest. Variável isolada não libera a imagem. A configuração usa porta aleatória em loopback, sem volumes existentes, reuse, container privilegiado, montagem de socket ou helper Ryuk. Cleanup limita-se ao container efêmero criado pela suíte. Em interrupção forçada, inspecionar o recurso de teste remanescente antes da limpeza; não apagar volumes/projetos preexistentes.
