package br.senai.cimatec.estudos.auth;

/** Login bloqueado pelo limite de tentativas. Vira 429 com Retry-After, igual para todo mundo. */
public class LoginBloqueadoException extends RuntimeException {

    private final long segundos;

    public LoginBloqueadoException(long segundos) {
        super("Muitas tentativas. Aguarde antes de tentar novamente.");
        this.segundos = segundos;
    }

    public long getSegundos() {
        return segundos;
    }
}
