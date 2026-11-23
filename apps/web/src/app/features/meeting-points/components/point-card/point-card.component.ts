import { Component, input, output } from '@angular/core';

import { MeetingPoint } from '../../models/meeting-point.model';

@Component({
  selector: 'app-point-card',
  template: `
    @let meetingPoint = point();
    <article class="flex flex-col gap-3 rounded-card border border-border bg-background p-4">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <h3 class="text-body font-semibold text-text-primary">{{ meetingPoint.name }}</h3>
        <span
          class="rounded-full px-2 py-1 text-caption font-medium"
          [class.bg-success/10]="meetingPoint.isActive"
          [class.bg-surface-muted]="!meetingPoint.isActive"
          [class.text-text-secondary]="!meetingPoint.isActive"
        >
          {{ meetingPoint.isActive ? 'Ativo' : 'Inativo' }}
        </span>
      </div>
      <p class="text-small text-text-secondary">{{ meetingPoint.address }}</p>
      <button
        type="button"
        class="min-h-12 self-start rounded-control border border-border px-3 text-small font-semibold text-text-primary hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
        [attr.aria-label]="(meetingPoint.isActive ? 'Desativar ' : 'Reativar ') + meetingPoint.name"
        (click)="toggleStatus.emit(meetingPoint.id)"
      >
        {{ meetingPoint.isActive ? 'Desativar' : 'Reativar' }}
      </button>
    </article>
  `,
})
export class PointCardComponent {
  readonly point = input.required<MeetingPoint>();
  readonly toggleStatus = output<string>();
}
