import { createAction, props } from '@ngrx/store';
import { IAuthProfile } from '../../../features/auth/models/auth.model';

// PROFILE
export const loadProfile = createAction('[Profile] Get user profile');
export const saveProfile = createAction(
  '[Profile] Save user profile successfully',
  props<{ profile: Omit<IAuthProfile, 'accessToken' | 'refreshToken'> }>()
);
export const saveProfileError = createAction(
  '[Profile] Save user profile failed',
  props<{ error: string }>()
);
