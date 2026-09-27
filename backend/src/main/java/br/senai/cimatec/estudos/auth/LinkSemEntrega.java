package br.senai.cimatec.estudos.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import br.senai.cimatec.estudos.usuario.Usuario;

/**
 * Fora do perfil dev não há como entregar o link, e o token não pode ir para o log. Avisa,
 * sem o token, que o envio de e-mail ainda não existe. Trocar por envio real é trabalho futuro.
 */
@Component
@Profile("!dev")
public class LinkSemEntrega implements EntregaDoLink {

    private static final Logger log = LoggerFactory.getLogger(LinkSemEntrega.class);

    @Override
    public void entregar(Usuario usuario, String link) {
        log.warn("Link de verificação gerado para a conta {}, mas não há envio de e-mail configurado", usuario.getId());
    }
}
