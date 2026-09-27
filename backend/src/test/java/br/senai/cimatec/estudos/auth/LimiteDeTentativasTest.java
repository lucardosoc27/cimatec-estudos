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
import org.springframework.test.web.servlet.ResultActions;

import br.senai.cimatec.estudos.usuario.UsuarioRepository;

/** Limites pequenos e bloqueio de 1 s, para o teste conseguir esperar o prazo passar. */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testes-limite;DB_CLOSE_DELAY=-1",
    "app.login.limite-por-conta=3",
    "app.login.limite-por-origem=6",
    "app.login.bloqueio=1s"})
@AutoConfigureMockMvc
@Import(UltimoLinkCapturado.class)
class LimiteDeTentativasTest {

    private static final String SENHA = "senha-de-teste-1";
    private static final String BLOQUEIO = "{\"message\":\"Muitas tentativas. Aguarde antes de tentar novamente.\"}";
    // Cada teste vem de um IP próprio: o contador por origem não vaza de um teste para outro.
    private static final AtomicInteger IP = new AtomicInteger(10);

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private UltimoLinkCapturado links;

    private String email;
    private String origem;

    @BeforeEach
    void contaVerificada() throws Exception {
        usuarios.deleteAll();
        int n = IP.incrementAndGet();
        origem = "10.0.0." + n;
        email = "limite" + n + "@exemplo.com";
        mvc.perform(post("/api/auth/cadastro").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nome": "Teste", "email": "%s", "senha": "%s",
                     "curso": "Redes de Computadores", "termosEPolitica": true}
                    """.formatted(email, SENHA)))
            .andExpect(status().isOk());
        mvc.perform(post("/api/auth/verificacao").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"token\": \"" + links.ultimoToken() + "\"}"));
    }

    @Test
    void passouDoLimiteBloqueiaAtéASenhaCertaEDestravaSozinho() throws Exception {
        for (int i = 0; i < 3; i++) {
            entrar(email, "senha-errada-1", origem).andExpect(status().isUnauthorized());
        }
        entrar(email, SENHA, origem).andExpect(status().isTooManyRequests())
            .andExpect(header().exists("Retry-After"));
        Thread.sleep(1100);
        entrar(email, SENHA, origem).andExpect(status().isOk());
    }

    @Test
    void emailInexistenteBloqueiaIgual() throws Exception {
        String existente = null;
        String inexistente = null;
        for (int i = 0; i < 4; i++) {
            ResultActions r1 = entrar(email, "senha-errada-1", origem);
            ResultActions r2 = entrar("ninguem" + origem + "@exemplo.com", "senha-errada-1", "10.9.9." + i);
            existente = r1.andReturn().getResponse().getStatus() + r1.andReturn().getResponse().getContentAsString();
            inexistente = r2.andReturn().getResponse().getStatus() + r2.andReturn().getResponse().getContentAsString();
        }
        assertThat(existente).isEqualTo(inexistente).isEqualTo("429" + BLOQUEIO);
    }

    @Test
    void maiusculasEEspacosSaoAMesmaConta() throws Exception {
        entrar(email, "senha-errada-1", origem);
        entrar(email.toUpperCase(), "senha-errada-1", origem);
        entrar("  " + email + " ", "senha-errada-1", origem);
        entrar(email, SENHA, origem).andExpect(status().isTooManyRequests());
    }

    @Test
    void acertoZeraAContagemDaConta() throws Exception {
        entrar(email, "senha-errada-1", origem);
        entrar(email, "senha-errada-1", origem);
        entrar(email, SENHA, origem).andExpect(status().isOk());
        entrar(email, "senha-errada-1", origem).andExpect(status().isUnauthorized());
        entrar(email, "senha-errada-1", origem).andExpect(status().isUnauthorized());
        entrar(email, SENHA, origem).andExpect(status().isOk());
    }

    @Test
    void muitasContasDaMesmaOrigemBloqueiamAOrigem() throws Exception {
        for (int i = 0; i < 6; i++) {
            entrar("alvo" + i + "@exemplo.com", "senha-comum-1", origem).andExpect(status().isUnauthorized());
        }
        entrar("alvo9@exemplo.com", "senha-comum-1", origem).andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.message").value("Muitas tentativas. Aguarde antes de tentar novamente."));
        // A mesma conta, de outra origem, segue livre: o bloqueio foi do IP.
        entrar(email, SENHA, "10.8.8.8").andExpect(status().isOk());
    }

    @Test
    void emailOuSenhaGrandesDemaisSaoRecusadosSemContarTentativa() throws Exception {
        // Maiores do que qualquer conta real: o cadastro aceita e-mail até 254 e senha até 64.
        String emailGrande = "a".repeat(250) + "@exemplo.com";
        String senhaGrande = "a1".repeat(33);
        // Oito pedidos, mais do que o limite por origem (6) e por conta (3) deste teste: se
        // contassem como tentativa, a origem e a conta estariam travadas no fim.
        for (int i = 0; i < 4; i++) {
            entrar(emailGrande, "senha-errada-1", origem).andExpect(status().isBadRequest());
            entrar(email, senhaGrande, origem).andExpect(status().isBadRequest());
        }
        entrar(email, SENHA, origem).andExpect(status().isOk());
    }

    @Test
    void origemBloqueadaNaoContaTentativaNaContaDeOutraPessoa() throws Exception {
        // Esgota a origem (limite 6 neste teste) com contas inventadas.
        for (int i = 0; i < 7; i++) {
            entrar("alvo" + i + "@exemplo.com", "senha-comum-1", origem);
        }
        // Já bloqueada, a origem insiste na conta da vítima mais vezes do que o limite por conta.
        for (int i = 0; i < 4; i++) {
            entrar(email, "senha-errada-1", origem).andExpect(status().isTooManyRequests());
        }
        // A vítima, da origem dela, entra com a senha certa: nada daquilo contou contra a conta.
        entrar(email, SENHA, "10.7.7.7").andExpect(status().isOk());
    }

    @Test
    void enderecosIpv6DoMesmoBloco64SaoAMesmaOrigem() throws Exception {
        // Esgota a origem (limite 6 neste teste) a partir de um endereço do bloco 2001:db8:0:1::/64.
        for (int i = 0; i < 7; i++) {
            entrar("alvo" + i + "@exemplo.com", "senha-comum-1", "2001:db8:0:1::" + (i + 1));
        }
        // Outro endereço do MESMO bloco /64: é a mesma assinatura, continua bloqueado.
        entrar(email, SENHA, "2001:db8:0:1:ffff:ffff:ffff:ffff").andExpect(status().isTooManyRequests());
        // O bloco vizinho é outra origem.
        entrar(email, SENHA, "2001:db8:0:2::1").andExpect(status().isOk());
    }

    private ResultActions entrar(String quem, String senha, String ip) throws Exception {
        return mvc.perform(post("/api/auth/login").with(csrf())
            .with(req -> { req.setRemoteAddr(ip); return req; })
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\": \"" + quem + "\", \"senha\": \"" + senha + "\"}"));
    }
}
