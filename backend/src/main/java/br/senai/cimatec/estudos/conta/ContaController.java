package br.senai.cimatec.estudos.conta;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.senai.cimatec.estudos.auth.UsuarioResposta;
import br.senai.cimatec.estudos.usuario.Usuario;
import br.senai.cimatec.estudos.usuario.UsuarioRepository;
import jakarta.validation.Valid;

/**
 * A conta de quem está logado. Nenhuma rota aqui recebe id: a conta é sempre a da sessão, então
 * não existe como pedir para alterar a conta de outra pessoa. Nada foi liberado no SecurityConfig:
 * pelo "nega por padrão", toda rota daqui exige sessão (401 sem ela) e token CSRF (403 sem ele).
 */
@RestController
@RequestMapping("/api/conta")
public class ContaController {

    private final UsuarioRepository usuarios;

    public ContaController(UsuarioRepository usuarios) {
        this.usuarios = usuarios;
    }

    /** "Quero receber pedidos de ajuda", em Minha conta. Devolve a conta como o /eu, já atualizada. */
    @PatchMapping("/mentoria")
    @Transactional
    public UsuarioResposta mentoria(@Valid @RequestBody MentoriaRequest pedido, Authentication autenticacao) {
        Usuario usuario = usuarios.findByEmail(autenticacao.getName()).orElseThrow();
        if (pedido.receberPedidos()) {
            // O H2 guarda até microssegundos. Cortar antes faz esta resposta e o /eu seguinte
            // mostrarem exatamente a mesma data.
            usuario.ligarMentoria(Instant.now().truncatedTo(ChronoUnit.MICROS));
        } else {
            usuario.desligarMentoria();
        }
        return UsuarioResposta.de(usuario);
    }
}
