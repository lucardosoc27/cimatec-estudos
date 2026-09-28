package br.senai.cimatec.estudos.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * O perfil demo é o do servidor público de demonstração (Render). Sem o UltimoLinkCapturado dos
 * outros testes, de propósito: aqui a entrega do link tem de vir do próprio perfil. APP_URL faz o
 * papel da variável de ambiente que o Render recebe.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testes-demo;DB_CLOSE_DELAY=-1",
    "APP_URL=https://demo.exemplo.com"})
@ActiveProfiles("demo")
@AutoConfigureMockMvc
@ExtendWith(OutputCaptureExtension.class)
class PerfilDemoTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private EntregaDoLink entrega;

    @Autowired
    private Environment ambiente;

    @Test
    void noPerfilDemoOLinkDeVerificacaoVaiParaOLogComAUrlDoAmbiente(CapturedOutput saida) throws Exception {
        assertThat(entrega).isInstanceOf(LinkNoConsole.class);

        mvc.perform(post("/api/auth/cadastro").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nome": "Demo", "email": "demo@exemplo.com", "senha": "senha-de-teste-1",
                     "curso": "Redes de Computadores", "termosEPolitica": true}
                    """))
            .andExpect(status().isOk());

        assertThat(saida.getOut())
            .contains("Link de verificação da conta")
            .contains("https://demo.exemplo.com/verificar-email?token=");
    }

    @Test
    void perfilDemoMantemOsValoresDeProducaoQueImportam() {
        // Demonstração não é desenvolvimento: cookie Secure ligado (o Render serve HTTPS) e o
        // domínio de demonstração explícito.
        assertThat(ambiente.getProperty("server.servlet.session.cookie.secure", Boolean.class)).isTrue();
        assertThat(ambiente.getProperty("app.email.dominio")).isEqualTo("exemplo.com");
        assertThat(ambiente.getProperty("app.url")).isEqualTo("https://demo.exemplo.com");
    }
}
