import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone/icone';

/** Um parágrafo (p) ou uma lista com marcadores (lista). */
interface Bloco { p?: string; lista?: string[]; }
interface Secao { id: string; titulo: string; blocos: Bloco[]; }
interface Parte { id: string; titulo: string; secoes: Secao[]; }

@Component({
  selector: 'app-termos',
  imports: [RouterLink, Icone],
  templateUrl: './termos.html',
  styleUrl: './termos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Termos {
  readonly indiceAberto = signal(false);
  /**
   * Texto dos termos e da política, escrito a partir do que o sistema faz (código e
   * docs/ESPECIFICACAO-TELAS.md). Cada bloco é um parágrafo (p) ou uma lista (lista). Mudar o que o
   * sistema faz pede mudar este texto junto.
   */
  readonly partes: Parte[] = [
    {
      id: 'termos-de-uso', titulo: '1. Termos de Uso',
      secoes: [
        { id: 'sobre-o-projeto', titulo: 'O que é o Cimatec Estudos', blocos: [
          { p: 'O Cimatec Estudos é um projeto acadêmico de estudantes do SENAI CIMATEC. Ele ajuda quem travou numa matéria do curso técnico a encontrar um colega que já passou por ela.' },
          { p: 'Você escolhe a matéria, os turnos em que pode estudar e se prefere encontro presencial ou online. O sistema mostra colegas com horário livre nesses turnos, e você envia um pedido de ajuda para um deles.' },
          { p: 'É gratuito. Não há cobrança, nota nem avaliação por estrelas.' },
        ] },
        { id: 'quem-pode-usar', titulo: 'Quem pode usar', blocos: [
          { p: 'Estudantes dos cursos técnicos do SENAI CIMATEC, com e-mail institucional.' },
          { p: 'Para entrar, é preciso criar a conta, confirmar o e-mail pelo link que enviamos e aceitar estes termos e a política de privacidade.' },
          { p: 'Qualquer pessoa com conta pode pedir ajuda. Para receber pedidos, é preciso ligar "Quero receber pedidos de ajuda" em Minha conta.' },
        ] },
        { id: 'convivencia', titulo: 'Regras de convivência', blocos: [
          { lista: [
            'Trate os colegas com respeito, no sistema e nos encontros.',
            'Use o e-mail do colega só para combinar a sessão, e não o repasse a ninguém.',
            'A mentoria é ajuda para entender a matéria: não peça nem entregue atividade avaliativa pronta.',
            'Não cobre nem ofereça dinheiro ou favor pela ajuda.',
            'Crie a conta com o seu próprio e-mail institucional.',
          ] },
          { p: 'A mentoria acontece entre colegas e não substitui as aulas nem os professores.' },
        ] },
        { id: 'encontros', titulo: 'Encontros e sessões', blocos: [
          { p: 'Quem pede ajuda escolhe um horário livre do mentor e envia o pedido. O mentor aceita ou recusa. Se não houver resposta em 48 horas, o pedido expira, e você pode procurar outro colega.' },
          { p: 'Quando o pedido é aceito, o e-mail institucional do mentor aparece para você, e vocês combinam os detalhes por ele. O encontro é presencial, no CIMATEC - Orlando Gomes, ou online, pelo meio que vocês combinarem: o Cimatec Estudos não faz chamada de vídeo.' },
          { p: 'Você pode cancelar um pedido que ainda aguarda resposta. Para cancelar uma sessão já aceita, a tela pede duas confirmações, porque o colega reservou aquele horário para você.' },
        ] },
        { id: 'cancelamento', titulo: 'Cancelamento e exclusão da conta', blocos: [
          { p: 'Para parar de receber pedidos, desligue "Quero receber pedidos de ajuda" em Minha conta.' },
          { p: 'Para excluir a conta, use "Excluir minha conta" em Minha conta: a tela pede a sua senha para confirmar.' },
          { p: 'Nesta versão, a exclusão ainda não chega ao servidor: você sai da conta, mas ela e os seus dados continuam guardados. Apagar no servidor os seus dados e pedidos, e cancelar as sessões já aceitas, é a próxima etapa do projeto.' },
          { p: 'A conta criada e nunca confirmada é apagada sozinha 7 dias depois que o link de confirmação vence.' },
        ] },
      ],
    },
    {
      id: 'privacidade', titulo: '2. Política de Privacidade',
      secoes: [
        { id: 'dados-coletados', titulo: 'Quais dados coletamos', blocos: [
          { p: 'Só o necessário para a mentoria funcionar. De cada pessoa:' },
          { lista: [
            'Nome: como você quer ser chamado. Não precisa ser o nome completo.',
            'E-mail institucional: para entrar e para confirmar que você é do SENAI CIMATEC.',
            'Curso: para mostrar as matérias certas.',
            'Senha: guardada só como um código embaralhado (hash), do qual não dá para tirar a senha de volta.',
            'O aceite destes termos e da política, com a data e a versão.',
            'Os dois consentimentos opcionais, com a data em que você ligou cada um: mostrar a sua foto para quem está logado e aparecer na vitrine pública.',
          ] },
          { p: 'De quem ensina, também:' },
          { lista: [
            'As matérias que ensina e uma descrição curta ("Um pouco sobre mim").',
            'Os horários livres: dia, hora, turno e se o encontro é presencial ou online.',
            'O número de sessões concluídas e a data em que ligou "Quero receber pedidos de ajuda".',
            'A foto, que é opcional. Nesta versão ainda não há como enviar uma foto; sem ela, aparece a inicial do seu nome.',
          ] },
          { p: 'De cada pedido e sessão:' },
          { lista: [
            'A matéria, o que você precisa (escolhido numa lista, sem texto livre), o horário, a modalidade e o local.',
            'Quem pediu, quem vai ensinar, a situação do pedido e as datas de envio e de prazo.',
          ] },
        ] },
        { id: 'uso-dos-dados', titulo: 'Para que usamos', blocos: [
          { lista: [
            'Para você entrar e para confirmar que a conta é sua.',
            'Para mostrar quem pode ajudar na matéria e nos turnos que você escolheu. A ordem da lista vem de regra: primeiro quem tem mais horários compatíveis, depois quem tem mais sessões concluídas na matéria.',
            'Para levar o pedido até o mentor e mostrar a resposta para você.',
            'Para mostrar o e-mail do mentor a quem pediu ajuda, depois que o pedido é aceito.',
          ] },
          { p: 'Não usamos seus dados para propaganda nem para montar um perfil sobre você.' },
        ] },
        { id: 'compartilhamento', titulo: 'Com quem compartilhamos', blocos: [
          { p: 'Seus dados não são vendidos nem repassados. Dentro do sistema, cada pessoa vê só o que precisa:' },
          { lista: [
            'Quem está logado vê, de quem ensina: nome, curso, matérias, descrição, horários livres, número de sessões concluídas e, se a pessoa ligou essa chave, a foto.',
            'Quem ensina vê, de quem pediu ajuda: nome, curso e os dados do pedido.',
            'O e-mail institucional de quem ensina só aparece para quem pediu ajuda, e só depois que o pedido é aceito.',
            'A vitrine pública da página inicial, aberta a qualquer visitante, mostra só quem ligou essa chave: o primeiro nome, o curso, as matérias e a descrição. A foto só aparece se as duas chaves estiverem ligadas.',
            'Fora esse caso do e-mail de quem ensina, o seu e-mail, a sua senha e as datas dos seus consentimentos não aparecem para outras pessoas.',
          ] },
        ] },
        { id: 'retencao', titulo: 'Por quanto tempo guardamos', blocos: [
          { lista: [
            'Os dados do cadastro (nome, e-mail, curso, senha e os aceites): enquanto a conta existir (veja "Cancelamento e exclusão da conta"). Uma correção feita depois, em Minha conta, vale só nesta sessão (veja "Seus direitos").',
            'Os pedidos e as sessões: hoje ficam na memória do navegador e somem quando você sai da conta ou recarrega a página. Guardá-los no servidor é a próxima etapa do projeto, sem prazo definido.',
            'O link de confirmação do e-mail vale por 24 horas. A conta que nunca foi confirmada é apagada 7 dias depois que o link vence.',
            'A sessão de login termina depois de 30 minutos sem uso, ou quando você sai.',
            'Para frear quem tenta adivinhar senhas ou criar contas em massa, o servidor conta as tentativas de entrar, de criar conta e de pedir outro link, pelo e-mail e pelo endereço de rede (IP), por até meia hora. Essa contagem fica só na memória do servidor e não é gravada.',
          ] },
        ] },
        { id: 'direitos', titulo: 'Seus direitos', blocos: [
          { p: 'Tudo o que você pode fazer com os seus dados está em Minha conta, no menu com o seu nome:' },
          { lista: [
            'Ver os dados que você informou.',
            'Corrigir o nome e o curso. O e-mail institucional não pode ser alterado.',
            'Ligar ou desligar os dois consentimentos opcionais (foto e vitrine pública). Os dois começam desmarcados no cadastro, e desligar tem efeito imediato.',
            'Parar de receber pedidos de ajuda.',
            'Excluir a conta.',
          ] },
          { p: 'Nesta versão, a correção do nome e do curso, a troca dos consentimentos e a exclusão ainda não chegam ao servidor: valem só até você sair da conta ou recarregar a página. A escolha de receber ou não pedidos de ajuda já fica guardada. Levar o resto para o servidor é a próxima etapa do projeto.' },
          { p: 'O aceite destes termos e da política é obrigatório para usar o Cimatec Estudos. Se você não concordar mais com eles, o caminho é excluir a conta.' },
        ] },
        { id: 'menores-de-idade', titulo: 'Estudantes menores de idade', blocos: [
          { p: 'Parte dos alunos dos cursos técnicos tem menos de 18 anos. Por isso, o sistema pede o mínimo de todo mundo:' },
          { lista: [
            'Não pedimos data de nascimento, idade, telefone, endereço nem documento. A foto é sempre opcional.',
            'O semestre que você escolhe em "Pedir ajuda" serve só para filtrar as matérias e não é gravado.',
            'O que você precisa é escolhido numa lista, sem campo de texto livre.',
            'O único contato que circula é o e-mail institucional do mentor, e só depois do aceite.',
            'Idade, horário e disponibilidade nunca aparecem em página pública. A vitrine pública mostra só o primeiro nome, o curso, as matérias e a descrição de quem ligou essa chave.',
          ] },
        ] },
        { id: 'protecao', titulo: 'Como protegemos seus dados', blocos: [
          { lista: [
            'A senha é guardada com hash (BCrypt): nem a equipe consegue ler a sua senha.',
            'Depois que você entra, a sessão fica num cookie que o código da página não consegue ler, o que protege a conta de um script mal-intencionado. Um segundo cookie protege os formulários contra envio forjado. O site não usa cookies para outra finalidade.',
            'Depois de várias tentativas erradas de senha, a entrada fica bloqueada por alguns minutos.',
            'O link de confirmação do e-mail só funciona uma vez, e o servidor guarda só um código embaralhado dele.',
            'As telas privadas só abrem para quem entrou na conta, e o servidor recusa pedidos sem sessão válida.',
            'A página não carrega fontes, ícones nem scripts de outros sites.',
            'No seu navegador, o site guarda só a escolha de tema (do sistema, claro ou escuro). Ela fica no aparelho e não vai para o servidor.',
          ] },
        ] },
        { id: 'contato', titulo: 'Fale com a gente', blocos: [
          { p: 'O Cimatec Estudos é um projeto acadêmico de estudantes do SENAI CIMATEC, e o canal de contato ainda será definido.' },
        ] },
      ],
    },
  ];
}
