import { Component, EventEmitter, Input, Output } from '@angular/core';

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

  onToggleSidebar() {
    this.openSidebar.emit();
  }
}
