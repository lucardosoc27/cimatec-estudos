package br.senai.cimatec.estudos.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.Test;

/** O Contador sozinho, sem Spring: o relógio é passado à mão, então nada depende de esperar. */
class ContadorTest {

    private static final Instant T0 = Instant.parse("2026-09-27T12:00:00Z");

    @Test
    void mapaNuncaPassaDoTetoESaiQuemNinguemUsaHaMaisTempo() {
        Contador contador = new Contador(5, Duration.ofMinutes(15), Duration.ofMinutes(15), 3);
        contador.contar("a", T0);
        contador.contar("b", T0);
        contador.contar("c", T0);
        contador.contar("a", T0.plusSeconds(1)); // "a" foi usada agora: "b" virou a mais antiga
        contador.contar("d", T0.plusSeconds(2));

        assertThat(contador.tamanho()).isEqualTo(3);
        assertThat(contador.chaves()).containsExactlyInAnyOrder("a", "c", "d");
    }

    @Test
    void chaveBloqueadaNuncaSaiPorFaltaDeEspaco() {
        Contador contador = new Contador(1, Duration.ofMinutes(15), Duration.ofMinutes(15), 2);
        contador.contar("vitima", T0);
        Instant bloqueio = contador.contar("vitima", T0); // passou do limite: bloqueada
        assertThat(bloqueio).isAfter(T0);

        // Lixo enchendo o mapa não solta o bloqueio da vítima.
        for (int i = 0; i < 100; i++) {
            contador.contar("lixo" + i, T0.plusSeconds(1));
        }
        assertThat(contador.tamanho()).isEqualTo(2);
        assertThat(contador.contar("vitima", T0.plusSeconds(2))).isEqualTo(bloqueio);
    }

    @Test
    void mapaCheioSoDeBloqueadasRecusaChaveNovaAteAPrimeiraDestravar() {
        Contador contador = new Contador(0, Duration.ofMinutes(15), Duration.ofMinutes(15), 2);
        Instant primeira = contador.contar("x", T0);
        contador.contar("y", T0.plusSeconds(10));

        Instant nova = contador.contar("z", T0.plusSeconds(20));
        assertThat(nova).isEqualTo(primeira);
        assertThat(contador.chaves()).containsExactlyInAnyOrder("x", "y");
    }
}
