package br.senai.cimatec.estudos.usuario;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/** O Spring Data escreve a consulta a partir do nome do método: findByEmail vira WHERE email = ?. */
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Usuario> findByVerificacaoTokenHash(String tokenHash);
}
