# CLAUDE.md — Cimatec Estudos

## Contexto

Projeto de TCC **individual** do curso Ford Enter (SENAI CIMATEC), foco em **front-end**.
Prazo curto (semanas, não meses). O autor é estudante de Desenvolvimento de Sistemas,
com experiência prévia em Java 21 + Spring Boot, MySQL e Docker, e está aprendendo Angular.

O uso de IA foi autorizado pelo professor. Isso NÃO muda o fato de que o autor precisa
entender e defender cada arquivo do projeto diante de uma banca avaliadora.

## Regra número 1 — capacidade de defesa

O autor será arguido sobre o código. Portanto:

- **Explique antes de implementar.** Diga o que vai fazer e por quê, e só então escreva.
- Quando houver mais de um caminho razoável, **apresente as opções e o trade-off**;
  não escolha sozinho decisões de arquitetura.
- Prefira **soluções simples e explicáveis** a soluções elegantes e obscuras.
- Se for usar um padrão que o autor pode não conhecer (signals, RxJS avançado,
  interceptors, guards), **explique o padrão antes de usá-lo**.
- Ao terminar um bloco, faça uma pergunta de verificação sobre o que foi escrito.

## Regra número 2 — escopo travado

O escopo é o fluxo principal (5 telas) mais dois blocos que o autor decidiu
incluir conscientemente (login e portfólio). Nada além disso.

**Fluxo principal — prioridade máxima, entregar primeiro:**

1. Início — pedidos em andamento e botão "Pedir ajuda"
2. Preciso de ajuda em… — escolha de matéria, turnos e modalidade
3. Mentores recomendados — lista ordenada com o motivo da recomendação
4. Perfil do mentor e horários — confiança e escolha de horário
5. Pedido enviado e status — estado do pedido e cancelamento

**Autenticação — segunda prioridade:**

6. Login
7. Cadastro
8. Recuperação de senha

**Portfólio — terceira prioridade, cortar primeiro se o prazo apertar:**

9. Portfólio público (aba opcional no topo) — vitrine do aluno ou mentor:
   descrição, habilidades, lista de projetos com link e forma de contato
10. Edição do próprio portfólio

**Ordem de construção obrigatória:**

1. Telas 1-5 do fluxo principal em Angular, contra mock em `assets/`
2. Back-end de autenticação (Spring Boot + Spring Security + BCrypt)
3. Telas 6-8 integradas ao back-end de verdade
4. Telas 9-10 do portfólio

Não comece o back-end antes do fluxo principal estar navegável.
Não comece o portfólio antes da autenticação funcionar ponta a ponta.

**Não implemente nada fora dessa lista sem o autor pedir explicitamente.**
Se identificar algo que faria sentido adicionar, **sugira e espere resposta**.
Nunca crie funcionalidade "de brinde".

Explicitamente fora do escopo (não implementar):
chat interno, feed social, ranking público, gamificação, avaliação pública,
videochamada, pagamento, app nativo, emissão de declaração de horas,
área de empresas ou recrutadores, upload de arquivo no portfólio
(projetos entram por link, não por upload).

## Regra número 3 — alertar antes de implementar o caminho pior

Quando o autor especificar algo que poderia ser feito de forma melhor, em usabilidade,
arquitetura, segurança, acessibilidade ou escopo, **avise antes de implementar do jeito
pedido**. Diga: o que foi pedido, o que você faria diferente, por quê, e o custo de cada
caminho. O autor decide, mas quer saber quando está escolhendo o caminho pior sem perceber.

Isso vale **especialmente** para o que o autor pediu com convicção. Não deixe de alertar
só porque a decisão já foi tomada. Se, depois do alerta, o autor mantiver a escolha,
implemente como pedido e siga em frente.

## Stack

- **Front-end:** Angular 20, **standalone components**, TypeScript, SCSS
- **A aplicação é zoneless** (criada sem zone.js). Consequência obrigatória:
  todo estado reativo usa **signals** (`signal`, `computed`, `effect`) e os
  componentes usam `ChangeDetectionStrategy.OnPush`. Propriedade simples de classe
  mutada fora de um signal **não** dispara atualização de tela. Não gere código no
  padrão antigo (zone.js implícito) — e, ao usar signals, explique o padrão ao autor,
  que está aprendendo Angular.
- Templates com a sintaxe nova de fluxo de controle (`@if`, `@for`, `@switch`),
  não `*ngIf` / `*ngFor`.
