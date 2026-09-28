# Especificação das telas para o código — Cimatec Estudos

Versão de 24/09/2026. Consolida tudo o que foi decidido no desenho (Stitch) para o Fable implementar em Angular.

## Como usar este arquivo

- **Os desenhos do Stitch são referência visual, nunca código.** Os prints aprovados ficam em `~/Documentos/stitch/aprovadas/`. Onde o print e este arquivo divergirem, **vale este arquivo**: o Stitch inventou coisas que foram removidas aqui.
- Tudo o que se repete entre telas (cabeçalho, rodapé, avatar, selo de status, cartão) é **componente único**. A inconsistência que aparece no Stitch entre uma tela e outra não deve passar para o código.
- Se algo aqui contradisser o `CLAUDE.md` ou o `DECISOES.md`, **pare e pergunte ao Luã** antes de escolher.
- Textos entre aspas são o texto exato da interface.

---

## 1. Mapa de rotas e fluxo

### Rotas públicas
| Rota | Tela |
|---|---|
| `/` | Landing (visitante) |
| `/entrar` e `/cadastro` | Login e cadastro (a mesma tela, com abas "Entrar" e "Criar conta") |
| `/verificar-email` | Verificação do e-mail (recebe `?token=`) |
| `/termos` | Termos de Uso e Política de Privacidade |

### Rotas privadas (negar por padrão, com guard)
| Rota | Tela |
|---|---|
| `/inicio` | Tela 1, Início (aluno e, se for o caso, mentor) |
| `/pedir-ajuda` | Tela 2, Pedir ajuda |
| `/mentores` | Tela 3, Mentores para você |
| `/mentores/:id` | Tela 4, Perfil do mentor e horários |
| `/pedidos/:id` | Tela 5, Pedido enviado e status |
| `/conta` | Minha conta (dados, consentimentos, exclusão). Decisão de 24/09 |

### Regras de navegação
- Sem login, qualquer rota privada manda para `/entrar?voltar=<rota>`. Depois do login, volta para a rota pedida, ou para `/inicio` se não havia rota.
- Logado que abre `/`, `/entrar` ou `/cadastro` vai para `/inicio`. *(Sugestão: confirmar com o Luã.)*
- O logo leva a `/` para o visitante e a `/inicio` para quem está logado.
- `/mentores` e `/mentores/:id` **dependem do pedido em andamento** (rascunho da tela 2). Sem rascunho, redirecionam para `/pedir-ajuda`.

### O fluxo completo
```
Landing → Criar conta → Verificar e-mail → Entrar
→ Início (tela 1) → Pedir ajuda (tela 2) → Mentores (tela 3)
→ Perfil e horários (tela 4) → Pedido enviado (tela 5) → Início, com o pedido aparecendo
```

**Lado do mentor (opção B, decisão de 24/09):**
```
Início → Pedidos que você recebeu → Aceitar / Recusar
→ o pedido vira sessão em "Suas próximas sessões"
```

### Rascunho do pedido (voltar sem perder dados)
Um serviço com signals (ex.: `PedidoRascunhoService`) guarda curso, semestre, matéria, "o que você precisa", turnos, modalidade, mentor escolhido e horário.
- Os links "Alterar pedido" (tela 3) e "Alterar" (tela 4) voltam para a tela 2 **com tudo preenchido**.
- O rascunho **não é persistido**: fica em memória. Some no logout e depois do envio.
- Regra do CLAUDE.md: **nenhum erro apaga o que foi preenchido**.

---

## 2. Componentes compartilhados

### Cabeçalho (componente único)
Visual:
- Fundo `#E8F0FB`, **sem sombra**, só uma linha inferior de 1px `#DFEBFC`. Ele parece fundido com o topo da página.
- **Esquerda**: o logo da landing (quadrado azul com ícone de livro), "Cimatec Estudos" com ponto laranja, e embaixo "MENTORIA ENTRE ALUNOS".

**Visitante:** à direita, "Entrar" (link) e "Criar conta" (botão secundário). **Nada mais**: nem "Como Funciona", "Explorar Mentores", "Sobre o Projeto" ou avatar, que o Stitch inventou nas telas de verificação. Os links de seção da landing, se existirem, são âncoras só dentro da landing.

**Logado (desktop):**
- Centro: links **"Início"** e **"Pedir ajuda"**. Nada de "Meus pedidos" (é o mesmo que Início) nem "Mentores" (a tela 3 é uma etapa do pedido, não uma seção).
- Link ativo: fundo `#E8EEF9`, texto `#1D4FA0`.
  - Tela 1: "Início" ativo.
  - Telas 2, 3 e 4: "Pedir ajuda" ativo (são o mesmo fluxo).
  - Tela 5: nenhum ativo.
