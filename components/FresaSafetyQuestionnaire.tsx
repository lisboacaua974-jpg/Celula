import React, { useState, useEffect } from 'react';
import { Machine, FresaSafetyInspection, OperationalLog } from '../types';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Printer, RotateCcw, 
  Send, Calendar, Clock, User, Eye, Search, Filter, FileText, Check, 
  AlertCircle, ChevronRight, X, ExternalLink, HardDrive, Info, ShieldAlert
} from 'lucide-react';

interface FresaSafetyQuestionnaireProps {
  machines: Machine[];
  currentUser?: string;
  userRole?: string;
  onInspectionComplete?: (inspection: FresaSafetyInspection) => void;
  onAddOperationalLog?: (log: OperationalLog) => void;
  onUnlockMachine?: (machineId: string) => void;
}

const STORAGE_KEY = 'senai_fresa_inspections';

const FresaSafetyQuestionnaire: React.FC<FresaSafetyQuestionnaireProps> = ({
  machines,
  currentUser = '',
  userRole = '',
  onInspectionComplete,
  onAddOperationalLog,
  onUnlockMachine,
}) => {
  // Filter fresas from machines
  const fresaMachines = machines.filter(m => 
    m.name.toLowerCase().includes('fresa') || m.type.toLowerCase().includes('fresa')
  );

  // Tab: 'form' | 'report' | 'history'
  const [activeTab, setActiveTab] = useState<'form' | 'report' | 'history'>('form');

  // Today formatted as YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Form State
  const [machineId, setMachineId] = useState<string>(fresaMachines[0]?.id || '1085926');
  const [inspectorName, setInspectorName] = useState<string>(currentUser || '');
  const [instructorName, setInstructorName] = useState<string>('Prof. Uanderson Mazzoni');
  const [inspectionDate, setInspectionDate] = useState<string>(todayStr);
  const [shift, setShift] = useState<'Manhã' | 'Tarde' | 'Noite' | 'Integral'>('Manhã');
  const [studentClass, setStudentClass] = useState<string>('Mecânica de Usinagem 1.A');

  // Question 1: EPIs
  const [epis, setEpis] = useState({
    safetyBoots: false,
    safetyGoggles: false,
    apron: false,
    hairnet: false,
  });

  // Question 2: Emergency devices
  const [emergencyButton, setEmergencyButton] = useState<'Sim' | 'Não' | ''>('');
  const [protectiveDoor, setProtectiveDoor] = useState<'Sim' | 'Não' | ''>('');

  // Question 3: Vise firmly clamped
  const [viseFirmlyClamped, setViseFirmlyClamped] = useState<'Sim' | 'Não' | ''>('');

  // Question 4: Clean and organized
  const [cleanAndOrganized, setCleanAndOrganized] = useState<'Sim' | 'Não' | ''>('');

  // Question 5: Hazards or problems
  const [hasHazardsOrProblems, setHasHazardsOrProblems] = useState<'Sim' | 'Não' | ''>('');

  // Question 6: Comments
  const [comments, setComments] = useState<string>('');

  // Modal / Feedback States
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [submittedReport, setSubmittedReport] = useState<FresaSafetyInspection | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  // Inspections History
  const [inspectionsHistory, setInspectionsHistory] = useState<FresaSafetyInspection[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'safe' | 'unsafe'>('all');

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Persist history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inspectionsHistory));
  }, [inspectionsHistory]);

  // Sync inspector with currentUser when authenticated
  useEffect(() => {
    if (currentUser && !inspectorName) {
      setInspectorName(currentUser);
    }
  }, [currentUser]);

  // Toggle all EPIs
  const handleSelectAllEpis = () => {
    const allChecked = epis.safetyBoots && epis.safetyGoggles && epis.apron && epis.hairnet;
    setEpis({
      safetyBoots: !allChecked,
      safetyGoggles: !allChecked,
      apron: !allChecked,
      hairnet: !allChecked,
    });
  };

  // Clear Form
  const handleConfirmClear = () => {
    setInspectorName(currentUser || '');
    setInstructorName('');
    setInspectionDate(todayStr);
    setShift('Manhã');
    setStudentClass('');
    setEpis({
      safetyBoots: false,
      safetyGoggles: false,
      apron: false,
      hairnet: false,
    });
    setEmergencyButton('');
    setProtectiveDoor('');
    setViseFirmlyClamped('');
    setCleanAndOrganized('');
    setHasHazardsOrProblems('');
    setComments('');
    setValidationError('');
    setShowClearConfirm(false);
    setToastMessage({ text: 'Formulário limpo com sucesso.', type: 'warning' });
  };

  // Submit and Validate Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // 1. Identification Validation
    if (!inspectorName.trim()) {
      setValidationError('Por favor, informe o Nome do responsável pela inspeção.');
      return;
    }
    if (!instructorName.trim()) {
      setValidationError('Por favor, informe o Nome do instrutor responsável.');
      return;
    }
    if (!studentClass.trim()) {
      setValidationError('Por favor, informe a Turma.');
      return;
    }
    if (!inspectionDate) {
      setValidationError('Por favor, selecione a Data da inspeção.');
      return;
    }

    // 2. Questions Validation
    if (!emergencyButton) {
      setValidationError('Pergunta 2: Selecione se o Botão de Emergência está funcionando.');
      return;
    }
    if (!protectiveDoor) {
      setValidationError('Pergunta 2: Selecione se a Porta de Proteção está funcionando.');
      return;
    }
    if (!viseFirmlyClamped) {
      setValidationError('Pergunta 3: Selecione se a Morsa está firmemente presa à mesa.');
      return;
    }
    if (!cleanAndOrganized) {
      setValidationError('Pergunta 4: Selecione se o Local está limpo e organizado.');
      return;
    }
    if (!hasHazardsOrProblems) {
      setValidationError('Pergunta 5: Selecione se o local apresenta riscos (vazamentos, ruídos, cheiro).');
      return;
    }

    // 3. Safety Evaluation
    const hazards: string[] = [];
    const missingEpis: string[] = [];

    if (!epis.safetyBoots) missingEpis.push('Bota de segurança');
    if (!epis.safetyGoggles) missingEpis.push('Óculos de segurança');
    if (!epis.apron) missingEpis.push('Avental');
    if (!epis.hairnet) missingEpis.push('Touca para cabelos compridos');

    if (missingEpis.length > 0) {
      hazards.push(`EPIs obrigatórios ausentes: ${missingEpis.join(', ')}`);
    }

    if (emergencyButton === 'Não') {
      hazards.push('Botão de emergência inoperante ou danificado');
    }

    if (protectiveDoor === 'Não') {
      hazards.push('Porta de proteção móvel inoperante ou com sensor violado');
    }

    if (viseFirmlyClamped === 'Não') {
      hazards.push('Morsa não está firmemente presa à mesa de usinagem');
    }

    if (cleanAndOrganized === 'Não') {
      hazards.push('Local de trabalho com desorganização ou acúmulo de cavacos');
    }

    if (hasHazardsOrProblems === 'Sim') {
      hazards.push('Presença de vazamento de óleo, ruído anormal ou cheiro de queimado');
    }

    const isSafe = hazards.length === 0;

    const targetMachine = machines.find(m => m.id === machineId);
    const machineName = targetMachine ? targetMachine.name : 'Fresadora Universal';

    const newInspection: FresaSafetyInspection = {
      id: `INSP-FRESA-${Date.now()}`,
      machineId,
      machineName: `${machineName} (Pat: ${machineId})`,
      inspectorName: inspectorName.trim(),
      instructorName: instructorName.trim(),
      inspectionDate,
      shift,
      studentClass: studentClass.trim(),
      epis: { ...epis },
      emergencyDevices: {
        emergencyButton,
        protectiveDoor,
      },
      viseFirmlyClamped,
      cleanAndOrganized,
      hasHazardsOrProblems,
      comments: comments.trim(),
      isSafe,
      hazardsIdentified: hazards,
      submittedAt: new Date().toISOString(),
    };

    // Save to history state & storage
    setInspectionsHistory(prev => [newInspection, ...prev]);
    setSubmittedReport(newInspection);
    setActiveTab('report');

    // Notify listeners
    if (onInspectionComplete) {
      onInspectionComplete(newInspection);
    }

    // Add to general operational log in App
    if (onAddOperationalLog) {
      onAddOperationalLog({
        id: `OP-${Date.now()}`,
        machineId,
        type: 'Segurança',
        timestamp: new Date().toISOString(),
        user: inspectorName,
        details: isSafe 
          ? `Checklist FRESA Aprovado (NR-12 OK). Instrutor: ${instructorName}.`
          : `Checklist FRESA com Pendências: ${hazards.length} risco(s) apontado(s).`,
        studentClass,
        shift,
        course: 'Mecânica de Usinagem',
      });
    }

    // If safe, automatically unlock machine in Cell
    if (isSafe && onUnlockMachine) {
      onUnlockMachine(machineId);
    }

    setToastMessage({
      text: isSafe 
        ? 'Inspeção finalizada com sucesso! Nenhum risco detectado.'
        : 'Inspeção registrada com apontamento de condições inseguras.',
      type: isSafe ? 'success' : 'warning',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedMachineObj = machines.find(m => m.id === machineId);

  // Filtered History
  const filteredHistory = inspectionsHistory.filter(item => {
    const matchesSearch = 
      item.inspectorName.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.instructorName.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.machineName.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.studentClass.toLowerCase().includes(historySearch.toLowerCase());

    const matchesStatus = 
      historyFilter === 'all' ? true :
      historyFilter === 'safe' ? item.isSafe :
      !item.isSafe;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16 font-sans">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 max-w-md ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' 
            : 'bg-red-950/95 border-red-500/50 text-red-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={20} className="text-red-400 shrink-0" />}
          <span className="text-xs md:text-sm font-medium flex-1">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* HEADER & INDUSTRIAL TITLE */}
      <div className="bg-theme-card p-6 md:p-8 rounded-[28px] border border-theme-border shadow-soft relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-theme-accent-danger rounded-xl flex items-center justify-center text-white shadow-glow-red border border-white/10">
                <ShieldCheck size={26} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-theme-text-muted font-bold">SENAI • CÉLULA 1.A • NR-12</span>
                <h1 className="text-2xl md:text-4xl font-bold font-tech uppercase tracking-tight text-theme-text-main">
                  QUESTIONÁRIO DE SEGURANÇA - <span className="text-theme-accent-solid">FRESA</span>
                </h1>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-theme-input p-1 rounded-xl border border-theme-border">
              <button
                onClick={() => setActiveTab('form')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === 'form' 
                    ? 'bg-theme-accent-solid text-white shadow-glow' 
                    : 'text-theme-text-muted hover:text-white'
                }`}
              >
                Preencher Formulário
              </button>
              {submittedReport && (
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
                Histórico ({inspectionsHistory.length})
              </button>
            </div>
          </div>

          {/* Mandatory Description Text */}
          <div className="bg-theme-input/70 p-4 md:p-5 rounded-2xl border border-theme-border/70 border-l-4 border-l-theme-accent-solid">
            <p className="text-xs md:text-sm text-theme-text-muted leading-relaxed font-sans">
              "Este questionário tem como objetivo verificar as condições de segurança e o correto funcionamento dos equipamentos utilizados no ambiente de trabalho. A inspeção busca identificar riscos, verificar o uso dos Equipamentos de Proteção Individual (EPIs) e contribuir para a prevenção de acidentes, a proteção dos operadores e a conservação dos equipamentos."
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: FORMULÁRIO PREENCHÍVEL                                   */}
      {/* ============================================================== */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto print:hidden">

          {/* Validation Banner if error */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500 text-red-400 text-sm font-bold flex items-center gap-3 animate-shake">
              <AlertCircle size={20} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* SECTION 1: IDENTIFICAÇÃO DO RESPONSÁVEL */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-theme-border">
              <div className="p-2 rounded-lg bg-theme-input border border-theme-border text-theme-accent-solid">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-theme-text-main font-tech uppercase tracking-wide">
                  1. Identificação do Responsável e Ativo
                </h2>
                <p className="text-xs text-theme-text-muted">Preencha todos os campos obrigatórios da inspeção</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Fresadora Ativo */}
              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Fresadora Inspecionada <span className="text-theme-accent-danger">*</span>
                </label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                >
                  {fresaMachines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} — PAT {m.id} ({m.model})
                    </option>
                  ))}
                  {fresaMachines.length === 0 && (
                    <option value="1085926">Fresadora KonE Standard (PAT: 1085926)</option>
                  )}
                </select>
              </div>

              {/* Nome do responsável */}
              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Nome do Responsável pela Inspeção <span className="text-theme-accent-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main placeholder-theme-text-muted/40 outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                />
              </div>

              {/* Instrutor responsável */}
              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Instrutor Responsável <span className="text-theme-accent-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prof. Uanderson Mazzoni"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main placeholder-theme-text-muted/40 outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                />
              </div>

              {/* Data da inspeção */}
              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Data da Inspeção <span className="text-theme-accent-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                  />
                </div>
              </div>

              {/* Turno */}
              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Turno <span className="text-theme-accent-danger">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1 bg-theme-input p-1 rounded-xl border border-theme-border">
                  {(['Manhã', 'Tarde', 'Noite', 'Integral'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setShift(t)}
                      className={`py-2 rounded-lg text-xs font-bold transition ${
                        shift === t 
                          ? 'bg-theme-accent-solid text-white shadow-sm' 
                          : 'text-theme-text-muted hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turma */}
              <div>
                <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">
                  Turma <span className="text-theme-accent-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mecânica de Usinagem 1.A"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text-main placeholder-theme-text-muted/40 outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition"
                />
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* PERGUNTA 1: EPIs OBRIGATÓRIOS                                   */}
          {/* ============================================================== */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-theme-border">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">PERGUNTA 1</span>
                <h3 className="text-base md:text-lg font-bold text-theme-text-main">
                  O operador está utilizando todos os EPIs obrigatórios?
                </h3>
                <p className="text-xs text-theme-text-muted mt-0.5">
                  Marque cada Equipamento de Proteção Individual verificado em uso.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectAllEpis}
                className="px-3.5 py-1.5 rounded-lg bg-theme-input hover:bg-theme-input/80 border border-theme-border text-xs font-bold text-theme-text-muted hover:text-white transition"
              >
                {epis.safetyBoots && epis.safetyGoggles && epis.apron && epis.hairnet ? 'Desmarcar Todos' : 'Marcar Todos'}
              </button>
            </div>

            {/* EPIs Grid with provided visual icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {/* Bota */}
              <div 
                onClick={() => setEpis(prev => ({ ...prev, safetyBoots: !prev.safetyBoots }))}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center group select-none ${
                  epis.safetyBoots 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-glow' 
                    : 'bg-theme-input/60 border-theme-border hover:border-theme-border/80 text-theme-text-muted hover:text-white'
                }`}
              >
                <div className="w-20 h-20 rounded-full bg-black/40 p-2 mb-3 border border-white/10 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/assets/aistudio/image_9290182f.png" 
                    alt="Bota de segurança" 
                    className="w-full h-full object-contain filter invert contrast-150"
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Bota de Segurança</span>
                <div className={`mt-3 w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                  epis.safetyBoots ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-theme-border bg-theme-input'
                }`}>
                  {epis.safetyBoots && <Check size={14} />}
                </div>
              </div>

              {/* Óculos */}
              <div 
                onClick={() => setEpis(prev => ({ ...prev, safetyGoggles: !prev.safetyGoggles }))}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center group select-none ${
                  epis.safetyGoggles 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-glow' 
                    : 'bg-theme-input/60 border-theme-border hover:border-theme-border/80 text-theme-text-muted hover:text-white'
                }`}
              >
                <div className="w-20 h-20 rounded-full bg-black/40 p-2 mb-3 border border-white/10 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/assets/aistudio/image_9b7122e3.png" 
                    alt="Óculos de segurança" 
                    className="w-full h-full object-contain filter invert contrast-150"
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Óculos de Segurança</span>
                <div className={`mt-3 w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                  epis.safetyGoggles ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-theme-border bg-theme-input'
                }`}>
                  {epis.safetyGoggles && <Check size={14} />}
                </div>
              </div>

              {/* Avental */}
              <div 
                onClick={() => setEpis(prev => ({ ...prev, apron: !prev.apron }))}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center group select-none ${
                  epis.apron 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-glow' 
                    : 'bg-theme-input/60 border-theme-border hover:border-theme-border/80 text-theme-text-muted hover:text-white'
                }`}
              >
                <div className="w-20 h-20 rounded-full bg-black/40 p-2 mb-3 border border-white/10 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/assets/aistudio/image_d8efb1bc.png" 
                    alt="Avental" 
                    className="w-full h-full object-contain filter invert contrast-150"
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Avental</span>
                <div className={`mt-3 w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                  epis.apron ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-theme-border bg-theme-input'
                }`}>
                  {epis.apron && <Check size={14} />}
                </div>
              </div>

              {/* Touca */}
              <div 
                onClick={() => setEpis(prev => ({ ...prev, hairnet: !prev.hairnet }))}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center group select-none ${
                  epis.hairnet 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-glow' 
                    : 'bg-theme-input/60 border-theme-border hover:border-theme-border/80 text-theme-text-muted hover:text-white'
                }`}
              >
                <div className="w-20 h-20 rounded-full bg-black/40 p-2 mb-3 border border-white/10 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/assets/aistudio/image_7a3debbe.png" 
                    alt="Touca para cabelos compridos" 
                    className="w-full h-full object-contain filter invert contrast-150"
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Touca (Cabelo Longo)</span>
                <div className={`mt-3 w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                  epis.hairnet ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-theme-border bg-theme-input'
                }`}>
                  {epis.hairnet && <Check size={14} />}
                </div>
              </div>
            </div>

            {/* Warning if any unchecked */}
            {(!epis.safetyBoots || !epis.safetyGoggles || !epis.apron || !epis.hairnet) && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0 text-amber-400" />
                <span>Atenção: A falta de qualquer EPI obrigatório impede a operação segura da fresadora segundo a NR-12.</span>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* PERGUNTA 2: DISPOSITIVOS DE EMERGÊNCIA                          */}
          {/* ============================================================== */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <div className="mb-4 pb-4 border-b border-theme-border">
              <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">PERGUNTA 2</span>
              <h3 className="text-base md:text-lg font-bold text-theme-text-main">
                Os dispositivos de emergência estão funcionando corretamente?
              </h3>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Verifique o Botão de Parada de Emergência e o intertravamento da Porta de Proteção.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Photo Reference */}
              <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-theme-border bg-black/40 relative shadow-inner">
                <img 
                  src="/assets/aistudio/image_35d99463.png" 
                  alt="Dispositivos de Emergência Fresa" 
                  className="w-full h-56 object-cover object-center"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm p-2 rounded-xl text-[11px] text-white flex items-center gap-2 border border-white/10">
                  <Info size={14} className="text-red-400 shrink-0" />
                  <span>Referência: Porta de proteção acrílica e botão cogumelo de emergência.</span>
                </div>
              </div>

              {/* Two Independent Fields */}
              <div className="lg:col-span-7 space-y-4">
                {/* Field 1: Botão de emergência */}
                <div className="p-4 rounded-xl bg-theme-input/60 border border-theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-theme-text-main uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      Botão de emergência
                    </span>
                    <p className="text-[11px] text-theme-text-muted mt-0.5">Testar travamento mecânico e corte imediato</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEmergencyButton('Sim')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 ${
                        emergencyButton === 'Sim' 
                          ? 'bg-emerald-500 text-white shadow-glow' 
                          : 'bg-theme-input text-theme-text-muted border border-theme-border hover:text-white'
                      }`}
                    >
                      <Check size={14} /> Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmergencyButton('Não')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 ${
                        emergencyButton === 'Não' 
                          ? 'bg-red-600 text-white shadow-glow-red' 
                          : 'bg-theme-input text-theme-text-muted border border-theme-border hover:text-white'
                      }`}
                    >
                      <X size={14} /> Não
                    </button>
                  </div>
                </div>

                {/* Field 2: Porta de proteção */}
                <div className="p-4 rounded-xl bg-theme-input/60 border border-theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-theme-text-main uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Porta de proteção
                    </span>
                    <p className="text-[11px] text-theme-text-muted mt-0.5">Micro-chave de segurança e anteparo acrílico íntegro</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProtectiveDoor('Sim')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 ${
                        protectiveDoor === 'Sim' 
                          ? 'bg-emerald-500 text-white shadow-glow' 
                          : 'bg-theme-input text-theme-text-muted border border-theme-border hover:text-white'
                      }`}
                    >
                      <Check size={14} /> Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setProtectiveDoor('Não')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 ${
                        protectiveDoor === 'Não' 
                          ? 'bg-red-600 text-white shadow-glow-red' 
                          : 'bg-theme-input text-theme-text-muted border border-theme-border hover:text-white'
                      }`}
                    >
                      <X size={14} /> Não
                    </button>
                  </div>
                </div>

                {/* Warning if any 'Não' */}
                {(emergencyButton === 'Não' || protectiveDoor === 'Não') && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-2">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>CONDIÇÃO INSEGURA: Dispositivos de emergência inoperantes exigem paralisação imediata da máquina.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* PERGUNTA 3: MORSA PRESA À MESA                                  */}
          {/* ============================================================== */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <div className="mb-4 pb-4 border-b border-theme-border">
              <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">PERGUNTA 3</span>
              <h3 className="text-base md:text-lg font-bold text-theme-text-main">
                A morsa está firmemente presa à mesa?
              </h3>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Verifique os parafusos de fixação T, porcas e rigidez da morsa na mesa de usinagem.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-theme-border bg-black/40 relative shadow-inner">
                <img 
                  src="/assets/aistudio/image_3a229d09.png" 
                  alt="Fixação da Morsa na Mesa" 
                  className="w-full h-52 object-cover object-center"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm p-2 rounded-xl text-[11px] text-white flex items-center gap-2 border border-white/10">
                  <Info size={14} className="text-amber-400 shrink-0" />
                  <span>Referência: Grampos e parafusos de fixação nos canais T da mesa.</span>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col justify-center gap-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setViseFirmlyClamped('Sim')}
                    className={`flex-1 py-4 rounded-2xl text-sm font-bold uppercase transition flex items-center justify-center gap-2 border ${
                      viseFirmlyClamped === 'Sim'
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow'
                        : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                    }`}
                  >
                    <Check size={18} /> Sim (Fixada e Rígida)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViseFirmlyClamped('Não')}
                    className={`flex-1 py-4 rounded-2xl text-sm font-bold uppercase transition flex items-center justify-center gap-2 border ${
                      viseFirmlyClamped === 'Não'
                        ? 'bg-red-600 border-red-500 text-white shadow-glow-red'
                        : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                    }`}
                  >
                    <X size={18} /> Não (Solta ou Folgada)
                  </button>
                </div>

                {viseFirmlyClamped === 'Não' && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>Risco de colisão e projeção da ferramenta: Reaperte os parafusos T antes de prosseguir.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* PERGUNTA 4: LOCAL LIMPO E ORGANIZADO                            */}
          {/* ============================================================== */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <div className="mb-4 pb-4 border-b border-theme-border">
              <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">PERGUNTA 4</span>
              <h3 className="text-base md:text-lg font-bold text-theme-text-main">
                O local está limpo e organizado?
              </h3>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Canais T livres de acúmulo de cavacos, piso desobstruído e chaves fora da área de rotação.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-theme-border bg-black/40 relative shadow-inner">
                <img 
                  src="/assets/aistudio/image_ff6af4dd.png" 
                  alt="Limpeza e Organização da Mesa" 
                  className="w-full h-52 object-cover object-center"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm p-2 rounded-xl text-[11px] text-white flex items-center gap-2 border border-white/10">
                  <Info size={14} className="text-blue-400 shrink-0" />
                  <span>Referência: Superfície da mesa limpa, sem rebarbas ou óleo excessivo.</span>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col justify-center gap-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCleanAndOrganized('Sim')}
                    className={`flex-1 py-4 rounded-2xl text-sm font-bold uppercase transition flex items-center justify-center gap-2 border ${
                      cleanAndOrganized === 'Sim'
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow'
                        : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                    }`}
                  >
                    <Check size={18} /> Sim (Organizado / 5S)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCleanAndOrganized('Não')}
                    className={`flex-1 py-4 rounded-2xl text-sm font-bold uppercase transition flex items-center justify-center gap-2 border ${
                      cleanAndOrganized === 'Não'
                        ? 'bg-amber-600 border-amber-500 text-white shadow-glow'
                        : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                    }`}
                  >
                    <X size={18} /> Não (Sujo / Desorganizado)
                  </button>
                </div>

                {cleanAndOrganized === 'Não' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>Realize a limpeza com pincel/gancho apropriado antes de dar partida. Nunca use ar comprimido diretamente no corpo ou cavacos.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* PERGUNTA 5: RISCOS OU PROBLEMAS                                 */}
          {/* ============================================================== */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <div className="mb-4 pb-4 border-b border-theme-border">
              <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">PERGUNTA 5</span>
              <h3 className="text-base md:text-lg font-bold text-theme-text-main">
                O local apresenta algum risco ou problema, como vazamento de óleo, ruído anormal ou cheiro de queimado?
              </h3>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Avalie visualmente o barramento, motor, caixa de engrenagens e mangueiras de refrigeração.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setHasHazardsOrProblems('Não')}
                className={`flex-1 py-4 rounded-2xl text-sm font-bold uppercase transition flex items-center justify-center gap-2 border ${
                  hasHazardsOrProblems === 'Não'
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow'
                    : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                }`}
              >
                <Check size={18} /> Não (Nenhum Risco / Operação Normal)
              </button>
              <button
                type="button"
                onClick={() => setHasHazardsOrProblems('Sim')}
                className={`flex-1 py-4 rounded-2xl text-sm font-bold uppercase transition flex items-center justify-center gap-2 border ${
                  hasHazardsOrProblems === 'Sim'
                    ? 'bg-red-600 border-red-500 text-white shadow-glow-red'
                    : 'bg-theme-input border-theme-border text-theme-text-muted hover:text-white'
                }`}
              >
                <AlertTriangle size={18} /> Sim (Há Vazamento, Ruído ou Cheiro)
              </button>
            </div>

            {hasHazardsOrProblems === 'Sim' && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300 text-xs font-bold space-y-1">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <ShieldAlert size={18} />
                  <span>ALERTA DE ANOMALIA OPERACIONAL</span>
                </div>
                <p className="font-normal text-theme-text-muted">
                  Descreva detalhadamente a falha no campo de comentários abaixo e notifique imediatamente o docente responsável ou a equipe de manutenção.
                </p>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* PERGUNTA 6: COMENTÁRIOS ADICIONAIS                              */}
          {/* ============================================================== */}
          <div className="bg-theme-card p-6 md:p-8 rounded-[24px] border border-theme-border shadow-soft">
            <div className="mb-4 pb-4 border-b border-theme-border">
              <span className="text-[10px] font-mono uppercase tracking-wider text-theme-accent-solid font-bold">PERGUNTA 6</span>
              <h3 className="text-base md:text-lg font-bold text-theme-text-main">
                Comentários adicionais ou pontos de atenção
              </h3>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Registre problemas encontrados, observações técnicas e medidas corretivas necessárias.
              </p>
            </div>

            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ex: Folga identificada no fuso do eixo Y; necessidade de reabastecimento de óleo lubrificante de barramento ISO VG 68; anteparo acrílico necessitando de polimento..."
              className="w-full bg-theme-input border border-theme-border rounded-2xl p-4 text-sm font-medium text-theme-text-main placeholder-theme-text-muted/40 outline-none focus:border-theme-accent-solid focus:ring-1 focus:ring-theme-accent-solid transition resize-y"
            />
          </div>

          {/* ACTION BUTTONS (SUBMIT & CLEAR) */}
          <div className="bg-theme-card p-6 rounded-[24px] border border-theme-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Limpar Formulário
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-accent hover:brightness-110 text-white text-sm font-bold uppercase tracking-wider shadow-glow hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <Send size={18} /> Finalizar Inspeção
            </button>
          </div>

        </form>
      )}

      {/* ============================================================== */}
      {/* CLEAR CONFIRMATION MODAL                                        */}
      {/* ============================================================== */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card max-w-md w-full rounded-2xl p-6 border border-theme-border shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-theme-text-main font-tech uppercase">Confirmar Limpeza</h3>
            <p className="text-xs text-theme-text-muted leading-relaxed">
              Tem certeza de que deseja apagar todos os dados já preenchidos neste questionário? Esta ação não pode ser desfeita.
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
                onClick={handleConfirmClear}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase shadow-glow-red"
              >
                Sim, Limpar Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: RESUMO ORGANIZADO & LAUDO TÉCNICO                        */}
      {/* ============================================================== */}
      {activeTab === 'report' && submittedReport && (
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-theme-card p-4 rounded-2xl border border-theme-border print:hidden">
            <button
              onClick={() => setActiveTab('form')}
              className="px-4 py-2 rounded-xl bg-theme-input hover:bg-theme-card text-xs font-bold text-theme-text-muted hover:text-white border border-theme-border transition"
            >
              ← Voltar ao Formulário
            </button>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider shadow-glow flex items-center gap-2 hover:scale-105 transition"
              >
                <Printer size={16} /> Imprimir / Salvar em PDF
              </button>
            </div>
          </div>

          {/* PRINTABLE LAUDO CONTAINER */}
          <div className="bg-theme-card p-8 md:p-12 rounded-[28px] border border-theme-border shadow-2xl text-theme-text-main print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
            
            {/* Header Document */}
            <div className="border-b-2 border-theme-border print:border-black pb-6 mb-6 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-600 flex items-center justify-center text-white font-bold text-xs rounded-xl shadow-glow-red print:shadow-none">
                  SENAI
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold font-tech uppercase tracking-wide print:text-black">
                    LAUDO DE INSPEÇÃO DE SEGURANÇA
                  </h2>
                  <p className="text-xs text-theme-text-muted font-mono print:text-gray-600">
                    Fresadora Industrial • Célula 1.A • NR-12
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-theme-text-muted print:text-gray-500">Nº DO PROTOCOLO</div>
                <div className="text-sm font-mono font-bold text-theme-accent-solid print:text-red-700">
                  {submittedReport.id}
                </div>
                <div className="text-[10px] text-theme-text-muted font-mono mt-0.5 print:text-gray-500">
                  Emitido em: {new Date(submittedReport.submittedAt).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            {/* SAFETY STATUS BANNER (CRITICAL HIGHLIGHT) */}
            {submittedReport.isSafe ? (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 text-emerald-300 print:bg-green-100 print:text-green-900 print:border-green-600 flex items-center gap-3">
                <CheckCircle2 size={28} className="shrink-0 text-emerald-400 print:text-green-700" />
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wide">
                    INSPEÇÃO CONFORME — NENHUMA NÃO CONFORMIDADE DETECTADA
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    Todos os EPIs, travas de emergência, morsa e limpeza encontram-se em condições adequadas de operação.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-5 rounded-2xl bg-red-600/15 border-2 border-red-500 text-red-200 print:bg-red-100 print:text-red-900 print:border-red-600 space-y-2">
                <div className="flex items-center gap-3">
                  <ShieldAlert size={28} className="shrink-0 text-red-500 print:text-red-700" />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-red-400 print:text-red-800">
                      ⚠️ CONDIÇÃO INSEGURA DETECTADA — MÁQUINA NÃO LIBERADA
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">
                      Foram identificadas não conformidades obrigatórias de segurança. O equipamento deve permanecer desativado até correção.
                    </p>
                  </div>
                </div>

                <div className="pl-10 text-xs space-y-1">
                  <div className="font-bold uppercase tracking-wider text-red-300 print:text-red-800">Pendências encontradas:</div>
                  <ul className="list-disc list-inside space-y-0.5 font-mono">
                    {submittedReport.hazardsIdentified.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* General Identification Table */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-theme-input/50 print:bg-gray-100 p-4 rounded-xl border border-theme-border print:border-gray-300 text-xs mb-6">
              <div>
                <span className="block text-[10px] font-bold text-theme-text-muted uppercase print:text-gray-500">Equipamento</span>
                <span className="font-bold print:text-black">{submittedReport.machineName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-theme-text-muted uppercase print:text-gray-500">Inspetor / Operador</span>
                <span className="font-bold print:text-black">{submittedReport.inspectorName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-theme-text-muted uppercase print:text-gray-500">Instrutor Responsável</span>
                <span className="font-bold print:text-black">{submittedReport.instructorName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-theme-text-muted uppercase print:text-gray-500">Turma / Turno</span>
                <span className="font-bold print:text-black">{submittedReport.studentClass} ({submittedReport.shift})</span>
              </div>
            </div>

            {/* Checklist Answers Detailed Table */}
            <h3 className="font-bold text-sm uppercase tracking-wider mb-3 text-theme-text-main print:text-black">
              Conferência dos Itens de Segurança
            </h3>
            
            <div className="border border-theme-border print:border-gray-300 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-theme-sidebar print:bg-gray-200 uppercase font-bold text-[10px] text-theme-text-muted print:text-gray-700 border-b border-theme-border print:border-gray-300">
                  <tr>
                    <th className="p-3">Item / Pergunta</th>
                    <th className="p-3">Critério Verificado</th>
                    <th className="p-3 text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border print:divide-gray-300 font-sans">
                  {/* EPIs */}
                  <tr>
                    <td className="p-3 font-bold">1. Uso de EPIs Obrigatórios</td>
                    <td className="p-3 text-theme-text-muted print:text-gray-600">
                      Bota: {submittedReport.epis.safetyBoots ? '✓' : '✗'} | 
                      Óculos: {submittedReport.epis.safetyGoggles ? '✓' : '✗'} | 
                      Avental: {submittedReport.epis.apron ? '✓' : '✗'} | 
                      Touca: {submittedReport.epis.hairnet ? '✓' : '✗'}
                    </td>
                    <td className="p-3 text-right font-bold">
                      {submittedReport.epis.safetyBoots && submittedReport.epis.safetyGoggles && submittedReport.epis.apron && submittedReport.epis.hairnet ? (
                        <span className="text-emerald-400 print:text-green-700">CONFORME (100%)</span>
                      ) : (
                        <span className="text-red-400 print:text-red-700">INCOMPLETO</span>
                      )}
                    </td>
                  </tr>

                  {/* Dispositivos de Emergência */}
                  <tr>
                    <td className="p-3 font-bold">2. Dispositivos de Emergência</td>
                    <td className="p-3 text-theme-text-muted print:text-gray-600">
                      Botão Emergência: {submittedReport.emergencyDevices.emergencyButton} | Porta Proteção: {submittedReport.emergencyDevices.protectiveDoor}
                    </td>
                    <td className="p-3 text-right font-bold">
                      {submittedReport.emergencyDevices.emergencyButton === 'Sim' && submittedReport.emergencyDevices.protectiveDoor === 'Sim' ? (
                        <span className="text-emerald-400 print:text-green-700">FUNCIONAIS</span>
                      ) : (
                        <span className="text-red-400 print:text-red-700">COM FALHA</span>
                      )}
                    </td>
                  </tr>

                  {/* Morsa */}
                  <tr>
                    <td className="p-3 font-bold">3. Fixação da Morsa</td>
                    <td className="p-3 text-theme-text-muted print:text-gray-600">
                      Rigidez e torque nos parafusos da mesa T
                    </td>
                    <td className="p-3 text-right font-bold">
                      {submittedReport.viseFirmlyClamped === 'Sim' ? (
                        <span className="text-emerald-400 print:text-green-700">PRESA FIRMEMENTE</span>
                      ) : (
                        <span className="text-red-400 print:text-red-700">FOLGADA</span>
                      )}
                    </td>
                  </tr>

                  {/* Limpeza */}
                  <tr>
                    <td className="p-3 font-bold">4. Limpeza e Organização</td>
                    <td className="p-3 text-theme-text-muted print:text-gray-600">
                      Mesa limpa, sem acúmulo de cavacos ou desordem
                    </td>
                    <td className="p-3 text-right font-bold">
                      {submittedReport.cleanAndOrganized === 'Sim' ? (
                        <span className="text-emerald-400 print:text-green-700">ORGANIZADO</span>
                      ) : (
                        <span className="text-amber-400 print:text-amber-700">IRREGULAR</span>
                      )}
                    </td>
                  </tr>

                  {/* Riscos / Anomalias */}
                  <tr>
                    <td className="p-3 font-bold">5. Riscos e Anomalias</td>
                    <td className="p-3 text-theme-text-muted print:text-gray-600">
                      Vazamento de óleo, ruído anormal ou cheiro de queimado
                    </td>
                    <td className="p-3 text-right font-bold">
                      {submittedReport.hasHazardsOrProblems === 'Não' ? (
                        <span className="text-emerald-400 print:text-green-700">SEM RISCOS</span>
                      ) : (
                        <span className="text-red-400 print:text-red-700">RISCO DETECTADO</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Comments Box */}
            <div className="bg-theme-input/40 print:bg-gray-50 p-4 rounded-xl border border-theme-border print:border-gray-300 text-xs mb-8">
              <span className="block text-[10px] font-bold text-theme-text-muted print:text-gray-600 uppercase mb-1">
                6. Comentários Adicionais e Medidas Corretivas
              </span>
              <p className="font-mono leading-relaxed print:text-black">
                {submittedReport.comments || 'Nenhum comentário adicional registrado.'}
              </p>
            </div>

            {/* Signatures for Technical Certification */}
            <div className="pt-8 border-t border-theme-border print:border-black grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-b border-theme-border print:border-black w-48 mx-auto mb-2"></div>
                <div className="font-bold print:text-black">{submittedReport.inspectorName}</div>
                <div className="text-[10px] text-theme-text-muted print:text-gray-500 uppercase">Responsável pela Inspeção</div>
              </div>
              <div>
                <div className="border-b border-theme-border print:border-black w-48 mx-auto mb-2"></div>
                <div className="font-bold print:text-black">{submittedReport.instructorName}</div>
                <div className="text-[10px] text-theme-text-muted print:text-gray-500 uppercase">Docente / Visto de Segurança</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: HISTÓRICO DE INSPEÇÕES ANTERIORES                        */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6 max-w-5xl mx-auto print:hidden">
          
          {/* Storage & Architecture Notice */}
          <div className="p-4 rounded-2xl bg-theme-card border border-theme-border shadow-soft flex items-start gap-3">
            <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-theme-text-muted space-y-1">
              <p className="font-bold text-theme-text-main">
                Armazenamento de Dados das Inspeções
              </p>
              <p>
                Todas as inspeções realizadas estão armazenadas localmente no seu navegador via <code className="text-theme-accent-solid font-mono">localStorage (senai_fresa_inspections)</code> e integradas ao histórico operacional da máquina.
              </p>
              <p className="text-[11px] text-theme-text-muted/80">
                💡 <strong>Recomendação de Banco de Dados:</strong> Para persistência multiusuário em nuvem na oficina do SENAI, recomendamos a integração com <strong>Firebase Firestore</strong>, permitindo que docentes e técnicos consultem laudos sincronizados em qualquer dispositivo.
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-theme-card p-4 rounded-2xl border border-theme-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
              <input
                type="text"
                placeholder="Buscar por operador, instrutor ou turma..."
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
                Todas ({inspectionsHistory.length})
              </button>
              <button
                onClick={() => setHistoryFilter('safe')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${historyFilter === 'safe' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-theme-text-muted'}`}
              >
                Conformes
              </button>
              <button
                onClick={() => setHistoryFilter('unsafe')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${historyFilter === 'unsafe' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-theme-text-muted'}`}
              >
                Com Não Conformidade
              </button>
            </div>
          </div>

          {/* History List */}
          {filteredHistory.length === 0 ? (
            <div className="bg-theme-card p-12 rounded-2xl border border-theme-border text-center text-theme-text-muted space-y-2">
              <ShieldCheck size={36} className="mx-auto opacity-30" />
              <h4 className="font-bold text-sm uppercase">Nenhuma inspeção encontrada</h4>
              <p className="text-xs">Preencha um novo formulário para registrar a primeira inspeção de segurança da fresa.</p>
              <button
                onClick={() => setActiveTab('form')}
                className="mt-3 px-5 py-2.5 rounded-xl bg-theme-accent-solid text-white text-xs font-bold uppercase shadow-glow"
              >
                Preencher Questionário
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSubmittedReport(item);
                    setActiveTab('report');
                  }}
                  className="bg-theme-card hover:bg-theme-input/50 p-5 rounded-2xl border border-theme-border hover:border-theme-accent-solid/40 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`mt-1 p-2 rounded-xl shrink-0 ${
                      item.isSafe 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {item.isSafe ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-theme-text-main group-hover:text-theme-accent-solid transition">
                          {item.machineName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                          item.isSafe ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {item.isSafe ? 'Aprovado' : 'Com Não Conformidade'}
                        </span>
                      </div>
                      <div className="text-xs text-theme-text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span><strong>Inspetor:</strong> {item.inspectorName}</span>
                        <span>•</span>
                        <span><strong>Instrutor:</strong> {item.instructorName}</span>
                        <span>•</span>
                        <span><strong>Turma:</strong> {item.studentClass} ({item.shift})</span>
                      </div>
                      {item.hazardsIdentified.length > 0 && (
                        <div className="mt-2 text-[11px] text-red-400 font-mono">
                          ⚠️ {item.hazardsIdentified.length} risco(s): {item.hazardsIdentified.join(' | ')}
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

export default FresaSafetyQuestionnaire;
