import { Component, effect, model } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-point-search',
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex flex-wrap items-end gap-4">
      <label class="flex grow flex-col gap-2 text-small font-semibold text-text-primary">
        Buscar ponto de encontro
        <input
          #searchField
          type="search"
          class="min-h-12 rounded-control border border-border bg-surface-muted px-3 text-body font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
          [formControl]="searchControl"
          (input)="searchTerm.set(searchField.value)"
        />
      </label>
      <label class="flex min-h-12 items-center gap-2 text-small font-medium text-text-primary">
        <input
          #activeField
          type="checkbox"
          class="size-4 accent-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
          [formControl]="activeControl"
          (change)="onlyActive.set(activeField.checked)"
        />
        Somente ativos
      </label>
    </div>
  `,
})
export class PointSearchComponent {
  readonly searchTerm = model('');
  readonly onlyActive = model(false);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly activeControl = new FormControl(false, { nonNullable: true });

  constructor() {
    effect(() => {
      const term = this.searchTerm();
      if (this.searchControl.value !== term) {
        this.searchControl.setValue(term, { emitEvent: false });
      }
    });

    effect(() => {
      const active = this.onlyActive();
      if (this.activeControl.value !== active) {
        this.activeControl.setValue(active, { emitEvent: false });
      }
    });
  }
}
