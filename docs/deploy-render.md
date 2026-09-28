# Deploy de demonstração no Render, passo a passo

Escrito em 2026-09-27 para quem nunca fez um deploy. O que está aqui foi conferido na
documentação oficial do Render nessa data; onde a documentação não respondia, está escrito
"a confirmar". As decisões e os motivos estão no `DECISOES.md` (entradas "Perfil demo" e
"Deploy de demonstração no Render").

## Antes de começar: o que isto é, e o que não é

- É um **servidor de demonstração**, plano B para a apresentação. Não é produção.
- O Render **clona o repositório do GitHub**, constrói a imagem com o `Dockerfile` da raiz e
  roda o sistema num endereço `https://<nome>.onrender.com`.
- O link de confirmação de e-mail **sai no log do serviço**, que você lê no painel. Quem lê esse
  log ativa qualquer conta: mais um motivo para não chamar isto de produção.
- No plano gratuito, **as contas somem** a cada deploy, reinício ou hibernação (o serviço
  hiberna depois de 15 minutos sem ninguém acessar e acorda em cerca de um minuto no próximo
  acesso). Antes de cada apresentação as contas são criadas de novo. É rápido; está na rotina
  no fim deste documento.
- Não custa nada, dentro das 750 horas por mês do plano gratuito.

## O que só você tem

1. **Conta no GitHub** com o repositório `lucardosoc27/cimatec-estudos`. O Render lê de lá, então
   o que não foi enviado com `git push` não existe para ele. Antes de tudo, no seu terminal:

   ```
   cd ~/Documentos/cimatec-estudos
   git push
   ```

   e confira no GitHub que o último commit aparece na branch `main`.
2. **Conta no Render** (render.com). Dá para criar entrando com a conta do GitHub, e é o caminho
   mais simples, porque a autorização do repositório já fica feita.

Você não precisa ter Docker no notebook. Ele só é necessário para o teste opcional a seguir.

## Opcional: testar a imagem no notebook antes de subir

Se tiver Docker instalado, dá para construir e rodar exatamente o que o Render vai rodar:

```
cd ~/Documentos/cimatec-estudos
docker build -t cimatec-estudos .
docker run --rm -p 8090:10000 -e PORT=10000 -e APP_URL=http://localhost:8090 cimatec-estudos
```

Depois abra `http://localhost:8090`. O link de confirmação aparece no próprio terminal. Para
parar, Ctrl+C. Isso foi feito em 2026-09-27 e o fluxo inteiro funcionou (cadastro, link,
confirmação, entrar, pedido, aceite, sair).

## Criar o serviço no painel

1. No painel do Render, clique em **"+ New"** (canto superior direito) e escolha
   **"Web Service"**.
2. Conecte o GitHub, se ainda não estiver conectado, e escolha o repositório
   `cimatec-estudos`. Clique em **"Connect"**.
3. Preencha o formulário:
   - **Name:** o nome que vai virar o endereço. Sugestão: `cimatec-estudos`. Se já existir, o
     Render acrescenta um sufixo; o endereço real aparece depois, no topo da página do serviço.
   - **Language:** **Docker**. É o único jeito de rodar Java no Render, que não tem runtime nativo
     de Java. Com Docker não há "Build Command" nem "Start Command" para preencher: o
     `Dockerfile` da raiz do repositório diz como construir e como rodar.
   - **Branch:** `main`.
   - **Region:** entre as cinco (Oregon, Ohio, Virginia, Frankfurt, Singapura), Ohio ou Virginia
     ficam na costa leste dos Estados Unidos, as mais próximas do Brasil. A região não pode ser
     trocada depois; se precisar, cria-se outro serviço.
   - **Root Directory:** em branco.
   - **Dockerfile Path** e **Docker Build Context Directory:** deixe o padrão (o `Dockerfile` da
     raiz e a raiz como contexto).
   - **Instance Type:** **Free**.
   - **Environment Variables:** nenhuma é obrigatória. Veja a lista completa logo abaixo.
   - **Health Check Path** (em "Advanced"): deixe em branco. Sem caminho, o Render só confere que
     a porta abriu, e isso basta.
4. Clique no botão de criar no fim do formulário (**"Deploy Web Service"**). O Render começa o
   primeiro deploy na hora.

## As variáveis de ambiente, uma a uma

Nenhuma senha, chave ou segredo: o projeto não tem nenhum nesta etapa.

- **`PORT`**: o Render define sozinho (o padrão dele é `10000`). Não preencha. A aplicação lê e
  escuta nela.
- **`SPRING_PROFILES_ACTIVE`**: `demo`. Já vem definida na imagem Docker; só defina no painel se
  quiser trocar, e não há motivo para trocar. Nunca use `dev` num servidor público.
- **`APP_BANCO_DIR`**: `/app/dados`. Já vem da imagem; é a pasta gravável onde o banco H2 fica.
  Um dia com disco persistente (plano pago), o caminho do disco entraria aqui.
- **`APP_URL`**: `https://<nome-do-serviço>.onrender.com`, o endereço exato do site. Opcional:
  se não existir, a aplicação usa `RENDER_EXTERNAL_URL`, que o Render define sozinho com esse
  mesmo endereço. Só é preciso definir se o link de confirmação sair com endereço errado (ver
  "Se algo der errado").
- **`APP_EMAIL_DOMINIO`**: não definir. No perfil `demo` o domínio é `exemplo.com`, fixo, para as
  contas de demonstração (`bernardo@exemplo.com`, `ana@exemplo.com`) funcionarem.

