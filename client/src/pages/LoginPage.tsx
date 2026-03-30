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
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-5">
      <div className="bg-[#1a1d27] border border-[#2a2f45] rounded-xl shadow-2xl p-10 w-full max-w-sm flex flex-col items-center gap-3">
        <div className="mb-1">
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

        <h1 className="text-[22px] font-bold text-slate-200 tracking-tight">Dispatch Board</h1>
        <p className="text-[13px] text-slate-500 mb-2">Sign in to access the dispatch board</p>

        {error && (
          <div className="w-full bg-red-500/15 border border-red-500 text-red-400 rounded px-3 py-2 text-[13px]">
            {error}
          </div>
        )}

        <button
          className="w-full flex items-center justify-center gap-2.5 px-4 py-[11px] text-[14px] font-semibold bg-[#21253a] text-slate-200 border border-[#2a2f45] rounded cursor-pointer transition-colors hover:bg-[#2a2f45] hover:border-[#3a4060] disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="w-full flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 text-slate-500 text-[11px] uppercase tracking-[0.06em]">
              <span className="flex-1 h-px bg-[#2a2f45]" />
              <span>development only</span>
              <span className="flex-1 h-px bg-[#2a2f45]" />
            </div>
            <button
              className="w-full flex items-center justify-center px-4 py-[9px] text-[13px] bg-transparent text-slate-500 border border-dashed border-[#2a2f45] rounded cursor-pointer transition-colors hover:bg-[#21253a] hover:text-slate-400 hover:border-[#3a4060]"
              onClick={handleDevLogin}
            >
              Dev Login (bypass auth)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
