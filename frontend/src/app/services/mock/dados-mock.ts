import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, delay, forkJoin, map, of, shareReplay, switchMap, throwError } from 'rxjs';

import { Materia } from '../../models/materia';
import { Mentor } from '../../models/mentor';
import { PRAZO_RESPOSTA_HORAS, Pedido, podeSerCancelado } from '../../models/pedido';
import { Usuario } from '../../models/usuario';
import { proximaData, somarHoras } from '../../shared/util/datas';
import { AuthService } from '../auth.service';
import { MentorMock } from './mentor-mock';
import { PedidoMock } from './pedido-mock';

/*
 * MOCK DE DADOS: responde ao que o Spring ainda não tem, lendo assets/*.json: /api/materias,
 * /api/mentores, /api/vitrine, /api/pedidos e a parte de /api/conta do commit 7 (nome e curso,
 * consentimentos, exclusão). Tudo em /api/auth/* e o PATCH /api/conta/mentoria passam direto,
 * porque moram no Spring. Os serviços continuam chamando /api: quando o Spring tiver o resto,
 * basta USAR_MOCK = false.
 *
 * Quem está logado vem do /api/auth/eu de verdade (AuthService.usuario). A persona do mock é
 * escolhida pelo e-mail dessa conta (PERSONAS): DECISOES.md, entrada de 2026-09-27.
 */
export const USAR_MOCK = true;

/** O que o mock precisa saber de quem está logado. */
interface Conta { usuarioId: string; mentorId: string | null; nome: string; curso: string; email: string; }

/**
 * Personas com pedidos em assets/pedidos.json, ligadas pelo e-mail. As contas de demonstração
 * nascem pelo cadastro com estes e-mails. E-mail sem persona = conta própria, sem pedidos.
 */
const PERSONAS: Record<string, { usuarioId: string; mentorId: string | null }> = {
  'bernardo@exemplo.com': { usuarioId: 'u-bernardo', mentorId: null },
  'ana@exemplo.com': { usuarioId: 'u-ana', mentorId: 'm-ana' },
};

function persona(usuario: Usuario | null): Conta | null {
  if (!usuario) return null;
  const fixa = PERSONAS[usuario.emailInstitucional.toLowerCase()];
  return {
    usuarioId: fixa?.usuarioId ?? usuario.id,
    // O lado de mentor só existe se o servidor disse que a pessoa é mentora (chave em Minha conta).
    mentorId: usuario.papeis.includes('mentor') ? fixa?.mentorId ?? null : null,
    nome: usuario.nome,
    curso: usuario.curso,
    email: usuario.emailInstitucional,
  };
}

const LOCAL_PRESENCIAL = 'CIMATEC - Orlando Gomes';

interface Base { mentores: MentorMock[]; materias: Materia[]; }

// Os JSON são lidos uma vez e reaproveitados (shareReplay guarda a última resposta).
let base$: Observable<Base> | null = null;
/** Pedidos em memória, como o serviço fazia antes: somem ao recarregar a página. */
let pedidos: Pedido[] | null = null;

export const dadosMockInterceptor: HttpInterceptorFn = (req, next) => {
  const rota = req.url.split('?')[0];
  if (!ehDoMock(rota)) return next(req);

  // O usuário que o guard já carregou do Spring. Interceptor funcional pode usar inject().
  const usuario = inject(AuthService).usuario();
  // HttpClient ligado direto ao HttpBackend: lê os assets sem passar de novo pelos interceptors.
  const http = new HttpClient(inject(HttpBackend));
  base$ ??= forkJoin({
    mentores: http.get<MentorMock[]>('/assets/mentores.json'),
    materias: http.get<Materia[]>('/assets/materias.json'),
    pedidosMock: http.get<PedidoMock[]>('/assets/pedidos.json'),
  }).pipe(
    map(({ mentores, materias, pedidosMock }) => {
      const agora = new Date();
      pedidos ??= pedidosMock.map((p) => converter(p, agora));
      return { mentores, materias };
    }),
    shareReplay(1),
  );
  return base$.pipe(switchMap((base) => responder(req, rota, base, usuario, next)), delay(300));
};

/** Só o que o Spring ainda não tem. /api/auth/* e a chave de mentoria são do Spring: passam direto. */
function ehDoMock(rota: string): boolean {
  if (rota.startsWith('/api/auth/') || rota === '/api/conta/mentoria') return false;
  return ['/api/materias', '/api/mentores', '/api/vitrine', '/api/pedidos', '/api/conta']
    .some((r) => rota === r || rota.startsWith(r + '/'));
}

