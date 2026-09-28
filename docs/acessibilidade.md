# Acessibilidade no Cimatec Estudos

Escrito em 2026-09-27, lendo o código do front-end (`frontend/src`). Cada item diz o que o
sistema faz, onde isso está no código e para quem isso resolve. A linguagem é a de quem vai
explicar em voz alta; os nomes técnicos aparecem entre crases só para quem quiser conferir.

A referência é a WCAG 2.1, nível AA, que é a régua usada no mundo inteiro para acessibilidade na
web. Os requisitos de interface vêm também do caderno de IHC do projeto (avaliação heurística de
Nielsen).

## Para quem isto foi feito

- Quem usa **leitor de tela**: pessoas cegas ou com baixa visão, que ouvem a página em vez de
  vê-la.
- Quem usa **só o teclado**: pessoas com limitação motora, ou que não conseguem usar o mouse.
- Quem **enxerga com dificuldade**, inclusive quem não distingue certas cores.
- Quem usa **celular**, com o dedo e com tela pequena.
- Quem **passa mal com movimento na tela** (enjoo, vertigem, crises).
- Quem **se perde com facilidade** em sistemas: o sistema usa palavras do dia a dia do aluno e
  nunca apaga o que a pessoa já preencheu.
- Quem é **surdo ou tem baixa audição** (ver a seção própria, no fim).

## Quem usa leitor de tela

**A língua da página está declarada.** `index.html` tem `lang="pt-BR"`. Sem isso, o leitor de tela
leria o português com sotaque e regras de pronúncia do inglês.

**Cada tela tem título próprio.** Cada rota de `app.routes.ts` tem um `title`, como "Mentores para
você · Cimatec Estudos". É o que aparece na aba do navegador e a primeira coisa que o leitor de
tela diz ao abrir a página.

**A troca de tela é anunciada.** No Angular a página não recarrega: quem enxerga vê a tela mudar,
mas quem ouve não percebia nada ao ir do Início para os mentores. Agora, a cada troca de tela, o
sistema escreve "Página Mentores para você" numa área invisível que o leitor de tela lê sozinho
(uma região `aria-live`). Está em `core/titulo-com-anuncio.ts` e no fim de `app.html`. Não anuncia
na primeira carga, porque aí o leitor já lê o título, nem quando só a busca muda.

**Imagens: descrição onde informa, silêncio onde é enfeite.**
- As ilustrações dos três passos da página inicial são enfeite, porque o texto do lado já diz
  tudo: têm `alt=""`, e o leitor pula.
- A foto ou a inicial de uma pessoa (o componente `shared/avatar/avatar.ts`) aparece sempre ao
  lado do nome escrito. Por isso ela é escondida do leitor (`aria-hidden`). Antes, ele lia
  "B, Bernardo" ou "Bernardo, Bernardo". O mesmo vale para a foto grande do cartão de mentor
  (`features/mentores/mentores.html`), que tem o nome logo abaixo.
- Ícones que só enfeitam (o ✓, o relógio, os desenhos da verificação de e-mail) também são
  escondidos do leitor com `aria-hidden`.
- A animação da tela de entrar é um botão com descrição em palavras: "Você com dúvidas encontra
  um mentor que quer ensinar. Repetir animação."

**Botões e links repetidos dizem de quem são.** Na lista de mentores há vários "Ver perfil e
horários"; no lado da mentora, vários "Aceitar" e "Recusar". Quem enxerga sabe pelo cartão; quem
ouve só ouvia "Aceitar, Aceitar". Agora cada um diz o que é: "Aceitar o pedido de Bernardo,
Configuração de Servidores de Rede". O texto que aparece na tela continua dentro do nome, então
quem usa comando de voz ("clicar em Aceitar") também é atendido.

**Erro de formulário é dito, não só pintado.**
- Todo erro é uma frase escrita ("Escolha uma matéria para continuar"), nunca só uma borda
  vermelha.
- O erro fica ligado ao campo (`aria-describedby`), e o campo é marcado como inválido
  (`aria-invalid`). Ao chegar no campo, o leitor diz: "E-mail, inválido, Informe um e-mail
  válido".
- Mensagens que aparecem de repente usam `role="alert"`, que o leitor lê na hora: erro de
  carregamento, pedido que não pôde ser enviado, horário que acabou de ser ocupado.
- Ao tentar enviar com erro, o foco vai até o aviso (tela de entrar e cadastro) ou até o primeiro
  campo errado (Minha conta), para a pessoa não ficar sem saber o que aconteceu.

**Escolhas dizem se estão marcadas.** Os botões de semestre, matéria, turno, modalidade e horário
funcionam como botões de ligar e desligar, e dizem ao leitor se estão marcados (`aria-pressed`).
O ✓ que aparece na tela é só visual.

