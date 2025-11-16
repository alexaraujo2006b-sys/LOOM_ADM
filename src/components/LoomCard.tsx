import React, { useState, useMemo } from 'react';
import { Loom } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { formatDuration } from '@/utils/time';
import HourlyProductionChart from '@/components/charts/HourlyProductionChart';
import EfficiencyGauge from '@/components/charts/EfficiencyGauge';

interface LoomCardProps {
  loom: Loom;
  currentTime: number;
  isReadOnly?: boolean;
}

const DropletsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.48-2.26-1.3-3.11-1.44-1.55-4.3-1.1-4.3-1.1s-.26 2.76-1.1 4.3c-.82.85-1.3 1.95-1.3 3.11C3 14.47 4.8 16.3 7 16.3z"/><path d="M12.83 21.16a1 1 0 0 0 1.28-1.28 4.02 4.02 0 0 0-4.03-4.03 1 1 0 1 0-1.28 1.28 6.03 6.03 0 0 1 4.03 4.03z"/><path d="M19.66 12.34a1 1 0 1 0-1.32-1.32 3 3 0 0 0-3-3 1 1 0 1 0-1.32 1.32 5 5 0 0 1 5.64 3z"/></svg>
);
const SpeedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
);
const ZapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const UserCheck: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
);
const BarChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
);
const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);

const ExpandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7 14H2v5"/><path d="M14 2v5h5"/><path d="M2 14v-1a2 2 0 0 1 2-2h2"/><path d="M22 10v1a2 2 0 0 1-2 2h-2"/><path d="M10 2h1a2 2 0 0 1 2 2v2"/><path d="M10 22h1a2 2 0 0 0 2-2v-2"/></svg>
);


