package br.senai.cimatec.estudos.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.savedrequest.NullRequestCache;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

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
            // Usa o bean corsConfigurationSource abaixo.
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(regras -> regras
                // A página de erro interna do Spring precisa abrir, senão um 403 do CSRF
                // viraria outra resposta ao ser encaminhado para /error.
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                // Públicos, um por um, com o método explícito: só o GET de csrf e só o POST
                // de cadastro. Qualquer outra combinação cai no anyRequest() abaixo.
                .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/cadastro").permitAll()
                // Negar por padrão: tudo o mais exige login. Login e logout entram no commit 5.
                .anyRequest().authenticated())
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
     * Em desenvolvimento o Angular fala com o Spring pelo proxy do ng serve (mesma origem),
     * então o CORS não entra em ação. Fica configurado para produção, com origem explícita:
     * nunca "*" junto com credenciais.
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.origem}") String origemDoFront) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(origemDoFront));
        config.setAllowedMethods(List.of("GET", "POST"));
        config.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource origem = new UrlBasedCorsConfigurationSource();
        origem.registerCorsConfiguration("/api/**", config);
        return origem;
    }
}
