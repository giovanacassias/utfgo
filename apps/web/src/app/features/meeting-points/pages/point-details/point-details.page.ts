import { Component, computed, inject, input, linkedSignal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MeetingPointsService } from '../../services/meeting-points.service';

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

      @if (meetingPoints.loading.load()) {
        <p role="status" class="text-small text-text-secondary">Carregando ponto de encontro…</p>
      } @else if (point(); as point) {
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
      } @else if (!meetingPoints.error()) {
        <p class="text-small text-text-secondary">Ponto de encontro não encontrado.</p>
      }

      @if (meetingPoints.error(); as error) {
        <p role="alert" class="text-small text-danger">{{ error }}</p>
      }
    </section>
  `,
})
export class PointDetailsPage implements OnInit {
  readonly id = input.required<string>();

  protected readonly meetingPoints = inject(MeetingPointsService);
  protected readonly point = computed(() => {
    const id = this.id();
    return this.meetingPoints.points().find((point) => point.id === id);
  });
  protected readonly feedback = linkedSignal({ source: this.id, computation: () => '' });

  ngOnInit(): void {
    if (!this.meetingPoints.loading.load()) {
      void this.meetingPoints.loadPoints();
    }
  }

  protected async toggleStatus(): Promise<void> {
    if (this.meetingPoints.loading.toggle()) {
      return;
    }

    this.feedback.set('');
    const updated = await this.meetingPoints.toggleStatus(this.id());

    if (updated?.id === this.id()) {
      this.feedback.set(
        updated.isActive ? 'Ponto de encontro reativado.' : 'Ponto de encontro desativado.',
      );
    }
  }
}
