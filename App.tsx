// Fix: Corrected import syntax for useState.
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import History from './components/History';
import { AppView } from './types';
import ModalManager from './components/ModalManager';
import Operators from './components/Operators';
import Products from './components/Products';
import Graphs from './components/Graphs';
import Reports from './components/Reports';
import EditData from './components/EditData';
import ParetoAnalysis from './components/ParetoAnalysis';
import Quality from './components/Quality';
import EditITHData from './components/EditITHData';
import ITHReport from './components/ITHReport';
import OperatorView from './components/OperatorView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  // Check for view mode from URL
  const urlParams = new URLSearchParams(window.location.search);
  const viewMode = urlParams.get('view');

  const renderMainView = () => {
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
      case AppView.EDIT_ITH_DATA:
        return <EditITHData />;
      case AppView.ITH_REPORT:
        return <ITHReport />;
      case AppView.PARETO_ANALYSIS:
        return <ParetoAnalysis />;
      case AppView.QUALITY:
        return <Quality />;
      default:
        return <Dashboard />;
    }
  };
  
  const renderSpecialView = () => {
    if (viewMode === 'readonly') {
        return <Dashboard isReadOnly={true} />;
    }
    if (viewMode === 'operator') {
        return <OperatorView />;
    }
    return null;
  };

  const specialView = renderSpecialView();

  if (specialView) {
    return (
      <div className="h-screen bg-gray-50 text-gray-800">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {specialView}
          </div>
        </main>
        <ModalManager />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {renderMainView()}
        </div>
      </main>
      <ModalManager />
    </div>
  );
};

export default App;