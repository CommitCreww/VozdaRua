# Corpus local de senhas comuns

- Origem oficial: `danielmiessler/SecLists`, commit `dbfb830d95e4f3da4fb7d7d277ed597de0ed7a18`, arquivo `Passwords/Common-Credentials/10k-most-common.txt`.
- Git blob da fonte: `a93ea7f91f095b38728795ecd6ec731e59b8c112` (73.026 bytes). Download fixado por commit conferido com `git hash-object`.
- Licença: MIT, aviso oficial em [SECLISTS_LICENSE.txt](SECLISTS_LICENSE.txt), blob `fbd3be5da1b5c7363ab6d581e4cc6a22a8893683`.
- Revisão: fonte UTF-8, 10.001 linhas não vazias e distintas, sem caracteres de controle; selecionadas as **primeiras 10.000** na ordem do arquivo. A seleção contém 10.000 valores distintos após lowercase. Apenas uma entrada tem 15 a 128 caracteres, logo o corpus tem cobertura efetiva limitada para a política D04; isso não autoriza alterar o mínimo de 15 caracteres.
- Transformação: cada entrada selecionada foi convertida a lowercase, codificada em UTF-8 e transformada em SHA-256 hexadecimal. Os 10.000 fingerprints distintos estão em `backend/src/security/common-password-fingerprints.ts`. A busca normaliza somente para a lista; Argon2 recebe a senha original. Nenhuma senha da fonte foi incorporada em texto puro ao repositório. A fonte baixada permanece somente em `.local/`, ignorada pelo Git.
- Atualização futura exige revisão de origem, licença, integridade, contagem, normalização, testes e Security Gate. O corpus não substitui rate limiting nem revisão da autenticação antes da produção.
