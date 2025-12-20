import { Component, input } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { IResultEntry } from '../../../../core/models/student.model';

@Component({
  selector: 'app-result-preview',
  imports: [MatDivider],
  templateUrl: './result-preview.html',
  styleUrl: './result-preview.scss',
})
export class ResultPreview {
  resultEntries = input<IResultEntry[]>([]);
}
