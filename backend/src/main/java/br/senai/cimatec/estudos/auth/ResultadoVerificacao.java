package br.senai.cimatec.estudos.auth;

import com.fasterxml.jackson.annotation.JsonValue;

/** Os quatro estados que a tela /verificar-email já conhece, com o nome exato que ela usa. */
public enum ResultadoVerificacao {
    ATIVADA("ativada"),
    EXPIRADO("expirado"),
    JA_USADO("ja-usado"),
    INVALIDO("invalido");

    private final String nome;

    ResultadoVerificacao(String nome) {
        this.nome = nome;
    }

    @JsonValue
    public String getNome() {
        return nome;
    }
}
