import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';

import { Usuario } from '../../models/usuario';

/*
 * SESSÃO SIMULADA — SAI QUANDO O BACK-END DE AUTENTICAÇÃO ENTRAR.
 * Registro e prazo de remoção: DECISOES.md, entrada de 2026-09-26.
 *
 * Responde às rotas /api/auth/* e /api/conta* dentro do navegador, sem servidor.
 * NÃO É SEGURANÇA: qualquer senha não vazia entra nas contas de demonstração.
 * É uma porta aberta, útil só para ver as telas privadas enquanto o Spring não tem login.
 */
export const SESSAO_SIMULADA = true;

interface ContaDemonstracao {
  usuario: Usuario;
  /** Mentor ligado à conta: é por ele que o mock encontra os pedidos recebidos. */
  mentorId: string | null;
  /** Retrato que volta a aparecer se a pessoa religar o consentimento de foto. */
  retrato: string | null;
}

const ACEITE = '2026-09-24T10:00:00-03:00';

/** Dados fictícios (ESPECIFICACAO-TELAS.md, seção 4). Sem senha: o mock não guarda nenhuma. */
const CONTAS: ContaDemonstracao[] = [
  {
    mentorId: null,
    retrato: null,
    usuario: {
      id: 'u-bernardo', nome: 'Bernardo', emailInstitucional: 'bernardo@exemplo.com',
      curso: 'Redes de Computadores', foto: null, termosVersao: '1.0',
      papeis: ['aluno'], verificacao: 'verificado',
      consentimentos: { termosEPoliticaEm: ACEITE, fotoParaLogadosEm: null, vitrinePublicaEm: null },
    },
  },
  {
    mentorId: 'm-ana',
    retrato: 'assets/ilustracoes/mentor-ana.png',
    usuario: {
      id: 'u-ana', nome: 'Ana', emailInstitucional: 'ana@exemplo.com',
      curso: 'Redes de Computadores', foto: 'assets/ilustracoes/mentor-ana.png', termosVersao: '1.0',
      papeis: ['aluno', 'mentor'], verificacao: 'verificado',
      consentimentos: { termosEPoliticaEm: ACEITE, fotoParaLogadosEm: ACEITE, vitrinePublicaEm: ACEITE },
    },
  },
];

/** Quem está "logado". Só em memória: recarregar a página volta para o Bernardo. */
let contaAtual: ContaDemonstracao | null = CONTAS[0];

/** Usado pelo mock de dados para saber de quem são os pedidos. */
export function contaSimulada(): { usuarioId: string; nome: string; curso: string; email: string; mentorId: string | null } | null {
  if (!contaAtual) return null;
  const { usuario, mentorId } = contaAtual;
  return { usuarioId: usuario.id, nome: usuario.nome, curso: usuario.curso, email: usuario.emailInstitucional, mentorId };
}

/**
 * Interceptor: função que o HttpClient chama antes de cada requisição. Aqui ela responde
 * às rotas de sessão sem deixar a requisição sair do navegador; as outras seguem com next().
 */
export const sessaoSimuladaInterceptor: HttpInterceptorFn = (req, next) => {
  const rota = req.url.split('?')[0];
  if (!rota.startsWith('/api/auth/') && !rota.startsWith('/api/conta')) return next(req);
  return responder(req, rota).pipe(delay(300));
};

function responder(req: HttpRequest<unknown>, rota: string): Observable<HttpResponse<unknown>> {
  const corpo = (req.body ?? {}) as Record<string, unknown>;
  const chave = `${req.method} ${rota}`;

  if (chave === 'GET /api/auth/csrf') return ok({});
  if (chave === 'GET /api/auth/eu') return contaAtual ? ok(contaAtual.usuario) : erro(401);

  if (chave === 'POST /api/auth/login') {
    const email = String(corpo['email'] ?? '').trim().toLowerCase();
    const conta = CONTAS.find((c) => c.usuario.emailInstitucional === email);
    // Qualquer senha não vazia: é exatamente a porta aberta registrada no DECISOES.md.
    if (!conta || !corpo['senha']) return erro(401, { message: 'e-mail ou senha inválidos' });
    contaAtual = conta;
    return ok(conta.usuario);
  }
  if (chave === 'POST /api/auth/logout') { contaAtual = null; return ok(null); }

  // Cadastro e verificação não gravam nada: só levam às telas certas.
  if (chave === 'POST /api/auth/cadastro' || chave === 'POST /api/auth/reenviar') return ok(null);
  if (chave === 'POST /api/auth/verificacao') {
    const token = String(corpo['token'] ?? '');
    const estado = token === 'expirado' ? 'expirado' : token === 'usado' ? 'ja-usado' : 'ativada';
    return ok({ estado });
  }

  if (!contaAtual) return erro(401);
  const conta = contaAtual;

  if (chave === 'PATCH /api/conta') {
    const nome = String(corpo['nome'] ?? '').trim();
    const curso = String(corpo['curso'] ?? '');
    if (!nome || !curso) return erro(400, { message: 'Nome e curso são obrigatórios.' });
    conta.usuario = { ...conta.usuario, nome, curso };
    return ok(conta.usuario);
  }
  if (chave === 'PATCH /api/conta/consentimentos') {
    const agora = new Date().toISOString();
    const atual = conta.usuario.consentimentos;
    const consentimentos = {
      ...atual,
      ...(typeof corpo['fotoParaLogados'] === 'boolean' && { fotoParaLogadosEm: corpo['fotoParaLogados'] ? agora : null }),
      ...(typeof corpo['vitrinePublica'] === 'boolean' && { vitrinePublicaEm: corpo['vitrinePublica'] ? agora : null }),
    };
    // Desligar a foto tem efeito imediato: o campo vira null na origem, e o avatar mostra a inicial.
    conta.usuario = { ...conta.usuario, consentimentos, foto: consentimentos.fotoParaLogadosEm ? conta.retrato : null };
    return ok(conta.usuario);
  }
  if (chave === 'DELETE /api/conta') {
    if (!corpo['senha']) return erro(401);
    contaAtual = null;
    return ok(null);
  }
  return erro(404);
}

function ok(body: unknown): Observable<HttpResponse<unknown>> {
  return of(new HttpResponse({ status: 200, body }));
}

function erro(status: number, error: unknown = null): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status, error }));
}
