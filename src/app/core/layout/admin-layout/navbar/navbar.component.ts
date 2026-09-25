import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  @Input() isSidebarHidden = false;
  @Output() openSidebar = new EventEmitter<void>();
  username: string = '';

  constructor(private router: Router) { }

  ngOnInit(): void {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      this.username = storedUser;
    } else {
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        try {
          const parsed = JSON.parse(sessionUser);
          this.username = parsed.usuario || 'Usuario';
        } catch (e) {
          this.username = 'Usuario';
        }
      } else {
        this.username = 'Usuario';
      }
    }
  }

  onToggleSidebar() {
    this.openSidebar.emit();
  }

  logout() {
    sessionStorage.clear();
    localStorage.removeItem('usuario');
    localStorage.removeItem('tokenB2B');
    this.router.navigate(['/login']);
  }
}
