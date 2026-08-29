import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  showNotice = false;

  constructor(private router: Router) {}

  goLogin(): void {
    this.router.navigate(['/login']);
  }

  closeNotice(): void {
    this.showNotice = false;
  }

  getStarted(): void {
    this.router.navigate(['/login']);
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}