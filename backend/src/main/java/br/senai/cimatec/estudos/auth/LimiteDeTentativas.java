package br.senai.cimatec.estudos.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Limite de tentativas de login, por conta e por origem (DECISOES.md, 2026-09-27). A contagem em
 * si é do Contador; aqui ficam só as regras do login.
 *
 * - Conta = o e-mail DIGITADO, normalizado, exista ou não. Se só contasse para conta existente,
 *   o bloqueio (429) entregaria quem tem cadastro.
 * - Origem = a chave da Origem (IP; IPv6 agrupado por /64). Pega quem testa uma senha em muitas
 *   contas. É só um freio, com números folgados (application.properties): atrás de proxy ou de
 *   NAT muita gente divide o mesmo IP, e o controle principal é o limite por conta.
 * - A origem é conferida primeiro. Origem bloqueada para ali: não conta a conta nem cria entrada
 *   no mapa por conta. Antes, um IP já bloqueado continuava trancando contas de outras pessoas
 *   (revisão de segurança de 2026-09-27, D3).
 * - Quem acerta a senha devolve a tentativa: a conta zera, a origem desconta uma. A origem não
 *   zera, senão um atacante entraria na própria conta para limpar o contador do IP dele.
 *
 * Contadores em memória: zeram quando o servidor reinicia e não valem para mais de uma instância
 * (limitação aceita, DECISOES.md 2026-09-24 e 2026-09-27). Cada mapa tem teto (app.limites.teto).
 */
@Component
public class LimiteDeTentativas {

    private final Contador porConta;
    private final Contador porOrigem;

    public LimiteDeTentativas(
            @Value("${app.login.limite-por-conta}") int limitePorConta,
            @Value("${app.login.janela}") Duration janela,
            @Value("${app.login.bloqueio}") Duration bloqueio,
            @Value("${app.login.limite-por-origem}") int limitePorOrigem,
            @Value("${app.login.janela-origem}") Duration janelaOrigem,
            @Value("${app.login.bloqueio-origem}") Duration bloqueioOrigem,
            @Value("${app.limites.teto}") int teto) {
        this.porConta = new Contador(limitePorConta, janela, bloqueio, teto);
        this.porOrigem = new Contador(limitePorOrigem, janelaOrigem, bloqueioOrigem, teto);
    }

    /**
     * Conta esta tentativa. Devolve quantos segundos faltam se a conta ou a origem estiver
     * bloqueada (aí a senha nem deve ser conferida); vazio se pode seguir.
     */
    public Optional<Long> registrarTentativa(String conta, String origem) {
        Instant agora = Instant.now();
        Instant ateOrigem = porOrigem.contar(origem, agora);
        if (ateOrigem.isAfter(agora)) {
            // Origem bloqueada: a conta só é LIDA, para o Retry-After dizer o prazo maior.
            Instant ateConta = porConta.bloqueadoAte(conta, agora);
            return Optional.of(Contador.segundosAte(ateConta.isAfter(ateOrigem) ? ateConta : ateOrigem, agora));
        }
        Instant ateConta = porConta.contar(conta, agora);
        return ateConta.isAfter(agora) ? Optional.of(Contador.segundosAte(ateConta, agora)) : Optional.empty();
    }

    /** A senha estava certa (login feito, ou conta pendente com senha certa). */
    public void registrarAcerto(String conta, String origem) {
        porConta.zerar(conta);
        porOrigem.devolver(origem);
    }
}
