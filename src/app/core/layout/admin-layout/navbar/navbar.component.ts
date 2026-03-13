import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  @Input() isSidebarHidden = false;
  @Output() openSidebar = new EventEmitter<void>();

  constructor(private router: Router) { }

  onToggleSidebar() {
    this.openSidebar.emit();
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
