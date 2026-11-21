import { Routes } from '@angular/router';

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
  {
    path: 'cartao',
    loadComponent: () =>
      import('./pages/card-payment/card-payment.page').then((module) => module.CardPaymentPage),
  },
  {
    path: 'aprovado',
    loadComponent: () =>
      import('./pages/payment-approved/payment-approved.page').then(
        (module) => module.PaymentApprovedPage,
      ),
  },
  {
    path: 'falha',
    loadComponent: () =>
      import('./pages/payment-failed/payment-failed.page').then(
        (module) => module.PaymentFailedPage,
      ),
  },
];
