package br.senai.cimatec.estudos.auth;

import br.senai.cimatec.estudos.usuario.Usuario;

/**
 * Como o link de verificação chega à pessoa. Num sistema real, por e-mail. Neste projeto não
 * há servidor de e-mail, então existem duas implementações: LinkNoConsole (perfil dev) e
 * LinkSemEntrega (qualquer outro perfil). O serviço não sabe qual está ativa.
 */
public interface EntregaDoLink {

    void entregar(Usuario usuario, String link);
}
