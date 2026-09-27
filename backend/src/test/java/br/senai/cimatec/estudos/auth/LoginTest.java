package br.senai.cimatec.estudos.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import br.senai.cimatec.estudos.usuario.UsuarioRepository;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testes-login;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@Import(UltimoLinkCapturado.class)
class LoginTest {

    private static final String VERIFICADA = "verificada@exemplo.com";
    private static final String PENDENTE = "pendente@exemplo.com";
    private static final String SENHA = "senha-de-teste-1";
    private static final String CORPO_INVALIDO = "{\"message\":\"e-mail ou senha inválidos\"}";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private UltimoLinkCapturado links;

    @BeforeEach
    void duasContas() throws Exception {
        usuarios.deleteAll();
        cadastrar(VERIFICADA);
        mvc.perform(post("/api/auth/verificacao").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\": \"" + links.ultimoToken() + "\"}"))
            .andExpect(jsonPath("$.estado").value("ativada"));
        cadastrar(PENDENTE);
    }

    @Test
    void loginValidoDevolveOUsuarioSemHashNemToken() throws Exception {
        entrar(VERIFICADA, SENHA).andExpect(status().isOk())
            .andExpect(jsonPath("$.emailInstitucional").value(VERIFICADA))
            .andExpect(jsonPath("$.nome").value("Teste"))
            .andExpect(jsonPath("$.papeis[0]").value("aluno"))
            .andExpect(jsonPath("$.verificacao").value("verificado"))
            .andExpect(jsonPath("$.consentimentos.termosEPoliticaEm").exists())
            .andExpect(jsonPath("$.senhaHash").doesNotExist())
            .andExpect(jsonPath("$.verificacaoTokenHash").doesNotExist());
    }

    @Test
    void senhaErradaEEmailInexistenteRespondemIgual() throws Exception {
        String senhaErrada = entrar(VERIFICADA, "senha-errada-1").andExpect(status().isUnauthorized())
            .andReturn().getResponse().getContentAsString();
        String inexistente = entrar("ninguem@exemplo.com", SENHA).andExpect(status().isUnauthorized())
            .andReturn().getResponse().getContentAsString();
        assertThat(senhaErrada).isEqualTo(inexistente).isEqualTo(CORPO_INVALIDO);
    }

    @Test
    void contaPendenteComSenhaCertaPedeConfirmacaoEComSenhaErradaRespondeComoInvalida() throws Exception {
        entrar(PENDENTE, SENHA).andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(
                "Confirme seu e-mail institucional antes de entrar. Não chegou? Peça um novo link."));
        String senhaErrada = entrar(PENDENTE, "senha-errada-1").andExpect(status().isUnauthorized())
            .andReturn().getResponse().getContentAsString();
        assertThat(senhaErrada).isEqualTo(CORPO_INVALIDO);
    }

    @Test
    void loginTrocaOIdDaSessaoQueJaExistia() throws Exception {
        MockHttpSession sessao = new MockHttpSession();
        String idAntes = sessao.getId();
        entrar(VERIFICADA, SENHA, sessao).andExpect(status().isOk());
        assertThat(sessao.getId()).isNotEqualTo(idAntes);
    }

    @Test
    void euComSessaoDevolveOUsuarioESemSessaoResponde401() throws Exception {
        MockHttpSession sessao = sessaoLogada();
        mvc.perform(get("/api/auth/eu").session(sessao)).andExpect(status().isOk())
            .andExpect(jsonPath("$.emailInstitucional").value(VERIFICADA));
        mvc.perform(get("/api/auth/eu")).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutInvalidaASessaoNoServidor() throws Exception {
        MockHttpSession sessao = sessaoLogada();
        mvc.perform(post("/api/auth/logout").with(csrf()).session(sessao)).andExpect(status().isOk());
        assertThat(sessao.isInvalid()).isTrue();
    }

    @Test
    void logoutSemTokenCsrfResponde403() throws Exception {
        mvc.perform(post("/api/auth/logout").session(sessaoLogada())).andExpect(status().isForbidden());
    }

    @Test
    void errosDeUmaTurmaAtrasDoMesmoNatNaoTrancamOLoginDeTodos() throws Exception {
        // Números de produção: esta classe não troca os limites. Uma turma atrás do mesmo NAT
        // (um IP só) erra 25 senhas, cada pessoa na própria conta; quem digita certo ainda entra.
        String nat = "10.20.30.40";
        for (int i = 0; i < 25; i++) {
            entrarDe("colega" + i + "@exemplo.com", "senha-errada-1", nat).andExpect(status().isUnauthorized());
        }
        entrarDe(VERIFICADA, SENHA, nat).andExpect(status().isOk());
    }

    @Test
    void contaApagadaComSessaoVivaResponde401EEncerraASessao() throws Exception {
        MockHttpSession sessao = sessaoLogada();
        usuarios.delete(usuarios.findByEmail(VERIFICADA).orElseThrow());

        mvc.perform(get("/api/auth/eu").session(sessao)).andExpect(status().isUnauthorized());
        assertThat(sessao.isInvalid()).isTrue();
    }

    @Test
    void contaApagadaComSessaoVivaNaoMudaAChaveDeMentoria() throws Exception {
        MockHttpSession sessao = sessaoLogada();
        usuarios.delete(usuarios.findByEmail(VERIFICADA).orElseThrow());

        mvc.perform(patch("/api/conta/mentoria").with(csrf()).session(sessao)
                .contentType(MediaType.APPLICATION_JSON).content("{\"receberPedidos\": true}"))
            .andExpect(status().isUnauthorized());
    }

    private ResultActions entrarDe(String email, String senha, String ip) throws Exception {
        return mvc.perform(post("/api/auth/login").with(csrf())
            .with(req -> { req.setRemoteAddr(ip); return req; })
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\": \"" + email + "\", \"senha\": \"" + senha + "\"}"));
    }

    private MockHttpSession sessaoLogada() throws Exception {
        MvcResult resultado = entrar(VERIFICADA, SENHA).andExpect(status().isOk()).andReturn();
        return (MockHttpSession) resultado.getRequest().getSession(false);
    }

    private ResultActions entrar(String email, String senha) throws Exception {
        return entrar(email, senha, new MockHttpSession());
    }

    private ResultActions entrar(String email, String senha, MockHttpSession sessao) throws Exception {
        return mvc.perform(post("/api/auth/login").with(csrf()).session(sessao)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\": \"" + email + "\", \"senha\": \"" + senha + "\"}"));
    }

    private void cadastrar(String email) throws Exception {
        mvc.perform(post("/api/auth/cadastro").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nome": "Teste", "email": "%s", "senha": "%s",
                     "curso": "Redes de Computadores", "termosEPolitica": true}
                    """.formatted(email, SENHA)))
            .andExpect(status().isOk());
    }
}
