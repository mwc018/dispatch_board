import React from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './auth/msalConfig';
import { useAuth } from './hooks/useAuth';
import ManagerBoard from './pages/ManagerBoard';
import TechView from './pages/TechView';
import LoginPage from './pages/LoginPage';
import './styles.css';

const msalInstance = new PublicClientApplication(msalConfig);

function AppContent() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view') || 'manager';
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <LoginPage />;
  if (view === 'tech') return <TechView />;
  return <ManagerBoard />;
}

export default function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  );
}
