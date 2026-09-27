import { mensagemDoErro } from './erros-http';

describe('mensagemDoErro', () => {
  const TELA = 'Não foi possível entrar agora. Verifique sua conexão e tente novamente.';

  it('400 mostra a mensagem do servidor, não a de conexão', () => {
    expect(mensagemDoErro({ status: 400, error: { message: 'e-mail ou senha inválidos' } }, TELA))
      .toBe('e-mail ou senha inválidos');
  });

  it('sem resposta ou erro do servidor mostra o texto da tela', () => {
    expect(mensagemDoErro({ status: 0, error: null }, TELA)).toBe(TELA);
    expect(mensagemDoErro({ status: 500, error: { message: 'NullPointerException' } }, TELA)).toBe(TELA);
    expect(mensagemDoErro({ status: 503, error: '<html>' }, TELA)).toBe(TELA);
  });

  it('4xx sem mensagem legível cai no texto da tela', () => {
    expect(mensagemDoErro({ status: 400, error: null }, TELA)).toBe(TELA);
    expect(mensagemDoErro({ status: 404, error: '<html>' }, TELA)).toBe(TELA);
    expect(mensagemDoErro({ status: 400, error: { message: '   ' } }, TELA)).toBe(TELA);
  });
});
