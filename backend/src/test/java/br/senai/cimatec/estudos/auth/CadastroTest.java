package br.senai.cimatec.estudos.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.test.web.servlet.MockMvc;

import br.senai.cimatec.estudos.usuario.Usuario;
import br.senai.cimatec.estudos.usuario.UsuarioRepository;
import br.senai.cimatec.estudos.usuario.Verificacao;

/**
 * Sobe o contexto inteiro (Security incluído) com um H2 em memória, para o teste nunca
 * escrever no banco em arquivo de desenvolvimento. Os dados são fictícios e sem segredo:
 * a senha abaixo é de teste e nasce aqui, não em nenhum banco.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testes;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@Import(UltimoLinkCapturado.class)
class CadastroTest {

    private static final String CORPO_VALIDO = """
        {"nome": "Teste", "email": "Teste@exemplo.com", "senha": "senha-de-teste-1",
         "curso": "Redes de Computadores", "termosEPolitica": true,
         "fotoParaLogados": false, "vitrinePublica": true}
        """;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UsuarioRepository usuarios;

    @BeforeEach
    void limpar() {
        usuarios.deleteAll();
    }

    @Test
    void cadastroValidoGravaHashENasceSemVerificacao() throws Exception {
        mvc.perform(post("/api/auth/cadastro").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(CORPO_VALIDO))
            .andExpect(status().isOk());

        Usuario usuario = usuarios.findByEmail("teste@exemplo.com").orElseThrow();
        assertThat(usuario.getSenhaHash()).startsWith("$2").hasSize(60).doesNotContain("senha-de-teste-1");
        assertThat(usuario.getVerificacao()).isEqualTo(Verificacao.PENDENTE);
        assertThat(usuario.getTermosEPoliticaEm()).isNotNull();
        assertThat(usuario.getFotoParaLogadosEm()).isNull();
        assertThat(usuario.getVitrinePublicaEm()).isNotNull();
    }

    @Test
    void semOsConsentimentosOpcionaisNoJsonElesValemNao() throws Exception {
        mvc.perform(post("/api/auth/cadastro").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nome": "Teste", "email": "teste@exemplo.com", "senha": "senha-de-teste-1",
                     "curso": "Redes de Computadores", "termosEPolitica": true}
                    """))
            .andExpect(status().isOk());

        Usuario usuario = usuarios.findByEmail("teste@exemplo.com").orElseThrow();
        assertThat(usuario.getFotoParaLogadosEm()).isNull();
        assertThat(usuario.getVitrinePublicaEm()).isNull();
    }

    @Test
    void semOCampoDosTermosResponde400ComMensagem() throws Exception {
        mvc.perform(post("/api/auth/cadastro").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nome": "Teste", "email": "teste@exemplo.com", "senha": "senha-de-teste-1",
                     "curso": "Redes de Computadores"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("É preciso aceitar os termos de uso e a política de privacidade."));
    }

    @Test
    void emailRepetidoRespondeIgualENaoCriaSegundaConta() throws Exception {
        for (int vez = 0; vez < 2; vez++) {
            mvc.perform(post("/api/auth/cadastro").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(CORPO_VALIDO))
                .andExpect(status().isOk());
        }
        assertThat(usuarios.count()).isEqualTo(1);
    }

    @Test
    void emailForaDoDominioResponde400ComMensagem() throws Exception {
        mvc.perform(post("/api/auth/cadastro").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(CORPO_VALIDO.replace("Teste@exemplo.com", "teste@gmail.com")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Use seu e-mail institucional (@exemplo.com)."));
        assertThat(usuarios.count()).isZero();
    }

    @Test
    void semAceiteDosTermosResponde400() throws Exception {
        mvc.perform(post("/api/auth/cadastro").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(CORPO_VALIDO.replace("\"termosEPolitica\": true", "\"termosEPolitica\": false")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("É preciso aceitar os termos de uso e a política de privacidade."));
    }

    @Test
    void semTokenCsrfResponde403MesmoSendoRotaPublica() throws Exception {
        mvc.perform(post("/api/auth/cadastro")
                .contentType(MediaType.APPLICATION_JSON).content(CORPO_VALIDO))
            .andExpect(status().isForbidden());
        assertThat(usuarios.count()).isZero();
    }

    @Test
    void corpoMaiorQue16KbERecusadoSemSerLidoInteiro() throws Exception {
        // Cadastro válido com um campo inventado de 20 mil caracteres. O Jackson ignoraria o campo,
        // mas só depois de ler tudo para a memória; com o limite, ele para de ler no meio.
        String inchado = CORPO_VALIDO.replace("{", "{\"lixo\": \"" + "x".repeat(20_000) + "\", ");
        mvc.perform(post("/api/auth/cadastro").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(inchado))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Não foi possível ler os dados enviados. Confira os campos e tente novamente."));
        assertThat(usuarios.count()).isZero();
    }

    @Test
    void rotaNaoLiberadaSemSessaoResponde401() throws Exception {
        mvc.perform(get("/api/auth/eu")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/mentores")).andExpect(status().isUnauthorized());
    }
}
