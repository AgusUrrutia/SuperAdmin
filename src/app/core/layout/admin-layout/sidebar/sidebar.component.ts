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

  isSgsActive(): boolean {
    return this.router.url.includes('/sgs');
  }

  isB2bActive(): boolean {
    return this.router.url.includes('/b2b');
  }

  isAdActive(): boolean {
    return this.router.url.includes('/ad');
  }
}
