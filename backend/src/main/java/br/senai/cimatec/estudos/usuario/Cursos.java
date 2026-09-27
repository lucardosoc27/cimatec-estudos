package br.senai.cimatec.estudos.usuario;

import java.util.List;

/**
 * Os nove cursos técnicos aceitos no cadastro. Mesma lista de frontend/src/app/models/curso.ts:
 * o Angular usa a dele para montar o seletor, e o servidor confere na dele, porque a validação
 * do navegador é conveniência, nunca a única barreira.
 */
public final class Cursos {

    public static final List<String> NOMES = List.of(
        "Desenvolvimento de Sistemas",
        "Redes de Computadores",
        "Biotecnologia",
        "Química",
        "Petroquímica",
        "Eletromecânica",
        "Edificações",
        "Mecânica",
        "Multimídia");

    private Cursos() {
    }

    public static boolean existe(String nome) {
        return NOMES.contains(nome);
    }
}