- Direita: **só o primeiro nome** e o avatar, mais uma setinha que abre um menu com **"Sair"**.
  - Sem curso embaixo do nome.
  - Sem bolinha de "online".
  - Sem "Sair" solto no cabeçalho.
  - O menu tem **"Minha conta"** e **"Sair"**.
- Menu do avatar: abre com teclado, fecha com Esc e com clique fora, e **o foco volta ao avatar ao fechar**.

**Logado (celular):**
- Logo, avatar e um botão com ícone de três linhas **e o texto "Menu"** (o ícone de ação sempre acompanhado de texto).
- O menu tem "Início", "Pedir ajuda" e "Sair".
- Sem seta de voltar e sem título de página no cabeçalho. Sem barra de navegação inferior.

Armadilha: se o cabeçalho ficar fixo ao rolar, ele precisa de fundo sólido, senão o conteúdo passa por trás.

### Rodapé (componente único)
- Faixa de largura total, **último elemento da página**, sem nada abaixo dela.
- Fundo `#172033`, texto e links em `#CBD1DE`, com os links sublinhados.
- Texto: "© 2026 Cimatec Estudos • Projeto acadêmico desenvolvido por estudantes do SENAI CIMATEC."
- Links: "Termos de Uso" e "Política de Privacidade". No celular, os links ficam embaixo do texto.
- Nunca: "Serviço Institucional", "Sistema Integrado de Apoio", "oficial".

### Fundo das páginas
Azul bem claro `#E8EFFB`, de borda a borda, com duas manchas suaves:
- azul `#D5E6FC` no canto superior esquerdo;
- ciano `#DCF3FB` no canto inferior direito.

**Substitui o cinza `#DEE2EB` e o cabeçalho azul-escuro com filete ciano do commit `08957a9`. Registrar no DECISOES.md.**

### Cartão
Branco, cantos de 20px, borda `#CBD1DE` de 1px e sombra suave. Sobre o fundo azul-claro, a separação vem da sombra.

### Botões
- **Principal**: laranja `#BF4409` (hover `#A83A07`), texto branco, pílula, **com a setinha "→"** ("Ver mentores →", "Enviar pedido →", "Pedir ajuda →", "Voltar ao início →", "Aceitar →"). Um laranja por tela, como regra geral.
- **Secundário**: fundo branco, borda `#1D4FA0` de 2px, texto azul.
- **Perigo**: vermelho `#B42318`, com texto ("Sim, cancelar").
- Planos: sem relevo, sem efeito de dobra, sem sombra inclinada.
- **Link de texto é sempre azul**, nunca laranja.

### Opção selecionável (chips, turnos, modalidade)
- Normal: fundo branco, borda de 1px.
- Selecionada: fundo `#E8EEF9`, borda `#1D4FA0` de 2px **e ícone de check**. Nunca só cor.

### Avatar
- Com foto: a imagem preenche o círculo (`object-fit: cover`).
- **Sem foto (`foto: null`)**: círculo com a **inicial** do nome. É o avatar padrão de quem não autorizou foto. Na banca, mostra a regra de consentimento funcionando.
- **Nunca** um indicador de presença (bolinha verde, vermelha ou "Online"). É dado pessoal que o projeto não coleta.

### Selo de status (componente único; um par de cores por status, definido num lugar só)
Usar as pílulas `[data-status]` do `styles.scss`.

| Status | Texto (visão do aluno) | Cor do texto / fundo |
|---|---|---|
| enviado | "Enviado" | neutro `#4A5568` / `#EDF0F4` |
| aguardando | "Aguardando resposta" | alerta `#8A4B00` / `#FBEEDC` |
| aceito | "Aceito" (com check) | sucesso `#0B6B3A` / `#DDF5E6` |
| recusado | "Recusado" | neutro `#4A5568` / `#EDF0F4` |
| expirado | "Expirado" | neutro `#4A5568` / `#EDF0F4` |

- **Visão do mentor**: o status "aguardando" aparece como **"Aguarda sua resposta"**, com o mesmo par de cores.
- **Não existe status em ciano.** O ciano `#00D4E8` é só o selo "Sessão marcada" (ver as animações) e os detalhes decorativos.
- **A decidir com o Luã:** qual status tem um pedido cancelado? O CLAUDE.md lista só os cinco acima.

