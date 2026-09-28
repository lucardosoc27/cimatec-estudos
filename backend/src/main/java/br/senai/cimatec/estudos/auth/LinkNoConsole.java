package br.senai.cimatec.estudos.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import br.senai.cimatec.estudos.usuario.Usuario;

/**
 * Escreve o link de verificação, com o token dentro, no log da aplicação. É a entrega do
 * projeto, já que envio de e-mail está fora do escopo (DECISOES.md, 2026-09-27).
 *
 * Existe em dois perfis, e só neles:
 * - dev: o ./mvnw spring-boot:run liga (pom.xml); o log é o terminal de quem desenvolve;
 * - demo: o servidor público de demonstração (Render); o log é lido no painel do provedor.
 *   Quem lê esse log ativa qualquer conta, por isso demonstração não é produção (DECISOES.md,
 *   2026-09-27, "Perfil demo").
 * Fora dos dois não há entrega nenhuma e o servidor se recusa a subir (ver EntregaDoLink).
 */
@Component
@Profile({"dev", "demo"})
public class LinkNoConsole implements EntregaDoLink {

    private static final Logger log = LoggerFactory.getLogger(LinkNoConsole.class);

    @Override
    public void entregar(Usuario usuario, String link) {
        log.info("Link de verificação da conta {}: {}", usuario.getId(), link);
    }
}
