import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Privacy } from './pages/privacy/privacy';
import { Terms } from './pages/terms/terms';
import { Contact } from './pages/contact/contact';
import { About } from './pages/about/about';
import { ForgotPassword } from './pages/forgot-password/forgot-password';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'register',
    component: Register
  },

  {
    path: 'privacy',
    component: Privacy
  },

  {
    path: 'terms',
    component: Terms
  },

  {
    path: 'contact',
    component: Contact
  },

  {
    path: 'about',
    component: About
  },

  {
    path: 'forgot-password',
    component: ForgotPassword
  },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard')
        .then(m => m.Dashboard)
  },

  {
    path: '**',
    redirectTo: ''
  }
];