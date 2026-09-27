package br.senai.cimatec.estudos.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A única regra de contagem do projeto. Os três limites usam esta classe, cada um com os seus
 * números: o login (por conta e por origem), as rotas públicas (por origem) e o intervalo de
 * reenvio do link (por e-mail). Assim existe um lugar só para errar e para testar.
 *
 * A regra: conta os pedidos de cada chave numa janela de tempo. Passou do limite, a chave fica
 * bloqueada por um prazo e destrava sozinha. Durante o bloqueio o pedido não conta. Terminado o
 * bloqueio, ou vencida a janela, a contagem recomeça do zero.
 *
 * Teto: o mapa guarda no máximo {@code teto} chaves, para a memória ter limite mesmo com muitas
 * origens diferentes (revisão de segurança de 2026-09-27). Cheio, sai a chave que ninguém usa há
 * mais tempo, MENOS as bloqueadas: um bloqueio nunca é solto por falta de espaço, senão bastaria
 * encher o mapa de lixo para destravar a conta que está sendo atacada. Se todas as chaves estão
 * bloqueadas, a chave nova é recusada até a primeira destravar.
 *
 * "Quem ninguém usa há mais tempo" vem de graça do LinkedHashMap em ordem de ACESSO (o terceiro
 * argumento, true): cada get ou put leva a chave para o fim da fila, e a primeira da fila é a
 * mais esquecida. Por isso todos os métodos são synchronized: nessa ordem até uma leitura mexe no
 * mapa, e o LinkedHashMap não aceita dois acessos ao mesmo tempo. O trabalho dentro do bloqueio é
 * pequeno; o lento do login (BCrypt) acontece fora daqui.
 */
final class Contador {

    private record Contagem(int pedidos, Instant inicio, Instant bloqueadoAte) {

        boolean bloqueada(Instant agora) {
            return bloqueadoAte.isAfter(agora);
        }
    }

    private static final Duration INTERVALO_DE_LIMPEZA = Duration.ofSeconds(1);

    private final int limite;
    private final Duration janela;
    private final Duration bloqueio;
    private final int teto;
    private final LinkedHashMap<String, Contagem> mapa = new LinkedHashMap<>(16, 0.75f, true);
    private Instant ultimaLimpeza = Instant.EPOCH;

    Contador(int limite, Duration janela, Duration bloqueio, int teto) {
        this.limite = limite;
        this.janela = janela;
        this.bloqueio = bloqueio;
        this.teto = teto;
    }

    /**
     * Conta um pedido da chave. Devolve até quando ela está bloqueada, ou Instant.EPOCH se o pedido
     * pode seguir. A contagem acontece antes de qualquer trabalho caro, de forma atômica.
     */
    synchronized Instant contar(String chave, Instant agora) {
        limparVencidas(agora);
        Contagem atual = mapa.get(chave);
        if (atual != null && atual.bloqueada(agora)) {
            return atual.bloqueadoAte(); // bloqueada: não conta, só espera o prazo
        }
        if (atual == null && !abrirEspaco(agora)) {
            return primeiroDesbloqueio(); // mapa cheio só de bloqueadas
        }
        boolean cumpriuBloqueio = atual != null && atual.bloqueadoAte().isAfter(Instant.EPOCH);
        if (atual == null || cumpriuBloqueio || atual.inicio().plus(janela).isBefore(agora)) {
            // Janela nova: primeira vez, janela vencida, ou bloqueio já cumprido. Sem o terceiro
            // caso, a contagem seguiria acima do limite e bloquearia de novo na hora.
            atual = new Contagem(0, agora, Instant.EPOCH);
        }
        int pedidos = atual.pedidos() + 1;
        Instant ate = pedidos > limite ? agora.plus(bloqueio) : Instant.EPOCH;
        mapa.put(chave, new Contagem(pedidos, atual.inicio(), ate));
        return ate;
    }

    /** Só lê: devolve até quando a chave está bloqueada (EPOCH se não está) sem criar entrada. */
    synchronized Instant bloqueadoAte(String chave, Instant agora) {
        Contagem atual = mapa.get(chave);
        return atual != null && atual.bloqueada(agora) ? atual.bloqueadoAte() : Instant.EPOCH;
    }

    /** Apaga a contagem da chave (o login acertou a senha da conta). */
    synchronized void zerar(String chave) {
        mapa.remove(chave);
    }

    /** Devolve um pedido à chave, sem zerar (a origem cujo login deu certo). */
    synchronized void devolver(String chave) {
        mapa.computeIfPresent(chave, (k, atual) -> atual.pedidos() <= 1
            ? null
            : new Contagem(atual.pedidos() - 1, atual.inicio(), atual.bloqueadoAte()));
    }

    /** Quantas segundos faltam até {@code ate}, arredondado para cima, no mínimo 1 (Retry-After). */
    static long segundosAte(Instant ate, Instant agora) {
        return Math.max(1, Duration.between(agora, ate).toSeconds() + 1);
    }

    synchronized int tamanho() {
        return mapa.size();
    }

    synchronized List<String> chaves() {
        return List.copyOf(mapa.keySet());
    }

    /** Cheio: tira a chave não bloqueada que ninguém usa há mais tempo. False se todas estão bloqueadas. */
    private boolean abrirEspaco(Instant agora) {
        if (mapa.size() < teto) {
            return true;
        }
        Iterator<Contagem> fila = mapa.values().iterator(); // da mais esquecida para a mais recente
        while (fila.hasNext()) {
            if (!fila.next().bloqueada(agora)) {
                fila.remove();
                return true;
            }
        }
        return false;
    }

    private Instant primeiroDesbloqueio() {
        return mapa.values().stream().map(Contagem::bloqueadoAte).min(Instant::compareTo).orElseThrow();
    }

    /**
     * Apaga as entradas vencidas: janela passada e sem bloqueio valendo. No máximo uma vez por
     * segundo, porque percorre o mapa inteiro; entre uma limpeza e outra, a entrada vencida é
     * tratada como janela nova no contar, então nada muda de resultado.
     */
    private void limparVencidas(Instant agora) {
        if (ultimaLimpeza.plus(INTERVALO_DE_LIMPEZA).isAfter(agora)) {
            return;
        }
        ultimaLimpeza = agora;
        for (Iterator<Map.Entry<String, Contagem>> i = mapa.entrySet().iterator(); i.hasNext();) {
            Contagem c = i.next().getValue();
            if (c.inicio().plus(janela).isBefore(agora) && !c.bloqueada(agora)) {
                i.remove();
            }
        }
    }
}
