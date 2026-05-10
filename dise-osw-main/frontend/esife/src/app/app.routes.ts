import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./component-espectaculo/component-espectaculo').then(m => m.ComponentEspectaculo)
    },

    {
        path: 'espectaculo',
        loadComponent: () => import('./component-espectaculo/component-espectaculo').then(m => m.ComponentEspectaculo)
    },
    {
        path: 'compra',
        loadComponent: () => import('./component-compra/component-compra').then(m => m.ComponentCompra)
    },
    {
        path: 'entradas',
        loadComponent: () => import('./component-entradas/component-entradas')
            .then(m => m.ComponentEntradas)
    },
    {
  path: 'reset-password',
  loadComponent: () => import('./component-reset-password/component-reset-password')
    .then(m => m.ComponentResetPassword)
}

];
