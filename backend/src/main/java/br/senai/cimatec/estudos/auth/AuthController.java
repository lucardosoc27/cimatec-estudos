package br.senai.cimatec.estudos.auth;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final CadastroService cadastro;
    private final VerificacaoService verificacao;

    public AuthController(CadastroService cadastro, VerificacaoService verificacao) {
        this.cadastro = cadastro;
        this.verificacao = verificacao;
    }

    /**
     * Não faz nada de propósito. O Angular chama este GET antes de cada POST só para o
     * CsrfFilter gravar o cookie XSRF-TOKEN, que ele devolve no header X-XSRF-TOKEN.
     */
    @GetMapping("/csrf")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void csrf() {
    }

    /** @Valid dispara as anotações do CadastroRequest antes de o serviço rodar. */
    @PostMapping("/cadastro")
    public void cadastrar(@Valid @RequestBody CadastroRequest pedido) {
        cadastro.cadastrar(pedido);
    }

    /**
     * POST, não GET, de propósito: um GET que muda estado pode ser disparado pela
     * pré-visualização de link de um cliente de e-mail, e o token seria consumido sem clique.
     * Sempre 200: o estado vai no corpo, porque nenhum dos quatro é erro do cliente.
     */
    @PostMapping("/verificacao")
    public Map<String, ResultadoVerificacao> verificar(@Valid @RequestBody VerificacaoRequest pedido) {
        return Map.of("estado", verificacao.verificar(pedido.token()));
    }

    @PostMapping("/reenviar")
    public void reenviar(@Valid @RequestBody ReenvioRequest pedido) {
        verificacao.reenviar(pedido.email());
    }
}
