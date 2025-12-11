import { Component } from '@angular/core';
import { ResultsList } from './components/results-list/results-list';
import { ResultView } from './components/result-view/result-view';
import { ResultPreview } from './components/result-preview/result-preview';

@Component({
  selector: 'app-results',
  imports: [ResultsList, ResultView, ResultPreview],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results {}
