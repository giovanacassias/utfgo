import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MeetingPointDetails, MeetingPointsService } from '../../services/meeting-points.service';

@Component({
  selector: 'app-point-details',
  imports: [RouterLink],
  template: `
    <section class="flex max-w-2xl flex-col items-start gap-4">
      <a
        routerLink="/pontos-de-encontro"
        class="rounded-control text-small font-semibold text-tertiary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
      >
        Voltar para pontos de encontro
      </a>

      @if (point(); as point) {
        <h1 class="text-title font-bold text-text-primary">{{ point.name }}</h1>
        <p class="text-body text-text-secondary">{{ point.address }}</p>
        <span
          class="rounded-full px-2 py-1 text-caption font-medium"
          [class.bg-success/10]="point.isActive"
          [class.bg-surface-muted]="!point.isActive"
          [class.text-text-secondary]="!point.isActive"
        >
          {{ point.isActive ? 'Ativo' : 'Inativo' }}
        </span>
        <button
          type="button"
          class="min-h-12 rounded-control border border-border px-3 text-small font-semibold text-text-primary hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary disabled:opacity-50"
          [disabled]="meetingPoints.loading.toggle()"
          (click)="toggleStatus()"
        >
          {{ point.isActive ? 'Desativar ponto' : 'Reativar ponto' }}
        </button>
        <p role="status" class="text-small text-success">{{ feedback() }}</p>
      } @else if (!details().error) {
        <p class="text-small text-text-secondary">Ponto de encontro não encontrado.</p>
      }

      @if ((details().error ?? toggleError()); as error) {
        <p role="alert" class="text-small text-danger">{{ error }}</p>
      }
    </section>
  `,
})
export class PointDetailsPage {
  readonly id = input.required<string>();
  readonly details = input.required<MeetingPointDetails>();

  protected readonly meetingPoints = inject(MeetingPointsService);
  protected readonly point = computed(() => {
    const { point } = this.details();
    return point
      ? this.meetingPoints.points().find(({ id }) => id === point.id) ?? point
      : null;
  });
  protected readonly feedback = linkedSignal({ source: this.id, computation: () => '' });

  protected readonly toggleError = linkedSignal({
    source: this.details,
    computation: (): string | null => null,
  });

  protected async toggleStatus(): Promise<void> {
    if (this.meetingPoints.loading.toggle()) {
      return;
    }

    this.feedback.set('');
    this.toggleError.set(null);
    const id = this.id();
    const updated = await this.meetingPoints.toggleStatus(id);

    if (id !== this.id()) {
      return;
    }

    if (updated) {
      this.feedback.set(
        updated.isActive ? 'Ponto de encontro reativado.' : 'Ponto de encontro desativado.',
      );
    } else {
      this.toggleError.set(this.meetingPoints.error());
    }
  }
}
