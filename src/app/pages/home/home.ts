import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  showNotice = true;

  constructor(private router: Router) {}

  closeNotice(): void {
    this.showNotice = false;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

}