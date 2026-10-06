import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AppsMenuItem, AppsMenuService } from '../../../services/apps-menu.service';

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

  // Apps del menu de la grilla; salen solo de ek-apps-menu
  apps: AppsMenuItem[] = [];

  constructor(private router: Router, private appsMenuService: AppsMenuService) { }

  ngOnInit(): void {
    this.appsMenuService.apps$.subscribe(apps => this.apps = apps);
    this.appsMenuService.recargar();
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
