import { Routes } from '@angular/router';

// Remaining wallet routes (/pagamento, /pix, /cartao, /aprovado, /falha) arrive in tasks 6-9.
export const WALLET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/wallet-overview/wallet-overview.page').then(
        (module) => module.WalletOverviewPage,
      ),
  },
  {
    path: 'comprar',
    loadComponent: () =>
      import('./pages/buy-tokens/buy-tokens.page').then((module) => module.BuyTokensPage),
  },
  {
    path: 'pagamento',
    loadComponent: () =>
      import('./pages/payment-method/payment-method.page').then(
        (module) => module.PaymentMethodPage,
      ),
  },
  {
    path: 'pix',
    loadComponent: () =>
      import('./pages/pix-payment/pix-payment.page').then((module) => module.PixPaymentPage),
  },
];
