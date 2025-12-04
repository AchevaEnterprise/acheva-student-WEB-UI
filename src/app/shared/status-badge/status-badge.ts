import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  imports: [],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  status = input<string>();
  lowercaseStatus = computed(() => this.status()?.toLocaleLowerCase());
}
