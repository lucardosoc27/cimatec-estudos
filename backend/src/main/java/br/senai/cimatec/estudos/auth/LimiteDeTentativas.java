package br.senai.cimatec.estudos.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Limite de tentativas de login, por conta e por origem (DECISOES.md, 2026-09-27).
 *
 * - Conta = o e-mail DIGITADO, normalizado, exista ou não. Se só contasse para conta existente,
 *   o bloqueio (429) entregaria quem tem cadastro.
 * - Origem = o IP da conexão (getRemoteAddr), nunca o header X-Forwarded-For, que qualquer um
 *   escreve (DECISOES.md, 2026-09-24). Pega quem testa uma senha em muitas contas.
 * - A tentativa é contada ANTES de conferir a senha, numa operação atômica: requisições em
 *   paralelo não passam todas pelo mesmo buraco. Quem acerta a senha devolve a tentativa.
 * - A origem é conferida primeiro. Origem bloqueada para ali: não conta a conta nem cria entrada
 *   nova no mapa por conta. Antes, um IP já bloqueado continuava trancando contas de outras
 *   pessoas e enchendo a memória (revisão de segurança de 2026-09-27, D3).
 * - Estourou: bloqueio temporário; destrava sozinho quando o prazo passa.
 *
 * Contadores em memória: zeram quando o servidor reinicia e não valem para mais de uma
 * instância (limitação registrada em 2026-09-24). As entradas vencidas são apagadas a cada
 * chamada, sem agendador, para o mapa não crescer para sempre.
 *
 * Teto de memória: só tentativa que passou pela origem cria entrada por conta, e cada origem
 * passa no máximo limitePorOrigem (20) por janela de 15 minutos. Uma entrada vive no máximo
 * janela + bloqueio (30 minutos), então cada origem mantém no máximo 3 x 20 = 60 entradas vivas,
 * cada uma com chave de até 254 caracteres (LoginRequest): menos de 60 KB por endereço de origem.
 */
@Component
public class LimiteDeTentativas {

    /** Tentativas dentro da janela e, se estourou, até quando fica bloqueado. */
    private record Contagem(int tentativas, Instant inicio, Instant bloqueadoAte) {
    }

    private final int limitePorConta;
    private final int limitePorOrigem;
    private final Duration janela;
    private final Duration bloqueio;
    private final Map<String, Contagem> porConta = new ConcurrentHashMap<>();
    private final Map<String, Contagem> porOrigem = new ConcurrentHashMap<>();

    public LimiteDeTentativas(
            @Value("${app.login.limite-por-conta}") int limitePorConta,
            @Value("${app.login.limite-por-origem}") int limitePorOrigem,
            @Value("${app.login.janela}") Duration janela,
            @Value("${app.login.bloqueio}") Duration bloqueio) {
        this.limitePorConta = limitePorConta;
        this.limitePorOrigem = limitePorOrigem;
        this.janela = janela;
        this.bloqueio = bloqueio;
    }

    /**
     * Conta esta tentativa. Devolve quantos segundos faltam se a conta ou a origem estiver
     * bloqueada (aí a senha nem deve ser conferida); vazio se pode seguir.
     */
    public Optional<Long> registrarTentativa(String conta, String origem) {
        Instant agora = Instant.now();
        limparVencidas(agora);
        Instant ateOrigem = contar(porOrigem, origem, limitePorOrigem, agora);
        if (ateOrigem.isAfter(agora)) {
            // Origem bloqueada: a conta só é LIDA (get não cria entrada), para o Retry-After
            // dizer o prazo maior quando a conta também está bloqueada.
            Contagem daConta = porConta.get(conta);
            Instant ateConta = daConta != null ? daConta.bloqueadoAte() : Instant.EPOCH;
            return Optional.of(segundosAte(ateConta.isAfter(ateOrigem) ? ateConta : ateOrigem, agora));
        }
        Instant ateConta = contar(porConta, conta, limitePorConta, agora);
        if (ateConta.isAfter(agora)) {
            return Optional.of(segundosAte(ateConta, agora));
        }
        return Optional.empty();
    }

    private static long segundosAte(Instant ate, Instant agora) {
        return Math.max(1, Duration.between(agora, ate).toSeconds() + 1);
    }

    /**
     * A senha estava certa (login feito, ou conta pendente com senha certa): a conta zera, e a
     * origem recebe a tentativa de volta. A origem não zera, senão um atacante entraria na
     * própria conta para limpar o contador do IP dele.
     */
    public void registrarAcerto(String conta, String origem) {
        porConta.remove(conta);
        porOrigem.computeIfPresent(origem, (chave, atual) -> atual.tentativas() <= 1
            ? null
            : new Contagem(atual.tentativas() - 1, atual.inicio(), atual.bloqueadoAte()));
    }

    /** Soma 1 à chave e devolve até quando ela está bloqueada (EPOCH = não está). */
    private Instant contar(Map<String, Contagem> mapa, String chave, int limite, Instant agora) {
        Contagem nova = mapa.compute(chave, (k, atual) -> {
            if (atual != null && atual.bloqueadoAte().isAfter(agora)) {
                return atual; // bloqueada: não conta, só espera o prazo.
            }
            boolean cumpriuBloqueio = atual != null && atual.bloqueadoAte().isAfter(Instant.EPOCH);
            if (atual == null || cumpriuBloqueio || atual.inicio().plus(janela).isBefore(agora)) {
                // Janela nova: primeira tentativa, janela vencida, ou bloqueio já cumprido. Sem o
                // terceiro caso, a contagem seguiria acima do limite e bloquearia de novo na hora.
                atual = new Contagem(0, agora, Instant.EPOCH);
            }
            int tentativas = atual.tentativas() + 1;
            // Passar do limite bloqueia esta tentativa e as próximas, até o prazo acabar.
            Instant ate = tentativas > limite ? agora.plus(bloqueio) : Instant.EPOCH;
            return new Contagem(tentativas, atual.inicio(), ate);
        });
        return nova.bloqueadoAte();
    }

    private void limparVencidas(Instant agora) {
        porConta.values().removeIf(c -> vencida(c, agora));
        porOrigem.values().removeIf(c -> vencida(c, agora));
    }

    private boolean vencida(Contagem c, Instant agora) {
        return c.inicio().plus(janela).isBefore(agora) && !c.bloqueadoAte().isAfter(agora);
    }
}