### Selo "Combina bem com você"
- Ícone de check em círculo, **o mesmo em todas as telas**.
- Vem com as etiquetas do que os dois têm em comum: "mesma matéria", "livre terça à tarde", "presencial ou online".
- Regra do `idDoMentorComSelo`: só o primeiro recomendado, e só se ele vencer o segundo por horário ou por sessões. Empate: ninguém recebe. Um recomendado só: ninguém recebe.

---

## 3. Tela a tela

Toda tela que busca dados tem os quatro estados obrigatórios: **carregando, vazio, erro, sucesso**. Lista vazia nunca aparece sem explicação e sem saída.

### Tela 1 — Início (`/inicio`)
Um Início só, com seções que aparecem conforme o papel. **Mentor também é aluno.**

- Título "Olá, <primeiro nome>". Aluno sem papel de mentor vê também o texto "Travou em alguma matéria? Um colega que já passou por isso pode ajudar."
- Botão principal "Pedir ajuda →" (no celular, em largura total abaixo do texto).

**Seções, nesta ordem, quando a pessoa é mentora:**
1. **"Pedidos que você recebeu"**: cartão por pedido pendente.
   - Avatar do aluno (inicial se não houver foto), "Nome · Curso".
   - Matéria, "o que você precisa", horário e local.
   - "Recebido <data>, às <hora> · responda até <data+48h>".
   - Selo "Aguarda sua resposta".
   - Botões "Aceitar →" (principal) e "Recusar" (secundário).
   - Vazio: "Nenhum pedido novo."
2. **"Suas próximas sessões"**: pedidos aceitos em que ela é a mentora, **em ordem de data**, com o selo "Aceito".
3. **"Pedidos que você fez"**: os pedidos dela como aluna. Vazio: "Nenhum pedido em andamento." + link azul "Pedir ajuda →".

**Quando a pessoa é só aluna:**
- **"Pedidos que você fez"**: cartão com a foto do mentor, o nome, a matéria, o horário, o selo de status e o link "Ver pedido →" (vai para a tela 5).
- **Vazio (primeira coisa que a banca vê depois do cadastro):** cartão centralizado com "Você ainda não pediu ajuda", o texto "Quando travar numa matéria, é por aqui que você encontra um colega do seu curso que já passou por isso." e o botão "Pedir ajuda →". Sem ilustração e sem números.

**Aceitar (fluxo do mentor):**
1. **Revalidar o horário no servidor.** Se a mentora já tem outra sessão aceita no mesmo horário, a aceitação é recusada com uma mensagem, sem perder nada.
2. Tocar a animação do encontro (ver a seção 5). No fim, o cartão mostra os dois avatares encostados com o selo ciano "Sessão marcada".
3. O cartão **sai de "Pedidos que você recebeu" e entra em "Suas próximas sessões"**, na posição da data.
4. Do lado do aluno, o pedido passa a "Aceito" e o contato é liberado.

**Recusar:** uma confirmação simples. O aluno vê "Recusado" na tela 5 com o mesmo layout do Expirado, **sem motivo exposto**.

Não existe nesta tela: estatísticas, gráficos, contadores ("2 ativos", "1 pendente"), selo "Mentora & Aluna", emoji, dicas, mentores sugeridos, chat ou mensagens.

### Tela 2 — Pedir ajuda (`/pedir-ajuda`)
Cartão com o título "Pedir ajuda" e o subtítulo "Conte o que você precisa e a gente mostra quem pode ajudar". Campos, nesta ordem:

1. **Curso**: seleção **pré-preenchida com o curso do cadastro**, que o aluno pode trocar. Os 9 cursos, nesta ordem: Desenvolvimento de Sistemas, Redes de Computadores, Biotecnologia, Química, Petroquímica, Eletromecânica, Edificações, Mecânica, Multimídia.
2. **Semestre**: em linha própria, de 1º a 4º. **Redes de Computadores e Multimídia só vão até o 3º.** É um **filtro, não é gravado** (decisão de minimização).
3. **Matéria**: chips com as matérias do curso e semestre escolhidos, tiradas de `materias-cursos-senai-ba.md`. **As unidades transversais do AVA não viram chip** (Saúde e Segurança, Sustentabilidade, Indústria 4.0, Qualidade e Produtividade, TIC). Os chips quebram linha. **Não dá para avançar sem uma matéria.**
4. **"O que você precisa" (opcional)**: "Entender o conteúdo", "Resolver exercícios", "Revisar para a prova". São chips e não texto livre, de propósito, porque há menores de idade.
5. **"Turnos disponíveis (marque um ou mais)"**: Manhã, Tarde, Noite.
6. **"Modalidade de encontro"**: Presencial (descrição "CIMATEC - Orlando Gomes"), Online, **Ambos**.

