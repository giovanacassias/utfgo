import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home-page',
  template: `<section><h1 class="text-title font-bold">Olá, {{ session()?.user?.name }}</h1></section>`,
})
export class HomePage {
  protected readonly session = inject(AuthService).session;
}
