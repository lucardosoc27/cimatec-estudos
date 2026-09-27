package br.senai.cimatec.estudos.auth;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.senai.cimatec.estudos.usuario.Usuario;
import br.senai.cimatec.estudos.usuario.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final CadastroService cadastro;
    private final VerificacaoService verificacao;
    private final UsuarioRepository usuarios;
    private final AuthenticationManager autenticador;
    private final SessionAuthenticationStrategy estrategiaDeSessao;
    private final SecurityContextRepository repositorioDeContexto;
    private final SecurityContextHolderStrategy contextos = SecurityContextHolder.getContextHolderStrategy();

    public AuthController(CadastroService cadastro, VerificacaoService verificacao, UsuarioRepository usuarios,
            AuthenticationManager autenticador, SessionAuthenticationStrategy estrategiaDeSessao,
            SecurityContextRepository repositorioDeContexto) {
        this.cadastro = cadastro;
        this.verificacao = verificacao;
        this.usuarios = usuarios;
        this.autenticador = autenticador;
        this.estrategiaDeSessao = estrategiaDeSessao;
        this.repositorioDeContexto = repositorioDeContexto;
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

    /**
     * Login em controller próprio, na ordem que o filtro pronto do Spring usa
     * (docs/pesquisa/autenticacao-spring-security-7.md, seção 2):
     * 1. autenticar: senha errada ou e-mail inexistente lançam BadCredentialsException, e conta
     *    pendente com senha certa lança DisabledException (ver TratamentoDeErros);
     * 2. estratégia de sessão: troca o id da sessão e apaga o token CSRF antigo;
     * 3. guardar o contexto na HttpSession, explicitamente, senão o login dura uma requisição.
     */
    @PostMapping("/login")
    public UsuarioResposta entrar(@Valid @RequestBody LoginRequest pedido, HttpServletRequest request,
            HttpServletResponse response) {
        Authentication autenticacao = autenticador.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(pedido.email(), pedido.senha()));
        estrategiaDeSessao.onAuthentication(autenticacao, request, response);

        SecurityContext contexto = contextos.createEmptyContext();
        contexto.setAuthentication(autenticacao);
        contextos.setContext(contexto);
        repositorioDeContexto.saveContext(contexto, request, response);

        return UsuarioResposta.de(usuarioLogado(autenticacao));
    }

    /** Quem está logado. Sem sessão válida nem chega aqui: a cadeia de filtros responde 401 antes. */
    @GetMapping("/eu")
    public UsuarioResposta eu(Authentication autenticacao) {
        return UsuarioResposta.de(usuarioLogado(autenticacao));
    }

    private Usuario usuarioLogado(Authentication autenticacao) {
        // getName() é o "username" do UserDetails, que no UsuarioDetailsService é o e-mail.
        return usuarios.findByEmail(autenticacao.getName()).orElseThrow();
    }
}
