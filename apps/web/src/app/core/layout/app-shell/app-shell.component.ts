import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, tap } from 'rxjs';

import { AuthService } from '../../auth/auth.service';

const navigationItems = [
  { label: 'Início', path: '/inicio' },
  { label: 'Caronas', path: '/caronas' },
  { label: 'Cofrinho', path: '/cofrinho' },
  { label: 'Pontos de encontro', path: '/pontos-de-encontro' },
  { label: 'Meu histórico', path: '/meu-historico' },
  { label: 'Meu perfil', path: '/meu-perfil' },
] as const;

@Component({
  selector: 'app-shell',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  host: { '(window:resize)': 'closeDrawerIfHidden()' },
})
export class AppShellComponent {
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly menuToggle = viewChild.required<ElementRef<HTMLButtonElement>>('menuToggle');
  private readonly desktopSidebar = viewChild.required<ElementRef<HTMLElement>>('desktopSidebar');
  private readonly drawerCloseButton =
    viewChild<ElementRef<HTMLButtonElement>>('drawerCloseButton');

  readonly session = this.authService.session;
  readonly navigationItems = computed(() => {
    const user = this.session()?.user;
    return user?.role === 'ADMIN' && user.status === 'ACTIVE'
      ? navigationItems
      : navigationItems.filter((item) => item.path !== '/pontos-de-encontro');
  });
  readonly drawerOpen = signal(false);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      tap(() => this.closeDrawer()),
      map((event) => event.urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url },
  );
  readonly activeNavigationItem = computed(
    () =>
      this.navigationItems().find((item) => {
        const url = this.currentUrl();
        return url === item.path || url.startsWith(`${item.path}/`);
      }) ?? this.navigationItems()[0],
  );

  constructor() {
    afterRenderEffect({
      write: () => this.drawerCloseButton()?.nativeElement.focus(),
    });
  }

  closeDrawer(focusDesktopNavigation = false): void {
    if (this.drawerOpen()) {
      this.drawerOpen.set(false);
      afterNextRender(
        {
          write: () => {
            if (!this.drawerOpen()) {
              if (focusDesktopNavigation) {
                const activeLink =
                  this.desktopSidebar().nativeElement.querySelector<HTMLAnchorElement>(
                    `nav a[href="${this.activeNavigationItem().path}"]`,
                  );
                activeLink?.focus();
              } else {
                this.menuToggle().nativeElement.focus();
              }
            }
          },
        },
        { injector: this.injector },
      );
    }
  }

  closeDrawerIfHidden(): void {
    if (this.drawerOpen()) {
      const toggle = this.menuToggle().nativeElement;
      if (toggle.ownerDocument.defaultView?.getComputedStyle(toggle).display === 'none') {
        this.closeDrawer(true);
      }
    }
  }

  onDrawerKeydown(event: KeyboardEvent, drawer: HTMLElement): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeDrawer();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const controls = Array.from(drawer.querySelectorAll<HTMLElement>('a[href], button:enabled'));
    const first = controls[0];
    const last = controls[controls.length - 1];
    const boundary = event.shiftKey ? first : last;
    const destination = event.shiftKey ? last : first;

    if (event.target === boundary || event.target === drawer) {
      event.preventDefault();
      destination.focus();
    }
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/entrar');
  }
}
