
import { Machine, MachineStatus, MaintenanceLog, Notification, ReportEntry, OperationalLog } from './types';

export const INITIAL_NOTIFICATIONS: Notification[] = [];

// Mantendo o cadastro dos ativos fixos da célula, mas resetando dados de uso (Horas, Operador, Status)
export const INITIAL_MACHINES: Machine[] = [
  {
    id: '1081579',
    name: 'Furadeira S.A. Yadoya',
    type: 'Furadeira de Bancada',
    model: 'FY-B 25 E (Série 0813) - 220V',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1UwOCXN8_FEsy99blgn7m4_DJCw6hF5Hb',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '1081578',
    name: 'Furadeira S.A. Yadoya',
    type: 'Furadeira de Bancada',
    model: 'FY-B 25 E (Série 0713) - 220V',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1UwOCXN8_FEsy99blgn7m4_DJCw6hF5Hb',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '465067',
    name: 'Torno Nardini',
    type: 'Torno Convencional',
    model: 'MC220AE (Série 465067) - 220V',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1H0o-yN3CF26hrl_1idnuJeNyE0dzEEBL',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '465059',
    name: 'Torno Nardini',
    type: 'Torno Convencional',
    model: 'MC220AE (Série 465059) - 220V',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1H0o-yN3CF26hrl_1idnuJeNyE0dzEEBL',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '779282',
    name: 'Torno Nardini',
    type: 'Torno Convencional',
    model: 'MC220AE (Série 779282) - 220V',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1H0o-yN3CF26hrl_1idnuJeNyE0dzEEBL',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '463285',
    name: 'Serra Fita',
    type: 'Serra de Fita',
    model: 'Standardizata',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1q0ZAogZFEM_AHDBgsM99JEwrZiwbzZSV',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '1124424',
    name: 'Torno ROMI',
    type: 'Torno CNC',
    model: 'T240 (Série 016-018306-452) - 220V',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1aJBdo3kOHOeTDIAoBlQBM11bzSLzj42S',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '1124425',
    name: 'Torno ROMI',
    type: 'Torno CNC',
    model: 'T240 (Série 016-018309-452) - 220V',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1aJBdo3kOHOeTDIAoBlQBM11bzSLzj42S',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '1124426',
    name: 'Torno ROMI',
    type: 'Torno CNC',
    model: 'T240 (Série 016-018310-452) - 220V',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1aJBdo3kOHOeTDIAoBlQBM11bzSLzj42S',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '1124427',
    name: 'Torno ROMI',
    type: 'Torno CNC',
    model: 'T240 (Série 016-018308-452) - 220V',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1aJBdo3kOHOeTDIAoBlQBM11bzSLzj42S',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '1085926',
    name: 'Fresas',
    type: 'Fresadora Universal',
    model: 'KonE Standard',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1vF6_ranJZBS3eoTpZbXrChu2T-PS7pPk',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '837073',
    name: 'Fresas',
    type: 'Fresadora',
    model: 'Deb Maq Padrão',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1vF6_ranJZBS3eoTpZbXrChu2T-PS7pPk',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: '837074',
    name: 'Fresas',
    type: 'Fresadora',
    model: 'Deb Maq Padrão',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1vF6_ranJZBS3eoTpZbXrChu2T-PS7pPk',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: 'BD-001',
    name: 'Bancadas Didáticas',
    type: 'Bancada',
    model: 'Bancada de Ajustagem 01',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=400&auto=format&fit=crop',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: 'BD-002',
    name: 'Bancadas Didáticas',
    type: 'Bancada',
    model: 'Bancada de Ajustagem 02',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=400&auto=format&fit=crop',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: 'BD-003',
    name: 'Bancadas Didáticas',
    type: 'Bancada',
    model: 'Bancada de Ajustagem 03',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=400&auto=format&fit=crop',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: 'BD-004',
    name: 'Bancadas Didáticas',
    type: 'Bancada',
    model: 'Bancada de Ajustagem 04',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=400&auto=format&fit=crop',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: 'RT-001',
    name: 'Retífica',
    type: 'Retífica Plana',
    model: 'Ferdimat',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/10Es9GAVMNlAOAXYUeQnAmCWd63IgIvxR',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  },
  {
    id: 'ES-001',
    name: 'Esmeril',
    type: 'Moto Esmeril',
    model: 'Industrial 2CV',
    status: MachineStatus.OPERATIONAL,
    lastMaintenance: new Date().toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/d/1mhj2FPkzD5sDmFKM-kFve8zXvPmy1-QE',
    progress: 0,
    safetyCheckCompleted: false,
    operatingHours: 0
  }
];

export const INITIAL_LOGS: MaintenanceLog[] = [];

export const INITIAL_REPORTS: ReportEntry[] = [];

export const INITIAL_OPERATIONAL_LOGS: OperationalLog[] = [];

export const ENERGY_CONSUMPTION = [
  { time: '06:00', kwh: 0 },
  { time: '08:00', kwh: 0 },
  { time: '10:00', kwh: 0 },
  { time: '12:00', kwh: 0 },
  { time: '14:00', kwh: 0 },
  { time: '16:00', kwh: 0 },
  { time: '18:00', kwh: 0 },
  { time: '20:00', kwh: 0 },
];

export const SAFETY_ALERTS = [
  "Uso obrigatório de óculos de proteção em toda a área.",
  "Não operar máquinas com adornos (anéis, pulseiras).",
  "Verificar nível de fluido refrigerante antes do início do turno."
];
