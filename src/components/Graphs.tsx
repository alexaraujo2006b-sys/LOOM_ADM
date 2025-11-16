import React, { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import EfficiencyGauge from '@/components/charts/EfficiencyGauge';
import ComparativeProductionChart from '@/components/charts/ComparativeProductionChart';

const Graphs: React.FC = () => {
    const { looms, activeShift, products, settings } = useAppContext();

    const chartData = useMemo(() => {
        if (!activeShift) return { overallEfficiency: 0, comparativeData: [] };

        const elapsedMillis = Date.now() - activeShift.shiftStartTime;
        const elapsedHours = elapsedMillis > 0 ? elapsedMillis / (1000 * 60 * 60) : 0;
        
        let totalActualProduction = 0;
        let totalExpectedProduction100 = 0;

        const comparativeData = looms.map(loom => {
            const product = products.find(p => p.id === loom.productId);
            const hourlyGoal = product && product.threadDensity > 0
                ? (product.standardRpm * 60) / (product.threadDensity * 10)
                : settings.hourlyProductionGoal;

            const productionEntries = activeShift.production.filter(p => p.loomId === loom.id).sort((a,b) => a.timestamp - b.timestamp);
            const loomProduction = productionEntries.length > 1
                ? Math.max(0, productionEntries[productionEntries.length - 1].reading - productionEntries[0].reading)
                : 0;
            
            const expectedAt100 = hourlyGoal * elapsedHours;
            const efficiency = expectedAt100 > 0 ? (loomProduction / expectedAt100) * 100 : 0;

            totalActualProduction += loomProduction;
            totalExpectedProduction100 += expectedAt100;

            return {
                code: loom.code,
                production: loomProduction,
                efficiency,
            };
        });

        const overallEfficiency = totalExpectedProduction100 > 0
            ? (totalActualProduction / totalExpectedProduction100) * 100
            : 0;
            
        comparativeData.sort((a, b) => b.production - a.production);

        return { overallEfficiency, comparativeData };

    }, [activeShift, looms, products, settings]);

    if (!activeShift) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Gráficos de Produção</h2>
                    <p className="text-gray-500">Nenhum turno ativo para exibir gráficos.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Gráficos de Desempenho do Turno</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Eficiência Geral do Turno</h2>
                    <div className="w-full max-w-[250px]">
                       <EfficiencyGauge efficiency={chartData.overallEfficiency} valueFontSize={40} />
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                     <h2 className="text-xl font-semibold text-gray-700 mb-4">Produção por Tear</h2>
                     {chartData.comparativeData.length > 0 ? (
                        <ComparativeProductionChart data={chartData.comparativeData} />
                     ) : (
                        <p className="text-center text-gray-500 py-10">Calculando dados...</p>
                     )}
                </div>
            </div>
        </div>
    );
};

export default Graphs;
