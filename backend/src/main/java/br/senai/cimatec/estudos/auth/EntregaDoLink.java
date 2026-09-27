package br.senai.cimatec.estudos.auth;

import br.senai.cimatec.estudos.usuario.Usuario;

/**
 * Como o link de verificação chega à pessoa. Envio de e-mail está fora do escopo do projeto
 * (DECISOES.md, 2026-09-27): a única implementação é LinkNoConsole, que existe só no perfil
 * dev. Fora dele não há bean deste tipo, DE PROPÓSITO, e o Spring se recusa a subir
 * ("required a bean of type 'EntregaDoLink' that could not be found"): conta que ninguém
 * consegue verificar seria conta desabilitada para sempre, então é melhor falhar na subida.
 */
public interface EntregaDoLink {

    void entregar(Usuario usuario, String link);
}
