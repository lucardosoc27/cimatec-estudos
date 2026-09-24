# Autenticação por sessão com Spring Security 7.1 e Angular 20

Pesquisa feita em 2026-09-24, só com fonte primária das versões fixadas no projeto.
Cada seção traz primeiro a resposta em linguagem simples e depois as fontes.
O que não foi possível confirmar está marcado com **[não confirmado]**.

## Versões

- Spring Boot: 4.1.1 (escolha do projeto).
- Spring Security: 7.1.1.
- Spring Framework: 7.0.9.
- Angular: 20.3.x. O `package.json` pede `^20.3.0`; o instalado em `node_modules` é 20.3.30.
  O código-fonte do Angular foi lido na tag 20.3.15 (a mais alta da série 20.3 encontrada
  no GitHub) e o trecho do interceptor foi conferido, idêntico, no pacote instalado.

De onde saíram as versões do Spring:

- BOM oficial do Boot 4.1.1, propriedades `<spring-security.version>7.1.1` e
  `<spring-framework.version>7.0.9`:
  https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-dependencies/4.1.1/spring-boot-dependencies-4.1.1.pom

Observação sobre as fontes da documentação:

- Os endereços versionados `docs.spring.io/spring-security/reference/7.1/...` e
  `docs.spring.io/spring-boot/4.1/...` respondem com redirecionamento (302) para a página
  sem versão ("current"). Para não depender do que "current" aponta no dia, a documentação
  foi lida no **código-fonte AsciiDoc da tag 7.1.1** no GitHub, que é o texto que gera o site.
  Os links abaixo apontam para esse fonte.
- Framework: fonte na tag `v7.0.9`. Boot: fonte na tag `v4.1.1`. Angular: tag `20.3.15`.

---

## 1. CSRF para SPA

### Resposta

**O que é o `CookieCsrfTokenRepository.withHttpOnlyFalse()`.**
O Spring guarda o token CSRF "esperado" em algum lugar. Por padrão é na sessão.
O `CookieCsrfTokenRepository` guarda num cookie chamado `XSRF-TOKEN` e lê o token enviado
pelo cliente no header `X-XSRF-TOKEN` (ou no parâmetro `_csrf`). Esses nomes foram escolhidos
de propósito para bater com o padrão do Angular.
Por padrão esse cookie é `HttpOnly`. O `withHttpOnlyFalse()` só desliga o `HttpOnly`,
para que o JavaScript do Angular consiga ler o cookie e copiá-lo para o header.
O próprio Spring diz: se não precisa ler o cookie por JavaScript, não use `withHttpOnlyFalse()`.
No nosso caso precisamos, porque é assim que o Angular funciona.

Detalhes do código 7.1.1: o cookie é gravado com `secure` igual a `request.isSecure()`
(em http local fica sem `Secure`, em https fica com `Secure`), `path` igual ao context path
da aplicação (ou `/`), e `HttpOnly` conforme a configuração.

**O que a proteção BREACH muda.**
Desde o Security 6, o manipulador padrão é o `XorCsrfTokenRequestAttributeHandler`.
Ele "mascara" o token com um valor aleatório diferente a cada requisição (XOR + Base64),
para dificultar o ataque BREACH, que tenta descobrir segredos observando o tamanho de
respostas comprimidas. Quando o token volta do cliente, o Spring desfaz a máscara e compara.
O problema para uma SPA: o cookie `XSRF-TOKEN` contém o token **cru**, não o mascarado.
O Angular lê o cookie e manda o valor cru no header. O manipulador XOR tenta "desmascarar"
um valor que nunca foi mascarado, a comparação falha e o POST leva 403.
Por isso a documentação diz que a SPA precisa de um manipulador personalizado.

**Existe `csrf.spa()` na 7.1? Sim.** Foi criado na 7.0 (`@since 7.0` no código).
Ele faz exatamente duas coisas, conferidas no código da tag 7.1.1:

1. Troca o repositório para `CookieCsrfTokenRepository.withHttpOnlyFalse()`.
2. Troca o manipulador para uma classe interna privada, `SpaCsrfTokenRequestHandler`, que:
   - ao **ler** o token enviado pelo cliente: se veio no **header**, compara o valor cru
     (sem BREACH); se veio como parâmetro de formulário, usa o XOR (com BREACH);
   - ao **disponibilizar** o token na requisição: usa o XOR, mas com o nome de atributo
     `null`, o que força o token a ser carregado **em toda requisição** (ver abaixo).

**Carregamento adiado (deferred).**
Desde o Security 6, o Spring só carrega (e, se não existir, gera e grava) o token quando
alguém precisa dele: numa requisição POST/PUT/DELETE, ou quando uma página renderiza o token.
Consequência para uma SPA: um GET comum não faz o Spring gravar o cookie `XSRF-TOKEN`.
O navegador nunca recebe o cookie, o Angular não tem o que mandar, e o primeiro POST falha.
Além disso, o cookie é apagado no sucesso do login e do logout, e o próximo precisa ser emitido.

