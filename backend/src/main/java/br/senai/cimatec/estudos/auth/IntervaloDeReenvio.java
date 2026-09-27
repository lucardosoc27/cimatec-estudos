package br.senai.cimatec.estudos.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Intervalo mínimo entre dois envios do link para o mesmo e-mail: um envio por intervalo, contado
 * pelo mesmo Contador do login (limite 1). Conta para qualquer e-mail, exista a conta ou não: se
 * só contasse para conta existente, o 429 entregaria quem tem cadastro. Mesmas limitações do
 * limite de tentativas: em memória, zera quando o servidor reinicia. O mapa tem teto.
 *
 * Pedir cedo demais bloqueia por um intervalo inteiro a partir daquele pedido (regra única do
 * Contador), e os pedidos seguintes dentro do bloqueio não o estendem.
 */
@Component
public class IntervaloDeReenvio {

    private final Contador porEmail;

    public IntervaloDeReenvio(@Value("${app.verificacao.intervalo-reenvio}") Duration intervalo,
            @Value("${app.limites.teto}") int teto) {
        this.porEmail = new Contador(1, intervalo, intervalo, teto);
    }

    /** Registra o envio e devolve quantos segundos faltam se veio cedo demais; vazio se pode seguir. */
    public Optional<Long> segundosAteLiberar(String email) {
        Instant agora = Instant.now();
        Instant ate = porEmail.contar(email, agora);
        return ate.isAfter(agora) ? Optional.of(Contador.segundosAte(ate, agora)) : Optional.empty();
    }
}
