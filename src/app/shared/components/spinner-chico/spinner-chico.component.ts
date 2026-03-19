import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner-chico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner-chico.component.html',
  styles: []
})
export class SpinnerChicoComponent {
  @Input() minHeight: string = 'auto';
}
