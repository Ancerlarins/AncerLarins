'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import type { RootState } from '@/store/store';
import { setUser, clearUser } from '@/store/slices/authSlice';
import { useGetMeQuery, useLogoutMutation } from '@/store/api/authApi';
import { isAuthenticated as checkAuth, clearAuthIndicator } from '@/lib/auth';
import type { User } from '@/types';

export function getRoleRedirect(role?: string): string {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return '/admin';
    case 'agent':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

export function useAuth() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [logoutApi] = useLogoutMutation();

  const { refetch: refetchMe } = useGetMeQuery(undefined, {
    skip: !checkAuth(),
  });

  // Tokens are now set as httpOnly cookies by the backend response.
  // The frontend only needs to update Redux state.
  const loginSuccess = useCallback(
    (userData: User) => {
      dispatch(setUser(userData));
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Logout even if API fails
    }
    clearAuthIndicator();
    dispatch(clearUser());
  }, [dispatch, logoutApi]);

  const refreshUser = useCallback(async () => {
    const result = await refetchMe();
    if (result.data?.data) {
      dispatch(setUser(result.data.data));
    }
  }, [dispatch, refetchMe]);

  return {
    user,
    isAuthenticated,
    loginSuccess,
    logout,
    refreshUser,
  };
}
