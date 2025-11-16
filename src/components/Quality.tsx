import React from 'react';
import { useAppContext } from '@/context/AppContext';

const Quality: React.FC = () => {
    const { activeShift, looms, openModal } = useAppContext();

    if (!activeShift) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Nenhum turno ativo.</h2>
                    <p className="text-gray-500">Por favor, inicie um novo turno para registrar dados de qualidade.</p>
                </div>
            </div>
        );
    }

    const allQualityEntries = activeShift.qualityEntries.map(entry => {
        const loom = looms.find(l => l.id === entry.loomId);
        return { ...entry, loomCode: loom?.code || 'N/A' };
    }).sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Controle de Qualidade</h1>
                <button 
                    onClick={() => openModal('LOG_QUALITY')} 
                    className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-light-green transition-colors"
                >
                    Adicionar Lançamento
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tear</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resíduos (kg)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fora de Espec. (m)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allQualityEntries.map(entry => (
                            <tr key={entry.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(entry.timestamp).toLocaleTimeString('pt-BR')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.loomCode}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.residueKg.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.offSpecFabricMeters.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate"