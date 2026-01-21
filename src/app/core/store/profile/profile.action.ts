import { createAction, props } from '@ngrx/store';
import { IStudentProfile } from '../../models/student.model';

// PROFILE
export const loadProfile = createAction('[Profile] Get user profile');
export const saveProfile = createAction(
  '[Profile] Save user profile successfully',
  props<{ profile: IStudentProfile }>()
);
export const saveProfileError = createAction(
  '[Profile] Save user profile failed',
  props<{ error: string }>()
);
