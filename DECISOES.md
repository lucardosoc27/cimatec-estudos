# Decisões de projeto — divergências em relação ao caderno de IHC

Este arquivo registra toda decisão em que a implementação do Cimatec Estudos se afasta
do que foi previsto no caderno de Interação Humano-Computador entregue à instituição.
Cada entrada diz o que o caderno previa, o que foi decidido, a justificativa técnica e
o impacto para quem usa o sistema. O objetivo é que a banca consiga rastrear cada
diferença entre o projeto de interface e o produto entregue, e julgar se a justificativa
se sustenta.

As entradas ficam em ordem cronológica. Nenhuma é apagada: se uma decisão for revertida,
entra uma nova entrada dizendo isso e apontando para a anterior.

---

## 2026-09-07 — Saída "me avise quando aparecer" retirada da lista vazia

**O que o caderno previa.** O Achado 02 estabelecia que uma lista de mentores vazia
nunca aparece sem explicação e sem saída alternativa, e previa três saídas: mudar o
turno, ver matérias parecidas e "me avise quando aparecer um mentor".

**O que foi decidido.** A tela de lista vazia mantém duas saídas: mudar o turno e ver
matérias parecidas. A terceira foi retirada do MVP. Quando existe mentor verificado da
mesma matéria em outro turno, a tela também mostra esses mentores em uma seção
"disponíveis em outros turnos", como forma concreta de "mudar o turno".

**Por quê.** "Me avise quando aparecer" exige que o sistema guarde o interesse do aluno,
detecte mais tarde a entrada de um mentor compatível e avise o aluno por um canal fora
da tela, como e-mail ou notificação. Isso é processamento assíncrono com infraestrutura
própria, fora do escopo do MVP. Manter o botão sem essa infraestrutura faria a interface
criar uma expectativa que o sistema não cumpre, o que corrói a confiança do usuário.

**Impacto para o usuário.** O aluno que não encontra mentor continua com saída imediata
e acionável, mas perde a opção de "esperar avisado". A seção de outros turnos reduz esse
custo, porque mostra na hora uma alternativa real em vez de uma promessa futura.
A funcionalidade fica registrada como evolução natural para depois do MVP.

---

## 2026-09-07 — Status "Enviado" não é um estado persistido

**O que o caderno previa.** Cinco status de pedido, sempre escritos por extenso:
Enviado, Aguardando resposta, Aceito, Recusado e Expirado.

**O que foi decidido.** O modelo de dados persiste quatro desses estados, Aguardando
resposta, Aceito, Recusado e Expirado, e acrescenta Cancelado. "Enviado" não é um estado
do pedido: é o título da tela de confirmação. Logo após enviar, o aluno vê o título
"Pedido enviado" e, abaixo dele, o status "Aguardando resposta" com o prazo de 48 horas.

**Por quê.** No MVP não existe o lado do mentor no sistema; a resposta é simulada.
Sem esse lado, não há um evento que separe "enviado" de "aguardando resposta": o pedido
passa a aguardar no mesmo instante em que é criado. Manter dois estados idênticos no
banco criaria uma transição sem causa, difícil de explicar e de testar. "Cancelado"
precisou entrar porque a tela de status permite cancelar o pedido, e o cancelamento
precisa ficar visível e distinguível de recusa e de expiração.

**Impacto para o usuário.** Nenhuma perda de informação: a confirmação de envio continua
explícita, e o status continua sempre visível e por extenso, agora com cinco valores
possíveis (Aguardando resposta, Aceito, Recusado, Expirado, Cancelado). Se um dia o lado
do mentor for implementado e passar a fazer sentido distinguir "enviado" de "visto pelo
mentor", basta acrescentar o estado sem mudar a tela.

---

## 2026-09-07 — Filtro de mentor não verificado roda no cliente durante o MVP

**O que o caderno previa.** Mentor não verificado nunca aparece nas recomendações.

**O que foi decidido.** Na fase de mock, em que os dados vêm de um arquivo JSON servido
junto com o front-end, o filtro que esconde mentores não verificados roda no navegador,
dentro do serviço Angular. Na fase 2, quando existir o back-end, o endpoint público de
mentores simplesmente não devolve mentores não verificados; o filtro passa a ser do
servidor.

