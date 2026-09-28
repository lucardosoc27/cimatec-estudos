package br.senai.cimatec.estudos.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.security.web.savedrequest.NullRequestCache;

import jakarta.servlet.DispatcherType;

/**
 * Regras de segurança da API. Versão fixada: Spring Security 7.1.1
 * (ver docs/pesquisa/autenticacao-spring-security-7.md).
 */
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filtros(HttpSecurity http) throws Exception {
        http
            // spa() = token CSRF no cookie legível XSRF-TOKEN, que o HttpClient do Angular
            // devolve no header X-XSRF-TOKEN. Um site atacante consegue fazer o navegador
            // mandar o cookie, mas não consegue LER o valor para montar o header.
            .csrf(csrf -> csrf.spa())
            // Sem CORS, de propósito: front e API ficam na mesma origem em todo ambiente
            // (DECISOES.md, 2026-09-27), então nunca há chamada entre origens.
            .authorizeHttpRequests(regras -> regras
                // A página de erro interna do Spring precisa abrir, senão um 403 do CSRF
                // viraria outra resposta ao ser encaminhado para /error.
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                // Públicos, um por um, com o método explícito: só o GET de csrf e só o POST
                // de cadastro. Qualquer outra combinação cai no anyRequest() abaixo.
                .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/cadastro").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/verificacao").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/reenviar").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                // Negar por padrão na API: tudo o mais em /api exige login (/api/auth/eu incluído).
                .requestMatchers("/api/**").authenticated()
                // Fora de /api só existe o Angular compilado, dentro do jar: index.html, os .js e
                // .css e a pasta assets/ (RotasDoAngular). GET liberado, senão a própria página de
                // entrada responderia 401 e ninguém chegaria à tela de login. As telas privadas
                // continuam protegidas onde importa: qualquer dado delas vem de /api/** e, sem
                // sessão, responde 401. O guard de rota do Angular é conveniência, não segurança.
                .requestMatchers(HttpMethod.GET, "/**").permitAll()
                // Qualquer outro método fora de /api continua negado.
                .anyRequest().authenticated())
            // Logout pela configuração: o LogoutFilter invalida a HttpSession no servidor, limpa o
            // contexto e apaga o cookie XSRF-TOKEN. Só aceita POST com token CSRF, e roda antes
            // da autorização, por isso não precisa de permitAll. Responde 200 em vez de
            // redirecionar para /login?logout, que não serve para uma SPA.
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler()))
            // Sem formLogin nem httpBasic, o padrão seria responder 403 a quem não está
            // logado. Uma API responde 401: "não sei quem você é".
            .exceptionHandling(erros -> erros
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            // O padrão guarda na sessão a requisição negada, para redirecionar depois do login.
            // Numa API isso só cria sessão para visitante anônimo; quem lembra "para onde
            // voltar" é o Angular (?voltar=).
            .requestCache(cache -> cache.requestCache(new NullRequestCache()));
        return http.build();
    }

    /**
     * BCrypt: hash lento de propósito (fator de custo 10, uns 100 ms), com sal aleatório por
     * senha. Duas pessoas com a mesma senha têm hashes diferentes, e testar um dicionário
     * contra o banco vazado custa 100 ms por tentativa. É o mesmo bean que o
     * DaoAuthenticationProvider usa para comparar a senha no login.
     */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Quem confere e-mail e senha no login. O DaoAuthenticationProvider busca o usuário no
     * UsuarioDetailsService e compara a senha com o hash pelo PasswordEncoder. Se o e-mail não
     * existe, ele esconde a diferença: responde BadCredentials igual e ainda calcula um hash
     * falso, para o tempo de resposta ficar parecido ao de senha errada.
     *
     * A checagem "conta habilitada" sai da frente da senha e vai para depois dela. O padrão
     * recusaria a conta pendente ANTES de olhar a senha, e aí "confirme seu e-mail" seria um
     * oráculo: qualquer pessoa descobriria que aquele e-mail tem conta. Assim, a mensagem só
     * aparece para quem provou a senha.
     */
    @Bean
    AuthenticationManager authenticationManager(UserDetailsService usuarios, PasswordEncoder codificador) {
        DaoAuthenticationProvider provedor = new DaoAuthenticationProvider(usuarios);
        provedor.setPasswordEncoder(codificador);
        provedor.setPreAuthenticationChecks(usuario -> {
            // Nada antes da senha, de propósito (ver acima).
        });
        provedor.setPostAuthenticationChecks(usuario -> {
            if (!usuario.isEnabled()) {
                throw new DisabledException("conta ainda não verificada");
            }
        });
        return new ProviderManager(provedor);
    }

    /**
     * O que o login faz com a sessão, na ordem em que os filtros prontos do Spring fazem:
     * troca o id da sessão (contra fixação de sessão: se o atacante fez a vítima usar um id que
     * ele conhece, esse id deixa de valer no login) e apaga o token CSRF antigo, que o próximo
     * GET substitui. Desde o Security 6 um controller próprio precisa chamar isto à mão.
     */
    @Bean
    SessionAuthenticationStrategy sessionAuthenticationStrategy() {
        return new CompositeSessionAuthenticationStrategy(List.of(
            new ChangeSessionIdAuthenticationStrategy(),
            new CsrfAuthenticationStrategy(CookieCsrfTokenRepository.withHttpOnlyFalse())));
    }

    /**
     * Onde o login fica guardado entre uma requisição e outra: na HttpSession, atrás do cookie
     * JSESSIONID (HttpOnly: o JavaScript não lê). Desde o Security 6 salvar é explícito; sem
     * saveContext, o login duraria uma requisição.
     */
    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }
}
