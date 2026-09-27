package br.senai.cimatec.estudos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerificacaoRequest(
    @NotBlank(message = "Link sem token.")
    @Size(max = 100, message = "Token inválido.")
    String token) {
}
