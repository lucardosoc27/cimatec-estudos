# Revisão de segurança do back-end (depois do commit 6)

Data: 2026-09-27. Código revisado: `backend/` em `4c61f0c`, commits 1 a 6 do
`docs/plano-commits-backend.md`. Rodada diagnóstica: nenhum arquivo de código foi alterado.
O autor escolhe o que entra em código na rodada seguinte.

## Como a revisão foi feita

- Primeiro a lista do que um atacante tentaria (60 itens, seções A a L), montada a partir da
  leitura do código inteiro e das decisões já registradas no `DECISOES.md`.
- Depois um revisor independente, que não escreveu o código, conferiu cada item contra o código
  real (`arquivo:linha`) e contra requisições reais numa instância própria: porta 8089 e banco
  descartável fora do repositório, para não tocar `backend/dados/` nem a porta 8080.
- Comportamento de biblioteca foi conferido no bytecode dos jars em `~/.m2` (Spring Security
  7.1.1, Spring Boot 4.1.1, Jackson 3.1.5) e na documentação oficial do Tomcat e do Render. Onde
  não houve fonte, o item está marcado "a confirmar".
- Por fim, quem coordenou a revisão reconferiu os vereditos que mudam decisão: D6 no bytecode do
  BCrypt, D3 e D5 no `LimiteDeTentativas`, A3 no fluxo cadastro → verificação e na tela
  `/verificar-email`, FL1 pela data de modificação de `backend/dados/cimatec.mv.db`.
- `./mvnw -q test`: passou, 37 testes em 7 classes, uns 28 segundos. Efeito colateral achado: o
  teste de fumaça abre o banco de desenvolvimento (FL1).
- Versões, pelo BOM do Boot 4.1.1: Spring Security 7.1.1, Spring Framework 7.0.9, Tomcat 11.0.24,
  Jackson 3.1.5, Hibernate Validator 9.1.3, H2 2.4.240.

Formato de cada achado: veredito, evidência, severidade, o que o atacante consegue na prática,
custo de corrigir. Severidade: alta = toma uma conta ou derruba o login para todos sem
precondição difícil; média = degrada o serviço, atinge muita gente ou depende do ambiente de
deploy; baixa = incômodo ou higiene; informativa = fato conferido, sem ataque.

## Resumo: as três listas

### 1. Corrigir antes da apresentação

- D5 e D3, limite de tentativas. `LoginRequest.email` não tem `@Size` (só `@NotBlank`), e cada
  login cria uma entrada no mapa por conta mesmo quando a origem já está bloqueada. Um atacante
  enche a memória com e-mails gigantes e derruba o servidor; e uma origem bloqueada continua
  trancando contas de terceiros. Custo: uma linha para o `@Size(max = 254)`, 5 a 15 linhas para
  não contar a conta quando a origem barra, um teste para cada. Motivo: é o buraco mais barato de
  fechar, e é exatamente o tipo de pergunta que a banca faz sobre um limitador em memória.
- A3, ocupar o e-mail de outra pessoa antes dela. Alguém cadastra `vitima@...` com a senha dele;
  o link vai ao e-mail da vítima; ela clica em "Confirmar" e ativa a conta com a senha do
  atacante, que então entra como ela. É a única falha de lógica de autenticação encontrada.
  Custo: uma rodada inteira (back, front, especificação, `DECISOES.md`), detalhado no item A3.
  Motivo: "assumir má-fé" é regra do projeto, e hoje a vítima não tem saída, porque a recuperação
  de senha é commit futuro. Se a rodada não couber no prazo, cai para a lista 2 com a mitigação
  "recuperação de senha (commit 8) devolve a conta à dona do e-mail".
- FL1, teste de fumaça no banco de desenvolvimento. `BackendApplicationTests` não sobrescreve o
  datasource, então `./mvnw test` abre `backend/dados/cimatec` e falha se o servidor de
  desenvolvimento estiver rodando (lock do H2). Custo: uma linha. Motivo: já mordeu nesta revisão.

### 2. Declarar como limitação conhecida

- H1, contadores em memória (item obrigatório 1). Risco real pequeno nesta topologia: o H2 em
  arquivo já impede segunda instância, e um reinício natural só devolve 5 tentativas por conta.
  O único jeito de um atacante PROVOCAR o reinício é o D5, que a lista 1 fecha. Detalhe na seção
  "Os dois itens obrigatórios".
- I1, limite por IP atrás de proxy ou NAT (item obrigatório 2). Já registrado em 2026-09-24; fica
  como limitação enquanto o servidor for local. Vira lista 1 se a apresentação usar servidor no
  Render com a turma atrás do NAT da escola: 20 senhas erradas de qualquer pessoa trancam todos
  por 15 minutos. O que muda antes de qualquer deploy está na mesma seção.
- D4, trancar a conta de outra pessoa com 5 senhas erradas. Custo aceito em 2026-09-27; a
  mitigação de verdade (CAPTCHA, segundo fator) está fora do escopo.
