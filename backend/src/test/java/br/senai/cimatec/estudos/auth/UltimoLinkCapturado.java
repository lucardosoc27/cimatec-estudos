package br.senai.cimatec.estudos.auth;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import br.senai.cimatec.estudos.usuario.Usuario;

/**
 * Nos testes, a "entrega" do link é guardar o último em memória, para o teste extrair o token
 * e chamar a verificação como a tela faria. Substitui LinkSemEntrega (o perfil dev não está
 * ativo nos testes).
 */
@TestConfiguration
public class UltimoLinkCapturado implements EntregaDoLink {

    private String ultimoLink;

    @Bean
    @Primary
    EntregaDoLink entregaDeTeste() {
        return this;
    }

    @Override
    public void entregar(Usuario usuario, String link) {
        ultimoLink = link;
    }

    public String ultimoToken() {
        return ultimoLink.substring(ultimoLink.indexOf("token=") + "token=".length());
    }
}
