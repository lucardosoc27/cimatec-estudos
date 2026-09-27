package br.senai.cimatec.estudos.auth;

/**
 * Um dos limites em memória recusou o pedido. Vira 429 com o header Retry-After (em segundos),
 * que a tela lê para mostrar a contagem regressiva. A mensagem é a mesma para quem tem conta e
 * para quem não tem.
 */
public class LimiteAtingidoException extends RuntimeException {

    private final long segundos;

    private LimiteAtingidoException(String mensagem, long segundos) {
        super(mensagem);
        this.segundos = segundos;
    }

    static LimiteAtingidoException login(long segundos) {
        return new LimiteAtingidoException("Muitas tentativas. Aguarde antes de tentar novamente.", segundos);
    }

    static LimiteAtingidoException reenvio(long segundos) {
        return new LimiteAtingidoException("Aguarde " + segundos + " segundos antes de pedir outro link.", segundos);
    }

    public long getSegundos() {
        return segundos;
    }
}
