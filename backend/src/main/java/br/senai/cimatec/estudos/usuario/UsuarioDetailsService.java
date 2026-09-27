package br.senai.cimatec.estudos.usuario;

import java.util.Locale;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Como o Spring Security encontra um usuário pelo "nome de usuário", que aqui é o e-mail.
 *
 * Existir este bean tem um efeito colateral desejado: o Spring Boot para de criar o usuário
 * padrão "user" com senha aleatória no console (pendência 1 da volta ao back-end,
 * DECISOES.md 2026-09-24). Todo usuário nasce pelo cadastro.
 *
 * Quem usa isto é o DaoAuthenticationProvider, no login (commit 5). Ele compara a senha
 * digitada com o hash daqui e, se o e-mail não existir, esconde a diferença: responde
 * "credenciais inválidas" nos dois casos e ainda calcula um hash falso para o tempo de
 * resposta ficar parecido.
 */
@Service
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarios;

    public UsuarioDetailsService(UsuarioRepository usuarios) {
        this.usuarios = usuarios;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarios.findByEmail(email.trim().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new UsernameNotFoundException("e-mail não cadastrado"));
        return User.withUsername(usuario.getEmail())
            .password(usuario.getSenhaHash())
            // Só ALUNO. "Mentor" não entra aqui de propósito: as permissões ficam guardadas na
            // sessão na hora do login, e quem desligasse a mentoria continuaria mentor até sair.
            // Rota do lado do mentor lê mentoria_desde do banco a cada requisição.
            .roles("ALUNO")
            // Conta com e-mail ainda não verificado não entra (DisabledException no login).
            .disabled(!usuario.estaVerificado())
            .build();
    }
}