A documentação mostra como desligar o adiamento: usar o manipulador XOR com
`setCsrfRequestAttributeName(null)`. Com o nome nulo, o Spring precisa carregar o token para
saber o nome do atributo, então o token é carregado (e o cookie gravado, se faltar) em toda
requisição. É exatamente isso que o `spa()` faz por dentro.

**Forma recomendada na 7.1 para o cookie chegar antes do primeiro POST.**

- No servidor: `.csrf((csrf) -> csrf.spa())`. Com isso, **qualquer** requisição que passe
  pela cadeia do Spring Security e não tenha o cookie recebe um `Set-Cookie: XSRF-TOKEN=...`.
  Isso vale inclusive para uma resposta 401, porque o `CsrfFilter` roda antes da autorização.
- No cliente: garantir que a primeira chamada ao back-end seja um **GET**.
  Em desenvolvimento, a página do Angular é servida pelo `ng serve`, não pelo Spring,
  então o carregamento da página não traz o cookie. Um GET inicial (por exemplo,
  `GET /api/auth/me` para saber se já existe sessão) resolve e ainda tem utilidade própria.
  **[não confirmado como recomendação textual]**: a doc do Spring 7.1 não diz "faça um GET
  antes"; isso é dedução do código do `spa()` somada à doc do Angular, que diz que o servidor
  deve gravar o cookie "on either the page load or the first GET request".
- Após login e logout o cookie é trocado ou apagado. Com `spa()`, a próxima requisição
  qualquer já recebe um cookie novo.

Configuração da própria documentação 7.1 (lambda DSL):

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			// ...
			.csrf((csrf) -> csrf.spa());
		return http.build();
	}
}
```

Trecho do código-fonte 7.1.1 que mostra o que o `spa()` faz:

```java
public CsrfConfigurer<H> spa() {
	this.csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
	this.requestHandler = new SpaCsrfTokenRequestHandler();
	return this;
}
```

### Fontes

- Doc CSRF 7.1, seções `csrf-token-repository-cookie`, `csrf-token-request-handler-breach`,
  `deferred-csrf-token`, `deferred-csrf-token-opt-out`, `csrf-integration-javascript-spa`:
  https://github.com/spring-projects/spring-security/blob/7.1.1/docs/modules/ROOT/pages/servlet/exploits/csrf.adoc
  (publicada em https://docs.spring.io/spring-security/reference/7.1/servlet/exploits/csrf.html,
  que redireciona para a versão "current").
  Trechos: "The `CookieCsrfTokenRepository` writes to a cookie named `XSRF-TOKEN` and reads it
  from an HTTP request header named `X-XSRF-TOKEN` or the request parameter `_csrf` by default."
  / "When storing the expected CSRF token in a cookie, JavaScript applications will only have
  access to the plain token value and _will not_ have access to the encoded value."
  / "the cookie storing the CSRF token will be cleared upon authentication success and logout
  success. Spring Security defers loading a new CSRF token by default, and additional work is
  required to return a fresh cookie."
  / "By setting the `csrfRequestAttributeName` to `null`, the `CsrfToken` must first be loaded
  to determine what attribute name to use. This causes the `CsrfToken` to be loaded on every
  request."
- `CsrfConfigurer.spa()` e a classe interna `SpaCsrfTokenRequestHandler`:
  https://github.com/spring-projects/spring-security/blob/7.1.1/config/src/main/java/org/springframework/security/config/annotation/web/configurers/CsrfConfigurer.java
- `CookieCsrfTokenRepository` (`DEFAULT_CSRF_COOKIE_NAME = "XSRF-TOKEN"`,
  `DEFAULT_CSRF_HEADER_NAME = "X-XSRF-TOKEN"`, `withHttpOnlyFalse()`, `saveToken`):
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/csrf/CookieCsrfTokenRepository.java
- `CsrfTokenRequestAttributeHandler.handle` (nome nulo chama `getParameterName()`, que
  força o carregamento):
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/csrf/CsrfTokenRequestAttributeHandler.java
- `XorCsrfTokenRequestAttributeHandler`:
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/csrf/XorCsrfTokenRequestAttributeHandler.java
- `RepositoryDeferredCsrfToken.init()` (gera e grava o token quando falta):
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/csrf/RepositoryDeferredCsrfToken.java
- Doc do Angular 20 sobre o momento de gravar o cookie:
  https://github.com/angular/angular/blob/20.3.15/adev/src/content/guide/http/security.md

---

## 2. Login em controller próprio

### Resposta

**Autenticar.** Publica-se um bean `AuthenticationManager` (um `ProviderManager` com um
`DaoAuthenticationProvider`, que usa o `UserDetailsService` e o `PasswordEncoder` BCrypt).
No controller, monta-se um `UsernamePasswordAuthenticationToken.unauthenticated(email, senha)`
e chama-se `authenticationManager.authenticate(...)`. Se a senha estiver errada, é lançada
uma `AuthenticationException` (por exemplo `BadCredentialsException`).
Na 7.1, o construtor do `DaoAuthenticationProvider` recebe o `UserDetailsService`.

**Salvar o `SecurityContext` explicitamente.** Depois de autenticar, é preciso:

1. criar um contexto vazio com `securityContextHolderStrategy.createEmptyContext()`;
2. colocar a autenticação nele;
3. colocá-lo no `SecurityContextHolderStrategy` (vale para o resto desta requisição);
4. chamar `securityContextRepository.saveContext(context, request, response)`, com um
   `HttpSessionSecurityContextRepository`. É isso que grava o login na `HttpSession`
   e faz o `JSESSIONID` valer nas próximas requisições.

**Por que isso é necessário desde o Security 6.** No Security 5, o
`SecurityContextPersistenceFilter` salvava o contexto sozinho no fim da requisição.
No 6 ele foi substituído pelo `SecurityContextHolderFilter`, que **só lê** o contexto e nunca
salva. O motivo dado pela documentação: o salvamento automático surpreendia (podia acontecer
antes do fim da requisição) e causava escritas desnecessárias na sessão.
Esse comportamento é o que a documentação chama de `requireExplicitSave = true`.
Resultado prático: se o controller só chamar `SecurityContextHolder.setContext(...)`, o login
"funciona" naquela requisição e some na seguinte. É o erro mais comum de tutorial antigo.

**Fixação de sessão.** O ataque: o invasor faz a vítima usar um ID de sessão que ele conhece;
quando a vítima faz login, o invasor passa a estar logado com ela. A defesa é trocar o ID da
sessão no momento do login. O padrão do Spring em containers modernos é `changeSessionId`
(usa `HttpServletRequest#changeSessionId()`).