- A4, A5, C2, C3, C4: cadastro e reenvio sem limite por origem. Cadastro sem teto enche a tabela
  de contas pendentes (nunca apagadas) e queima CPU com BCrypt; reenvio a cada 60 s com o e-mail
  da vítima mantém o link dela sempre inválido e, com e-mail real, seria bombardeio em nome da
  instituição. Custo médio (30 a 60 linhas): um limite por origem nas rotas públicas. Motivo para
  só declarar: em rede local a apresentação não sofre; antes de um deploy, entra.
- G4, G3 e I3: padrão "inseguro a menos que alguém lembre". `Secure` do cookie, `app.url` e
  `app.email.dominio` têm valor de desenvolvimento por padrão; atrás de proxy TLS o `XSRF-TOKEN`
  fica sem `Secure` e o HSTS nunca liga. Custo baixo (um `application-dev.properties` e uma linha
  de `forward-headers`), mas só faz diferença em deploy. Entra na lista "antes de qualquer deploy".
- K4, H2 em arquivo: sem senha, `ddl-auto=update`, e no Render gratuito o sistema de arquivos é
  descartado a cada deploy, reinício ou hibernação, então as contas somem. Aceitável para banco
  local; deploy que preserve contas exige Postgres.
- B2, uso único do token não é atômico: dois POSTs simultâneos com o mesmo token respondem os
  dois "ativada". Inofensivo na verificação; atenção no commit 8 (recuperação de senha), onde
  dupla ativação importaria.
- E2, conta apagada com sessão viva: `usuarioLogado` faz `orElseThrow`, que viraria 500. Hoje
  não é alcançável; no commit 7 (`DELETE /api/conta`), tratar como 401 e invalidar a sessão.
- K6, vulnerabilidades conhecidas nas versões: não conferido em fonte oficial nesta revisão.
  Conferir os avisos de segurança do Spring para Boot 4.1.1 e Security 7.1.1 antes de um deploy.

### 3. Não vale corrigir neste escopo

- B1, rota de verificação sem limite: o token tem 256 bits, adivinhar é impraticável; martelar a
  rota custa uma consulta por tentativa, igual a qualquer rota pública.
- B3, hash do token fica no banco depois de usado: é hash, e "já usado" é decidido antes por
  `verificadoEm`. Uma linha de higiene, sem ganho de segurança.
- B4, token na URL do link: o front só consome no clique, a página não carrega recurso externo, e
  `Referrer-Policy` seria configuração por precaução.
- B6, `reenviar` chama `iniciar` por `this` e o `@Transactional` não se aplica nesse caminho:
  funciona porque o `save` do repositório tem transação própria. Anotar `reenviar` é uma linha, se
  incomodar, mas não há bug.
- A2 e A6, dado sujo aceito (zero-width na parte local do e-mail, `<script>`, NUL e RTL override no
  nome): o domínio institucional resiste a todas as fugas tentadas, e o Angular escapa na
  interpolação (não há `innerHTML` no front). Rejeitar caracteres de controle seria 2 a 5 linhas.
- C5, mapa do reenvio varrido inteiro a cada chamada: chave limitada a 254 caracteres e vida de
  60 segundos; muito menor que o D5.
- E1, `JSESSIONID` não é apagado do navegador no logout: a sessão é invalidada no servidor e o
  cookie antigo devolve 401. `deleteCookies` seria cosmético.
- G2, duas instâncias de `CookieCsrfTokenRepository` (uma do `spa()`, outra na estratégia de
  login): compatíveis hoje. Unificar num bean é refatoração sem ataque associado.
- G5, sessão de 30 minutos deslizante sem prazo absoluto nem limite de sessões simultâneas: fora do
  escopo do TCC.
- G7, `Referrer-Policy` e CSP ausentes: a API é JSON e o Angular é servido à parte. HSTS depende do
  `native` (I3).
- J3 e J4, corpos de erro padrão do Boot ecoam o `path` pedido e o header `Server` não foi
  conferido: nada de stack, classe ou versão vaza.
- FL3, comentário desatualizado em `Usuario.java:22-23` ("ainda não existe coluna de papel",
  mas `mentoriaDesde` existe desde o commit 5b): não é segurança, mas é defesa na banca.

## Os dois itens obrigatórios

### Contadores em memória (H1 e H2)

Fato: `LimiteDeTentativas` e `IntervaloDeReenvio` guardam tudo em `ConcurrentHashMap` dentro do
processo (`LimiteDeTentativas.java:38-39`, `IntervaloDeReenvio.java:22`). Reiniciar zera; mais de
uma instância dividiria o limite.

Tamanho real do risco:

- Mais de uma instância não acontece nesta topologia. O H2 em modo arquivo mantém lock exclusivo:
  o revisor abriu uma segunda conexão ao mesmo arquivo com o servidor rodando e recebeu
  "Database may be already in use ... use the server mode [90020-240]". Sem `AUTO_SERVER` na URL
  (`application.properties:7`), a segunda instância nem sobe. Escalar exigiria trocar o banco
  antes, e aí os contadores também teriam de ir para um lugar compartilhado.
- Reinício zera o bloqueio. O que o atacante ganha: 5 tentativas novas por conta e 20 por origem
  a cada reinício. Com BCrypt e 5 tentativas a cada 15 minutos, são uns 480 chutes por dia por
  conta; um reinício acrescenta 5. Irrelevante para adivinhar senha.
