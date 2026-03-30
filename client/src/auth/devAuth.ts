const DEV_AUTH_KEY = 'dispatch_dev_auth';

export interface DevUser {
  name: string;
  username: string;
}

export const devLogin = (): void => {
  sessionStorage.setItem(DEV_AUTH_KEY, JSON.stringify({ name: 'Dev User', username: 'dev@local' }));
};

export const devLogout = (): void => {
  sessionStorage.removeItem(DEV_AUTH_KEY);
};

export const getDevUser = (): DevUser | null => {
  const raw = sessionStorage.getItem(DEV_AUTH_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as DevUser; } catch { return null; }
};

export const isDevAuthenticated = (): boolean => getDevUser() !== null;
