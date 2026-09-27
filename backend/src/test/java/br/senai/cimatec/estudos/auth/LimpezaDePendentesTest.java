package br.senai.cimatec.estudos.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import br.senai.cimatec.estudos.usuario.Usuario;
import br.senai.cimatec.estudos.usuario.UsuarioRepository;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testes-limpeza;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@Import(UltimoLinkCapturado.class)
class LimpezaDePendentesTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private UltimoLinkCapturado links;

    @Autowired
    private LimpezaDePendentes limpeza;

    @BeforeEach
    void limpar() {
        usuarios.deleteAll();
    }

    @Test
    void apagaSoPendenteComLinkVencidoHaMaisDeSeteDias() throws Exception {
        cadastrar("esquecida@exemplo.com");
        cadastrar("recente@exemplo.com");
        cadastrar("verificada@exemplo.com");
        mvc.perform(post("/api/auth/verificacao").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"token\": \"" + links.ultimoToken() + "\"}"));

        Instant agora = Instant.now();
        vencerLink("esquecida@exemplo.com", agora.minus(Duration.ofDays(8)));
        vencerLink("recente@exemplo.com", agora.minus(Duration.ofDays(6)));
        vencerLink("verificada@exemplo.com", agora.minus(Duration.ofDays(30)));

        assertThat(limpeza.apagarVencidas()).isEqualTo(1);
        assertThat(usuarios.findByEmail("esquecida@exemplo.com")).isEmpty();
        // Vencido há 6 dias: ainda cabe "link expirado, peça outro".
        assertThat(usuarios.findByEmail("recente@exemplo.com")).isPresent();
        // Conta verificada nunca é apagada por isto, por mais velho que seja o link.
        assertThat(usuarios.findByEmail("verificada@exemplo.com")).isPresent();
    }

    private void vencerLink(String email, Instant quando) {
        Usuario usuario = usuarios.findByEmail(email).orElseThrow();
        usuario.iniciarVerificacao("hash-qualquer-" + email, quando);
        usuarios.save(usuario);
    }

    private void cadastrar(String email) throws Exception {
        mvc.perform(post("/api/auth/cadastro").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nome": "Teste", "email": "%s", "senha": "senha-de-teste-1",
                     "curso": "Redes de Computadores", "termosEPolitica": true}
                    """.formatted(email)))
            .andExpect(status().isOk());
    }
}
