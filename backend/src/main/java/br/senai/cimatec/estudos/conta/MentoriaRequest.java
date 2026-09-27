package br.senai.cimatec.estudos.conta;

import jakarta.validation.constraints.NotNull;

/** Boolean (objeto) com @NotNull: sem o campo no JSON, a resposta é 400, e não "desligar" por engano. */
public record MentoriaRequest(
    @NotNull(message = "Diga se quer ou não receber pedidos de ajuda.")
    Boolean receberPedidos) {
}
