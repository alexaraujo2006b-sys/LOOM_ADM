import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import HourlyProductionChart from './charts/HourlyProductionChart';

const Graphs: React.FC = () => {
    const { looms, activeShift } = useAppContext();
    const [selectedLoomId, setSelectedLoomId] = useState<string>(looms[0]?.id || '');

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Gráficos de Produção</h1>
                <div>
                    <label htmlFor="loom-select" className="text-sm font-medium text-gray-700 mr-2">Selecione o Tear:</label>
                    <select
                        id="loom-select"
                        value={selectedLoomId}
                        onChange={(e) => setSelectedLoomId(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm bg-white"
                    >
                        {looms.map(loom => (
                            <option key={loom.id} value={loom.id}>{loom.code}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md min-h-[400px] flex flex-col">
                {!activeShift ? (
                    <p className="m-auto text-center text-gray-500">Nenhum turno ativo para exibir gráficos.</p>
                ) : selectedLoomId ? (
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Produção Hora a Hora - {looms.find(l => l.id === selectedLoomId)?.code}</h2>
                        <HourlyProductionChart loomId={selectedLoomId} />
                    </div>
                ) : (
                    <p className="m-auto text-center text-gray-500">Selecione um tear para visualizar o gráfico.</p>
                )}
            </div>
        </div>
    );
};

export default Graphs;
