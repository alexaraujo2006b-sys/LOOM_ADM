
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import LoomCard from './LoomCard';
import { getCurrentShift } from '../utils/time';

const RefreshCcwIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M3 20a9 9 0 0 0 18 0"/><path d="M3 12a9 9 0 0 1 18 0"/></svg>
  );

const Dashboard: React.FC = () => {
  const { looms, activeShift, settings, setSettings } = useAppContext();
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setCurrentTime(Date.now());
  };
  
  const currentShiftDetails = getCurrentShift(settings.shifts, new Date(currentTime));
  const efficiencyGoals = [80, 85, 90, 95, 100];


  if (!activeShift) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Nenhum turno ativo.</h2>
          <p className="text-gray-500">Por favor, inicie um novo turno para começar o monitoramento.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
                 <h1 className="text-3xl font-bold text-gray-800">Dashboard de Produção</h1>
                 <p className="text-gray-500">
                    Turno: <span className="font-semibold text-brand-green">{activeShift.shiftName}</span> | 
                    Responsável: <span className="font-semibold text-brand-green">{activeShift.responsible}</span> | 
                    Data: <span className="font-semibold text-brand-green">{new Date(activeShift.userStartTime).toLocaleDateString()}</span>
                 </p>
            </div>
            <div className="flex items-center gap-4">
                <div>
                    <label htmlFor="efficiency-goal-select" className="text-sm font-medium text-gray-700 mr-2">Meta Global:</label>
                    <select
                        id="efficiency-goal-select"
                        value={settings.efficiencyGoal}
                        onChange={(e) => setSettings(prev => ({...prev, efficiencyGoal: Number(e.target.value)}))}
                        className="p-2 border border-gray-300 rounded-md shadow-sm bg-white"
                    >
                        {efficiencyGoals.map(goal => (
                            <option key={goal} value={goal}>{goal}%</option>
                        ))}
                    </select>
                </div>
                 <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-brand-green text-white rounded-lg shadow hover:bg-brand-light-green transition-colors"
                    >
                    <RefreshCcwIcon className="h-5 w-5 mr-2"/>
                    Atualizar
                </button>
            </div>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {looms.map((loom) => (
          <LoomCard key={loom.id} loom={loom} currentTime={currentTime} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;