A partir de 48rem (768px), Turnos e Modalidade ficam lado a lado. O botão é "Ver mentores →", em largura total no celular.

Não existe nesta tela: prévia de "N mentores disponíveis", cards "100% Voluntário", "Resposta Rápida" ou "Ambiente Seguro".

### Tela 3 — Mentores para você (`/mentores`)
- "← Alterar pedido" (volta para a tela 2 preenchida).
- Título "Mentores para <matéria>" e o resumo "<turnos> · <modalidade>".
- Alternador "Pilha de cartões" / "Em lista".

**Pilha:**
- Cartão da frente com o **retrato ocupando o topo**. O selo "Combina bem com você" fica no topo da foto e as **etiquetas em comum na base da foto**.
- Abaixo da foto: nome, curso, "N sessões concluídas" (texto simples, sem estrelas) e o motivo: "Ensina <matéria> • livre <dia> à <turno>".
- **Dois cartões atrás**, aparecendo só as bordas, levemente inclinados, e marcados com `inert`.
- Contador "1 de N".
- Botões "Pular" (secundário) e "Ver perfil e horários →" (principal). O link "↺ Voltar ao anterior". O texto "Pular não avisa ninguém e não fica registrado."
- No celular, também "ou arraste o cartão para o lado". **O botão é o caminho principal e o arraste é atalho** (WCAG 2.5.1 e 2.5.7).
- O foco vai para o nome do próximo mentor.

**Em lista:** cartões horizontais com a foto em círculo, o nome, o curso, as sessões, o motivo e "Ver perfil e horários →". O selo aparece só em quem o recebeu.

**Vazio (obrigatório, porque a tela 2 não tem prévia):** "Nenhum mentor nesse turno." + a sugestão "Tente marcar mais turnos ou escolher Ambos na modalidade." + "← Alterar pedido".

Não existe nesta tela: "SENAI CIMATEC • Salvador", "Disponível esta semana", "Os mentores são alunos voluntários que já cursaram...", contagem "N disponíveis", "Rejeitar".

### Tela 4 — Perfil do mentor e horários (`/mentores/:id`)
- "← Voltar aos mentores" e a trilha **"Pedir ajuda › Mentores › <nome>"**.

**Cartão do mentor:**
- Retrato com o **ícone de chapéu de formando** embaixo da foto.
- Nome, curso ("Técnico em Redes de Computadores") e "SENAI CIMATEC - Orlando Gomes".
- **Sem semestre.**
- O selo "Combina bem com você" com as etiquetas, se for o caso, e "N sessões concluídas".
- **"Ensina"**: chips de matérias (só as matérias reais do curso).
- **"Um pouco sobre mim"**: texto curto escrito pelo mentor. Texto da Ana: "Faço o Técnico em Redes de Computadores no CIMATEC. Configuração de Servidores foi a matéria em que eu mais travei, e hoje é a que mais gosto de explicar, sempre com a prática junto."

**"Resumo do seu pedido":** matéria, "o que você precisa" e modalidade (mostrar **"Ambos"**, o nome da opção na tela 2, e não "Presencial ou Online"), mais o link "Alterar".

**"Escolha um horário":**
- **Só horários realmente livres**, no turno escolhido, agrupados por dia ("Terça, 29/09": 14h–15h e 15h–16h).
- Cada horário diz o local: **"CIMATEC - Orlando Gomes" ou "Online"**. Nenhum outro local (nada de Lab 04, Biblioteca, Sala de Estudos ou Teams).
- Aviso: "O contato da <nome> aparece depois que ela aceitar o pedido. Ela tem até 48h para responder."
- Botão "Enviar pedido →". No celular fica no fluxo da página, antes do rodapé. Botão fixo no rodapé só se o Luã pedir, e sem cobrir o último horário.

**Erro ao enviar (revalidação no servidor):**
- A mensagem "Esse horário acabou de ser ocupado. Escolha outro, o resto do seu pedido foi mantido."
- O horário ocupado fica riscado e desabilitado, com o selo "Ocupado".
- **Todo o resto continua preenchido.**

**Bloquear pedido duplicado:** se já existe um pedido em aberto para o mesmo mentor e a mesma matéria, avisar e mostrar o link para o pedido existente.

