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