- Reinício provocado de fora: só pelo D5 (e-mail gigante no login enche a memória, a JVM cai e
  volta zerada). Fechando o D5, o atacante não tem como forçar reinício.
- Reinício natural: no Render gratuito é frequente (hibernação após 15 minutos sem tráfego,
  reinício a qualquer momento, novo deploy a cada push; fonte lida pelo revisor:
  render.com/docs/free e render.com/docs/deploys). Cada um zera os contadores e também derruba
  todas as sessões (`HttpSession`), o que já é custo aceito em 2026-09-24.
- `IntervaloDeReenvio`: reiniciar libera um reenvio imediato. Trivial.

O que seria preciso para resolver:

- Solução mínima coerente com o projeto: uma tabela no H2 (`tentativas_login` com chave, início da
  janela, contagem e `bloqueado_ate`), entidade e repositório JPA, incremento atômico com
  `UPDATE ... WHERE` condicional ou `@Lock(PESSIMISTIC_WRITE)` dentro de `@Transactional`, e
  limpeza por consulta. Uns 40 a 60 linhas, sem dependência nova, mais testes. Resolve o
  reinício. Não resolve várias instâncias sozinha, mas isso não existe com H2 em arquivo.
- Redis ou Bucket4j: resolvem reinício e várias instâncias, ao custo de dependência e
  infraestrutura que o projeto não tem e o autor teria de defender. O Bucket4j já foi descartado
  em 2026-09-24.
- Recomendação: declarar (lista 2) e fechar o D5. Só vale gastar a rodada da tabela se
  "sobreviver ao reinício" virar requisito da banca.

### Limite por IP atrás de proxy (I1, I2 e I3)

Fato: `AuthController.java:99` usa `request.getRemoteAddr()`. Sem tratamento de forward
headers, é o IP da conexão que chega ao Tomcat. Atrás do proxy do Render (o balanceador termina o
TLS e repassa por HTTP, segundo render.com/docs/web-services), de qualquer balanceador ou do NAT de
uma instituição, é o mesmo endereço para todo mundo.

Consequência provada: a origem 127.0.60.1 errou 20 vezes; a 21ª tentativa, com conta válida e
senha CERTA, recebeu 429 com `Retry-After`. Ou seja, 20 senhas erradas de qualquer pessoa, em 15
minutos, trancam o login de TODOS por 15 minutos. Numa turma de 30 atrás do mesmo NAT, bastam
20 erros de digitação. Na apresentação com servidor local e cada dispositivo com IP próprio na
rede local, o problema não aparece; com servidor no Render e a turma no Wi-Fi da escola, aparece.

O que precisa mudar antes de qualquer deploy:

- `server.forward-headers-strategy=native`. Liga o `RemoteIpValve` do Tomcat (confirmado no
  bytecode do `spring-boot-tomcat-4.1.1`). O valve só usa `X-Forwarded-For` quando a conexão vem
  de um proxy confiável (`server.tomcat.remoteip.internal-proxies`, padrão nas faixas privadas
  10/8, 172.16/12, 192.168/16, 169.254/16, 100.64/10, 127/8 e equivalentes IPv6; e
  `trusted-proxies`), pega o endereço mais à direita que não seja proxy confiável, e ignora o
  header em conexão direta de IP não confiável. Também troca o `isSecure()` pelo
  `X-Forwarded-Proto`, o que devolve o `Secure` ao `XSRF-TOKEN` e liga o HSTS (I3). Fonte:
  tomcat.apache.org/tomcat-11.0-doc/config/valve.html e a documentação do Boot 4.1.
- A confirmar no Render antes de confiar nisso: de que faixa o proxy chega à aplicação (se não
  for privada, configurar `trusted-proxies`); se ele acrescenta ou substitui o `X-Forwarded-For`;
  se a aplicação é alcançável sem passar pelo proxy. A documentação lida não traz a faixa interna.
  O jeito prático é logar `getRemoteAddr()` e o header no primeiro deploy de teste.
- Não usar `server.forward-headers-strategy=framework` para isso: o `ForwardedHeaderFilter` não
  tem a noção de proxy confiável, então qualquer um escreveria o IP que quisesse e o limite por
  IP deixaria de existir. É a armadilha que o `DECISOES.md` de 2026-09-24 já descrevia.
- Mudar a política enquanto a faixa não for confirmada: limite por origem bem mais alto (100 a
  200 em 15 minutos) ou desacelerar em vez de bloquear, mantendo o limite por conta como controle
  principal, porque ele não depende de IP. Mesmo com IP correto, uma turma atrás de um NAT
  compartilha a origem.
- Corrigir o D3 junto, senão a origem bloqueada continua trancando contas alheias.
- Custo: 1 ou 2 linhas de propriedade, 1 ou 2 constantes, uma entrada no `DECISOES.md` e a
  confirmação no Render. Sem dependência.

### Antes de qualquer deploy (lista consolidada)

