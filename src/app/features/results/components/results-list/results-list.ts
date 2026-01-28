import { OverlayModule } from '@angular/cdk/overlay';
import { NgClass } from '@angular/common';
import { Component, inject, OnInit, output, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { LevelsEnum } from '../../../../core/models/school.model';
import { IResultEntry } from '../../../../core/models/student.model';
import { StudentService } from '../../../../core/services/student';
import { Button } from '../../../../shared/form/button/button';
import { Loader } from '../../../../shared/loader/loader';
import { Svg } from '../../../../shared/svg/svg';
import { AuthenticationService } from '../../../auth/services/auth.service';

export interface IResultSessions {
  level: LevelsEnum;
  session: string;
  active: boolean;
  payed: boolean;
  entries: IResultEntry[];
}

@Component({
  selector: 'app-results-list',
  imports: [Svg, NgClass, Loader, Button, OverlayModule],
  templateUrl: './results-list.html',
  styleUrl: './results-list.scss',
})
export class ResultsList implements OnInit {
  private readonly authService = inject(AuthenticationService);
  private readonly studentService = inject(StudentService);
  viewSessionResultEvent = output<IResultSessions>();

  loading = signal(false);
  isOpen = signal(false);

  sessionsList = signal<IResultSessions[]>([
    {
      level: LevelsEnum.YEAR_ONE,
      session: this.authService.activeAccount()!.session!,
      active: false,
      payed: true,
      entries: [],
    },
    {
      level: LevelsEnum.YEAR_TWO,
      session: this.authService.activeAccount()!.session!,
      active: false,
      payed: true,
      entries: [],
    },
    {
      level: LevelsEnum.YEAR_THREE,
      session: this.authService.activeAccount()!.session!,
      active: false,
      payed: true,
      entries: [],
    },
    {
      level: LevelsEnum.YEAR_FOUR,
      session: this.authService.activeAccount()!.session!,
      active: false,
      payed: true,
      entries: [],
    },
    {
      level: LevelsEnum.YEAR_FIVE,
      session: this.authService.activeAccount()!.session!,
      active: false,
      payed: true,
      entries: [],
    },
    {
      level: LevelsEnum.YEAR_SIX,
      session: this.authService.activeAccount()!.session!,
      active: false,
      payed: true,
      entries: [],
    },
    {
      level: LevelsEnum.REFERENCE,
      session: this.authService.activeAccount()!.session!,
      active: false,
      payed: true,
      entries: [],
    },
    {
      level: LevelsEnum.UNREGISTERED,
      session: this.authService.activeAccount()!.session!,
      active: false,
      payed: true,
      entries: [],
    },
  ]);

  viewSessionResult(session: IResultSessions) {
    if (!session.payed) {
      this.isOpen.set(true);
      return;
    }

    if (!session.active) return;

    this.viewSessionResultEvent.emit(session);
  }

  ngOnInit(): void {
    this.getResultBySessions();
  }

  getResultBySessions() {
    this.loading.set(true);
    this.studentService
      .getResultsBySessions()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resp) => {
          this.sessionsList.update((sessionsList: IResultSessions[]) => {
            for (const session of sessionsList) {
              for (const sesionResp of resp.data) {
                if (sesionResp.level === session.level) {
                  session.session = sesionResp.session;
                  session.entries = sesionResp.entries;
                  session.active = true;
                }
              }
            }
            return sessionsList;
          });
        },
      });
  }

  cancelOverlay() {
    this.isOpen.set(false);
  }
}
