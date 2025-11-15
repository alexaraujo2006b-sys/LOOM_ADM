import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatDuration } from '../utils/time';
import { Operator, Product, ProductionEntry, Loom, ITHReason, ITHIntervention, FabricComponent, User, UserRole } from '../types';
import LoomDetailsModal from './LoomDetailsModal';
import PDFPreviewModal from './PDFPreviewModal';
import FullScreenLoomCardModal from './FullScreenLoomCardModal';

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export const ModalWrapper: React.FC<{ title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full' }> = ({ title, children, size = 'md' }) => {
  const { closeModal } = useAppContext();
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    'full': 'max-w-full h-full',
  };

  const isFullScreen = size === 'full';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={closeModal}>
      <div className={`bg-white ${isFullScreen ? 'w-full h-full' : 'rounded-lg w-full ' + sizeClasses[size] } shadow-xl flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 rounded-full p-1">
            <CloseIcon className="w-5 h-5"/>
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const LogProductionModal: React.FC = () => {
    const { looms, activeShift, logProductionReadings } = useAppContext();
    const [readings, setReadings] = useState<{ [key: string]: { reading: string, notes?: string } }>({});
    const [errors, setErrors] = useState<{ [key: string]: string | boolean }>({});
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const lastReadings = useMemo(() => {
        if (!activeShift) return {};
        return looms.reduce((acc, loom) => {
            const loomEntries = activeShift.production
                .filter(p => p.loomId === loom.id)
                .sort((a, b) => b.timestamp - a.timestamp); // most recent first
            if (loomEntries.length > 0) {
                acc[loom.id] = loomEntries[0].reading;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [activeShift, looms]);

    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, looms.length);
        if (inputRefs.current[0]) {
          inputRefs.current[0]?.focus();
        }
    }, [looms]);

    const handleInputChange = (loomId: string, value: string) => {
        setReadings(prev => ({
            ...prev,
            [loomId]: { ...prev[loomId], reading: value }
        }));
        if (errors[loomId]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[loomId];
                return newErrors;
            });
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextInput = inputRefs.current[index + 1];
            if (nextInput) {
                nextInput.focus();
            } else {
                 document.getElementById('log-production-submit')?.focus();
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { [key: string]: string | boolean } = {};
        let firstErrorLoomId: string | null = null;
        let genericError = false;

        const touchedLoomIds = Object.keys(readings);
        if (touchedLoomIds.length === 0) {
            alert('Nenhuma leitura foi inserida.');
            return;
        }

        looms.forEach(loom => {
            const readingData = readings[loom.id];
            // Only validate looms the user has interacted with
            if (!touchedLoomIds.includes(loom.id)) return;
            
            if (!readingData || readingData.reading.trim() === '') {
                newErrors[loom.id] = 'Campo obrigatório.';
                if (!firstErrorLoomId) firstErrorLoomId = loom.id;
                return;
            }
            const readingNum = parseFloat(readingData.reading);
            if (isNaN(readingNum) || readingNum < 0) {
                newErrors[loom.id] = 'Valor inválido.';
                if (!firstErrorLoomId) firstErrorLoomId = loom.id;
                return;
            }
            const lastReading = lastReadings[loom.id];
            if (lastReading !== undefined && readingNum < lastReading) {
                 newErrors[loom.id] = `Valor menor que a última leitura (${lastReading} m).`;
                 if (!firstErrorLoomId) firstErrorLoomId = loom.id;
                 genericError = true;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            if (!genericError) alert('Por favor, corrija os campos inválidos destacados em vermelho.');
            else alert('Erro: Um ou mais valores inseridos são menores que a última leitura registrada. Por favor, corrija.');
            
            const errorIndex = looms.findIndex(l => l.id === firstErrorLoomId);
            if (errorIndex !== -1) {
                inputRefs.current[errorIndex]?.focus();
                inputRefs.current[errorIndex]?.select();
            }
            return;
        }

        const validReadings = Object.keys(readings)
            .map((loomId) => ({
                loomId,
                reading: parseFloat(readings[loomId].reading),
                notes: readings[loomId].notes,
            }))
            .filter(r => !isNaN(r.reading) && r.reading >= 0);

        if (validReadings.length > 0) {
            logProductionReadings(validReadings);
        } else {
            alert('Nenhuma leitura válida para salvar.');
        }
    };
    
    return (
        <ModalWrapper title="Lançar Produção Hora a Hora" size="4xl">
            <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Insira o valor atual do contador de metros para cada tear. A produção será calculada com base na diferença desde a última leitura no turno.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-4">
                        {looms.map((loom, index) => (
                            <div key={loom.id}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <label className="block text-sm font-medium text-gray-700">{loom.code}</label>
                                    <span className="text-xs text-gray-500">Última: {lastReadings[loom.id] ?? '---'} m</span>
                                </div>
                                <input 
                                    type="number" 
                                    step="any"
                                    ref={el => { inputRefs.current[index] = el; }}
                                    value={readings[loom.id]?.reading || ''} 
                                    onChange={e => handleInputChange(loom.id, e.target.value)}
                                    onKeyDown={e => handleKeyDown(e, index)}
                                    className={`p-2 w-full border rounded-md transition-colors ${errors[loom.id] ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-brand-light-green focus:ring-1 focus:ring-brand-light-green'}`}
                                    placeholder="metros"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end pt-8">
                    <button type="submit" id="log-production-submit" className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-brand-light-green transition font-semibold">Salvar Leituras</button>
                </div>
            </form>
        </ModalWrapper>
    );
}