function responder(req: HttpRequest<unknown>, rota: string, base: Base, usuario: Usuario | null,
    next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  if (req.method === 'GET' && rota === '/api/materias') return ok(base.materias);
  // A pessoa logada nunca aparece na própria busca: tirada aqui, na origem, e não na tela.
  // Como o perfil (tela 4) busca nesta mesma lista, ela também não abre o próprio perfil de
  // mentora pela URL. No Spring, a mesma regra vai para o servidor (DECISOES.md, 2026-09-27).
  if (req.method === 'GET' && rota === '/api/mentores') {
    const proprio = usuario ? PERSONAS[usuario.emailInstitucional.toLowerCase()]?.mentorId : null;
    return ok(verificados(base).filter((m) => m.id !== proprio).map(publico));
  }
  if (req.method === 'GET' && rota === '/api/vitrine') return ok(vitrine(base));

  const conta = persona(usuario);
  if (!usuario || !conta) return erro(401);
  // O perfil de mentora da própria pessoa: 404 = ainda não tem matérias cadastradas. Só as
  // personas do mock têm; o cadastro de matérias é continuação do projeto (plano de commits).
  if (req.method === 'GET' && rota === '/api/mentores/eu') {
    const id = PERSONAS[usuario.emailInstitucional.toLowerCase()]?.mentorId;
    const mentor = verificados(base).find((m) => m.id === id);
    return mentor ? ok(publico(mentor)) : erro(404);
  }
  if (rota.startsWith('/api/conta')) return minhaConta(req, rota, usuario, next);
  const lista = atualizarExpirados(pedidos ?? []);
  pedidos = lista;

  if (req.method === 'GET' && rota === '/api/pedidos') return ok(ordenar(lista.filter((p) => p.alunoId === conta.usuarioId)));
  if (req.method === 'GET' && rota === '/api/pedidos/recebidos') return ok(ordenar(lista.filter((p) => p.mentorId === conta.mentorId)));
  if (req.method === 'POST' && rota === '/api/pedidos') return criar(req.body as Record<string, string>, conta, base);

  const partes = rota.match(/^\/api\/pedidos\/([^/]+)(?:\/(cancelar|aceitar|recusar))?$/);
  if (!partes) return erro(404);
  const [, id, acao] = partes;
  const pedido = lista.find((p) => p.id === decodeURIComponent(id));
  const ehAluno = pedido?.alunoId === conta.usuarioId;
  const ehMentor = !!conta.mentorId && pedido?.mentorId === conta.mentorId;
  if (!pedido || (!ehAluno && !ehMentor)) return erro(404);

  if (req.method === 'GET' && !acao) return ok(pedido);
  if (req.method !== 'PATCH') return erro(405);
  if (acao === 'cancelar') {
    if (!ehAluno) return erro(403);
    if (!podeSerCancelado(pedido.status)) return erro(409, { codigo: 'PEDIDO_ENCERRADO', pedido });
    return ok(trocar({ ...pedido, status: 'cancelado' }));
  }
  if (!ehMentor) return erro(403);
  if (pedido.status !== 'aguardando') return erro(409, { codigo: 'PEDIDO_ENCERRADO', pedido });
  // Revalida na agenda da mentora: outra sessão já aceita no mesmo dia e hora bloqueia o aceite.
  const ocupado = acao === 'aceitar' && lista.some((p) => p.id !== pedido.id && p.mentorId === pedido.mentorId
    && p.status === 'aceito' && p.data === pedido.data && p.hora === pedido.hora);
  if (ocupado) return erro(409, { codigo: 'HORARIO_OCUPADO' });
  // O contato só passa a existir no pedido depois do aceite.
  return ok(trocar(acao === 'aceitar'
    ? { ...pedido, status: 'aceito', contatoMentor: { email: conta.email } }
    : { ...pedido, status: 'recusado' }));
}

/**
 * Minha conta até o commit 7: nome, curso e consentimentos mudam só na memória do navegador
 * (o AuthService guarda a resposta; recarregar a página volta ao que o servidor tem). A chave
 * de mentoria não passa aqui. Limitação registrada: DECISOES.md, 2026-09-27.
 */
function minhaConta(req: HttpRequest<unknown>, rota: string, usuario: Usuario, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const corpo = (req.body ?? {}) as Record<string, unknown>;
  if (req.method === 'PATCH' && rota === '/api/conta') {
    const nome = String(corpo['nome'] ?? '').trim();
    const curso = String(corpo['curso'] ?? '');
    if (!nome || !curso) return erro(400, { message: 'Nome e curso são obrigatórios.' });
    return ok({ ...usuario, nome, curso });
  }
  if (req.method === 'PATCH' && rota === '/api/conta/consentimentos') {
    const agora = new Date().toISOString();
    const consentimentos = {
      ...usuario.consentimentos,
      ...(typeof corpo['fotoParaLogados'] === 'boolean' && { fotoParaLogadosEm: corpo['fotoParaLogados'] ? agora : null }),
      ...(typeof corpo['vitrinePublica'] === 'boolean' && { vitrinePublicaEm: corpo['vitrinePublica'] ? agora : null }),
    };
    // O servidor não guarda foto, então ela continua null mesmo com o consentimento ligado.
    return ok({ ...usuario, consentimentos });
  }
  if (req.method === 'DELETE' && rota === '/api/conta') {
    if (!corpo['senha']) return erro(401);
    // Nada é apagado (a exclusão chega no commit 7), mas a saída é de verdade: esta mesma
    // requisição vira o POST de logout do Spring, e a sessão morre no servidor.
    return next(req.clone({ method: 'POST', url: '/api/auth/logout', body: {} }));
  }
  return erro(404);
}

