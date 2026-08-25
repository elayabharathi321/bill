import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  showNotice = true;

  closeNotice(): void {
    this.showNotice = false;
  }

}