Ponto que importa para nós: desde o Security 6, **quem autentica é que precisa chamar** a
`SessionAuthenticationStrategy`. Os filtros prontos (formLogin etc.) fazem isso; um controller
próprio **não** ganha essa proteção sozinho. Então o controller deve chamar a estratégia,
na mesma ordem que o filtro do próprio Spring usa: autenticar, chamar
`sessionAuthenticationStrategy.onAuthentication(...)`, e só então salvar o contexto.

Recomendação: uma `CompositeSessionAuthenticationStrategy` com:

- `ChangeSessionIdAuthenticationStrategy`: troca o ID da sessão, se já existia uma.
  Se não existia sessão antes, não há o que fixar, e a sessão nova nasce no `saveContext`.
- `CsrfAuthenticationStrategy(new CookieCsrfTokenRepository())` ou com
  `withHttpOnlyFalse()`: apaga o token CSRF antigo no login, como os filtros prontos fazem.
  O repositório de cookie não guarda estado no servidor, então uma instância nova funciona.
  O cookie novo chega na próxima requisição (por causa do `spa()`).

**Logout.** Duas opções, e a documentação recomenda a primeira:

- **Pela configuração** (recomendado): `logout(...)` com `logoutUrl("/api/auth/logout")` e
  `logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler())`, que devolve
  **200** em vez de redirecionar para `/login?logout`. O `LogoutFilter` já invalida a sessão,
  limpa o contexto e o repositório, apaga o token CSRF (`CsrfLogoutHandler`) e publica o evento.
  Com CSRF ativo, ele só aceita **POST**, então o logout exige o header `X-XSRF-TOKEN`.
  O `LogoutFilter` roda antes do `AuthorizationFilter`, então não precisa de `permitAll`.
- **Por controller próprio**: o endpoint precisa chamar
  `new SecurityContextLogoutHandler().logout(request, response, authentication)`.
  Sem isso, avisa a doc, "the user is not actually logged out". E precisa de `permitAll`.
  Nesse caminho o `CsrfLogoutHandler` não roda sozinho.

Controller de login da documentação 7.1 (seção "Storing the Authentication manually"):

```java
private SecurityContextRepository securityContextRepository =
        new HttpSessionSecurityContextRepository();

@PostMapping("/login")
public void login(@RequestBody LoginRequest loginRequest,
        HttpServletRequest request, HttpServletResponse response) {
    UsernamePasswordAuthenticationToken token =
        UsernamePasswordAuthenticationToken.unauthenticated(
            loginRequest.getUsername(), loginRequest.getPassword());
    Authentication authentication = authenticationManager.authenticate(token);
    SecurityContext context = securityContextHolderStrategy.createEmptyContext();
    context.setAuthentication(authentication);
    securityContextHolderStrategy.setContext(context);
    securityContextRepository.saveContext(context, request, response);
}
```

Esse exemplo da doc **não** chama a estratégia de sessão. Para o projeto, entre
`authenticate(...)` e `createEmptyContext()` entra:

```java
sessionAuthenticationStrategy.onAuthentication(authentication, request, response);
```

(ordem conferida em `AbstractAuthenticationProcessingFilter`, linhas 275 e 394-397 na 7.1.1).

Logout com status, da documentação 7.1:

```java
http
    .logout((logout) -> logout.logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler()))
```

### Fontes