**Por quê.** Durante o MVP não há servidor de aplicação; o único lugar onde é possível
filtrar é o cliente. Mas o arquivo JSON inteiro é baixado pelo navegador, e qualquer
pessoa consegue lê-lo pelas ferramentas de desenvolvedor. Ou seja: no MVP a regra é
atendida na tela, mas não é uma garantia de segurança. Fica registrado aqui para que a
diferença entre "a tela esconde" e "o servidor não entrega" seja explícita, e para que
a migração na fase 2 seja uma obrigação, não uma melhoria opcional.

**Impacto para o usuário.** Nenhum na interface: em nenhuma das fases o aluno vê mentor
não verificado. O impacto é de exposição de dados: no MVP, o nome de um mentor não
verificado está no arquivo de mock. Por isso o mock usa apenas pessoas fictícias, e
nenhum dado real entra no repositório, em conformidade com a política de LGPD do projeto.

---

## 2026-09-15 — Turno passa a ser obrigatório na tela "Preciso de ajuda em…"

**O que o caderno previa.** Cadastro mínimo: matéria e turno bastam para usar; a regra
de bloqueio citava apenas "não avançar sem ao menos uma matéria selecionada".

**O que foi decidido.** Matéria e pelo menos um turno são obrigatórios para avançar.
Modalidade é opcional, com "Tanto faz" como padrão. A tela continua sendo uma só, com
três perguntas e sem campo de texto livre.

**Por quê.** A ordenação da tela de mentores recomendados e o motivo exibido em cada
recomendação ("livre terça à tarde") dependem do turno escolhido. A saída "disponíveis
em outros turnos" da lista vazia também pressupõe que um turno foi escolhido. Sem turno,
a lista viraria um catálogo sem critério, o que contraria o achado do caderno sobre
motivo visível em cada recomendação.

**Impacto para o usuário.** Um toque a mais antes do primeiro resultado. Quando o aluno
tenta avançar sem preencher, a tela lista o que falta em texto, sem apagar o que já foi
marcado. Modalidade não é exigida, então o mínimo continua pequeno: uma matéria e um turno.

---

## 2026-09-15 — "Pedir ajuda" é a ação de entrada; botões de etapa dizem o que vem a seguir

**O que o caderno previa.** Ação principal chamada "Pedir ajuda" em todas as telas.

**O que foi decidido.** "Pedir ajuda" é o botão do cabeçalho, presente em toda tela, e
inicia o fluxo. Dentro do fluxo, o botão de cada etapa descreve o que acontece ao
clicar: na tela "Preciso de ajuda em…" ele se chama "Ver mentores"; na tela do mentor,
onde o pedido é de fato enviado, o botão volta a se chamar "Pedir ajuda".

**Por quê.** Um botão "Pedir ajuda" que leva a uma lista de mentores, sem enviar pedido
algum, promete o que não faz. A heurística de correspondência entre o sistema e o mundo
real pede que o rótulo diga a consequência do clique. O nome único fica reservado para
o ponto de entrada e para o envio, que são os momentos em que o aluno de fato pede.

**Impacto para o usuário.** O aluno vê "Pedir ajuda" em todas as telas, no cabeçalho, como
o caderno previa. Os botões intermediários ganham nomes mais precisos, e o botão que
envia o pedido mantém o nome esperado.

---

*As nove entradas abaixo, todas de 2026-09-20, vieram de uma rodada de decisões que o autor
tomou de uma vez, antes de qualquer código. Diferem das anteriores porque não são
divergências de uma prescrição do caderno de IHC: são escopo novo, que o caderno não
cobria, e comportamento para esse escopo novo. Por isso "Contexto" substitui "O que o
caderno previa" — não há prescrição anterior para comparar.*

## 2026-09-20 — Landing page pública, antes do login

**Contexto.** O escopo travado no `CLAUDE.md` começa no login: dez telas, sem página pública
de entrada. Esta é uma tela nova, fora das dez originais.

**O que foi decidido.** Existe uma landing page pública, antes do login, que mostra
mentores como vitrine.

**Por quê.** Um fluxo que começa direto no login é hostil para quem nunca ouviu falar do
sistema: não há nada para ver antes de criar conta. A landing ataca o risco de mercado de
dois lados — ninguém adere a um marketplace que parece vazio — porque quem chega vê, sem
precisar se cadastrar, que há gente de verdade usando o sistema.

**Impacto para o usuário.** Visitante sem conta passa a ver mentores e seus perfis (ver
decisão de "perfil em modo sem critérios", abaixo) antes de decidir se cadastra. Para o
aluno já cadastrado, a landing não muda o fluxo existente.

**Impacto no prazo.** Mais uma tela fora do escopo original, num TCC individual com prazo
de semanas. O autor foi alertado sobre esse custo antes de decidir manter o item.