- **Dados:** mock local em `assets/` no início; migrar para API depois
- **Back-end:** Java 21 + Spring Boot, Spring Security, BCrypt, H2 em **modo arquivo**
  (não em memória — usuário cadastrado precisa sobreviver a um restart).
  Sem Docker, sem MySQL nesta etapa.
- Pastas separadas: `frontend/` e `backend/`

Sem bibliotecas de UI pesadas sem o autor aprovar. CSS próprio por padrão.

## Requisitos de interface (vieram de avaliação heurística de Nielsen)

Estes não são preferências: são os achados documentados no caderno de IHC entregue.
Toda tela precisa atendê-los.

- **Estados obrigatórios em toda tela que busca dados:** carregando, vazio, erro, sucesso.
  Lista vazia NUNCA aparece sem explicação e sem saída alternativa.
- **Status do pedido sempre visível**, escrito por extenso: Enviado, Aguardando resposta,
  Aceito, Recusado, Expirado. Nunca comunicado apenas por cor.
- **Nenhum erro apaga o que o usuário já preencheu.**
- **Voltar em todas as etapas**, sem perda de dados.
- **Cadastro mínimo:** matéria + turno bastam para usar. Nada de formulário longo antes
  do primeiro resultado.
- **Cada recomendação exibe o motivo** ("mesma matéria • livre terça à tarde • 8 sessões").
- **Vocabulário do aluno:** "matéria", "semestre", "pedir ajuda", "marcar sessão".
  Proibido na interface: "match", "score", "tutoria assíncrona".
- Ação principal chamada **"Pedir ajuda"** em todas as telas.

## Acessibilidade e responsividade (não negociáveis)

- Mobile-first: desenhar para **360px** e ampliar. Sem rolagem horizontal.
- Alvos de toque de no mínimo **44x44px**. Corpo de texto a partir de **16px**.
- Contraste mínimo **4,5:1** em texto, **3:1** em ícone e borda de campo.
- Todo campo com **label textual permanente** (não apenas placeholder).
- Todo ícone de ação acompanhado de texto.
- Imagens informativas com descrição; decorativas ocultas de leitor de tela.
- Navegação por teclado com foco visível; ao fechar modal, foco volta à origem.

## Regras de negócio

- Só exibir horários realmente livres, e **revalidar no momento do envio**.
- Bloquear pedido duplicado em aberto para o mesmo mentor e a mesma matéria.
- Cancelar sessão já aceita exige confirmação em duas etapas.
- Não permitir avançar sem ao menos uma matéria selecionada.
- Pedido expira em **48h** sem resposta, com aviso ao aluno e sugestão de alternativas.
- Mentor **não verificado não aparece** nas recomendações.
- Contato pessoal (telefone, e-mail) **não é exposto antes do aceite**.

## Reputação e antifraude (decisões de projeto — respeitar)

O sistema é gratuito e a reputação do mentor precisa resistir a conluio
(ex.: mentor convida amigos para inflar avaliações). Decisões tomadas:

- Reputação conta **sessões concluídas e confirmadas pelos dois lados**,
  não estrelas soltas. Estrela é barata de forjar; sessão agendada e confirmada não é.
- **Peso decrescente para pares repetidos:** 10 sessões com 10 pessoas diferentes
  vale mais que 10 sessões com as mesmas 2 pessoas.
- **Feedback numérico é privado** (alimenta a ordenação). O que é público é
  positivo e verificável: selos por matéria, número de sessões concluídas.
- **Nunca** vincular recompensa financeira (desconto de matrícula) à média de
  avaliações. Se houver recompensa, ela depende de dado auditável e de conferência humana.

Ao implementar qualquer coisa ligada a reputação, **assumir má-fé** e apontar
como aquilo poderia ser burlado.

## Autenticação

Decisão do autor: **autenticação real**, com Spring Boot + Spring Security + BCrypt.
Não é protótipo. As duas camadas serão implementadas de verdade.

**Camada de servidor (Spring Boot) — implementar:**

- Senha com hash **BCrypt**, nunca em texto claro, em lugar nenhum
- Validação de credencial e de todos os dados **no servidor**, sempre;
  validação no Angular é conveniência, nunca a única barreira
- **Rate limiting real** por IP e por conta, com bloqueio temporário
- Cadastro restrito a e-mail institucional, com verificação por token de uso único
  e prazo de expiração
- Recuperação de senha por token de uso único, com expiração curta,
  e resposta idêntica exista ou não o e-mail
- Nenhum segredo (chave de assinatura, credencial) versionado no Git —
  usar variável de ambiente, e `.gitignore` cobrindo os arquivos de configuração local
