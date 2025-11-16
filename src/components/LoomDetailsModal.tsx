"use client";

import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useAppContext } from '@/context/AppContext';
import { ModalWrapper } from '@/components/ModalManager';
import { formatDuration } from '@/utils/time';
import { Loom, Product, Operator, ProductionEntry, MaintenanceStop, OperationalIntervention } from '@/types';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-brand-green"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-brand-green" style={{animationDelay: '0.2s'}}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-brand-green" style={{animationDelay: '0.4s'}}></div>
    </div>
);

const LoomDetailsModal: React.FC = () => {
    const { modal: { data }, activeShift, looms, products, operators, settings } = useAppContext();
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);

    const loom: Loom | undefined = useMemo(() => looms.find(l => l.id === data.loomId), [looms, data.loomId]);

    const { product, operator, hourlyProduction, stops } = useMemo(() => {
        if (!loom || !activeShift) return { product: undefined, operator: undefined, hourlyProduction: [], stops: [] };

        const product = products.find(p => p.id === loom.productId);
        const operatorId = loom.operatorIds[activeShift.shiftName];
        const operator = operators.find(o => o.id === operatorId);
        
        const productionEntries = activeShift.production.filter(p => p.loomId === loom.id).sort((a,b) => a.timestamp - b.timestamp);
        const maintenanceStops = activeShift.maintenance.filter(s => s.loomId === loom.id);
        const operationalStops = activeShift.interventions.filter(s => s.loomId === loom.id);
        const allStops = [...maintenanceStops, ...operationalStops].sort((a,b) => a.start - b.start);
        
        const hourlyProd: { hour: string, production: number }[] = [];

        if(productionEntries.length > 1) {
            let lastReadingEntry = productionEntries[0];
            for (let i = 1; i < productionEntries.length; i++) {
                const currentEntry = productionEntries[i];
                const hour = new Date(currentEntry.timestamp).getHours();
                const production = currentEntry.reading - lastReadingEntry.reading;
                const hourLabel = `${String(hour).padStart(2, '0')}:00`;

                const existingHour = hourlyProd.find(h => h.hour === hourLabel);
                if (existingHour) {
                    existingHour.production += Math.max(0, production);
                } else {
                    hourlyProd.push({ hour: hourLabel, production: Math.max(0, production) });
                }
                lastReadingEntry = currentEntry;
            }
        }

        return { product, operator, hourlyProduction: hourlyProd, stops: allStops };
    }, [loom, activeShift, products, operators]);

    const hourlyProductionGoal = useMemo(() => {
        if (product && product.threadDensity > 0) {
            return (product.standardRpm * 60) / (product.threadDensity * 10);
        }
        return 0;
    }, [product]);


    const handleGenerateAnalysis = async () => {
        if (!loom || !product || !activeShift) return;
        setLoading(true);
        setAnalysis('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const hourlyDataString = hourlyProduction.map(h => `- ${h.hour}: ${h.production.toFixed(0)} metros`).join('\n');
            const stopsDataString = stops.map(s => `- Motivo: ${s.reason}, Duração: ${formatDuration((s.end || Date.now()) - s.start)}`).join('\n') || 'Nenhuma';
            const shiftEndTime = settings.shifts.find(s => s.name === activeShift.shiftName)?.end || 'N/A';

            const prompt = `Você é um especialista em produção têxtil. Analise os seguintes dados de um tear e forneça um relatório conciso em markdown.
### Dados do Tear:
- **Código:** ${loom.code}
- **Produto:** ${product.name}
- **Meta de Produção por Hora:** ${hourlyProductionGoal.toFixed(2)} m/h

### Produção por Hora:
${hourlyDataString}

### Paradas Registradas:
${stopsDataString}

---

### Seu Relatório de Análise:

**1. Análise da Evolução da Produção:**
A produção está constante, aumentando ou diminuindo? Há alguma hora com produção muito baixa ou alta? Comente sobre a performance em relação à meta.

**2. Análise de Paradas:**
Quais os principais motivos de parada? Existe algum padrão de horário ou tipo de parada?

**3. Projeção para o Fim do Turno:**
Com base na eficiência média atual, qual a produção total projetada para o fim do turno às ${shiftEndTime}?

**4. Recomendações:**
Dê 2 a 3 sugestões práticas e diretas para melhorar a eficiência deste tear com base nos dados apresentados.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setAnalysis(response.text);
        } catch (error) {
            console.error("Error generating analysis:", error);
            setAnalysis("Ocorreu um erro ao gerar a análise. Verifique a chave de API e tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (!loom) return null;

    return (
        <ModalWrapper title={`Detalhes do Tear - ${loom.code}`} size="2xl">
            <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-sm text-gray-500">Produto</p>
                        <p className="font-semibold text-gray-800">{product?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Operador do Turno</p>
                        <p className="font-semibold text-gray-800">{operator?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Meta por Hora</p>
                        <p className="font-semibold text-gray-800">{hourlyProductionGoal.toFixed(2) || 'N/A'} m/h</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        {/* Hourly Production */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Produção Hora a Hora</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium">Hora</th>
                                            <th className="px-4 py-2 text-right font-medium">Produção (m)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {hourlyProduction.length > 0 ? hourlyProduction.map(h => (
                                            <tr key={h.hour}>
                                                <td className="px-4 py-2">{h.hour}</td>
                                                <td className="px-4 py-2 text-right font-mono">{h.production.toFixed(0)}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={2} className="text-center p-4 text-gray-500">Nenhum dado de produção horária ainda.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Stops */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Histórico de Paradas</h4>
                             <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium">Motivo</th>
                                            <th className="px-4 py-2 text-right font-medium">Duração</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {stops.length > 0 ? stops.map(s => (
                                            <tr key={s.id}>
                                                <td className="px-4 py-2">{s.reason}</td>
                                                <td className="px-4 py-2 text-right">{formatDuration((s.end || Date.now()) - s.start)}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={2} className="text-center p-4 text-gray-500">Nenhuma parada registrada.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - AI Analysis */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                             <h4 className="font-semibold text-gray-700">Análise de Dados com IA</h4>
                             <button onClick={handleGenerateAnalysis} disabled={loading} className="bg-brand-green text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-brand-light-green disabled:bg-gray-400">
                                {loading ? <LoadingSpinner/> : 'Gerar Análise'}
                             </button>
                        </div>
                        <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px] prose prose-sm max-w-none">
                            {loading && <p className="text-gray-500">Analisando dados, por favor aguarde...</p>}
                            {analysis ? (
                                <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            ) : !loading && (
                                <p className="text-gray-400">Clique em "Gerar Análise" para obter insights sobre o desempenho do tear.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ModalWrapper>
    );
};

export default LoomDetailsModal;
