import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { StudentService } from '../../services/student';
import { loadProfile, saveProfile, saveProfileError } from './profile.action';

@Injectable()
export class ProfileEffects {
  private readonly actions$ = inject(Actions);
  private readonly studentService = inject(StudentService);

  getProfile$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(loadProfile),
      mergeMap(() =>
        this.studentService.getProfile().pipe(
          map((resp) => {
            if (resp.status) return saveProfile({ profile: resp.data });
            else return saveProfileError({ error: resp.message as unknown as string });
          }),
          catchError((error) => of(saveProfileError({ error: error.message as string })))
        )
      )
    );
  });
}