Não existe nesta tela: "Monitora oficial credenciada pelo Núcleo de Apoio Discente", "Em comum com sua grade", "Semana 40", "Recomendado logo a seguir", "Solicitação sem custo acadêmico", WhatsApp.

### Tela 5 — Pedido enviado e status (`/pedidos/:id`)
- Título "Pedido enviado para a <nome>" e "Enviado <data>, às <hora>".
- **Etapas com texto e ícone** (nunca só cor): Enviado → Aguardando resposta → Aceito. No celular, na vertical.
- O selo do status atual.
- Cartão resumo: o avatar do mentor, "Nome · Curso", a matéria, o horário e o local.

**Por status:**
- **Aguardando:**
  - "A <nome> tem até <data+48h> para responder. Se ela não responder até lá, o pedido expira e a gente sugere outros mentores."
  - "O contato da <nome> aparece aqui assim que ela aceitar."
  - Botões "Voltar ao início →" e "Cancelar pedido".
- **Aceito:**
  - "Contato liberado: e-mail institucional da <nome>", com o e-mail e o botão "Copiar e-mail".
  - **Só o e-mail institucional. Nunca telefone ou WhatsApp.**
  - O botão secundário vira "Cancelar sessão".
- **Cancelar sessão aceita, com confirmação em duas etapas:**
  - Uma janela "Cancelar a sessão com a <nome>?", com o texto "A <nome> já reservou esse horário para você. Ela vai ser avisada do cancelamento."
  - Botões "Manter sessão" e "Sim, cancelar" (perigo).
  - O foco fica preso na janela e **volta ao botão de origem ao fechar**.
- **Expirado:** "A <nome> não respondeu a tempo. Isso acontece, não é nada com você." + "Ver outros mentores →", que volta para a tela 3 **com o mesmo pedido preenchido**.
- **Recusado:** o mesmo layout do Expirado, com texto neutro e sem motivo.

### Login e cadastro (`/entrar`, `/cadastro`)
**Painel esquerdo:** marca e a **animação do encontro** (ver a seção 5).

**Aba "Entrar":**
- E-mail institucional e senha, com "mostrar senha" e o link "Esqueci minha senha".
- Botão "Entrar".
- Erro sempre genérico: "e-mail ou senha inválidos" (401), para senha errada e para e-mail inexistente; conta como tentativa.
- Conta com e-mail ainda não confirmado e senha certa (403): a mensagem do servidor ("Confirme seu e-mail institucional antes de entrar…") com o link "Pedir um novo link de confirmação →" para `/verificar-email`, com o e-mail já preenchido. Não conta como tentativa. Só aparece para quem provou a senha, então não revela se o e-mail existe.

**Aba "Criar conta":**
- O rótulo do primeiro campo é **"Nome"**, com o placeholder "Como quer ser chamado(a)". **Não** usar "Nome completo": pela minimização, o sistema não precisa do nome civil.
- O texto dos consentimentos termina com "Você pode mudar isso quando quiser em **Minha conta**" (o Stitch escreveu "no seu perfil").
- Campos: nome, **curso** (seleção obrigatória, **sem opção pré-escolhida**, texto "Selecione seu curso", os 9 cursos), e-mail institucional, senha com as regras visíveis e confirmar senha. **Sem campo de semestre.**
- Consentimentos:
  - obrigatório: termos e política;
  - opcionais, **nunca vêm marcados**: foto para quem está logado, e vitrine pública.
- O domínio do e-mail institucional vem da **configuração**, não fica fixo no código (o domínio real ainda não foi confirmado).
- **Sem login social** (Google, Facebook). Decisão de 24/09: o e-mail institucional é o que garante "Exclusivo CIMATEC". Login com conta pessoal abriria a plataforma para qualquer pessoa, e o Facebook traz problema de LGPD com menores. Login único com a conta institucional (SSO), com a TI do CIMATEC, vai para os **trabalhos futuros**.

