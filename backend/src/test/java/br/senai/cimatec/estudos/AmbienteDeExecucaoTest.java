package br.senai.cimatec.estudos;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;

import br.senai.cimatec.estudos.auth.UltimoLinkCapturado;

/**
 * O que o provedor de hospedagem define de fora entra por variável de ambiente. Aqui as variáveis
 * são simuladas como propriedades do teste, que o Spring resolve do mesmo jeito.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testes-ambiente;DB_CLOSE_DELAY=-1",
    "PORT=1234"})
@Import(UltimoLinkCapturado.class)
class AmbienteDeExecucaoTest {

    @Autowired
    private Environment ambiente;

    @Test
    void aPortaVemDaVariavelPortQueOProvedorDefine() {
        // O Render (e outros provedores) diz em PORT onde o servidor tem de escutar.
        assertThat(ambiente.getProperty("server.port")).isEqualTo("1234");
    }

    @Test
    void oBancoVaiParaAPastaDaVariavelAppBancoDir() {
        // O teste sobrescreve o datasource para memória, então confere a regra pelo texto do
        // application.properties resolvido com a variável.
        assertThat(ambiente.resolvePlaceholders("jdbc:h2:file:${APP_BANCO_DIR:./dados}/cimatec"))
            .isEqualTo("jdbc:h2:file:./dados/cimatec");
    }
}