**O status do pedido é escrito por extenso.** "Aguardando resposta", "Aceito", "Recusado",
"Expirado", "Cancelado": o componente `shared/status` mostra a palavra, e a cor é um reforço. É
um requisito do caderno de IHC e serve igual para quem não vê cor.

**Contagens são anunciadas.** Na pilha de cartões, "2 de 5"; no carrossel da página inicial,
"2 de 10 · Bruno". Os dois ficam em regiões que o leitor lê quando mudam.

## Quem usa só o teclado

**Tudo o que se faz com o mouse dá para fazer com o teclado.** Isso foi conferido em 2026-09-27,
tela por tela, apertando só Tab, Enter, Espaço, Esc e as setas (ver "Percurso só com teclado",
abaixo).

**"Pular para o conteúdo".** É o primeiro item ao apertar Tab em qualquer tela: aparece no canto
de cima e leva direto ao conteúdo, sem passar pelo menu de novo. Está no começo de `app.html`.

**O foco sempre aparece.** Todo elemento que recebe o foco ganha um contorno azul de 3 pixels
(`:focus-visible` em `styles.scss`), com 6,78:1 de contraste contra o fundo da página.

**O foco não se perde.**
- Ao trocar de tela, se o botão usado sumiu, o foco vai para o começo do conteúdo, e não volta
  para o topo da página (`app.ts`).
- Ao passar para o próximo mentor na pilha de cartões, o foco vai para o nome dele.
- Ao pedir para recusar ou cancelar, o foco vai para a pergunta de confirmação; ao desistir, volta
  ao botão de onde saiu.
- O menu da conta abre com Enter, fecha com Esc devolvendo o foco ao botão, e fecha sozinho quando
  o foco sai dele com Tab.

**O gesto de arrastar tem botão equivalente.** Na pilha de cartões, arrastar para o lado é só um
atalho no celular; os botões "Pular", "Voltar ao anterior" e "Ver perfil e horários" fazem o mesmo.
E existe o modo "Em lista", que mostra todos os mentores de uma vez.

**O carrossel funciona com as setas.** Na página inicial, o carrossel de mentores recebe o foco e
anda com as setas do teclado, além dos botões "Anterior" e "Próximo".

## Quem enxerga com dificuldade, ou não distingue cores

**Contraste medido.** A WCAG pede no mínimo 4,5:1 para texto e 3:1 para borda de campo e ícone.
Os valores abaixo foram recalculados em 2026-09-27 a partir das cores de `styles.scss`:

- texto principal sobre o branco: 16,27:1; sobre o fundo da página: 14,08:1;
- texto suave sobre o branco: 7,53:1; sobre o fundo da página: 6,51:1;
- azul dos links e botões secundários sobre o branco: 7,84:1; sobre o fundo: 6,78:1;
- texto branco no botão laranja "Pedir ajuda": 5,19:1; no mesmo botão com o mouse em cima: 6,42:1;
- borda de campo de texto sobre o branco: 3,66:1; sobre o fundo da página: 3,17:1;
- status "Aguardando resposta": 5,95:1; "Aceito": 5,75:1; "Recusado", "Expirado" e os
  outros: 6,58:1;
- mensagem de erro sobre o fundo rosado: 5,75:1; texto branco no botão vermelho de cancelar:
  6,57:1;
- ciano da marca: só sobre o azul escuro do cabeçalho (5,48:1). Sobre o branco ele não serve para
  texto, e não é usado assim;
- laranja exato da marca: 3,15:1 sobre o branco. Não serve para texto; por isso o botão usa um
  laranja mais escuro.

Observação: alguns comentários em `styles.scss` ainda mostram os números do fundo antigo da página
(por exemplo, "5,80:1 sobre o fundo" para o texto suave). Os valores atuais são os desta lista, e
todos são iguais ou melhores que os antigos.

**Link dentro de frase é sublinhado.** Só a cor não bastaria: o azul do link tem 2,07:1 contra o
texto preto em volta, abaixo dos 3:1 exigidos. O sublinhado foi declarado de propósito
(`DECISOES.md`, 2026-09-22).

**Nada depende só de cor.** Status, erro e seleção têm sempre palavra ou símbolo junto.

**Texto do corpo com 16 pixels no mínimo** (`--texto-corpo` em `styles.scss`), e títulos maiores.

## Quem usa celular

- O sistema foi desenhado primeiro para uma tela de 360 pixels e depois ampliado.
- Todo botão e link de ação tem no mínimo 44 por 44 pixels (`--alvo-toque`), o tamanho de um dedo.
- Com a tela estreitada até 320 pixels, nada exige rolar para o lado. Foi medido
  (`DECISOES.md`, 2026-09-22, critério Reflow da WCAG).

## Quem passa mal com movimento

