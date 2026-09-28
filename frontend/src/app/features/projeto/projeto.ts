import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Item { titulo: string; texto: string; }

/**
 * Portfólio do projeto: uma página pública que explica o que é o Cimatec Estudos, o problema, as
 * telas e o que ainda falta. É sobre o PROJETO; não é o "portfólio público" de cada aluno ou
 * mentor das telas 9 e 10 do CLAUDE.md, por isso a rota é /projeto.
 *
 * Tudo aqui é fato do próprio projeto: nenhum número de uso, depoimento, prêmio ou parceria.
 * Página estática: não busca dados, então não tem estados de carregando, vazio ou erro.
 */
@Component({
  selector: 'app-projeto',
  imports: [RouterLink],
  templateUrl: './projeto.html',
  styleUrl: './projeto.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Projeto {
  protected readonly passos: Item[] = [
    { titulo: 'Início', texto: 'Mostra os pedidos de ajuda em andamento, com o status escrito por extenso, e o botão "Pedir ajuda".' },
    { titulo: 'Pedir ajuda', texto: 'O aluno escolhe a matéria, os turnos em que pode estudar e se prefere encontro presencial ou online.' },
    { titulo: 'Mentores para você', texto: 'Colegas que ensinam aquela matéria, em pilha de cartões ou em lista, cada um com o motivo da recomendação.' },
    { titulo: 'Perfil do mentor e horários', texto: 'O que o mentor ensina, quantas sessões já fez e só os horários realmente livres, conferidos de novo no envio.' },
    { titulo: 'Seu pedido', texto: 'O estado do pedido, o prazo de resposta de 48 horas e a opção de cancelar.' },
  ];

  protected readonly outrasTelas: Item[] = [
    { titulo: 'Página inicial', texto: 'Para quem ainda não entrou: como funciona, mentores que escolheram aparecer e perguntas frequentes.' },
    { titulo: 'Entrar e criar conta', texto: 'Cadastro com o e-mail institucional e poucos dados: nome, curso e senha.' },
    { titulo: 'Confirmar e-mail', texto: 'A conta só funciona depois que a pessoa confirma o e-mail pelo link.' },
    { titulo: 'Pedidos recebidos', texto: 'Para quem é mentor: aceitar ou recusar pedidos, com aviso quando o horário já está ocupado.' },
    { titulo: 'Minha conta', texto: 'Dados, consentimentos e a chave "Quero receber pedidos de ajuda", que transforma o aluno em mentor.' },
    { titulo: 'Termos e privacidade', texto: 'O que o sistema guarda, por quê, e os cuidados com estudantes menores de idade.' },
  ];

  protected readonly escolhas: Item[] = [
    { titulo: 'O motivo da recomendação aparece', texto: 'Cada mentor vem com a razão de estar ali, como "mesma matéria • livre terça à tarde".' },
    { titulo: 'Reputação que não se compra', texto: 'Conta sessões concluídas, não estrelas soltas, que são fáceis de forjar entre amigos.' },
    { titulo: 'Contato só depois do aceite', texto: 'Ninguém vê o e-mail do outro antes de o mentor aceitar o pedido.' },
    { titulo: 'O mínimo de dados pessoais', texto: 'Há menores de idade nos cursos técnicos. O sistema pede só o necessário e registra cada consentimento.' },
    { titulo: 'Acessível', texto: 'Funciona só com teclado, anuncia as trocas de tela para leitor de tela e tem contraste medido.' },
  ];

  protected readonly real: string[] = [
    'Cadastro com e-mail institucional, confirmação por link, entrar e sair.',
    'Sessão guardada com segurança no servidor, senha guardada só como hash, limites contra quem tenta adivinhar senhas.',
    'A chave "Quero receber pedidos de ajuda", que grava no servidor quem é mentor.',
  ];

  protected readonly simulado: string[] = [
    'Mentores, matérias, horários e pedidos são dados de exemplo, guardados no navegador. Um pedido novo some quando a página recarrega.',
    'Não há envio de e-mail: o link de confirmação aparece no terminal do servidor.',
    'As pessoas, fotos e depoimentos mostrados são exemplos criados para a demonstração.',
  ];

  protected readonly depois: string[] = [
    'Levar pedidos e mentores para o servidor, para valerem entre aparelhos diferentes.',
    'Recuperação de senha.',
    'O mentor cadastrar as matérias que ensina e os horários em que pode ajudar.',
    'Confirmação da sessão pelos dois lados, que é o que conta para a reputação.',
    'A vitrine de cada aluno ou mentor, com seus projetos.',
    'Testar com leitor de tela de verdade e publicar com HTTPS.',
  ];
}
