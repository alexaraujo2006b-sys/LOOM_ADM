import React from 'react';
import { useAppContext } from '../context/AppContext';
import ParetoChart from './charts/ParetoChart';
import { MaintenanceStop, OperationalIntervention } from '../types';

const ParetoAnalysis: React.FC = () => {
    const { activeShift } = useAppContext();

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
    
    const allStops: (MaintenanceStop | OperationalIntervention)[] = [...activeShift.maintenance, ...activeShift.interventions];
    
    // 1. Group by reason and sum duration
    const stopsByReason = allStops.reduce((acc, stop) => {
        const duration = (stop.end || Date.now()) - stop.start;
        acc[stop.reason] = (acc[stop.reason] || 0) + duration;
        return acc;
    }, {} as Record<string, number>);

    // 2. Sort by duration descending
    const sortedStops = Object.entries(stopsByReason)
        .map(([reason, duration]) => ({ reason, duration }))
        .sort((a, b) => b.duration - a.duration);

    // 3. Calculate total duration and percentages
    const totalDowntime = sortedStops.reduce((sum, stop) => sum + stop.duration, 0);

    let cumulativePercentage = 0;
    const paretoData = sortedStops.map(stop => {
        const percentage = totalDowntime > 0 ? (stop.duration / totalDowntime) * 100 : 0;
        cumulativePercentage += percentage;
        return {
            reason: stop.reason,
            duration: stop.duration / (1000 * 60), // convert to minutes
            percentage,
            cumulative: cumulativePercentage
        };
    });

    return (
        <div className="p-4 space-y-6">
             <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Análise de Pareto de Paradas</h1>
                <div className="text-sm text-gray-600">
                    <p>Turno: <span className="font-semibold">{activeShift.shiftName}</span></p>
                    <p>Total de Tempo de Parada: <span className="font-semibold">{(totalDowntime / (1000 * 60)).toFixed(0)} min</span></p>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                 {paretoData.length > 0 ? (
                    <ParetoChart data={paretoData} />
                 ) : (
                    <div className="text-center py-16">
                        <h3 className="text-xl font-semibold text-gray-600">Nenhuma parada registrada neste turno.</h3>
                        <p className="text-gray-500 mt-2">Continue monitorando para coletar dados para análise.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default ParetoAnalysis;