Para acrescentar ou mudar uma variável depois: no serviço, **"Environment"** no menu da
esquerda, **"+ Add Environment Variable"**, chave e valor, e **"Save, rebuild, and deploy"**.

## Acompanhar o primeiro deploy

1. A página **"Deploys"** do serviço mostra o log do build e da subida. O primeiro build demora
   alguns minutos: baixa o Node, compila o Angular, baixa as dependências do Maven e empacota o
   jar. Os seguintes são mais rápidos, porque o Render guarda as camadas da imagem.
2. Quando terminar, o estado vira **"Live"** e o endereço `https://<nome>.onrender.com` aparece
   no topo da página. Abra: tem de aparecer a página inicial do Cimatec Estudos.
3. Confira no log (página **"Logs"**) as linhas `The following 1 profile is active: "demo"` e
   `Tomcat started on port 10000`.

## Onde ler o link de confirmação

1. No site, crie a conta (por exemplo `bernardo@exemplo.com`).
2. No painel, clique em **"Logs"** no menu da esquerda. Ligue o **"Live tail"** para ver as
   linhas chegando, ou procure por `Link de verificação`.
3. A linha é assim: `Link de verificação da conta <id>: https://<nome>.onrender.com/verificar-email?token=...`.
   Copie o endereço inteiro, cole no navegador e clique em **"Confirmar e-mail"**.
4. Entre com o e-mail e a senha que cadastrou.

O log guarda 7 dias no plano gratuito. Como o link vale 24 horas e é de uso único, isso não
importa: depois de usado, ele não serve para mais nada.

## Rotina antes de cada apresentação

1. **Acorde o serviço** uns cinco minutos antes: abra o endereço e espere carregar. O Render fala
   em cerca de um minuto para acordar, mas isso é o tempo dele; a nossa aplicação, medida no
   notebook com os mesmos limites do plano gratuito (0,1 CPU e 512 MB), leva mais 2 minutos e
   meio para abrir a porta. Conte com uns quatro minutos no total, e abra antes de a plateia ver.
2. **Recrie as contas**, porque o banco zera a cada hibernação: cadastre e confirme, pelo log,
   `bernardo@exemplo.com` e `ana@exemplo.com`, com a mesma senha. Faça tudo isso antes de mostrar
   qualquer pedido, e não recarregue a página no meio da demonstração: os pedidos ainda vivem na
   memória do navegador.
3. Entre como Ana uma vez e ligue **"Quero receber pedidos de ajuda"** em Minha conta, para o lado
   da mentora aparecer.
4. **Não faça `git push` durante a apresentação.** Cada push na `main` dispara um deploy novo, e o
   deploy zera o banco. Se quiser, desligue o deploy automático no painel (em "Settings",
   **"Auto-Deploy"**: "Off") e volte a ligar depois.

## Se algo der errado

- **O build falhou ("Build failed").** Abra o deploy na página "Deploys" e leia o log de baixo
  para cima. Os erros costumam ser de rede na hora de baixar dependências: use **"Manual
  Deploy"** e escolha a opção que limpa o cache antes de fazer o deploy de novo.
- **"No open ports detected" ou o serviço não fica "Live".** A aplicação não abriu a porta a
  tempo. Com 0,1 CPU ela leva uns 2 minutos e meio para abrir (medido no notebook com os mesmos
  limites), e a documentação lida não diz quanto tempo o Render espera. Se falhar por isso, a
  saída é a instância Starter (0,5 CPU), que deve subir em bem menos. Memória não é o problema:
  com 512 MB a aplicação usou 182 MB. Leia em "Logs" se apareceu `Started BackendApplication`.
- **O servidor não sobe e o log fala de "placeholder" com `RENDER_EXTERNAL_URL` ou `APP_URL`.**
  Falta o endereço do site: defina `APP_URL` em "Environment" e faça "Save, rebuild, and deploy".
- **O link de confirmação saiu com endereço errado.** Mesmo remédio: defina `APP_URL` com o
  endereço exato do site.
- **"Muitos pedidos deste endereço" para todo mundo.** É o limite por origem enxergando todos os
  visitantes como um só, porque o servidor não confiou no IP que o proxy do Render repassou. Está
  na lista "a confirmar" do `DECISOES.md`; passa sozinho em 5 minutos, e o limite por conta
  continua valendo. A correção é a faixa de IP do proxy em `server.tomcat.remoteip.trusted-proxies`.
- **Tudo sumiu (contas, chave de mentoria).** É o comportamento esperado do plano gratuito depois
  de deploy, reinício ou hibernação. Refaça a rotina acima.

## Para parar de gastar horas

Depois da apresentação, suspenda ou apague o serviço nas configurações dele ("Settings"), para
ele não consumir as 750 horas do mês nem ficar público sem necessidade. (Nome exato do botão:
a confirmar no painel.)

## O que ficou a confirmar no primeiro deploy

- A faixa de IP com que o proxy do Render chega ao contêiner (afeta o limite por origem, o
  `Secure` do cookie de CSRF e o HSTS; não afeta o cookie de sessão nem o login).
- O prazo que o Render espera pela porta. O tempo de subida já foi medido no notebook com os
  limites do plano gratuito: 157 segundos até a porta abrir, 182 MB de memória em uso, sem
  estourar. Falta saber se o Render espera esse tempo, tanto no deploy quanto ao acordar da
  hibernação.
- Se o build cabe nos recursos do construtor do Render (o prazo máximo é de 120 minutos).
- O preço do plano Starter (0,5 CPU, 512 MB) e do disco persistente, se um dia a demonstração
  precisar guardar as contas entre reinícios.
