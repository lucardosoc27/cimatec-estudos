package br.senai.cimatec.estudos.erros;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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

    /** Regras que dependem de configuração ou de banco, conferidas no serviço. */
    @ExceptionHandler(DadoInvalidoException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> regraDeNegocio(DadoInvalidoException erro) {
        return Map.of("message", erro.getMessage());
    }
}
