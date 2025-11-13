import React from 'react';

interface ParetoData {
    reason: string;
    duration: number; // in minutes
    percentage: number;
    cumulative: number;
}

interface ParetoChartProps {
    data: ParetoData[];
}

const ParetoChart: React.FC<ParetoChartProps> = ({ data }) => {
    const maxDuration = Math.max(...data.map(d => d.duration), 0);

    return (
        <div className="w-full h-[500px] bg-gray-50 p-4 sm:p-6 rounded-lg">
            <div className="relative flex justify-around items-end w-full h-full border-l border-b border-gray-300">
                {/* Y-Axis Labels (Duration) */}
                <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
                    <span>{maxDuration.toFixed(0)} min</span>
                    <span>{(maxDuration * 0.75).toFixed(0)}</span>
                    <span>{(maxDuration * 0.5).toFixed(0)}</span>
                    <span>{(maxDuration * 0.25).toFixed(0)}</span>
                    <span className="mb-[25px]">0</span>
                </div>
                
                {/* Y-Axis Labels (Cumulative %) */}
                 <div className="absolute -right-12 top-0 bottom-0 flex flex-col justify-between text-xs text-red-500">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span className="mb-[25px]">0%</span>
                </div>
                
                {/* Chart Bars */}
                {data.map((item, index) => (
                    <div key={item.reason} className="flex-1 flex flex-col items-center justify-end px-1 group">
                        <div 
                            className="w-full bg-blue-500 hover:bg-blue-700 transition-colors"
                            style={{ height: `${maxDuration > 0 ? (item.duration / maxDuration) * 100 : 0}%` }}
                        >
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.duration.toFixed(0)} min
                            </span>
                        </div>
                        <span className="text-xs text-center text-gray-600 mt-2 transform -rotate-15 origin-center">{item.reason}</span>
                    </div>
                ))}

                {/* Cumulative Line */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <polyline
                        fill="none"
                        stroke="#ef4444" // red-500
                        strokeWidth="2"
                        points={
                            data.map((item, index) => {
                                const x = ((index + 0.5) / data.length) * 100;
                                const y = 100 - item.cumulative;
                                return `${x}% ${y}%`;
                            }).join(' ')
                        }
                    />
                    {data.map((item, index) => {
                         const x = ((index + 0.5) / data.length) * 100;
                         const y = 100 - item.cumulative;
                         return <circle key={index} cx={`${x}%`} cy={`${y}%`} r="3" fill="#ef4444" />;
                    })}
                </svg>
            </div>
             <div className="flex justify-center items-center mt-6 space-x-6 text-sm">
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2"></div>
                    <span>Duração da Parada (min)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-1 border-t-2 border-red-500 mr-2"></div>
                     <div className="w-1 h-1 bg-red-500 rounded-full -ml-3 mr-2"></div>
                    <span>% Acumulada</span>
                </div>
            </div>
        </div>
    );
};

export default ParetoChart;