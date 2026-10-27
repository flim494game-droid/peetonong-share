import { Routes } from '@angular/router';
import { WantedComponent } from './components/wanted/wanted';
import { AdminComponent } from './components/admin/admin';

export const routes: Routes = [
  { path: 'wanted', component: WantedComponent },
  { path: 'admin', component: AdminComponent },
  { path: '', redirectTo: '/wanted', pathMatch: 'full' }
];