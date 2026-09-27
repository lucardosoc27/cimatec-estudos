package br.senai.cimatec.estudos.conta;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import br.senai.cimatec.estudos.auth.UltimoLinkCapturado;
import br.senai.cimatec.estudos.usuario.UsuarioRepository;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testes-mentoria;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@Import(UltimoLinkCapturado.class)
class MentoriaTest {

    private static final String EMAIL = "mentoria@exemplo.com";
    private static final String SENHA = "senha-de-teste-1";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private UltimoLinkCapturado links;

    private MockHttpSession sessao;

    @BeforeEach
    void contaVerificadaELogada() throws Exception {
        usuarios.deleteAll();
        mvc.perform(post("/api/auth/cadastro").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nome": "Teste", "email": "%s", "senha": "%s",
                     "curso": "Redes de Computadores", "termosEPolitica": true}
                    """.formatted(EMAIL, SENHA)))
            .andExpect(status().isOk());
        mvc.perform(post("/api/auth/verificacao").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\": \"" + links.ultimoToken() + "\"}"))
            .andExpect(jsonPath("$.estado").value("ativada"));
        sessao = (MockHttpSession) mvc.perform(post("/api/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"" + EMAIL + "\", \"senha\": \"" + SENHA + "\"}"))
            .andExpect(status().isOk())
            .andReturn().getRequest().getSession(false);
    }

    @Test
    void contaNovaNasceSoComoAluno() throws Exception {
        mvc.perform(get("/api/auth/eu").session(sessao)).andExpect(status().isOk())
            .andExpect(jsonPath("$.papeis.length()").value(1))
            .andExpect(jsonPath("$.papeis[0]").value("aluno"))
            .andExpect(jsonPath("$.mentoriaDesde").isEmpty());
    }

    @Test
    void ligarViraMentorEOEuMostraNaHora() throws Exception {
        mentoria(true).andExpect(status().isOk())
            .andExpect(jsonPath("$.papeis[1]").value("mentor"))
            .andExpect(jsonPath("$.mentoriaDesde").isNotEmpty());
        mvc.perform(get("/api/auth/eu").session(sessao))
            .andExpect(jsonPath("$.papeis[1]").value("mentor"));
    }

    @Test
    void ligarDeNovoNaoMudaAData() throws Exception {
        mentoria(true);
        Instant primeira = usuarios.findByEmail(EMAIL).orElseThrow().getMentoriaDesde();
        mentoria(true).andExpect(status().isOk());
        assertThat(usuarios.findByEmail(EMAIL).orElseThrow().getMentoriaDesde()).isEqualTo(primeira);
    }

    @Test
    void desligarVoltaParaAlunoEApagaAData() throws Exception {
        mentoria(true);
        mentoria(false).andExpect(status().isOk())
            .andExpect(jsonPath("$.papeis.length()").value(1))
            .andExpect(jsonPath("$.mentoriaDesde").isEmpty());
        assertThat(usuarios.findByEmail(EMAIL).orElseThrow().getMentoriaDesde()).isNull();
    }

    @Test
    void semOCampoResponde400ENaoMudaNada() throws Exception {
        mvc.perform(patch("/api/conta/mentoria").with(csrf()).session(sessao)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Diga se quer ou não receber pedidos de ajuda."));
    }

    @Test
    void semSessaoResponde401ESemTokenCsrfResponde403() throws Exception {
        mvc.perform(patch("/api/conta/mentoria").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"receberPedidos\": true}"))
            .andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/conta/mentoria").session(sessao)
                .contentType(MediaType.APPLICATION_JSON).content("{\"receberPedidos\": true}"))
            .andExpect(status().isForbidden());
        assertThat(usuarios.findByEmail(EMAIL).orElseThrow().getMentoriaDesde()).isNull();
    }

    private ResultActions mentoria(boolean receber) throws Exception {
        return mvc.perform(patch("/api/conta/mentoria").with(csrf()).session(sessao)
            .contentType(MediaType.APPLICATION_JSON).content("{\"receberPedidos\": " + receber + "}"));
    }
}
