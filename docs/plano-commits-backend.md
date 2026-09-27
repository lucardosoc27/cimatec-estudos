# Plano de commits do back-end de autenticação

Escrito em 2026-09-27, depois de o commit 3 ter sido feito sem este arquivo existir: a
sequência estava só em conversa e em notas do `DECISOES.md`, e a falta dela custou uma rodada
de suposição sobre o commit 4. Cada commit diz o que entrega e o que **não** entrega, para que
ninguém adiante nem adivinhe. Um commit por rodada de trabalho.

Versões fixadas no `pom.xml`: Spring Boot 4.1.1 e Spring Security 7.1.1. A pesquisa que embasa
as escolhas está em `docs/pesquisa/autenticacao-spring-security-7.md`.

Regras que valem para todos os commits:

- Nenhum segredo no repositório: nenhuma senha, hash ou token em dado de teste, script de carga
  ou migração. Todo usuário nasce pelo cadastro.
- Nega por padrão: rota nova nasce protegida e é liberada uma a uma, com o método HTTP explícito.
- Cada commit é provado com requisição real (`curl`), não só com teste unitário.
- A sessão simulada do front (`services/mock/sessao-simulada.ts`) fica ligada até o commit 5.

## Commit 1 — Esqueleto do Spring com H2 (`caf2020`)

**Entrega:** projeto Spring Boot 4.1.1 com os starters de JPA, Security, Validation e Web MVC;
H2 em **modo arquivo** em `backend/dados/` (ignorado pelo git), para o usuário cadastrado
sobreviver a um restart; `.gitignore` cobrindo banco, `target/` e configuração local.

**Não entrega:** nenhuma rota, nenhuma entidade, nenhuma regra de segurança própria. O console
web do H2 foi retirado do `pom.xml` de propósito: seria uma porta a mais para proteger.

## Commit 2 — Security nega tudo (`48a8090`)

**Entrega:** `SecurityFilterChain` com `anyRequest().authenticated()`; CSRF com token em cookie
legível (`csrf.spa()`), que o `HttpClient` do Angular devolve no header `X-XSRF-TOKEN`; CORS com
origem explícita e credenciais, pensando em produção; 401 para quem não está logado, em vez do
403 padrão; sem cache de requisição (quem lembra "para onde voltar" é o Angular).

**Não entrega:** nenhuma rota liberada, nenhum usuário no banco, nenhuma propriedade do cookie
de sessão (`SameSite`, `Secure`). O usuário padrão `user` do Boot ainda era gerado no console.

## Commit 3 — Usuário e cadastro (`223e203`)

**Entrega:** entidade `Usuario` (UUID, nome, e-mail único em minúsculas, hash BCrypt da senha,
curso, situação `PENDENTE`/`VERIFICADO`, versão dos termos e os três consentimentos com data);
`UsuarioDetailsService` próprio, que faz o Boot parar de gerar o usuário padrão e marca conta
não verificada como `disabled`; bean `PasswordEncoder` BCrypt; `GET /api/auth/csrf` (só grava o
cookie) e `POST /api/auth/cadastro`, os dois liberados por método; validação no servidor com as
mesmas regras de senha da tela, domínio do e-mail vindo de `app.email.dominio` e curso conferido
na lista dos nove; erro 400 com `{ "message": "..." }`; cadastro responde 200 exista ou não o
e-mail (anti-enumeração, `DECISOES.md` 2026-09-27); `ddl-auto=update` sem Flyway.

**Não entrega:** verificação do e-mail (a conta nasce `PENDENTE` e fica assim), login, logout,
`/api/auth/eu`, papel de mentor, limite de tentativas, envio de e-mail.

## Commit 4 — Verificação do e-mail institucional (`7fbb731`)

**Entrega:** token de uso único, 32 bytes aleatórios, guardado como **hash SHA-256** (nunca em
texto claro), válido por **24 horas**, consumido no primeiro uso com registro da data;
`POST /api/auth/verificacao` com `{ "token" }`, respondendo `{ "estado": "ativada" | "expirado"
| "ja-usado" | "invalido" }` (os nomes que a tela `/verificar-email` já usa); `POST
/api/auth/reenviar` com `{ "email" }`, que responde igual exista ou não a conta, invalida o token
anterior a cada novo envio e respeita um intervalo mínimo entre reenvios (429 com `Retry-After`,
contado em memória por e-mail, exista a conta ou não). Conta verificada passa a `VERIFICADO`;
`PENDENTE` continua `disabled`. **Envio de e-mail está fora do escopo do projeto**, por
decisão: a entrega do link é o console do Spring, no perfil `dev`, que o `spring-boot:run` ativa.
Fora desse perfil não existe implementação de entrega, e o servidor se recusa a subir: conta que
ninguém consegue verificar seria conta desabilitada para sempre.

**Não entrega:** login (a conta verificada ainda não consegue entrar), recuperação de senha,
limite por IP. A sessão simulada do front continua ligada, então a tela `/verificar-email` ainda
não fala com o Spring: a prova é por `curl`.

## Commit 5a — Login, logout e `/api/auth/eu` no Spring

Dividido em dois porque junta configuração de sessão no Spring com integração do front, que
falham por motivos diferentes. Nesta metade nada dentro de `frontend/` muda.

**Entrega:** bean `AuthenticationManager` com `DaoAuthenticationProvider`, que confere a senha
**antes** de olhar se a conta está verificada, para conta pendente com senha errada responder
igual a senha errada de conta verificada; `POST /api/auth/login` em controller próprio, na ordem
da pesquisa: autenticar, `SessionAuthenticationStrategy` (troca o id da sessão e apaga o token
CSRF antigo), salvar o contexto explicitamente na `HttpSession`; resposta 401 idêntica (status e
corpo) para senha errada e e-mail inexistente, com o hash calculado nos dois casos; 403 "confirme
seu e-mail" só para quem provou a senha de uma conta pendente; `POST /api/auth/logout` pela
configuração, invalidando a sessão no servidor e respondendo 200; `GET /api/auth/eu` devolvendo o
usuário logado no formato do `Usuario` do front; cookie de sessão `HttpOnly`, `SameSite=Lax` e
`Secure` por propriedade, com `Secure` desligado só em desenvolvimento local. Prova por `curl`:
login e depois `/eu` com o mesmo cookie; cookie de antes do logout não autentica mais.

**Não entrega:** qualquer mudança no front (a sessão simulada continua ligada), limite de
tentativas, recuperação de senha, `PATCH`/`DELETE /api/conta`, pedidos e mentores no Spring.

## Commit 5b — O front passa a usar o login do Spring

**Entrega:** `SESSAO_SIMULADA` some junto com o arquivo `sessao-simulada.ts`; a tela de login
trata o 403 de conta pendente com a mensagem do servidor; os dados do mock passam a ler "quem
está logado" do `AuthService` (`DECISOES.md` 2026-09-26); as contas de demonstração são
recriadas pelo cadastro e verificadas pelo link do console. Prova no navegador: cadastro,
verificação, login, `/inicio`, logout.

**Não entrega:** limite de tentativas, recuperação de senha, `/api/conta` (a tela Minha conta
fica sem servidor até o commit 7), pedidos e mentores no Spring.

## Commit 6 — Limite de tentativas

**Entrega:** limite por IP e por conta no login, com bloqueio temporário e 429 com
`Retry-After`; contadores em memória com limpeza periódica das entradas antigas; o mesmo
mecanismo cobre o reenvio de verificação do commit 4. No fim, `code-review` do back-end inteiro,
antes de o Angular passar a depender dele.

**Não entrega:** leitura de `X-Forwarded-For` (atrás do proxy do `ng serve` todos parecem vir do
mesmo IP; ver limitações em `DECISOES.md` 2026-09-24), persistência dos contadores entre
restarts, biblioteca de rate limit.

## Depois do commit 6 (proposta, ordem a confirmar com o autor)

7. Minha conta: `PATCH /api/conta`, `PATCH /api/conta/consentimentos`, `DELETE /api/conta`
   com senha, que a tela já chama.
8. Recuperação de senha: token de uso único com expiração curta e resposta idêntica exista ou não
   o e-mail. Primeiro item a cair se o prazo apertar.
9. Pedidos e mentores no Spring (seção 6 da `ESPECIFICACAO-TELAS.md`), quando `USAR_MOCK` sai
   e `/api/mentores` passa a exigir sessão de verdade (`DECISOES.md` 2026-09-27).
