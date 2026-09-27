package br.senai.cimatec.estudos.auth;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Limite por origem nas rotas públicas que não são o login: cadastro, verificação e reenvio
 * (revisão de segurança de 2026-09-27: A4, A5, C2, C3). As três contam juntas, num Contador só.
 *
 * Sem isto, qualquer um enchia a tabela de contas pendentes, queimava CPU com o BCrypt do
 * cadastro sem limite, e pedia o link da vítima de novo a cada minuto, para sempre. Os números
 * são folgados (application.properties) pelo mesmo motivo do login: atrás de NAT, uma turma
 * inteira divide o mesmo IP.
 */
@Component
public class LimiteDasRotasPublicas {

    private final Contador porOrigem;

    public LimiteDasRotasPublicas(
            @Value("${app.rotas-publicas.limite-por-origem}") int limite,
            @Value("${app.rotas-publicas.janela}") Duration janela,
            @Value("${app.rotas-publicas.bloqueio}") Duration bloqueio,
            @Value("${app.limites.teto}") int teto) {
        this.porOrigem = new Contador(limite, janela, bloqueio, teto);
    }

    /** Conta o pedido; se a origem passou do limite, recusa com 429 antes de qualquer trabalho. */
    public void registrar(String origem) {
        Instant agora = Instant.now();
        Instant ate = porOrigem.contar(origem, agora);
        if (ate.isAfter(agora)) {
            throw LimiteAtingidoException.rotaPublica(Contador.segundosAte(ate, agora));
        }
    }
}
