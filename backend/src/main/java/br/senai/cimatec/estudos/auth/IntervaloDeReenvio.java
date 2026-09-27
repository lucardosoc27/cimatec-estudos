package br.senai.cimatec.estudos.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Intervalo mínimo entre dois pedidos de reenvio para o mesmo e-mail. Conta em memória e para
 * qualquer e-mail, exista a conta ou não: se só contasse para conta existente, o 429 entregaria
 * quem tem cadastro. Mesmas limitações do limite de tentativas (DECISOES.md, 2026-09-24): zera
 * quando o servidor reinicia, e não distingue quem está atrás do mesmo proxy.
 */
@Component
public class IntervaloDeReenvio {

    private final Duration intervalo;
    private final Map<String, Instant> ultimoPedido = new ConcurrentHashMap<>();

    public IntervaloDeReenvio(@Value("${app.verificacao.intervalo-reenvio}") Duration intervalo) {
        this.intervalo = intervalo;
    }

    /**
     * Registra o pedido e devolve quantos segundos faltam se ele veio cedo demais; vazio se
     * pode seguir. Entradas antigas são apagadas aqui mesmo, para o mapa não crescer para sempre.
     */
    public Optional<Long> segundosAteLiberar(String email) {
        Instant agora = Instant.now();
        ultimoPedido.values().removeIf(quando -> quando.plus(intervalo).isBefore(agora));

        Instant anterior = ultimoPedido.putIfAbsent(email, agora);
        if (anterior == null) {
            return Optional.empty();
        }
        long faltam = Duration.between(agora, anterior.plus(intervalo)).toSeconds();
        return Optional.of(Math.max(faltam, 1));
    }
}
