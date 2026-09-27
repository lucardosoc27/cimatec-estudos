package br.senai.cimatec.estudos.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import br.senai.cimatec.estudos.usuario.Usuario;
import br.senai.cimatec.estudos.usuario.UsuarioDetailsService;
import br.senai.cimatec.estudos.usuario.UsuarioRepository;
import br.senai.cimatec.estudos.usuario.Verificacao;

// Intervalo de 1 s (em vez de 60 s) para o teste conseguir esperar o intervalo passar.
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testes-verificacao;DB_CLOSE_DELAY=-1",
    "app.verificacao.intervalo-reenvio=1s"})
@AutoConfigureMockMvc
@Import(UltimoLinkCapturado.class)
class VerificacaoTest {

    // Um e-mail por teste: o intervalo de reenvio é contado em memória e não zera entre testes.
    private static final AtomicInteger CONTADOR = new AtomicInteger();
    private String email;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private UsuarioDetailsService detalhes;

    @Autowired
    private UltimoLinkCapturado links;

    @BeforeEach
    void cadastrarConta() throws Exception {
        usuarios.deleteAll();
        email = "verifica" + CONTADOR.incrementAndGet() + "@exemplo.com";
        mvc.perform(post("/api/auth/cadastro").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nome": "Teste", "email": "%s", "senha": "senha-de-teste-1",
                     "curso": "Redes de Computadores", "termosEPolitica": true}
                    """.formatted(email)))
            .andExpect(status().isOk());
    }

    @Test
    void tokenValidoAtivaAContaERegistraOConsumo() throws Exception {
        assertThat(detalhes.loadUserByUsername(email).isEnabled()).isFalse();

        verificar(links.ultimoToken()).andExpect(status().isOk())
            .andExpect(jsonPath("$.estado").value("ativada"));

        Usuario usuario = usuarios.findByEmail(email).orElseThrow();
        assertThat(usuario.getVerificacao()).isEqualTo(Verificacao.VERIFICADO);
        assertThat(usuario.getVerificadoEm()).isNotNull();
        assertThat(detalhes.loadUserByUsername(email).isEnabled()).isTrue();
    }

    @Test
    void segundoUsoDoMesmoTokenRespondeJaUsado() throws Exception {
        String token = links.ultimoToken();
        verificar(token).andExpect(jsonPath("$.estado").value("ativada"));
        verificar(token).andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("ja-usado"));
    }

    @Test
    void tokenInexistenteRespondeInvalido() throws Exception {
        verificar("nao-existe").andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("invalido"));
        assertThat(usuarios.findByEmail(email).orElseThrow().getVerificacao()).isEqualTo(Verificacao.PENDENTE);
    }

    @Test
    void tokenNuncaFicaEmTextoClaroNoBanco() {
        String token = links.ultimoToken();
        assertThat(usuarios.findByVerificacaoTokenHash(token)).isEmpty();
        assertThat(token).hasSize(43);
    }

    @Test
    void reenviarInvalidaOTokenAnterior() throws Exception {
        String antigo = links.ultimoToken();
        esperarOIntervalo();
        reenviar(email).andExpect(status().isOk());
        String novo = links.ultimoToken();

        assertThat(novo).isNotEqualTo(antigo);
        verificar(antigo).andExpect(jsonPath("$.estado").value("invalido"));
        verificar(novo).andExpect(jsonPath("$.estado").value("ativada"));
    }

    @Test
    void reenviarDentroDoIntervaloResponde429ComRetryAfter() throws Exception {
        // O cadastro acabou de enviar um link: reenviar em seguida já é cedo demais.
        reenviar(email).andExpect(status().isTooManyRequests())
            .andExpect(header().exists("Retry-After"))
            .andExpect(jsonPath("$.message").exists());
        esperarOIntervalo();
        reenviar(email).andExpect(status().isOk());
        reenviar(email).andExpect(status().isTooManyRequests());
    }

    @Test
    void reenviarParaEmailSemContaRespondeIgual() throws Exception {
        reenviar("ninguem@exemplo.com").andExpect(status().isOk());
        reenviar("ninguem@exemplo.com").andExpect(status().isTooManyRequests());
    }

    @Test
    void reenviarParaContaJaVerificadaNaoGeraTokenNovo() throws Exception {
        String token = links.ultimoToken();
        verificar(token).andExpect(jsonPath("$.estado").value("ativada"));
        esperarOIntervalo();
        reenviar(email).andExpect(status().isOk());
        assertThat(links.ultimoToken()).isEqualTo(token);
    }

    @Test
    void semTokenCsrfResponde403() throws Exception {
        mvc.perform(post("/api/auth/verificacao").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\": \"x\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/reenviar").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"" + email + "\"}"))
            .andExpect(status().isForbidden());
    }

    private static void esperarOIntervalo() throws InterruptedException {
        Thread.sleep(1100);
    }

    private org.springframework.test.web.servlet.ResultActions verificar(String token) throws Exception {
        return mvc.perform(post("/api/auth/verificacao").with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"token\": \"" + token + "\"}"));
    }

    private org.springframework.test.web.servlet.ResultActions reenviar(String email) throws Exception {
        return mvc.perform(post("/api/auth/reenviar").with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\": \"" + email + "\"}"));
    }
}