---

## 2026-09-20 — Favoritar mentores

**Contexto.** Fora do escopo original de dez telas.

**O que foi decidido.** O card do mentor ganha um ícone de coração para favoritar,
disponível em qualquer lugar onde o card aparece.

**Por quê.** Permite ao aluno voltar a um mentor de interesse sem refazer a busca.

**Impacto para o usuário.** Um alvo de toque novo no card, sempre acompanhado de texto
(regra de acessibilidade do projeto: nenhum ícone de ação sozinho).

**Detalhe em aberto.** Se favoritar exige cadastro, e onde o favorito fica guardado
(conta do aluno, quando existir back-end, ou algo local antes disso) ficam para decidir
na implementação.

---

## 2026-09-20 — Cadastro de mentor fica registrado como escopo futuro; a ordem combinada não muda

**Contexto.** O autor trouxe um novo item de escopo: página explicando o que é ser mentor
(responsabilidades, verificação de vínculo) e cadastro de mentor (matérias, descrição,
horários livres). Isso conflita com o combinado desta mesma conversa: o próximo passo já
decidido era uma resposta simulada do mentor, para a tela 5 poder mudar de status sem que
o lado do mentor exista de verdade.

**O que foi decidido.** O cadastro de mentor, e a página que o explica, ficam registrados
como escopo futuro. Não são construídos agora. A ordem combinada — extração (feita),
resposta simulada do mentor, back-end de autenticação — continua valendo sem mudança.

**Por quê.** Construir o cadastro de mentor de verdade agora tornaria a resposta simulada
desnecessária, mas é bem mais trabalho, e o prazo do TCC não permite abrir essa frente
antes de terminar o que já estava em andamento. Adiar preserva o plano em curso e mantém o
cadastro de mentor como decisão documentada, não esquecida.

**Impacto para o usuário.** Nenhum agora: a tela 5 segue usando resposta simulada, como já
estava planejado. Quando o cadastro de mentor for construído, ele deve alimentar o mesmo
modelo de dados que a simulação já usa (`Mentor`, `SeloMateria`, `HorarioLivre`), então a
migração deve ser só de origem do dado, não de modelo.

---

## 2026-09-20 — Cadastro sem escolha de papel; virar mentor é ação separada, com verificação automática

**Contexto.** O modelo `Usuario` já representa papéis como lista (`papeis: Papel[]`),
permitindo que a mesma pessoa seja aluno e mentor. Faltava decidir o fluxo de cadastro e o
que dispara a verificação de mentor.

**O que foi decidido.** Todo cadastro entra como aluno. Virar mentor é uma ação separada,
que dispara a verificação de vínculo institucional. Essa verificação é automática, por
confirmação do e-mail institucional — sem espera nem aprovação manual.

**Por quê.** Mantém o cadastro mínimo, no mesmo espírito da regra já existente para o
fluxo principal, e evita construir um painel de aprovação manual — que exigiria uma conta
de staff fora do escopo do MVP.

**Limitação conhecida — antifraude.** Assumindo má-fé, como a seção de reputação do
projeto pede: verificação só por e-mail institucional confirma que a pessoa é da
instituição, não que ela sabe a matéria que diz ensinar. Qualquer aluno matriculado pode
se declarar mentor de qualquer matéria e aparecer verificado na hora. Isso fica registrado
como limitação aceita do MVP, não como algo resolvido. Um jeito futuro de atenuar isso sem
aprovação manual: a reputação por sessão confirmada (já decidida) já sinaliza ao aluno
quando um mentor é novo, porque aparece sem nenhum selo.

**Impacto para o usuário.** Sem campo novo obrigatório no cadastro. Virar mentor é
imediato depois de confirmar o e-mail institucional.

---

## 2026-09-20 — Perfil do mentor em "modo sem critérios"

**Contexto.** O perfil do mentor (tela 4) hoje só existe a partir de uma busca com matéria
e turno já escolhidos (tela 3), e destaca os horários compatíveis com esses critérios. Com
a landing pública (decisão acima), um visitante pode chegar direto ao perfil sem ter
escolhido nada.

**O que foi decidido.** Sem critérios de busca, o perfil mostra nome, curso, semestre,
selo de verificado, descrição, matérias com contagem de sessões e todos os horários
livres, sem destacar compatibilidade com nada.

**Por quê.** Não existe "horário compatível" para destacar quando não existe critério
vindo da tela 2. Mostrar tudo, sem destaque, evita fingir uma comparação que não
aconteceu.

