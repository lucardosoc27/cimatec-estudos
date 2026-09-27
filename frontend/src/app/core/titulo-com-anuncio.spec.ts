import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { TituloComAnuncio } from './titulo-com-anuncio';

@Component({ template: '' })
class Vazia {}

// O app é zoneless: sem fakeAsync, espera de verdade o setTimeout do anúncio.
const esperar = () => new Promise((r) => setTimeout(r, 200));

describe('TituloComAnuncio', () => {
  let anuncio: TituloComAnuncio;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'inicio', title: 'Início · Cimatec Estudos', component: Vazia },
          { path: 'mentores', title: 'Mentores para você · Cimatec Estudos', component: Vazia },
        ]),
        { provide: TitleStrategy, useExisting: TituloComAnuncio },
      ],
    });
    anuncio = TestBed.inject(TituloComAnuncio);
  });

  it('põe o título na aba e anuncia a troca de tela, mas não a primeira carga', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio');
    await esperar();
    expect(TestBed.inject(Title).getTitle()).toBe('Início · Cimatec Estudos');
    expect(anuncio.anuncio()).toBe('');

    await harness.navigateByUrl('/mentores');
    await esperar();
    expect(anuncio.anuncio()).toBe('Página Mentores para você');
  });

  it('não anuncia de novo quando só os parâmetros da URL mudam', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio');
    await harness.navigateByUrl('/mentores?materia=a');
    await esperar();
    expect(anuncio.anuncio()).toBe('Página Mentores para você');

    anuncio.anuncio.set('');
    await harness.navigateByUrl('/mentores?materia=b');
    await esperar();
    expect(anuncio.anuncio()).toBe('');
  });
});