- CORS liberado apenas para a origem do front, nunca `*`
- Endpoints privados protegidos no servidor; o Angular não decide o que é autorizado

**Sessão — decisão fechada: cookie httpOnly.**

O token de sessão vive em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção
(`Secure` desligado apenas no ambiente local em http, senão o navegador não envia
o cookie). O JavaScript nunca lê o token, o que protege a sessão contra XSS.

Consequências que precisam ser implementadas junto:

- **CORS** no Spring com origem explícita (`http://localhost:4200`) e
  `allowCredentials = true`. Nunca `*` junto com credenciais — a combinação é
  inválida e o navegador rejeita.
- **CSRF ativo** no Spring Security, com o token de CSRF em cookie legível
  (`XSRF-TOKEN`), que é o padrão que o Angular já entende.
- No Angular, `withCredentials: true` nas chamadas e a configuração de XSRF do
  `HttpClient`, para que o header `X-XSRF-TOKEN` vá automaticamente.
- **Proibido** guardar token em `localStorage` ou `sessionStorage`, em qualquer hipótese.

Ao implementar, explique ao autor por que cookie httpOnly foi escolhido em vez de
`localStorage` — é pergunta provável na banca e ele precisa saber responder.

**Camada de interface (Angular) — implementar:**

- Mensagem de erro genérica ("e-mail ou senha inválidos"), nunca revelando se o
  e-mail existe na base
- Medidor de força de senha, com critérios visíveis ao usuário
- Botão de mostrar/ocultar senha
- `autocomplete="username"` e `autocomplete="current-password"` corretos
- Contador de tentativas com bloqueio temporário na interface
- Sessão com expiração e logout explícito
- Route guards para as rotas privadas
- Fluxo de recuperação de senha e de verificação de e-mail institucional
- Acessibilidade completa no formulário (labels, foco, erro anunciado)

**Regras para você:**

- **Nunca** descreva como "seguro" algo que roda só no cliente.
- Route guard no Angular é UX, não segurança. A proteção real é no servidor,
  em todo endpoint privado. Diga isso ao autor ao implementar os guards.
- **Nunca** grave senha em `localStorage`, `sessionStorage`, mock ou dado de teste,
  em texto claro ou de qualquer outra forma.
- Ao implementar cada item, diga se ele é interface ou segurança de verdade.
  O autor será arguido sobre isso.
- Antes de terminar a autenticação, faça uma revisão do que foi construído
  listando o que um atacante tentaria e como o código responde a cada tentativa.

## LGPD

Há alunos menores de idade no curso técnico. Coletar o mínimo de dados pessoais,
consentimento explícito no cadastro, e nenhum dado sensível em mock ou repositório.
Dados de teste sempre fictícios.

## Como trabalhar

- **Um passo por vez.** Terminou um componente, pare e mostre.
- **Commits pequenos e frequentes**, com mensagem descritiva.
- Não refatore código que não faz parte da tarefa atual.
- Não instale dependência sem perguntar.
- Não gere arquivo de configuração "por precaução".
- Se o autor pedir algo fora do escopo acima, **lembre-o do escopo** antes de fazer.
- Escreva o service já com `HttpClient` e `Observable` desde o mock, para que a troca
  para a API real seja mudança de URL.
- **Divergência do caderno de IHC vai para o `DECISOES.md`** na raiz, antes de implementar.
  Avise o autor, registre a entrada (data, o que o caderno previa, o que foi decidido,
  por quê, impacto para o usuário) e só então escreva código. O arquivo vira capítulo
  da monografia: escreva para quem vai ler na banca.

## Referência visual e benchmarking

O Superprof é o concorrente direto citado no trabalho e serve como **referência de
padrões**, não como modelo a reproduzir.

**Permitido e desejável:** navegar o site público, observar o fluxo (como se busca um
professor, o que aparece no card, como o filtro é organizado, o que o perfil mostra
para gerar confiança) e registrar esses padrões por escrito, como análise de
concorrência. Esse registro vira capítulo da monografia.

**Não fazer:** extrair, copiar ou adaptar HTML, CSS, assets, ícones ou qualquer
código do site. Além da questão de direito autoral, o código de produção é minificado
e não ensina nada útil.

A identidade visual é própria: paleta, tipografia e espaçamento diferentes.
O trabalho precisa sustentar, na banca, qual é o seu diferencial em relação ao
Superprof — parecer com ele demais enfraquece exatamente esse argumento.
