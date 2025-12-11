import { createReducer, on } from '@ngrx/store';
import { ISchool } from '../../models/school.model';
import { loadProfile, saveProfile, saveProfileError } from './profile.action';
import { IAuthProfile, IAccount } from '../../../features/auth/models/auth.model';

export interface ProfileState {
  info:
    | (Omit<IAuthProfile, 'accessToken' | 'refreshToken'> & {
        schoolInfo?: ISchool;
      })
    | null;
  accounts: IAccount[];
  error: string | null;
  isLoading: boolean;
}

export const initialState: ProfileState = {
  info: null,
  accounts: [],
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
    info: profile,
    isLoading: false,
  })),
  on(saveProfileError, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  }))
);
