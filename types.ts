export interface Operator {
  id: string;
  name: string;
  shiftName: string; // The primary shift for this operator
}

export interface Product {
  id: string;
  name: string;
  hourlyProductionGoal: number; // m/h
}

export interface Loom {
  id: string;
  code: string;
  sector: string;
  operatorIds: { [shiftName: string]: string };
  productId: string;
  nominalSpeed: number; // rpm
  threadDensity: number;
}

export interface ShiftTime {
  name: string;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface Settings {
  efficiencyGoal: number; // %
  hourlyProductionGoal: number; // m/h (Fallback)
  shifts: ShiftTime[];
  stopReasons: {
    maintenance: string[];
    operational: string[];
  };
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

export interface ActiveShift {
  shiftName: string;
  shiftStartTime: number; // The exact start time of the current shift period
  userStartTime: number; // When the user clicked 'start'
  responsible: string;
  recorder: string;
  production: ProductionEntry[];
  maintenance: MaintenanceStop[];
  interventions: OperationalIntervention[];
}

export interface ShiftRecord extends ActiveShift {
  end: number;
  summary: string;
  actionPlans: string;
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
  | null;

export interface ModalState {
  type: ModalType;
  data?: any;
}