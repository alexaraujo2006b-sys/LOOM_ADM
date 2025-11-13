import React from 'react';
import { AppView } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
}
const GaugeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/><path d="M16 12h.01"/></svg>
);
const HistoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);
const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.23l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.23l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const PackageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z"/><path d="M12 15.6a1.5 1.5 0 0 0-1.5 1.5c0 .8.6 1.5 1.5 1.5s1.5-.7 1.5-1.5c0-.8-.7-1.5-1.5-1.5z"/><path d="M18 12.3c-.9-.3-1.9-.3-2.8 0l-1.9.7c-1.3.5-2.6.5-3.9 0l-1.9-.7c-.9-.3-1.9-.3-2.8 0L3 13.5V9l1.4-.5c.9-.3 1.9-.3 2.8 0l1.9.7c1.3.5 2.6.5 3.9 0l1.9-.7c.9-.3 1.9-.3 2.8 0L21 9v4.5l-1.8-1.2z"/><path d="m12 21 1.8-1.2c.9-.6 1.5-1.5 1.5-2.6V15c0-1.1.9-2 2-2h1.5"/><path d="m12 21-1.8-1.2c-.9-.6-1.5-1.5-1.5-2.6V15c0-1.1-.9-2-2-2H5.2"/></svg>
);
const BarChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
);
const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
);
const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
);
const ParetoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8 18v-4"/><path d="M12 18v-8"/><path d="M16 18v-1"/><path d="M20 18v-6"/><path d="M3 3v18h18"/><path d="m3 9 5.5-5.5"/><path d="M8.5 3.5 16 11l4 1"/></svg>
);


const NavItem: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-200 ${isActive ? 'bg-brand-accent text-brand-green' : 'text-white hover:bg-brand-light-green'}`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const ControlButton: React.FC<{ label: string, onClick: () => void, disabled?: boolean }> = ({ label, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left px-4 py-2 text-sm font-medium text-gray-300 hover:bg-brand-light-green hover:text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { openModal, activeShift, exportActiveShiftToExcel } = useAppContext();
  
  return (
    <div className="flex flex-col w-64 bg-brand-green text-white">
      <div className="flex items-center justify-center h-20 border-b border-brand-light-green">
        <h1 className="text-2xl font-bold">Teares</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-4">
          <NavItem icon={<GaugeIcon className="h-5 w-5" />} label="Dashboard" isActive={currentView === AppView.DASHBOARD} onClick={() => setCurrentView(AppView.DASHBOARD)} />
          <NavItem icon={<BarChartIcon className="h-5 w-5" />} label="Gráficos" isActive={currentView === AppView.GRAPHS} onClick={() => setCurrentView(AppView.GRAPHS)} />
          <NavItem icon={<ParetoIcon className="h-5 w-5" />} label="Análise Pareto" isActive={currentView === AppView.PARETO_ANALYSIS} onClick={() => setCurrentView(AppView.PARETO_ANALYSIS)} />
          <NavItem icon={<FileTextIcon className="h-5 w-5" />} label="Relatórios" isActive={currentView === AppView.REPORTS} onClick={() => setCurrentView(AppView.REPORTS)} />
          <NavItem icon={<HistoryIcon className="h-5 w-5" />} label="Histórico" isActive={currentView === AppView.HISTORY} onClick={() => setCurrentView(AppView.HISTORY)} />
          <NavItem icon={<PackageIcon className="h-5 w-5" />} label="Produtos" isActive={currentView === AppView.PRODUCTS} onClick={() => setCurrentView(AppView.PRODUCTS)} />
          <NavItem icon={<UsersIcon className="h-5 w-5" />} label="Operadores" isActive={currentView === AppView.OPERATORS} onClick={() => setCurrentView(AppView.OPERATORS)} />
          <NavItem icon={<SettingsIcon className="h-5 w-5" />} label="Configurações" isActive={currentView === AppView.SETTINGS} onClick={() => setCurrentView(AppView.SETTINGS)} />
        </nav>
        <div className="p-4 mt-4">
          <h2 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Controles</h2>
          <div className="mt-2 space-y-1">
            <ControlButton label="Lançar Produção" onClick={() => openModal('LOG_PRODUCTION')} disabled={!activeShift} />
            <ControlButton label="Editar Lançamentos" onClick={() => setCurrentView(AppView.EDIT_DATA)} disabled={!activeShift} />
            <ControlButton label="Parada Manutenção" onClick={() => openModal('MANAGE_MAINTENANCE')} disabled={!activeShift} />
            <ControlButton label="Parada Operacional" onClick={() => openModal('MANAGE_INTERVENTION')} disabled={!activeShift} />
            <ControlButton label="Exportar Turno (Excel)" onClick={exportActiveShiftToExcel} disabled={!activeShift} />
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-brand-light-green">
        <p className="text-xs text-gray-400">© 2025 Gestão da produção Pracafé</p>
      </div>
    </div>
  );
};

export default Sidebar;