Se a pessoa ligou no sistema operacional a opção "reduzir movimento", o site obedece
(`prefers-reduced-motion`):
- uma regra geral em `styles.scss` desliga animações e transições no site inteiro;
- a animação do encontro na tela de entrar não roda (`features/auth/auth.scss`);
- a chave de Minha conta muda de posição sem deslizar (`features/conta/conta.scss`).

## Quem se perde com facilidade

Não é só técnica; também é texto e fluxo:
- palavras do aluno: "matéria", "semestre", "pedir ajuda", "marcar sessão". Nunca "match" ou
  "score";
- todo campo tem um rótulo escrito que não some ao digitar (o texto cinza de exemplo nunca é o
  único rótulo);
- nenhum erro apaga o que a pessoa preencheu, e toda etapa tem "Voltar" sem perda;
- toda tela que busca dados mostra quatro situações: carregando, vazio (com explicação e saída),
  erro (com "Tentar de novo") e sucesso;
- ações que não têm volta pedem confirmação: recusar um pedido, e cancelar uma sessão já aceita,
  que pede duas etapas.

## Percurso só com teclado (2026-09-27)

Feito no Chromium, apertando Tab do topo ao fim de cada tela e anotando onde o foco parava, se
aparecia e se tinha contorno. Telas: página inicial, entrar, cadastro, verificar e-mail, termos,
início (aluno e mentora), pedir ajuda, mentores (pilha e lista), perfil do mentor, pedido e Minha
conta. Também foram feitos, só com teclado: enviar um pedido, abrir e fechar o menu da conta,
recusar e desistir, e andar pelo carrossel.

Resultado: nenhuma armadilha de foco (o foco sempre chegou ao fim da página e saiu dela), nenhum
elemento focado invisível e nenhum foco sem contorno. Três coisas foram corrigidas no caminho,
no mesmo dia: o foco que se perdia ao trocar de tela, o menu que ficava aberto quando o foco saía
dele, e os botões repetidos sem nome próprio.

## Surdos e pessoas com baixa audição

**O sistema não tem áudio nem vídeo.** Nenhuma informação depende de ouvir: não há som de aviso,
vídeo de apresentação nem chamada de voz (videochamada está fora do escopo). Tudo é texto.

**O sistema não pergunta nem guarda que tipo de deficiência a pessoa tem.** Isso seria dado
sensível de saúde, que a LGPD protege de forma especial (artigo 11), num sistema com alunos
menores de idade. Guardar uma categoria como "surdo" criaria um cadastro de saúde que o sistema
não precisa ter para funcionar.

**A decisão pedida:** a necessidade de comunicação é dita pela própria pessoa, do jeito dela, no
pedido, e não guardada como categoria. Assim quem precisa diz o que precisa ("prefiro conversar
por escrito", "leio lábios, fale de frente"), e só o mentor daquele pedido fica sabendo.

**O que ainda falta decidir (a decidir com o Luã).** Hoje o pedido NÃO tem campo de texto livre.
A especificação da tela "Preciso de ajuda em…" escolheu opções prontas ("Entender o conteúdo",
"Resolver exercícios", "Revisar para a prova") e não texto livre, de propósito, porque há menores
de idade: texto livre entre um menor e um colega que ele não conhece abre espaço para contato e
conteúdo que ninguém modera. As duas regras batem de frente. Caminhos possíveis:
- uma opção pronta a mais, neutra, como "Prefiro combinar por escrito". Resolve para quem é surdo
  e também para quem é tímido ou está num lugar barulhento, sem texto livre e sem dado de saúde.
  É o caminho recomendado;
- um campo livre curto, com aviso para não escrever dado pessoal. Atende melhor casos
  específicos, mas desfaz a decisão da especificação e exige pensar em moderação.
Até a escolha, a pessoa só consegue dizer como prefere se comunicar depois do aceite, pelo contato
institucional.

## O que ainda falta, ou não foi verificado

- **Nenhum teste com leitor de tela de verdade** (NVDA, Orca, TalkBack). O que foi conferido é o
  que o código entrega ao leitor (nomes, estados, regiões de anúncio) e o percurso por teclado.
  Ouvir o sistema num leitor real é o próximo passo antes de afirmar que ele funciona bem assim.
- **A contagem regressiva do bloqueio de login** ("Tente novamente em 12 segundos") está numa
  região que o leitor lê quando muda, e ela muda a cada segundo. Pode virar uma fala sem fim. Fica
  na tela de entrar, que não foi tocada nesta rodada.
- **Os horários do perfil** são botões de marcar, e não um grupo de opções em que só uma vale
  (grupo de rádio). Funcionam e dizem se estão marcados, mas o leitor não avisa que marcar um
  desmarca o outro.
- **Os comentários de contraste antigos** em `styles.scss` (ver a observação na seção de
  contraste).
- **O campo para dizer como a pessoa prefere se comunicar**, na seção anterior.
