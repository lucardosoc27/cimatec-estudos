package br.senai.cimatec.estudos.auth;

import java.time.Instant;
import java.util.List;

import br.senai.cimatec.estudos.usuario.Usuario;

/**
 * O usuário como o front o conhece (frontend/src/app/models/usuario.ts). Só volta para o
 * próprio dono da conta, no login e em /api/auth/eu. O hash da senha e o token de verificação
 * nunca saem daqui: a resposta é montada campo a campo, não é a entidade serializada.
 */
public record UsuarioResposta(
    String id,
    String nome,
    String emailInstitucional,
    String curso,
    // O servidor não guarda foto: ela é do mock. Fica null até existir armazenamento.
    String foto,
    String termosVersao,
    // Todo usuário é aluno; mentor é escopo futuro (DECISOES.md 2026-09-20).
    List<String> papeis,
    String verificacao,
    Consentimentos consentimentos) {

    public record Consentimentos(Instant termosEPoliticaEm, Instant fotoParaLogadosEm, Instant vitrinePublicaEm) {
    }

    public static UsuarioResposta de(Usuario usuario) {
        return new UsuarioResposta(
            usuario.getId().toString(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.getCurso(),
            null,
            usuario.getTermosVersao(),
            List.of("aluno"),
            usuario.estaVerificado() ? "verificado" : "pendente",
            new Consentimentos(usuario.getTermosEPoliticaEm(), usuario.getFotoParaLogadosEm(),
                usuario.getVitrinePublicaEm()));
    }
}
