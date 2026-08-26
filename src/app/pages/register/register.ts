import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  registerData = {
    companyName: '',
    adminName: '',
    email: '',
    mobile: '',
    gstNumber: '',
    password: '',
    confirmPassword: '',
    terms: false
  };

  showPassword = false;
  showConfirmPassword = false;

  register() {

    if (!this.registerData.companyName ||
        !this.registerData.adminName ||
        !this.registerData.email ||
        !this.registerData.mobile ||
        !this.registerData.password ||
        !this.registerData.confirmPassword) {

      alert('Please fill all required fields');
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!this.registerData.terms) {
      alert('Please accept Terms & Conditions');
      return;
    }

    console.log('Registration Data:', this.registerData);

    alert('Please Wait Under Development');
  }
}