- Bean `AuthenticationManager` e `@RestController` de login:
  https://github.com/spring-projects/spring-security/blob/7.1.1/docs/modules/ROOT/pages/servlet/authentication/passwords/index.adoc
  (seção `publish-authentication-manager-bean`). Trecho: "it is your responsibility to save
  the authenticated user in the `SecurityContextRepository` if needed."
- Salvamento manual, `requireExplicitSave`, saída do `SessionManagementFilter`, fixação:
  https://github.com/spring-projects/spring-security/blob/7.1.1/docs/modules/ROOT/pages/servlet/authentication/session-management.adoc
  (seções `store-authentication-manually`, `requireexplicitsave`,
  `moving-away-from-sessionmanagementfilter`, `ns-session-fixation`).
  Trechos: "Users now must explicitly save the `SecurityContext` with the
  `SecurityContextRepository` if they want the `SecurityContext` to persist between requests."
  / "In Spring Security 6, the default is that authentication mechanisms themselves must invoke
  the `SessionAuthenticationStrategy`."
- `SecurityContextHolderFilter` só lê:
  https://github.com/spring-projects/spring-security/blob/7.1.1/docs/modules/ROOT/pages/servlet/authentication/persistence.adoc
- `AbstractSessionFixationProtectionStrategy.onAuthentication` ("Session fixation isn't a
  problem if there's no session") e `ChangeSessionIdAuthenticationStrategy`:
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/authentication/session/AbstractSessionFixationProtectionStrategy.java
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/authentication/session/ChangeSessionIdAuthenticationStrategy.java
- `CsrfAuthenticationStrategy.onAuthentication` (apaga e recarrega o token):
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/csrf/CsrfAuthenticationStrategy.java
- Ordem no filtro pronto:
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/authentication/AbstractAuthenticationProcessingFilter.java
- Logout (arquitetura, `HttpStatusReturningLogoutSuccessHandler`, endpoint próprio):
  https://github.com/spring-projects/spring-security/blob/7.1.1/docs/modules/ROOT/pages/servlet/authentication/logout.adoc
- `HttpStatusReturningLogoutSuccessHandler` devolve `HttpStatus.OK` por padrão:
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/authentication/logout/HttpStatusReturningLogoutSuccessHandler.java
- Logout exige POST com CSRF ativo: doc CSRF 7.1, seção `csrf-considerations-logout` (link da
  pergunta 1).

---

## 3. 401 para não autenticado, e o que acontece com POST sem token CSRF

### Resposta

**Por que sai 403 em vez de 401.** Quem decide a resposta para um usuário não autenticado é o
`AuthenticationEntryPoint`, chamado pelo `ExceptionTranslationFilter`. O `formLogin` registra
um que redireciona para a página de login; o `httpBasic` registra um que responde 401 com
`WWW-Authenticate`. Sem nenhum dos dois, **não há entry point registrado**, e o Spring usa o
padrão `Http403ForbiddenEntryPoint`, que responde **403**. Isso está no código do
`ExceptionHandlingConfigurer`.

**Como corrigir.** Registrar explicitamente:

```java
.exceptionHandling((ex) -> ex
    .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
```

O `HttpStatusEntryPoint` só faz `response.setStatus(...)`, sem corpo e sem redirect.
Assim o Angular distingue: 401 = "faça login"; 403 = "logado, mas sem permissão" (ou CSRF).

**POST sem token CSRF.** Resposta: **403**.
Quem responde é o `CsrfFilter`: quando o token enviado não bate com o esperado, ele cria uma
`MissingCsrfTokenException` (não havia token guardado) ou `InvalidCsrfTokenException`
(havia, mas não bate) e chama o `AccessDeniedHandler` diretamente, sem continuar a cadeia.
O `AccessDeniedHandler` padrão (`AccessDeniedHandlerImpl`) faz `sendError(403)`.

**Vem antes da autorização?** Sim. Na ordem oficial dos filtros (`FilterOrderRegistration`),
o `CsrfFilter` fica logo depois do `CorsFilter` e bem antes do `ExceptionTranslationFilter` e
do `AuthorizationFilter`. Consequência importante: um usuário **não autenticado** que faz POST
**sem** token CSRF recebe **403, não 401**, mesmo numa rota protegida. O CSRF é checado
primeiro. No Angular, isso significa: 403 em POST pode ser "faltou o cookie XSRF", não
necessariamente "sem permissão".

**Cuidado com o despacho de erro.** Como o `AccessDeniedHandlerImpl` usa `sendError`, o
container faz um segundo despacho, do tipo `ERROR`, para `/error`. A doc 7.1 diz que o Spring
Security autoriza todos os tipos de despacho por padrão e sugere liberar `ERROR`:
`.dispatcherTypeMatchers(DispatcherType.FORWARD, DispatcherType.ERROR).permitAll()`.
Isso evita que a página de erro seja bloqueada e mude o status.
**[não confirmado por teste]**: não foi executado para ver o status final sem essa liberação.

**Falha de senha no controller.** O `authenticate(...)` lança `AuthenticationException`.
Recomendação: capturar no próprio controller e devolver 401 com a mensagem genérica
"e-mail ou senha inválidos". **[não confirmado]**: não verifiquei se, sem captura, a exceção
chega ao `ExceptionTranslationFilter` (que examina a cadeia de causas) ou é tratada antes
pelo Spring MVC. Capturar no controller elimina a dúvida.

### Fontes

- Entry point padrão `Http403ForbiddenEntryPoint`, método `createDefaultEntryPoint` e javadoc
  de `authenticationEntryPoint(...)` ("If that is not provided defaults to
  {@link Http403ForbiddenEntryPoint}"):
  https://github.com/spring-projects/spring-security/blob/7.1.1/config/src/main/java/org/springframework/security/config/annotation/web/configurers/ExceptionHandlingConfigurer.java
- `HttpStatusEntryPoint` (`response.setStatus(this.httpStatus.value())`):
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/authentication/HttpStatusEntryPoint.java
- `Http403ForbiddenEntryPoint`:
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/authentication/Http403ForbiddenEntryPoint.java
- Papel do `ExceptionTranslationFilter` e do `AuthenticationEntryPoint`:
  https://github.com/spring-projects/spring-security/blob/7.1.1/docs/modules/ROOT/pages/servlet/architecture.adoc
  (seção `servlet-exceptiontranslationfilter`) e
  https://github.com/spring-projects/spring-security/blob/7.1.1/docs/modules/ROOT/pages/servlet/authentication/architecture.adoc
- `CsrfFilter.doFilterInternal` (linhas 108-136):
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/csrf/CsrfFilter.java
- Doc CSRF 7.1, passo 7 do processamento: "If the actual CSRF token is invalid (or missing), an
  `AccessDeniedException` is passed to the `AccessDeniedHandler` and processing ends."
  (link da pergunta 1).
- `AccessDeniedHandlerImpl` ("sends a 403 (SC_FORBIDDEN) HTTP error code"):
  https://github.com/spring-projects/spring-security/blob/7.1.1/web/src/main/java/org/springframework/security/web/access/AccessDeniedHandlerImpl.java
- Ordem dos filtros:
  https://github.com/spring-projects/spring-security/blob/7.1.1/config/src/main/java/org/springframework/security/config/annotation/web/builders/FilterOrderRegistration.java
- Despacho `ERROR`:
  https://github.com/spring-projects/spring-security/blob/7.1.1/docs/modules/ROOT/pages/servlet/authorization/authorize-http-requests.adoc
  (seção "Matching By Dispatcher Type").

---

## 4. CORS no Security 7.1

### Resposta

CORS precisa ser tratado **antes** do Spring Security. O motivo, nas palavras da doc: a
requisição de pré-voo (OPTIONS) não leva cookies, então, se o Security vier primeiro, ele acha
que o usuário não está autenticado e rejeita. Na ordem oficial, o `CorsFilter` já vem antes do
`CsrfFilter`, desde que se ative `http.cors(...)`.

Na 7.1, basta publicar **um** bean `UrlBasedCorsConfigurationSource`: o Spring Security
aplica `http.cors(withDefaults())` sozinho (método `applyCorsIfAvailable`). Mesmo assim,
escrever `.cors(Customizer.withDefaults())` deixa a intenção visível para quem lê.
Com mais de um bean desse tipo, a configuração automática não acontece.

Para o projeto: origem explícita `http://localhost:4200`, `setAllowCredentials(true)`,
métodos usados e os headers necessários (`Content-Type` e `X-XSRF-TOKEN`).

**`*` com credenciais é rejeitado?** Sim, confirmado no Spring Framework 7.0.9.
A doc diz: "Wildcards are not authorized in `allowOrigins`" quando credenciais estão ativas.
No código, `CorsConfiguration.validateAllowCredentials()` lança `IllegalArgumentException`
("When allowCredentials is true, allowedOrigins cannot contain the special value \"*\"...").
Detalhe que tutorial não conta: essa checagem roda dentro de `checkOrigin`, ou seja,
**na hora da requisição**, não na subida da aplicação. A configuração errada sobe normalmente
e só quebra quando chega uma requisição com `Origin`.

Em desenvolvimento, com o proxy do `ng serve`, o navegador vê tudo como mesma origem
(`localhost:4200`), então o CORS normalmente nem entra em ação. Ele fica configurado para
quando front e back estiverem em origens diferentes.

Exemplo da documentação 7.1 (bean de configuração):

```java
@Bean
UrlBasedCorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("https://example.com"));
    configuration.setAllowedMethods(Arrays.asList("GET","POST"));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

(para o projeto: trocar a origem por `http://localhost:4200`, acrescentar
`setAllowCredentials(true)` e `setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN"))`.)

### Fontes

- Doc CORS do Security 7.1:
  https://github.com/spring-projects/spring-security/blob/7.1.1/docs/modules/ROOT/pages/servlet/integrations/cors.adoc
  Trechos: "CORS must be processed before Spring Security, because the pre-flight request does
  not contain any cookies" / "Spring Security will automatically configure CORS only if a
  `UrlBasedCorsConfigurationSource` instance is present."
- Aplicação automática (`applyCorsIfAvailable`):
  https://github.com/spring-projects/spring-security/blob/7.1.1/config/src/main/java/org/springframework/security/config/annotation/web/configuration/HttpSecurityConfiguration.java
- Doc CORS do Framework 7.0.9, seção `mvc-cors-credentialed-requests`:
  https://github.com/spring-projects/spring-framework/blob/v7.0.9/framework-docs/modules/ROOT/pages/web/webmvc-cors.adoc
- `CorsConfiguration.validateAllowCredentials()` e `checkOrigin(...)`:
  https://github.com/spring-projects/spring-framework/blob/v7.0.9/spring-web/src/main/java/org/springframework/web/cors/CorsConfiguration.java

---

## 5. Angular 20: XSRF no HttpClient

### Resposta

**Já vem ligado.** O `provideHttpClient()` registra o interceptor de XSRF e
`XSRF_ENABLED = true` por padrão. O `withXsrfConfiguration(...)` só é necessário para
**trocar** nomes. Os padrões são cookie `XSRF-TOKEN` e header `X-XSRF-TOKEN`, os mesmos do
`CookieCsrfTokenRepository`. Portanto, para o projeto, `provideHttpClient()` sozinho basta.
Escrever `withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })`
é opcional e só serve para documentar a intenção no código.

**Quando o header NÃO é enviado.** O interceptor (`xsrfInterceptorFn`) pula a requisição se:

- a proteção estiver desligada (`withNoXsrfProtection()`);
- o método for `GET` ou `HEAD`;
- a URL for absoluta (regex `/^(?:https?:)?\/\//i`, que pega `http://`, `https://` e `//`).

E só adiciona o header se o cookie existir e se a requisição ainda não tiver esse header.
Consequência para o projeto: as chamadas precisam usar **URL relativa** (`/api/...`).
Com `http://localhost:8080/api/...` o header nunca vai, e todo POST leva 403.
Curiosidade: `OPTIONS` e `TRACE` não são pulados pelo Angular, mas o Spring também não exige
CSRF neles (`CsrfFilter` libera GET, HEAD, TRACE, OPTIONS).

**`withCredentials` é necessário com o proxy?** Em desenvolvimento, não.
Com o proxy, o navegador faz a chamada para `localhost:4200`, a mesma origem da página.
Pela doc do Angular 20, `withCredentials` e `credentials` controlam o envio de cookies em
requisições **cross-origin**; o padrão é enviar credenciais em requisições de mesma origem.
**[confirmação parcial]**: essa frase da doc do Angular está na seção do backend `fetch`
(`withFetch()`), e o projeto usa o backend padrão (`XMLHttpRequest`). No código do backend
XHR, o Angular só liga `xhr.withCredentials = true` quando pedido. Que o XHR mande cookies de
mesma origem sem essa flag é regra do navegador (especificação XHR/Fetch do WHATWG), fonte que
fica fora da lista permitida nesta pesquisa.
Para produção com origens diferentes, aí sim: `withCredentials: true` (ou um interceptor que
o aplique) mais CORS com `allowCredentials`. **Atenção:** nesse cenário a URL passa a ser
absoluta e o interceptor de XSRF **deixa de mandar o header** (ver acima). Ou seja: o desenho
"URL relativa + mesmo domínio" (proxy em dev, proxy reverso em produção) é o que mantém o CSRF
funcionando sem código extra.

Código-fonte do interceptor na 20.3.15 (idêntico no 20.3.30 instalado):

```ts
const ABSOLUTE_URL_REGEX = /^(?:https?:)?\/\//i;

export function xsrfInterceptorFn(req, next) {
  // Skip both non-mutating requests and absolute URLs.
  if (
    !inject(XSRF_ENABLED) ||
    req.method === 'GET' ||
    req.method === 'HEAD' ||
    ABSOLUTE_URL_REGEX.test(req.url)
  ) {
    return next(req);
  }
  const token = inject(HttpXsrfTokenExtractor).getToken();
  const headerName = inject(XSRF_HEADER_NAME);
  if (token != null && !req.headers.has(headerName)) {
    req = req.clone({headers: req.headers.set(headerName, token)});
  }
  return next(req);
}
```

(tipos omitidos para caber na linha; ver o arquivo original.)

### Fontes

- Interceptor, nomes padrão (`XSRF_DEFAULT_COOKIE_NAME = 'XSRF-TOKEN'`,
  `XSRF_DEFAULT_HEADER_NAME = 'X-XSRF-TOKEN'`) e `HttpXsrfCookieExtractor`:
  https://github.com/angular/angular/blob/20.3.15/packages/common/http/src/xsrf.ts
- `provideHttpClient` (`{provide: XSRF_ENABLED, useValue: true}`), `withXsrfConfiguration`,
  `withNoXsrfProtection`:
  https://github.com/angular/angular/blob/20.3.15/packages/common/http/src/provider.ts
- Guia de segurança HTTP do Angular 20: "By default, an interceptor sends this header on all
  mutating requests (such as `POST`) to relative URLs, but not on GET/HEAD requests or on
  requests with an absolute URL." / "HttpClient supports only the client half of the XSRF
  protection scheme":
  https://github.com/angular/angular/blob/20.3.15/adev/src/content/guide/http/security.md
  (publicado em https://v20.angular.dev/best-practices/security e em angular.dev).
- Credenciais (seção "Credentials handling", dentro de "Advanced fetch options"):
  https://github.com/angular/angular/blob/20.3.15/adev/src/content/guide/http/making-requests.md
- Backend XHR (`if (req.withCredentials) { xhr.withCredentials = true; }`):
  https://github.com/angular/angular/blob/20.3.15/packages/common/http/src/xhr.ts
- Proxy do `ng serve`:
  https://github.com/angular/angular/blob/20.3.15/adev/src/content/tools/cli/serve.md
- Métodos liberados pelo `CsrfFilter` (`DefaultRequiresCsrfMatcher`): link do `CsrfFilter`
  na pergunta 3.

---

## 6. Cookie de sessão no Spring Boot 4.1

### Resposta

Os nomes estão confirmados no código da tag v4.1.1: a classe `ServerProperties` é ligada ao
prefixo `server`, tem `servlet.session` (classe `Session`) e dentro dela `cookie`
(classe `Cookie`). Propriedades:

- `server.servlet.session.cookie.http-only`: "Whether to use "HttpOnly" cookies for the
  cookie." Padrão do Boot: não definido (`null`).
- `server.servlet.session.cookie.same-site`: "SameSite setting for the cookie."
  Valores: `none`, `lax`, `strict` (e `omitted`). Padrão do Boot: não definido.
  A doc do Boot diz que a propriedade é suportada no Tomcat e no Jetty autoconfigurados.
- `server.servlet.session.cookie.secure`: "Whether to always mark the cookie as secure."
  Padrão do Boot: não definido.
- `server.servlet.session.timeout`: "Session timeout. If a duration suffix is not specified,
  seconds will be used." Padrão: `30m`.
- Também existe `server.servlet.session.cookie.name` (para trocar o nome `JSESSIONID`).

Como os três primeiros vêm `null` no Boot, o comportamento real depende do container
(Tomcat). **[não confirmado]**: o padrão do Tomcat para `HttpOnly` e `SameSite` não foi
verificado, porque a documentação do Tomcat está fora da lista de fontes. Por isso a
recomendação é **declarar os três explicitamente**, sem depender de padrão:

```properties
server.servlet.session.cookie.http-only=true
server.servlet.session.cookie.same-site=lax
server.servlet.session.cookie.secure=false
server.servlet.session.timeout=30m
```

`secure=false` só no perfil local (http). Em produção, `true`. Vale notar que isso configura
só o `JSESSIONID`. O cookie `XSRF-TOKEN` é criado pelo Spring Security, não pelo container,
e segue as regras próprias descritas na pergunta 1 (`Secure` conforme `request.isSecure()`).

### Fontes

- `ServerProperties` (`@ConfigurationProperties("server")`, classe interna `Servlet` com
  `Session session`):
  https://github.com/spring-projects/spring-boot/blob/v4.1.1/module/spring-boot-web-server/src/main/java/org/springframework/boot/web/server/autoconfigure/ServerProperties.java
- `Session` (`timeout = Duration.ofMinutes(30)`, `@DurationUnit(ChronoUnit.SECONDS)`, `cookie`):
  https://github.com/spring-projects/spring-boot/blob/v4.1.1/module/spring-boot-web-server/src/main/java/org/springframework/boot/web/server/servlet/Session.java
- `Cookie` (`httpOnly`, `secure`, `sameSite`, enum `SameSite`):
  https://github.com/spring-projects/spring-boot/blob/v4.1.1/module/spring-boot-web-server/src/main/java/org/springframework/boot/web/server/Cookie.java
- Doc do Boot 4.1.1, "SameSite Cookies" e "Common server settings":
  https://github.com/spring-projects/spring-boot/blob/v4.1.1/documentation/spring-boot-docs/src/docs/antora/modules/reference/pages/web/servlet.adoc
- Lista de propriedades publicada:
  https://docs.spring.io/spring-boot/4.1/appendix/application-properties/index.html
  (redireciona para a versão "current"; as descrições coincidem com o javadoc do código v4.1.1).

---

## Armadilhas

O que mudou em relação ao Security 5/6 e o que um tutorial antigo ensinaria errado.

- **`WebSecurityConfigurerAdapter` não existe mais.** A classe não está na árvore da tag 7.1.1.
  Configura-se com um `@Bean SecurityFilterChain`.
- **DSL só com lambda.** Na 7.1.1 não existem `http.csrf()` sem argumento nem `.and()`
  (o método sumiu de `SecurityConfigurerAdapter`). Tutorial com `.csrf().disable().and()`
  não compila.
- **`authorizeRequests` e `AntPathRequestMatcher` saíram.** Nenhum dos dois está na tag 7.1.1.
  Usa-se `authorizeHttpRequests` e, quando precisa de matcher explícito,
  `PathPatternRequestMatcher` (a própria doc de CSRF 7.1 usa
  `PathPatternRequestMatcher.withDefaults().matcher("/logout")`).
- **`setContext` sem `saveContext` não mantém o login.** Desde o 6, o contexto não é salvo
  automaticamente (`requireExplicitSave`). Tutorial da era 5 que só faz
  `SecurityContextHolder.getContext().setAuthentication(...)` gera um login que dura uma
  requisição.
- **Controller próprio não ganha proteção contra fixação de sessão sozinho.** Desde o 6,
  o `SessionManagementFilter` não roda por padrão, e é o mecanismo de autenticação que deve
  chamar a `SessionAuthenticationStrategy`. O exemplo da própria doc não faz isso.
- **`withHttpOnlyFalse()` sozinho não basta mais.** Desde o 6, com BREACH e token adiado,
  só trocar o repositório para cookie faz o POST da SPA falhar (403) e o cookie não aparecer
  no primeiro GET. Tutoriais do Security 5 mostram só essa linha.
- **Na 7.x existe `csrf.spa()`.** Tutoriais do Security 6 ensinam a escrever à mão uma classe
  `SpaCsrfTokenRequestHandler` e um filtro `CsrfCookieFilter`. **[não confirmado]**: esse
  exemplo vinha da doc 6.x, que não foi consultada; o que está confirmado é que a doc 7.1 não
  o mostra mais e usa `csrf.spa()`, e que o `SpaCsrfTokenRequestHandler` virou classe
  interna privada do `CsrfConfigurer`.
- **`csrf.disable()` "porque é API REST" não se aplica aqui.** Com sessão em cookie, o
  navegador manda o `JSESSIONID` sozinho, e é exatamente esse o cenário que o CSRF protege.
- **Sem `formLogin`/`httpBasic`, não autenticado recebe 403.** O entry point padrão é
  `Http403ForbiddenEntryPoint`. É preciso registrar `HttpStatusEntryPoint(UNAUTHORIZED)`.
- **POST sem token CSRF dá 403 mesmo para anônimo.** O `CsrfFilter` roda antes da
  autorização. Não interpretar todo 403 como "sem permissão".
- **`DaoAuthenticationProvider` recebe o `UserDetailsService` no construtor** na 7.1
  (é como a doc 7.1 o instancia). Tutorial com `new DaoAuthenticationProvider()` seguido de
  `setUserDetailsService(...)` é do padrão antigo.
- **Logout padrão redireciona.** Sem `HttpStatusReturningLogoutSuccessHandler`, o logout
  responde com redirect para `/login?logout`, o que não serve para uma SPA.
- **Logout e login apagam o cookie `XSRF-TOKEN`.** O próximo POST só funciona depois que o
  navegador receber um cookie novo; com `spa()`, qualquer requisição seguinte o traz.
- **`allowedOrigins("*")` com `allowCredentials(true)` sobe sem erro** e só falha na hora da
  requisição, com `IllegalArgumentException`.
- **URL absoluta no Angular desliga o header XSRF.** Trocar o proxy por
  `http://localhost:8080/api` faz o interceptor parar de enviar `X-XSRF-TOKEN`.
- **Guardar token em `localStorage`**, comum em tutoriais de JWT, não se aplica: aqui o
  `JSESSIONID` é `HttpOnly` e o JavaScript só lê o `XSRF-TOKEN`, que sozinho não autentica.

## O que ficou sem confirmação

- Páginas `docs.spring.io/.../7.1/...` e `docs.spring.io/spring-boot/4.1/...` redirecionam
  para "current". O texto foi lido no fonte AsciiDoc das tags 7.1.1 e v4.1.1, não no HTML.
- Padrões do Tomcat para `HttpOnly` e `SameSite` do `JSESSIONID` quando a propriedade do Boot
  não é definida (fonte fora da lista). Mitigação: definir as propriedades explicitamente.
- Envio de cookie em XHR de mesma origem sem `withCredentials`: a doc do Angular 20 afirma
  isso só na seção do backend `fetch`; para XHR a regra é da especificação do navegador.
- Se uma `AuthenticationException` não capturada no controller vira 401 via
  `ExceptionTranslationFilter`. Mitigação: capturar no controller.
- Status final de um 403 do `CsrfFilter` quando o despacho `ERROR` não está liberado.
  Mitigação: `dispatcherTypeMatchers(FORWARD, ERROR).permitAll()`.
- "Fazer um GET antes do primeiro POST" é dedução do código + doc do Angular, não frase da
  doc do Spring 7.1.
- Conteúdo dos tutoriais do Security 6 (classe `CsrfCookieFilter`): citado de memória, não
  consultado.
