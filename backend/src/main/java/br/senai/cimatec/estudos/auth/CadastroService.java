package br.senai.cimatec.estudos.auth;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import br.senai.cimatec.estudos.erros.DadoInvalidoException;
import br.senai.cimatec.estudos.usuario.Cursos;
import br.senai.cimatec.estudos.usuario.Usuario;
import br.senai.cimatec.estudos.usuario.UsuarioRepository;

/**
 * Cria a conta. A senha chega em texto só até esta classe, vira hash BCrypt e nunca é gravada
 * nem registrada em log.
 */
@Service
public class CadastroService {

    /** Versão dos termos e da política que a tela /termos exibe hoje. */
    static final String TERMOS_VERSAO = "1.0";

    // BCrypt só considera os primeiros 72 bytes; na Security 7 ele recusa senha maior.
    private static final int MAXIMO_BYTES_SENHA = 72;

    private static final Logger log = LoggerFactory.getLogger(CadastroService.class);

    private final UsuarioRepository usuarios;
    private final PasswordEncoder codificador;
    private final VerificacaoService verificacao;
    private final IntervaloDeReenvio intervalo;
    private final String dominio;

    public CadastroService(UsuarioRepository usuarios, PasswordEncoder codificador, VerificacaoService verificacao,
            IntervaloDeReenvio intervalo, @Value("${app.email.dominio}") String dominio) {
        this.usuarios = usuarios;
        this.codificador = codificador;
        this.verificacao = verificacao;
        this.intervalo = intervalo;
        this.dominio = dominio;
    }

    /**
     * Responde igual exista ou não uma conta com aquele e-mail. Quem tenta cadastrar um e-mail
     * repetido recebe a mesma tela "enviamos um link", e nenhuma conta nova é criada.
     * Motivo: um 409 "e-mail já cadastrado" permitiria descobrir quem estuda na instituição
     * (DECISOES.md, 2026-09-27).
     */
    public void cadastrar(CadastroRequest pedido) {
        String email = pedido.email().trim().toLowerCase(Locale.ROOT);
        if (!email.endsWith("@" + dominio)) {
            throw new DadoInvalidoException("Use seu e-mail institucional (@" + dominio + ").");
        }
        if (!Cursos.existe(pedido.curso())) {
            throw new DadoInvalidoException("Selecione um curso da lista.");
        }
        if (pedido.senha().getBytes(StandardCharsets.UTF_8).length > MAXIMO_BYTES_SENHA) {
            throw new DadoInvalidoException("Senha longa demais: use até 64 caracteres, e menos se tiver acentos.");
        }

        // O hash é calculado antes de conferir se o e-mail existe, de propósito: BCrypt leva
        // uns 100 ms, e se só rodasse para e-mail novo, o tempo de resposta entregaria
        // qual e-mail já tem conta.
        String senhaHash = codificador.encode(pedido.senha());

        // O cadastro conta como um envio: pedir "reenviar" logo depois espera o intervalo mínimo.
        // Registrado para todo e-mail, exista ou não, pelo mesmo motivo da resposta igual.
        intervalo.segundosAteLiberar(email);

        if (usuarios.existsByEmail(email)) {
            log.info("Cadastro com e-mail já existente: nenhuma conta criada (sem servidor de e-mail, o aviso ao dono da conta fica só neste log)");
            return;
        }
        try {
            Usuario usuario = usuarios.save(new Usuario(pedido.nome().trim(), email, senhaHash, pedido.curso(),
                TERMOS_VERSAO, pedido.quisFotoParaLogados(), pedido.quisVitrinePublica()));
            log.info("Conta {} criada, aguardando verificação do e-mail", usuario.getId());
            verificacao.iniciar(usuario);
        } catch (DataIntegrityViolationException corrida) {
            // Dois cadastros do mesmo e-mail ao mesmo tempo: o UNIQUE do banco segura o segundo.
            log.info("Cadastro com e-mail já existente (corrida): nenhuma conta criada");
        }
    }
}
