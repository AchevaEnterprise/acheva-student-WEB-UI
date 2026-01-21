import { createReducer, on } from '@ngrx/store';
import { IStudentProfile } from '../../models/student.model';
import { loadProfile, saveProfile, saveProfileError } from './profile.action';

export interface ProfileState {
  profile: IStudentProfile | null;
  error: string | null;
  isLoading: boolean;
}

export const initialState: ProfileState = {
  profile: null,
  error: null,
  isLoading: false,
};

export const profileReducer = createReducer(
  initialState,

  // PROFILE
  on(loadProfile, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(saveProfile, (state, { profile }) => ({
    ...state,
    profile,
    isLoading: false,
  })),
  on(saveProfileError, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  }))
);