**Impacto para o usuário.** O visitante vê o perfil completo, mas para pedir ajuda precisa
dizer matéria e disponibilidade (ver decisão sobre o botão "Pedir ajuda", abaixo).

---

## 2026-09-20 — Botão "Pedir ajuda" não aparece no perfil para visitante sem cadastro

**Contexto.** Foram consideradas duas formas de o visitante sair do perfil de um mentor em
direção a pedir ajuda: (a) esconder o botão "Pedir ajuda" e apontar para a busca na
landing; (b) manter o botão visível, levando ao fluxo de pedir ajuda com a matéria
pré-preenchida, e só exigir cadastro/login na hora do envio. A opção (b) preserva mais o
contexto de quem já está vendo um mentor específico, e foi apontada como a mais usável
antes desta decisão ser fechada.

**O que foi decidido.** Opção (a): o botão não aparece para quem não tem cadastro. No
lugar dele, uma linha curta com link para a landing: "Para pedir ajuda, comece pela busca
na página inicial." A opção (b) fica registrada como alternativa considerada e **guardada
em reserva**, não descartada — pode voltar a ser avaliada depois.

**Por quê.** O autor optou por manter o fluxo de pedido de ajuda inteiramente dentro da
conta logada, sem pré-visualizar o formulário para quem ainda não tem cadastro, mesmo
sabendo do custo de usabilidade da opção (a) frente à (b).

**Impacto para o usuário.** Visitante sem cadastro vê o perfil, mas precisa voltar à
página inicial e refazer a escolha de matéria e disponibilidade para pedir ajuda; o
contexto de estar vendo aquele mentor específico não é preservado automaticamente nessa
volta.

---

## 2026-09-20 — Selo qualitativo de destaque na recomendação, sem número

**Contexto.** O caderno de IHC já pede motivo em texto para cada recomendação, e o projeto
proíbe explicitamente vocabulário de "match"/"score" na interface — regra já implementada
na tela 3, com a lista de motivos ("mesma matéria • livre terça à tarde • 8 sessões"). Foi
cogitado acrescentar um indicador de compatibilidade em percentual ou selo numérico.

**O que foi decidido.** Um selo qualitativo, sem número — por exemplo "Combina bem com
você" — aparece nos primeiros resultados da lista de recomendados. Os motivos em texto
continuam exatamente como já construídos, logo abaixo do selo.

**Por quê.** Um percentual passaria uma precisão que o cálculo de recomendação não tem: a
ordenação é por regra (mais horários compatíveis, depois mais sessões concluídas na
matéria, depois nome), não uma pontuação fracionária que justifique um número. **O
percentual foi considerado e descartado por esse motivo.** O selo qualitativo cumpre o
mesmo objetivo — deixar visível que a ordem vem de cálculo, não de acaso — sem número e
sem entrar no vocabulário já proibido no projeto.

**Impacto para o usuário.** Nenhuma mudança na lista de motivos já existente. Os primeiros
mentores da lista de recomendados ganham um selo textual adicional; os demais (inclusive
"disponíveis em outros turnos") não.

**Detalhe em aberto.** Quantos mentores no topo recebem o selo (por exemplo, só o
primeiro, ou os três primeiros) fica para decidir na implementação.

---

## 2026-09-20 — Portfólio e "projetos" são a mesma peça

**Contexto.** O escopo original (telas 9 e 10) já previa portfólio público e sua edição,
para aluno e mentor.

**O que foi decidido.** Portfólio e "projetos" não são seções separadas: são a mesma peça,
com uma prévia no perfil e uma página própria, valendo tanto para aluno quanto para
mentor.

**Por quê.** Evita duplicar o mesmo conteúdo (descrição, habilidades, link, contato) em
dois lugares com nomes diferentes, o que confundiria tanto quem edita quanto quem lê.

**Impacto para o usuário.** Nenhuma mudança no que já estava previsto para as telas 9 e
10; só evita um formulário duplicado.

---

## 2026-09-20 — Fotos de perfil geradas por IA nos dados de teste, com avatar de iniciais como reserva

**Contexto.** Mais cedo nesta mesma conversa, antes deste bloco de decisões, ficou fechado
que o cartão do mentor usa avatar com iniciais e paleta fixa de cores no MVP, sem foto e
sem upload, justamente para não depender de arquivo de imagem nem abrir questão de
armazenamento ou LGPD antes do back-end existir.

