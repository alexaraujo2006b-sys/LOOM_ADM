import React, { createContext, useContext, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Loom, Settings, ActiveShift, ShiftRecord, ModalState, ModalType, ProductionEntry, MaintenanceStop, OperationalIntervention, Operator, Product } from '../types';
import { getCurrentShift, getShiftStartDate } from '../utils/time';

// --- INITIAL DATA ---
const initialOperators: Operator[] = [
  { id: 'op-1', name: 'João Silva', shiftName: '1º Turno' },
  { id: 'op-2', name: 'Maria Oliveira', shiftName: '2º Turno' },
  { id: 'op-3', name: 'Carlos Pereira', shiftName: '3º Turno' },
];

const initialProducts: Product[] = [
  { id: 'prod-1', name: 'Tecido Padrão A', hourlyProductionGoal: 15 },
  { id: 'prod-2', name: 'Tecido Especial B', hourlyProductionGoal: 12.5 },
];

const initialSettings: Settings = {
  efficiencyGoal: 90,
  hourlyProductionGoal: 15,
  shifts: [
    { name: '1º Turno', start: '06:00', end: '14:20' },
    { name: '2º Turno', start: '14:20', end: '22:40' },
    { name: '3º Turno', start: '22:40', end: '06:00' },
  ],
  stopReasons: {
    maintenance: ['Elétrica', 'Mecânica', 'Preventiva', 'Outra'],
    operational: ['Falta de material', 'Troca de artigo', 'Limpeza', 'Outra'],
  },
};

const initialLooms: Loom[] = Array.from({ length: 15 }, (_, i) => {
    const op1 = initialOperators.find(o => o.shiftName === initialSettings.shifts[0].name)?.id || initialOperators[0].id;
    const op2 = initialOperators.find(o => o.shiftName === initialSettings.shifts[1].name)?.id || initialOperators[1].id;
    const op3 = initialOperators.find(o => o.shiftName === initialSettings.shifts[2].name)?.id || initialOperators[2].id;
    return {
        id: `LOHIA-NOVA6-${i + 1}`,
        code: `T-${String(i + 1).padStart(2, '0')}`,
        sector: 'Leves',
        operatorIds: {
            [initialSettings.shifts[0].name]: op1,
            [initialSettings.shifts[1].name]: op2,
            [initialSettings.shifts[2].name]: op3,
        },
        productId: initialProducts[i % initialProducts.length].id,
        nominalSpeed: 650,
        threadDensity: 40,
    }
});

