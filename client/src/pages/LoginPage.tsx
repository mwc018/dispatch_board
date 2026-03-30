import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { devLogin } from '../auth/devAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDev = import.meta.env.DEV;

  const handleMsalLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      if (!msg.includes('user_cancelled')) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = () => {
    devLogin();
    window.location.reload();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#3b82f6" />
            <rect x="8" y="10" width="10" height="4" rx="2" fill="white" />
            <rect x="8" y="18" width="10" height="4" rx="2" fill="white" fillOpacity="0.7" />
            <rect x="8" y="26" width="10" height="4" rx="2" fill="white" fillOpacity="0.4" />
            <rect x="22" y="10" width="10" height="4" rx="2" fill="white" fillOpacity="0.4" />
            <rect x="22" y="18" width="10" height="4" rx="2" fill="white" />
            <rect x="22" y="26" width="10" height="4" rx="2" fill="white" fillOpacity="0.7" />
          </svg>
        </div>

        <h1 className="login-card__title">Dispatch Board</h1>
        <p className="login-card__subtitle">Sign in to access the dispatch board</p>

        {error && <div className="login-card__error">{error}</div>}

        <button
          className="btn btn--msal"
          onClick={handleMsalLogin}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          {loading ? 'Signing in...' : 'Sign in with Microsoft'}
        </button>

        {isDev && (
          <div className="login-card__dev">
            <div className="login-card__divider">
              <span>development only</span>
            </div>
            <button className="btn btn--dev" onClick={handleDevLogin}>
              Dev Login (bypass auth)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
