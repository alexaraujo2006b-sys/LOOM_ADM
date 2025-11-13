import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatDuration } from '../utils/time';
import { Operator, Product, ProductionEntry } from '../types';
import LoomDetailsModal from './LoomDetailsModal';
import PDFPreviewModal from './PDFPreviewModal';

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
                                    ref={el => inputRefs.current[index] = el}
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
    const [shiftName, setShiftName] = useState(settings.shifts[0]?.name || '');
    const operator = modal.data?.operator as Operator | undefined;

    useEffect(() => {
        if (operator) {
            setName(operator.name);
            setShiftName(operator.shiftName);
        }
    }, [operator]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim() || !shiftName) {
            alert('O nome e o turno do operador são obrigatórios.');
            return;
        }
        if(operator) {
            updateOperator(operator.id, name, shiftName);
        } else {
            addOperator(name, shiftName);
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
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');

    useEffect(() => {
        if (product) {
            setName(product.name);
            setGoal(String(product.hourlyProductionGoal));
        }
    }, [product]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numGoal = parseFloat(goal);
        if(!name.trim() || isNaN(numGoal) || numGoal <= 0) {
            alert('Preencha todos os campos com valores válidos.');
            return;
        }
        
        const productData = { name, hourlyProductionGoal: numGoal };
        if(product) {
            updateProduct({ ...product, ...productData });
        } else {
            addProduct(productData);
        }
        closeModal();
    }

    return (
        <ModalWrapper title={product ? 'Editar Produto' : 'Adicionar Produto'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" required autoFocus />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Meta de Produção (m/h)</label>
                    <input type="number" value={goal} onChange={e => setGoal(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm" required />
                </div>
                 <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light-green transition">
                        {product ? 'Salvar Alterações' : 'Adicionar Produto'}
                    </button>
                </div>
            </form>
        </ModalWrapper>
    )
}

const EditProductionEntryModal: React.FC = () => {
    const { modal, updateProductionEntry, closeModal } = useAppContext();
    const entry = modal.data?.entry as ProductionEntry | undefined;
    const [reading, setReading] = useState('');

    useEffect(() => {
        if (entry) {
            setReading(String(entry.reading));
        }
    }, [entry]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numReading = parseFloat(reading);
        if (!entry || isNaN(numReading) || numReading < 0) {
            alert('Por favor, insira um valor de leitura válido.');
            return;
        }
        updateProductionEntry({ ...entry, reading: numReading });
        closeModal();
    };

    if (!entry) return null;

    return (
        <ModalWrapper title={`Editar Leitura do Tear`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Leitura (m)</label>
                    <input
                        type="number"
                        step="any"
                        value={reading}
                        onChange={e => setReading(e.target.value)}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm"
                        required
                        autoFocus
                    />
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-light-green transition">
                        Salvar Alteração
                    </button>
                </div>
            </form>
        </ModalWrapper>
    );
};


const ModalManager: React.FC = () => {
  const { modal } = useAppContext();

  if (!modal.type) {
    return null;
  }

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
    default:
      return null;
  }
};

export default ModalManager;