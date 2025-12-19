import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  imports: [],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  iconSrc = input<string>('images/general/empty-doc.svg');
  description = input<string>('No records exist...');
}
