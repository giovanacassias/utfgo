import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { appConfig } from '../../../../app.config';

describe('Landing page', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    harness = await RouterTestingHarness.create('/');
    await harness.fixture.whenStable();
  });

  it.each([
    { label: 'Entrar com e-mail institucional', path: '/entrar' },
    { label: 'Criar conta', path: '/criar-conta' },
  ])('navigates to $path from the "$label" link', async ({ label, path }) => {
    const link = Array.from(harness.routeNativeElement?.querySelectorAll('a') ?? []).find(
      (anchor) => anchor.textContent.trim() === label,
    );
    expect(link, `Expected a "${label}" link on the landing page`).toBeDefined();

    link?.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe(path);
  });
});
