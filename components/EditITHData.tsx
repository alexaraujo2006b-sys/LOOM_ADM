import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ITHIntervention } from '../types';

const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

const EditITHData: React.FC = () => {
    const { activeShift, looms, settings, openModal, deleteITHIntervention } = useAppContext();

    if (!activeShift) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Nenhum turno ativo.</h2>
                    <p className="text-gray-500">Esta página só está disponível durante um turno ativo.</p>
                </div>
            </div>
        );
    }
    
    const allInterventions = activeShift.ithInterventions.sort((a, b) => b.timestamp - a.timestamp);

    const handleEdit = (intervention: ITHIntervention) => {
        openModal('EDIT_ITH_INTERVENTION', { intervention });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este lançamento de ITH?')) {
            deleteITHIntervention(id);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Editar Lançamentos de ITH (Microparadas)</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                 {allInterventions.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tear</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Causa</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allInterventions.map(intervention => {
                                const loom = looms.find(l => l.id === intervention.loomId);
                                const reason = settings.ithStopReasons.find(r => r.id === intervention.reasonId);
                                return (
                                <tr key={intervention.id}>
                                    <td className="px-4 py-2 whitespace-nowrap">{new Date(intervention.timestamp).toLocaleTimeString('pt-BR')}</td>
                                    <td className="px-4 py-2 whitespace-nowrap font-semibold">{loom?.code || 'N/A'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{reason ? `${reason.code} - ${reason.description}`: 'Causa não encontrada'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right space-x-4">
                                        <button onClick={() => handleEdit(intervention)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><EditIcon className="w-5 h-5 inline"/></button>
                                        <button onClick={() => handleDelete(intervention.id)} className="text-red-600 hover:text-red-900" title="Excluir"><TrashIcon className="w-5 h-5 inline"/></button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                 ) : (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold text-gray-600">Nenhuma microparada (ITH) registrada neste turno.</h3>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default EditITHData;