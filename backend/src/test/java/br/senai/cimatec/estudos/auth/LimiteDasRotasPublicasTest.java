package br.senai.cimatec.estudos.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import br.senai.cimatec.estudos.usuario.UsuarioRepository;

/** Limite pequeno (3) para o teste; em produção são 100 pedidos em 5 minutos por origem. */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testes-rotas-publicas;DB_CLOSE_DELAY=-1",
    "app.rotas-publicas.limite-por-origem=3"})
@AutoConfigureMockMvc
@Import(UltimoLinkCapturado.class)
class LimiteDasRotasPublicasTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UsuarioRepository usuarios;

    @Test
    void cadastroVerificacaoEReenvioContamJuntosPorOrigem() throws Exception {
        String origem = "10.50.0.1";
        cadastrar("um@exemplo.com", origem).andExpect(status().isOk());
        pedir("/api/auth/verificacao", "{\"token\": \"inventado\"}", origem).andExpect(status().isOk());
        pedir("/api/auth/reenviar", "{\"email\": \"dois@exemplo.com\"}", origem).andExpect(status().isOk());

        // Quarto pedido da mesma origem, em qualquer das três rotas: 429, e o cadastro nem acontece.
        cadastrar("tres@exemplo.com", origem).andExpect(status().isTooManyRequests())
            .andExpect(header().exists("Retry-After"))
            .andExpect(jsonPath("$.message").value("Muitos pedidos deste endereço. Aguarde alguns minutos e tente de novo."));
        pedir("/api/auth/verificacao", "{\"token\": \"inventado\"}", origem).andExpect(status().isTooManyRequests());
        assertThat(usuarios.findByEmail("tres@exemplo.com")).isEmpty();

        // Outra origem segue livre.
        cadastrar("tres@exemplo.com", "10.50.0.2").andExpect(status().isOk());
    }

    private ResultActions cadastrar(String email, String origem) throws Exception {
        return pedir("/api/auth/cadastro", """
            {"nome": "Teste", "email": "%s", "senha": "senha-de-teste-1",
             "curso": "Redes de Computadores", "termosEPolitica": true}
            """.formatted(email), origem);
    }

    private ResultActions pedir(String rota, String corpo, String origem) throws Exception {
        return mvc.perform(post(rota).with(csrf())
            .with(req -> { req.setRemoteAddr(origem); return req; })
            .contentType(MediaType.APPLICATION_JSON).content(corpo));
    }
}
