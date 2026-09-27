package br.senai.cimatec.estudos;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import br.senai.cimatec.estudos.auth.UltimoLinkCapturado;

/** Sem o perfil dev não existe entrega de link, então o teste fornece a sua (ver EntregaDoLink). */
@SpringBootTest
@Import(UltimoLinkCapturado.class)
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
