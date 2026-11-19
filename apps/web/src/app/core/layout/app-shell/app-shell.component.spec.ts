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

    const driverOption = Array.from(sidebar.querySelectorAll('button')).find(
      (button) => button.textContent.trim() === 'Condutor',
    );
    expect(driverOption?.disabled).toBe(true);

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

  it('displays the persisted wallet balance in the header', async () => {
    session.update(
      (current) =>
        current && {
          ...current,
          wallet: {
            id: 'wallet-1',
            userId: 'user-1',
            tokenBalance: 7,
            penaltyPoints: 0,
            updatedAt: '2026-10-02T00:00:00.000Z',
          },
        },
    );
    await harness.navigateByUrl('/inicio', AppShellComponent);
    expect(
      harness.fixture.nativeElement.querySelector('[data-app-shell-header]').textContent,
    ).toContain('7 fichas');
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

  it('keeps the authenticated host limited to the router outlet', () => {
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
    const appTemplate = nodeProcess
      ?.getBuiltinModule?.('fs')
      .readFileSync(`${nodeProcess.cwd()}/src/app/app.html`, 'utf8');

    expect(appTemplate).toContain('<router-outlet />');
    expect(appTemplate).not.toContain('Design System');
    expect(appTemplate).not.toContain('Ação Primária');
  });

  describe('mobile drawer', () => {
    let shell: HTMLElement;
    let toggle: HTMLButtonElement;

    beforeEach(async () => {
      await harness.navigateByUrl('/inicio', AppShellComponent);
      shell = harness.routeNativeElement as HTMLElement;
      toggle = shell.querySelector<HTMLButtonElement>('[aria-label="Abrir menu"]')!;
    });

    function drawer(): HTMLElement | null {
      return shell.querySelector('#app-shell-mobile-drawer');
    }

    async function openDrawer(): Promise<void> {
      toggle.focus();
      toggle?.click();
      await harness.fixture.whenStable();
      expect(drawer()).not.toBeNull();
    }

    it('moves focus from the trigger to the close button when the drawer opens', async () => {
      await openDrawer();

      expect(document.activeElement).toBe(drawer()?.querySelector('[aria-label="Fechar menu"]'));
    });

    it('makes the background inert until the drawer closes', async () => {
      const background = ['[data-app-shell-sidebar]', '[data-app-shell-header]', 'main'].map(
        (selector) => shell.querySelector(selector)!,
      );

      await openDrawer();
      expect(background.every((element) => element.hasAttribute('inert'))).toBe(true);

      drawer()?.querySelector<HTMLButtonElement>('[aria-label="Fechar menu"]')?.click();
      await harness.fixture.whenStable();
      expect(background.some((element) => element.hasAttribute('inert'))).toBe(false);
    });

    it.each([
      { shiftKey: false, from: '[data-app-shell-logout]', to: '[aria-label="Fechar menu"]' },
      { shiftKey: true, from: '[aria-label="Fechar menu"]', to: '[data-app-shell-logout]' },
    ])('wraps Tab at the drawer boundary (Shift=$shiftKey)', async ({ shiftKey, from, to }) => {
      await openDrawer();
      const start = drawer()!.querySelector<HTMLButtonElement>(from)!;
      start.focus();

      const tab = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      start.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(drawer()?.querySelector(to));
    });

    it('allows the default Tab behavior between controls inside the drawer', async () => {
      await openDrawer();
      const link = drawer()!.querySelector<HTMLAnchorElement>('nav a')!;
      link.focus();

      const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      link.dispatchEvent(tab);

      expect(tab.defaultPrevented).toBe(false);
    });

    it.each([
      { shiftKey: false, to: '[aria-label="Fechar menu"]' },
      { shiftKey: true, to: '[data-app-shell-logout]' },
    ])(
      'keeps Tab inside when the drawer itself has focus (Shift=$shiftKey)',
      async ({ shiftKey, to }) => {
        await openDrawer();
        const panel = drawer()!;
        panel.focus();
        expect(document.activeElement).toBe(panel);

        panel.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }),
        );

        expect(document.activeElement).toBe(panel.querySelector(to));
      },
    );

    it('keeps focus inside on backdrop press before click closes the drawer', async () => {
      await openDrawer();
      const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

      shell.querySelector('[data-app-shell-backdrop]')!.dispatchEvent(press);

      expect(press.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(drawer()?.querySelector('[aria-label="Fechar menu"]'));
    });

    it('handles Escape from a drawer link and restores focus to the trigger', async () => {
      await openDrawer();
      const link = drawer()!.querySelector<HTMLAnchorElement>('nav a')!;
      link.focus();

      const escape = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      link.dispatchEvent(escape);
      await harness.fixture.whenStable();

      expect(escape.defaultPrevented).toBe(true);
      expect(drawer()).toBeNull();
      expect(document.activeElement).toBe(toggle);
    });

    it('releases the desktop navigation and focuses the active desktop link on resize', async () => {
      await openDrawer();
      toggle.hidden = true;
      window.dispatchEvent(new Event('resize'));
      await harness.fixture.whenStable();

      expect(drawer()).toBeNull();
      expect(shell.querySelector('[data-app-shell-sidebar]')?.hasAttribute('inert')).toBe(false);
      expect(document.activeElement).toBe(
        shell.querySelector('[data-app-shell-sidebar] nav a[href="/inicio"]'),
      );
    });

    it('opens from the mobile header and displays the six links and footer', async () => {
      expect(toggle?.textContent?.trim()).toBe('☰');
      expect(toggle.classList.contains('lg:hidden')).toBe(true);
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(drawer()).toBeNull();

      await openDrawer();

      const links = Array.from(drawer()!.querySelectorAll('nav a'));
      expect(links.map((link) => [link.textContent?.trim(), link.getAttribute('href')])).toEqual([
        ['Início', '/inicio'],
        ['Caronas', '/caronas'],
        ['Cofrinho', '/cofrinho'],
        ['Pontos de encontro', '/pontos-de-encontro'],
        ['Meu histórico', '/meu-historico'],
        ['Meu perfil', '/meu-perfil'],
      ]);
      expect(links[0].classList.contains('bg-tertiary')).toBe(true);
      expect(drawer()?.querySelector('footer')?.textContent).toContain(
        'Acesso institucional UTFPR',
      );
      expect(drawer()?.querySelector('footer')?.textContent).toContain('Ajuda e suporte');
      expect(drawer()?.parentElement?.classList.contains('lg:hidden')).toBe(true);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });

    it.each([
      { control: 'close button', selector: '[aria-label="Fechar menu"]' },
      { control: 'backdrop', selector: '[data-app-shell-backdrop]' },
    ])('closes and returns focus to the trigger on $control click', async ({ selector }) => {
      await openDrawer();
      shell.querySelector<HTMLElement>(selector)!.click();
      await harness.fixture.whenStable();

      expect(drawer()).toBeNull();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(toggle);
    });

    it('closes when a link navigates to another route', async () => {
      await openDrawer();
      drawer()?.querySelector<HTMLAnchorElement>('nav a[href="/caronas"]')?.click();
      await harness.fixture.whenStable();

      expect(router.url).toBe('/caronas');
      expect(drawer()).toBeNull();
      expect(document.activeElement).toBe(toggle);
    });

    it('closes when the current route link is selected', async () => {
      await openDrawer();
      drawer()?.querySelector<HTMLAnchorElement>('nav a[href="/inicio"]')?.click();
      await harness.fixture.whenStable();

      expect(router.url).toBe('/inicio');
      expect(drawer()).toBeNull();
    });

    it('closes after navigation initiated outside the drawer', async () => {
      await openDrawer();
      drawer()!.querySelector<HTMLAnchorElement>('nav a')!.focus();
      await harness.navigateByUrl('/caronas/detalhes', AppShellComponent);

      expect(drawer()).toBeNull();
      expect(document.activeElement).toBe(toggle);
    });
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
