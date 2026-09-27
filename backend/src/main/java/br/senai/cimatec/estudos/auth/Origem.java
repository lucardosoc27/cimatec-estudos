package br.senai.cimatec.estudos.auth;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;

/**
 * A chave de origem de um pedido, para os limites por origem.
 *
 * IPv4: o próprio endereço. IPv6: o bloco /64 do endereço, porque cada assinante (uma casa, um
 * celular) recebe no mínimo um /64 inteiro, com 18 quintilhões de endereços; contar endereço por
 * endereço daria a qualquer um origens infinitas. Um bloco maior (/56, /48) juntaria clientes
 * diferentes da mesma operadora numa origem só, que é o problema do NAT (I1) de volta. Quem tem
 * um bloco maior que /64 ainda tem várias origens: para isso existe o teto do Contador, e o
 * limite por conta, que não depende de endereço.
 *
 * Nunca faz consulta de DNS: só aceita endereço escrito como número. Qualquer outra coisa vira
 * uma chave única, "invalida", sem guardar o texto que chegou.
 */
final class Origem {

    private static final Pattern IPV4 = Pattern.compile("\\d{1,3}(\\.\\d{1,3}){3}");
    // Só dígitos hexadecimais, dois-pontos e pontos (IPv4 embutido), com ':' obrigatório.
    // Com ':' no texto, o Java trata como IPv6 e recusa o que não for válido, sem ir ao DNS.
    private static final Pattern IPV6 = Pattern.compile("[0-9A-Fa-f.]*:[0-9A-Fa-f:.]*");

    private Origem() {
    }

    static String de(HttpServletRequest request) {
        return de(request.getRemoteAddr());
    }

    static String de(String endereco) {
        if (endereco == null || endereco.length() > 45) {
            return "invalida";
        }
        if (IPV4.matcher(endereco).matches()) {
            return endereco;
        }
        if (!IPV6.matcher(endereco).matches()) {
            return "invalida";
        }
        try {
            InetAddress ip = InetAddress.getByName(endereco);
            if (!(ip instanceof Inet6Address)) {
                return ip.getHostAddress(); // IPv4 escrito como IPv6 (::ffff:1.2.3.4)
            }
            byte[] b = ip.getAddress();
            return String.format("%x:%x:%x:%x::/64",
                ((b[0] & 0xff) << 8) | (b[1] & 0xff), ((b[2] & 0xff) << 8) | (b[3] & 0xff),
                ((b[4] & 0xff) << 8) | (b[5] & 0xff), ((b[6] & 0xff) << 8) | (b[7] & 0xff));
        } catch (UnknownHostException invalido) {
            return "invalida";
        }
    }
}
