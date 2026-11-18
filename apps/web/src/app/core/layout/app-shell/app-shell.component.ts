import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

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
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly navigationItems = navigationItems;
  readonly session = this.authService.session;
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url },
  );
  readonly activeNavigationItem = computed(
    () =>
      this.navigationItems.find((item) => {
        const url = this.currentUrl();
        return url === item.path || url.startsWith(`${item.path}/`);
      }) ?? this.navigationItems[0],
  );

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/entrar');
  }
}