const StopModal: React.FC<{ type: 'maintenance' | 'operational'}> = ({ type }) => {
    const { looms, activeShift, settings, startStop, endStop } = useAppContext();
    const [loomId, setLoomId] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    
    const isMaintenance = type === 'maintenance';

    if (!activeShift) return null;

    const activeStop = loomId ? (isMaintenance ? activeShift.maintenance : activeShift.interventions).find(s => s.loomId === loomId && s.end === null) : null;
    
    const handleSubmitStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loomId || !reason) {
            alert('Por favor, selecione o tear e um motivo para a parada.');
            return;
        }
        startStop(loomId, type, reason, notes);
    }
    
    const handleEnd = () => {
        if(activeStop) {
            endStop(activeStop.id, type);
        }
    }
    
    const title = isMaintenance ? `Parada de Manutenção` : `Intervenção Operacional`;
    const reasons = isMaintenance ? settings.stopReasons.maintenance : settings.stopReasons.operational;
    
    return (
        <ModalWrapper title={title}>
             <div>
                <label className="block text-sm font-medium text-gray-700">Tear</label>
                <select value={loomId} onChange={e => setLoomId(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green" required>
                    <option value="">Selecione um tear...</option>
                    {looms.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                </select>
            </div>
            {loomId && (
                <div className="mt-4">
                {activeStop ? (
                    <div className="text-center space-y-4">
                        <p><strong>Motivo:</strong> {activeStop.reason}</p>
                        <p><strong>Início:</strong> {new Date(activeStop.start).toLocaleTimeString()}</p>
                        <p><strong>Duração:</strong> {formatDuration(Date.now() - activeStop.start)}</p>
                        <button onClick={handleEnd} className={`w-full py-2 rounded-lg text-white font-semibold transition ${isMaintenance ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                            Finalizar Parada
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitStart} className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Motivo da Parada</label>
                            <select value={reason} onChange={e => setReason(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green" required>
                                <option value="">Selecione um motivo...</option>
                                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Observações</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green" rows={3}></textarea>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light-green transition">Iniciar Parada</button>
                        </div>
                    </form>
                )}
                </div>
            )}
        </ModalWrapper>
    );
}

const StartShiftModal: React.FC = () => {
    const { startShift } = useAppContext();
    const [responsible, setResponsible] = useState('');
    const [recorder, setRecorder] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(responsible && recorder) {
            startShift(responsible, recorder);
        } else {
            alert('Preencha todos os campos.');
        }
    }
    
    return (
        <ModalWrapper title="Iniciar Novo Turno">
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Responsável do Turno</label>
                    <input type="text" value={responsible} onChange={e => setResponsible(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green" required autoFocus/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Apontador</label>
                    <input type="text" value={recorder} onChange={e => setRecorder(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green" required/>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">Confirmar Início</button>
                </div>
            </form>
        </ModalWrapper>
    )
}

const EndShiftModal: React.FC = () => {
    const { endShift, activeShift } = useAppContext();
    const [summary, setSummary] = useState('');
    const [actionPlans, setActionPlans] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        endShift(summary, actionPlans);
    }
    
    if (!activeShift) return null;
    
    return (
        <ModalWrapper title={`Encerrar Turno - ${activeShift.shiftName}`}>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Resumo do Turno / Medidas Corretivas</label>
                    <textarea value={summary} onChange={e => setSummary(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green" rows={4}></textarea>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Plano de Ação / Melhorias</label>
                    <textarea value={actionPlans} onChange={e => setActionPlans(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-light-green focus:border-brand-light-green" rows={4}></textarea>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">Confirmar Encerramento</button>
                </div>
            </form>
        </ModalWrapper>
    )
}

const AddEditOperatorModal: React.FC = () => {
    const { modal, addOperator, updateOperator, closeModal, settings } = useAppContext();
    const [name, setName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [role, setRole] = useState('');
    const [shiftName, setShiftName] = useState(settings.shifts[0]?.name || '');
    const operator = modal.data?.operator as Operator | undefined;

    useEffect(() => {
        if (operator) {
            setName(operator.name);
            setShiftName(operator.shiftName);
            setEmployeeId(operator.employeeId);
            setRole(operator.role);
        }
    }, [operator]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim() || !shiftName || !employeeId.trim() || !role.trim()) {
            alert('Todos os campos são obrigatórios.');
            return;
        }
        if(operator) {
            updateOperator(operator.id, name, shiftName, employeeId, role);
        } else {
            addOperator(name, shiftName, employeeId, role);
        }
        closeModal();
    }

    return (
        <ModalWrapper title={operator ? 'Editar Operador' : 'Adicionar Operador'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome do Operador</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" required autoFocus />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Matrícula</label>
                    <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Função</label>
                    <input type="text" value={role} onChange={e => setRole(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Turno Principal</label>
                    <select value={shiftName} onChange={e => setShiftName(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm bg-white" required>
                        {settings.shifts.map(shift => (
                            <option key={shift.name} value={shift.name}>{shift.name}</option>
                        ))}
                    </select>
                </div>
                 <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light-green transition">
                        {operator ? 'Salvar Alterações' : 'Adicionar Operador'}
                    </button>
                </div>
            </form>
        </ModalWrapper>
    )
}

const AddEditProductModal: React.FC = () => {
    const { modal, addProduct, updateProduct, closeModal } = useAppContext();
    const product = modal.data?.product as Product | undefined;
    const [formState, setFormState] = useState<Omit<Product, 'id'>>({
        name: '',
        productCode: '',
        standardRpm: 0,
        threadDensity: 0,
        grammageM2: 0,
        fabricWidthM: 0,
        composition: {
            weft: { dtex: 0, color: '#FFFFFF' },
            warp: { dtex: 0, color: '#FFFFFF' },
            markingWarp: { dtex: 0, color: '#FFFFFF' },
        }
    });

    useEffect(() => {
        if (product) {
            setFormState(product);
        }
    }, [product]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
    
    const handleCompositionChange = (type: 'weft' | 'warp' | 'markingWarp', field: keyof FabricComponent, value: string | number) => {
        setFormState(prev => ({
            ...prev,
            composition: {
                ...prev.composition,
                [type]: {
                    ...prev.composition[type],
                    [field]: typeof value === 'string' && field !== 'color' ? parseFloat(value) || 0 : value,
                }
            }
        }));
    }

    const calculatedGoal = useMemo(() => {
        const { standardRpm, threadDensity } = formState;
        if (!isNaN(standardRpm) && !isNaN(threadDensity) && threadDensity > 0) {
            return (standardRpm * 60) / (threadDensity * 10);
        }
        return 0;
    }, [formState.standardRpm, formState.threadDensity]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.name.trim() || !formState.productCode.trim() || formState.standardRpm <= 0 || formState.threadDensity <= 0 || formState.grammageM2 <= 0 || formState.fabricWidthM <= 0) {
            alert('Preencha todos os campos principais com valores válidos e positivos.');
            return;
        }

        if(product) {
            updateProduct({ ...product, ...formState });
        } else {
            addProduct(formState);
        }
        closeModal();
    }
    const inputStyle = "mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm";
    const labelStyle = "block text-sm font-medium text-gray-700";

    return (
        <ModalWrapper title={product ? 'Editar Produto' : 'Adicionar Produto'} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelStyle}>Nome do Produto</label><input type="text" name="name" value={formState.name} onChange={handleChange} className={inputStyle} required autoFocus /></div>
                    <div><label className={labelStyle}>Código do Produto</label><input type="text" name="productCode" value={formState.productCode} onChange={handleChange} className={inputStyle} required /></div>
                </fieldset>
                
                 {/* Technical Specs */}
                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelStyle}>RPM Padrão</label><input type="number" name="standardRpm" value={formState.standardRpm} onChange={handleChange} className={inputStyle} required /></div>
                    <div><label className={labelStyle}>Fios por 10cm</label><input type="number" name="threadDensity" value={formState.threadDensity} onChange={handleChange} className={inputStyle} required /></div>
                    <div><label className={labelStyle}>Gramatura (g/m²)</label><input type="number" name="grammageM2" value={formState.grammageM2} onChange={handleChange} className={inputStyle} required /></div>
                    <div><label className={labelStyle}>Largura do Tecido (m)</label><input type="number" step="0.01" name="fabricWidthM" value={formState.fabricWidthM} onChange={handleChange} className={inputStyle} required /></div>
                </fieldset>

                {/* Composition */}
                <fieldset>
                    <legend className="text-base font-medium text-gray-900 mb-2 border-b pb-1">Composição do Tecido</legend>
                    <div className="text-xs text-gray-500 mb-3 -mt-2">Taxa de consumo padrão: Trama 48% e Urdume 52% do peso do tecido.</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                        {/* Weft */}
                        <div>
                            <h4 className="font-medium text-sm text-center mb-1">Trama</h4>
                            <div className="flex gap-2">
                                <input type="number" placeholder="DTEX" value={formState.composition.weft.dtex} onChange={e => handleCompositionChange('weft', 'dtex', e.target.value)} className={`${inputStyle} mt-0 p-1 text-sm`} />
                                <input type="color" value={formState.composition.weft.color} onChange={e => handleCompositionChange('weft', 'color', e.target.value)} className="p-0.5 h-8 w-10 border border-gray-300 rounded-md" />
                            </div>
                        </div>
                        {/* Warp */}
                        <div>
                           <h4 className="font-medium text-sm text-center mb-1">Urdume</h4>
                            <div className="flex gap-2">
                                <input type="number" placeholder="DTEX" value={formState.composition.warp.dtex} onChange={e => handleCompositionChange('warp', 'dtex', e.target.value)} className={`${inputStyle} mt-0 p-1 text-sm`} />
                                <input type="color" value={formState.composition.warp.color} onChange={e => handleCompositionChange('warp', 'color', e.target.value)} className="p-0.5 h-8 w-10 border border-gray-300 rounded-md" />
                            </div>
                        </div>
                         {/* Marking Warp */}
                        <div>
                            <h4 className="font-medium text-sm text-center mb-1">Urdume Marcação</h4>
                            <div className="flex gap-2">
                                <input type="number" placeholder="DTEX" value={formState.composition.markingWarp.dtex} onChange={e => handleCompositionChange('markingWarp', 'dtex', e.target.value)} className={`${inputStyle} mt-0 p-1 text-sm`} />
                                <input type="color" value={formState.composition.markingWarp.color} onChange={e => handleCompositionChange('markingWarp', 'color', e.target.value)} className="p-0.5 h-8 w-10 border border-gray-300 rounded-md" />
                            </div>
                        </div>
                    </div>
                </fieldset>

                {/* Calculated Goal */}
                <div className="text-center p-3 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-600">Meta de Produção Calculada</p>
                    <p className="font-bold text-lg text-brand-green">{calculatedGoal.toFixed(2)} m/h</p>
                </div>
                
                 <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-brand-light-green transition font-semibold">
                        {product ? 'Salvar Alterações' : 'Adicionar Produto'}
                    </button>
                </div>
            </form>
        </ModalWrapper>
    )
}

const EditProductionEntryModal: React.FC = () => {
    const { modal, updateProductionEntry, looms } = useAppContext();
    const entry = modal.data.entry as ProductionEntry;
    const [reading, setReading] = useState(entry.reading.toString());
    const [timestamp, setTimestamp] = useState(new Date(entry.timestamp).toISOString().slice(0, 16));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const readingNum = parseFloat(reading);
        if (isNaN(readingNum) || readingNum < 0) {
            alert("Leitura inválida.");
            return;
        }
        updateProductionEntry({
            ...entry,
            reading: readingNum,
            timestamp: new Date(timestamp).getTime(),
        });
    }

    const loomCode = looms.find(l => l.id === entry.loomId)?.code || 'N/A';

    return (
        <ModalWrapper title={`Editar Lançamento - Tear ${loomCode}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Leitura (m)</label>
                    <input type="number" step="any" value={reading} onChange={e => setReading(e.target.value)} className="mt-1 p-2 w-full border rounded-md" required autoFocus />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Horário</label>
                    <input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} className="mt-1 p-2 w-full border rounded-md" required />
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light-green">Salvar</button>
                </div>
            </form>
        </ModalWrapper>
    )
}

const LogQualityModal: React.FC = () => {
    const { looms, logQualityEntry, closeModal } = useAppContext();
    const [loomId, setLoomId] = useState('');
    const [residueKg, setResidueKg] = useState('');
    const [offSpecFabricMeters, setOffSpecFabricMeters] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!loomId) {
            alert("Por favor, selecione um tear.");
            return;
        }
        logQualityEntry({
            loomId,
            residueKg: parseFloat(residueKg) || 0,
            offSpecFabricMeters: parseFloat(offSpecFabricMeters) || 0,
            notes,
        });
    }
    
    return (
        <ModalWrapper title="Lançamento de Qualidade">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tear</label>
                    <select value={loomId} onChange={e => setLoomId(e.target.value)} className="mt-1 p-2 w-full border rounded-md bg-white" required>
                        <option value="">Selecione...</option>
                        {looms.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Resíduos (kg)</label>
                    <input type="number" step="any" value={residueKg} onChange={e => setResidueKg(e.target.value)} className="mt-1 p-2 w-full border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tecido Fora de Especificação (m)</label>
                    <input type="number" step="any" value={offSpecFabricMeters} onChange={e => setOffSpecFabricMeters(e.target.value)} className="mt-1 p-2 w-full border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Observações</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 p-2 w-full border rounded-md" />
                </div>
                 <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light-green">Salvar Lançamento</button>
                </div>
            </form>
        </ModalWrapper>
    );
}

const LogITHModal: React.FC = () => {
    const { modal, logITHIntervention, settings } = useAppContext();
    const { loomId } = modal.data;

    const handleReasonClick = (reasonId: string) => {
        logITHIntervention(loomId, reasonId);
    }
    
    return (
        <ModalWrapper title="Registrar Microparada (ITH)" size="2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {settings.ithStopReasons.map(reason => (
                    <button 
                        key={reason.id} 
                        onClick={() => handleReasonClick(reason.id)}
                        className="p-4 border rounded-lg text-left hover:bg-gray-100 transition"
                    >
                        <span className="font-bold text-gray-800">{reason.code}</span>
                        <p className="text-sm text-gray-600">{reason.description}</p>
                    </button>
                ))}
            </div>
        </ModalWrapper>
    )
}

const AddEditITHReasonModal: React.FC = () => {
    const { modal, addIthStopReason, updateIthStopReason } = useAppContext();
    const { reason, isEditing } = modal.data;
    const [code, setCode] = useState(isEditing ? reason.code : '');
    const [description, setDescription] = useState(isEditing ? reason.description : '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            updateIthStopReason({ ...reason, code, description });
        } else {
            addIthStopReason({ code, description });
        }
    }
    
    return (
        <ModalWrapper title={isEditing ? 'Editar Causa de ITH' : 'Adicionar Causa de ITH'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Código</label>
                    <input type="text" value={code} onChange={e => setCode(e.target.value)} className="mt-1 p-2 w-full border rounded-md" required autoFocus />
                </div>
                 <div>
                    <label className="block text-sm font-medium">Descrição</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 p-2 w-full border rounded-md" required />
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light-green">Salvar</button>
                </div>
            </form>
        </ModalWrapper>
    );
};

const EditITHInterventionModal: React.FC = () => {
    const { modal, looms, settings, updateITHIntervention } = useAppContext();
    const intervention = modal.data.intervention as ITHIntervention;
    const [reasonId, setReasonId] = useState(intervention.reasonId);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateITHIntervention({ ...intervention, reasonId });
    };

    const loomCode = looms.find(l => l.id === intervention.loomId)?.code || 'N/A';
    
    return (
         <ModalWrapper title={`Editar ITH - ${loomCode}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium">Causa</label>
                    <select value={reasonId} onChange={e => setReasonId(e.target.value)} className="mt-1 p-2 w-full border rounded-md bg-white">
                        {settings.ithStopReasons.map(r => <option key={r.id} value={r.id}>{r.code} - {r.description}</option>)}
                    </select>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light-green">Salvar</button>
                </div>
            </form>
        </ModalWrapper>
    )
}

const AddEditUserModal: React.FC = () => {
    const { modal, addUser, updateUser, closeModal } = useAppContext();
    const user = modal.data?.user as User | undefined;
    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(user?.role || 'viewer');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || (!user && !password.trim())) {
            alert('Usuário e senha são obrigatórios.');
            return;
        }

        if (user) {
            updateUser(user.id, username, role, password || undefined);
        } else {
            addUser(username, role, password);
        }
    };
    
    return (
        <ModalWrapper title={user ? "Editar Usuário" : "Adicionar Usuário"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Nome de Usuário</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 p-2 w-full border rounded-md" required autoFocus />
                </div>
                 <div>
                    <label className="block text-sm font-medium">Senha</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 p-2 w-full border rounded-md" placeholder={user ? "Deixe em branco para não alterar" : ""} required={!user} />
                </div>
                 <div>
                    <label className="block text-sm font-medium">Nível de Acesso</label>
                    <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="mt-1 p-2 w-full border rounded-md bg-white">
                        <option value="admin">Administrador</option>
                        <option value="viewer">Visualizador</option>
                    </select>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light-green">Salvar</button>
                </div>
            </form>
        </ModalWrapper>
    );
};

// Fix: Added the main ModalManager component and default export.
const ModalManager: React.FC = () => {
    const { modal } = useAppContext();
    if (!modal.type) return null;

    switch (modal.type) {
        case 'LOG_PRODUCTION':
            return <LogProductionModal />;
        case 'MANAGE_MAINTENANCE':
            return <StopModal type="maintenance" />;
        case 'MANAGE_INTERVENTION':
            return <StopModal type="operational" />;
        case 'START_SHIFT':
            return <StartShiftModal />;
        case 'END_SHIFT':
            return <EndShiftModal />;
        case 'ADD_EDIT_OPERATOR':
            return <AddEditOperatorModal />;
        case 'ADD_EDIT_PRODUCT':
            return <AddEditProductModal />;
        case 'LOOM_DETAILS':
            return <LoomDetailsModal />;
        case 'EDIT_PRODUCTION_ENTRY':
            return <EditProductionEntryModal />;
        case 'PDF_PREVIEW':
            return <PDFPreviewModal />;
        case 'LOG_QUALITY':
            return <LogQualityModal />;
        case 'LOG_ITH':
            return <LogITHModal />;
        case 'FULLSCREEN_LOOM_CARD':
            return <FullScreenLoomCardModal />;
        case 'ADD_EDIT_ITH_REASON':
            return <AddEditITHReasonModal />;
        case 'EDIT_ITH_INTERVENTION':
            return <EditITHInterventionModal />;
        case 'ADD_EDIT_USER':
            return <AddEditUserModal />;
        case 'LOOM_HISTORY_CHART':
            return null; // No component specified for this modal type
        default:
            return null;
    }
};

export default ModalManager;
