package br.senai.cimatec.estudos.usuario;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A conta de quem usa o sistema. Guarda o mínimo que o cadastro pede (LGPD): nome de
 * apresentação, e-mail institucional, curso e os consentimentos, cada um com a data em que
 * foi dado. Sem semestre (DECISOES.md, 2026-09-24) e sem telefone.
 *
 * A senha NÃO fica aqui: fica o hash BCrypt dela, que não permite recuperar a senha original.
 *
 * Todo usuário é aluno. "Virar mentor" é escopo futuro (DECISOES.md, 2026-09-20), então ainda
 * não existe coluna de papel: quando existir, entra como campo próprio.
 */
@Entity
@Table(name = "usuarios")
public class Usuario {

    // UUID em vez de número sequencial: o id não revela quantas contas existem nem permite
    // adivinhar o id da conta vizinha.
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 60)
    private String nome;

    // Sempre em minúsculas, para "Ana@..." e "ana@..." serem a mesma conta.
    @Column(nullable = false, unique = true, length = 254)
    private String email;

    // BCrypt produz sempre 60 caracteres ($2a$10$ + sal + hash).
    @Column(name = "senha_hash", nullable = false, length = 60)
    private String senhaHash;

    @Column(nullable = false, length = 60)
    private String curso;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Verificacao verificacao;

    // Qual versão dos termos a pessoa aceitou. Se os termos mudarem, dá para saber quem
    // precisa aceitar de novo.
    @Column(name = "termos_versao", nullable = false, length = 10)
    private String termosVersao;

    // Consentimentos: a data em que cada um foi dado; null = não deu. O dos termos é
    // obrigatório, por isso nunca é null.
    @Column(name = "termos_e_politica_em", nullable = false)
    private Instant termosEPoliticaEm;

    @Column(name = "foto_para_logados_em")
    private Instant fotoParaLogadosEm;

    @Column(name = "vitrine_publica_em")
    private Instant vitrinePublicaEm;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    // Verificação do e-mail. Fica o hash SHA-256 do token, nunca o token: quem ler o banco não
    // consegue montar o link. Um token por conta: pedir outro apaga o anterior.
    @Column(name = "verificacao_token_hash", length = 64)
    private String verificacaoTokenHash;

    @Column(name = "verificacao_expira_em")
    private Instant verificacaoExpiraEm;

    // Registro do consumo do token: preenchido uma vez, no primeiro uso.
    @Column(name = "verificado_em")
    private Instant verificadoEm;

    /** Exigido pelo JPA. O código do projeto usa o construtor de baixo. */
    protected Usuario() {
    }

    public Usuario(String nome, String email, String senhaHash, String curso, String termosVersao,
            boolean fotoParaLogados, boolean vitrinePublica) {
        Instant agora = Instant.now();
        this.nome = nome;
        this.email = email;
        this.senhaHash = senhaHash;
        this.curso = curso;
        this.termosVersao = termosVersao;
        this.verificacao = Verificacao.PENDENTE;
        this.termosEPoliticaEm = agora;
        this.fotoParaLogadosEm = fotoParaLogados ? agora : null;
        this.vitrinePublicaEm = vitrinePublica ? agora : null;
        this.criadoEm = agora;
    }

    public UUID getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public String getCurso() {
        return curso;
    }

    public Verificacao getVerificacao() {
        return verificacao;
    }

    public String getTermosVersao() {
        return termosVersao;
    }

    public Instant getTermosEPoliticaEm() {
        return termosEPoliticaEm;
    }

    public Instant getFotoParaLogadosEm() {
        return fotoParaLogadosEm;
    }

    public Instant getVitrinePublicaEm() {
        return vitrinePublicaEm;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public Instant getVerificacaoExpiraEm() {
        return verificacaoExpiraEm;
    }

    public Instant getVerificadoEm() {
        return verificadoEm;
    }

    public boolean estaVerificado() {
        return verificacao == Verificacao.VERIFICADO;
    }

    /** Guarda um token novo (só o hash) e invalida o anterior, que deixa de bater com o banco. */
    public void iniciarVerificacao(String tokenHash, Instant expiraEm) {
        this.verificacaoTokenHash = tokenHash;
        this.verificacaoExpiraEm = expiraEm;
    }

    public void confirmarVerificacao(Instant agora) {
        this.verificacao = Verificacao.VERIFICADO;
        this.verificadoEm = agora;
    }
}
