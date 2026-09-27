package br.senai.cimatec.estudos.auth;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * O corpo do POST /api/auth/cadastro, com o mesmo formato que o AuthService do Angular envia.
 * As anotações são a validação do servidor: valem mesmo que alguém chame a API sem passar
 * pela tela. As regras da senha são as mesmas que a tela mostra ("8 caracteres ou mais",
 * "pelo menos uma letra", "pelo menos um número").
 */
public record CadastroRequest(
    @NotBlank(message = "Informe como quer ser chamado(a).")
    @Size(max = 60, message = "O nome pode ter até 60 caracteres.")
    String nome,

    @NotBlank(message = "Informe seu e-mail institucional.")
    @Email(message = "Informe um e-mail válido.")
    @Size(max = 254, message = "O e-mail pode ter até 254 caracteres.")
    String email,

    @NotBlank(message = "Crie uma senha.")
    @Size(min = 8, max = 64, message = "A senha precisa ter de 8 a 64 caracteres.")
    // \p{L} = qualquer letra, com ou sem acento; \d = dígito.
    @Pattern(regexp = "^(?=.*\\p{L})(?=.*\\d).*$", message = "A senha precisa ter pelo menos uma letra e um número.")
    String senha,

    @NotBlank(message = "Selecione seu curso.")
    String curso,

    // Boolean (objeto), não boolean: o Jackson recusa JSON sem o campo quando o tipo é
    // primitivo. @AssertTrue aceita null, por isso o @NotNull vem junto.
    @NotNull(message = "É preciso aceitar os termos de uso e a política de privacidade.")
    @AssertTrue(message = "É preciso aceitar os termos de uso e a política de privacidade.")
    Boolean termosEPolitica,

    // Opcionais: ausente ou null vale "não consentiu". Nunca vêm marcados por padrão na tela.
    Boolean fotoParaLogados,
    Boolean vitrinePublica) {

    public boolean quisFotoParaLogados() {
        return Boolean.TRUE.equals(fotoParaLogados);
    }

    public boolean quisVitrinePublica() {
        return Boolean.TRUE.equals(vitrinePublica);
    }
}
