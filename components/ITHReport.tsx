import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ITHIntervention, Product } from '../types';

const PrinterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
);

interface GroupedITH {
    hour: string;
    interventions: (ITHIntervention & { loomCode: string, reason: string, product: Product | undefined })[];
    total: number;
    lossMinutes: number;
    lossMeters: number;
    lossKg: number;
}

const ITHReport: React.FC = () => {
    const { settings, activeShift, shiftHistory, looms, products } = useAppContext();
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedLoomId, setSelectedLoomId] = useState<string>('all');

    const reportData: GroupedITH[] = useMemo(() => {
        const targetDate = new Date(selectedDate);
        targetDate.setUTCHours(0, 0, 0, 0);

        const allPossibleShifts = [...shiftHistory, ...(activeShift ? [activeShift] : [])];
        
        const shiftsOnDate = allPossibleShifts.filter(shift => {
            const shiftDate = new Date(shift.userStartTime);
            shiftDate.setUTCHours(0, 0, 0, 0);
            return shiftDate.getTime() === targetDate.getTime();
        });

        let interventions = shiftsOnDate.flatMap(s => s.ithInterventions);
        
        if (selectedLoomId !== 'all') {
            interventions = interventions.filter(i => i.loomId === selectedLoomId);
        }

        const groupedByHour = interventions.reduce((acc, intervention) => {
            const hour = new Date(intervention.timestamp).getHours();
            const hourKey = `${String(hour).padStart(2, '0')}:00`;
            if (!acc[hourKey]) {
                acc[hourKey] = [];
            }
            acc[hourKey].push(intervention);
            return acc;
        }, {} as Record<string, ITHIntervention[]>);
        
        return Object.entries(groupedByHour)
            .map(([hour, items]) => {
                let totalLossMeters = 0;
                let totalLossKg = 0;
                const detailedItems = items.map(item => {
                    const loom = looms.find(l => l.id === item.loomId);
                    const reason = settings.ithStopReasons.find(r => r.id === item.reasonId);
                    const product = products.find(p => p.id === loom?.productId);
                    const hourlyGoal = (product && product.threadDensity > 0) ? (product.standardRpm * 60) / (product.threadDensity * 10) : 0;
                    
                    const lossMetersForItem = (1 * hourlyGoal) / 60; // loss for 1 item
                    totalLossMeters += lossMetersForItem;
                    
                    if (product && product.fabricWidthM && product.grammageM2) {
                        const lossKgForItem = (lossMetersForItem * product.fabricWidthM * product.grammageM2) / 1000;
                        totalLossKg += lossKgForItem;
                    }
                    
                    return {
                        ...item,
                        loomCode: loom?.code || 'N/A',
                        reason: reason ? `${reason.code} - ${reason.description}` : 'N/A',
                        product: product
                    }
                })

                return {
                    hour,
                    interventions: detailedItems,
                    total: items.length,
                    lossMinutes: items.length, // 1 min per intervention
                    lossMeters: totalLossMeters,
                    lossKg: totalLossKg,
                };
            })
            .sort((a,b) => a.hour.localeCompare(b.hour));

    }, [selectedDate, selectedLoomId, activeShift, shiftHistory, looms, products, settings]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 space-y-6">
             <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}</style>

            <div className="flex flex-wrap justify-between items-center gap-4 no-print">
                <h1 className="text-3xl font-bold text-gray-800">Relatório de ITH (Microparadas)</h1>
                <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm"/>
                    <select value={selectedLoomId} onChange={e => setSelectedLoomId(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm bg-white min-w-[180px]">
                        <option value="all">Todos os Teares</option>
                        {looms.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                    </select>
                    <button onClick={handlePrint} className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-light-green transition-colors flex items-center gap-2" disabled={reportData.length === 0}>
                        <PrinterIcon className="w-5 h-5" />
                        Imprimir
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md print-container">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b">
                    {settings.companyLogo && <img src={settings.companyLogo} alt="Logo da Empresa" className="h-14 w-14 object-contain" />}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800">Relatório de Intervenção Tear Hora (ITH)</h2>
                        <p className="text-sm text-gray-500">{settings.companyName}</p>
                    </div>
                    <div className="text-right text-sm">
                        <p><strong>Data:</strong> {new Date(selectedDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                        <p><strong>Tear:</strong> {selectedLoomId === 'all' ? 'Todos' : looms.find(l=> l.id === selectedLoomId)?.code}</p>
                    </div>
                </div>
                
                {reportData.length > 0 ? (
                    <div className="space-y-6">
                        {reportData.map(group => (
                            <div key={group.hour}>
                                <div className="bg-gray-100 p-2 rounded-t-lg flex justify-between items-center font-bold">
                                    <h3 className="text-lg">Hora: {group.hour}</h3>
                                    <div className="text-right text-sm space-x-4">
                                        <span>Total: {group.total}</span>
                                        <span>Perda: {group.lossMinutes} min</span>
                                        <span>Perda: {group.lossMeters.toFixed(1)} m</span>
                                        <span>Perda: {group.lossKg.toFixed(2)} kg</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto border rounded-b-lg">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="p-2 text-left font-medium">Horário</th>
                                                <th className="p-2 text-left font-medium">Tear</th>
                                                <th className="p-2 text-left font-medium">Causa da Parada</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.interventions.map(item => (
                                                <tr key={item.id} className="border-t">
                                                    <td className="p-2">{new Date(item.timestamp).toLocaleTimeString('pt-BR')}</td>
                                                    <td className="p-2 font-semibold">{item.loomCode}</td>
                                                    <td className="p-2">{item.reason}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center text-gray-500 py-16">
                        <p className="text-lg">Nenhuma microparada (ITH) registrada para os filtros selecionados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ITHReport;