import React from 'react';
import ManagerBoard from './pages/ManagerBoard';
import TechView from './pages/TechView';
import './styles.css';

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view') || 'manager';

  if (view === 'tech') {
    return <TechView />;
  }

  return <ManagerBoard />;
}
