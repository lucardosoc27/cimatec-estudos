package br.senai.cimatec.estudos.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import br.senai.cimatec.estudos.usuario.Usuario;

/**
 * ATALHO DE DESENVOLVIMENTO: imprime o link de verificação no console, com o token dentro.
 * Só existe no perfil "dev", que o spring-boot:run ativa (pom.xml) e o jar de produção não.
 * Registro e condição de saída: DECISOES.md, entrada de 2026-09-27.
 */
@Component
@Profile("dev")
public class LinkNoConsole implements EntregaDoLink {

    private static final Logger log = LoggerFactory.getLogger(LinkNoConsole.class);

    @Override
    public void entregar(Usuario usuario, String link) {
        log.info("[DEV] Link de verificação da conta {}: {}", usuario.getId(), link);
    }
}
