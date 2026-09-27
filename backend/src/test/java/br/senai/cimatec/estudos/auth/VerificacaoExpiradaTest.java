package br.senai.cimatec.estudos.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import br.senai.cimatec.estudos.usuario.UsuarioRepository;
import br.senai.cimatec.estudos.usuario.Verificacao;

/** Contexto próprio, com validade de 1 ms: todo token já nasce vencido. */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testes-expirado;DB_CLOSE_DELAY=-1",
    "app.verificacao.validade=1ms"})
@AutoConfigureMockMvc
@Import(UltimoLinkCapturado.class)
class VerificacaoExpiradaTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private UltimoLinkCapturado links;

    @Test
    void tokenVencidoRespondeExpiradoEContaSeguePendente() throws Exception {
        mvc.perform(post("/api/auth/cadastro").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nome": "Teste", "email": "vencido@exemplo.com", "senha": "senha-de-teste-1",
                     "curso": "Redes de Computadores", "termosEPolitica": true}
                    """))
            .andExpect(status().isOk());
        Thread.sleep(5);

        mvc.perform(post("/api/auth/verificacao").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\": \"" + links.ultimoToken() + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado").value("expirado"));

        assertThat(usuarios.findByEmail("vencido@exemplo.com").orElseThrow().getVerificacao())
            .isEqualTo(Verificacao.PENDENTE);
    }
}
