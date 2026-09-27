package br.senai.cimatec.estudos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Mensagens genéricas de propósito: o login nunca diz qual dos dois campos está errado.
 *
 * Os tamanhos máximos são os do cadastro: nenhuma conta tem e-mail maior que 254 nem senha maior
 * que 64, então um pedido maior só pode estar errado. Sem o limite no e-mail, cada tentativa
 * guardava o texto digitado inteiro como chave no LimiteDeTentativas por 15 minutos, e um e-mail
 * de megabytes por pedido enchia a memória até derrubar o servidor (revisão de 2026-09-27, D5).
 * Recusado aqui, o pedido nem chega ao limite de tentativas, então também não conta tentativa.
 */
public record LoginRequest(
    @NotBlank(message = "Informe e-mail e senha.")
    @Size(max = 254, message = "e-mail ou senha inválidos")
    String email,

    @NotBlank(message = "Informe e-mail e senha.")
    @Size(max = 64, message = "e-mail ou senha inválidos")
    String senha) {
}
