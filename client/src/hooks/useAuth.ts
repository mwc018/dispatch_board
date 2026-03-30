import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { getDevUser, isDevAuthenticated, devLogout } from '../auth/devAuth';
import { loginRequest } from '../auth/msalConfig';

export interface AuthUser {
  name: string;
  username: string;
}

export function useAuth() {
  const msalAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const devAuth = isDevAuthenticated();

  const isAuthenticated = msalAuthenticated || devAuth;

  const user: AuthUser | null = msalAuthenticated
    ? { name: accounts[0]?.name ?? 'User', username: accounts[0]?.username ?? '' }
    : getDevUser();

  const logout = () => {
    if (devAuth) {
      devLogout();
      window.location.reload();
    } else {
      instance.logoutPopup();
    }
  };

  const login = async () => {
    await instance.loginPopup(loginRequest);
  };

  return { isAuthenticated, user, login, logout };
}
