import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner-grande',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner-grande.component.html',
  styles: []
})
export class SpinnerGrandeComponent {
  @Input() minHeight: string = '150px';
}
