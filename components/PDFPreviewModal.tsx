import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ModalWrapper } from './ModalManager';

const PDFPreviewModal: React.FC = () => {
    const { modal: { data }, settings } = useAppContext();
    const { operatorName, date, entries, totalProduced } = data;

    return (
        <ModalWrapper title="Visualizar Relatório" size="full">
            <div className="bg-gray-100 p-8 h-full">
                <div className="max-w-4xl mx-auto bg-white p-10 shadow-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b">
                        {settings.companyLogo && <img src={settings.companyLogo} alt="Company Logo" className="h-14 w-14 object-contain" />}
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-800">Relatório Individual de Produção</h2>
                            <p className="text-sm text-gray-500">{settings.companyName}</p>
                        </div>
                        <div className="w-14"></div> {/* Spacer */}
                    </div>

                    {/* Report Info */}
                    <div className="flex justify-between mb-6 text-sm">
                        <p><strong>Operador:</strong> {operatorName}</p>
                        <p><strong>Data:</strong> {date}</p>
                    </div>

                    {/* Table */}
                    <table className="min-w-full divide-y divide-gray-200 border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Horário</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tear</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Leitura (m)</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Produzido</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {entries.length > 0 ? entries.map((entry: any, index: number) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 whitespace-nowrap">{entry.time}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{entry.loomCode}</td>
                                    <td className="px-4 py-2 whitespace-nowrap font-mono">{entry.reading.toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap font-semibold text-green-700">{entry.produced > 0 ? `+${entry.produced.toFixed(2)} m` : '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center text-gray-500 py-8">Nenhum dado encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                        {entries.length > 0 && (
                            <tfoot className="bg-gray-50 border-t-2">
                                <tr>
                                    <td colSpan={3} className="px-4 py-2 text-right font-bold text-gray-700">Total Produzido no Dia:</td>
                                    <td className="px-4 py-2 font-bold text-base text-gray-900">{totalProduced.toFixed(2)} m</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </ModalWrapper>
    );
};

export default PDFPreviewModal;