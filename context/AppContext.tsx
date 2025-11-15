import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppContextType, AppData, Loom, Settings, ActiveShift, ShiftRecord, ModalState, ModalType, ProductionEntry, MaintenanceStop, OperationalIntervention, Operator, Product, QualityEntry, ITHReason, ITHIntervention, User, UserRole } from '../types';
import { getCurrentShift, getShiftStartDate } from '../utils/time';
import * as fileSystem from '../utils/fileSystem';
import { simpleHash } from '../utils/hash';

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialData: AppData = {
    looms: [ { "id": "LOHIA-NOVA6-1", "code": "T-01", "sector": "Leves", "operatorIds": { "1º Turno": "op-1", "2º Turno": "op-2", "3º Turno": "op-3" }, "productId": "prod-1" }, { "id": "LOHIA-NOVA6-2", "code": "T-02", "sector": "Leves", "operatorIds": { "1º Turno": "op-1", "2º Turno": "op-2", "3º Turno": "op-3" }, "productId": "prod-2" }, { "id": "LOHIA-NOVA6-3", "code": "T-03", "sector": "Leves", "operatorIds": { "1º Turno": "op-1", "2º Turno": "op-2", "3º Turno": "op-3" }, "productId": "prod-1" }, { "id": "LOHIA-NOVA6-4", "code": "T-04", "sector": "Leves", "operatorIds": { "1º Turno": "op-1", "2º Turno": "op-2", "3º Turno": "op-3" }, "productId": "prod-2" }, { "id": "LOHIA-NOVA6-5", "code": "T-05", "sector": "Leves", "operatorIds": { "1º Turno": "op-1", "2º Turno": "op-2", "3º Turno": "op-3" }, "productId": "prod-1" } ],
    settings: { "companyName": "Pracafé da Amazônia", "companyLogo": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0Ij4KICA8cGF0aCBmaWxsPSIjMUUzQTNBIiBkPSJNNDEuMiAyOC41bDMuMy01LjctMS43LTMuMi04LjYgNC42Yy0xLjEtLjQtMi4zLS42LTMuNS0uN2wtLjgtOS4yaC0zLjdsLS4viiiIDkuMmMtMS4yLjEtMi40LjMtMy41LjdsLTguNi00LjYtMS43IDMuMiAzLjMgNS43Yy0uOSAxLjYtMS40IDMuNC0xLjYgNS4zTDEwLjUgMzZoMy44bDEuMy04LjVjLjMtMS42IDEuMS0zIDEuOS00LjNsNi4zIDMuNCA2LjMgMy40YzEuMSAxLjYgMS4xIDMuNyAwIDUuM2wtNi4zIDMuNC02LjMgMy40Yy0uOC0xLjItMS42LTIuNy0xLjktNC4zbC0xLjMtOC41aC0zLjhsMS4zIDguNWMuMiAxLjkgLjcgMy43IDEuNiA1LjNsMy4zIDUuNyAxLjcgMy4yIDguNi00LjZjMS4xLjQgMi4zLjYgMy41LjdsLjggOS4yaDMuN2wuOC05LjJjMS4yLS4xIDIuNC0uMyAzLjUtLjdsOC42IDQuNiAxLjctMy4yLTMuMy01LjdjLjktMS42IDEuNC0zLjQgMS42LTUuM2wxLjMtOC41aC0zLjhsLTEuMyA4LjVjLS4zIDEuNi0xLjEgMy0xLjkgNC4zbC02LjMtMy40LTYuMy0zLjRjLTEuMS0xLjYtMS4xLTMuNyAwLTUuM2w2LjMgMy40IDYuMyAzLjRjLjgtMS4yIDEuNi0yLjcgMS45LTQuM2wxLjMtOC41aDMuOGwtMS4zIDguNWMtLjIgMS45LS43IDMuNy0xLjYgNS4zWiIgLz4KICA8cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiMxRTNBM0EiIHN0cm9rZS11aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBkPSJNMzIgNDBDMjQuMyA0MCAxOS41IDM0LjMgMjAuMSAyNi43TTMyIDI0YzcuNyAwIDEyLjUgNS43IDExLjkgMTMuMyIvPgo8L3N2Zz4=", "efficiencyGoal": 90, "hourlyProductionGoal": 15, "shifts": [ { "name": "1º Turno", "start": "06:00", "end": "14:20" }, { "name": "2º Turno", "start": "14:20", "end": "22:40" }, { "name": "3º Turno", "start": "22:40", "end": "06:00" } ], "stopReasons": { "maintenance": [ "Elétrica", "Mecânica", "Preventiva", "Outra" ], "operational": [ "Falta de material", "Troca de artigo", "Limpeza", "Outra" ] }, "ithStopReasons": [ { "id": "ith-1", "code": "SG", "description": "SECOU NA GAIOLA" }, { "id": "ith-2", "code": "CB", "description": "CORTE DE BOBINA" }, { "id": "ith-3", "code": "ME", "description": "MANUTENÇÃO ELÉTRICA" }, { "id": "ith-4", "code": "MC", "description": "MANUTENÇÃO MECÂNICA" }, { "id": "ith-5", "code": "PP", "description": "PARADA PROGRAMADA" }, { "id": "ith-6", "code": "QG", "description": "QUEBRA NA GAIOLA" }, { "id": "ith-7", "code": "QP", "description": "QUEBRA NO PENTE CIRCULAR" }, { "id": "ith-8", "code": "QT", "description": "QUEBRA DE TRAMA" }, { "id": "ith-9", "code": "TE", "description": "TEAR ESTOURADO" }, { "id": "ith-10", "code": "TT", "description": "TERMINO DE BOBINA DE TRAMA" }, { "id": "ith-11", "code": "TA", "description": "TROCA DE ARTIGO" }, { "id": "ith-12", "code": "FU", "description": "FALTA DE URDUME" }, { "id": "ith-13", "code": "FT", "description": "FALTA DE TRAMA" } ] },
    operators: [ { "id": "op-1", "name": "João Silva", "shiftName": "1º Turno", "employeeId": "1001", "role": "Operador A" }, { "id": "op-2", "name": "Maria Oliveira", "shiftName": "2º Turno", "employeeId": "1002", "role": "Operador B" }, { "id": "op-3", "name": "Carlos Pereira", "shiftName": "3º Turno", "employeeId": "1003", "role": "Operador A" } ],
    products: [ { "id": "prod-1", "name": "Tecido Padrão A", "productCode": "TPA-001", "standardRpm": 650, "threadDensity": 40, "grammageM2": 90, "fabricWidthM": 1.5, "composition": { "weft": { "dtex": 1000, "color": "#FFFFFF" }, "warp": { "dtex": 1200, "color": "#FFFFFF" }, "markingWarp": { "dtex": 1200, "color": "#FF0000" } } }, { "id": "prod-2", "name": "Tecido Especial B", "productCode": "TEB-002", "standardRpm": 600, "threadDensity": 50, "grammageM2": 120, "fabricWidthM": 1.2, "composition": { "weft": { "dtex": 1500, "color": "#000000" }, "warp": { "dtex": 1600, "color": "#000000" }, "markingWarp": { "dtex": 1600, "color": "#00FF00" } } } ],
    users: [ { "id": "user-admin", "username": "admin", "passwordHash": "62692224", "role": "admin" } ],
    activeShift: null,
    shiftHistory: [],
    currentUser: null,
};

// --- PROVIDER COMPONENT ---
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<ModalState>({ type: null, data: null });
  const [data, setData] = useLocalStorage<AppData>('teares-data', initialData);
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = React.useRef<number | null>(null);

  // Auto-load file handle on app start
  useEffect(() => {
    fileSystem.getHandle().then(handle => {
        if (handle) {
            setFileHandle(handle);
            console.log('Arquivo local reconectado automaticamente.');
            // Optional: load data from file on start
            // loadDataFromFile(handle); 
        }
    });
  }, []);

  const saveDataToFile = useCallback(async (currentData: AppData, handle: FileSystemFileHandle) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(async () => {
        setIsSaving(true);
        try {
            await fileSystem.writeFile(handle, JSON.stringify(currentData, null, 2));
            console.log('Dados salvos no arquivo local.');
        } catch (error) {
            console.error('Falha ao salvar dados no arquivo:', error);
            alert('Erro: Não foi possível salvar os dados no arquivo. A permissão pode ter sido revogada. Tente reconectar.');
            setFileHandle(null);
            fileSystem.clearHandle();
        } finally {
            setIsSaving(false);
        }
      }, 1000); // Debounce saves by 1 second
  }, []);

  useEffect(() => {
    if (fileHandle) {
        saveDataToFile(data, fileHandle);
    }
    // Cleanup timeout on unmount
    return () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
    };
  }, [data, fileHandle, saveDataToFile]);


  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('`beforeinstallprompt` event was fired.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  const performUpdate = (updateFunction: (currentData: AppData) => AppData) => {
    const updatedData = updateFunction(JSON.parse(JSON.stringify(data))); // Deep copy
    setData(updatedData);
  };
  
  const openModal = (type: ModalType, data: any = null) => setModal({ type, data });
  const closeModal = () => setModal({ type: null, data: null });

  // --- Rewritten functions ---
  
  const setLooms = (updater: Loom[] | ((prev: Loom[]) => Loom[])) => {
    performUpdate(currentData => {
        const newLooms = typeof updater === 'function' ? updater(currentData.looms) : updater;
        return { ...currentData, looms: newLooms };
    });
  }

  const setSettings = (updater: Settings | ((prev: Settings) => Settings)) => {
     performUpdate(currentData => {
        const newSettings = typeof updater === 'function' ? updater(currentData.settings) : updater;
        return { ...currentData, settings: newSettings };
    });
  }

  const addOperator = (name: string, shiftName: string, employeeId: string, role: string) => {
    performUpdate(d => {
        const newOperator = { id: `op-${Date.now()}`, name, shiftName, employeeId, role };
        d.operators.push(newOperator);
        return d;
    });
  };

  const updateOperator = (id: string, name: string, shiftName: string, employeeId: string, role: string) => {
    performUpdate(d => {
        d.operators = d.operators.map(op => op.id === id ? { ...op, name, shiftName, employeeId, role } : op);
        return d;
    });
  };

  const deleteOperator = (id: string) => {
    performUpdate(d => {
        d.operators = d.operators.filter(op => op.id !== id);
        return d;
    });
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    performUpdate(d => {
        const newProduct = { id: `prod-${Date.now()}`, ...product };
        d.products.push(newProduct);
        return d;
    });
  };

  const updateProduct = (product: Product) => {
    performUpdate(d => {
        d.products = d.products.map(p => p.id === product.id ? product : p);
        return d;
    });
  };

  const deleteProduct = (id: string) => {
    performUpdate(d => {
        d.products = d.products.filter(p => p.id !== id);
        return d;
    });
  };

  const addStopReason = (type: 'maintenance' | 'operational', reason: string) => {
    if(!reason || !reason.trim()) return;
    performUpdate(d => {
        const existingReasons = d.settings.stopReasons[type];
        if (existingReasons.includes(reason.trim())) {
            alert(`"${reason.trim()}" já existe.`);
            return d;
        }
        d.settings.stopReasons[type].push(reason.trim());
        return d;
    });
  };

  const addIthStopReason = (reason: Omit<ITHReason, 'id'>) => {
    if(!reason.code.trim() || !reason.description.trim()) return;
    performUpdate(d => {
        const existing = d.settings.ithStopReasons.find(r => r.code.toUpperCase() === reason.code.trim().toUpperCase());
        if (existing) {
            alert(`O código "${reason.code.trim().toUpperCase()}" já existe.`);
            return d;
        }
        const newReason = { ...reason, id: `ith-${Date.now()}`, code: reason.code.trim().toUpperCase(), description: reason.description.trim() };
        d.settings.ithStopReasons.push(newReason);
        return d;
    });
    closeModal();
  };

  const updateIthStopReason = (reason: ITHReason) => {
    performUpdate(d => {
        const otherReasons = d.settings.ithStopReasons.filter(r => r.id !== reason.id);
        const existingCode = otherReasons.find(r => r.code.toUpperCase() === reason.code.trim().toUpperCase());
        if (existingCode) {
            alert(`O código "${reason.code.trim().toUpperCase()}" já pertence a outra causa.`);
            return d;
        }
        d.settings.ithStopReasons = d.settings.ithStopReasons.map(r => r.id === reason.id ? reason : r);
        return d;
    });
    closeModal();
  };

  const deleteIthStopReason = (id: string) => {
    if (data?.activeShift?.ithInterventions.some(i => i.reasonId === id)) {
        alert('Esta causa não pode ser excluída pois já está em uso no turno ativo.');
        return;
    }
    if (window.confirm('Tem certeza que deseja excluir esta causa de ITH?')) {
        performUpdate(d => {
            d.settings.ithStopReasons = d.settings.ithStopReasons.filter(r => r.id !== id);
            return d;
        });
    }
  };
  
  const updateLoomData = (loomId: string, loomData: Partial<Loom>) => {
    performUpdate(d => {
        d.looms = d.looms.map(loom => loom.id === loomId ? {...loom, ...loomData} : loom);
        return d;
    });
  };

  const startShift = (responsible: string, recorder: string) => {
    performUpdate(d => {
        const currentShiftDetails = getCurrentShift(d.settings.shifts);
        if (!currentShiftDetails) {
            alert("Não foi possível determinar o turno atual. Verifique as configurações de horário.");
            return d;
        }
        const shiftStartDate = getShiftStartDate(currentShiftDetails);
        const baselineEntries: ProductionEntry[] = d.looms.map(loom => ({
            id: `prod-start-${shiftStartDate.getTime()}-${loom.id}`,
            loomId: loom.id,
            reading: 0,
            timestamp: shiftStartDate.getTime(),
            notes: 'Início do turno'
        }));
        
        d.activeShift = {
            shiftName: currentShiftDetails.name,
            shiftStartTime: shiftStartDate.getTime(),
            userStartTime: Date.now(),
            responsible,
            recorder,
            production: baselineEntries,
            maintenance: [],
            interventions: [],
            qualityEntries: [],
            ithInterventions: [],
        };
        alert(`Turno "${currentShiftDetails.name}" iniciado com sucesso!`);
        return d;
    });
    closeModal();
  };
  
  const endShift = (summary: string, actionPlans: string) => {
    performUpdate(d => {
        if (!d.activeShift) return d;
        const shiftRecord: ShiftRecord = { ...d.activeShift, end: Date.now(), summary, actionPlans };
        d.shiftHistory.unshift(shiftRecord);
        d.activeShift = null;
        alert("Turno encerrado com sucesso.");
        return d;
    });
    closeModal();
  };

  const logProductionReadings = (readings: { loomId: string, reading: number, notes?: string }[]) => {
    performUpdate(d => {
        if (!d.activeShift) return d;
        const now = Date.now();
        const newEntries: ProductionEntry[] = readings
            .filter(r => !isNaN(r.reading) && r.reading >= 0)
            .map(r => ({ id: `prod-${now}-${r.loomId}`, loomId: r.loomId, reading: r.reading, timestamp: now, notes: r.notes }));

        if (newEntries.length > 0) {
            d.activeShift.production.push(...newEntries);
        }
        return d;
    });
    closeModal();
  };

  const updateProductionEntry = (entry: ProductionEntry) => {
    performUpdate(d => {
        if (!d.activeShift) return d;
        d.activeShift.production = d.activeShift.production.map(p => p.id === entry.id ? entry : p);
        return d;
    });
    closeModal();
  };

  const deleteProductionEntry = (entryId: string) => {
    performUpdate(d => {
        if (!d.activeShift) return d;
        const entryToDelete = d.activeShift.production.find(p => p.id === entryId);
        if(entryToDelete?.notes === 'Início do turno') {
            alert('Não é possível excluir o lançamento inicial do turno.');
            return d;
        }
        d.activeShift.production = d.activeShift.production.filter(p => p.id !== entryId);
        return d;
    });
  };
  
  const startStop = (loomId: string, type: 'maintenance' | 'operational', reason: string, notes?: string) => {
    performUpdate(d => {
        if (!d.activeShift) return d;
        const newStop = { id: `${type}-${Date.now()}`, loomId, start: Date.now(), end: null, reason, notes };
        if (type === 'maintenance') {
            d.activeShift.maintenance.push(newStop);
        } else {
            d.activeShift.interventions.push(newStop);
        }
        return d;
    });
    closeModal();
  };

  const endStop = (stopId: string, type: 'maintenance' | 'operational') => {
    performUpdate(d => {
        if (!d.activeShift) return d;
        const now = Date.now();
        if (type === 'maintenance') {
            d.activeShift.maintenance = d.activeShift.maintenance.map(s => s.id === stopId ? { ...s, end: now } : s);
        } else {
            d.activeShift.interventions = d.activeShift.interventions.map(i => i.id === stopId ? { ...i, end: now } : i);
        }
        return d;
    });
    closeModal();
  };
  
  const logQualityEntry = (qualityData: Omit<QualityEntry, 'id' | 'timestamp'>) => {
    performUpdate(d => {
        if (!d.activeShift) return d;
        const newEntry: QualityEntry = { ...qualityData, id: `qual-${Date.now()}-${qualityData.loomId}`, timestamp: Date.now() };
        d.activeShift.qualityEntries.push(newEntry);
        return d;
    });
    closeModal();
  };

  const logITHIntervention = (loomId: string, reasonId: string) => {
    if (!data.activeShift) return;

    const now = Date.now();
    const lastInterventionForLoom = data.activeShift.ithInterventions
      .filter(i => i.loomId === loomId)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (lastInterventionForLoom && (now - lastInterventionForLoom.timestamp < 60000)) { // 1 minute cooldown
      const secondsRemaining = Math.ceil((60000 - (now - lastInterventionForLoom.timestamp)) / 1000);
      alert(`Aguarde ${secondsRemaining} segundos para registrar uma nova microparada neste tear.`);
      return;
    }

    performUpdate(d => {
        if (!d.activeShift) return d;
        const newIntervention: ITHIntervention = { id: `ith-${now}-${loomId}`, loomId, reasonId, timestamp: now };
        d.activeShift.ithInterventions.push(newIntervention);
        return d;
    });
    closeModal();
  };

  const updateITHIntervention = (intervention: ITHIntervention) => {
    performUpdate(d => {
        if (!d.activeShift) return d;
        d.activeShift.ithInterventions = d.activeShift.ithInterventions.map(i => i.id === intervention.id ? intervention : i);
        return d;
    });
    closeModal();
  };

  const deleteITHIntervention = (id: string) => {
    performUpdate(d => {
        if (!d.activeShift) return d;
        d.activeShift.ithInterventions = d.activeShift.ithInterventions.filter(i => i.id !== id);
        return d;
    });
  };

  const exportActiveShiftToExcel = () => {
    if (!data || !data.activeShift) {
        alert("Nenhum turno ativo para exportar.");
        return;
    }
    import('../utils/export').then(({ exportToExcel }) => {
      exportToExcel(data.activeShift!, data.looms, data.operators, data.products, data.settings, `Turno_${data.activeShift!.shiftName}_${new Date().toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})}`);
    });
  };

  const backupData = () => {
    if (data) {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `backup_teares.json`;
        link.click();
    }
  };

  const restoreData = (restoredData: AppData) => {
    if (window.confirm("Tem certeza que deseja restaurar os dados? A ação substituirá todos os dados atuais.")) {
        setData(restoredData);
        window.location.reload();
    }
  };

  const triggerInstallPrompt = async () => {
    if (!installPrompt) {
      alert('O aplicativo já foi instalado ou não pode ser instalado neste navegador.');
      return;
    }
    const result = await installPrompt.prompt();
    console.log(`A instalação foi solicitada, escolha do usuário: ${result.outcome}`);
  };

  const loadDataFromFile = async (handle: FileSystemFileHandle) => {
    try {
        const fileContent = await fileSystem.readFile(handle);
        const parsedData = JSON.parse(fileContent);
        // Basic validation
        if (parsedData.looms && parsedData.settings) {
            if (window.confirm("Dados encontrados no arquivo. Deseja carregar os dados do arquivo, substituindo os dados atuais?")) {
                setData(parsedData);
                alert("Dados carregados com sucesso!");
            }
        } else {
            throw new Error("Formato de arquivo inválido.");
        }
    } catch (error) {
        console.error("Erro ao carregar dados do arquivo:", error);
        alert("Não foi possível ler o arquivo de dados. Pode estar corrompido ou em um formato inválido.");
    }
  };


  const connectToFile = async () => {
    try {
        const handle = await fileSystem.getFileHandle();
        setFileHandle(handle);
        fileSystem.saveHandle(handle);
        await loadDataFromFile(handle);
    } catch (error) {
        console.error("Falha ao conectar ao arquivo:", error);
        if ((error as DOMException).name !== 'AbortError') {
             alert("Não foi possível conectar ao arquivo.");
        }
    }
  };

  const disconnectFile = () => {
      setFileHandle(null);
      fileSystem.clearHandle();
      alert("Desconectado do arquivo local. As alterações não serão mais salvas automaticamente.");
  };

  // Fix: Implemented user management functions.
  const login = (username: string, password: string): boolean => {
    const user = data.users.find(u => u.username === username);
    if (user && user.passwordHash === simpleHash(password)) {
      performUpdate(d => ({ ...d, currentUser: user }));
      return true;
    }
    return false;
  };

  const logout = () => {
    performUpdate(d => ({ ...d, currentUser: null }));
  };

  const addUser = (username: string, role: UserRole, password: string) => {
    performUpdate(d => {
      if (d.users.some(u => u.username === username)) {
        alert('Nome de usuário já existe.');
        return d;
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        username,
        role,
        passwordHash: simpleHash(password),
      };
      d.users.push(newUser);
      return d;
    });
    closeModal();
  };

  const updateUser = (id: string, username: string, role: UserRole, password?: string) => {
    performUpdate(d => {
      const userIndex = d.users.findIndex(u => u.id === id);
      if (userIndex === -1) return d;

      const otherUsers = d.users.filter(u => u.id !== id);
      if (otherUsers.some(u => u.username === username)) {
        alert('Nome de usuário já existe.');
        return d;
      }

      const updatedUser = { ...d.users[userIndex], username, role };
      if (password) {
        updatedUser.passwordHash = simpleHash(password);
      }
      d.users[userIndex] = updatedUser;
      return d;
    });
    closeModal();
  };

  const deleteUser = (id: string) => {
    if (data.users.length <= 1) {
        alert("Não é possível excluir o último usuário.");
        return;
    }
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      performUpdate(d => {
        d.users = d.users.filter(u => u.id !== id);
        if (d.currentUser?.id === id) {
          d.currentUser = null;
        }
        return d;
      });
    }
  };

  const value: AppContextType = {
    ...data,
    setLooms,
    setSettings,
    modal,
    openModal,
    closeModal,
    addOperator,
    updateOperator,
    deleteOperator,
    addProduct,
    updateProduct,
    deleteProduct,
    addStopReason,
    addIthStopReason,
    updateIthStopReason,
    deleteIthStopReason,
    updateLoomData,
    startShift,
    endShift,
    logProductionReadings,
    updateProductionEntry,
    deleteProductionEntry,
    startStop,
    endStop,
    logQualityEntry,
    logITHIntervention,
    updateITHIntervention,
    deleteITHIntervention,
    exportActiveShiftToExcel,
    backupData,
    restoreData,
    installPrompt,
    triggerInstallPrompt,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    // File System
    fileHandle,
    connectToFile,
    disconnectFile,
    isSaving,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};