Precondição que vale antes de todas: fora do perfil `dev` o servidor nem sobe, porque não existe
implementação de `EntregaDoLink` (`EntregaDoLink.java:5-11`) e envio de e-mail está fora do
escopo por decisão. Então deploy real exige, antes de tudo, o envio de e-mail. A lista abaixo é
para quem continuar o projeto.

- Forward headers com `native` e a faixa do proxy confirmada (I1, I2, I3).
- Limite por origem alto ou desaceleração, e D3 corrigido (I1, D3).
- Variáveis `APP_COOKIE_SECURE=true`, `APP_URL` e `APP_EMAIL_DOMINIO` definidas, ou o padrão
  invertido para seguro com um `application-dev.properties` (G4). Esse arquivo não tem segredo e
  o `spring-boot:run` precisa dele: deve ser versionado, não ignorado. Só arquivo local ou de
  produção com segredo entra no `.gitignore` (o da raiz já cobre `application-local.properties`
  e `*.env`).
- Banco: Postgres gerenciado ou disco persistente; o H2 em arquivo perde tudo no sistema de
  arquivos efêmero do Render gratuito (K4).
- Limite por origem também no cadastro, no reenvio e na verificação (A4, A5, C2, B1).
- Conferir os avisos de segurança das versões fixadas (K6).
- HTTPS de ponta a ponta, com HSTS passando a valer depois do `native` (G7).

## A lista de ataques, item por item

### A. Cadastro (`POST /api/auth/cadastro`)

- A1, descobrir se um e-mail tem conta pelo tempo. Veredito: refutado na prática. Evidência: o
  BCrypt roda antes do `existsByEmail` (`CadastroService.java:69` e `:75`) e o intervalo de
  reenvio é registrado para todo e-mail (`:73`). Medidas, 12 amostras alternadas: e-mail novo
  139,6 ms, pendente 131,8 ms, verificada 132,3 ms, faixa total 118 a 162 ms. Status 200, corpo
  vazio e headers idênticos nos três. A diferença de uns 7 ms (INSERT, token, segundo save) fica
  abaixo do ruído. Severidade: informativa. Custo: nenhum recomendado.
- A2, burlar o domínio. Veredito: refutado nos casos perigosos. Evidência
  (`CadastroService.java:55-58`, `CadastroRequest.java:22-23`): `x@evil.com@exemplo.com` → 400 pelo
  `@Email`; `x@exemplo.com.evil.com`, `x@sub.exemplo.com`, `x@xexemplo.com` → 400 "institucional"
  pelo `endsWith("@" + dominio)`; homóglifo cirílico no domínio → 400; `x@EXEMPLO.COM` → 200,
  normalizado (correto); 255 caracteres → 400. Aceito como dado sujo: zero-width na parte local.
  Severidade: baixa. Custo: 0 a 5 linhas, opcional.
- A3, ocupar o e-mail de outra pessoa antes dela. Veredito: CONFIRMADO. Evidência: a verificação
  não pede senha (`AuthController.java:74-77`, `VerificacaoService.java:67-83`); o cadastro
  repetido responde 200 e não recria nem gera link novo (`CadastroService.java:75-78`); a tela
  `/verificar-email` abre no estado "confirmar" e dispara o POST no clique
  (`frontend/src/app/features/auth/verificar-email.ts:24,32`). Fluxo provado no servidor:
  1. atacante cadastra `alvo@exemplo.com` com a senha dele; conta PENDENTE; link gerado;
  2. vítima tenta se cadastrar com a senha dela: 200 "enviamos um link", nenhuma conta nova,
     nenhum link novo;
  3. a vítima abre o link que chegou ao e-mail dela (o do atacante), clica em "Confirmar":
     `{"estado":"ativada"}`;
  4. login com a senha do atacante entra; com a senha da vítima, não.
  O que o atacante consegue: uma conta em nome da vítima, ativada pela própria vítima, e o acesso
  a ela. Precondições: saber o e-mail institucional e a pessoa ainda não ter conta. Alcance: uma
  conta por vez. Hoje a vítima não tem saída (recuperação de senha é o commit 8). Severidade:
  alta, com dano limitado pelo que o sistema guarda (não há mensagens nem contato exposto antes
  do aceite), mas é tomada de conta. A correção tem de valer nas duas ordens: atacante primeiro,
  e atacante sobrescrevendo depois que a vítima se cadastrou e antes de ela confirmar.
  Custo: médio, uma rodada. (a) A verificação passa a exigir a senha do cadastro:
  `VerificacaoRequest` ganha `senha`, `verificar` compara com o hash da conta pendente, novo
  estado "senha-nao-confere" na tela, e o mesmo limite por conta do login nessa rota. Só isso já
  impede a tomada: quem clica precisa saber a senha que foi cadastrada. (b) Cadastrar de novo um
  e-mail PENDENTE substitui nome, hash, curso e consentimentos e gera link novo, resposta
  continua 200: dá saída à vítima sem esperar o commit 8. Registrar em `DECISOES.md` antes;
  muda a especificação da tela; 2 a 3 testes.
