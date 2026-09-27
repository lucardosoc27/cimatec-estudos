package br.senai.cimatec.estudos.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.senai.cimatec.estudos.usuario.Usuario;
import br.senai.cimatec.estudos.usuario.UsuarioRepository;

/**
 * Verificação do e-mail institucional por token de uso único.
 *
 * O token tem 32 bytes aleatórios (256 bits): adivinhar um é impraticável, por isso a rota de
 * verificação não precisa de limite de tentativas. No banco fica só o hash SHA-256 do token.
 * SHA-256, e não BCrypt, porque o token já é aleatório e longo (BCrypt existe para senha
 * fraca), e porque o hash precisa ser determinístico para servir de chave de busca.
 */
@Service
public class VerificacaoService {

    private static final Logger log = LoggerFactory.getLogger(VerificacaoService.class);
    private static final int BYTES_DO_TOKEN = 32;

    private final UsuarioRepository usuarios;
    private final EntregaDoLink entrega;
    private final IntervaloDeReenvio intervalo;
    private final Duration validade;
    private final String urlDoFront;
    private final SecureRandom aleatorio = new SecureRandom();

    public VerificacaoService(UsuarioRepository usuarios, EntregaDoLink entrega, IntervaloDeReenvio intervalo,
            @Value("${app.verificacao.validade}") Duration validade,
            // A URL pública do site: o link de verificação leva para lá.
            @Value("${app.url}") String urlDoFront) {
        this.usuarios = usuarios;
        this.entrega = entrega;
        this.intervalo = intervalo;
        this.validade = validade;
        this.urlDoFront = urlDoFront;
    }

    /** Gera um token novo para a conta (o anterior deixa de valer), grava o hash e entrega o link. */
    @Transactional
    public void iniciar(Usuario usuario) {
        byte[] bytes = new byte[BYTES_DO_TOKEN];
        aleatorio.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        usuario.iniciarVerificacao(hash(token), Instant.now().plus(validade));
        usuarios.save(usuario);
        entrega.entregar(usuario, urlDoFront + "/verificar-email?token=" + token);
    }

    /** Consome o token no primeiro uso. Os outros três resultados não mudam nada no banco. */
    @Transactional
    public ResultadoVerificacao verificar(String token) {
        Usuario usuario = usuarios.findByVerificacaoTokenHash(hash(token)).orElse(null);
        if (usuario == null) {
            return ResultadoVerificacao.INVALIDO;
        }
        if (usuario.getVerificadoEm() != null) {
            return ResultadoVerificacao.JA_USADO;
        }
        Instant agora = Instant.now();
        if (usuario.getVerificacaoExpiraEm().isBefore(agora)) {
            return ResultadoVerificacao.EXPIRADO;
        }
        usuario.confirmarVerificacao(agora);
        log.info("Conta {} verificada", usuario.getId());
        return ResultadoVerificacao.ATIVADA;
    }

    /**
     * Responde igual exista ou não a conta (só o intervalo mínimo responde diferente, e ele vale
     * para qualquer e-mail). Só gera token novo para conta que existe e ainda está pendente.
     */
    public void reenviar(String emailInformado) {
        String email = emailInformado.trim().toLowerCase(Locale.ROOT);
        intervalo.segundosAteLiberar(email).ifPresent(segundos -> {
            throw new ReenvioBloqueadoException(segundos);
        });
        usuarios.findByEmail(email).ifPresentOrElse(usuario -> {
            if (usuario.estaVerificado()) {
                log.info("Reenvio para conta {} já verificada: nada a enviar", usuario.getId());
                return;
            }
            iniciar(usuario);
        }, () -> log.info("Reenvio para e-mail sem conta: nada a enviar"));
    }

    private static String hash(String token) {
        try {
            byte[] resumo = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(resumo);
        } catch (NoSuchAlgorithmException impossivel) {
            // SHA-256 faz parte de toda JVM; a exceção existe só porque a API é genérica.
            throw new IllegalStateException(impossivel);
        }
    }
}
