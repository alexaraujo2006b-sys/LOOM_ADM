import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

const OverallStatsCard: React.FC<{ currentTime: number }> = ({ currentTime }) => {
    const { activeShift, looms, products, settings } = useAppContext();

    const stats = useMemo(() => {
        if (!activeShift) return null;

        let totalProductionMeters = 0;
        let totalProductionKg = 0;
        let totalExpectedProductionMeters100 = 0;
        let totalLossKg = 0;

        const reasonCounts: Record<string, number> = {};
        const loomLosses: { code: string, lossMeters: number }[] = [];

        const elapsedMillis = currentTime - activeShift.shiftStartTime;
        const elapsedHours = elapsedMillis > 0 ? elapsedMillis / (1000 * 60 * 60) : 0;
        if(elapsedHours <= 0) return null; 

        looms.forEach(loom => {
            const product = products.find(p => p.id === loom.productId);
            if (!product) return;

            const hourlyGoal = (product.threadDensity > 0)
                ? (product.standardRpm * 60) / (product.threadDensity * 10)
                : settings.hourlyProductionGoal;

            const productionEntries = activeShift.production.filter(p => p.loomId === loom.id).sort((a,b) => a.timestamp - b.timestamp);
            const loomProductionMeters = productionEntries.length > 1 ? Math.max(0, productionEntries[productionEntries.length - 1].reading - productionEntries[0].reading) : 0;
            const loomProductionKg = (loomProductionMeters * product.fabricWidthM * product.grammageM2) / 1000;
            
            totalProductionMeters += loomProductionMeters;
            totalProductionKg += loomProductionKg;
            
            const expectedMeters100 = hourlyGoal * elapsedHours;
            totalExpectedProductionMeters100 += expectedMeters100;
            
            const maintenanceStops = activeShift.maintenance.filter(m => m.loomId === loom.id);
            const operationalStops = activeShift.interventions.filter(i => i.loomId === loom.id);
            const loomDowntimeMillis = [...maintenanceStops, ...operationalStops].reduce((sum, stop) => {
                const end = stop.end ?? currentTime;
                const start = stop.start;
                return sum + (end > start ? end - start : 0);
            }, 0);
            
            const downtimeLossMeters = (loomDowntimeMillis / (1000 * 60 * 60)) * hourlyGoal;
            const loomIthCount = activeShift.ithInterventions.filter(i => i.loomId === loom.id).length;
            const ithLossMeters = loomIthCount * 1 * (hourlyGoal / 60);

            const totalLoomLossMeters = downtimeLossMeters + ithLossMeters;
            const totalLoomLossKg = (totalLoomLossMeters * product.fabricWidthM * product.grammageM2) / 1000;
            totalLossKg += totalLoomLossKg;
            loomLosses.push({ code: loom.code, lossMeters: totalLoomLossMeters });

            [...maintenanceStops, ...operationalStops].forEach(stop => {
                reasonCounts[stop.reason] = (reasonCounts[stop.reason] || 0) + 1;
            });
            activeShift.ithInterventions.filter(i => i.loomId === loom.id).forEach(ith => {
                const reason = settings.ithStopReasons.find(r => r.id === ith.reasonId);
                const reasonKey = reason ? `${reason.code}` : 'ITH Desc.';
                reasonCounts[reasonKey] = (reasonCounts[reasonKey] || 0) + 1;
            });
        });

        const avgProductivity = elapsedHours > 0 ? totalProductionMeters / elapsedHours : 0;
        const avgEfficiency = totalExpectedProductionMeters100 > 0 ? (totalProductionMeters / totalExpectedProductionMeters100) * 100 : 0;

        const top5Reasons = Object.entries(reasonCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([reason, count]) => ({ reason, count }));

        const loomWithHighestLoss = loomLosses.length > 0
            ? loomLosses.reduce((max, loom) => loom.lossMeters > max.lossMeters ? loom : max, loomLosses[0])
            : { code: 'N/A', lossMeters: 0 };
        
        return {
            avgProductivity,
            totalProductionKg,
            avgEfficiency,
            totalLossKg,
            top5Reasons,
            loomWithHighestLoss: loomWithHighestLoss.code,
        };
    }, [activeShift, looms, products, settings, currentTime]);

    if (!stats) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Resumo Geral do Turno</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-gray-500">Produtividade Média</h3>
                    <p className="text-3xl font-bold text-brand-green mt-1">{stats.avgProductivity.toFixed(1)} <span className="text-lg">m/h</span></p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-gray-500">Produção Total</h3>
                    <p className="text-3xl font-bold text-brand-green mt-1">{stats.totalProductionKg.toFixed(1)} <span className="text-lg">kg</span></p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-gray-500">Eficiência Média</h3>
                    <p className="text-3xl font-bold text-brand-green mt-1">{stats.avgEfficiency.toFixed(1)}<span className="text-lg">%</span></p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-red-600">Perdas Totais</h3>
                    <p className="text-3xl font-bold text-red-700 mt-1">{stats.totalLossKg.toFixed(1)} <span className="text-lg">kg</span></p>
                </div>
                <div className="md:col-span-1 xl:col-span-1 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 text-center mb-2">5 Maiores Causas</h3>
                    {stats.top5Reasons.length > 0 ? (
                        <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
                            {stats.top5Reasons.map(item => (
                                <li key={item.reason} className="truncate" title={item.reason}>
                                    <span className="font-semibold">{item.reason}</span> ({item.count}x)
                                </li>
                            ))}
                        </ol>
                    ) : <p className="text-center text-xs text-gray-400 mt-4">Nenhuma parada.</p>}
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-red-600">Tear com Maior Perda</h3>
                    <p className="text-3xl font-bold text-red-700 mt-1">{stats.loomWithHighestLoss}</p>
                </div>
            </div>
        </div>
    );
};

export default OverallStatsCard;
