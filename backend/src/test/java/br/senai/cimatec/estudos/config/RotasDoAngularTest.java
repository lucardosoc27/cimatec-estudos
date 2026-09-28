package br.senai.cimatec.estudos.config;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import br.senai.cimatec.estudos.auth.UltimoLinkCapturado;

/**
 * O Angular compilado mora dentro do jar (copiado para static/ no build). Nos testes o index.html
 * é o de src/test/resources/static, que existe mesmo sem o front compilado.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testes-angular;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@Import(UltimoLinkCapturado.class)
class RotasDoAngularTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void raizERotaInternaDoAngularDevolvemOIndexSemLogin() throws Exception {
        // A raiz é a "página inicial" do Boot: um forward interno para /index.html, que o MockMvc
        // registra mas não segue. O Tomcat de verdade segue, e o navegador recebe o index.
        mvc.perform(get("/")).andExpect(status().isOk()).andExpect(forwardedUrl("index.html"));
        for (String rota : new String[] {"/index.html", "/mentores/m-ana", "/pedidos/p-001", "/entrar?voltar=/conta"}) {
            mvc.perform(get(rota)).andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("<app-root>")));
        }
    }

    @Test
    void arquivoDoAngularEServidoSemLogin() throws Exception {
        mvc.perform(get("/main-teste.js")).andExpect(status().isOk())
            .andExpect(content().string(containsString("Arquivo de teste")));
    }

    @Test
    void rotaDaApiQueNaoExisteNaoCaiNoIndex() throws Exception {
        // Sem login: 401 do nega por padrão, e não a página do Angular com 200.
        mvc.perform(get("/api/nao-existe")).andExpect(status().isUnauthorized());
        // Logado: 404 de verdade, sem o index no corpo.
        mvc.perform(get("/api/nao-existe").with(user("alguem"))).andExpect(status().isNotFound())
            .andExpect(content().string(not(containsString("<app-root>"))));
    }

    @Test
    void arquivoQueNaoExisteE404ENaoOIndex() throws Exception {
        mvc.perform(get("/assets/nao-existe.png")).andExpect(status().isNotFound());
        mvc.perform(get("/main-outro.js")).andExpect(status().isNotFound());
    }

    @Test
    void foraDaApiSoGetELiberado() throws Exception {
        mvc.perform(post("/mentores").with(csrf())).andExpect(status().isUnauthorized());
    }
}