### Verificar e-mail (`/verificar-email`)
- Depois do cadastro: "Enviamos um link para o seu e-mail."
- Na página do link, três estados: **verificado**, **link expirado** e **link já usado**.
- A verificação é por **POST** (um GET que muda estado pode ser disparado por pré-visualização de link).
- **O link vale por 24 horas** (decisão de 24/09).
- **Aprovado no Stitch**, com os textos exatos:
  - **Enviamos um link:** "Confira seu e-mail institucional" / "Enviamos um link de confirmação para <e-mail>. Clique nele para ativar sua conta. O link vale por 24 horas." / "Não chegou? Confira a caixa de spam." + "Reenviar link" + "Voltar para o login".
  - **Conta ativada:** check verde, "Conta ativada!" / "Seu e-mail institucional foi confirmado. Agora é só entrar." + "Entrar →".
  - **Link expirado:** relógio, "Esse link expirou" / "Por segurança, o link de confirmação vale por 24 horas. Peça um novo e confira seu e-mail." + "Enviar novo link →".
  - **Link já usado:** "Esse link já foi usado" / "Sua conta já está ativada. Se foi você, é só entrar." + "Entrar →".
- Na banca, o link sai **no console do Spring**, porque não há servidor de e-mail. As contas da demonstração (Ana e Bernardo) são criadas e verificadas antes, pelo próprio cadastro, e o H2 em modo arquivo guarda as duas.
- **Sem "modo demonstração"** que pule a verificação: seria uma porta dos fundos na segurança.

### Termos (`/termos`)
- Termos de Uso e Política de Privacidade, com base no guia do gov.br.
- Layout aprovado no Stitch:
  - título e "Versão 1.0 · atualizada em <data>" (a data da versão é comparada com a data do consentimento);
  - o cartão "Resumo em linguagem simples", com 5 itens;
  - o índice "Nesta página" (fixo à esquerda no desktop, recolhível no celular);
  - a Parte 1, Termos (5 seções), e a Parte 2, Privacidade (8 seções).
- O print do desktop saiu com **fonte serifada**, mas a página usa a **Plus Jakarta Sans**, como o resto do site. O selo "Transparência Acadêmica" do celular não entra.
- **O texto jurídico é escrito pela equipe**, com base no guia do gov.br. **O texto de exemplo do Stitch não entra no código.** Armadilhas que o Stitch escreveu e que o texto real não pode repetir:
  - "graduação": o projeto é de curso **técnico**;
  - "senha encriptada": a senha é guardada com **hash (BCrypt)**, que não é criptografia reversível. A banca pode pegar isso;
  - "nome civil completo": o cadastro pede só "nome";
  - domínio de e-mail inventado ("@fbter.org.br");
  - "notificações", "videochamada institucional", "painel do aluno": funcionalidades que não existem;
  - regra própria para menores "vinculada à matrícula": tirar do guia, não inventar.
- **Os direitos do titular precisam ser exercíveis.** Se a política disser que a pessoa pode corrigir ou excluir os dados, tem de existir o caminho: uma tela de conta com "excluir conta", ou um canal de contato real da equipe. **A decidir com o Luã.**

### Minha conta (`/conta`)
Existe para a Política de Privacidade ser verdadeira: os direitos do titular (ver, corrigir, retirar consentimento, excluir) precisam de um caminho no sistema. Decisão de 24/09. Acesso pelo menu do avatar.

- **"Seus dados":**
  - nome (editável);
  - e-mail institucional (não editável, com o texto "O e-mail institucional não pode ser alterado");
  - curso (seleção editável).
  - Botão "Salvar alterações".
- **"Ajudar colegas"** (decisão de 27/09, "virar mentor"):
  - "Quero receber pedidos de ajuda": chave liga/desliga, **sempre desligada numa conta nova**, com a data em que foi ligada.
  - Texto de apoio: "Você decide se aceita cada pedido."
  - Desligar volta a data para `null`, como nos consentimentos.
  - Com a chave ligada e sem matérias cadastradas, o aviso neutro: "Você ainda não cadastrou as matérias que quer ensinar, então não aparece na busca de quem pede ajuda. O cadastro de matérias não faz parte desta versão do Cimatec Estudos." (decisão de 27/09; quem tem matérias no mock não vê o aviso).
- **"Sua privacidade":**
  - Termos e Política: "Aceito em <data> (versão <n>)", com link para ler. É obrigatório e não tem chave.
  - "Mostrar minha foto para quem está logado": chave liga/desliga, com a data.
  - "Aparecer na vitrine pública da página inicial": chave liga/desliga, com a data. Texto: "Vale só para quem é mentor".
  - **Desligar tem efeito imediato**: a foto vira a inicial, e a pessoa sai da vitrine. O campo vira `null` na origem.
  - *Sem envio de foto nesta tela* (upload está fora do escopo).
- **"Excluir conta":**
  - O texto das consequências: "Seus dados e pedidos são apagados. Sessões já aceitas são canceladas e o mentor é avisado."
  - Botão de perigo "Excluir minha conta".
  - A confirmação é uma janela que **pede a senha**, com os botões "Excluir definitivamente" (perigo) e "Cancelar". O foco volta ao botão de origem ao fechar.
