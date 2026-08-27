import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {

  sidebarOpen = false;

  stats: any[] = [];

  recentInvoices: any[] = [];

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}