**O que foi decidido.** Fotos de perfil geradas por IA, com uso autorizado pelo professor,
passam a ser a imagem principal do mentor em todos os lugares onde ele aparece: cards da
landing, lista de mentores, perfil e carrossel. O avatar com iniciais não é substituído:
continua existindo como reserva, para quando o mentor não tiver foto — o caso de qualquer
usuário novo.

**Por quê.** Reforça a identidade visual do mentor mais do que iniciais sozinhas
conseguem, sem reabrir o problema que a decisão original evitava: como as fotos são
geradas por IA para dados de teste, e não fotos reais de pessoas, não há dado pessoal
sensível em mock nem exposição de imagem de aluno de verdade — o que mantém a conformidade
com a regra de LGPD do projeto ("dados de teste sempre fictícios").

**Impacto para o usuário.** Nenhum na fase de mock: são dados de teste. Quando o back-end
existir, um mentor sem foto enviada continua caindo no avatar de iniciais — a decisão
original não muda, só ganha um caso de uso a mais para quando existir foto de verdade.

**Pendência.** Origem e forma de guardar as imagens de IA usadas nos dados de teste
(arquivo local em `assets/`, ou outra forma) ficam para decidir na implementação. Nenhuma
das nove decisões deste bloco foi implementada em código ainda — este registro é só a
decisão, como o autor pediu.

---

## 2026-09-21 — Tratamento visual entra antes da resposta simulada e do back-end

**Contexto.** A entrada de 2026-09-20 "Cadastro de mentor fica registrado como escopo
futuro; a ordem combinada não muda" reafirmou a sequência: extração (feita), resposta
simulada do mentor, back-end de autenticação. As cinco telas do fluxo principal foram
construídas com uma base visual provisória (paleta verde, fonte do sistema, cartões com
borda simples), suficiente para validar o fluxo, mas sem identidade.

**O que foi decidido.** A ordem muda: o tratamento visual do projeto vem agora, antes da
resposta simulada e antes do back-end. A resposta simulada continua sendo o passo seguinte;
o back-end continua depois dela. Esta entrada substitui, só nesse ponto, a ordem registrada
em 2026-09-20.

O bloco é tratamento visual, não reconstrução: muda paleta, tipografia, espaçamento,
cantos, sombra, estados de hover, tratamento de cada status e das telas vazias, e o
aproveitamento de tela grande. Não muda a estrutura dos componentes, os signals, os quatro
estados de tela, as regras de negócio nem o comportamento de foco. Qualquer mudança visual
que exigisse alterar estrutura passa por decisão explícita antes.

A base visual é o azul institucional do SENAI CIMATEC (azul escuro, azul principal, ciano
e laranja como cores de partida), ajustado onde for preciso para atender os limites de
contraste do projeto. Os ajustes de cor que se afastarem do tom institucional exato ficam
registrados em entrada própria, com os valores de contraste medidos.

**Por quê.** Com cinco telas prontas, trocar a base visual é barato; com as treze
previstas (dez do escopo original mais landing, favoritos e "quero ser mentor"), seria
mais que o dobro do trabalho, e cada tela nova teria de ser refeita. Fazendo agora, as
telas seguintes já nascem no padrão certo. O custo é adiar a resposta simulada e o
back-end por um bloco.

**Impacto para o usuário.** Nenhum requisito de interface do caderno de IHC muda:
contraste mínimo de 4,5:1 em texto e 3:1 em ícone e borda, alvo de toque de 44 px, corpo
de texto a partir de 16 px, status sempre escrito por extenso, foco visível, 360 px sem
rolagem horizontal. O que muda é a percepção: hierarquia mais clara, mais respiro, e
telas de desktop com largura de leitura confortável em vez de conteúdo espremido.

**Impacto no prazo.** Um bloco a mais antes da autenticação. O autor decidiu assumir
esse custo conscientemente, pelo motivo acima.

---

## 2026-09-21 — Laranja institucional escurecido para a ação principal

**Contexto.** A direção visual parte das cores do SENAI CIMATEC: azul escuro `#1B3E8C`,
azul principal `#1D4FA0`, ciano `#00D4E8` e laranja `#F26522`. O laranja foi escolhido
como cor da ação principal (botão "Pedir ajuda" e demais botões primários), para destacar
da base azul. O projeto exige contraste mínimo de 4,5:1 em texto.

**O que foi decidido.** O botão principal usa laranja escurecido `#BF4409` com texto
branco, e `#A83A07` no hover. O laranja institucional exato `#F26522` continua existindo
como token (`--cor-marca-laranja`), mas só para uso decorativo, nunca como fundo de texto
nem como cor de texto.

