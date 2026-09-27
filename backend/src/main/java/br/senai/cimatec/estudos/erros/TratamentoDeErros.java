package br.senai.cimatec.estudos.erros;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import br.senai.cimatec.estudos.auth.ReenvioBloqueadoException;

/**
 * Converte erro de validação em 400 com corpo { "message": "..." }, que é o que o Angular
 * mostra ao usuário (features/auth/auth.ts lê erro.error.message). Sem isto, o Boot devolve
 * um corpo genérico sem a mensagem, e a tela só diria "confira seus dados".
 */
@RestControllerAdvice
public class TratamentoDeErros {

    /** Anotações do Bean Validation (@NotBlank, @Email...) que falharam no @RequestBody. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> validacao(MethodArgumentNotValidException erro) {
        // Uma mensagem por vez, na ordem dos campos, é o que cabe na faixa de erro da tela.
        String mensagem = erro.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(FieldError::getDefaultMessage)
            .orElse("Confira os dados e tente novamente.");
        return Map.of("message", mensagem);
    }

    /** JSON que não dá para ler (malformado ou com tipo errado). Nada do que foi enviado é ecoado. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> corpoIlegivel(HttpMessageNotReadableException erro) {
        return Map.of("message", "Não foi possível ler os dados enviados. Confira os campos e tente novamente.");
    }

    /**
     * Conta pendente com a senha certa: 403, "sei quem você é, mas ainda não pode entrar". Só
     * chega aqui quem provou a senha (ver AuthenticationManager em SecurityConfig), então a
     * mensagem não revela a existência da conta para quem não a tem.
     */
    @ExceptionHandler(DisabledException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, String> contaPendente(DisabledException erro) {
        return Map.of("message", "Confirme seu e-mail institucional antes de entrar. Não chegou? Peça um novo link.");
    }

    /**
     * Senha errada e e-mail inexistente: mesmo status, mesmo corpo. A exceção que chega aqui
     * já é a mesma nos dois casos (o DaoAuthenticationProvider esconde "usuário não existe").
     */
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, String> credenciaisInvalidas(AuthenticationException erro) {
        return Map.of("message", "e-mail ou senha inválidos");
    }

    /** 429 com Retry-After em segundos: a tela lê o header e mostra a contagem. */
    @ExceptionHandler(ReenvioBloqueadoException.class)
    public ResponseEntity<Map<String, String>> reenvioCedoDemais(ReenvioBloqueadoException erro) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header(HttpHeaders.RETRY_AFTER, String.valueOf(erro.getSegundos()))
            .body(Map.of("message", erro.getMessage()));
    }

    /** Regras que dependem de configuração ou de banco, conferidas no serviço. */
    @ExceptionHandler(DadoInvalidoException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> regraDeNegocio(DadoInvalidoException erro) {
        return Map.of("message", erro.getMessage());
    }
}
