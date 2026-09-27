package br.senai.cimatec.estudos.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import br.senai.cimatec.estudos.usuario.Usuario;

/**
 * Imprime o link de verificação no console, com o token dentro. Só existe no perfil "dev",
 * que o spring-boot:run ativa (pom.xml). É a entrega do projeto, já que envio de e-mail
 * está fora do escopo (DECISOES.md, 2026-09-27).
 */
@Component
@Profile("dev")
public class LinkNoConsole implements EntregaDoLink {

    private static final Logger log = LoggerFactory.getLogger(LinkNoConsole.class);

    @Override
    public void entregar(Usuario usuario, String link) {
        log.info("Link de verificação da conta {}: {}", usuario.getId(), link);
    }
}