- **Back-end:** `GET /api/auth/eu` (já existe), `PATCH /api/conta` (nome e curso), `PATCH /api/conta/consentimentos`, `PATCH /api/conta/mentoria` (já existe, commit 5b) e `DELETE /api/conta` (com a senha).
- **Limitação já registrada:** o consentimento é um campo com data, não um histórico. Retirar o consentimento apaga a data anterior.

### Landing (`/`)
Aprovada no Stitch, mas **desatualizada** com as decisões de 24/09. Corrigir antes de implementar:
- As abas de curso têm "Internet das Coisas", que não é curso. Usar os 9 cursos reais.
- Tirar Cálculo e Física do campo de busca e do rodapé ("Matérias frequentes").
- O carrossel tem de usar **os mesmos mentores da lista de 18**, com o mesmo curso. Tirar o Lucas; a Beatriz é de Edificações. **Foto só com os dois consentimentos** (foto para quem está logado E vitrine pública); sem eles, a inicial. Revisto em 2026-09-28 (DECISOES.md); de 22/09 a 27/09 a regra era "sem foto".
- **Só entram no carrossel público os mentores com `vitrinePublicaEm`**: primeiro nome, curso, matérias e descrição, sem idade e sem horário; foto só para quem também tem `fotoParaLogadosEm` (revisto em 2026-09-28).
- Trocar o nome do depoimento "Bernardo", porque Bernardo é o usuário de exemplo.
- "Como funciona": ilustração no lugar das fotos, ou sem imagem.
- O rodapé diz "© 2025". Trocar para 2026.
- Subtítulo do topo: "colegas de graduação e técnico". O projeto é **só de curso técnico**: tirar "graduação".
- "Como funciona", passo 01: tirar "Cálculo" e "Física" dos exemplos.
- Rodapé da landing: tirar a coluna "Matérias frequentes" com "Cálculo Diferencial Integral" (ou trocar por matérias reais dos 9 cursos).
- A seção "Perguntas frequentes" pode ficar. As respostas dela entram na revisão do Luã: nada de promessa, nada de "oficial".
- Existe no canvas do Stitch uma landing antiga ("Plataforma gratuita... entre universitários"). **Ignorar**: vale a "Início — Cimatec Estudos (Visitante)".

---

## 4. Dados de demonstração (mock)

### Usuários de exemplo
- **Bernardo**: aluno, Redes de Computadores, **sem foto** (avatar "B"). Pedidos: com a **Ana** (Configuração de Servidores de Rede, Terça 29/09, 14h–15h, CIMATEC - Orlando Gomes, aguardando) e com o **Diego** (Instalação e Manutenção de Redes Corporativas, Quinta 01/10, 14h–15h, aceito).
- **Ana**: mentora **e** aluna, Técnico em Redes de Computadores, retrato com fundo ciano, "12 sessões concluídas".
  - Ensina: Configuração de Servidores de Rede; Instalação e Manutenção de Redes Corporativas; Infraestrutura de Redes de Computadores.
  - Recebeu o pedido do Bernardo.
  - Próxima sessão: com o **Pedro** (aluno sem foto, avatar "P"; Infraestrutura de Redes de Computadores; Quinta 01/10, 15h–16h; Online).
  - E-mail de exemplo: `ana@exemplo.com`, **claramente fictício**. Não inventar o domínio do CIMATEC.
- **Diego** e **Bruno**: mentores de Redes, com 5 e 3 sessões concluídas, livres quinta à tarde e quarta à tarde.

### Mentores (18; retratos em `mentor-<nome>.png`, fundo de cor viva)

| Curso | Mentores |
|---|---|
| Desenvolvimento de Sistemas | Gabriela + 1 a definir (lote 2) |
| Redes de Computadores | Ana, Diego, Bruno |
| Biotecnologia | Carla, Kaique |
| Química | Henrique, Jamile |
| Petroquímica | Rafael, Tainá |
| Eletromecânica | Matheus, Yasmin |
| Edificações | Beatriz, Caio |
| Mecânica | Thiago, Letícia |
| Multimídia | Júlia, Igor |

Eduarda e Felipe ficam como **não verificados**: não aparecem nas buscas.