function criar(corpo: Record<string, string>, conta: Conta, base: Base) {
  const mentor = verificados(base).find((m) => m.id === corpo['mentorId']);
  const materia = base.materias.find((m) => m.id === corpo['materiaId']);
  if (!mentor || !materia || !mentor.materias.includes(materia.id)) return erro(404);
  // Revalida no envio: o horário precisa continuar na agenda do mentor.
  const horario = mentor.horariosLivres.find((h) => h.id === corpo['horarioId']);
  if (!horario) return erro(409, { codigo: 'HORARIO_OCUPADO' });
  const existente = pedidos!.find((p) => p.alunoId === conta.usuarioId && p.status === 'aguardando'
    && p.mentorId === mentor.id && p.materiaId === materia.id);
  if (existente) return erro(409, { codigo: 'PEDIDO_DUPLICADO', pedido: existente });

  const agora = new Date();
  const pedido: Pedido = {
    id: `p-${agora.getTime()}`,
    alunoId: conta.usuarioId, alunoNome: conta.nome, alunoCurso: conta.curso, alunoFoto: null,
    mentorId: mentor.id, mentorNome: mentor.nome, mentorCurso: mentor.curso, mentorFoto: publico(mentor).foto,
    materiaId: materia.id, materiaNome: materia.nome,
    horarioId: horario.id, data: corpo['data'], hora: horario.hora, modalidade: horario.modalidade,
    local: horario.modalidade === 'online' ? 'Online' : LOCAL_PRESENCIAL,
    necessidade: corpo['necessidade'] || undefined,
    status: 'aguardando',
    criadoEm: agora.toISOString(),
    expiraEm: somarHoras(agora, PRAZO_RESPOSTA_HORAS).toISOString(),
  };
  pedidos = [...pedidos!, pedido];
  return ok(pedido);
}

/** Mentor não verificado nunca sai do "servidor". */
function verificados(base: Base): MentorMock[] {
  return base.mentores.filter((m) => m.verificado);
}

/** Visão pública: sem consentimentos nem simulação, e foto null sem consentimento. */
function publico({ respostaSimulada, consentimentos, ...mentor }: MentorMock): Mentor {
  return { ...mentor, foto: consentimentos.fotoParaLogadosEm ? mentor.foto : null };
}

/**
 * Vitrine da landing: só quem consentiu, primeiro nome, sem horário.
 * Sem foto, nunca: DECISOES.md, entrada de 2026-09-22. O campo nem existe nesta resposta —
 * a regra é tirada na origem, não escondida depois no template.
 */
function vitrine(base: Base) {
  return verificados(base)
    .filter((m) => m.consentimentos.vitrinePublicaEm)
    .map((m) => ({
      id: m.id,
      nome: m.nome.split(' ')[0],
      curso: m.curso,
      descricao: m.descricao,
      materias: m.materias.map((id) => base.materias.find((x) => x.id === id)?.nome).filter(Boolean),
    }));
}

/** Expiração em 48h calculada na leitura: prazo vencido sem resposta vira "expirado". */
function atualizarExpirados(lista: Pedido[]): Pedido[] {
  const agora = new Date().toISOString();
  return lista.map((p) => (p.status === 'aguardando' && p.expiraEm < agora ? { ...p, status: 'expirado' } : p));
}

function trocar(novo: Pedido): Pedido {
  pedidos = pedidos!.map((p) => (p.id === novo.id ? novo : p));
  return novo;
}

function ordenar(lista: Pedido[]): Pedido[] {
  return [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/** Transforma o tempo relativo do mock em datas absolutas. */
function converter({ dia, criadoHaHoras, ...campos }: PedidoMock, agora: Date): Pedido {
  const criadoEm = somarHoras(agora, -criadoHaHoras);
  return {
    ...campos,
    data: proximaData(dia, campos.hora, agora),
    criadoEm: criadoEm.toISOString(),
    expiraEm: somarHoras(criadoEm, PRAZO_RESPOSTA_HORAS).toISOString(),
  };
}

function ok(body: unknown): Observable<HttpResponse<unknown>> {
  return of(new HttpResponse({ status: 200, body }));
}

function erro(status: number, error: unknown = null): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status, error }));
}