- A4, inundar o banco de contas pendentes. Veredito: CONFIRMADO. Evidência: nenhuma rota tem
  limite por origem além do login (`AuthController.java:64-66`); nenhum código apaga conta nunca
  verificada. O revisor criou 70 contas em sequência sem obstáculo. O que o atacante consegue:
  tabela e log crescendo sem teto. Severidade: média. Custo: médio, 30 a 60 linhas (limite por
  origem reaproveitando a ideia do `LimiteDeTentativas`, e/ou limpeza de pendentes vencidas por
  `verificacaoExpiraEm`).
- A5, queimar CPU com o BCrypt do cadastro. Veredito: CONFIRMADO. Evidência: `encode` a cada
  cadastro válido (`CadastroService.java:69`), uns 130 ms medidos; corpo de 25 MB foi lido e
  processado em 0,38 s antes do `@Size` do nome barrar; limite de string do Jackson 3.1.5 é 100 MB
  (conferido no jar); campos extras são ignorados. O que o atacante consegue: com poucas
  requisições por segundo satura 1 ou 2 vCPUs. Severidade: média. Custo: o mesmo limite do A4;
  opcional um filtro que responda 413 a corpo acima de um teto, uns 15 linhas.
- A6, dados malformados. Veredito: sem vazamento; mass assignment refutado; dado cru aceito.
  Evidência: JSON inválido, tipo errado e corpo vazio → 400 com mensagem fixa
  (`TratamentoDeErros.java:41-45`), sem eco; `id`, `verificacao`, `senhaHash`, `mentoriaDesde`,
  `termosVersao`, `termosEPoliticaEm` enviados são ignorados (record fechado
  `CadastroRequest.java:16-43`; entidade montada campo a campo `CadastroService.java:80-81`);
  `nome` com `<script>`, NUL e RTL override → 200, e o `/eu` devolve cru (no front só interpolação
  `{{ }}`, sem `innerHTML`); `curso` fora da lista → 400; senha de 65 caracteres → 400; senha de
  64 com acentos (127 bytes) → 400 "senha longa demais"; `Content-Type` errado → 415 com o corpo
  padrão do Boot. Severidade: baixa. Custo: opcional. Nota de UX: o `@Size(max = 60)` do nome
  conta antes do `trim` do serviço.
- A7, consentimentos. Veredito: refutado. Evidência: `termosEPolitica` nulo, falso ou ausente →
  400 (`CadastroRequest.java:37-39`); data e versão vêm do servidor (`Usuario.java:96,103`,
  `CadastroService.java:26`). Severidade: informativa.
- A8, log do cadastro. Veredito: sem dado pessoal. Evidência: `CadastroService.java:76` e `:82`
  logam só o UUID ou uma frase fixa; no log da bateria, zero ocorrências de `@exemplo.com`, de
  senha e de `$2a$`. Severidade: informativa.

### B. Verificação (`POST /api/auth/verificacao`)

- B1, forçar o token. Veredito: refutado; a rota não tem limite. Evidência: 32 bytes de
  `SecureRandom`, 43 caracteres em Base64url (`VerificacaoService.java:34,57-59`); cada POST é um
  SELECT. Severidade: baixa (DoS de consulta barata). Custo: baixo, não prioritário.
- B2, tokens variados e corrida. Veredito: entradas tratadas; uso único não atômico. Evidência:
  vazio ou nulo → 400 "Link sem token"; 101 caracteres → 400; estranho → "invalido"; dois POSTs
  simultâneos com o mesmo token válido → ambos "ativada" (`VerificacaoService.java:67-83`, sem lock
  nem versão). Severidade: baixa aqui; atenção no commit 8. Custo: `@Version` ou `UPDATE` condicional.
- B3, hash fica após o uso. Veredito: fato, sem impacto. Evidência: `Usuario.java:191-194` não
  limpa `verificacaoTokenHash`; "ja-usado" é decidido antes (`VerificacaoService.java:73-74`).
  Severidade: informativa. Custo: 1 linha.
- B4, token na URL. Veredito: parcial. Evidência: link `.../verificar-email?token=`
  (`VerificacaoService.java:63`); sem `Referrer-Policy` nas respostas; o front só consome no
  clique e a página não carrega recurso externo. Severidade: baixa. Custo: 3 a 10 linhas.
- B5, ordens estranhas. Veredito: refutado. Sem cadastro → "invalido"; duas vezes → "ja-usado";
  expirado → "expirado" (`VerificacaoExpiradaTest`). Nenhum 500.
- B6, transação por auto-invocação. Veredito: funciona, frágil. Evidência: `reenviar`
  (`VerificacaoService.java:89-101`, sem `@Transactional`) chama `iniciar` por `this` (`:99`);
  persiste porque o `save` do Spring Data tem transação própria. Severidade: informativa. Custo: 1 linha.

### C. Reenvio (`POST /api/auth/reenviar`)

- C1, enumeração. Veredito: refutado. Evidência: 200 para sem conta, pendente e verificada
  (`VerificacaoService.java:89-100`); o 429 do intervalo vale para qualquer e-mail (`:91`).
