package br.senai.cimatec.estudos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReenvioRequest(
    @NotBlank(message = "Informe seu e-mail institucional.")
    @Email(message = "Informe um e-mail válido.")
    @Size(max = 254, message = "O e-mail pode ter até 254 caracteres.")
    String email) {
}
