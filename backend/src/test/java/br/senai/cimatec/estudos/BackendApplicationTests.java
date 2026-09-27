package br.senai.cimatec.estudos;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import br.senai.cimatec.estudos.auth.UltimoLinkCapturado;

/** Sem o perfil dev não existe entrega de link, então o teste fornece a sua (ver EntregaDoLink). */
@SpringBootTest
@Import(UltimoLinkCapturado.class)
class BackendApplicationTests {

	@Autowired
	private DataSource banco;

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

}
