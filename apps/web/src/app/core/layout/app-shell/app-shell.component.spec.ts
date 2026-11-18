import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';

import { AuthService } from '../../auth/auth.service';
import { AuthSession } from '../../models/auth.model';
import { AppShellComponent } from './app-shell.component';

@Component({
  selector: 'app-shell-test-page',
  template: '<span data-shell-test-page>Conteúdo da rota</span>',
})
class ShellTestPage {}

describe('AppShellComponent', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  const session = signal<AuthSession | null>({
    token: 'session-token',
    user: {
      id: 'user-1',
      name: 'Ana UTFPR',
      email: 'ana@alunos.utfpr.edu.br',
      campus: 'Curitiba',
      role: 'PASSENGER',
      status: 'ACTIVE',
    },
  });
  const logout = vi.fn();

  beforeEach(async () => {
    session.set({
      token: 'session-token',
      user: {
        id: 'user-1',
        name: 'Ana UTFPR',
        email: 'ana@alunos.utfpr.edu.br',
        campus: 'Curitiba',
        role: 'PASSENGER',
        status: 'ACTIVE',
      },
    });
    logout.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'entrar', component: ShellTestPage },
          {
            path: '',
            component: AppShellComponent,
            children: [
              { path: 'inicio', component: ShellTestPage },
              {
                path: 'caronas',
                component: ShellTestPage,
                children: [{ path: 'detalhes', component: ShellTestPage }],
              },
            ],
          },
        ]),
        {
          provide: AuthService,
          useValue: { session: session.asReadonly(), logout },
        },
      ],
    });

    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  it('uses the desktop width token from the local spacing scale', async () => {
    await harness.navigateByUrl('/inicio', AppShellComponent);

    const shell = harness.fixture.nativeElement as HTMLElement;
    const nodeProcess = (
      globalThis as typeof globalThis & {
        process?: {
          cwd: () => string;
          getBuiltinModule?: (moduleName: string) => {
            readFileSync(path: string, encoding: 'utf8'): string;
          };
        };
      }
    ).process;
    const styles = nodeProcess
      ?.getBuiltinModule?.('fs')
      .readFileSync(`${nodeProcess.cwd()}/src/styles.css`, 'utf8');

    expect(styles).toMatch(/--spacing-62:\s*248px;/);
    expect(shell.querySelector('[data-app-shell-sidebar]')?.classList.contains('lg:w-62')).toBe(
      true,
    );
    expect(shell.querySelector('[data-app-shell-root]')?.classList.contains('lg:pl-62')).toBe(true);
  });

  it('renders the fixed desktop navigation, active link, header, outlet, and footer', async () => {
    await harness.navigateByUrl('/inicio', AppShellComponent);

    const shell = harness.fixture.nativeElement as HTMLElement;
    const appShell = shell.querySelector('[data-app-shell-root]') as HTMLElement;
    const sidebar = shell.querySelector('[data-app-shell-sidebar]') as HTMLElement;
    const links = Array.from(shell.querySelectorAll('[data-app-shell-sidebar] nav a'));

    expect(sidebar.classList.contains('lg:fixed')).toBe(true);
    expect(sidebar.classList.contains('lg:w-62')).toBe(true);
    expect(appShell.classList.contains('lg:pl-62')).toBe(true);
    expect(shell.querySelector('[data-app-shell-header]')?.classList.contains('min-h-12')).toBe(
      true,
    );
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Início',
      'Caronas',
      'Cofrinho',
      'Pontos de encontro',
      'Meu histórico',
      'Meu perfil',
    ]);
    expect(links[0].classList.contains('bg-tertiary')).toBe(true);
    expect(shell.querySelector('[data-app-shell-header]')?.textContent).toContain('Ana UTFPR');
    expect(shell.querySelector('router-outlet')).not.toBeNull();
    expect(shell.querySelector('[data-app-shell-footer]')?.textContent).toContain(
      'Acesso institucional UTFPR',
    );
    expect(shell.querySelector('[data-shell-test-page]')).not.toBeNull();
  });

  it('updates the header title and keeps the parent link active on child routes', async () => {
    await harness.navigateByUrl('/caronas/detalhes', AppShellComponent);

    const shell = harness.fixture.nativeElement as HTMLElement;
    const links = Array.from(shell.querySelectorAll('[data-app-shell-sidebar] nav a'));

    expect(shell.querySelector('[data-app-shell-header]')?.textContent).toContain('Caronas');
    expect(shell.querySelector('[data-app-shell-header]')?.textContent).toContain('Ana UTFPR');
    expect(links[1].classList.contains('bg-tertiary')).toBe(true);
  });

  it('keeps the active title when the route has query parameters', async () => {
    await harness.navigateByUrl('/caronas?filtro=hoje', AppShellComponent);

    const shell = harness.fixture.nativeElement as HTMLElement;

    expect(shell.querySelector('[data-app-shell-header]')?.textContent).toContain('Caronas');
  });

  it('logs out and navigates to the public login route', async () => {
    await harness.navigateByUrl('/inicio', AppShellComponent);

    const shell = harness.fixture.nativeElement as HTMLElement;
    (shell.querySelector('[data-app-shell-logout]') as HTMLButtonElement).click();
    await harness.fixture.whenStable();

    expect(logout).toHaveBeenCalledOnce();
    expect(router.url).toBe('/entrar');
  });
});
