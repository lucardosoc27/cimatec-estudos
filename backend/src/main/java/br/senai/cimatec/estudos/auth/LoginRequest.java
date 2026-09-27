package br.senai.cimatec.estudos.auth;

import jakarta.validation.constraints.NotBlank;

/** Mensagens genéricas de propósito: o login nunca diz qual dos dois campos está errado. */
public record LoginRequest(
    @NotBlank(message = "Informe e-mail e senha.")
    String email,

    @NotBlank(message = "Informe e-mail e senha.")
    String senha) {
}
