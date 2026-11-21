import { Routes } from '@angular/router';

// Remaining wallet routes (/comprar, /pagamento, /pix, /cartao, /aprovado, /falha) arrive in tasks 5-9.
export const WALLET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/wallet-overview/wallet-overview.page').then(
        (module) => module.WalletOverviewPage,
      ),
  },
];
