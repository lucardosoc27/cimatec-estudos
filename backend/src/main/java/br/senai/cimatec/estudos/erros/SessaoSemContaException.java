package br.senai.cimatec.estudos.erros;

/**
 * A sessão é válida, mas a conta dela não existe mais no banco (foi apagada depois do login).
 * Vira 401 e a sessão é encerrada no servidor: para o sistema, essa pessoa não está logada.
 * Antes, o orElseThrow() sem argumento virava 500 (revisão de segurança, E2).
 */
public class SessaoSemContaException extends RuntimeException {

    public SessaoSemContaException() {
        super("Sua sessão terminou. Entre novamente.");
    }
}
