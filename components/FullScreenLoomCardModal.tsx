import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ModalWrapper } from './ModalManager';
import { Loom } from '../types';
import EfficiencyGauge from './charts/EfficiencyGauge';
import HourlyProductionChart from './charts/HourlyProductionChart';
import { formatDuration } from '../utils/time';
import ParetoChart from './charts/ParetoChart';

const WrenchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const AlertTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
const ZapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;


const FullScreenLoomCardModal: React.FC = () => {
    const { modal: { data }, activeShift, looms, products, operators, settings } = useAppContext();

    const loom: Loom | undefined = useMemo(() => looms.find(l => l.id === data.loomId), [looms, data.loomId]);

    const {
        product,
        operator,
        currentProduction,
        currentProductionKg,
        currentEfficiency,
        oee,
        ithEfficiency,
        ithLossMeters,
        allStops,
        qualityEntries,
        ithInterventions,
        paretoDataIths
    } = useMemo(() => {
        if (!loom || !activeShift) return { product: undefined, operator: undefined, currentProduction: 0, currentProductionKg: 0, currentEfficiency: 0, oee: 0, ithEfficiency: 0, ithLossMeters: 0, allStops: [], qualityEntries: [], ithInterventions: [], paretoDataIths: [] };

        const product = products.find(p => p.id === loom.productId);
        const operatorId = loom.operatorIds[activeShift.shiftName];
        const operator = operators.find(o => o.id === operatorId);
        
        const hourlyGoal = (product && product.threadDensity > 0)
            ? (product.standardRpm * 60) / (product.threadDensity * 10)
            : settings.hourlyProductionGoal;

        const productionEntries = activeShift.production.filter(p => p.loomId === loom.id).sort((a,b) => a.timestamp - b.timestamp);
        const currentProduction = productionEntries.length > 1 ? Math.max(0, productionEntries[productionEntries.length - 1].reading - productionEntries[0].reading) : 0;
        
        const currentProductionKg = (product && product.fabricWidthM && product.grammageM2)
            ? (currentProduction * product.fabricWidthM * product.grammageM2) / 1000
            : 0;

        const shiftStart = activeShift.shiftStartTime;
        const elapsedMillis = Date.now() - shiftStart;
        const elapsedHours = elapsedMillis > 0 ? elapsedMillis / (1000 * 60 * 60) : 0;

        const maintenanceStops = activeShift.maintenance.filter(m => m.loomId === loom.id);
        const operationalStops = activeShift.interventions.filter(i => i.loomId === loom.id);
        const stops = [...maintenanceStops, ...operationalStops];

        const totalDowntimeMillis = stops.reduce((sum, stop) => sum + ((stop.end ?? Date.now()) - stop.start), 0);
        const operatingMillis = elapsedMillis - totalDowntimeMillis;
        const operatingHours = operatingMillis > 0 ? operatingMillis / (1000 * 60 * 60) : 0;
        
        const expectedProductionAt100 = hourlyGoal * elapsedHours;
        const currentEfficiency = expectedProductionAt100 > 0 ? (currentProduction / expectedProductionAt100) * 100 : 0;

        const totalOffSpecMeters = activeShift.qualityEntries.filter(q => q.loomId === loom.id).reduce((sum, q) => sum + q.offSpecFabricMeters, 0);
        const qualityFactor = currentProduction > 0 ? Math.max(0, (currentProduction - totalOffSpecMeters) / currentProduction) : 1;
        const availability = elapsedMillis > 0 ? operatingMillis / elapsedMillis : 0;
        const actualRate = operatingHours > 0 ? currentProduction / operatingHours : 0;
        const performance = hourlyGoal > 0 ? actualRate / hourlyGoal : 0;
        const oee = availability * performance * qualityFactor * 100;
        
        const allStops = [
            ...maintenanceStops.map(s => ({ ...s, type: 'maintenance' as const })),
            ...operationalStops.map(s => ({ ...s, type: 'operational' as const }))
        ].sort((a, b) => b.start - a.start);

        const qualityEntries = activeShift.qualityEntries.filter(q => q.loomId === loom.id).sort((a,b) => b.timestamp - a.timestamp);
        const ithInterventions = activeShift.ithInterventions.filter(i => i.loomId === loom.id).sort((a,b) => b.timestamp - a.timestamp);

        // ITH Efficiency Calculation
        const numReadings = productionEntries.length > 1 ? productionEntries.length - 1 : 0;
        const numIths = ithInterventions.length;
        const ithEfficiency = numReadings > 0 
            ? Math.max(0, (numReadings - numIths) / numReadings) * 100 
            : (numIths > 0 ? 0 : 100);

        // ITH Loss Calculation (assuming 1 min per ITH)
        const ithLossMeters = numIths * 1 * (hourlyGoal / 60);

        // ITH Pareto Data Calculation
        const ithsByReason = ithInterventions.reduce((acc, ith) => {
            if (!acc[ith.reasonId]) {
                acc[ith.reasonId] = 0;
            }
            acc[ith.reasonId]++;
            return acc;
        }, {} as Record<string, number>);

        const sortedIths = Object.entries(ithsByReason)
            .map(([reasonId, count]) => {
                const reason = settings.ithStopReasons.find(r => r.id === reasonId);
                const reasonDesc = reason ? `${reason.code} - ${reason.description}` : 'Desconhecido';
                return { reason: reasonDesc, value: count };
            })
            .sort((a, b) => b.value - a.value);

        const totalIthCount = sortedIths.reduce((sum, ith) => sum + ith.value, 0);
        let cumulativePercentageIths = 0;
        const paretoDataIths = sortedIths.map(ith => {
            const percentage = totalIthCount > 0 ? (ith.value / totalIthCount) * 100 : 0;
            cumulativePercentageIths += percentage;
            return { reason: ith.reason, value: ith.value, percentage, cumulative: cumulativePercentageIths };
        });


        return { product, operator, currentProduction, currentProductionKg, currentEfficiency, oee, ithEfficiency, ithLossMeters, allStops, qualityEntries, ithInterventions, paretoDataIths };
    }, [loom, activeShift, products, operators, settings]);


    if (!loom) return null;

    return (
        <ModalWrapper title={`Visão Detalhada - ${loom.code}`} size="full">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
                {/* Left Column */}
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4 text-center p-4 bg-gray-50 rounded-lg">
                        <div><p className="text-sm text-gray-500">Produto</p><p className="font-semibold text-gray-800">{product?.name || 'N/A'}</p></div>
                        <div><p className="text-sm text-gray-500">Operador</p><p className="font-semibold text-gray-800">{operator?.name || 'N/A'}</p></div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md flex-1 flex flex-col items-center justify-center">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Eficiência Acumulada</h3>
                        <div className="w-full max-w-xs">
                           <EfficiencyGauge efficiency={currentEfficiency} valueFontSize={32} />
                        </div>
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 w-full max-w-2xl mt-4 text-center">
                            <div>
                                <p className="text-sm text-gray-500">Produção</p>
                                <p className="font-bold text-2xl text-brand-green">{currentProduction.toFixed(0)}m</p>
                                <p className="font-semibold text-base text-gray-600 -mt-1">{currentProductionKg.toFixed(1)}kg</p>
                            </div>
                            <div><p className="text-sm text-gray-500">Eficiência ITH</p><p className="font-bold text-2xl text-brand-green">{ithEfficiency.toFixed(0)} %</p></div>
                            <div><p className="text-sm text-gray-500" title="Perda estimada em metros devido a microparadas">Perda por ITH</p><p className="font-bold text-2xl text-red-600">{ithLossMeters.toFixed(1)} m</p></div>
                            <div><p className="text-sm text-gray-500">OEE</p><p className="font-bold text-2xl text-brand-green">{oee.toFixed(1)} %</p></div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-2">
                     <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Produção Hora a Hora</h3>
                        <div className="h-48">
                            <HourlyProductionChart loomId={loom.id} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Histórico de Ocorrências do Turno</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {allStops.length === 0 && ithInterventions.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma ocorrência registrada.</p>}
                            
                            {allStops.map(stop => {
                                const isMaintenance = stop.type === 'maintenance';
                                const Icon = isMaintenance ? WrenchIcon : AlertTriangleIcon;
                                const color = isMaintenance ? 'text-red-600' : 'text-yellow-600';
                                return (
                                    <div key={stop.id} className="flex items-center gap-3 p-2 rounded-md bg-gray-50">
                                        <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
                                        <div className="flex-1 text-sm"><span className="font-semibold">{stop.reason}</span></div>
                                        <div className="text-xs text-gray-500">{new Date(stop.start).toLocaleTimeString()}</div>
                                        <div className="text-sm font-semibold w-20 text-right">{formatDuration((stop.end || Date.now()) - stop.start)}</div>
                                    </div>
                                );
                            })}
                            {ithInterventions.map(ith => {
                                const reason = settings.ithStopReasons.find(r => r.id === ith.reasonId);
                                return (
                                     <div key={ith.id} className="flex items-center gap-3 p-2 rounded-md bg-gray-50">
                                        <ZapIcon className="w-5 h-5 flex-shrink-0 text-orange-500" />
                                        <div className="flex-1 text-sm"><span className="font-semibold">{reason?.description || 'Causa desconhecida'}</span></div>
                                        <div className="text-xs text-gray-500">{new Date(ith.timestamp).toLocaleTimeString()}</div>
                                        <div className="text-sm font-semibold w-20 text-right">Microparada</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                     <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Pareto de Microparadas (ITH)</h3>
                        {paretoDataIths.length > 0 ? (
                             <div className="h-64">
                                <ParetoChart data={paretoDataIths} yAxisLabel="Ocorrências" barColor="bg-orange-500" hoverBarColor="hover:bg-orange-700" />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">Nenhuma microparada registrada para análise.</p>
                        )}
                    </div>
                </div>
            </div>
        </ModalWrapper>
    );
};

export default FullScreenLoomCardModal;