- C2, negar a verificação da vítima. Veredito: CONFIRMADO. Evidência: sem limite por origem; só o
  intervalo de 60 s por e-mail (`IntervaloDeReenvio.java`, `application.properties:29`); cada
  `iniciar` invalida o token anterior (`VerificacaoService.java:56-63`). O que o atacante
  consegue: manter o link da vítima sempre inválido; com e-mail real, bombardeio. Severidade:
  média (hoje só atrapalha uma conta pendente). Custo: médio, junto de A4.
- C3, intervalo compartilhado. Veredito: CONFIRMADO. Evidência: `putIfAbsent` por e-mail sem
  distinguir origem (`IntervaloDeReenvio.java:36`); provado com duas origens: quem grava primeiro
  vence e a vítima recebe 429. Severidade: média. Custo: coberto por C2.
- C4, o cadastro gasta o intervalo. Veredito: CONFIRMADO, não é oráculo. Evidência:
  `CadastroService.java:73` registra e ignora o retorno; cadastrar e pedir reenvio em seguida →
  429 imediato. Severidade: baixa. Custo: pequeno (chave separada ou não registrar no cadastro).
- C5, mapa do reenvio. Veredito: confirmado, pequeno. Evidência: `IntervaloDeReenvio.java:22,34`,
  `removeIf` no mapa inteiro a cada chamada; chave até 254; vida 60 s. Severidade: baixa.

### D. Login (`POST /api/auth/login`)

- D1, enumeração. Veredito: refutado. Evidência: mesmo 401 e mesmo corpo
  (`TratamentoDeErros.java:62-66`); no bytecode do `spring-security-core-7.1.1`, o
  `DaoAuthenticationProvider` codifica "userNotFoundPassword" e roda `matches` contra ele quando o
  usuário não existe; medidas: conta existente 124,5 ms, inexistente 129,7 ms. Pendente com senha
  errada → 401 igual; pendente com senha certa → 403 (`SecurityConfig.java:107-111`).
- D2, força bruta numa conta. Veredito: refutado. Evidência: contagem antes da senha, atômica
  (`LimiteDeTentativas.java:82-96`; `AuthController.java:100-102`); 5 erros → 401, a 6ª com a senha
  certa → 429 `Retry-After: 901`; 100 logins simultâneos na mesma conta → uns 5 chegaram ao
  BCrypt, o resto 429; caixa e espaço normalizados (`AuthController.java:98`); acerto zera a conta
  (`LimiteDeTentativas.java:73-78`).
- D3, origem bloqueada continua trancando contas. Veredito: CONFIRMADO. Evidência:
  `registrarTentativa` chama `contar(porConta)` antes de `contar(porOrigem)` e devolve o maior
  (`LimiteDeTentativas.java:56-65`); com a origem bloqueada (`:83`), a conta alvo ainda incrementa.
  Provado: origem bloqueada fez 6 tentativas em `d3x@`; de outra origem, com a senha certa, `d3x@`
  respondeu 429. Severidade: média (alta somada ao I1). Custo: 5 a 15 linhas, 1 teste.
- D4, trancar a conta de outra pessoa. Veredito: CONFIRMADO, custo aceito. Evidência:
  `application.properties:46,48-49`. Alcance: uma conta por 5 tentativas; com I1, todas.
- D5, estourar a memória pelo limitador. Veredito: CONFIRMADO. Evidência: `LoginRequest.java:6-8`
  só `@NotBlank`, diferente de `CadastroRequest` e `ReenvioRequest` (`@Size(max = 254)`); login
  com e-mail de 300 KB → 401, não 400; a entrada por conta é criada com a chave igual ao e-mail
  digitado (`AuthController.java:98`, `LimiteDeTentativas.java:59,82`) mesmo com a origem
  bloqueada, e vive 15 minutos; `limparVencidas` varre os dois mapas a cada login (`:100-102`).
  O que o atacante consegue: uns 100 pedidos de 25 MB em 15 minutos somam 2,5 GB no mapa e
  derrubam a JVM, que volta com os contadores zerados. Severidade: média a alta. Custo: 1 linha
  mais o D3, 1 teste.
- D6, senha maior que 72 bytes no login. Veredito: refutado. Evidência, bytecode de
  `spring-security-crypto-7.1.1`: `checkpw` chama `hashpwforcheck`, que chama
  `hashpw(byte[], String, boolean)` com `true`; nesse método, `iload_2; ifne` pula a checagem
  "password cannot be more than 72 bytes", que só roda na geração. Empiricamente: senha de 80
  bytes → 401 em conta existente e inexistente; senha certa de 72 bytes → 200. O cadastro barra
  acima de 72 bytes antes (`CadastroService.java:62`). Severidade: informativa.
- D7, dados malformados. Veredito: refutado. Sem corpo, array, senha nula → 400 antes do
  `registrarTentativa` (não conta tentativa); e-mail numérico vira string e conta 1 tentativa
  sem vazar; `Content-Type` errado → 415. Nenhum 500.
