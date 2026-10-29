

export enum MachineStatus {
  OPERATIONAL = 'Operacional',
  MAINTENANCE = 'Manutenção',
  IDLE = 'Parada',
  OFFLINE = 'Desligada'
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  model: string;
  status: MachineStatus;
  lastMaintenance: string;
  operator?: string;
  image: string;
  progress: number; // For the dashboard visualization (0-100)
  safetyCheckCompleted?: boolean; // Flag for mandatory safety questionnaire
  lastSafetyCheckUser?: string; // Operator who validated safety
  lastSafetyCheckDate?: string; // Date of safety validation (YYYY-MM-DD)
  operatingHours: number; // Total operating hours (Horímetro)
}

export interface MaintenanceLog {
  id: string;
  machineId: string;
  machineName: string;
  type: 'Preventiva' | 'Corretiva' | 'Preditiva';
  description: string;
  date: string;
  technician: string;
  status: 'Aberta' | 'Aprovada' | 'Em Execução' | 'Concluída';
}

export interface ReportEntry {
  id: string;
  logId: string;
  machineName: string;
  generatedAt: string; // ISO String date
  generatedBy: string;
}

export interface OperationalLog {
  id: string;
  machineId: string;
  type: 'Segurança' | 'Lubrificação' | 'Operação';
  timestamp: string; // ISO String
  user: string;
  details?: string;
  // New fields for Lubrication History
  studentClass?: string; // Turma
  shift?: string; // Turno
  course?: string; // Curso
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  timestamp: string;
  read: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  icon: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface FresaSafetyInspection {
  id: string;
  machineId: string;
  machineName: string;
  inspectorName: string;
  instructorName: string;
  inspectionDate: string;
  shift: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  studentClass: string;
  epis: {
    safetyBoots: boolean;
    safetyGoggles: boolean;
    apron: boolean;
    hairnet: boolean;
  };
  emergencyDevices: {
    emergencyButton: 'Sim' | 'Não' | '';
    protectiveDoor: 'Sim' | 'Não' | '';
  };
  viseFirmlyClamped: 'Sim' | 'Não' | '';
  cleanAndOrganized: 'Sim' | 'Não' | '';
  hasHazardsOrProblems: 'Sim' | 'Não' | '';
  comments: string;
  isSafe: boolean;
  hazardsIdentified: string[];
  submittedAt: string;
}

export interface FresaWeeklyLubrication {
  id: string;
  type: 'Semanal';
  machineId: string;
  machineName: string;
  technicianName: string;
  studentClass: string;
  course: 'Técnico Mecânico' | 'Técnico Eletromecânica' | 'Mecânica de Usinagem' | 'Mecânico de Manutenção';
  shift: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  maintenanceDate: string;
  hydraulicReservoirLocated: 'Sim' | 'Não' | '';
  oilLevel: 'Entre MIN e MAX' | 'Abaixo do MIN' | 'Acima do MAX' | '';
  oilComplementNeeded: 'Sim' | 'Não' | '';
  oilVisualCondition: 'Âmbar clara' | 'Escura' | 'Turva' | 'Leitosa' | '';
  oilChangeNeeded: 'Sim' | 'Não' | '';
  greaseNipplesLocated: 'Sim' | 'Não' | '';
  greaseNipplesDirtOrExcess: 'Sim' | 'Não' | '';
  greasePumpingMethodApplied: 'Sim' | 'Não' | '';
  observations: string;
  requiresAttention: boolean;
  attentionItems: string[];
  submittedAt: string;
}

export interface FresaSemiannualLubrication {
  id: string;
  type: 'Semestral';
  machineId: string;
  machineName: string;
  technicianName: string;
  studentClass: string;
  course: 'Técnico Mecânico' | 'Técnico Eletromecânica' | 'Mecânica de Usinagem' | 'Mecânico de Manutenção';
  shift: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  maintenanceDate: string;
  feedGearboxWorkingProperly: 'Sim' | 'Não' | '';
  oilConditionInitial: 'Adequado' | 'Inadequado' | 'Não se aplica' | '';
  oilDrainedProperly: 'Sim' | 'Não' | '';
  drainedOilConditions: string[];
  newOilDTE26FilledCorrectly: 'Sim' | 'Não' | '';
  oilSpecificationConfirmed: boolean;
  observations: string;
  requiresAttention: boolean;
  attentionItems: string[];
  submittedAt: string;
}

export type FresaLubricationRecord = FresaWeeklyLubrication | FresaSemiannualLubrication;