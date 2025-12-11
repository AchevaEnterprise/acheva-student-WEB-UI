import { Component } from '@angular/core';
import { StatusBadge } from '../../../../shared/status-badge/status-badge';

@Component({
  selector: 'app-result-view',
  imports: [StatusBadge],
  templateUrl: './result-view.html',
  styleUrl: './result-view.scss',
})
export class ResultView {}