**Decidido em 2026-09-27, revisto em 2026-09-28:** a vitrine pública mostra a foto só de quem deu
os dois consentimentos (foto e vitrine); os outros aparecem com a inicial (DECISOES.md, entrada
de 2026-09-28, que revê a de 2026-09-22). Hoje, 14 dos 18
mentores verificados têm `vitrinePublicaEm`; Diego, Carla, Henrique e Júlia não aparecem no
carrossel, e isso é esperado, não pendência.

**Decidido em 2026-09-28 (o Luã pediu a escolha):** ficam sem `fotoParaLogadosEm` o Diego, o Bruno
e a Beatriz, que têm retrato mas não consentiram mostrá-lo, e a Júlia, que não tem retrato. Assim
o avatar com a inicial aparece em `/mentores` e, com Bruno e Beatriz, também na vitrine.

### Cursos e matérias
Arquivo `materias-cursos-senai-ba.md`: grades reais do SENAI Bahia, com a fonte e o grau de confiança de cada uma. Química, Mecânica, Multimídia e Eletromecânica estão **a confirmar com a coordenação**.

---

## 5. Animações (sempre respeitando `prefers-reduced-motion`)

1. **Login, "Os dois se encontram"**. A especificação está em `animacao-a-v2.html`.
   - Dois avatares entram de lados opostos e se encostam, com um brilho ciano. O estudante troca de "preocupado" para "aliviado".
   - Os rótulos "você / com dúvidas" e "mentor / quer ensinar", e o selo "em comum".
   - Roda ao abrir e repete no hover, no toque ou com Enter (WCAG 2.2.2).
   - As imagens são decorativas (`alt=""`); a descrição fica no contêiner.
   - Com movimento reduzido, aparece direto o estado final.
2. **Aceitar pedido**, a mesma linguagem do login. O avatar do aluno e o da mentora deslizam um até o outro e se encostam, e no lugar de "em comum" surge **"Sessão marcada"** (selo ciano `#00D4E8`, texto `#172033`). Depois o cartão muda para "Suas próximas sessões". Este é o momento de banca que fecha a história do login.
3. **Status virando "Aceito"** (lado do aluno): o check se desenha no selo.
4. **Pilha de cartões**: o cartão sai para o lado no "Pular" ou no arraste, e o próximo sobe.

---

## 6. Back-end necessário para a opção B (lado do mentor)

Os pedidos saem do JSON público e vão para o Spring, depois da autenticação funcionar. Proposta mínima, a ser detalhada pelo Fable e aprovada pelo Luã:
- Entidade `Pedido`: aluno, mentor, matéria, "o que você precisa", modalidade, horário, local, status, criadoEm e datas de resposta.
- Endpoints:
  - criar, **revalidando o horário** e **bloqueando duplicado**;
  - listar os meus (como aluno);
  - listar os recebidos (como mentor);
  - aceitar, **revalidando o horário na agenda da mentora**;
  - recusar;
  - cancelar.
- **Expiração em 48h**: calcular na leitura (se o prazo passou, o status é expirado) é mais simples que um job agendado. Discutir.
- **Contato**: o e-mail só vem na resposta depois de aceito. **O dado não sai do servidor antes disso** (esconder no template não basta).
- Isso também resolve o alerta 4 da autenticação, porque os pedidos deixam de ser um arquivo público.

---

## 7. LGPD na interface (checklist)

- [ ] Sem indicador de presença ("online") em lugar nenhum.
- [ ] Cabeçalho só com o primeiro nome, sem o curso.
- [ ] Foto `null` vinda da origem quando não há consentimento. Avatar com inicial.
- [ ] Contato só depois do aceite, e só o e-mail institucional.
- [ ] Nada de idade, telefone ou horários em página pública.
- [ ] Consentimentos opcionais nunca vêm marcados.
- [ ] Semestre não gravado. "O que você precisa" em chips, não em texto livre.

## 8. Coisas que o Stitch inventou e que NÃO entram

"Monitora oficial credenciada", "Núcleo de Apoio Discente", "Ambiente seguro", "Resposta rápida", "Serviço Institucional", "Graduação CIMATEC", "Engenharia de Computação", "Redes de Comunicação", "Eng. de Software" no cabeçalho, Lab 04, Biblioteca, Teams, WhatsApp, "Semana 40", "Recomendado logo a seguir", "Disponível esta semana", "Solicitação sem custo acadêmico", "N disponíveis para este tema", "Os mentores são alunos voluntários que já cursaram...", barra de navegação inferior com Mensagens, Sessões e Perfil, bolinhas de presença, emojis, contadores, e-mail com domínio inventado.
