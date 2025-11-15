import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';

interface HourlyProductionChartProps {
  loomId: string;
}

const HourlyProductionChart: React.FC<HourlyProductionChartProps> = ({ loomId }) => {
  const { activeShift, products, looms } = useAppContext();

  const chartData = useMemo(() => {
    if (!activeShift) return { hourlyProduction: [], product: undefined };

    const loom = looms.find(l => l.id === loomId);
    const product = products.find(p => p.id === loom?.productId);
    
    const productionEntries = activeShift.production
      .filter(p => p.loomId === loomId)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    const hourlyProd: { hour: string, production: number }[] = [];

    if (productionEntries.length > 1) {
      let lastReadingEntry = productionEntries[0];
      for (let i = 1; i < productionEntries.length; i++) {
        const currentEntry = productionEntries[i];
        const hour = new Date(currentEntry.timestamp).getHours();
        const production = currentEntry.reading - lastReadingEntry.reading;
        const hourLabel = `${String(hour).padStart(2, '0')}:00`;

        const existingHour = hourlyProd.find(h => h.hour === hourLabel);
        if (existingHour) {
          existingHour.production += Math.max(0, production);
        } else {
          hourlyProd.push({ hour: hourLabel, production: Math.max(0, production) });
        }
        lastReadingEntry = currentEntry;
      }
    }
    return { hourlyProduction: hourlyProd, product };
  }, [loomId, activeShift, products, looms]);

  const { hourlyProduction, product } = chartData;
  
  const hourlyGoal = useMemo(() => {
    if (product && product.threadDensity > 0) {
      return (product.standardRpm * 60) / (product.threadDensity * 10);
    }
    return 0;
  }, [product]);

  const maxProd = Math.max(...hourlyProduction.map(h => h.production), hourlyGoal) * 1.15 || 10; // Add 15% padding

  if (hourlyProduction.length === 0) {
    return <div className="text-center text-sm text-gray-500 py-10">Sem dados de produção horária.</div>;
  }

  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map(p => ({
    value: Math.round(maxProd * p),
    position: `${p * 100}%`
  }));

  return (
    <div className="relative h-[160px] flex flex-col justify-end pl-8 pr-4">
        {/* Y-Axis Labels and Grid Lines */}
        {yAxisLabels.map(label => (
            <div key={label.value} className="absolute left-8 right-0 flex items-center" style={{ bottom: `calc(${label.position} + 18px)`}}>
                <span className="absolute -left-8 text-xs text-gray-400 w-7 text-right">{label.value}</span>
                <div className="w-full border-t border-gray-200 border-dashed"></div>
            </div>
        ))}

        {/* Chart Bars */}
        <div className="flex items-end justify-around h-full border-b border-gray-300">
            {hourlyProduction.map(({ hour, production }) => (
            <div key={hour} className="flex flex-col items-center w-full text-center group h-full justify-end">
                <div 
                    className="w-1/2 bg-blue-400 hover:bg-blue-600 transition-colors relative"
                    style={{ height: `${maxProd > 0 ? (production / maxProd) * 100 : 0}%` }}
                    title={`${production.toFixed(0)}m`}
                >
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">{production.toFixed(0)}</span>
                </div>
                <span className="text-xs text-gray-500 mt-1">{hour.split(':')[0]}h</span>
            </div>
            ))}
        </div>

        {/* Goal Line */}
        {hourlyGoal > 0 && maxProd > 0 && (
            <div 
            className="absolute left-8 right-0 border-t-2 border-dashed border-red-500" 
            style={{ bottom: `calc(${(hourlyGoal / maxProd) * 100}% + 18px)` }}
            >
                <span className="absolute -top-2 right-0 text-xs text-red-500 bg-white px-1 rounded">Meta</span>
            </div>
        )}
    </div>
  );
};
export default HourlyProductionChart;