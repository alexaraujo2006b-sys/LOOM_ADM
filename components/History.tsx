

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ShiftRecord } from '../types';
import { exportToExcel, exportToPDF } from '../utils/export';

const History: React.FC = () => {
  const { shiftHistory, looms, operators, products, settings } = useAppContext();
  const [filter, setFilter] = useState({ date: '', operator: '' });

  const calculateTotalProduction = (record: ShiftRecord): number => {
    let total = 0;
    looms.forEach(loom => {
        const entries = record.production.filter(p => p.loomId === loom.id).sort((a,b) => a.timestamp - b.timestamp);
        if (entries.length > 1) {
            total += entries[entries.length - 1].reading - entries[0].reading;
        }
    });
    return total;
  };

  const filteredHistory = useMemo(() => shiftHistory.filter(record => {
    const recordDate = new Date(record.userStartTime).toLocaleDateString('pt-BR');
    const filterDate = filter.date ? new Date(filter.date + 'T00:00:00').toLocaleDateString('pt-BR') : '';
    const dateMatch = !filter.date || recordDate === filterDate;
    const operatorMatch = !filter.operator || record.responsible.toLowerCase().includes(filter.operator.toLowerCase());
    return dateMatch && operatorMatch;
  }).sort((a,b) => b.userStartTime - a.userStartTime), [shiftHistory, filter]);

  const handleExportPDF = (record: ShiftRecord) => {
    exportToPDF(record, looms, operators, products, settings);
  }

  const handleExportExcel = (record: ShiftRecord) => {
    exportToExcel(record, looms, operators, products, settings, `Turno_${record.shiftName}_${new Date(record.userStartTime).toLocaleDateString('pt-BR')}`);
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Histórico de Turnos</h1>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">Filtrar por Data</label>
          <input 
            type="date" 
            id="date-filter"
            value={filter.date}
            onChange={e => setFilter({...filter, date: e.target.value})}
            className="mt-1 p-2 border rounded-md"
          />
        </div>
        <div>
          <label htmlFor="operator-filter" className="block text-sm font-medium text-gray-700">Filtrar por Responsável</label>
          <input 
            type="text" 
            id="operator-filter"
            placeholder="Nome do responsável"
            value={filter.operator}
            onChange={e => setFilter({...filter, operator: e.target.value})}
            className="mt-1 p-2 border rounded-md"
          />
        </div>
      </div>

      {/* Tabela de Histórico */}
      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
        {shiftHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum turno foi encerrado ainda.</p>
        ) : (
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produção Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map(record => {
                    const totalProduction = calculateTotalProduction(record);
                    return (
                        <tr key={record.userStartTime}>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(record.userStartTime).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{record.shiftName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{record.responsible}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-semibold">{totalProduction.toFixed(0)} m</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button onClick={() => handleExportPDF(record)} className="text-red-600 hover:text-red-900">PDF</button>
                                <button onClick={() => handleExportExcel(record)} className="text-green-600 hover:text-green-900">Excel</button>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
            </table>
        )}
      </div>
    </div>
  );
};

export default History;