**Por quê.** Texto branco sobre `#F26522` dá **3,15:1**, abaixo do mínimo. Foram medidas
três saídas: (A) escurecer o laranja até passar, (B) manter `#F26522` com texto escuro
`#172033` (5,16:1) e (C) botão azul com laranja só em detalhe. A opção A foi escolhida
porque mantém o laranja como cor de ação, com texto branco, que é a convenção que o
usuário reconhece como botão. Na opção B, texto escuro sobre laranja lê mais como aviso do
que como ação; na C, a ação deixa de se destacar da base azul. Valores medidos para a
opção escolhida: branco sobre `#BF4409` = **5,19:1**; branco sobre `#A83A07` (hover) =
**6,42:1**; `#BF4409` como texto sobre branco = 5,19:1 e sobre o fundo `#F4F6FB` = 4,80:1.

**Impacto para o usuário.** O botão de ação lê como laranja, num tom um pouco mais
fechado que o da marca. Ganha-se legibilidade do rótulo em qualquer tela, inclusive sob
luz forte no celular.

---

## 2026-09-21 — Ciano institucional restrito a detalhe sobre azul escuro

**Contexto.** Mesma direção visual da entrada anterior. O ciano `#00D4E8` é uma das
quatro cores institucionais de partida.

**O que foi decidido.** O ciano existe como token (`--cor-marca-ciano`), mas só pode ser
usado como detalhe sobre fundo azul escuro `#1B3E8C`. Nunca aparece sobre branco nem sobre
o fundo claro da página, nem como texto, nem como borda, nem como ícone.

**Por quê.** Ciano sobre branco dá **1,81:1**, abaixo até do mínimo de 3:1 para ícone e
borda de campo. Sobre o azul escuro `#1B3E8C` dá **5,48:1**, o que permite usá-lo como
detalhe onde houver fundo azul escuro (por exemplo, um filete de destaque no cabeçalho, se
o cabeçalho for escuro). Manter o ciano como cor de texto ou de borda em fundo claro
violaria o requisito de contraste do caderno de IHC.

**Impacto para o usuário.** Nenhum negativo: o ciano fica reservado para onde é legível.
Toda informação continua vindo de texto e das outras cores, que passam nos limites.

---

## 2026-09-21 — Vermelho escuro como token para o botão de perigo

**Contexto.** As classes globais ganharam um terceiro modificador de botão, `.botao--perigo`,
para a confirmação de cancelamento na tela "Pedido enviado e status" ("Sim, cancelar
sessão" / "Sim, cancelar pedido"). O fundo é o vermelho de erro já existente, `#B42318`,
com texto branco (6,57:1). Faltava um tom para o hover e para o estado "ocupado"
(`Cancelando…`), porque a paleta só tinha tom escuro para o azul e para o laranja.

**O que foi decidido.** Entra o token `--cor-erro-escura: #9E1E13`, obtido aplicando ao
vermelho a mesma proporção de escurecimento que já existe entre `--cor-acao` (`#BF4409`) e
`--cor-acao-escura` (`#A83A07`). Branco sobre `#9E1E13` mede **7,93:1**. O token serve ao
hover e ao `:disabled` do botão de perigo; não é cor de texto nem de borda de campo.

Na mesma passada, o estado `:disabled` de todo `.botao` deixou de usar `opacity: 0.7`.
Medido: com opacidade, o rótulo "Enviando…" caía para **3,14:1** sobre a página e
**3,11:1** sobre cartão branco, abaixo do mínimo de 4,5:1. O botão ocupado passa a usar o
tom escuro do hover (laranja `#A83A07`, 6,42:1; vermelho `#9E1E13`, 7,93:1), sem sombra e
com `cursor: wait`. A opacidade não carregava informação: o rótulo já muda para
"Enviando…", o cursor já muda e o atributo `disabled` já bloqueia o segundo clique.

**Por quê.** O botão destrutivo é o que mais precisa de retorno claro no hover, e
escurecer o vermelho só aumenta o contraste do texto branco. Criar o token, em vez de
escrever o valor direto na classe, mantém todas as cores do projeto num só lugar, com o
contraste medido ao lado.

**Impacto para o usuário.** O botão que confirma o cancelamento lê como vermelho, diferente
do laranja de "Pedir ajuda", e escurece ao passar o mouse ou o foco. O botão ocupado
continua legível em qualquer tela.
