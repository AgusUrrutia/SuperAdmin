import { Component, EventEmitter, Output } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Output() closeSidebar = new EventEmitter<void>();

  constructor(private router: Router) {}

  onClose() {
    this.closeSidebar.emit();
  }

  private isSectionActive(section: string): boolean {
    return this.router.url === `/${section}` || this.router.url.startsWith(`/${section}/`);
  }

  isSgsActive(): boolean {
    return this.isSectionActive('sgs');
  }

  isB2bActive(): boolean {
    return this.isSectionActive('b2b');
  }

  isAdActive(): boolean {
    return this.isSectionActive('ad');
  }

  isAplicacionesActive(): boolean {
    return this.isSectionActive('aplicaciones');
  }

  isLogsActive(): boolean {
    return this.isSectionActive('logs');
  }
}
