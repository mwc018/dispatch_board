import React from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './auth/msalConfig';
import { useAuth } from './hooks/useAuth';
import { useRole } from './hooks/useRole';
import ManagerBoard from './pages/ManagerBoard';
import TechView from './pages/TechView';
import LoginPage from './pages/LoginPage';

const msalInstance = new PublicClientApplication(msalConfig);

function AppContent() {
  const { isAuthenticated, logout } = useAuth();
  const roleState = useRole();

  if (!isAuthenticated) return <LoginPage />;

  if (roleState.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1117] text-slate-500 text-[15px]">
        Loading...
      </div>
    );
  }

  if (roleState.status === 'error') {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1117]">
        <div className="text-center">
          <p className="text-red-400 text-[15px] mb-4">Failed to load user permissions.</p>
          <button className="text-slate-500 text-sm underline" onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  }

  const { role } = roleState;

  if (role.role === 'denied') {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1117]">
        <div className="bg-[#1a1d27] border border-[#2a2f45] rounded-xl p-10 max-w-sm w-full text-center flex flex-col gap-4">
          <div className="text-4xl">🚫</div>
          <h1 className="text-[18px] font-bold text-slate-200">Access Denied</h1>
          <p className="text-[13px] text-slate-500">
            Your account is not authorized to access the dispatch board.
            Contact your administrator to be added.
          </p>
          <button
            className="inline-flex items-center justify-center px-3 py-1.5 bg-[#21253a] border border-[#2a2f45] text-slate-400 hover:bg-[#2a2f45] rounded text-sm cursor-pointer transition-colors"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (role.role === 'tech') {
    return <TechView techId={String(role.techId)} />;
  }

  return <ManagerBoard />;
}

export default function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  );
}
