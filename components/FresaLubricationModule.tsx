import React, { useState, useEffect } from 'react';
import { Machine, FresaWeeklyLubrication, FresaSemiannualLubrication, FresaLubricationRecord, OperationalLog } from '../types';
import { 
  Droplet, Droplets, AlertTriangle, CheckCircle2, RotateCcw, Send, 
  Printer, Calendar, User, Search, Filter, FileText, Check, AlertCircle, 
  ChevronRight, X, Info, ShieldAlert, Wrench, Sparkles, Clock, CheckSquare, Square, ArrowLeft
} from 'lucide-react';

interface FresaLubricationModuleProps {
  machines: Machine[];
  currentUser?: string;
  userRole?: string;
  initialType?: 'semanal' | 'semestral' | 'hub' | 'history';
  onAddOperationalLog?: (log: OperationalLog) => void;
  onNavigate?: (view: string) => void;
  onClose?: () => void;
  isEmbedded?: boolean;
}

const STORAGE_KEY = 'senai_kone_lubrications';

const COURSES = [
  'Técnico Mecânico',
  'Técnico Eletromecânica',
  'Mecânica de Usinagem',
  'Mecânico de Manutenção'
] as const;

const SHIFTS = ['Manhã', 'Tarde', 'Noite', 'Integral'] as const;

const DRAiNED_OIL_CONDITIONS = [
  'Cor normal',
  'Cor escura',
  'Cheiro de queimado',
  'Presença de partículas metálicas',
  'Aspecto leitoso'
];

