import { NgClass } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
import { LevelsEnum } from '../../../../core/models/school.model';
import { Svg } from '../../../../shared/svg/svg';
import { AuthenticationService } from '../../../auth/services/auth.service';

export interface IResultSessions {
  level: LevelsEnum;
  session: string;
  active: boolean;
  payed: boolean;
}

@Component({
  selector: 'app-results-list',
  imports: [Svg, NgClass],
  templateUrl: './results-list.html',
  styleUrl: './results-list.scss',
})
export class ResultsList {
  private readonly authService = inject(AuthenticationService);
  viewSessionResultEvent = output<IResultSessions>();

  sessionsList = signal<IResultSessions[]>([
    {
      level: LevelsEnum.YEAR_ONE,
      session: this.authService.activeAccount()!.session!,
      active: true,
      payed: true,
    },
    {
      level: LevelsEnum.YEAR_TWO,
      session: this.authService.activeAccount()!.session!,
      active: true,
      payed: false,
    },
    {
      level: LevelsEnum.YEAR_THREE,
      session: this.authService.activeAccount()!.session!,
      active: true,
      payed: false,
    },
    {
      level: LevelsEnum.YEAR_FOUR,
      session: this.authService.activeAccount()!.session!,
      active: false,
      payed: false,
    },
    {
      level: LevelsEnum.YEAR_FIVE,
      session: this.authService.activeAccount()!.session!,
      active: false,
      payed: false,
    },
    {
      level: LevelsEnum.YEAR_SIX,
      session: this.authService.activeAccount()!.session!,
      active: false,
      payed: false,
    },
  ]);

  viewSessionResult(session: IResultSessions) {
    if (!session.payed) return;
    this.viewSessionResultEvent.emit(session);
  }
}
