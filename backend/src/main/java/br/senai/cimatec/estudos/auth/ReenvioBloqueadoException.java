package br.senai.cimatec.estudos.auth;

/** Pedido de reenvio dentro do intervalo mínimo. Vira 429 com o header Retry-After. */
public class ReenvioBloqueadoException extends RuntimeException {

    private final long segundos;

    public ReenvioBloqueadoException(long segundos) {
        super("Aguarde " + segundos + " segundos antes de pedir outro link.");
        this.segundos = segundos;
    }

    public long getSegundos() {
        return segundos;
    }
}
