import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { IAuthProfile } from '../../../features/auth/models/auth.model';
import { AuthenticationService } from '../../../features/auth/services/auth.service';
import { loadProfile, saveProfile, saveProfileError } from './profile.action';

@Injectable()
export class ProfileEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(AuthenticationService);

  getProfile$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(loadProfile),
      mergeMap(() =>
        this.authService.getProfile().pipe(
          map((resp) => {
            if (resp.status) return saveProfile({ profile: resp.data as unknown as IAuthProfile });
            else return saveProfileError({ error: resp.message as unknown as string });
          }),
          catchError((error) => of(saveProfileError({ error: error.message as string })))
        )
      )
    );
  });
}
