import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import LoomCard from '@/components/LoomCard';
import { getCurrentShift, getShiftEndDate, formatDurationWithSeconds } from '@/utils/time';
import OverallStatsCard from '@/components/OverallStatsCard';

const RefreshCcwIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M3 20a9 9 0 0 0 18 0"/><path d="M3 12a9 9 0 0 1 18 0"/></svg>
  );

const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const TimerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="12" y1="5" y2="9"/><circle cx="12" cy="14" r="8"/></svg>
);

const PresentationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 3H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/><path d="M7 21h10"/><path d="M12 17v4"/></svg>
);


const Dashboard: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
  const { looms, activeShift, settings, setSettings, openModal } = useAppContext();
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000); // Update every second
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setCurrentTime(Date.now());
  };
  
  const handlePresentationMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'readonly');
    window.open(url.toString(), '_blank');
  };
  
  const efficiencyGoals = Array.from({ length: (90 - 45) / 5 + 1 }, (_, i) => 45 + i * 5);

  if (!activeShift) {
    return (
      <div>
         <div className="text-center mb-4">
            <h1 className="text-5xl font-extrabold text-brand-green drop-shadow-md">{settings.companyName}</h1>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Gerenciamento de Turno</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <p className="text-gray-600">Nenhum turno ativo no momento.</p>
                <button onClick={() => openModal('START_SHIFT')} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition shadow-sm font-semibold">
                    Iniciar Novo Turno
                </button>
            </div>
          </div>
        <div className="flex items-center justify-center h-full mt-10">
            <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Aguardando início do turno.</h2>
            <p className="text-gray-500">Clique em "Iniciar Novo Turno" acima para começar.</p>
            </div>
        </div>
      </div>
    );
  }

  const elapsedTime = activeShift ? currentTime - activeShift.shiftStartTime : 0;
  const currentShiftDetails = activeShift ? getCurrentShift(settings.shifts, new Date(currentTime)) : null;
  let remainingTime = 0;
  if (currentShiftDetails && activeShift) {
      const shiftEndDate = getShiftEndDate(currentShiftDetails, new Date(currentTime));
      const remaining = shiftEndDate.getTime() - currentTime;
      remainingTime = remaining > 0 ? remaining : 0;
  }

  return (
    <div>
        <div className="text-center mb-4">
            <h1 className="text-5xl font-extrabold text-brand-green drop-shadow-md">{settings.companyName}</h1>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Gerenciamento de Turno</h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p>Turno <span className="font-bold text-brand-green">{activeShift.shiftName}</span> está ativo.</p>
                <button onClick={() => openModal('END_SHIFT')} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition shadow-sm font-semibold">
                    Encerrar Turno Atual
                </button>
            </div>
        </div>

        {activeShift ? (
          <>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                     <h2 className="text-2xl font-bold text-gray-800">Dashboard de Produção</h2>
                     <p className="text-gray-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span>Turno: <span className="font-semibold text-brand-green">{activeShift.shiftName}</span></span>
                        <span>Responsável: <span className="font-semibold text-brand-green">{activeShift.responsible}</span></span>
                        <span>Data: <span className="font-semibold text-brand-green">{new Date(activeShift.userStartTime).toLocaleDateString()}</span></span>
                        <span className="flex items-center" title="Tempo decorrido do turno">
                            <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="font-mono font-semibold">{formatDurationWithSeconds(elapsedTime)}</span>
                        </span>
                        <span className="flex items-center" title="Tempo restante no turno">
                            <TimerIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="font-mono font-semibold">{formatDurationWithSeconds(remainingTime)}</span>
                        </span>
                     </p>
                </div>
                {!isReadOnly && (
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
                         <button
                            onClick={handlePresentationMode}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
                            title="Abrir modo de apresentação em nova tela"
                            >
                            <PresentationIcon className="h-5 w-5 mr-2"/>
                            Apresentação
                        </button>
                    </div>
                )}
            </div>
          
            <OverallStatsCard currentTime={currentTime} />
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {looms.map((loom) => (
                <LoomCard key={loom.id} loom={loom} currentTime={currentTime} isReadOnly={isReadOnly} />
                ))}
            </div>
          </>
        ) : null}
    </div>
  );
};

export default Dashboard;
