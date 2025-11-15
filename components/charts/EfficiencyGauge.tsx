import React from 'react';

interface EfficiencyGaugeProps {
  efficiency: number;
  valueFontSize?: number;
}

const EfficiencyGauge: React.FC<EfficiencyGaugeProps> = ({ efficiency, valueFontSize = 18 }) => {
  const getStatusColor = () => {
    if (efficiency >= 90) return '#16a34a'; // green-600
    if (efficiency >= 81) return '#facc15'; // yellow-400
    return '#dc2626'; // red-600
  };

  const cleanEfficiency = Math.max(0, Math.min(100, efficiency));
  const angle = -90 + (cleanEfficiency / 100) * 180;
  
  const endX = 50 + 40 * Math.cos(angle * Math.PI / 180);
  const endY = 50 + 40 * Math.sin(angle * Math.PI / 180);
  
  const largeArcFlag = cleanEfficiency > 50 ? 1 : 0;

  return (
    <div className="relative w-full h-auto" style={{ paddingTop: '50%' }}>
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 50">
        {/* Background Arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#e5e7eb" // gray-200
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Foreground Arc */}
        {cleanEfficiency > 0 && (
            <path
              d={`M 10 50 A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}`}
              fill="none"
              stroke={getStatusColor()}
              strokeWidth="8"
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
            />
        )}
        {/* Text */}
        <text
          x="50"
          y="45"
          textAnchor="middle"
          fontSize={valueFontSize}
          fontWeight="bold"
          fill={getStatusColor()}
        >
          {efficiency.toFixed(0)}%
        </text>
      </svg>
    </div>
  );
};

export default EfficiencyGauge;