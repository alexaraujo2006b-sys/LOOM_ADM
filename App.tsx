import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import History from './components/History';
import { AppView } from './types';
import ModalManager from './components/ModalManager';
import Operators from './components/Operators';
import Products from './components/Products';
import LoomDetailsModal from './components/LoomDetailsModal'; // Import the new modal
import Graphs from './components/Graphs';
import Reports from './components/Reports';
import EditData from './components/EditData';
import ParetoAnalysis from './components/ParetoAnalysis';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard />;
      case AppView.HISTORY:
        return <History />;
      case AppView.SETTINGS:
        return <Settings />;
      case AppView.OPERATORS:
        return <Operators />;
      case AppView.PRODUCTS:
        return <Products />;
      case AppView.GRAPHS:
        return <Graphs />;
      case AppView.REPORTS:
        return <Reports />;
      case AppView.EDIT_DATA:
        return <EditData />;
      case AppView.PARETO_ANALYSIS:
        return <ParetoAnalysis />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {renderView()}
        </div>
      </main>
      <ModalManager />
    </div>
  );
};

export default App;