import { useState, useEffect } from 'react';
import { resolveUserRole, UserRole } from '../api/client';
import { useAuth } from './useAuth';

export type RoleState =
  | { status: 'loading' }
  | { status: 'resolved'; role: UserRole }
  | { status: 'error' };

export function useRole(): RoleState {
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<RoleState>({ status: 'loading' });

  useEffect(() => {
    if (!isAuthenticated || !user?.username) return;

    // Dev user always gets manager
    if (user.username === 'dev@local') {
      setState({ status: 'resolved', role: { role: 'manager' } });
      return;
    }

    resolveUserRole(user.username)
      .then((role) => setState({ status: 'resolved', role }))
      .catch(() => setState({ status: 'error' }));
  }, [isAuthenticated, user?.username]);

  return state;
}