const FresaLubricationModule: React.FC<FresaLubricationModuleProps> = ({
  machines,
  currentUser = '',
  userRole = '',
  initialType = 'hub',
  onAddOperationalLog,
  onNavigate,
  onClose,
  isEmbedded = false,
}) => {
  // Active Tab: 'semanal' | 'semestral' | 'report' | 'history'
  const [activeTab, setActiveTab] = useState<'semanal' | 'semestral' | 'report' | 'history'>(
    initialType === 'semestral' ? 'semestral' : initialType === 'history' ? 'history' : 'semanal'
  );

  // Sync initialType when passed
  useEffect(() => {
    if (initialType === 'semestral' || initialType === 'semanal' || initialType === 'history') {
      setActiveTab(initialType);
    }
  }, [initialType]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Find Kone Fresa or default to ID 1085926
  const koneMachine = machines.find(m => 
    m.name.toLowerCase().includes('kone') || m.model.toLowerCase().includes('kone') || m.id === '1085926'
  ) || machines.find(m => m.name.toLowerCase().includes('fresa')) || machines[0];

  // -------------------------------------------------------------
  // STATE: FORMULÁRIO 1 - LUBRIFICAÇÃO SEMANAL
  // -------------------------------------------------------------
  const [weeklyTechnician, setWeeklyTechnician] = useState(currentUser || '');
  const [weeklyClass, setWeeklyClass] = useState('Mecânica de Usinagem 1.A');
  const [weeklyCourse, setWeeklyCourse] = useState<typeof COURSES[number]>('Mecânica de Usinagem');
  const [weeklyShift, setWeeklyShift] = useState<typeof SHIFTS[number]>('Manhã');
  const [weeklyDate, setWeeklyDate] = useState(todayStr);

  const [hydraulicReservoirLocated, setHydraulicReservoirLocated] = useState<'Sim' | 'Não' | ''>('');
  const [oilLevel, setOilLevel] = useState<'Entre MIN e MAX' | 'Abaixo do MIN' | 'Acima do MAX' | ''>('');
  const [oilComplementNeeded, setOilComplementNeeded] = useState<'Sim' | 'Não' | ''>('');
  const [oilVisualCondition, setOilVisualCondition] = useState<'Âmbar clara' | 'Escura' | 'Turva' | 'Leitosa' | ''>('');
  const [oilChangeNeeded, setOilChangeNeeded] = useState<'Sim' | 'Não' | ''>('');
  const [greaseNipplesLocated, setGreaseNipplesLocated] = useState<'Sim' | 'Não' | ''>('');
  const [greaseNipplesDirtOrExcess, setGreaseNipplesDirtOrExcess] = useState<'Sim' | 'Não' | ''>('');
  const [greasePumpingMethodApplied, setGreasePumpingMethodApplied] = useState<'Sim' | 'Não' | ''>('');
  const [weeklyObservations, setWeeklyObservations] = useState('');

  // -------------------------------------------------------------
  // STATE: FORMULÁRIO 2 - LUBRIFICAÇÃO SEMESTRAL
  // -------------------------------------------------------------
  const [semiannualTechnician, setSemiannualTechnician] = useState(currentUser || '');
  const [semiannualClass, setSemiannualClass] = useState('Mecânica de Usinagem 1.A');
  const [semiannualCourse, setSemiannualCourse] = useState<typeof COURSES[number]>('Mecânica de Usinagem');
  const [semiannualShift, setSemiannualShift] = useState<typeof SHIFTS[number]>('Manhã');
  const [semiannualDate, setSemiannualDate] = useState(todayStr);

  const [feedGearboxWorkingProperly, setFeedGearboxWorkingProperly] = useState<'Sim' | 'Não' | ''>('');
  const [oilConditionInitial, setOilConditionInitial] = useState<'Adequado' | 'Inadequado' | 'Não se aplica' | ''>('');
  const [oilDrainedProperly, setOilDrainedProperly] = useState<'Sim' | 'Não' | ''>('');
  const [drainedOilConditions, setDrainedOilConditions] = useState<string[]>([]);
  const [newOilDTE26FilledCorrectly, setNewOilDTE26FilledCorrectly] = useState<'Sim' | 'Não' | ''>('');
  const [oilSpecificationConfirmed, setOilSpecificationConfirmed] = useState(false);
  const [semiannualObservations, setSemiannualObservations] = useState('');

  // Shared UI States
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearTarget, setClearTarget] = useState<'semanal' | 'semestral'>('semanal');
  const [validationError, setValidationError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);
  const [activeReport, setActiveReport] = useState<FresaLubricationRecord | null>(null);

  // History State
  const [lubricationHistory, setLubricationHistory] = useState<FresaLubricationRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'semanal' | 'semestral' | 'attention'>('all');

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Persist history
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lubricationHistory));
  }, [lubricationHistory]);

  // Sync user name
  useEffect(() => {
    if (currentUser) {
      if (!weeklyTechnician) setWeeklyTechnician(currentUser);
      if (!semiannualTechnician) setSemiannualTechnician(currentUser);
    }
  }, [currentUser]);

  // Toggle multiple conditions for drained oil
  const handleToggleDrainedCondition = (cond: string) => {
    setDrainedOilConditions(prev => 
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  };

  // Clear Form Actions
  const handleClearWeekly = () => {
    setWeeklyTechnician(currentUser || '');
    setWeeklyClass('');
    setWeeklyCourse('Mecânica de Usinagem');
    setWeeklyShift('Manhã');
    setWeeklyDate(todayStr);
    setHydraulicReservoirLocated('');
    setOilLevel('');
    setOilComplementNeeded('');
    setOilVisualCondition('');
    setOilChangeNeeded('');
    setGreaseNipplesLocated('');
    setGreaseNipplesDirtOrExcess('');
    setGreasePumpingMethodApplied('');
    setWeeklyObservations('');
    setValidationError('');
    setShowClearConfirm(false);
    setToastMessage({ text: 'Formulário Semanal limpo com sucesso.', type: 'warning' });
  };

  const handleClearSemiannual = () => {
    setSemiannualTechnician(currentUser || '');
    setSemiannualClass('');
    setSemiannualCourse('Mecânica de Usinagem');
    setSemiannualShift('Manhã');
    setSemiannualDate(todayStr);
    setFeedGearboxWorkingProperly('');
    setOilConditionInitial('');
    setOilDrainedProperly('');
    setDrainedOilConditions([]);
    setNewOilDTE26FilledCorrectly('');
    setOilSpecificationConfirmed(false);
    setSemiannualObservations('');
    setValidationError('');
    setShowClearConfirm(false);
    setToastMessage({ text: 'Formulário Semestral limpo com sucesso.', type: 'warning' });
  };

  // Submit Weekly
  const handleSubmitWeekly = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!weeklyTechnician.trim()) {
      setValidationError('Por favor, informe o Responsável pela manutenção.');
      return;
    }
    if (!weeklyClass.trim()) {
      setValidationError('Por favor, informe a Turma.');
      return;
    }
    if (!weeklyDate) {
      setValidationError('Por favor, selecione a Data da manutenção.');
      return;
    }
    if (!hydraulicReservoirLocated) {
      setValidationError('Verificação 1: Selecione se o reservatório hidráulico foi localizado.');
      return;
    }
    if (!oilLevel) {
      setValidationError('Verificação 2: Selecione o nível do óleo.');
      return;
    }
    if (!oilComplementNeeded) {
      setValidationError('Verificação 3: Selecione se foi necessário completar o óleo.');
      return;
    }
    if (!oilVisualCondition) {
      setValidationError('Verificação 4: Selecione a condição visual do óleo.');
      return;
    }
    if (!oilChangeNeeded) {
      setValidationError('Verificação 5: Selecione se o óleo hidráulico precisa ser trocado.');
      return;
    }
    if (!greaseNipplesLocated) {
      setValidationError('Verificação 6: Selecione se os pinos graxeiros foram localizados.');
      return;
    }
    if (!greaseNipplesDirtOrExcess) {
      setValidationError('Verificação 7: Selecione se há sujeira ou excesso de graxa nos pinos.');
      return;
    }
    if (!greasePumpingMethodApplied) {
      setValidationError('Verificação 8: Selecione se a lubrificação por bombeamento foi realizada.');
      return;
    }

    const attentionItems: string[] = [];
    if (oilLevel === 'Abaixo do MIN') attentionItems.push('Nível do óleo hidráulico abaixo do mínimo');
    if (oilLevel === 'Acima do MAX') attentionItems.push('Nível do óleo hidráulico acima do máximo');
    if (oilVisualCondition === 'Escura') attentionItems.push('Óleo hidráulico com coloração escura (degradação térmica)');
    if (oilVisualCondition === 'Turva') attentionItems.push('Óleo hidráulico turvo (contaminação por particulado)');
    if (oilVisualCondition === 'Leitosa') attentionItems.push('Óleo hidráulico com aspecto leitoso (contaminação por água/fluido solúvel)');
    if (oilChangeNeeded === 'Sim') attentionItems.push('Necessidade confirmada de substituição do óleo hidráulico');
    if (greaseNipplesDirtOrExcess === 'Sim') attentionItems.push('Presença de sujeira ou excesso de graxa nos pinos');
    if (greasePumpingMethodApplied === 'Não') attentionItems.push('Método de bombeamento de graxa não executado conforme padrão');

    const requiresAttention = attentionItems.length > 0;

    const record: FresaWeeklyLubrication = {
      id: `LUB-SEM-${Date.now()}`,
      type: 'Semanal',
      machineId: koneMachine.id,
      machineName: `Fresadora Kone (PAT: ${koneMachine.id})`,
      technicianName: weeklyTechnician.trim(),
      studentClass: weeklyClass.trim(),
      course: weeklyCourse,
      shift: weeklyShift,
      maintenanceDate: weeklyDate,
      hydraulicReservoirLocated,
      oilLevel,
      oilComplementNeeded,
      oilVisualCondition,
      oilChangeNeeded,
      greaseNipplesLocated,
      greaseNipplesDirtOrExcess,
      greasePumpingMethodApplied,
      observations: weeklyObservations.trim(),
      requiresAttention,
      attentionItems,
      submittedAt: new Date().toISOString(),
    };

    setLubricationHistory(prev => [record, ...prev]);
    setActiveReport(record);
    setActiveTab('report');

    if (onAddOperationalLog) {
      onAddOperationalLog({
        id: `OP-${Date.now()}`,
        machineId: koneMachine.id,
        type: 'Lubrificação',
        timestamp: new Date().toISOString(),
        user: weeklyTechnician,
        details: requiresAttention 
          ? `Lubrificação Semanal Kone: ${attentionItems.length} ponto(s) de atenção.`
          : 'Lubrificação Semanal Kone concluída com sucesso (Padrão OK).',
        course: weeklyCourse,
        studentClass: weeklyClass,
        shift: weeklyShift,
      });
    }

    setToastMessage({
      text: requiresAttention 
        ? 'Manutenção semanal registrada com apontamentos de atenção.' 
        : 'Manutenção semanal finalizada com sucesso!',
      type: requiresAttention ? 'warning' : 'success',
    });
  };

  // Submit Semiannual
  const handleSubmitSemiannual = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!semiannualTechnician.trim()) {
      setValidationError('Por favor, informe o Responsável pela manutenção.');
      return;
    }
    if (!semiannualClass.trim()) {
      setValidationError('Por favor, informe a Turma.');
      return;
    }
    if (!semiannualDate) {
      setValidationError('Por favor, selecione a Data da manutenção.');
      return;
    }
    if (!feedGearboxWorkingProperly) {
      setValidationError('Verificação 1: Selecione se a caixa de avanços estava funcionando corretamente.');
      return;
    }
    if (!oilConditionInitial) {
      setValidationError('Verificação 2: Selecione a condição inicial do óleo.');
      return;
    }
    if (!oilDrainedProperly) {
      setValidationError('Verificação 3: Selecione se o óleo foi drenado corretamente.');
      return;
    }
    if (drainedOilConditions.length === 0) {
      setValidationError('Verificação 4: Selecione ao menos uma condição do óleo retirado.');
      return;
    }
    if (!newOilDTE26FilledCorrectly) {
      setValidationError('Verificação 5: Confirme se o óleo Mobil DTE-26 foi colocado até o nível correto.');
      return;
    }
    if (!oilSpecificationConfirmed) {
      setValidationError('Verificação 5: É obrigatório confirmar a conferência da especificação Mobil DTE-26 no manual.');
      return;
    }

    const attentionItems: string[] = [];
    if (feedGearboxWorkingProperly === 'Não') attentionItems.push('Caixa de avanços apresentava anomalias antes da intervenção');
    if (oilConditionInitial === 'Inadequado') attentionItems.push('Condição inicial do óleo da caixa de avanços inadequada');
    if (drainedOilConditions.includes('Cor escura')) attentionItems.push('Óleo drenado com coloração escura');
    if (drainedOilConditions.includes('Cheiro de queimado')) attentionItems.push('Óleo drenado com odor característico de queima (sobrecarga mecânica)');
    if (drainedOilConditions.includes('Presença de partículas metálicas')) attentionItems.push('Partículas metálicas identificadas no dreno (desgaste de engrenagens)');
    if (drainedOilConditions.includes('Aspecto leitoso')) attentionItems.push('Óleo drenado com aspecto leitoso (emulsão/água)');
    if (newOilDTE26FilledCorrectly === 'Não') attentionItems.push('Abastecimento de óleo novo Mobil DTE-26 não atingiu o nível recomendado');

    const requiresAttention = attentionItems.length > 0;

    const record: FresaSemiannualLubrication = {
      id: `LUB-SEMES-${Date.now()}`,
      type: 'Semestral',
      machineId: koneMachine.id,
      machineName: `Fresadora Universal / Kone (PAT: ${koneMachine.id})`,
      technicianName: semiannualTechnician.trim(),
      studentClass: semiannualClass.trim(),
      course: semiannualCourse,
      shift: semiannualShift,
      maintenanceDate: semiannualDate,
      feedGearboxWorkingProperly,
      oilConditionInitial,
      oilDrainedProperly,
      drainedOilConditions,
      newOilDTE26FilledCorrectly,
      oilSpecificationConfirmed,
      observations: semiannualObservations.trim(),
      requiresAttention,
      attentionItems,
      submittedAt: new Date().toISOString(),
    };

    setLubricationHistory(prev => [record, ...prev]);
    setActiveReport(record);
    setActiveTab('report');

    if (onAddOperationalLog) {
      onAddOperationalLog({
        id: `OP-${Date.now()}`,
        machineId: koneMachine.id,
        type: 'Lubrificação',
        timestamp: new Date().toISOString(),
        user: semiannualTechnician,
        details: requiresAttention
          ? `Troca Semestral Caixa de Avanços Kone: ${attentionItems.length} ponto(s) de atenção.`
          : 'Troca Semestral Caixa de Avanços Kone concluída com Mobil DTE-26.',
        course: semiannualCourse,
        studentClass: semiannualClass,
        shift: semiannualShift,
      });
    }

    setToastMessage({
      text: requiresAttention 
        ? 'Manutenção semestral registrada com apontamentos de atenção técnica.' 
        : 'Manutenção semestral finalizada com sucesso!',
      type: requiresAttention ? 'warning' : 'success',
    });
  };

  const filteredHistory = lubricationHistory.filter(item => {
    const matchesSearch = 
      item.technicianName.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.studentClass.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.machineName.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.course.toLowerCase().includes(historySearch.toLowerCase());

    const matchesFilter = 
      historyFilter === 'all' ? true :
      historyFilter === 'semanal' ? item.type === 'Semanal' :
      historyFilter === 'semestral' ? item.type === 'Semestral' :
      item.requiresAttention;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16 font-sans">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 max-w-md ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' 
            : 'bg-amber-950/95 border-amber-500/50 text-amber-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={20} className="text-amber-400 shrink-0" />}
          <span className="text-xs md:text-sm font-medium flex-1">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* In-Machine Navigation Header if Embedded */}
      {onClose && (
        <div className="flex items-center justify-between pb-1 print:hidden animate-fade-in">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-theme-card hover:bg-theme-cardHover border border-theme-border rounded-xl text-xs font-bold uppercase tracking-wider text-theme-text-main shadow-sm hover:border-theme-accent-solid transition flex items-center gap-2 group"
          >
            <ArrowLeft size={16} className="text-theme-accent-solid group-hover:-translate-x-1 transition-transform" />
            Voltar aos Detalhes da Máquina
          </button>
          <div className="flex items-center gap-2 text-xs text-theme-text-muted font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Módulo Interno da Máquina</span>
          </div>
        </div>
      )}

      {/* HEADER & INDUSTRIAL TITLE */}
      <div className="bg-theme-card p-6 md:p-8 rounded-[28px] border border-theme-border shadow-soft relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-theme-accent-danger rounded-xl flex items-center justify-center text-white shadow-glow-red border border-white/10">
              <Droplets size={26} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-theme-text-muted font-bold">SENAI • CÉLULA 1.A • LUBRIFICAÇÃO INDUSTRIAL</span>
              <h1 className="text-2xl md:text-4xl font-bold font-tech uppercase tracking-tight text-theme-text-main">
                LUBRIFICAÇÃO DE MÁQUINAS — <span className="text-theme-accent-solid">FRESADORA KONE</span>
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap bg-theme-input p-1 rounded-xl border border-theme-border gap-1">
            <button
              onClick={() => setActiveTab('semanal')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'semanal' 
                  ? 'bg-theme-accent-solid text-white shadow-glow' 
                  : 'text-theme-text-muted hover:text-white'
              }`}
            >
              1. Lubrificação Semanal
            </button>
            <button
              onClick={() => setActiveTab('semestral')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'semestral' 
                  ? 'bg-theme-accent-solid text-white shadow-glow' 
                  : 'text-theme-text-muted hover:text-white'
              }`}
            >
              2. Lubrificação Semestral
            </button>
            {activeReport && (
              <button
                onClick={() => setActiveTab('report')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === 'report' 
                    ? 'bg-theme-accent-solid text-white shadow-glow' 
                    : 'text-theme-text-muted hover:text-white'
                }`}
              >
                Laudo Atual
              </button>
            )}
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                activeTab === 'history' 
                  ? 'bg-theme-accent-solid text-white shadow-glow' 
                  : 'text-theme-text-muted hover:text-white'
              }`}
            >
              <FileText size={14} />
              Histórico ({lubricationHistory.length})
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. LUBRIFICAÇÃO SEMANAL — FRESADORA KONE                       */}
      {/* ============================================================== */}
      {activeTab === 'semanal' && (
        <form onSubmit={handleSubmitWeekly} className="space-y-6 max-w-5xl mx-auto print:hidden">
          
          {validationError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500 text-red-400 text-sm font-bold flex items-center gap-3 animate-shake">
              <AlertCircle size={20} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Card: Identificação do equipamento */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-theme-border">
              <div className="p-2 rounded-lg bg-theme-input border border-theme-border text-theme-accent-solid">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-theme-text-main font-tech uppercase tracking-wide">
                  Lubrificação Semanal — Fresadora Kone
                </h2>
                <p className="text-xs text-theme-text-muted">Identificação do equipamento e da equipe técnica</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Responsável pela Manutenção <span className="text-theme-accent-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do operador / aluno"
                  value={weeklyTechnician}
                  onChange={(e) => setWeeklyTechnician(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main placeholder-theme-text-muted/40 outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Turma <span className="text-theme-accent-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: T-2024 / Mecânica 1.A"
                  value={weeklyClass}
                  onChange={(e) => setWeeklyClass(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main placeholder-theme-text-muted/40 outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Curso <span className="text-theme-accent-danger">*</span>
                </label>
                <select
                  value={weeklyCourse}
                  onChange={(e) => setWeeklyCourse(e.target.value as any)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                >
                  {COURSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Turno <span className="text-theme-accent-danger">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1 bg-theme-input p-1 rounded-xl border border-theme-border">
                  {SHIFTS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setWeeklyShift(s)}
                      className={`py-2 rounded-lg text-xs font-bold transition ${
                        weeklyShift === s 
                          ? 'bg-theme-accent-solid text-white shadow-sm' 
                          : 'text-theme-text-muted hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Data da Manutenção <span className="text-theme-accent-danger">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={weeklyDate}
                  onChange={(e) => setWeeklyDate(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Ativo Selecionado
                </label>
                <div className="bg-theme-input/50 border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main">
                  Fresadora Kone • PAT {koneMachine.id}
                </div>
              </div>
            </div>

            {/* Orientação */}
            <div className="mt-6 bg-theme-input/60 p-4 rounded-xl border border-theme-border/70 border-l-4 border-l-theme-accent-solid text-xs text-theme-text-muted leading-relaxed">
              "Marque o status de cada componente de acordo com a inspeção. Selecione a opção correspondente à condição encontrada. Registre os ajustes necessários e as intervenções realizadas."
            </div>
          </div>

          {/* Verificação 1 — Reservatório hidráulico */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 1</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Reservatório hidráulico
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-theme-border bg-black/40 relative shadow-inner">
                <img 
                  src="/assets/aistudio/image_6db5b7dc.png" 
                  alt="Sistema Hidráulico Fresa Kone" 
                  className="w-full h-56 object-cover object-center"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm p-2 rounded-xl text-[11px] text-white flex items-center gap-2 border border-white/10">
                  <Info size={14} className="text-amber-400 shrink-0" />
                  <span>Referência: Unidade hidráulica com visor de nível e bocal de abastecimento.</span>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-3">
                <p className="text-xs text-theme-text-muted">
                  O reservatório hidráulico foi localizado corretamente?
                </p>
                <div className="flex gap-4">
                  {(['Sim', 'Não'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setHydraulicReservoirLocated(opt)}
                      className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                        hydraulicReservoirLocated === opt
                          ? opt === 'Sim' ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow' : 'bg-red-600 border-red-500 text-white shadow-glow-red'
                          : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                      }`}
                    >
                      {opt === 'Sim' ? <Check size={16} /> : <X size={16} />} {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Verificação 2 — Nível do óleo */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 2</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Nível do óleo
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">O nível de óleo está:</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Entre MIN e MAX', 'Abaixo do MIN', 'Acima do MAX'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setOilLevel(opt)}
                  className={`py-3.5 px-4 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                    oilLevel === opt
                      ? opt === 'Entre MIN e MAX' ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow' : 'bg-amber-600 border-amber-500 text-white shadow-glow'
                      : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                  }`}
                >
                  {oilLevel === opt && <Check size={14} />} {opt}
                </button>
              ))}
            </div>

            {oilLevel && oilLevel !== 'Entre MIN e MAX' && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0 text-amber-400" />
                <span>Nível fora do ideal: Requer intervenção de correção (reabastecimento ou drenagem do excedente).</span>
              </div>
            )}
          </div>

          {/* Verificação 3 — Complementação do óleo */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 3</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Complementação do óleo
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">Foi necessário completar o nível do óleo?</p>

            <div className="flex gap-4">
              {(['Sim', 'Não'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setOilComplementNeeded(opt)}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                    oilComplementNeeded === opt
                      ? 'bg-theme-accent-solid border-theme-accent-solid text-white shadow-glow'
                      : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                  }`}
                >
                  {oilComplementNeeded === opt && <Check size={14} />} {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Verificação 4 — Cor do óleo */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 4</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Cor do óleo
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">Qual é a condição visual do óleo?</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['Âmbar clara', 'Escura', 'Turva', 'Leitosa'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setOilVisualCondition(opt)}
                  className={`py-3.5 px-3 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                    oilVisualCondition === opt
                      ? opt === 'Âmbar clara' ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow' : 'bg-red-600 border-red-500 text-white shadow-glow-red'
                      : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                  }`}
                >
                  {oilVisualCondition === opt && <Check size={14} />} {opt}
                </button>
              ))}
            </div>

            {oilVisualCondition && oilVisualCondition !== 'Âmbar clara' && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0 text-red-400" />
                <span>Condição degradada ({oilVisualCondition}): Indica oxidação térmica, partículas ou contaminação por água.</span>
              </div>
            )}
          </div>

          {/* Verificação 5 — Troca do óleo hidráulico */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 5</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Troca do óleo hidráulico
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">O óleo hidráulico precisa ser trocado?</p>

            <div className="flex gap-4">
              {(['Sim', 'Não'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setOilChangeNeeded(opt)}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                    oilChangeNeeded === opt
                      ? opt === 'Sim' ? 'bg-red-600 border-red-500 text-white shadow-glow-red' : 'bg-emerald-500 border-emerald-400 text-white shadow-glow'
                      : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                  }`}
                >
                  {oilChangeNeeded === opt && <Check size={14} />} {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Verificação 6 — Pinos graxeiros */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 6</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Pinos Graxeiros
            </h3>

            {/* Espaço reservado para imagem do componente */}
            <div className="p-4 rounded-xl border border-dashed border-theme-border bg-theme-input/40 mb-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-theme-input flex items-center justify-center text-theme-text-muted">
                <Wrench size={20} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-theme-text-main uppercase">Espaço Reservado para Imagem: Pinos Graxeiros</div>
                <div className="text-theme-text-muted text-[11px]">Guias, fusos e barramentos da mesa de coordenadas da Fresadora Kone</div>
              </div>
            </div>

            <p className="text-xs text-theme-text-muted mb-4">Os pinos graxeiros foram localizados?</p>

            <div className="flex gap-4">
              {(['Sim', 'Não'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setGreaseNipplesLocated(opt)}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                    greaseNipplesLocated === opt
                      ? opt === 'Sim' ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow' : 'bg-red-600 border-red-500 text-white shadow-glow-red'
                      : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                  }`}
                >
                  {greaseNipplesLocated === opt && <Check size={14} />} {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Verificação 7 — Limpeza dos pinos graxeiros */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 7</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Limpeza dos pinos graxeiros
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">Há sujeira ou excesso de graxa nos pinos graxeiros?</p>

            <div className="flex gap-4">
              {(['Sim', 'Não'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setGreaseNipplesDirtOrExcess(opt)}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                    greaseNipplesDirtOrExcess === opt
                      ? opt === 'Não' ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow' : 'bg-amber-600 border-amber-500 text-white shadow-glow'
                      : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                  }`}
                >
                  {greaseNipplesDirtOrExcess === opt && <Check size={14} />} {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Verificação 8 — Aplicação da graxa */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 8</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Aplicação da graxa
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">
              A lubrificação foi realizada conforme o procedimento recomendado, utilizando o método de bombeamento?
            </p>

            <div className="flex gap-4">
              {(['Sim', 'Não'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setGreasePumpingMethodApplied(opt)}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                    greasePumpingMethodApplied === opt
                      ? opt === 'Sim' ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow' : 'bg-red-600 border-red-500 text-white shadow-glow-red'
                      : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                  }`}
                >
                  {greasePumpingMethodApplied === opt && <Check size={14} />} {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Observações da manutenção semanal */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-2">
              Observações da Manutenção Semanal
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">
              Registre: problemas encontrados, necessidade de ajustes, vazamentos identificados, componentes que necessitam de intervenção e serviços realizados.
            </p>

            <textarea
              rows={4}
              value={weeklyObservations}
              onChange={(e) => setWeeklyObservations(e.target.value)}
              placeholder="Ex: Realizada limpeza dos 6 pinos graxeiros das guias X/Y com pano limpo; completado 250ml de óleo ISO VG 68 no reservatório hidráulico; sem vazamentos aparentes."
              className="w-full bg-theme-input border border-theme-border rounded-2xl p-4 text-sm font-medium text-theme-text-main placeholder-theme-text-muted/40 outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition resize-y"
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-theme-card p-6 rounded-[24px] border border-theme-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                setClearTarget('semanal');
                setShowClearConfirm(true);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Limpar Formulário
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-accent hover:brightness-110 text-white text-sm font-bold uppercase tracking-wider shadow-glow hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <Send size={18} /> Finalizar Manutenção Semanal
            </button>
          </div>

        </form>
      )}

      {/* ============================================================== */}
      {/* 2. LUBRIFICAÇÃO SEMESTRAL — FRESADORA KONE                     */}
      {/* ============================================================== */}
      {activeTab === 'semestral' && (
        <form onSubmit={handleSubmitSemiannual} className="space-y-6 max-w-5xl mx-auto print:hidden">

          {validationError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500 text-red-400 text-sm font-bold flex items-center gap-3 animate-shake">
              <AlertCircle size={20} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Card: Identificação do equipamento */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-theme-border">
              <div className="p-2 rounded-lg bg-theme-input border border-theme-border text-theme-accent-solid">
                <Wrench size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-theme-text-main font-tech uppercase tracking-wide">
                  Lubrificação Semestral — Fresadora Universal / Kone
                </h2>
                <p className="text-xs text-theme-text-muted">Intervenção semestral na caixa de avanços e transmissão</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Responsável pela Manutenção <span className="text-theme-accent-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do operador / aluno"
                  value={semiannualTechnician}
                  onChange={(e) => setSemiannualTechnician(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main placeholder-theme-text-muted/40 outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Turma <span className="text-theme-accent-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: T-2024 / Mecânica 1.A"
                  value={semiannualClass}
                  onChange={(e) => setSemiannualClass(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main placeholder-theme-text-muted/40 outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Curso <span className="text-theme-accent-danger">*</span>
                </label>
                <select
                  value={semiannualCourse}
                  onChange={(e) => setSemiannualCourse(e.target.value as any)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                >
                  {COURSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Turno <span className="text-theme-accent-danger">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1 bg-theme-input p-1 rounded-xl border border-theme-border">
                  {SHIFTS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSemiannualShift(s)}
                      className={`py-2 rounded-lg text-xs font-bold transition ${
                        semiannualShift === s 
                          ? 'bg-theme-accent-solid text-white shadow-sm' 
                          : 'text-theme-text-muted hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Data da Manutenção <span className="text-theme-accent-danger">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={semiannualDate}
                  onChange={(e) => setSemiannualDate(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Ativo Selecionado
                </label>
                <div className="bg-theme-input/50 border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main">
                  Fresadora Kone • PAT {koneMachine.id}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-theme-input/60 p-4 rounded-xl border border-theme-border/70 border-l-4 border-l-theme-accent-solid text-xs text-theme-text-muted leading-relaxed">
              "Marque as respostas de acordo com as condições encontradas durante a manutenção semestral. Registre a condição do óleo, o procedimento de drenagem e o abastecimento realizado."
            </div>
          </div>

          {/* Verificação 1 — Caixa de avanços */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 1</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Caixa de Avanços
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-theme-border bg-black/40 relative shadow-inner">
                <img 
                  src="/assets/aistudio/image_6552fb35.png" 
                  alt="Caixa de Avanços Semestral Fresa Kone" 
                  className="w-full h-56 object-cover object-center"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm p-2 rounded-xl text-[11px] text-white flex items-center gap-2 border border-white/10">
                  <Info size={14} className="text-red-400 shrink-0" />
                  <span>Referência: Caixa de engrenagens de avanço com visor de nível indicador 2.</span>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-3">
                <p className="text-xs text-theme-text-muted">
                  A caixa de avanços estava funcionando corretamente antes da manutenção?
                </p>
                <div className="flex gap-4">
                  {(['Sim', 'Não'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFeedGearboxWorkingProperly(opt)}
                      className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                        feedGearboxWorkingProperly === opt
                          ? opt === 'Sim' ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow' : 'bg-red-600 border-red-500 text-white shadow-glow-red'
                          : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                      }`}
                    >
                      {opt === 'Sim' ? <Check size={16} /> : <X size={16} />} {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Verificação 2 — Condição inicial do óleo */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 2</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Condição inicial do óleo
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">Qual era o nível ou a condição do óleo antes da troca?</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Adequado', 'Inadequado', 'Não se aplica'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setOilConditionInitial(opt)}
                  className={`py-3.5 px-4 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                    oilConditionInitial === opt
                      ? opt === 'Adequado' ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow' : 'bg-amber-600 border-amber-500 text-white shadow-glow'
                      : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                  }`}
                >
                  {oilConditionInitial === opt && <Check size={14} />} {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Verificação 3 — Drenagem do óleo */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 3</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Drenagem do óleo
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">O óleo antigo foi drenado corretamente?</p>

            <div className="flex gap-4">
              {(['Sim', 'Não'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setOilDrainedProperly(opt)}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                    oilDrainedProperly === opt
                      ? opt === 'Sim' ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow' : 'bg-red-600 border-red-500 text-white shadow-glow-red'
                      : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                  }`}
                >
                  {oilDrainedProperly === opt && <Check size={14} />} {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Verificação 4 — Condição do óleo retirado */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 4</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-2">
              Condição do óleo retirado
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">
              Qual era a condição do óleo retirado? (Você pode selecionar mais de uma opção se aplicável):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DRAiNED_OIL_CONDITIONS.map(cond => {
                const isSelected = drainedOilConditions.includes(cond);
                return (
                  <div
                    key={cond}
                    onClick={() => handleToggleDrainedCondition(cond)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group select-none ${
                      isSelected
                        ? cond === 'Cor normal' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-red-500/10 border-red-500 text-red-300'
                        : 'bg-theme-input/60 border-theme-border text-theme-text-muted hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold">{cond}</span>
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                      isSelected ? 'bg-theme-accent-solid border-theme-accent-solid text-white' : 'border-theme-border bg-theme-input'
                    }`}>
                      {isSelected && <Check size={12} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {drainedOilConditions.some(c => c !== 'Cor normal') && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0 text-red-400" />
                <span>Alerta Técnico: Presença de partículas, escurecimento ou odor de queimado exige inspeção visual das engrenagens antes do abastecimento.</span>
              </div>
            )}
          </div>

          {/* Verificação 5 — Abastecimento com óleo novo */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">VERIFICAÇÃO 5</span>
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-4">
              Abastecimento com óleo novo
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-6">
              <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-theme-border bg-black/40 relative shadow-inner">
                <img 
                  src="/assets/aistudio/image_6552fb35.png" 
                  alt="Ponto de Abastecimento Caixa de Avanços" 
                  className="w-full h-56 object-cover object-center"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm p-2 rounded-xl text-[11px] text-white flex items-center gap-2 border border-white/10">
                  <Info size={14} className="text-blue-400 shrink-0" />
                  <span>Lubrificante Especificado: Mobil DTE-26 (ISO VG 68 Antidesgaste).</span>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <p className="text-xs text-theme-text-muted">
                  O óleo novo especificado para a manutenção, <strong>DTE-26 da Mobil</strong>, foi colocado até o nível correto?
                </p>
                <div className="flex gap-4">
                  {(['Sim', 'Não'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setNewOilDTE26FilledCorrectly(opt)}
                      className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border ${
                        newOilDTE26FilledCorrectly === opt
                          ? opt === 'Sim' ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow' : 'bg-red-600 border-red-500 text-white shadow-glow-red'
                          : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                      }`}
                    >
                      {opt === 'Sim' ? <Check size={16} /> : <X size={16} />} {opt}
                    </button>
                  ))}
                </div>

                {/* Confirmação com o manual */}
                <div 
                  onClick={() => setOilSpecificationConfirmed(!oilSpecificationConfirmed)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    oilSpecificationConfirmed 
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' 
                      : 'bg-theme-input/60 border-theme-border text-theme-text-muted hover:text-white'
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
                    oilSpecificationConfirmed ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-theme-border bg-theme-input'
                  }`}>
                    {oilSpecificationConfirmed && <Check size={12} />}
                  </div>
                  <div className="text-xs leading-snug">
                    <span className="font-bold uppercase tracking-wider block mb-0.5">Confirmação de Especificação Técnica:</span>
                    "Confirmo que o lubrificante Mobil DTE-26 corresponde à especificação técnica recomendada no manual da máquina antes da execução do serviço."
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Observações da manutenção semestral */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <h3 className="text-base md:text-lg font-bold text-theme-text-main mb-2">
              Observações da Manutenção Semestral
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">
              Registre: condições encontradas, estado do óleo retirado, necessidade de limpeza ou ajustes, vazamentos identificados, quantidade de óleo utilizada e pendências para a próxima manutenção.
            </p>

            <textarea
              rows={4}
              value={semiannualObservations}
              onChange={(e) => setSemiannualObservations(e.target.value)}
              placeholder="Ex: Realizada drenagem de aproximadamente 2,5 litros de óleo; sem resíduos metálicos; abastecido 2,5L de Mobil DTE-26 novo; visor de nível na marca central."
              className="w-full bg-theme-input border border-theme-border rounded-2xl p-4 text-sm font-medium text-theme-text-main placeholder-theme-text-muted/40 outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition resize-y"
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-theme-card p-6 rounded-[24px] border border-theme-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                setClearTarget('semestral');
                setShowClearConfirm(true);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Limpar Formulário
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-accent hover:brightness-110 text-white text-sm font-bold uppercase tracking-wider shadow-glow hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <Send size={18} /> Finalizar Manutenção Semestral
            </button>
          </div>

        </form>
      )}

      {/* ============================================================== */}
      {/* CLEAR MODAL                                                     */}
      {/* ============================================================== */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card max-w-md w-full rounded-2xl p-6 border border-theme-border shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-theme-text-main font-tech uppercase">Confirmar Limpeza</h3>
            <p className="text-xs text-theme-text-muted leading-relaxed">
              Tem certeza de que deseja apagar todos os dados preenchidos no formulário de lubrificação {clearTarget}?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-theme-input text-theme-text-muted hover:text-white font-bold text-xs uppercase"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={clearTarget === 'semanal' ? handleClearWeekly : handleClearSemiannual}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase shadow-glow-red"
              >
                Sim, Limpar Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* REPORT VIEW (PRINTABLE / PDF)                                  */}
      {/* ============================================================== */}
      {activeTab === 'report' && activeReport && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-theme-card p-4 rounded-2xl border border-theme-border print:hidden">
            <button
              onClick={() => setActiveTab(activeReport.type === 'Semanal' ? 'semanal' : 'semestral')}
              className="px-4 py-2 rounded-xl bg-theme-input hover:bg-theme-card text-xs font-bold text-theme-text-muted hover:text-white border border-theme-border transition"
            >
              ← Voltar ao Formulário
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider shadow-glow flex items-center gap-2 hover:scale-105 transition"
            >
              <Printer size={16} /> Imprimir / Salvar em PDF
            </button>
          </div>

          {/* LAUDO TÉCNICO PRINTABLE */}
          <div className="bg-theme-card p-8 md:p-12 rounded-[28px] border border-theme-border shadow-2xl text-theme-text-main print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
            
            {/* Header */}
            <div className="border-b-2 border-theme-border print:border-black pb-6 mb-6 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-600 flex items-center justify-center text-white font-bold text-xs rounded-xl shadow-glow-red print:shadow-none">
                  SENAI
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold font-tech uppercase tracking-wide print:text-black">
                    RELATÓRIO DE LUBRIFICAÇÃO INDUSTRIAL
                  </h2>
                  <p className="text-xs text-theme-text-muted font-mono print:text-gray-600">
                    Fresadora Kone • Célula 1.A • Manutenção {activeReport.type}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-theme-text-muted print:text-gray-500">Nº DO REGISTRO</div>
                <div className="text-sm font-mono font-bold text-theme-accent-solid print:text-red-700">
                  {activeReport.id}
                </div>
                <div className="text-[10px] text-theme-text-muted font-mono mt-0.5 print:text-gray-500">
                  Realizado em: {new Date(activeReport.submittedAt).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            {/* STATUS BANNER */}
            {activeReport.requiresAttention ? (
              <div className="mb-6 p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-amber-200 print:bg-yellow-100 print:text-yellow-900 print:border-yellow-600 space-y-2">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={24} className="shrink-0 text-amber-400 print:text-yellow-700" />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-amber-300 print:text-yellow-800">
                      ATENÇÃO: PONTOS CRÍTICOS IDENTIFICADOS NA LUBRIFICAÇÃO
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">
                      A manutenção identificou componentes que necessitam de intervenção ou monitoramento técnico.
                    </p>
                  </div>
                </div>
                <ul className="list-disc list-inside text-xs pl-8 font-mono space-y-0.5">
                  {activeReport.attentionItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 text-emerald-300 print:bg-green-100 print:text-green-900 print:border-green-600 flex items-center gap-3">
                <CheckCircle2 size={24} className="shrink-0 text-emerald-400 print:text-green-700" />
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wide">
                    LUBRIFICAÇÃO CONFORME — NENHUMA ANOMALIA DETECTADA
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    Todos os procedimentos recomendados e níveis de fluido foram validados em conformidade técnica.
                  </p>
                </div>
              </div>
            )}

            {/* Identificação Geral */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-theme-input/50 print:bg-gray-100 p-4 rounded-xl border border-theme-border print:border-gray-300 text-xs mb-6">
              <div>
                <span className="block text-[10px] font-bold text-theme-text-muted uppercase print:text-gray-500">Máquina</span>
                <span className="font-bold print:text-black">{activeReport.machineName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-theme-text-muted uppercase print:text-gray-500">Responsável</span>
                <span className="font-bold print:text-black">{activeReport.technicianName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-theme-text-muted uppercase print:text-gray-500">Curso</span>
                <span className="font-bold print:text-black">{activeReport.course}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-theme-text-muted uppercase print:text-gray-500">Turma / Turno</span>
                <span className="font-bold print:text-black">{activeReport.studentClass} ({activeReport.shift})</span>
              </div>
            </div>

            {/* Tabela de Verificações */}
            <h3 className="font-bold text-sm uppercase tracking-wider mb-3 text-theme-text-main print:text-black">
              Resultados da Inspeção Técnica ({activeReport.type})
            </h3>

            <div className="border border-theme-border print:border-gray-300 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-theme-sidebar print:bg-gray-200 uppercase font-bold text-[10px] text-theme-text-muted print:text-gray-700 border-b border-theme-border print:border-gray-300">
                  <tr>
                    <th className="p-3">Verificação</th>
                    <th className="p-3">Condição Encontrada</th>
                    <th className="p-3 text-right">Avaliação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border print:divide-gray-300 font-sans">
                  {activeReport.type === 'Semanal' ? (
                    <>
                      <tr>
                        <td className="p-3 font-bold">1. Reservatório Hidráulico</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Localizado corretamente</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaWeeklyLubrication).hydraulicReservoirLocated}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">2. Nível do Óleo Hidráulico</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Visor de medição</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaWeeklyLubrication).oilLevel}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">3. Complementação de Óleo</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Necessidade de adição de óleo</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaWeeklyLubrication).oilComplementNeeded}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">4. Condição Visual do Óleo</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Aparência do fluido</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaWeeklyLubrication).oilVisualCondition}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">5. Necessidade de Troca</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Troca total recomendada</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaWeeklyLubrication).oilChangeNeeded}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">6. Pinos Graxeiros</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Localização dos pontos de engraxe</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaWeeklyLubrication).greaseNipplesLocated}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">7. Limpeza dos Pinos</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Presença de sujeira ou excesso</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaWeeklyLubrication).greaseNipplesDirtOrExcess}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">8. Bombeamento de Graxa</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Procedimento de injeção manual</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaWeeklyLubrication).greasePumpingMethodApplied}</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td className="p-3 font-bold">1. Caixa de Avanços</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Funcionamento anterior à intervenção</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaSemiannualLubrication).feedGearboxWorkingProperly}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">2. Condição Inicial do Óleo</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Nível e aspecto antes da drenagem</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaSemiannualLubrication).oilConditionInitial}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">3. Drenagem do Óleo Antigo</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Esgotamento completo no cárter</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaSemiannualLubrication).oilDrainedProperly}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">4. Condição do Óleo Retirado</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Análise sensorial</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaSemiannualLubrication).drainedOilConditions.join(', ')}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">5. Abastecimento Mobil DTE-26</td>
                        <td className="p-3 text-theme-text-muted print:text-gray-600">Nível correto no visor</td>
                        <td className="p-3 text-right font-bold">{(activeReport as FresaSemiannualLubrication).newOilDTE26FilledCorrectly}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Observações */}
            <div className="bg-theme-input/40 print:bg-gray-50 p-4 rounded-xl border border-theme-border print:border-gray-300 text-xs mb-8">
              <span className="block text-[10px] font-bold text-theme-text-muted print:text-gray-600 uppercase mb-1">
                Observações Técnicas e Intervenções
              </span>
              <p className="font-mono leading-relaxed print:text-black">
                {activeReport.observations || 'Nenhuma observação adicional informada.'}
              </p>
            </div>

            {/* Assinaturas */}
            <div className="pt-8 border-t border-theme-border print:border-black grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-b border-theme-border print:border-black w-48 mx-auto mb-2"></div>
                <div className="font-bold print:text-black">{activeReport.technicianName}</div>
                <div className="text-[10px] text-theme-text-muted print:text-gray-500 uppercase">Técnico / Responsável</div>
              </div>
              <div>
                <div className="border-b border-theme-border print:border-black w-48 mx-auto mb-2"></div>
                <div className="font-bold print:text-black">Supervisão Técnica SENAI</div>
                <div className="text-[10px] text-theme-text-muted print:text-gray-500 uppercase">Visto de Manutenção</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* HISTÓRICO DE MANUTENÇÃO                                         */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6 max-w-5xl mx-auto print:hidden">
          
          <div className="p-4 rounded-2xl bg-theme-card border border-theme-border shadow-soft flex items-start gap-3">
            <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-theme-text-muted space-y-1">
              <p className="font-bold text-theme-text-main">
                Armazenamento de Dados de Lubrificação
              </p>
              <p>
                Os registros estão salvos localmente sob a chave <code className="text-theme-accent-solid font-mono">localStorage (senai_kone_lubrications)</code> e vinculados ao horímetro e histórico operacional da máquina na oficina.
              </p>
              <p className="text-[11px] text-theme-text-muted/80">
                💡 <strong>Solução em Nuvem:</strong> Para centralizar os dados entre múltiplos computadores ou tablets da bancada SENAI, recomenda-se a ativação do <strong>Firebase Firestore</strong>, permitindo persistência de relatórios multi-usuário.
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-theme-card p-4 rounded-2xl border border-theme-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
              <input
                type="text"
                placeholder="Buscar por técnico, turma ou curso..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-theme-input pl-10 pr-4 py-2 rounded-xl text-xs font-medium text-theme-text-main outline-none border border-theme-border focus:border-theme-accent-solid"
              />
            </div>

            <div className="flex bg-theme-input p-1 rounded-xl border border-theme-border w-full md:w-auto">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${historyFilter === 'all' ? 'bg-theme-card text-white shadow-sm' : 'text-theme-text-muted'}`}
              >
                Todas ({lubricationHistory.length})
              </button>
              <button
                onClick={() => setHistoryFilter('semanal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${historyFilter === 'semanal' ? 'bg-theme-card text-white shadow-sm' : 'text-theme-text-muted'}`}
              >
                Semanais
              </button>
              <button
                onClick={() => setHistoryFilter('semestral')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${historyFilter === 'semestral' ? 'bg-theme-card text-white shadow-sm' : 'text-theme-text-muted'}`}
              >
                Semestrais
              </button>
              <button
                onClick={() => setHistoryFilter('attention')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${historyFilter === 'attention' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-theme-text-muted'}`}
              >
                Com Pendências
              </button>
            </div>
          </div>

          {/* List */}
          {filteredHistory.length === 0 ? (
            <div className="bg-theme-card p-12 rounded-2xl border border-theme-border text-center text-theme-text-muted space-y-2">
              <Droplets size={36} className="mx-auto opacity-30" />
              <h4 className="font-bold text-sm uppercase">Nenhum registro de lubrificação encontrado</h4>
              <p className="text-xs">Inicie uma manutenção semanal ou semestral para gerar o primeiro laudo técnico.</p>
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => setActiveTab('semanal')}
                  className="px-4 py-2 rounded-xl bg-theme-accent-solid text-white text-xs font-bold uppercase shadow-glow"
                >
                  Manutenção Semanal
                </button>
                <button
                  onClick={() => setActiveTab('semestral')}
                  className="px-4 py-2 rounded-xl bg-theme-input hover:bg-theme-card text-white text-xs font-bold uppercase border border-theme-border"
                >
                  Manutenção Semestral
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveReport(item);
                    setActiveTab('report');
                  }}
                  className="bg-theme-card hover:bg-theme-input/50 p-5 rounded-2xl border border-theme-border hover:border-theme-accent-solid/40 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`mt-1 p-2 rounded-xl shrink-0 ${
                      item.requiresAttention 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      <Droplets size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-theme-text-main group-hover:text-theme-accent-solid transition">
                          Lubrificação {item.type} — {item.machineName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                          item.requiresAttention ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {item.requiresAttention ? 'Requer Atenção' : 'Conforme'}
                        </span>
                      </div>
                      <div className="text-xs text-theme-text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span><strong>Técnico:</strong> {item.technicianName}</span>
                        <span>•</span>
                        <span><strong>Curso:</strong> {item.course}</span>
                        <span>•</span>
                        <span><strong>Turma:</strong> {item.studentClass} ({item.shift})</span>
                      </div>
                      {item.attentionItems.length > 0 && (
                        <div className="mt-2 text-[11px] text-amber-400 font-mono">
                          ⚠️ {item.attentionItems.length} ponto(s): {item.attentionItems.join(' | ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-theme-border/50">
                    <div className="text-right text-[11px] text-theme-text-muted font-mono">
                      <div>{new Date(item.submittedAt).toLocaleDateString()}</div>
                      <div>{new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-theme-input group-hover:bg-theme-accent-solid group-hover:text-white text-xs font-bold transition flex items-center gap-1">
                      Visualizar Laudo <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default FresaLubricationModule;