const LoomCard: React.FC<LoomCardProps> = ({ loom, currentTime, isReadOnly = false }) => {
  const { settings, activeShift, operators, products, openModal } = useAppContext();
  const [showGraph, setShowGraph] = useState(false);

  if (!activeShift) return null;
  
  const product = products.find(p => p.id === loom.productId);
  const operatorId = loom.operatorIds[activeShift.shiftName];
  const operator = operators.find(o => o.id === operatorId);
  
  const hourlyGoal = useMemo(() => {
    if (product && product.threadDensity > 0) {
      return (product.standardRpm * 60) / (product.threadDensity * 10);
    }
    return settings.hourlyProductionGoal; // Fallback
  }, [product, settings.hourlyProductionGoal]);
  
  const productionEntries = activeShift.production.filter(p => p.loomId === loom.id).sort((a,b) => a.timestamp - b.timestamp);
  const lastProductionEntry = productionEntries.length > 0 ? productionEntries[productionEntries.length - 1] : null;

  const shiftStart = activeShift.shiftStartTime;
  const elapsedMillis = currentTime - shiftStart;
  const elapsedHours = elapsedMillis > 0 ? elapsedMillis / (1000 * 60 * 60) : 0;
  
  const currentProduction = useMemo(() => {
    if (productionEntries.length < 2) return 0;
    const firstReading = productionEntries[0].reading;
    const lastReading = productionEntries[productionEntries.length - 1].reading;
    return Math.max(0, lastReading - firstReading);
  }, [productionEntries]);

  const currentProductionKg = useMemo(() => {
    if (!product || !product.fabricWidthM || !product.grammageM2) return 0;
    const area = currentProduction * product.fabricWidthM;
    const weightGrams = area * product.grammageM2;
    return weightGrams / 1000;
  }, [currentProduction, product]);
  
  const maintenanceStops = activeShift.maintenance.filter(m => m.loomId === loom.id);
  const operationalStops = activeShift.interventions.filter(i => i.loomId === loom.id);
  const ithCount = activeShift.ithInterventions.filter(i => i.loomId === loom.id).length;
  const ithLossMeters = ithCount * 1 * (hourlyGoal / 60); // Assuming 1 min loss per ITH intervention

  const allStops = [
    ...maintenanceStops.map(s => ({ ...s, type: 'maintenance' as const })),
    ...operationalStops.map(s => ({ ...s, type: 'operational' as const }))
  ].sort((a, b) => b.start - a.start); // Most recent on top

  const totalDowntimeMillis = allStops.reduce((sum, stop) => {
    const end = stop.end ?? currentTime;
    const start = stop.start;
    if (end < start) return sum; 
    return sum + (end - start);
  }, 0);

  const operatingMillis = elapsedMillis - totalDowntimeMillis;
  const operatingHours = operatingMillis > 0 ? operatingMillis / (1000 * 60 * 60) : 0;
  
  const expectedProductionBasedOnGoal = hourlyGoal * elapsedHours * (settings.efficiencyGoal / 100);
  const expectedProductionAt100 = hourlyGoal * elapsedHours;
  const currentEfficiency = expectedProductionAt100 > 0 ? (currentProduction / expectedProductionAt100) * 100 : 0;
  
  // OEE Calculation
  const totalOffSpecMeters = activeShift.qualityEntries
    .filter(q => q.loomId === loom.id)
    .reduce((sum, q) => sum + q.offSpecFabricMeters, 0);

  const qualityFactor = currentProduction > 0 ? Math.max(0, (currentProduction - totalOffSpecMeters) / currentProduction) : 1;
  const availability = elapsedMillis > 0 ? operatingMillis / elapsedMillis : 0;
  const actualRate = operatingHours > 0 ? currentProduction / operatingHours : 0;
  const performance = hourlyGoal > 0 ? actualRate / hourlyGoal : 0;
  const oee = availability * performance * qualityFactor * 100;

  const activeStop = allStops.find(s => s.end === null);
  
  let cardBorderColor = 'border-gray-200';
  if (activeStop?.type === 'maintenance') cardBorderColor = 'border-red-500';
  else if (activeStop?.type === 'operational') cardBorderColor = 'border-yellow-500';
  else if (currentEfficiency >= settings.efficiencyGoal) cardBorderColor = 'border-green-500';
  else if (currentEfficiency >= settings.efficiencyGoal * 0.9) cardBorderColor = 'border-yellow-500';
  else cardBorderColor = 'border-red-500';

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 flex flex-col justify-between border-l-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${cardBorderColor} min-h-[520px]`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2">
                <button disabled={isReadOnly} onClick={!isReadOnly ? () => openModal('LOG_ITH', { loomId: loom.id }) : undefined} className="font-bold text-lg text-gray-800 text-left hover:text-brand-green transition-colors disabled:cursor-not-allowed" title="Registrar ITH (Microparada)">{loom.code}</button>
                <button
                    disabled={isReadOnly}
                    onClick={!isReadOnly ? () => openModal('FULLSCREEN_LOOM_CARD', { loomId: loom.id }) : undefined}
                    className="text-gray-400 hover:text-brand-green transition-colors disabled:cursor-not-allowed"
                    title="Ver detalhes em tela cheia"
                >
                    <ExpandIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 flex items-center"><UserCheck className="w-3 h-3 mr-1"/><span className="font-bold">{operator?.name || 'Não definido'}</span></p>
            </div>
            <div className="text-right">
                <div className="flex items-center gap-2" title="Intervenção Tear Hora (Microparadas)">
                    <ZapIcon className="w-4 h-4 text-orange-500"/>
                    <span className="font-bold text-lg">{ithCount}</span>
                </div>
              <p className="text-xs text-gray-400 mt-1">Últ. Atu.</p>
              <p className="text-sm font-semibold text-gray-600">{lastProductionEntry ? new Date(lastProductionEntry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'}) : '---'}</p>
            </div>
        </div>
        
        <div className={`w-full max-w-[150px] mx-auto my-2 ${!isReadOnly ? 'cursor-pointer' : ''}`} onClick={!isReadOnly ? () => openModal('LOOM_HISTORY_CHART', { loomId: loom.id }) : undefined}>
            <EfficiencyGauge efficiency={currentEfficiency} />
        </div>

        <div className="transition-all duration-300 min-h-[160px]">
            {!showGraph ? (
                <>
                <div className="mt-2 space-y-2">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 inline-flex items-center gap-1">
                      Produção Acumulada
                      <button 
                        disabled={isReadOnly}
                        onClick={(e) => { if (!isReadOnly) { e.stopPropagation(); openModal('LOOM_DETAILS', { loomId: loom.id }); } }}
                        className="text-gray-400 hover:text-brand-green disabled:cursor-not-allowed"
                        title="+ Informações / Análise IA"
                      >
                        <InfoIcon className="w-4 h-4" />
                      </button>
                    </p>
                    <p className="text-4xl font-black text-brand-green">{currentProduction.toFixed(0)} <span className="text-xl font-medium">m</span></p>
                    <p className="text-lg text-gray-600 -mt-1">{currentProductionKg.toFixed(1)} <span className="text-base font-medium">kg</span></p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-base mt-1">
                    <div>
                      <p className="text-xs text-gray-500">Esperado</p>
                      <p className="font-bold">{expectedProductionBasedOnGoal.toFixed(0)} m</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Diferença</p>
                      <p className={`font-bold ${currentProduction - expectedProductionBasedOnGoal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(currentProduction - expectedProductionBasedOnGoal).toFixed(0)} m
                      </p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-500" title="Perda estimada por microparadas">Perda ITH</p>
                        <p className="font-bold text-red-600">{ithLossMeters.toFixed(1)} m</p>
                    </div>
                  </div>
                </div>
                </>
            ) : (
                <HourlyProductionChart loomId={loom.id}/>
            )}
        </div>
      </div>
      
      <div>
        <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center" title="Overall Equipment Effectiveness"><DropletsIcon className="w-4 h-4 mr-1 text-blue-500"/> OEE: <span className="font-bold ml-1">{oee.toFixed(1)}%</span></div>
                 <button disabled={isReadOnly} onClick={(e) => { if (!isReadOnly) { e.stopPropagation(); setShowGraph(prev => !prev); }}} className="p-1 rounded-full hover:bg-gray-200 disabled:cursor-not-allowed" title={showGraph ? "Ocultar dados" : "Mostrar gráfico"}>
                    <BarChartIcon className="w-4 h-4 text-gray-500"/>
                </button>
                <div className="flex items-center" title="Metros produzidos por hora"><SpeedIcon className="w-4 h-4 mr-1 text-purple-500"/> Ritmo: <span className="font-bold ml-1">{actualRate.toFixed(1)} m/h</span></div>
            </div>
        </div>

        <div className="mt-2 text-xs">
            {allStops.length > 0 ? (
                <div className="space-y-1 max-h-28 overflow-y-auto pr-2">
                    {allStops.map(stop => {
                        const isMaintenance = stop.type === 'maintenance';
                        const isActive = stop.end === null;
                        const duration = isActive ? currentTime - stop.start : stop.end! - stop.start;
                        const productionLoss = (duration / (1000 * 60 * 60)) * hourlyGoal;

                        return (
                            <div key={stop.id} className={`p-1.5 rounded-md ${isActive ? (isMaintenance ? 'bg-red-100' : 'bg-yellow-100') : 'bg-gray-100'}`}>
                                <div className="flex justify-between items-center font-semibold">
                                    <span className={`truncate pr-2 ${isActive ? (isMaintenance ? 'text-red-800' : 'text-yellow-800') : 'text-gray-700'}`}>{stop.reason}</span>
                                    <span className={`flex-shrink-0 ml-2 font-mono ${isActive ? (isMaintenance ? 'text-red-700' : 'text-yellow-700') : 'text-gray-600'}`}>
                                        {formatDuration(duration)}
                                    </span>
                                </div>
                                {isActive && (
                                    <p className="text-center text-red-600 font-bold text-xs mt-1">
                                        Perda: {productionLoss.toFixed(1)} m
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-center text-gray-400 text-xs py-4 border-t mt-2">Nenhuma parada registrada.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default LoomCard;