- D8, sessão. Veredito: refutado. Evidência: `ChangeSessionIdAuthenticationStrategy`
  (`SecurityConfig.java:121-126`, `AuthController.java:114`, teste
  `loginTrocaOIdDaSessaoQueJaExistia`); POST `/login` sem `X-XSRF-TOKEN` → 403; no bytecode,
  `ProviderManager.eraseCredentialsAfterAuthentication` é `true` e `User.eraseCredentials()`
  anula a senha, então o hash não fica na `HttpSession`; `ROLE_ALUNO` fixo na sessão, lado do
  mentor lido do banco a cada requisição (`UsuarioDetailsService.java:38-41`).
- D9, resposta do login e do `/eu`. Veredito: só o dono, sem hash nem token
  (`UsuarioResposta.java:30-42`, teste `loginValidoDevolveOUsuarioSemHashNemToken`).
- D10, pendente com senha certa devolve a tentativa (`AuthController.java:108-111`). Correto.

### E. Logout e `/eu`

- E1, logout. Veredito: refutado. Evidência: com CSRF → 200 e o mesmo cookie em `/eu` → 401; GET →
  401; sem CSRF → 403 (`SecurityConfig.java:64-66`). O `JSESSIONID` não é apagado no navegador,
  só invalidado no servidor. Custo opcional: `deleteCookies`, 1 linha.
- E2, `/eu`. Veredito: refutado hoje. Sem sessão → 401 sem criar sessão; cookie inventado → 401;
  POST → 405. `orElseThrow` em `AuthController.java:132` viraria 500 se a conta sumisse com a
  sessão viva: só depois do commit 7.
- E3, anônimo cria sessão? Veredito: refutado. `GET /csrf`, 401 e 403 não emitem `JSESSIONID`;
  CSRF em cookie (`SecurityConfig.java:44`) e `NullRequestCache` (`:74`).

### F. Chave de mentoria (`PATCH /api/conta/mentoria`)

- F1, entradas. Veredito: tratadas. Nulo ou ausente → 400 (`MentoriaRequest.java:7`); `"true"` e
  `1` → 200 por coerção do Jackson, benigno; extras ignorados; POST → 405; sem sessão → 401; sem
  CSRF → 403 (`SecurityConfig.java:59`).
- F2, conta de outra pessoa. Veredito: refutado. Sem id; sempre a conta da sessão
  (`ContaController.java:37`).
- F3, papel na hora. Veredito: reflete no `/eu` (`UsuarioResposta.java:38`; testes de Mentoria).
  Rotas futuras de mentor devem ler do banco, não da sessão.
- F4, dois PATCH simultâneos. Veredito: baixo. `@Transactional` (`ContaController.java:35`) e
  `ligarMentoria` idempotente (`Usuario.java:180-184`).

### G. CSRF e cookies

- G1, `csrf.spa()`. Veredito: confirmado, double submit por cookie legível. Evidência, bytecode do
  `spring-security-config-7.1.1`: `CookieCsrfTokenRepository.withHttpOnlyFalse()` e
  `SpaCsrfTokenRequestHandler` (header cru; XOR só para parâmetro de formulário;
  `setCsrfRequestAttributeName(null)` carrega o token em toda requisição). Quem grava cookie no
  domínio (subdomínio hostil, rede em http) forja o par. Na topologia de mesma origem e um
  domínio, aceitável. Severidade: informativa.
- G2, duas instâncias de `CookieCsrfTokenRepository` (`SecurityConfig.java:123-125` e a do
  `spa()`). Veredito: compatíveis; cookies capturados idênticos. Custo: 5 linhas para unificar.
- G3, atributos dos cookies capturados. `JSESSIONID`: `Path=/; HttpOnly; SameSite=Lax`, sem
  `Secure` (local). `XSRF-TOKEN`: `Path=/`, sem `HttpOnly` (por desenho), sem `SameSite`, sem
  `Secure`; o `saveToken` marca `secure(request.isSecure())`, falso atrás de proxy TLS sem
  forward headers. No login o `XSRF-TOKEN` é apagado e volta na requisição seguinte, por isso o
  front faz `GET /csrf` antes de cada POST. Severidade: média em produção. Custo: ver G4 e I3.
- G4, padrão inseguro a menos que alguém lembre. Veredito: CONFIRMADO. Evidência:
  `application.properties:12,24,40`. Perfil `dev` já existe (`pom.xml:86-88`) mas só governa o
  `LinkNoConsole`. Custo: 5 a 8 linhas e um `application-dev.properties` versionado.
- G5, sessão: 30 minutos deslizantes, sem prazo absoluto nem limite de simultâneas
  (`application.properties:41`); `;jsessionid` na URL → 400 pelo `StrictHttpFirewall`.
- G6, GET que muda estado. Veredito: refutado (`AuthController.java:58-61`).
- G7, headers. Presentes: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `X-XSS-Protection: 0`, `Cache-Control: no-store`. Ausentes: HSTS (depende de `isSecure()`),
  `Referrer-Policy`, CSP. Severidade: baixa.

### H e I

Ver "Os dois itens obrigatórios".

### J. Logs e respostas

- J1, todas as chamadas de log em `backend/src/main`: `CadastroService.java:76,82`,
  `VerificacaoService.java:81,96,100`, `LinkNoConsole.java:23`. Só UUID e frases fixas; o token
  aparece só no perfil `dev`, por desenho. Subir produção com `-Dspring.profiles.active=dev` por
  engano colocaria o token no log; sem o perfil, o servidor nem sobe, o que é trava a favor.
