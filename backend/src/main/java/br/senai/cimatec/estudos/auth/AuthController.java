package br.senai.cimatec.estudos.auth;

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

    public AuthController(CadastroService cadastro) {
        this.cadastro = cadastro;
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
}
