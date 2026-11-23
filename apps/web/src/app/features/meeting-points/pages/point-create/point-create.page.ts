import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, switchMap } from 'rxjs';

import { CEP_NETWORK_ERROR, CEP_NOT_FOUND_ERROR } from '../../models/meeting-point.model';
import { CepService } from '../../services/cep.service';
import { MeetingPointsService } from '../../services/meeting-points.service';

const CEP_PATTERN = /^\d{5}-?\d{3}$/;
const NON_BLANK = Validators.pattern(/\S/);
const ADDRESS_FIELDS = ['street', 'neighborhood', 'cityState'] as const;

@Component({
  selector: 'app-point-create',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="flex max-w-2xl flex-col gap-6">
      <h1 class="text-title font-bold text-text-primary">Novo ponto de encontro</h1>

      <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-5">
        <div class="grid gap-1">
          <label for="point-name" class="font-semibold">Nome do ponto</label>
          <input id="point-name" formControlName="name" required [class]="fieldClass" />
        </div>

        <div class="grid gap-1">
          <label for="point-cep" class="font-semibold">CEP</label>
          <input
            id="point-cep"
            formControlName="cep"
            autocomplete="postal-code"
            inputmode="numeric"
            required
            [class]="fieldClass"
            [attr.aria-invalid]="cepInvalid() || null"
            [attr.aria-describedby]="cepMessage() ? 'point-cep-feedback' : null"
          />
          @if (cepMessage(); as message) {
            <p id="point-cep-feedback" role="alert" class="text-small text-danger">{{ message }}</p>
          }
          @if (lookingUpCep()) {
            <p role="status" class="text-small text-text-secondary">Consultando CEP…</p>
          }
        </div>

        <div class="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div class="grid gap-1">
            <label for="point-street" class="font-semibold">Logradouro</label>
            <input id="point-street" formControlName="street" required [class]="fieldClass" />
          </div>
          <div class="grid gap-1">
            <label for="point-number" class="font-semibold">Número/complemento</label>
            <input id="point-number" formControlName="number" required [class]="fieldClass" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-1">
            <label for="point-neighborhood" class="font-semibold">Bairro</label>
            <input
              id="point-neighborhood"
              formControlName="neighborhood"
              required
              [class]="fieldClass"
            />
          </div>
          <div class="grid gap-1">
            <label for="point-city-state" class="font-semibold">Cidade/UF</label>
            <input
              id="point-city-state"
              formControlName="cityState"
              required
              [class]="fieldClass"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-1">
            <label for="point-latitude" class="font-semibold">Latitude</label>
            <input
              id="point-latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              formControlName="latitude"
              required
              [class]="fieldClass"
              aria-describedby="point-latitude-hint"
            />
            <p id="point-latitude-hint" class="text-small text-text-secondary">De −90 a 90.</p>
          </div>
          <div class="grid gap-1">
            <label for="point-longitude" class="font-semibold">Longitude</label>
            <input
              id="point-longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              formControlName="longitude"
              required
              [class]="fieldClass"
              aria-describedby="point-longitude-hint"
            />
            <p id="point-longitude-hint" class="text-small text-text-secondary">De −180 a 180.</p>
          </div>
        </div>

        @if (saveError(); as error) {
          <p role="alert" class="text-small text-danger">{{ error }}</p>
        }

        <div class="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            [disabled]="cannotSave()"
            class="min-h-12 rounded-control bg-primary px-4 text-small font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ saving() ? 'Salvando…' : 'Salvar ponto de encontro' }}
          </button>
          <a
            routerLink=".."
            class="inline-flex min-h-12 items-center rounded-control px-2 text-small font-semibold text-tertiary underline focus-visible:outline-2 focus-visible:outline-tertiary"
          >
            Cancelar
          </a>
        </div>
      </form>
    </section>
  `,
})
export class PointCreatePage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cepService = inject(CepService);
  private readonly meetingPoints = inject(MeetingPointsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fieldClass =
    'min-h-12 w-full rounded-control border border-border bg-background px-3 text-text-primary focus-visible:outline-2 focus-visible:outline-tertiary';

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, NON_BLANK]],
    cep: ['', [Validators.required, Validators.pattern(CEP_PATTERN)]],
    street: ['', [Validators.required, NON_BLANK]],
    number: ['', [Validators.required, NON_BLANK]],
    neighborhood: ['', [Validators.required, NON_BLANK]],
    cityState: ['', [Validators.required, NON_BLANK]],
    latitude: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(-180), Validators.max(180)]),
  });

  protected readonly lookingUpCep = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  private readonly lookupError = signal<string | null>(null);

  constructor() {
    const controls = this.form.controls;
    const { cep } = controls;
    let lookupCep = '';

    cep.valueChanges
      .pipe(
        switchMap((value) => {
          const nextCep = cep.valid ? this.cepService.cleanCep(value) : '';
          if (nextCep !== lookupCep) {
            for (const field of ADDRESS_FIELDS) {
              const control = controls[field];
              if (control.pristine) {
                control.setValue('', { emitEvent: false });
              }
            }
            lookupCep = nextCep;
          }
          this.lookupError.set(null);
          this.lookingUpCep.set(cep.valid);
          if (cep.invalid) {
            return EMPTY;
          }

          return this.cepService.lookup(lookupCep).pipe(
            catchError((error: unknown) => {
              this.lookupError.set(
                error instanceof Error && error.message === CEP_NOT_FOUND_ERROR
                  ? CEP_NOT_FOUND_ERROR
                  : CEP_NETWORK_ERROR,
              );
              this.lookingUpCep.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ street, neighborhood, city, state }) => {
        const address = {
          street,
          neighborhood,
          cityState: [city, state].filter(Boolean).join('/'),
        };
        for (const field of ADDRESS_FIELDS) {
          const control = controls[field];
          if (control.pristine) {
            control.setValue(address[field], { emitEvent: false });
          }
        }
        this.lookingUpCep.set(false);
      });
  }

  protected cepMessage(): string | null {
    return this.cepInvalid() ? CEP_NOT_FOUND_ERROR : this.lookupError();
  }

  protected cepInvalid(): boolean {
    const { cep } = this.form.controls;
    return (cep.touched && cep.hasError('pattern')) || this.lookupError() === CEP_NOT_FOUND_ERROR;
  }

  protected cannotSave(): boolean {
    return this.form.invalid || this.lookingUpCep() || this.cepInvalid() || this.saving();
  }

  protected async save(): Promise<void> {
    if (this.cannotSave()) {
      return;
    }

    const { name, street, number, neighborhood, cityState, latitude, longitude } =
      this.form.getRawValue();
    if (latitude === null || longitude === null) {
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    try {
      const point = await this.meetingPoints.createPoint({
        name: name.trim(),
        address: `${street.trim()}, ${number.trim()} — ${neighborhood.trim()}, ${cityState.trim()}`,
        latitude,
        longitude,
        isActive: true,
      });

      if (!point) {
        this.saveError.set(this.meetingPoints.error());
      } else if (!this.destroyRef.destroyed) {
        await this.router.navigateByUrl('/pontos-de-encontro', { info: 'meeting-point-created' });
      }
    } finally {
      this.saving.set(false);
    }
  }
}
