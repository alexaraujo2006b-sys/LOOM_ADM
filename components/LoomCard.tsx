import React, { useState, useMemo } from 'react';
import { Loom } from '../types';
import { useAppContext } from '../context/AppContext';
import { formatDuration } from '../utils/time';
import HourlyProductionChart from './charts/HourlyProductionChart';
import EfficiencyGauge from './charts/EfficiencyGauge';

interface LoomCardProps {
  loom: Loom;
  currentTime: number;
}

const DropletsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.48-2.26-1.3-3.11-1.44-1.55-4.3-1.1-4.3-1.1s-.26 2.76-1.1 4.3c-.82.85-1.3 1.95-1.3 3.11C3 14.47 4.8 16.3 7 16.3z"/><path d="M12.83 21.16a1 1 0 0 0 1.28-1.28 4.02 4.02 0 0 0-4.03-4.03 1 1 0 1 0-1.28 1.28 6.03 6.03 0 0 1 4.03 4.03z"/><path d="M19.66 12.34a1 1 0 1 0-1.32-1.32 3 3 0 0 0-3-3 1 1 0 1 0-1.32 1.32 5 5 0 0 1 5.64 3z"/></svg>
);
const SpeedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
);
const WrenchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);
const UserCheck: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
);
const BarChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
);


const LoomCard: React.FC<LoomCardProps> = ({ loom, currentTime }) => {
  const { settings, activeShift, operators, products, openModal } = useAppContext();
  const [showGraph, setShowGraph] = useState(false);

  if (!activeShift) return null;
  
  const product = products.find(p => p.id === loom.productId);
  const operatorId = loom.operatorIds[activeShift.shiftName];
  const operator = operators.find(o => o.id === operatorId);
  const hourlyGoal = product?.hourlyProductionGoal || settings.hourlyProductionGoal;
  
  const productionEntries = activeShift.production.filter(p => p.loomId === loom.id).sort((a,b) => a.timestamp - b.timestamp);
  const lastProductionEntry = productionEntries.length > 0 ? productionEntries[productionEntries.length - 1] : null;

  // Use last entry time for calculation if available, otherwise use shift start time for elapsed time
  const calculationTime = lastProductionEntry ? lastProductionEntry.timestamp : activeShift.shiftStartTime;
  
  const shiftStart = activeShift.shiftStartTime;
  const elapsedMillis = calculationTime - shiftStart;
  const elapsedHours = elapsedMillis > 0 ? elapsedMillis / (1000 * 60 * 60) : 0;
  
  const currentProduction = useMemo(() => {
    if (productionEntries.length < 2) return 0;
    const firstReading = productionEntries[0].reading;
    const lastReading = productionEntries[productionEntries.length - 1].reading;
    return Math.max(0, lastReading - firstReading);
  }, [productionEntries]);
  
  const maintenanceStops = activeShift.maintenance.filter(m => m.loomId === loom.id);
  const operationalStops = activeShift.interventions.filter(i => i.loomId === loom.id);
  const allStops = [...maintenanceStops, ...operationalStops];

  const totalDowntimeMillis = allStops.reduce((sum, stop) => {
    const end = stop.end ?? calculationTime;
    const start = stop.start;
    if (end < start) return sum; // Stop ended before it started (edge case), ignore
    return sum + (end - start);
  }, 0);

  const operatingMillis = elapsedMillis - totalDowntimeMillis;
  const operatingHours = operatingMillis > 0 ? operatingMillis / (1000 * 60 * 60) : 0;
  
  const expectedProduction = hourlyGoal * elapsedHours;
  const currentEfficiency = expectedProduction > 0 ? (currentProduction / expectedProduction) * 100 : 0;

  const qualityFactor = 0.85; // Fixed at 85%
  const availability = elapsedMillis > 0 ? operatingMillis / elapsedMillis : 0;
  const actualRate = operatingHours > 0 ? currentProduction / operatingHours : 0;
  const performance = hourlyGoal > 0 ? actualRate / hourlyGoal : 0;
  const oee = availability * performance * qualityFactor * 100;

  const getStatusColor = () => {
    if (currentEfficiency >= settings.efficiencyGoal) return 'text-green-600';
    if (currentEfficiency >= settings.efficiencyGoal * 0.9) return 'text-yellow-500';
    return 'text-red-600';
  };
  
  const activeMaintenance = maintenanceStops.find(s => s.end === null);
  const activeOperational = operationalStops.find(s => s.end === null);
  const activeStop = activeMaintenance || activeOperational;
  
  let cardBorderColor = 'border-gray-200';
  if (activeMaintenance) cardBorderColor = 'border-red-500';
  else if (activeOperational) cardBorderColor = 'border-yellow-500';
  else if (currentEfficiency >= settings.efficiencyGoal) cardBorderColor = 'border-green-500';
  else if (currentEfficiency >= settings.efficiencyGoal * 0.9) cardBorderColor = 'border-yellow-500';
  else cardBorderColor = 'border-red-500';

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 flex flex-col justify-between border-l-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${cardBorderColor}`}
      onDoubleClick={() => openModal('LOOM_DETAILS', { loomId: loom.id })}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{loom.code}</h3>
              <p className="text-xs text-gray-500 flex items-center"><UserCheck className="w-3 h-3 mr-1"/><span className="font-bold">{operator?.name || 'Não definido'}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Últ. Atu.</p>
              <p className="text-sm font-semibold text-gray-600">{lastProductionEntry ? new Date(lastProductionEntry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'}) : '---'}</p>
            </div>
        </div>
        
        <div className="w-full max-w-[150px] mx-auto my-2">
            <EfficiencyGauge efficiency={currentEfficiency} />
        </div>

        <div className="transition-all duration-300 min-h-[120px]">
            {!showGraph ? (
                <>
                <div className="mt-2 space-y-3">
                  <div className="text-center">
                      <p className="text-xs text-gray-500">Produção Acumulada</p>
                      <p className="text-2xl font-bold text-brand-green">{currentProduction.toFixed(0)} <span className="text-base font-normal">m</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Esperado</p>
                      <p className="font-semibold">{expectedProduction.toFixed(0)} m</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Diferença</p>
                      <p className={`font-semibold ${currentProduction - expectedProduction >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(currentProduction - expectedProduction).toFixed(0)} m
                      </p>
                    </div>
                  </div>
                </div>
                </>
            ) : (
                <HourlyProductionChart loomId={loom.id}/>
            )}
        </div>
        
        <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center" title="Overall Equipment Effectiveness"><DropletsIcon className="w-4 h-4 mr-1 text-blue-500"/> OEE: <span className="font-bold ml-1">{oee.toFixed(1)}%</span></div>
                 <button onClick={(e) => { e.stopPropagation(); setShowGraph(prev => !prev); }} className="p-1 rounded-full hover:bg-gray-200" title={showGraph ? "Ocultar gráfico" : "Mostrar gráfico"}>
                    <BarChartIcon className="w-4 h-4 text-gray-500"/>
                </button>
                <div className="flex items-center" title="Metros produzidos por hora"><SpeedIcon className="w-4 h-4 mr-1 text-purple-500"/> Ritmo: <span className="font-bold ml-1">{actualRate.toFixed(1)} m/h</span></div>
            </div>
        </div>

        {activeStop && (
            <div className={`mt-2 p-2 rounded-md text-sm ${activeMaintenance ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                <div className="flex items-center font-bold">
                    <WrenchIcon className="w-4 h-4 mr-2" />
                    Parada: {activeStop.reason}
                </div>
                 <p className="text-xs text-center mt-1">Duração: {formatDuration(currentTime - activeStop.start)}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoomCard;