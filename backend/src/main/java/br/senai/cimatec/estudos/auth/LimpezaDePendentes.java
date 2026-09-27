package br.senai.cimatec.estudos.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.senai.cimatec.estudos.usuario.UsuarioRepository;
import br.senai.cimatec.estudos.usuario.Verificacao;

/**
 * Apaga a conta que nunca confirmou o e-mail, depois que o link venceu e passou um prazo de
 * tolerância (DECISOES.md, 2026-09-27). Dois motivos: minimização de dados (LGPD; há alunos
 * menores de idade), porque não há razão para guardar nome e e-mail de quem nunca entrou; e
 * limite para a tabela que um cadastro em massa enche (revisão de segurança, A4).
 *
 * Tolerância de 7 dias depois do vencimento, e não zero: a tela /verificar-email tem o estado
 * "link expirado, peça outro". Apagada no vencimento, quem voltasse no dia seguinte veria "link
 * inválido" e teria de se cadastrar de novo. Pedir outro link gera prazo novo, então quem está
 * tentando não é apagado.
 *
 * @Scheduled: o Spring chama o método sozinho, de hora em hora, numa thread própria. Só funciona
 * porque o BackendApplication tem @EnableScheduling.
 */
@Component
public class LimpezaDePendentes {

    private static final Logger log = LoggerFactory.getLogger(LimpezaDePendentes.class);

    private final UsuarioRepository usuarios;
    private final Duration tolerancia;

    public LimpezaDePendentes(UsuarioRepository usuarios,
            @Value("${app.verificacao.apagar-pendente-depois}") Duration tolerancia) {
        this.usuarios = usuarios;
        this.tolerancia = tolerancia;
    }

    /** Devolve quantas contas apagou. O log diz só a quantidade, nunca quem. */
    @Scheduled(initialDelay = 1, fixedDelay = 1, timeUnit = TimeUnit.HOURS)
    @Transactional
    public long apagarVencidas() {
        long apagadas = usuarios.deleteByVerificacaoAndVerificacaoExpiraEmBefore(
            Verificacao.PENDENTE, Instant.now().minus(tolerancia));
        if (apagadas > 0) {
            log.info("{} conta(s) pendente(s) com link vencido há mais de {} apagada(s)", apagadas, tolerancia);
        }
        return apagadas;
    }
}
