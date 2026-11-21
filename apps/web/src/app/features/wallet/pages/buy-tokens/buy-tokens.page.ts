import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  formatBrlFromCents,
  MAX_TOKENS_PER_ORDER,
  MIN_TOKENS_PER_ORDER,
  TOKEN_PACKAGES,
  TOKEN_UNIT_PRICE_CENTS,
  tokensToAmountCents,
} from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';

type QuantityErrorKey = 'required' | 'min' | 'max' | 'decimal' | 'text';

const QUANTITY_MESSAGES: Record<QuantityErrorKey, string> = {
  required: 'Escolha um pacote ou informe uma quantidade.',
  min: `A quantidade mínima é ${MIN_TOKENS_PER_ORDER} ficha.`,
  max: `A quantidade máxima por pedido é ${MAX_TOKENS_PER_ORDER} fichas.`,
  decimal: 'Informe um número inteiro, sem vírgula ou ponto.',
  text: 'Digite apenas números.',
};

const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?(\d+[.,]\d*|[.,]\d+)$/;

/** Classifies the raw text of the custom field; Validators.min/max alone would miss decimals and text. */
function quantityError(raw: string): QuantityErrorKey | null {
  const value = raw.trim();

  if (value === '') {
    return 'required';
  }
  if (INTEGER_PATTERN.test(value)) {
    const tokensCount = Number(value);
    if (tokensCount < MIN_TOKENS_PER_ORDER) {
      return 'min';
    }
    return tokensCount > MAX_TOKENS_PER_ORDER ? 'max' : null;
  }
  return DECIMAL_PATTERN.test(value) ? 'decimal' : 'text';
}

const quantityValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const key = quantityError(String(control.value ?? ''));
  return key ? { [key]: true } : null;
};

@Component({
  selector: 'app-buy-tokens',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './buy-tokens.page.html',
})
export class BuyTokensPage implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);

  readonly wallet = this.walletService.wallet;
  readonly loading = this.walletService.loading;
  readonly isAccountBlocked = this.walletService.isAccountBlocked;
  readonly accountBlockMessage = this.walletService.accountBlockMessage;

  readonly packages = TOKEN_PACKAGES;
  readonly unitPriceLabel = formatBrlFromCents(TOKEN_UNIT_PRICE_CENTS);

  readonly customControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [quantityValidator],
  });
  readonly form = new FormGroup({ quantity: this.customControl });

  private readonly selectedPackage = signal<number | null>(null);
  private readonly customTouched = signal(false);
  private readonly customValue = toSignal(this.customControl.valueChanges, { initialValue: '' });

  private readonly customError = computed<QuantityErrorKey | null>(() =>
    quantityError(this.customValue()),
  );

  /** The single active choice: a fixed package or a valid custom quantity. */
  readonly tokensCount = computed<number | null>(() => {
    const selected = this.selectedPackage();
    if (selected !== null) {
      return selected;
    }
    return this.customError() === null ? Number(this.customValue().trim()) : null;
  });

  readonly totalCents = computed<number | null>(() => {
    const tokensCount = this.tokensCount();
    return tokensCount === null ? null : tokensToAmountCents(tokensCount);
  });

  readonly errorMessage = computed<string | null>(() => {
    const key = this.customError();
    if (this.selectedPackage() !== null || key === null) {
      return null;
    }
    const interacted = this.customTouched() || this.customValue() !== '';
    return interacted ? QUANTITY_MESSAGES[key] : null;
  });

  readonly showHint = computed<boolean>(() => this.tokensCount() === null && !this.errorMessage());

  readonly hintMessage = QUANTITY_MESSAGES.required;

  readonly canAdvance = computed<boolean>(
    () => this.tokensCount() !== null && !this.isAccountBlocked() && !this.loading(),
  );

  constructor() {
    effect(() => {
      if (this.isAccountBlocked()) {
        this.customControl.disable({ emitEvent: false });
      } else {
        this.customControl.enable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    void this.walletService.loadWalletData();
  }

  isSelected(tokensCount: number): boolean {
    return this.selectedPackage() === tokensCount;
  }

  selectPackage(tokensCount: number): void {
    if (this.isAccountBlocked()) {
      return;
    }
    this.customControl.setValue('');
    this.customTouched.set(false);
    this.selectedPackage.set(tokensCount);
  }

  onCustomInput(): void {
    this.selectedPackage.set(null);
    this.customTouched.set(true);
  }

  onCustomBlur(): void {
    this.customTouched.set(true);
  }

  advance(): void {
    const tokensCount = this.tokensCount();
    if (tokensCount === null || !this.canAdvance()) {
      return;
    }

    this.walletService.setDraftTokensCount(tokensCount);
    // TODO #2: /cofrinho/pagamento is created in task 6.
    void this.router.navigate(['/cofrinho/pagamento']);
  }

  formatBrl(amountCents: number): string {
    return formatBrlFromCents(amountCents);
  }

  totalFor(tokensCount: number): number {
    return tokensToAmountCents(tokensCount);
  }

  tokensLabel(tokensCount: number): string {
    return `${tokensCount} ${tokensCount === 1 ? 'ficha' : 'fichas'}`;
  }

  packageClasses(tokensCount: number): string {
    return this.isSelected(tokensCount)
      ? 'border-tertiary bg-tertiary text-on-tertiary'
      : 'border-border bg-background text-text-primary';
  }
}
