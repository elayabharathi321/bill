import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email: string = '';
  password: string = '';

  showPassword: boolean = false;
  rememberMe: boolean = false;

  constructor(private router: Router) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {

    if (!this.email || !this.password) {
      alert('Please enter email and password.');
      return;
    }

    console.log('Email:', this.email);
    console.log('Password:', this.password);
    console.log('Remember:', this.rememberMe);

    // Later connect Spring Boot API here.

    // Example:
    // this.router.navigate(['/dashboard']);

  }
}