- J2, padrão do Spring, Hibernate e Tomcat: sem `show-sql`, sem access log; um 500 iria para o log
  do servidor, não para a resposta. Na bateria só houve WARN de 415 e 405, sem dado sensível.
- J3, corpos de erro: os do `TratamentoDeErros` são `{"message"}` fixos; os padrão do Boot (403 do
  CSRF, 415, 400 do Jackson) ecoam o `path`, sem stack, classe ou versão. Severidade: baixa.
- J4, headers: `Retry-After` nos 429; `Allow` no 405; `X-Powered-By` ausente; `Server` não
  conferido. Parcial.

### K. Rotas fora de ordem e superfície

- K1, sequências fora de ordem. Veredito: refutado. Verificar antes de cadastrar → "invalido";
  login antes de verificar → 403; logout sem login → 401 ou 403; `/eu` depois de logout → 401;
  PATCH depois de logout → 401.
- K2, métodos e caminhos alternativos. Veredito: refutado, tudo fecha. GET, HEAD, OPTIONS
  `/api/auth/login` → 401; PUT → 403; barra final → 403; `/API/auth/login` → 403;
  `//api/auth/login` → 400; `;x=y` → 400; `/./` → 403; `%2e%2e` → 400; `GET /error` direto → 401
  (só o dispatch ERROR é `permitAll`, `SecurityConfig.java:50`).
- K3, superfície. Veredito: refutado. `/actuator*`, `/h2-console`, `/swagger-ui*`, `/v3/api-docs`,
  `/`, `/index.html`, `/api/mentores`, `/api/pedidos` → 401; nada disso está no `pom.xml`. O
  `/api/mentores` em 401 já atende o registro de 2026-09-27.
- K4, banco. Veredito: CONFIRMADO como limitação. Sem senha (`application.properties:7-8`),
  `ddl-auto=update`, lock exclusivo provado; no Render gratuito o sistema de arquivos é efêmero e
  não há disco persistente (render.com/docs/free e render.com/docs/disks, lidos pelo revisor).
- K5, git. Veredito: limpo. `git ls-files backend` sem banco, wrapper ou propriedades locais;
  `git grep` por `$2[aby]$` e `Bearer` em `backend/src/main` só acha o comentário de
  `Usuario.java:42`; o `.gitignore` da raiz cobre `application-local.properties`, `*.env` e `*.db`.
- K6, CVE. Não verificado em fonte oficial nesta revisão.

### L. Testes

- L1, cobertura: 37 testes (Cadastro 8, Verificação 9, VerificaçãoExpirada 1, Login 6,
  LimiteDeTentativas 5, Mentoria 6, fumaça 1). Cobrem validação, anti-enumeração, token,
  reenvio e intervalo, expiração, fixação de sessão, logout, limites por conta e por origem,
  atomicidade, mentoria. Não cobrem: A3, D5, B2, D3, atributos de cookie e headers, superfície
  de rotas. Rodam sem o perfil `dev` e capturam o link em memória; zero `token=` no log de teste.
- L2, senha literal nos testes: só para cadastrar via API dentro do teste ("senha-de-teste-1",
  "senha-errada-1", "senha-comum-1"); nenhum hash literal nem usuário semeado. Conforme a regra.

### Fora da lista

- FL1, teste de fumaça no banco de desenvolvimento. Veredito: confirmado.
  `BackendApplicationTests.java:10-12` usa `@SpringBootTest` sem sobrescrever o datasource; as
  outras seis classes usam `jdbc:h2:mem:...`. Efeito observado nesta revisão: a data de
  modificação de `backend/dados/cimatec.mv.db` mudou durante o `./mvnw test` (só `ddl-auto=update`
  no esquema; o git segue limpo porque `dados/` é ignorado). Com o servidor de desenvolvimento
  rodando, o teste falharia pelo lock. Custo: uma linha,
  `properties = "spring.datasource.url=jdbc:h2:mem:fumaca;DB_CLOSE_DELAY=-1"`.
- FL2, consentimento sem histórico (`Usuario.java:60-67`): já registrado em 2026-09-23.
- FL3, comentário desatualizado em `Usuario.java:22-23`: diz que não existe coluna de papel, mas
  `mentoriaDesde` existe desde o commit 5b. Só documentação.

## O que ficou sem confirmar

- A faixa de IP com que o proxy do Render chega à aplicação, se ele acrescenta ou substitui o
  `X-Forwarded-For`, e se a aplicação é alcançável sem passar por ele (I2).
- Avisos de segurança oficiais das versões fixadas (K6).
- Header `Server` nas respostas (J4).

## Divergências entre documentação e código

- Nenhuma de segurança. As limitações registradas em 2026-09-24 e 2026-09-27 batem com o código.
- `Usuario.java:22-23` está desatualizado (FL3).
- A recomendação do revisor de ignorar no git um futuro `application-dev.properties` está
  invertida: esse arquivo não tem segredo e o `spring-boot:run` depende dele; só arquivo local ou
  de produção com segredo entra no `.gitignore`.
