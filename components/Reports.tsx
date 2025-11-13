import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
// Fix: Imported the 'ActiveShift' type to resolve a TypeScript error.
import { ProductionEntry, ShiftRecord, Operator, ActiveShift } from '../types';
import { exportOperatorReportToPDF } from '../utils/export';

const Reports: React.FC = () => {
    const { settings, shiftHistory, looms, operators, activeShift, openModal } = useAppContext();

    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedShiftName, setSelectedShiftName] = useState<string>('');
    const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
    
    // Reset operator when shift changes
    React.useEffect(() => {
        setSelectedOperatorId('');
    }, [selectedShiftName]);

    const { filteredOperators, reportData } = useMemo(() => {
        const targetDate = new Date(selectedDate);
        targetDate.setUTCHours(0,0,0,0);

        const allPossibleShifts: (ShiftRecord | ActiveShift)[] = [...shiftHistory];
        if(activeShift) {
             const activeShiftDate = new Date(activeShift.userStartTime);
             activeShiftDate.setUTCHours(0,0,0,0);
             if(activeShiftDate.getTime() === targetDate.getTime()) {
                allPossibleShifts.push(activeShift);
             }
        }
        
        const shiftsOnDate = allPossibleShifts.filter(shift => {
            const shiftDate = new Date(shift.userStartTime);
            shiftDate.setUTCHours(0,0,0,0);
            return shiftDate.getTime() === targetDate.getTime();
        });

        const shiftsForFilter = selectedShiftName 
            ? shiftsOnDate.filter(s => s.shiftName === selectedShiftName)
            : shiftsOnDate;

        // Determine relevant operators for the dropdown
        const relevantOperatorIds = new Set<string>();
        shiftsForFilter.forEach(shift => {
            looms.forEach(loom => {
                const operatorId = loom.operatorIds[shift.shiftName];
                if(operatorId) relevantOperatorIds.add(operatorId);
            });
        });

        const filteredOperators = operators.filter(op => relevantOperatorIds.has(op.id));
        
        // Calculate Report Data
        let entries: { time: string, loomCode: string, reading: number, produced: number }[] = [];
        let totalProduced = 0;

        if (selectedOperatorId) {
            const operator = operators.find(op => op.id === selectedOperatorId);
            if (operator) {
                const allEntries: ProductionEntry[] = [];
                shiftsForFilter.forEach(shift => {
                    const operatorLoomIds = looms
                        .filter(loom => loom.operatorIds[shift.shiftName] === selectedOperatorId)
                        .map(loom => loom.id);
                    
                    shift.production.forEach(entry => {
                        if(operatorLoomIds.includes(entry.loomId)) {
                            allEntries.push(entry);
                        }
                    });
                });
                
                const entriesByLoom = allEntries.reduce((acc, entry) => {
                    if (!acc[entry.loomId]) acc[entry.loomId] = [];
                    acc[entry.loomId].push(entry);
                    return acc;
                }, {} as Record<string, ProductionEntry[]>);

                Object.values(entriesByLoom).forEach(loomEntries => {
                    loomEntries.sort((a,b) => a.timestamp - b.timestamp);
                    for(let i = 1; i < loomEntries.length; i++) {
                        const prevEntry = loomEntries[i-1];
                        const currentEntry = loomEntries[i];
                        const produced = Math.max(0, currentEntry.reading - prevEntry.reading);
                        totalProduced += produced;
                        if (currentEntry.notes !== 'Início do turno') {
                             entries.push({
                                time: new Date(currentEntry.timestamp).toLocaleTimeString('pt-BR'),
                                loomCode: looms.find(l => l.id === currentEntry.loomId)?.code || 'N/A',
                                reading: currentEntry.reading,
                                produced: produced
                            });
                        }
                    }
                });
                entries.sort((a,b) => a.time.localeCompare(b.time));
            }
        }
        
        return { filteredOperators, reportData: { entries, totalProduced }};

    }, [selectedDate, selectedShiftName, selectedOperatorId, shiftHistory, activeShift, looms, operators]);

    const handleExport = () => {
        const operatorName = operators.find(op => op.id === selectedOperatorId)?.name || 'N/A';
        const formattedDate = new Date(selectedDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        exportOperatorReportToPDF(operatorName, formattedDate, reportData.entries, reportData.totalProduced);
    };

    const handlePreview = () => {
        const operatorName = operators.find(op => op.id === selectedOperatorId)?.name || 'N/A';
        const formattedDate = new Date(selectedDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        openModal('PDF_PREVIEW', {
            operatorName,
            date: formattedDate,
            entries: reportData.entries,
            totalProduced: reportData.totalProduced
        });
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Relatório por Colaborador</h1>
                <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm"/>
                    <select value={selectedShiftName} onChange={e => setSelectedShiftName(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                        <option value="">Todos os Turnos</option>
                        {settings.shifts.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                    <select value={selectedOperatorId} onChange={e => setSelectedOperatorId(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm bg-white min-w-[180px]">
                         <option value="">Selecione...</option>
                        {filteredOperators.map(op => (
                            <option key={op.id} value={op.id}>{op.name}</option>
                        ))}
                    </select>
                    <button onClick={handlePreview} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400" disabled={reportData.entries.length === 0}>
                        Ver Relatório
                    </button>
                    <button onClick={handleExport} className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400" disabled={reportData.entries.length === 0}>
                        Exportar PDF
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tear</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leitura (m)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produzido</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.entries.length > 0 ? reportData.entries.map((entry, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">{entry.time}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{entry.loomCode}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-mono">{entry.reading.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-700">{entry.produced > 0 ? `+${entry.produced.toFixed(2)} m` : '-'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="text-center text-gray-500 py-8">Nenhum dado encontrado para os filtros selecionados.</td>
                            </tr>
                        )}
                    </tbody>
                     {reportData.entries.length > 0 && (
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan={3} className="px-6 py-3 text-right font-bold text-gray-700">Total Produzido:</td>
                                <td className="px-6 py-3 font-bold text-lg text-gray-900">{reportData.totalProduced.toFixed(2)} m</td>
                            </tr>
                        </tfoot>
                     )}
                </table>
            </div>
        </div>
    );
};

export default Reports;