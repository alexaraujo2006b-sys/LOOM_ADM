import React from 'react';

interface ChartDataItem {
    code: string;
    production: number;
    efficiency: number;
}

interface ComparativeProductionChartProps {
    data: ChartDataItem[];
}

const getBarColor = (efficiency: number): string => {
    if (efficiency < 50) return 'bg-red-500';
    if (efficiency < 65) return 'bg-yellow-400';
    return 'bg-green-500';
};

const ComparativeProductionChart: React.FC<ComparativeProductionChartProps> = ({ data }) => {
    const maxProduction = Math.max(...data.map(d => d.production), 0) || 1;

    return (
        <div className="space-y-3 p-4">
            {data.map(item => (
                <div key={item.code} className="grid grid-cols-[80px_1fr] items-center gap-4 text-sm">
                    <div className="font-semibold text-gray-700 text-right">{item.code}</div>
                    <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-200 rounded-full h-6">
                            <div
                                className={`${getBarColor(item.efficiency)} h-6 rounded-full transition-all duration-500`}
                                style={{ width: `${(item.production / maxProduction) * 100}%` }}
                            >
                            </div>
                        </div>
                         <div className="w-16 text-left font-semibold text-gray-800">
                            {item.production.toFixed(0)} m
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ComparativeProductionChart;