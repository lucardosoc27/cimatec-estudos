package br.senai.cimatec.estudos.erros;

/** Regra de negócio violada com dado vindo do usuário. Vira resposta 400 com a mensagem. */
public class DadoInvalidoException extends RuntimeException {

    public DadoInvalidoException(String mensagem) {
        super(mensagem);
    }
}
