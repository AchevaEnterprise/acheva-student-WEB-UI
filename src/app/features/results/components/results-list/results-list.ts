import { Component, input, output } from '@angular/core';
import { IResult } from '../../../../core/models/student.model';
import { Svg } from '../../../../shared/svg/svg';

@Component({
  selector: 'app-results-list',
  imports: [Svg],
  templateUrl: './results-list.html',
  styleUrl: './results-list.scss',
})
export class ResultsList {
  results = input<IResult[]>([]);
  viewResultEvent = output<IResult>();

  viewResult(result: IResult) {
    this.viewResultEvent.emit(result);
  }
}