// --- CONTEXT TYPE DEFINITION ---
interface AppContextType {
  looms: Loom[];
  setLooms: React.Dispatch<React.SetStateAction<Loom[]>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  operators: Operator[];
  addOperator: (name: string, shiftName: string) => void;
  updateOperator: (id: string, name: string, shiftName: string) => void;
  deleteOperator: (id: string) => void;
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addStopReason: (type: 'maintenance' | 'operational', reason: string) => void;
  activeShift: ActiveShift | null;
  shiftHistory: ShiftRecord[];
  modal: ModalState;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  updateLoomData: (loomId: string, data: Partial<Loom>) => void;
  startShift: (responsible: string, recorder: string) => void;
  endShift: (summary: string, actionPlans: string) => void;
  logProductionReadings: (readings: { loomId: string, reading: number, notes?: string }[]) => void;
  updateProductionEntry: (entry: ProductionEntry) => void;
  deleteProductionEntry: (entryId: string) => void;
  startStop: (loomId: string, type: 'maintenance' | 'operational', reason: string, notes?: string) => void;
  endStop: (stopId: string, type: 'maintenance' | 'operational') => void;
  exportActiveShiftToExcel: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [looms, setLooms] = useLocalStorage<Loom[]>('looms', initialLooms);
  const [settings, setSettings] = useLocalStorage<Settings>('settings', initialSettings);
  const [operators, setOperators] = useLocalStorage<Operator[]>('operators', initialOperators);
  const [products, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
  const [activeShift, setActiveShift] = useLocalStorage<ActiveShift | null>('activeShift', null);
  const [shiftHistory, setShiftHistory] = useLocalStorage<ShiftRecord[]>('shiftHistory', []);
  const [modal, setModal] = useState<ModalState>({ type: null, data: null });

  const openModal = (type: ModalType, data: any = null) => setModal({ type, data });
  const closeModal = () => setModal({ type: null, data: null });

  // Operator CRUD
  const addOperator = (name: string, shiftName: string) => {
    const newOperator = { id: `op-${Date.now()}`, name, shiftName };
    setOperators(prev => [...prev, newOperator]);
  };
  const updateOperator = (id: string, name: string, shiftName: string) => {
    setOperators(prev => prev.map(op => op.id === id ? { ...op, name, shiftName } : op));
  };
  const deleteOperator = (id: string) => {
    setOperators(prev => prev.filter(op => op.id !== id));
  };
  
  // Product CRUD
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { id: `prod-${Date.now()}`, ...product };
    setProducts(prev => [...prev, newProduct]);
  };
  const updateProduct = (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  };
  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };
  
  // Settings
  const addStopReason = (type: 'maintenance' | 'operational', reason: string) => {
    if(!reason || !reason.trim()) return;
    setSettings(prev => {
        const existingReasons = prev.stopReasons[type];
        if (existingReasons.includes(reason.trim())) {
            alert(`"${reason.trim()}" já existe.`);
            return prev;
        }
        return {
            ...prev,
            stopReasons: {
                ...prev.stopReasons,
                [type]: [...existingReasons, reason.trim()]
            }
        }
    });
  }


  const updateLoomData = (loomId: string, data: Partial<Loom>) => {
    setLooms(prev => prev.map(loom => loom.id === loomId ? {...loom, ...data} : loom));
  }
  
  const startShift = (responsible: string, recorder: string) => {
    const currentShiftDetails = getCurrentShift(settings.shifts);
    if (!currentShiftDetails) {
      alert("Não foi possível determinar o turno atual. Verifique as configurações de horário.");
      return;
    }
    const shiftStartDate = getShiftStartDate(currentShiftDetails);
    
    // Create a baseline "0" reading for every loom at the start of the shift
    const baselineEntries: ProductionEntry[] = looms.map(loom => ({
        id: `prod-start-${shiftStartDate.getTime()}-${loom.id}`,
        loomId: loom.id,
        reading: 0,
        timestamp: shiftStartDate.getTime(),
        notes: 'Início do turno'
    }));
      
    setActiveShift({
        shiftName: currentShiftDetails.name,
        shiftStartTime: shiftStartDate.getTime(),
        userStartTime: Date.now(),
        responsible,
        recorder,
        production: baselineEntries,
        maintenance: [],
        interventions: []
    });
    closeModal();
    alert(`Turno "${currentShiftDetails.name}" iniciado com sucesso!`);
  };
  
  const endShift = (summary: string, actionPlans: string) => {
    if (!activeShift) return;
    const shiftRecord: ShiftRecord = {
      ...activeShift,
      end: Date.now(),
      summary,
      actionPlans,
    };
    setShiftHistory(prev => [shiftRecord, ...prev]);
    setActiveShift(null);
    closeModal();
    alert("Turno encerrado com sucesso.");
  };

  const logProductionReadings = (readings: { loomId: string, reading: number, notes?: string }[]) => {
    if (!activeShift) return;
    const now = Date.now();
    const newEntries: ProductionEntry[] = readings
      .filter(r => !isNaN(r.reading) && r.reading >= 0)
      .map(r => ({
        id: `prod-${now}-${r.loomId}`,
        loomId: r.loomId,
        reading: r.reading,
        timestamp: now,
        notes: r.notes,
      }));

    if (newEntries.length > 0) {
      setActiveShift(prev => prev ? { ...prev, production: [...prev.production, ...newEntries] } : null);
    }
    closeModal();
  };

  const updateProductionEntry = (entry: ProductionEntry) => {
    if (!activeShift) return;
    setActiveShift(prev => {
        if (!prev) return null;
        const updatedProduction = prev.production.map(p => p.id === entry.id ? entry : p);
        return { ...prev, production: updatedProduction };
    });
    closeModal();
  };
  
  const deleteProductionEntry = (entryId: string) => {
      if (!activeShift) return;
      setActiveShift(prev => {
          if (!prev) return null;
          // Prevent deleting the initial "0" entry
          const entryToDelete = prev.production.find(p => p.id === entryId);
          if(entryToDelete?.notes === 'Início do turno') {
              alert('Não é possível excluir o lançamento inicial do turno.');
              return prev;
          }
          const updatedProduction = prev.production.filter(p => p.id !== entryId);
          return { ...prev, production: updatedProduction };
      });
  };

  const startStop = (loomId: string, type: 'maintenance' | 'operational', reason: string, notes?: string) => {
    if (!activeShift) return;
    const newStop = {
      id: `${type}-${Date.now()}`,
      loomId,
      start: Date.now(),
      end: null,
      reason,
      notes,
    };
    if (type === 'maintenance') {
      setActiveShift(prev => prev ? { ...prev, maintenance: [...prev.maintenance, newStop as MaintenanceStop] } : null);
    } else {
      setActiveShift(prev => prev ? { ...prev, interventions: [...prev.interventions, newStop as OperationalIntervention] } : null);
    }
    closeModal();
  };

  const endStop = (stopId: string, type: 'maintenance' | 'operational') => {
    if (!activeShift) return;
    const now = Date.now();
    if (type === 'maintenance') {
      setActiveShift(prev => prev ? { 
        ...prev, 
        maintenance: prev.maintenance.map(s => s.id === stopId ? { ...s, end: now } : s) 
      } : null);
    } else {
      setActiveShift(prev => prev ? { 
        ...prev, 
        interventions: prev.interventions.map(i => i.id === stopId ? { ...i, end: now } : i) 
      } : null);
    }
    closeModal();
  };

  const exportActiveShiftToExcel = () => {
    if (!activeShift) {
        alert("Nenhum turno ativo para exportar.");
        return;
    }
    import('../utils/export').then(({ exportToExcel }) => {
      exportToExcel(activeShift, looms, operators, products, `Turno_${activeShift.shiftName}_${new Date().toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})}`);
    });
  };


  const value: AppContextType = {
    looms,
    setLooms,
    settings,
    setSettings,
    operators,
    addOperator,
    updateOperator,
    deleteOperator,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    addStopReason,
    activeShift,
    shiftHistory,
    modal,
    openModal,
    closeModal,
    updateLoomData,
    startShift,
    endShift,
    logProductionReadings,
    updateProductionEntry,
    deleteProductionEntry,
    startStop,
    endStop,
    exportActiveShiftToExcel,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- HOOK FOR EASY ACCESS ---
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};