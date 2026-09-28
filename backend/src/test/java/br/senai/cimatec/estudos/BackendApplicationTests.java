package br.senai.cimatec.estudos;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;

import javax.sql.DataSource;

import java.util.Properties;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.PropertiesLoaderUtils;

import br.senai.cimatec.estudos.auth.UltimoLinkCapturado;

/** Sem o perfil dev não existe entrega de link, então o teste fornece a sua (ver EntregaDoLink). */
@SpringBootTest
@Import(UltimoLinkCapturado.class)
class BackendApplicationTests {

	@Autowired
	private DataSource banco;

	@Autowired
	private Environment ambiente;

	@Test
	void contextLoads() {
	}

	/**
	 * Este teste não troca o datasource, de propósito: ele prova que o padrão dos testes
	 * (src/test/resources/config/application.properties) é o banco em memória, e não o
	 * backend/dados/ do desenvolvimento. A URL vem da conexão aberta, não da propriedade.
	 */
	@Test
	void testesNuncaAbremOBancoDeDesenvolvimento() throws Exception {
		try (Connection conexao = banco.getConnection()) {
			assertThat(conexao.getMetaData().getURL()).startsWith("jdbc:h2:mem:");
		}
	}

	/**
	 * Produção segura por omissão: sem o perfil dev (e os testes rodam sem ele), o cookie de
	 * sessão é Secure. Quem desliga é o application-dev.properties, de forma explícita.
	 */
	/** Sem a variável PORT, a porta é a 8080 de sempre. */
	@Test
	void semAVariavelPortAPortaE8080() {
		assertThat(ambiente.getProperty("server.port")).isEqualTo("8080");
	}

	@Test
	void cookieDeSessaoESecureForaDoPerfilDev() throws Exception {
		assertThat(ambiente.getProperty("server.servlet.session.cookie.secure", Boolean.class)).isTrue();
		assertThat(ambiente.getActiveProfiles()).doesNotContain("dev");

		Properties dev = PropertiesLoaderUtils.loadProperties(new ClassPathResource("application-dev.properties"));
		assertThat(dev.getProperty("server.servlet.session.cookie.secure")).isEqualTo("false");
	}

}
