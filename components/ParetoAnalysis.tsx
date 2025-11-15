import React from 'react';
import { useAppContext } from '../context/AppContext';
import ParetoChart from './charts/ParetoChart';
import { MaintenanceStop, OperationalIntervention } from '../types';

const ParetoAnalysis: React.FC = () => {
    const { activeShift, settings } = useAppContext();

    if (!activeShift) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Análise de Pareto de Paradas</h2>
                    <p className="text-gray-500">Inicie um turno para analisar as causas de parada.</p>
                </div>
            </div>
        );
    }
    
    // --- Pareto de Duração (Paradas Longas) ---
    const allStops: (MaintenanceStop | OperationalIntervention)[] = [...activeShift.maintenance, ...activeShift.interventions];
    const stopsByReason = allStops.reduce((acc, stop) => {
        const duration = (stop.end || Date.now()) - stop.start;
        acc[stop.reason] = (acc[stop.reason] || 0) + duration;
        return acc;
    }, {} as Record<string, number>);
    const sortedStops = Object.entries(stopsByReason)
        .map(([reason, duration]) => ({ reason, value: duration / (1000 * 60) })) // in minutes
        .sort((a, b) => b.value - a.value);
    const totalDowntime = sortedStops.reduce((sum, stop) => sum + stop.value, 0);
    let cumulativePercentageStops = 0;
    const paretoDataStops = sortedStops.map(stop => {
        const percentage = totalDowntime > 0 ? (stop.value / totalDowntime) * 100 : 0;
        cumulativePercentageStops += percentage;
        return { reason: stop.reason, value: stop.value, percentage, cumulative: cumulativePercentageStops };
    });

    // Fix: Used 'reasonId' instead of 'reasonCode' and updated logic to correctly find and display reason descriptions.
    // --- Pareto de Frequência (ITH - Microparadas) ---
    const ithsByReason = activeShift.ithInterventions.reduce((acc, ith) => {
        acc[ith.reasonId] = (acc[ith.reasonId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const sortedIths = Object.entries(ithsByReason)
        .map(([reasonId, count]) => {
            const reason = settings.ithStopReasons.find(r => r.id === reasonId);
            const reasonDesc = reason ? `${reason.code} - ${reason.description}` : reasonId;
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

    return (
        <div className="p-4 space-y-8">
             <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Análise de Pareto</h1>
                <div className="text-sm text-gray-600 bg-white p-2 rounded-md shadow-sm">
                    <p>Turno: <span className="font-semibold">{activeShift.shiftName}</span></p>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Pareto por Duração de Parada</h2>
                <p className="text-sm text-gray-500 mb-4">Total de Tempo de Parada: <span className="font-semibold">{totalDowntime.toFixed(0)} min</span></p>
                 {paretoDataStops.length > 0 ? (
                    <ParetoChart data={paretoDataStops} yAxisLabel="Minutos" />
                 ) : (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold text-gray-600">Nenhuma parada longa registrada neste turno.</h3>
                    </div>
                 )}
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Pareto por Frequência de Microparadas (ITH)</h2>
                <p className="text-sm text-gray-500 mb-4">Total de Intervenções: <span className="font-semibold">{totalIthCount}</span></p>
                 {paretoDataIths.length > 0 ? (
                    <ParetoChart data={paretoDataIths} yAxisLabel="Ocorrências" barColor="bg-orange-500" hoverBarColor="hover:bg-orange-700" />
                 ) : (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold text-gray-600">Nenhuma microparada (ITH) registrada neste turno.</h3>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default ParetoAnalysis;