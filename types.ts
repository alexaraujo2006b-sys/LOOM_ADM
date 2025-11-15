export interface Operator {
  id: string;
  name: string;
  employeeId: string; // Matrícula
  role: string;       // Função
  shiftName: string; // The primary shift for this operator
}

export interface FabricComponent {
    dtex: number;
    color: string;
}

export interface Product {
  id: string;
  name: string;
  productCode: string;
  standardRpm: number;
  threadDensity: number; // Fios por 10cm
  grammageM2: number; // g/m²
  fabricWidthM: number; // metros
  composition: {
      weft: FabricComponent; // Trama
      warp: FabricComponent; // Urdume
      markingWarp: FabricComponent; // Urdume de Marcação
  };
}

export interface Loom {
  id: string;
  code: string;
  sector: string;
  operatorIds: { [shiftName: string]: string };
  productId: string;
}

export interface ShiftTime {
  name: string;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface ITHReason {
  id: string;
  code: string;
  description: string;
}

export interface ITHIntervention {
  id: string;
  loomId: string;
  reasonId: string;
  timestamp: number;
}

export interface Settings {
  companyName: string;
  companyLogo: string; // base64
  efficiencyGoal: number; // %
  hourlyProductionGoal: number; // m/h (Fallback)
  shifts: ShiftTime[];
  stopReasons: {
    maintenance: string[];
    operational: string[];
  };
  ithStopReasons: ITHReason[];
}

export interface ProductionEntry {
  id: string;
  loomId: string;
  reading: number;
  timestamp: number; // Unix timestamp
  notes?: string;
}

export interface MaintenanceStop {
  id: string;
  loomId: string;
  start: number;
  end: number | null;
  reason: string;
  notes?: string;
}

export interface OperationalIntervention {
  id: string;
  loomId: string;
  start: number;
  end: number | null;
  reason: string;
  notes?: string;
}

export interface QualityEntry {
    id: string;
    loomId: string;
    timestamp: number;
    residueKg: number;
    offSpecFabricMeters: number;
    notes?: string;
}

export interface ActiveShift {
  shiftName: string;
  shiftStartTime: number; // The exact start time of the current shift period
  userStartTime: number; // When the user clicked 'start'
  responsible: string;
  recorder: string;
  production: ProductionEntry[];
  maintenance: MaintenanceStop[];
  interventions: OperationalIntervention[];
  qualityEntries: QualityEntry[];
  ithInterventions: ITHIntervention[];
}

export interface ShiftRecord extends ActiveShift {
  end: number;
  summary: string;
  actionPlans: string;
}

// Fix: Added User interface and UserRole type for authentication.
export type UserRole = 'admin' | 'viewer';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
}

export interface AppData {
  looms: Loom[];
  settings: Settings;
  operators: Operator[];
  products: Product[];
  users: User[]; // Fix: Added users for authentication.
  activeShift: ActiveShift | null;
  shiftHistory: ShiftRecord[];
  currentUser: User | null; // Fix: Added currentUser for session management.
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS',
  OPERATORS = 'OPERATORS',
  PRODUCTS = 'PRODUCTS',
  GRAPHS = 'GRAPHS',
  REPORTS = 'REPORTS',
  EDIT_DATA = 'EDIT_DATA',
  PARETO_ANALYSIS = 'PARETO_ANALYSIS',
  QUALITY = 'QUALITY',
  EDIT_ITH_DATA = 'EDIT_ITH_DATA',
  ITH_REPORT = 'ITH_REPORT',
}

export type ModalType = 
  | 'LOG_PRODUCTION'
  | 'MANAGE_MAINTENANCE'
  | 'MANAGE_INTERVENTION'
  | 'START_SHIFT' 
  | 'END_SHIFT'
  | 'ADD_EDIT_OPERATOR'
  | 'ADD_EDIT_PRODUCT'
  | 'LOOM_DETAILS'
  | 'EDIT_PRODUCTION_ENTRY'
  | 'PDF_PREVIEW'
  | 'LOOM_HISTORY_CHART'
  | 'LOG_QUALITY'
  | 'LOG_ITH'
  | 'FULLSCREEN_LOOM_CARD'
  | 'ADD_EDIT_ITH_REASON'
  | 'EDIT_ITH_INTERVENTION'
  // Fix: Added ADD_EDIT_USER to support user management modal.
  | 'ADD_EDIT_USER'
  | null;

export interface ModalState {
  type: ModalType;
  data?: any;
}

export interface AppContextType extends AppData {
  // Modal management
  modal: ModalState;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  
  // State setters
  setLooms: (looms: Loom[] | ((prev: Loom[]) => Loom[])) => void;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;

  // Business logic
  addOperator: (name: string, shiftName: string, employeeId: string, role: string) => void;
  updateOperator: (id: string, name: string, shiftName: string, employeeId: string, role: string) => void;
  deleteOperator: (id: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addStopReason: (type: 'maintenance' | 'operational', reason: string) => void;
  addIthStopReason: (reason: Omit<ITHReason, 'id'>) => void;
  updateIthStopReason: (reason: ITHReason) => void;
  deleteIthStopReason: (id: string) => void;
  updateLoomData: (loomId: string, data: Partial<Loom>) => void;
  startShift: (responsible: string, recorder: string) => void;
  endShift: (summary: string, actionPlans: string) => void;
  logProductionReadings: (readings: { loomId: string, reading: number, notes?: string }[]) => void;
  updateProductionEntry: (entry: ProductionEntry) => void;
  deleteProductionEntry: (entryId: string) => void;
  startStop: (loomId: string, type: 'maintenance' | 'operational', reason: string, notes?: string) => void;
  endStop: (stopId: string, type: 'maintenance' | 'operational') => void;
  logQualityEntry: (data: Omit<QualityEntry, 'id' | 'timestamp'>) => void;
  logITHIntervention: (loomId: string, reasonId: string) => void;
  updateITHIntervention: (intervention: ITHIntervention) => void;
  deleteITHIntervention: (id: string) => void;
  exportActiveShiftToExcel: () => void;
  
  // Fix: Added properties for user authentication and management.
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (username: string, role: UserRole, password: string) => void;
  updateUser: (id: string, username: string, role: UserRole, password?: string) => void;
  deleteUser: (id: string) => void;

  // Data management
  backupData: () => void;
  restoreData: (data: AppData) => void;

  // PWA Installation
  installPrompt: any | null;
  triggerInstallPrompt: () => Promise<void>;

  // File System Sync
  fileHandle: FileSystemFileHandle | null;
  connectToFile: () => Promise<void>;
  disconnectFile: () => void;
  isSaving: boolean;
}