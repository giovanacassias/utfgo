import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { PointCardComponent } from '../../components/point-card/point-card.component';
import { PointSearchComponent } from '../../components/point-search/point-search.component';
import { MeetingPointsService } from '../../services/meeting-points.service';

@Component({
  selector: 'app-points-list',
  imports: [PointCardComponent, PointSearchComponent, RouterLink],
  template: `
    <section class="flex flex-col gap-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-title font-bold text-text-primary">Pontos de encontro</h1>
        <a
          routerLink="novo"
          class="inline-flex min-h-12 items-center rounded-control bg-primary px-4 text-small font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
        >
          Novo ponto de encontro
        </a>
      </header>

      @if (pointCreated) {
        <p role="status" class="text-small text-success">
          Ponto de encontro cadastrado com sucesso.
        </p>
      }

      <app-point-search [(searchTerm)]="search" [(onlyActive)]="showActive" />

      @if (meetingPoints.error(); as error) {
        <p role="alert" class="text-small text-danger">{{ error }}</p>
      }

      @defer (on viewport) {
        @if (meetingPoints.loading.load()) {
          <p role="status" class="text-small text-text-secondary">Carregando pontos de encontro…</p>
        } @else {
          <ul class="grid gap-4 md:grid-cols-2">
            @for (point of points(); track point.id) {
              <li class="flex flex-col gap-2">
                <app-point-card [point]="point" (toggleStatus)="onToggleStatus($event)" />
                <a
                  [routerLink]="[point.id]"
                  [attr.aria-label]="'Ver detalhes de ' + point.name"
                  class="self-start rounded-control text-small font-semibold text-tertiary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
                >
                  Ver detalhes
                </a>
              </li>
            } @empty {
              @if (!meetingPoints.error()) {
                <li class="text-small text-text-secondary">Nenhum ponto de encontro encontrado.</li>
              }
            }
          </ul>
        }
      } @placeholder {
        <div role="status" class="rounded-card border border-border bg-background p-4">
          <span class="sr-only">Carregando pontos de encontro…</span>
          <div aria-hidden="true" class="flex flex-col gap-3 motion-safe:animate-pulse">
            <div class="h-6 w-1/2 rounded-control bg-surface-muted"></div>
            <div class="h-4 w-3/4 rounded-control bg-surface-muted"></div>
            <div class="h-12 w-1/4 rounded-control bg-surface-muted"></div>
          </div>
        </div>
      }
    </section>
  `,
})
export class PointsListPage implements OnInit {
  protected readonly meetingPoints = inject(MeetingPointsService);
  protected readonly pointCreated =
    inject(Router).currentNavigation()?.extras.info === 'meeting-point-created';

  protected readonly search = signal('');
  protected readonly showActive = signal(false);

  private readonly debouncedSearch = toSignal(
    toObservable(this.search).pipe(
      map((term) => term.trim().toLowerCase()),
      distinctUntilChanged(),
      debounceTime(250),
    ),
    { initialValue: '' },
  );

  protected readonly points = computed(() => {
    const search = this.debouncedSearch();
    const showActive = this.showActive();

    return this.meetingPoints
      .points()
      .filter(
        (point) =>
          (!showActive || point.isActive) &&
          (point.name.toLowerCase().includes(search) ||
            point.address.toLowerCase().includes(search)),
      );
  });

  ngOnInit(): void {
    void this.meetingPoints.loadPoints();
  }

  protected onToggleStatus(id: string): void {
    void this.meetingPoints.toggleStatus(id);
  }
}
