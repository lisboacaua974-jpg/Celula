
import React, { useState, useRef, useEffect } from 'react';
import { Machine, MachineStatus, ChatMessage, OperationalLog } from '../types';
import { askTechnicalAssistant } from '../services/geminiService';
import { 
  Folder, AlertCircle, CheckCircle2, Power, ArrowLeft, Tag, FileText, 
  Plus, X, BookOpen, Zap, Droplet, Droplets, Send, Bot, Loader2, Info, ArrowRight, ClipboardList, Lock, AlertTriangle, Save, ChevronDown, ChevronUp,
  ZoomIn, ZoomOut, RotateCcw, Clock, Timer, History, HardDrive, Cpu, Calendar, Settings, CheckSquare, Printer, ExternalLink, ShieldCheck
} from 'lucide-react';
import FresaLubricationModule from './FresaLubricationModule';
import FresaSafetyQuestionnaire from './FresaSafetyQuestionnaire';

interface MachineListProps {
  machines: Machine[];
  setMachines: React.Dispatch<React.SetStateAction<Machine[]>>;
  selectedMachineId: string | null;
  setSelectedMachineId: (id: string | null) => void;
  onAddOperationalLog: (log: OperationalLog) => void;
  operationalLogs: OperationalLog[];
  currentUser: string;
  userRole: string;
  onNavigate?: (view: string) => void;
  onOpenLubrication?: (mode: 'semanal' | 'semestral' | 'hub') => void;
  initialLubricationMode?: 'semanal' | 'semestral' | 'history' | null;
  onClearInitialLubricationMode?: () => void;
}

const MachineList: React.FC<MachineListProps> = ({ 
  machines, 
  setMachines, 
  selectedMachineId, 
  setSelectedMachineId, 
  onAddOperationalLog, 
  operationalLogs, 
  currentUser, 
  userRole, 
  onNavigate,
  onOpenLubrication,
  initialLubricationMode,
  onClearInitialLubricationMode
}) => {
  // Navigation States
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  // Modal States
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Inline Manual State
  const [showInlineManual, setShowInlineManual] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualScale, setManualScale] = useState(1);

  // Inline Safety State
  const [showInlineSafety, setShowInlineSafety] = useState(false);
  const [safetyUrl, setSafetyUrl] = useState('');
  // const [safetyScale, setSafetyScale] = useState(1); // Removed as we are opening in new tab

  // Inline Lubrication State
  const [showInlineLubrication, setShowInlineLubrication] = useState(false);
  const [lubricationType, setLubricationType] = useState<'diario' | 'semanal' | 'mensal' | 'semestral' | 'anual' | null>(null);
  const [showLubricationReportModal, setShowLubricationReportModal] = useState(false);
  
  // In-Machine Full Lubrication Module State (Semanal, Semestral, Histórico sem sair da máquina)
  const [inMachineLubricationView, setInMachineLubricationView] = useState<'none' | 'semanal' | 'semestral' | 'history'>('none');
  
  // In-Machine Full Safety Module State (Questionário NR-12 sem sair da máquina)
  const [inMachineSafetyView, setInMachineSafetyView] = useState(false);

  useEffect(() => {
    if (initialLubricationMode) {
      setInMachineLubricationView(initialLubricationMode);
      if (onClearInitialLubricationMode) {
        onClearInitialLubricationMode();
      }
    }
  }, [initialLubricationMode]);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Romi Monthly Checklist State
  const [romiMonthlyChecks, setRomiMonthlyChecks] = useState({
      oilLevel: false,
      cleanFilters: false,
      lubeChuck: false,
      checkLeaks: false,
      cleanConveyor: false
  });
  
  // Lubrication Form Data
  const [lubricationForm, setLubricationForm] = useState({
      course: '',
      studentClass: '',
      shift: 'Manhã'
  });

  // Safety Form Data
  const [safetyForm, setSafetyForm] = useState({
      course: '',
      studentClass: '',
      shift: 'Manhã'
  });

  // Hours Control State
  const [hourControl, setHourControl] = useState({
      student: '',
      shift: 'Manhã',
      startTime: '',
      endTime: ''
  });

  // Form States
  const [newFolderName, setNewFolderName] = useState('');
  const [newMachineData, setNewMachineData] = useState({
    id: '',
    type: '',
    model: '',
    serial: ''
  });

  // Mini AI Chat States
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  // Derived State
  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const isBancada = selectedMachine?.name === 'Bancadas Didáticas';
  
  // Date check
  const todayStr = new Date().toISOString().split('T')[0];

  // Lock logic:
  // Safety checklist is mandatory EVERY DAY and FOR EVERY LOGGED-IN OPERATOR.
  // Must match both today's date (YYYY-MM-DD) and current logged-in user name.
  // Bancadas are exempt.
  const isSafetyValidForCurrentSession = Boolean(
    selectedMachine &&
    selectedMachine.safetyCheckCompleted &&
    selectedMachine.lastSafetyCheckDate === todayStr &&
    selectedMachine.lastSafetyCheckUser &&
    currentUser &&
    selectedMachine.lastSafetyCheckUser.trim().toLowerCase() === currentUser.trim().toLowerCase()
  );

  const isLocked = Boolean(
    selectedMachine && 
    !isBancada && 
    !isSafetyValidForCurrentSession
  );

  // Check if machine is a Fresa or Retifica for specific lubrication forms
  const isFresa = selectedMachine ? (selectedMachine.name.toLowerCase().includes('fresa') || selectedMachine.type.toLowerCase().includes('fresa')) : false;
  const isRetifica = selectedMachine ? (selectedMachine.name.toLowerCase().includes('retífica') || selectedMachine.name.toLowerCase().includes('retifica') || selectedMachine.type.toLowerCase().includes('retífica')) : false;
  const isNardini = selectedMachine ? (selectedMachine.name.toLowerCase().includes('nardini') || selectedMachine.model.toLowerCase().includes('nardini')) : false;
  const isRomi = selectedMachine ? (selectedMachine.name.toLowerCase().includes('romi') || selectedMachine.model.toLowerCase().includes('romi') || selectedMachine.type.toLowerCase().includes('cnc')) : false;
  const isSerra = selectedMachine ? (selectedMachine.name.toLowerCase().includes('serra') || selectedMachine.type.toLowerCase().includes('serra')) : false;
  const isFuradeira = selectedMachine ? (selectedMachine.name.toLowerCase().includes('furadeira') || selectedMachine.type.toLowerCase().includes('furadeira')) : false;

  // Filter Lubrication History for current machine
  const machineLubricationHistory = operationalLogs.filter(
      log => log.machineId === selectedMachineId && log.type === 'Lubrificação'
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter Safety History for current machine
  const machineSafetyHistory = operationalLogs.filter(
      log => log.machineId === selectedMachineId && log.type === 'Segurança'
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Scroll to bottom of AI chat
  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages, selectedMachineId]);

  // Reset AI chat, Manual, Safety view, and In-Machine Views when opening a new machine
  useEffect(() => {
    if (selectedMachineId && selectedMachine) {
        setAiMessages([{
            id: 'init',
            role: 'model',
            text: `Olá! Estou pronto para ajudar com o equipamento: ${selectedMachine.name} (${selectedMachine.model}).`,
            timestamp: new Date()
        }]);
        setShowInlineManual(false); 
        setManualScale(1);
        setShowInlineSafety(false);
        setInMachineSafetyView(false);
        setInMachineLubricationView('none');
        // setSafetyScale(1);
        setShowInlineLubrication(false);
        setLubricationType(null);
        setHourControl({ student: '', shift: 'Manhã', startTime: '', endTime: '' });
        setLubricationForm({ course: '', studentClass: '', shift: 'Manhã' });
        setSafetyForm({ course: '', studentClass: '', shift: 'Manhã' });
        setRomiMonthlyChecks({ oilLevel: false, cleanFilters: false, lubeChuck: false, checkLeaks: false, cleanConveyor: false });
    }
  }, [selectedMachineId]);

  // Group machines
  const machineGroups = machines.reduce((acc, machine) => {
    if (!acc[machine.name]) {
      acc[machine.name] = [];
    }
    acc[machine.name].push(machine);
    return acc;
  }, {} as Record<string, Machine[]>);

  const folders = Object.keys(machineGroups);

  // --- Helpers ---

  const calculateHoursDifference = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    
    const startMinutes = h1 * 60 + m1;
    const endMinutes = h2 * 60 + m2;
    
    let diffMinutes = endMinutes - startMinutes;
    
    // Handle overnight shift (e.g. 23:00 to 01:00)
    if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
    }
    
    if (diffMinutes === 0) return 0;

    return parseFloat((diffMinutes / 60).toFixed(2));
  };

  const getStatusIcon = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.OPERATIONAL: return <CheckCircle2 size={16} className="text-emerald-400" />;
      case MachineStatus.MAINTENANCE: return <AlertCircle size={16} className="text-amber-400" />;
      case MachineStatus.IDLE: return <Power size={16} className="text-gray-400" />;
      case MachineStatus.OFFLINE: return <Power size={16} className="text-red-400" />;
      default: return <Folder size={16} className="text-blue-400" />;
    }
  };

  const getStatusLabel = (status: MachineStatus) => {
     switch (status) {
      case MachineStatus.OPERATIONAL: return 'Operacional';
      case MachineStatus.MAINTENANCE: return 'Manutenção';
      case MachineStatus.IDLE: return 'Parada';
      case MachineStatus.OFFLINE: return 'Desligada';
      default: return status;
    }
  };

  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.OPERATIONAL: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case MachineStatus.MAINTENANCE: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case MachineStatus.IDLE: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case MachineStatus.OFFLINE: return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-blue-500/10 text-blue-400';
    }
  };

  const getManualLink = (machine: Machine) => {
    const name = machine.name.toLowerCase();
    const type = machine.type.toLowerCase();
    
    // Links provided by user, converted to preview format for embedding
    if (name.includes('romi')) return 'https://drive.google.com/file/d/1qYn7PL53AjR0Z58YTBl2uGNAV6X9rtOQ/preview';
    if (name.includes('nardini')) return 'https://drive.google.com/file/d/1aR4usTinw_GPWavieh5haUrjH3IGykjN/preview';
    if (name.includes('fresa') || type.includes('fresa')) return '/assets/aistudio/portuguese---mill-operator_s-manual---2015_90f28470.pdf';
    if (name.includes('retífica') || name.includes('retifica') || type.includes('retífica')) return 'https://drive.google.com/file/d/1FmOUposHRLs_KELlt4qXUfzI233-T5Zu/preview';
    if (name.includes('serra') || type.includes('serra')) return 'https://drive.google.com/file/d/1TvE53IXkt6qsPtSetAJNn7IIUdQ6SgwB/preview';
    if (name.includes('esmeril') || type.includes('esmeril')) return 'https://drive.google.com/file/d/1ydX33ajxY8sFDJHEhoebl5BlcKGkk-nj/preview';
    if (name.includes('furadeira') || type.includes('furadeira')) return 'https://drive.google.com/file/d/1EAYVfoRtT7WuQCP2nAPrj5TrwW8CAf0A/preview';
    
    return '#'; 
  };

  const getSafetyLink = (machine: Machine) => {
    const name = machine.name.toLowerCase();
    const type = machine.type.toLowerCase();
    
    // Specific link for Torno ROMI
    if (name.includes('romi')) return 'https://forms.office.com/r/1DdqrYN02t';
    // Specific link for Torno Nardini
    if (name.includes('nardini')) return 'https://docs.google.com/forms/d/e/1FAIpQLSeYBnnylzN7_MEatYPYeAoxAgfYVKlESuLD7I4knXldlpmn_w/viewform';
    // Specific link for Furadeira
    if (name.includes('furadeira') || type.includes('furadeira')) return 'https://forms.office.com/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAMAAHiTfXdURVpPTEtLR1JTSUxZUjhBVVlTTDhYUjZXTy4u';
    // Specific link for Serra de Fita
    if (name.includes('serra') || type.includes('serra')) return 'https://forms.office.com/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAMAAHiTfXdUOFVTTFdIQ0VYR1hRNklIQzlFRlFGVTRSOC4u';

    // New specific links
    if (name.includes('retífica') || name.includes('retifica') || type.includes('retífica')) return 'https://docs.google.com/forms/d/e/1FAIpQLScEIQY-OKw55JZr61DVVPae_qEZMk_euUvwiW3eJFKUjhrmkw/viewform';
    if (name.includes('esmeril') || type.includes('esmeril')) return 'https://docs.google.com/forms/d/e/1FAIpQLSc3M1TbMfheqxMYczWjbE6ZNP_aFipJXshWLyx1CT6y3RlVgg/viewform';
    // Nota: Fresadora Kone utiliza questionário de segurança e lubrificação integrados

    return ''; // Return empty if no specific form exists
  };

  const getLubricationUrl = (machine: Machine, type: 'diario' | 'semanal' | 'mensal' | 'semestral' | 'anual') => {
      const name = machine.name.toLowerCase();
      const machType = machine.type.toLowerCase();

      // Fresadora Kone: utiliza os novos módulos integrados (Semanal e Semestral)

      if (name.includes('retífica') || name.includes('retifica') || machType.includes('retífica')) {
         if (type === 'semanal') return 'https://docs.google.com/forms/d/1E9QaZj3Ly5SiU8s3ZzrkhAmPI6i9UGhqDQCo_N4k-ko/viewform';
         if (type === 'anual') return 'https://docs.google.com/forms/d/e/1FAIpQLSf4wOhFkJ9JheRC1caXtfefhluvFUxp8R0ks180n88FeCDwEw/viewform';
      }

      if (name.includes('nardini') || machType.includes('nardini')) {
         if (type === 'diario') return 'https://docs.google.com/forms/d/e/1FAIpQLScUX3HgAlqnxrNtiMLbiF_y_Uc1pXr6H5MalnWjQaWNAmy33g/viewform';
         if (type === 'anual') return 'https://docs.google.com/forms/d/e/1FAIpQLScookODjp1sWB0hNhhrPYhkquIUasvtxDkLcI0rIx-fw18sBQ/viewform';
      }

      if (name.includes('romi') || machType.includes('cnc')) {
         if (type === 'diario') return 'https://docs.google.com/forms/d/e/1FAIpQLSfBRAd27mYMfFxgoqZus-h_9Xw2DHm2J_9Va7W01pSChQ5Zmg/viewform';
         // Monthly is now handled internally
      }

      if (name.includes('serra') || machType.includes('serra')) {
          return 'https://docs.google.com/forms/d/e/1FAIpQLSdYwJIpW1cYuLVNxjgDghXSe7tMtTesxFSmJTpdSW0PZhcOuA/viewform';
      }

      if (name.includes('furadeira') || machType.includes('furadeira')) {
          if (type === 'diario') return 'https://docs.google.com/forms/d/e/1FAIpQLScLVl4QkrY8KHPCzA3tFMoHG_vImD_4PyWY3Rt5hEYOEbD7-Q/viewform';
          if (type === 'anual') return 'https://docs.google.com/forms/d/e/1FAIpQLSfzWyelIjaJ3ZWDTBLDoi43FeRGA46fp656mbVo8rKzd1P7Sw/viewform';
      }

      return '';
  };

  const handleOpenManual = () => {
      if (!selectedMachine) return;
      
      if (showInlineManual) {
          setShowInlineManual(false);
          return;
      }

      const link = getManualLink(selectedMachine);
      if (link !== '#') {
          setManualUrl(link);
          setShowInlineManual(true);
      } else {
          showToast("Manual técnico não disponível para este equipamento no momento.", "warning");
      }
  };

  const handleToggleSafety = () => {
      if (!selectedMachine) return;
      
      const link = getSafetyLink(selectedMachine);
      setSafetyUrl(link || '');
      
      // Just toggle the drawer, do NOT open the link automatically
      setShowInlineSafety(!showInlineSafety);
  };

  const handleOpenSafetyForm = () => {
      if (!selectedMachine) return;
      const link = getSafetyLink(selectedMachine);
      if (link) {
          window.open(link, '_blank');
      }
  };

  const handleSafetyConfirm = () => {
    if (!selectedMachine) return;

    if (!safetyForm.course || !safetyForm.studentClass) {
        showToast("Por favor, preencha o Curso e a Turma antes de confirmar a segurança.", "warning");
        return;
    }
    
    // Unlock Machine for today and current operator
    const updatedMachines = machines.map(m => 
      m.id === selectedMachine.id 
        ? { 
            ...m, 
            safetyCheckCompleted: true,
            lastSafetyCheckUser: currentUser || 'Operador',
            lastSafetyCheckDate: todayStr,
            status: MachineStatus.OPERATIONAL
          } 
        : m
    );
    setMachines(updatedMachines);
    
    // Add Log
    onAddOperationalLog({
        id: `OP-${Date.now()}`,
        machineId: selectedMachine.id,
        type: 'Segurança',
        timestamp: new Date().toISOString(),
        user: currentUser || 'Desconhecido',
        details: 'Questionário de segurança e inspeção visual validados.',
        course: safetyForm.course,
        studentClass: safetyForm.studentClass,
        shift: safetyForm.shift
    });

    setShowInlineSafety(false);
    setSafetyForm({ course: '', studentClass: '', shift: 'Manhã' }); // Reset form
    showToast("Checklist de segurança validado! Equipamento liberado para operação.", "success");
  };

  const handleLubricationClick = (type: 'diario' | 'semanal' | 'mensal' | 'semestral' | 'anual') => {
      if (!selectedMachine) return;

      // Special case for Fresadora Kone: opens questionnaire right inside machine
      if (isFresa && (type === 'semanal' || type === 'semestral')) {
          setLubricationType(type);
          setInMachineLubricationView(type);
          return;
      }

      // Special case for ROMI internal checklist (no external link)
      if (isRomi && type === 'mensal') {
           setLubricationType(type);
           return;
      }

      const url = getLubricationUrl(selectedMachine, type);
      if (url) {
          window.open(url, '_blank');
      }
      setLubricationType(type);
  };

  const handleLubricationRegister = () => {
      if(!selectedMachine) return;
      
      if (!lubricationForm.course || !lubricationForm.studentClass) {
          showToast("Por favor, preencha o Curso e a Turma antes de registrar.", "warning");
          return;
      }

      // Logic for Romi Monthly Internal Checklist
      if (isRomi && lubricationType === 'mensal') {
          if (!romiMonthlyChecks.oilLevel || !romiMonthlyChecks.lubeChuck || !romiMonthlyChecks.cleanFilters) {
              showToast("Por favor, complete todos os itens obrigatórios do checklist mensal.", "warning");
              return;
          }
      }

      let details = lubricationType 
        ? `Lubrificação ${lubricationType} (${selectedMachine.type}) registrada.` 
        : 'Lubrificação de rotina registrada.';

      if (isRomi && lubricationType === 'mensal') {
          details = "Checklist Mensal ROMI realizado: Nível Óleo (OK), Filtros (OK), Placa (OK), Vazamentos (OK), Esteira (OK).";
      }

      onAddOperationalLog({
          id: `OP-${Date.now()}`,
          machineId: selectedMachine.id,
          type: 'Lubrificação',
          timestamp: new Date().toISOString(),
          user: currentUser || 'Desconhecido',
          details: details,
          course: lubricationForm.course,
          studentClass: lubricationForm.studentClass,
          shift: lubricationForm.shift
      });
      setShowInlineLubrication(false);
      setLubricationType(null);
      setLubricationForm({ course: '', studentClass: '', shift: 'Manhã' }); // Reset form
      setRomiMonthlyChecks({ oilLevel: false, cleanFilters: false, lubeChuck: false, checkLeaks: false, cleanConveyor: false });
      showToast("Execução de lubrificação registrada com sucesso no histórico!", "success");
  };

  const handleSaveHours = () => {
    if (!selectedMachine || !hourControl.student || !hourControl.startTime || !hourControl.endTime) {
        showToast("Por favor, preencha o nome do operador e os horários de início e fim.", "warning");
        return;
    }
    
    const hours = calculateHoursDifference(hourControl.startTime, hourControl.endTime);
    
    if (hours <= 0) {
        showToast("Duração inválida. Verifique os horários informados.", "warning");
        return;
    }

    // Update Machine
    const updatedMachines = machines.map(m => 
        m.id === selectedMachine.id 
        ? { ...m, operatingHours: (m.operatingHours || 0) + hours } 
        : m
    );
    setMachines(updatedMachines);

    // Add Log
    onAddOperationalLog({
        id: `OP-${Date.now()}`,
        machineId: selectedMachine.id,
        type: 'Operação',
        timestamp: new Date().toISOString(),
        user: hourControl.student,
        details: `Registro de ${hours}h de uso (${hourControl.startTime} - ${hourControl.endTime}). Turno: ${hourControl.shift}.`
    });

    setHourControl({ student: '', shift: 'Manhã', startTime: '', endTime: '' });
    showToast(`Registro de ${hours}h computado com sucesso no horímetro!`, "success");
  };


  // Zoom Handlers Manual
  const handleManualZoomIn = () => setManualScale(prev => Math.min(prev + 0.1, 2.0));
  const handleManualZoomOut = () => setManualScale(prev => Math.max(prev - 0.1, 0.5));
  const handleManualReset = () => setManualScale(1);

  // Zoom Handlers Safety - Removed as we are opening new tab
  // const handleSafetyZoomIn = () => setSafetyScale(prev => Math.min(prev + 0.1, 2.0));
  // const handleSafetyZoomOut = () => setSafetyScale(prev => Math.max(prev - 0.1, 0.5));
  // const handleSafetyReset = () => setSafetyScale(1);


  // --- Handlers ---
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName || !newMachineData.id) return;
    
    const newMachine: Machine = {
      id: newMachineData.id,
      name: newFolderName,
      type: newMachineData.type,
      model: `${newMachineData.model} ${newMachineData.serial ? `(Série ${newMachineData.serial})` : ''}`,
      status: MachineStatus.OPERATIONAL,
      lastMaintenance: new Date().toISOString().split('T')[0],
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400',
      progress: 100,
      safetyCheckCompleted: false,
      operatingHours: 0
    };
    
    setMachines([...machines, newMachine]);
    
    setNewFolderName('');
    setNewMachineData({ id: '', type: '', model: '', serial: '' });
    setIsFolderModalOpen(false);
  };

  const handleAddMachineToFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolder || !newMachineData.id) return;
    
    const newMachine: Machine = {
      id: newMachineData.id,
      name: selectedFolder,
      type: newMachineData.type,
      model: `${newMachineData.model} ${newMachineData.serial ? `(Série ${newMachineData.serial})` : ''}`,
      status: MachineStatus.OPERATIONAL,
      lastMaintenance: new Date().toISOString().split('T')[0],
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400',
      progress: 100,
      safetyCheckCompleted: false,
      operatingHours: 0
    };
    
    setMachines([...machines, newMachine]);
    setNewMachineData({ id: '', type: '', model: '', serial: '' });
    setIsMachineModalOpen(false);
  };

  const handleStatusChange = (newStatus: MachineStatus) => {
    if (!selectedMachine) return;
    // Check if safety is completed, UNLESS it's a bancada OR the user is an admin
    if (!isBancada && newStatus === MachineStatus.OPERATIONAL && !selectedMachine.safetyCheckCompleted && userRole !== 'admin') {
       showToast("Atenção: É obrigatório validar o Checklist de Segurança antes de alterar para Operacional.", "warning");
       return;
    }
    const updatedMachines = machines.map(m => m.id === selectedMachine.id ? { ...m, status: newStatus } : m);
    setMachines(updatedMachines);
    showToast(`Status da máquina atualizado para ${newStatus}.`, "info");
  };

  const handleLockedAccess = () => {
    if (isLocked) {
        showToast("Equipamento bloqueado por segurança. Complete o checklist para desbloquear.", "warning");
        // Open safety logic
        handleToggleSafety();
    }
  };

  const handleDateChange = (newDate: string) => {
    if (!selectedMachine) return;
    const updatedMachines = machines.map(m => m.id === selectedMachine.id ? { ...m, lastMaintenance: newDate } : m);
    setMachines(updatedMachines);
  };

  const handleAiSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: aiInput, timestamp: new Date() };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setIsAiLoading(true);
    const responseText = await askTechnicalAssistant(`Machine: ${selectedMachine?.name}. Question: ${userMsg.text}`);
    const botMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', text: responseText, timestamp: new Date() };
    setAiMessages(prev => [...prev, botMsg]);
    setIsAiLoading(false);
  };

  // --- Render ---

  // 1. DETAIL VIEW
  if (selectedMachine) {
    const calculatedDuration = calculateHoursDifference(hourControl.startTime, hourControl.endTime);

    // In-Machine Full Lubrication Module (Keeps user inside machine without navigating away)
    if (inMachineLubricationView !== 'none') {
      return (
        <div className="space-y-6 animate-fade-in h-full pb-12 relative">
          {/* Machine Header with Back Button */}
          <div className="bg-theme-card p-4 md:p-6 rounded-[24px] border border-theme-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setInMachineLubricationView('none')}
                className="p-3 rounded-full bg-theme-input hover:bg-theme-cardHover text-theme-text-muted hover:text-white shadow-sm transition-colors border border-theme-border"
                title="Voltar aos detalhes da máquina"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-theme-accent-danger font-bold">
                    PLANO DE LUBRIFICAÇÃO DA MÁQUINA
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-theme-input border border-theme-border font-mono text-theme-text-muted">
                    PAT: {selectedMachine.id}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-tech uppercase text-theme-text-main flex items-center gap-2">
                  <Droplets size={22} className="text-theme-accent-danger" />
                  {selectedMachine.name} — Lubrificação & Histórico
                </h2>
              </div>
            </div>

            <button
              onClick={() => setInMachineLubricationView('none')}
              className="px-4 py-2 bg-theme-input hover:bg-theme-card border border-theme-border rounded-xl text-xs font-bold uppercase tracking-wider text-theme-text-main transition flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Voltar aos Detalhes da Máquina
            </button>
          </div>

          {/* Full Integrated Questionnaire & History Module */}
          <FresaLubricationModule 
            machines={machines}
            currentUser={currentUser}
            userRole={userRole}
            initialType={inMachineLubricationView}
            onAddOperationalLog={onAddOperationalLog}
            onClose={() => setInMachineLubricationView('none')}
            isEmbedded={true}
          />
        </div>
      );
    }

    // In-Machine Full Safety Module (Keeps user inside machine without navigating away)
    if (inMachineSafetyView) {
      return (
        <div className="space-y-6 animate-fade-in h-full pb-12 relative">
          {/* Machine Header with Back Button */}
          <div className="bg-theme-card p-4 md:p-6 rounded-[24px] border border-theme-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setInMachineSafetyView(false)}
                className="p-3 rounded-full bg-theme-input hover:bg-theme-cardHover text-theme-text-muted hover:text-white shadow-sm transition-colors border border-theme-border"
                title="Voltar aos detalhes da máquina"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-theme-accent-danger font-bold">
                    INSPEÇÃO DE SEGURANÇA NR-12 (OBRIGATÓRIA)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-theme-input border border-theme-border font-mono text-theme-text-muted">
                    PAT: {selectedMachine.id}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-tech uppercase text-theme-text-main flex items-center gap-2">
                  <ShieldCheck size={22} className="text-theme-accent-danger" />
                  {selectedMachine.name} — Questionário de Segurança NR-12
                </h2>
              </div>
            </div>

            <button
              onClick={() => setInMachineSafetyView(false)}
              className="px-4 py-2 bg-theme-input hover:bg-theme-card border border-theme-border rounded-xl text-xs font-bold uppercase tracking-wider text-theme-text-main transition flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Voltar aos Detalhes da Máquina
            </button>
          </div>

          {/* Full Integrated Safety Questionnaire Inside Machine */}
          <FresaSafetyQuestionnaire 
            machines={machines}
            currentUser={currentUser}
            userRole={userRole}
            isEmbedded={true}
            onClose={() => setInMachineSafetyView(false)}
            onAddOperationalLog={onAddOperationalLog}
            onUnlockMachine={(machId, opName, inspDate) => {
              const updatedMachines = machines.map(m =>
                m.id === machId
                  ? {
                      ...m,
                      safetyCheckCompleted: true,
                      lastSafetyCheckUser: opName || currentUser,
                      lastSafetyCheckDate: inspDate || todayStr,
                      status: MachineStatus.OPERATIONAL,
                    }
                  : m
              );
              setMachines(updatedMachines);
              showToast("Checklist de Segurança Concluído! Máquina desbloqueada com sucesso.", "success");
            }}
          />
        </div>
      );
    }

    return (
        <div className="space-y-6 animate-fade-in h-full pb-8 relative">
             {/* Toast Notification Banner */}
             {toast && (
                <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 max-w-md ${
                  toast.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' :
                  toast.type === 'warning' ? 'bg-amber-950/95 border-amber-500/50 text-amber-200' :
                  toast.type === 'error' ? 'bg-red-950/95 border-red-500/50 text-red-200' :
                  'bg-slate-900/95 border-blue-500/50 text-blue-200'
                }`}>
                  {toast.type === 'success' && <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />}
                  {toast.type === 'warning' && <AlertTriangle size={20} className="text-amber-400 shrink-0" />}
                  {toast.type === 'error' && <AlertCircle size={20} className="text-red-400 shrink-0" />}
                  {toast.type === 'info' && <Info size={20} className="text-blue-400 shrink-0" />}
                  <span className="text-xs md:text-sm font-medium flex-1">{toast.message}</span>
                  <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition">
                    <X size={16} />
                  </button>
                </div>
             )}

             {/* Header */}
             <div className="flex items-center gap-4 mb-2">
                <button 
                    onClick={() => setSelectedMachineId(null)}
                    className="p-3 rounded-full bg-theme-card hover:bg-theme-cardHover text-theme-text-muted shadow-sm transition-colors border border-theme-border"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-theme-text-main tracking-tight">{selectedMachine.name}</h2>
                    <div className="flex items-center gap-3 text-theme-text-muted text-sm font-medium">
                         <span className="bg-theme-input px-2 py-0.5 rounded text-sm font-bold border border-theme-border flex items-center gap-1">
                             <Tag size={14}/> PAT: {selectedMachine.id}
                         </span>
                         <span>|</span>
                         <span>{selectedMachine.type}</span>
                    </div>
                </div>
             </div>

             {/* MAIN CONTENT AREA */}
             <div className="flex flex-col gap-8">
                
                {/* 1. Main Info Card (Full Width) */}
                <div className="w-full">
                    <div className="bg-theme-card rounded-[30px] p-8 shadow-soft relative overflow-hidden border border-theme-border">
                        
                        {isBancada ? (
                          // BANCADA LAYOUT (UNCHANGED)
                          <div className="flex flex-col gap-8">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* LEFT COLUMN - Lado Esquerdo */}
                                  <div className="flex flex-col gap-4">
                                      <div 
                                        className="aspect-square rounded-[24px] overflow-hidden shadow-inner relative group bg-theme-input border border-theme-border cursor-pointer"
                                        onClick={() => setPreviewImage("https://lh3.googleusercontent.com/d/1IRrORdtoV0eg-Ox16sM6KOF4SJCkhcst")}
                                      >
                                          <img 
                                            src="https://lh3.googleusercontent.com/d/1IRrORdtoV0eg-Ox16sM6KOF4SJCkhcst" 
                                            alt="Lado Esquerdo" 
                                            className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110" 
                                          />
                                          <div className="absolute top-4 left-4 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded backdrop-blur-sm uppercase tracking-wider border border-white/10">Lado Esquerdo</div>
                                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <ZoomIn className="text-white" size={32} />
                                          </div>
                                      </div>
                                      <div className="bg-theme-input/50 p-4 rounded-[20px] border border-theme-border h-full">
                                          <div className="text-sm font-bold text-theme-accent-solid mb-3 uppercase tracking-widest flex items-center gap-2">
                                              <ClipboardList size={16} /> Ferramentas
                                          </div>
                                          <ul className="text-sm text-theme-text-muted space-y-2 font-mono leading-tight">
                                              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-theme-text-muted/50 rounded-full"/> Morsa de Bancada</li>
                                              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-theme-text-muted/50 rounded-full"/> Mordentes Proteção</li>
                                              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-theme-text-muted/50 rounded-full"/> Esquadro de Luz</li>
                                          </ul>
                                      </div>
                                  </div>

                                  {/* CENTER COLUMN - Instrumentos */}
                                  <div className="flex flex-col gap-4">
                                    <div 
                                        className="aspect-square rounded-[24px] overflow-hidden shadow-inner relative group bg-theme-input border border-theme-border cursor-pointer"
                                        onClick={() => setPreviewImage("https://lh3.googleusercontent.com/d/1wOl6biiacOWuZSMPkn8X5RLvQclyH2WM")}
                                    >
                                        <img 
                                            src="https://lh3.googleusercontent.com/d/1wOl6biiacOWuZSMPkn8X5RLvQclyH2WM" 
                                            alt="Instrumentos" 
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110" 
                                        />
                                        <div className="absolute top-4 left-4 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded backdrop-blur-sm uppercase tracking-wider border border-white/10">Instrumentos</div>
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <ZoomIn className="text-white" size={32} />
                                        </div>
                                    </div>
                                    <div className="bg-theme-input/50 p-4 rounded-[20px] border border-theme-border h-full">
                                        <div className="text-sm font-bold text-theme-accent-solid mb-3 uppercase tracking-widest flex items-center gap-2">
                                            <ClipboardList size={16} /> Gerais
                                        </div>
                                        <ul className="text-sm text-theme-text-muted space-y-2 font-mono leading-tight">
                                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-theme-text-muted/50 rounded-full"/> Martelo de bola</li>
                                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-theme-text-muted/50 rounded-full"/> Escova de limpeza</li>
                                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-theme-text-muted/50 rounded-full"/> Paquímetro</li>
                                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-theme-text-muted/50 rounded-full"/> Punção de bico</li>
                                        </ul>
                                    </div>
                                  </div>

                                  {/* RIGHT COLUMN - Lado Direito */}
                                  <div className="flex flex-col gap-4">
                                      <div 
                                        className="aspect-square rounded-[24px] overflow-hidden shadow-inner relative group bg-theme-input border border-theme-border cursor-pointer"
                                        onClick={() => setPreviewImage("https://lh3.googleusercontent.com/d/1LfZlZae-RjlrDFumgYpmJKsn1GkDjIt-")}
                                      >
                                          <img 
                                            src="https://lh3.googleusercontent.com/d/1LfZlZae-RjlrDFumgYpmJKsn1GkDjIt-" 
                                            alt="Lado Direito" 
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110" 
                                          />
                                          <div className="absolute top-4 left-4 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded backdrop-blur-sm uppercase tracking-wider border border-white/10">Lado Direito</div>
                                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <ZoomIn className="text-white" size={32} />
                                          </div>
                                      </div>
                                      <div className="bg-theme-input/50 p-4 rounded-[20px] border border-theme-border h-full">
                                          <div className="text-sm font-bold text-theme-accent-solid mb-3 uppercase tracking-widest flex items-center gap-2">
                                              <ClipboardList size={16} /> Ferramentas
                                          </div>
                                          <ul className="text-sm text-theme-text-muted space-y-2 font-mono leading-tight">
                                              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-theme-text-muted/50 rounded-full"/> Lima bastarda</li>
                                              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-theme-text-muted/50 rounded-full"/> Lima murça</li>
                                              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-theme-text-muted/50 rounded-full"/> Arco de serra</li>
                                          </ul>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-xl text-theme-text-main mb-6">Informações Técnicas</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-xs text-theme-text-muted font-bold uppercase tracking-wider">Modelo</p>
                                            <p className="font-medium text-theme-text-main text-base">{selectedMachine.model}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-theme-text-muted font-bold uppercase tracking-wider mb-1">Manutenção</p>
                                            <input 
                                                type="date"
                                                value={selectedMachine.lastMaintenance}
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                className="font-medium text-theme-text-main bg-theme-input rounded-lg p-2 text-base outline-none border border-theme-border w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-theme-border relative">
                                    <label className="text-xs text-theme-text-muted font-bold uppercase tracking-wider mb-3 block">Status</label>
                                    <div className="relative">
                                        {isLocked && <div className="absolute inset-0 z-10 cursor-not-allowed bg-black/20" onClick={handleLockedAccess}></div>}
                                        <select 
                                            value={selectedMachine.status}
                                            onChange={(e) => handleStatusChange(e.target.value as MachineStatus)}
                                            className="w-full appearance-none p-4 rounded-xl font-bold text-base border outline-none cursor-pointer transition-colors bg-theme-input border-theme-border text-theme-text-main"
                                        >
                                            <option value={MachineStatus.OPERATIONAL}>Operacional</option>
                                            <option value={MachineStatus.MAINTENANCE}>Em Manutenção</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                          </div>
                        ) : (
                          // STANDARD LAYOUT (HORIZONTAL GRID)
                          <div className="flex flex-col xl:flex-row gap-8 items-stretch">
                              {/* IMAGE CONTAINER */}
                              <div 
                                className="w-full xl:w-5/12 aspect-video xl:aspect-auto xl:h-auto rounded-[24px] overflow-hidden shadow-inner relative group bg-theme-input border border-theme-border cursor-pointer min-h-[250px]"
                                onClick={() => setPreviewImage(selectedMachine.image)}
                              >
                                  <img 
                                    src={selectedMachine.image} 
                                    alt={selectedMachine.name} 
                                    className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110" 
                                  />
                                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ZoomIn className="text-white" size={32} />
                                  </div>
                              </div>
                              
                              {/* DETAILS GRID */}
                              <div className="flex-1 flex flex-col justify-between">
                                  <div>
                                      <h3 className="font-bold text-xl text-theme-text-main mb-6 flex items-center gap-2">
                                        <FileText size={20} className="text-theme-accent-solid" />
                                        Informações Técnicas
                                      </h3>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* PATRIMONIO */}
                                          <div className="bg-theme-input/50 p-4 rounded-2xl border border-theme-border flex flex-col justify-center">
                                              <div className="text-xs text-theme-text-muted font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                  <Tag size={14} /> Patrimônio
                                              </div>
                                              <div className="font-mono font-bold text-theme-text-main text-base">{selectedMachine.id}</div>
                                          </div>

                                          {/* TIPO */}
                                          <div className="bg-theme-input/50 p-4 rounded-2xl border border-theme-border flex flex-col justify-center">
                                              <div className="text-xs text-theme-text-muted font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                  <HardDrive size={14} /> Tipo
                                              </div>
                                              <div className="font-bold text-theme-text-main text-base">{selectedMachine.type}</div>
                                          </div>

                                          {/* MODELO - FULL WIDTH */}
                                          <div className="col-span-1 md:col-span-2 bg-theme-input/50 p-4 rounded-2xl border border-theme-border flex flex-col justify-center">
                                              <div className="text-xs text-theme-text-muted font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                  <Cpu size={14} /> Modelo / Série
                                              </div>
                                              <div className="font-bold text-theme-text-main text-base leading-tight">{selectedMachine.model}</div>
                                          </div>
                                          
                                          {/* MAINTENANCE DATE */}
                                          <div className="bg-theme-input/50 p-3 rounded-2xl border border-theme-border">
                                              <div className="text-xs text-theme-text-muted font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                  <Calendar size={14} /> Última Manutenção
                                              </div>
                                              <input 
                                                type="date"
                                                value={selectedMachine.lastMaintenance}
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                className="w-full bg-theme-card border border-theme-border rounded-lg p-2 text-base text-theme-text-main outline-none focus:border-theme-accent-solid transition-colors font-medium"
                                              />
                                          </div>

                                          {/* STATUS SELECT */}
                                          <div className="bg-theme-input/50 p-3 rounded-2xl border border-theme-border relative">
                                              {isLocked && <div className="absolute inset-0 z-10 cursor-not-allowed bg-black/10 rounded-2xl" onClick={handleLockedAccess}></div>}
                                              <div className="text-xs text-theme-text-muted font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                  <Settings size={14} /> Status Operacional
                                              </div>
                                              <select 
                                                  value={selectedMachine.status}
                                                  onChange={(e) => handleStatusChange(e.target.value as MachineStatus)}
                                                  className={`w-full p-2 rounded-lg font-bold text-sm border outline-none cursor-pointer transition-colors appearance-none text-center uppercase tracking-wide
                                                    ${selectedMachine.status === MachineStatus.OPERATIONAL ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500' : 
                                                      selectedMachine.status === MachineStatus.MAINTENANCE ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500' : 
                                                      'bg-theme-card text-theme-text-muted border-theme-border'}
                                                  `}
                                              >
                                                  <option value={MachineStatus.OPERATIONAL}>Operacional</option>
                                                  <option value={MachineStatus.MAINTENANCE}>Manutenção</option>
                                                  <option value={MachineStatus.IDLE}>Parada</option>
                                                  <option value={MachineStatus.OFFLINE}>Desligada</option>
                                              </select>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                        )}
                    </div>
                </div>

                {/* 2. OPERATIONAL STACK (Safety -> Lubrication -> Manuals -> Hours) */}
                {!isBancada && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* LEFT COLUMN - MAIN CONTROLS */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            
                            {/* 1. SEGURANÇA */}
                            <div className="bg-theme-card rounded-[30px] p-6 shadow-soft space-y-4 border border-theme-border">
                                <div className="flex items-center justify-between border-b border-theme-border pb-4">
                                    <div className="relative pb-1">
                                        <h3 className="font-bold text-base text-theme-text-main">Normas de Segurança</h3>
                                        <div className="absolute bottom-[-17px] left-0 w-full h-0.5 bg-theme-accent-solid rounded-t-full"></div>
                                    </div>
                                </div>

                                <div className="relative flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-3">
                                            <AlertTriangle size={18} className={isLocked ? "text-red-500 animate-pulse" : "text-emerald-500"} />
                                            <h4 className={`text-xs font-bold uppercase tracking-widest ${isLocked ? "text-red-500" : "text-theme-text-muted"}`}>
                                            SEGURANÇA OBRIGATÓRIA
                                            </h4>
                                    </div>
                                    <div className={`
                                        rounded-2xl p-4 border transition-all duration-300 flex-1 flex flex-col
                                        ${isLocked 
                                            ? 'bg-red-500/10 border-red-500/50 shadow-glow' 
                                            : 'bg-theme-input border-theme-border'
                                        }
                                    `}>
                                        <button onClick={handleToggleSafety} className="w-full text-left">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isLocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                        {isLocked ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-base text-theme-text-main flex items-center gap-2">Questionário Segurança <ExternalLink size={14} className="opacity-50" /></div>
                                                        <div className="text-xs font-bold text-theme-text-muted">NR-12</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded border ${isLocked ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                                                        {isLocked ? '*PENDENTE' : 'VERIFICADO'}
                                                    </span>
                                                    {showInlineSafety ? <ChevronUp size={18} className="text-theme-text-muted"/> : <ChevronDown size={18} className="text-theme-text-muted"/>}
                                                </div>
                                            </div>
                                        </button>

                                        {/* INLINE SAFETY VIEWER */}
                                        {showInlineSafety && (
                                            <div className="mt-4 border-t border-theme-border pt-4 animate-fade-in flex-1">
                                                
                                                {/* Notice when Locked */}
                                                {isLocked && (
                                                    <div className="p-3 mb-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
                                                        <AlertTriangle size={18} className="shrink-0 text-red-400 mt-0.5" />
                                                        <div className="space-y-1">
                                                            <div className="font-bold uppercase tracking-wider text-[11px] text-red-400">
                                                                Inspeção Obrigatória Pendente
                                                            </div>
                                                            <p className="text-[11px] opacity-90 leading-relaxed">
                                                                {selectedMachine.lastSafetyCheckDate !== todayStr
                                                                    ? `A inspeção de segurança deve ser respondida todos os dias. Nenhuma inspeção registrada para a data de hoje (${todayStr}).`
                                                                    : `A inspeção de segurança deve ser respondida toda vez que o operador mudar. Operador atual: "${currentUser || 'Visitante'}".`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {!isLocked && selectedMachine.lastSafetyCheckUser && (
                                                    <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 size={16} className="text-emerald-400" />
                                                            <span>Liberado para <strong>{selectedMachine.lastSafetyCheckUser}</strong> em {selectedMachine.lastSafetyCheckDate}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Button for Integrated Fresa Questionnaire */}
                                                {isFresa && (
                                                    <button
                                                        onClick={() => setInMachineSafetyView(true)}
                                                        className="w-full mb-3 py-3.5 bg-gradient-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-glow flex items-center justify-center gap-2 hover:brightness-110 transition hover:scale-[1.02]"
                                                    >
                                                        <ShieldCheck size={18} /> Abrir Questionário Oficial Fresa (NR-12)
                                                    </button>
                                                )}

                                                {/* Explicit Button to Open External Form (Only for other machines) */}
                                                {!isFresa && (
                                                    <button
                                                        onClick={handleOpenSafetyForm}
                                                        className="w-full mb-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold uppercase hover:bg-blue-500/20 transition flex items-center justify-center gap-2"
                                                    >
                                                        <ExternalLink size={14} /> Abrir Formulário de Segurança Externo
                                                    </button>
                                                )}

                                                {safetyUrl ? (
                                                    <>
                                                        <div className="bg-theme-bg p-4 rounded-xl border border-theme-border/50 mb-4 text-center">
                                                            <p className="text-[10px] text-theme-text-muted italic">
                                                                Após preencher, confirme abaixo para liberar o equipamento.
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-theme-text-muted mb-4 italic">
                                                        Checklist padrão de segurança e inspeção visual (NR-12).
                                                    </p>
                                                )}

                                                {/* Inputs for Safety History */}
                                                <div className="space-y-3 mb-4 pt-4 border-t border-theme-border/50">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-bold text-theme-text-muted uppercase mb-1 block">Curso</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Ex: Mecânica"
                                                                value={safetyForm.course}
                                                                onChange={(e) => setSafetyForm({...safetyForm, course: e.target.value})}
                                                                className="w-full bg-theme-input border border-theme-border rounded-lg p-2 text-sm text-theme-text-main outline-none focus:border-emerald-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-theme-text-muted uppercase mb-1 block">Turma</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Ex: T-2024"
                                                                value={safetyForm.studentClass}
                                                                onChange={(e) => setSafetyForm({...safetyForm, studentClass: e.target.value})}
                                                                className="w-full bg-theme-input border border-theme-border rounded-lg p-2 text-sm text-theme-text-main outline-none focus:border-emerald-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-theme-text-muted uppercase mb-1 block">Turno</label>
                                                        <select 
                                                            value={safetyForm.shift}
                                                            onChange={(e) => setSafetyForm({...safetyForm, shift: e.target.value})}
                                                            className="w-full bg-theme-input border border-theme-border rounded-lg p-2 text-sm text-theme-text-main outline-none focus:border-emerald-500 cursor-pointer"
                                                        >
                                                            <option value="Manhã">Manhã</option>
                                                            <option value="Tarde">Tarde</option>
                                                            <option value="Noite">Noite</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <button 
                                                        onClick={handleSafetyConfirm}
                                                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold uppercase tracking-wide shadow-lg hover:scale-[1.02] transition"
                                                    >
                                                        Confirmar & Liberar
                                                    </button>
                                                    {safetyUrl && (
                                                        <p className="text-center text-xs text-theme-text-muted mt-2 italic">
                                                            Certifique-se de ter enviado o formulário acima antes de confirmar.
                                                        </p>
                                                    )}
                                                </div>

                                                {/* RECENT SAFETY HISTORY TABLE */}
                                                <div className="mt-6 pt-4 border-t border-theme-border">
                                                    <h5 className="text-xs font-bold text-theme-text-muted uppercase mb-3 flex items-center gap-1">
                                                        <History size={14}/> Histórico de Segurança (Todos)
                                                    </h5>
                                                    <div className="bg-theme-bg/30 rounded-lg border border-theme-border overflow-hidden max-h-32 overflow-y-auto">
                                                        <table className="w-full text-left text-[10px]">
                                                            <thead className="bg-theme-input text-theme-text-muted uppercase sticky top-0">
                                                                <tr>
                                                                    <th className="p-2">Data</th>
                                                                    <th className="p-2">Resp.</th>
                                                                    <th className="p-2">Turma</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-theme-border/50 text-theme-text-main">
                                                                {machineSafetyHistory.length > 0 ? (
                                                                    machineSafetyHistory.map(log => (
                                                                        <tr key={log.id}>
                                                                            <td className="p-2 font-mono opacity-80">
                                                                                {new Date(log.timestamp).toLocaleDateString()}
                                                                            </td>
                                                                            <td className="p-2 font-bold truncate max-w-[50px]">{log.user}</td>
                                                                            <td className="p-2 opacity-70">{log.studentClass}</td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={3} className="p-4 text-center text-theme-text-muted italic opacity-50">
                                                                            Sem registros.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 2. LUBRIFICAÇÃO */}
                            <div className="bg-theme-card rounded-[30px] p-6 shadow-soft space-y-4 border border-theme-border">
                                <div className="flex items-center justify-between border-b border-theme-border pb-4">
                                    <div className="relative pb-1">
                                        <h3 className="font-bold text-base text-theme-text-main">Manutenção</h3>
                                        <div className="absolute bottom-[-17px] left-0 w-full h-0.5 bg-theme-accent-solid rounded-t-full"></div>
                                    </div>
                                </div>

                                <div className={`relative transition-all duration-300 flex-1 flex flex-col ${isLocked ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                    {isLocked && <div className="absolute inset-0 z-20 flex items-center justify-center"><Lock size={24} className="text-gray-500" /></div>}
                                    <div className="flex items-center gap-2 mb-3">
                                        <Droplet size={16} className="text-amber-500" />
                                        <h4 className="text-xs font-bold text-theme-text-muted uppercase tracking-widest">Lubrificação</h4>
                                    </div>
                                    <div className="bg-theme-input rounded-2xl p-2 border border-theme-border flex-1 flex flex-col">
                                        <button onClick={() => setShowInlineLubrication(!showInlineLubrication)} className="w-full bg-theme-card rounded-xl p-4 mb-0 flex justify-between items-center group border border-theme-border hover:bg-theme-cardHover transition">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500"><Zap size={24} /></div>
                                                <div className="text-left">
                                                    <div className="text-theme-text-main font-bold text-sm">Lubrificação</div>
                                                    <div className="text-xs text-amber-500 font-bold group-hover:underline">Registrar Execução</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {showInlineLubrication ? <ChevronUp size={18} className="text-theme-text-muted"/> : <ChevronDown size={18} className="text-theme-text-muted"/>}
                                            </div>
                                        </button>
                                        
                                        {showInlineLubrication && (
                                            <div className="mt-2 p-4 border-t border-theme-border animate-fade-in flex-1">
                                                {isFresa && (
                                                    <div className="mb-4 space-y-3 p-4 bg-theme-bg/80 border border-theme-border rounded-xl">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-accent-danger font-mono block">
                                                                Planos de Lubrificação Kone (Dentro da Máquina):
                                                            </span>
                                                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-theme-input text-theme-text-muted border border-theme-border">
                                                                Sem sair da tela
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            <button
                                                                onClick={() => setInMachineLubricationView('semanal')}
                                                                className="py-3 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition hover:scale-[1.02]"
                                                            >
                                                                <Droplets size={16} /> Lubrificação Semanal
                                                            </button>
                                                            <button
                                                                onClick={() => setInMachineLubricationView('semestral')}
                                                                className="py-3 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition hover:scale-[1.02]"
                                                            >
                                                                <Droplets size={16} /> Lubrificação Semestral
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => setInMachineLubricationView('history')}
                                                            className="w-full py-2.5 bg-theme-card hover:bg-theme-cardHover text-theme-text-main border border-theme-border rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition hover:border-theme-accent-solid"
                                                        >
                                                            <History size={14} className="text-theme-accent-solid" />
                                                            Ver Histórico e Laudos da Máquina
                                                        </button>
                                                    </div>
                                                )}
                                                {isFresa || isRetifica || isNardini || isRomi || isSerra || isFuradeira ? (
                                                    <>
                                                        <p className="text-sm text-theme-text-muted mb-4">
                                                            Selecione o tipo de lubrificação:
                                                        </p>
                                                        <div className="flex gap-2 mb-4 flex-wrap">
                                                            {(isNardini || isRomi || isFuradeira) && (
                                                                <button
                                                                    onClick={() => handleLubricationClick('diario')}
                                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${lubricationType === 'diario' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-theme-card text-theme-text-muted border-theme-border hover:bg-theme-input'}`}
                                                                >
                                                                    Diário
                                                                </button>
                                                            )}
                                                            {(isFresa || isRetifica) && (
                                                            <button
                                                                onClick={() => handleLubricationClick('semanal')}
                                                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${lubricationType === 'semanal' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-theme-card text-theme-text-muted border-theme-border hover:bg-theme-input'}`}
                                                            >
                                                                Semanal
                                                            </button>
                                                            )}
                                                            {isRomi && (
                                                                <button
                                                                    onClick={() => handleLubricationClick('mensal')}
                                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${lubricationType === 'mensal' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-theme-card text-theme-text-muted border-theme-border hover:bg-theme-input'}`}
                                                                >
                                                                    Mensal
                                                                </button>
                                                            )}
                                                            {isFresa && (
                                                                <button
                                                                    onClick={() => handleLubricationClick('semestral')}
                                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${lubricationType === 'semestral' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-theme-card text-theme-text-muted border-theme-border hover:bg-theme-input'}`}
                                                                >
                                                                    Semestral
                                                                </button>
                                                            )}
                                                            {(isRetifica || isNardini || isFuradeira) && (
                                                                <button
                                                                    onClick={() => handleLubricationClick('anual')}
                                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${lubricationType === 'anual' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-theme-card text-theme-text-muted border-theme-border hover:bg-theme-input'}`}
                                                                >
                                                                    Anual
                                                                </button>
                                                            )}
                                                            {isSerra && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleLubricationClick('semanal')}
                                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${lubricationType === 'semanal' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-theme-card text-theme-text-muted border-theme-border hover:bg-theme-input'}`}
                                                                    >
                                                                        Checklist
                                                                    </button>
                                                                    <button
                                                                        onClick={() => window.open('https://docs.google.com/spreadsheets/d/1amfUAJk92wUvzCzsFC7rbWMcy3FTkv2Em3pgADWsoQ4/edit?usp=drive_link', '_blank')}
                                                                        className="flex-1 py-2 rounded-lg text-xs font-bold uppercase border bg-theme-card text-theme-text-muted border-theme-border hover:bg-theme-input transition-colors flex items-center justify-center gap-2"
                                                                    >
                                                                        <FileText size={14} /> Planilha
                                                                    </button>
                                                                </>
                                                            )}
                                                            {isNardini && (
                                                                <>
                                                                    <button
                                                                        onClick={() => window.open('https://docs.google.com/spreadsheets/d/169omEYF94_fCthzBzPOtws2Bzy5CJgTpRGLyHAKKo4s/edit?usp=sharing', '_blank')}
                                                                        className="flex-1 py-2 rounded-lg text-xs font-bold uppercase border bg-theme-card text-theme-text-muted border-theme-border hover:bg-theme-input transition-colors flex items-center justify-center gap-2"
                                                                    >
                                                                        <FileText size={14} /> Planilha Semanal
                                                                    </button>
                                                                    <button
                                                                        onClick={() => window.open('https://docs.google.com/spreadsheets/d/12TFz2oAZRwGb5bc64XTEIuv5SocSGZiYvuH2l8ZfZZ0/edit?usp=sharing', '_blank')}
                                                                        className="flex-1 py-2 rounded-lg text-xs font-bold uppercase border bg-theme-card text-theme-text-muted border-theme-border hover:bg-theme-input transition-colors flex items-center justify-center gap-2"
                                                                    >
                                                                        <FileText size={14} /> Planilha Mensal
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>

                                                        {lubricationType && (
                                                            <div className="bg-theme-bg p-2 rounded-xl border border-theme-border/50 max-h-[300px] overflow-auto relative mb-4">
                                                                {/* Logic for Internal Romi Monthly Checklist */}
                                                                {isRomi && lubricationType === 'mensal' ? (
                                                                    <div className="p-3">
                                                                        <div className="flex items-center gap-2 mb-4">
                                                                            <CheckSquare size={16} className="text-amber-500" />
                                                                            <h6 className="text-xs font-bold uppercase text-theme-text-main">Checklist Mensal ROMI T240</h6>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <label className="flex items-center gap-2 p-2 bg-theme-input rounded-lg border border-theme-border cursor-pointer hover:border-amber-500 transition-colors">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    className="rounded text-amber-500 focus:ring-amber-500"
                                                                                    checked={romiMonthlyChecks.cleanFilters}
                                                                                    onChange={(e) => setRomiMonthlyChecks({...romiMonthlyChecks, cleanFilters: e.target.checked})}
                                                                                />
                                                                                <span className="text-xs text-theme-text-main">Limpeza filtros bomba refrigeração</span>
                                                                            </label>
                                                                            <label className="flex items-center gap-2 p-2 bg-theme-input rounded-lg border border-theme-border cursor-pointer hover:border-amber-500 transition-colors">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    className="rounded text-amber-500 focus:ring-amber-500"
                                                                                    checked={romiMonthlyChecks.oilLevel}
                                                                                    onChange={(e) => setRomiMonthlyChecks({...romiMonthlyChecks, oilLevel: e.target.checked})}
                                                                                />
                                                                                <span className="text-xs text-theme-text-main">Nível óleo hidráulico (Hidra 68)</span>
                                                                            </label>
                                                                            <label className="flex items-center gap-2 p-2 bg-theme-input rounded-lg border border-theme-border cursor-pointer hover:border-amber-500 transition-colors">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    className="rounded text-amber-500 focus:ring-amber-500"
                                                                                    checked={romiMonthlyChecks.lubeChuck}
                                                                                    onChange={(e) => setRomiMonthlyChecks({...romiMonthlyChecks, lubeChuck: e.target.checked})}
                                                                                />
                                                                                <span className="text-xs text-theme-text-main">Lubrificação castanhas da placa (Graxa)</span>
                                                                            </label>
                                                                            <label className="flex items-center gap-2 p-2 bg-theme-input rounded-lg border border-theme-border cursor-pointer hover:border-amber-500 transition-colors">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    className="rounded text-amber-500 focus:ring-amber-500"
                                                                                    checked={romiMonthlyChecks.checkLeaks}
                                                                                    onChange={(e) => setRomiMonthlyChecks({...romiMonthlyChecks, checkLeaks: e.target.checked})}
                                                                                />
                                                                                <span className="text-xs text-theme-text-main">Vazamentos unidade hidráulica</span>
                                                                            </label>
                                                                            <label className="flex items-center gap-2 p-2 bg-theme-input rounded-lg border border-theme-border cursor-pointer hover:border-amber-500 transition-colors">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    className="rounded text-amber-500 focus:ring-amber-500"
                                                                                    checked={romiMonthlyChecks.cleanConveyor}
                                                                                    onChange={(e) => setRomiMonthlyChecks({...romiMonthlyChecks, cleanConveyor: e.target.checked})}
                                                                                />
                                                                                <span className="text-xs text-theme-text-main">Limpeza transportador de cavacos</span>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-theme-bg p-4 rounded-xl border border-theme-border/50 text-center">
                                                                        <p className="text-xs text-theme-text-muted mb-2">
                                                                            O checklist de lubrificação foi aberto em uma nova aba.
                                                                        </p>
                                                                        <p className="text-[10px] text-theme-text-muted italic">
                                                                            Após preencher, confirme abaixo para registrar a execução.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-theme-text-muted mb-4">
                                                        Confirme a execução do procedimento de lubrificação.
                                                    </p>
                                                )}
                                                
                                                {/* Inputs for Lubrication History */}
                                                <div className="space-y-3 mb-4 pt-4 border-t border-theme-border/50">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-bold text-theme-text-muted uppercase mb-1 block">Curso</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Ex: Mecânica"
                                                                value={lubricationForm.course}
                                                                onChange={(e) => setLubricationForm({...lubricationForm, course: e.target.value})}
                                                                className="w-full bg-theme-input border border-theme-border rounded-lg p-2 text-sm text-theme-text-main outline-none focus:border-amber-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-theme-text-muted uppercase mb-1 block">Turma</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Ex: T-2024"
                                                                value={lubricationForm.studentClass}
                                                                onChange={(e) => setLubricationForm({...lubricationForm, studentClass: e.target.value})}
                                                                className="w-full bg-theme-input border border-theme-border rounded-lg p-2 text-sm text-theme-text-main outline-none focus:border-amber-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-theme-text-muted uppercase mb-1 block">Turno</label>
                                                        <select 
                                                            value={lubricationForm.shift}
                                                            onChange={(e) => setLubricationForm({...lubricationForm, shift: e.target.value})}
                                                            className="w-full bg-theme-input border border-theme-border rounded-lg p-2 text-sm text-theme-text-main outline-none focus:border-amber-500 cursor-pointer"
                                                        >
                                                            <option value="Manhã">Manhã</option>
                                                            <option value="Tarde">Tarde</option>
                                                            <option value="Noite">Noite</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={handleLubricationRegister}
                                                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-md transition-all hover:scale-[1.02]"
                                                >
                                                    Confirmar Execução
                                                </button>
                                                
                                                {/* RECENT HISTORY TABLE */}
                                                <div className="mt-6 pt-4 border-t border-theme-border">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h5 className="text-xs font-bold text-theme-text-muted uppercase flex items-center gap-1">
                                                            <History size={14}/> Histórico (Todos)
                                                        </h5>
                                                        <div className="flex gap-2">
                                                            {isRomi && (
                                                                <button
                                                                    onClick={() => window.open('https://docs.google.com/spreadsheets/d/1bmVmPBQRUm4x9HTCnu_2ltqVUfb8mlLfzdrFhphljzc/edit?usp=sharing', '_blank')}
                                                                    className="text-[10px] font-bold text-theme-text-muted border border-theme-border bg-theme-input px-2 py-1 rounded hover:text-white flex items-center gap-1 transition-colors"
                                                                >
                                                                    <FileText size={10} /> Planilha Mensal
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setShowLubricationReportModal(true)}
                                                                className="text-[10px] font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded hover:bg-emerald-500/20 flex items-center gap-1 transition-colors"
                                                            >
                                                                <FileText size={10} /> Relatório de Lubrificação
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="bg-theme-bg/30 rounded-lg border border-theme-border overflow-hidden max-h-32 overflow-y-auto">
                                                        <table className="w-full text-left text-[10px]">
                                                            <thead className="bg-theme-input text-theme-text-muted uppercase sticky top-0">
                                                                <tr>
                                                                    <th className="p-2">Data</th>
                                                                    <th className="p-2">Resp.</th>
                                                                    <th className="p-2">Turma</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-theme-border/50 text-theme-text-main">
                                                                {machineLubricationHistory.length > 0 ? (
                                                                    machineLubricationHistory.map(log => (
                                                                        <tr key={log.id}>
                                                                            <td className="p-2 font-mono opacity-80">
                                                                                {new Date(log.timestamp).toLocaleDateString()}
                                                                            </td>
                                                                            <td className="p-2 font-bold truncate max-w-[50px]">{log.user}</td>
                                                                            <td className="p-2 opacity-70">{log.studentClass}</td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={3} className="p-4 text-center text-theme-text-muted italic opacity-50">
                                                                            Sem registros.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 3. MANUAIS */}
                            <div className="bg-theme-card rounded-[30px] p-6 shadow-soft space-y-4 border border-theme-border">
                                <div className="flex items-center justify-between border-b border-theme-border pb-4">
                                    <div className="relative pb-1">
                                        <h3 className="font-bold text-base text-theme-text-main">Documentação Técnica</h3>
                                        <div className="absolute bottom-[-17px] left-0 w-full h-0.5 bg-theme-accent-solid rounded-t-full"></div>
                                    </div>
                                </div>

                                <div className={`relative transition-all duration-300 ${isLocked ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                    {isLocked && <div className="absolute inset-0 z-20 flex items-center justify-center"><Lock size={24} className="text-gray-500" /></div>}
                                    <div className="flex items-center gap-2 mb-3">
                                        <BookOpen size={16} className="text-blue-500" />
                                        <h4 className="text-xs font-bold text-theme-text-muted uppercase tracking-widest">Manuais</h4>
                                    </div>
                                    <div className="bg-theme-input rounded-2xl p-4 border border-theme-border">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <button onClick={handleOpenManual} className="flex-1 flex justify-between items-center group hover:bg-theme-card p-2 -m-2 rounded-xl transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500"><ClipboardList size={24} /></div>
                                                    <div className="text-left">
                                                        <div className="text-theme-text-main font-bold text-sm">
                                                            {isFresa ? 'Manual do Operador — Fresadora (Haas / Português)' : 'Manual Técnico'}
                                                        </div>
                                                        <div className="text-xs text-theme-text-muted">
                                                            {isFresa ? 'Documentação Oficial Completa (428 páginas)' : 'PDF Online'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {showInlineManual ? (
                                                    <ChevronUp size={18} className="text-blue-500 transition-colors" />
                                                ) : (
                                                    <ArrowRight size={18} className="text-theme-text-muted group-hover:text-blue-500 transition-colors" />
                                                )}
                                            </button>

                                            {isFresa && (
                                                <a 
                                                    href="/assets/aistudio/portuguese---mill-operator_s-manual---2015_90f28470.pdf" 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    download="manual_fresadora_haas_2015_pt.pdf"
                                                    className="px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition self-start sm:self-center shrink-0"
                                                    title="Baixar Manual do Operador (PDF)"
                                                >
                                                    <FileText size={14} /> Baixar PDF
                                                </a>
                                            )}
                                        </div>
                                        
                                        {/* Inline PDF Viewer with Zoom Controls */}
                                        {showInlineManual && manualUrl && (
                                            <div className="mt-4 border-t border-theme-border pt-4 animate-fade-in">
                                                {/* Zoom Toolbar */}
                                                <div className="flex justify-end gap-2 mb-2">
                                                    <div className="flex items-center bg-theme-input rounded-lg border border-theme-border overflow-hidden">
                                                        <button onClick={handleManualZoomOut} className="p-1.5 hover:bg-theme-card text-theme-text-muted hover:text-white transition" title="Diminuir Zoom">
                                                            <ZoomOut size={16} />
                                                        </button>
                                                        <div className="w-px h-4 bg-theme-border"></div>
                                                        <button onClick={handleManualReset} className="p-1.5 hover:bg-theme-card text-theme-text-muted hover:text-white transition" title="Resetar Zoom">
                                                            <RotateCcw size={16} />
                                                        </button>
                                                        <div className="w-px h-4 bg-theme-border"></div>
                                                        <button onClick={handleManualZoomIn} className="p-1.5 hover:bg-theme-card text-theme-text-muted hover:text-white transition" title="Aumentar Zoom">
                                                            <ZoomIn size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="bg-theme-bg p-2 rounded-xl border border-theme-border/50 h-[800px] overflow-auto relative">
                                                    <div style={{ transform: `scale(${manualScale})`, transformOrigin: 'top center', width: '100%', height: '100%', transition: 'transform 0.2s' }}>
                                                        <iframe 
                                                            src={manualUrl} 
                                                            title="Manual Viewer" 
                                                            className="w-full h-full rounded-lg bg-white" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 4. CONTROLE DE HORAS */}
                            <div className="bg-theme-card rounded-[30px] p-6 shadow-soft space-y-4 border border-theme-border flex flex-col">
                                <div className="flex items-center justify-between border-b border-theme-border pb-4">
                                    <div className="relative pb-1">
                                        <h3 className="font-bold text-base text-theme-text-main">Operação & Uso</h3>
                                        <div className="absolute bottom-[-17px] left-0 w-full h-0.5 bg-theme-accent-solid rounded-t-full"></div>
                                    </div>
                                </div>
                                
                                <div className="bg-theme-input/20 rounded-[20px] p-5 shadow-inner space-y-4 border border-theme-border/50 flex-1 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock size={20} className="text-theme-accent-solid" />
                                        <h4 className="text-sm font-bold text-theme-text-main uppercase tracking-wide">Controle de Horas</h4>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <input 
                                            type="text" 
                                            placeholder="Nome do Aluno"
                                            value={hourControl.student}
                                            onChange={(e) => setHourControl({...hourControl, student: e.target.value})}
                                            className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-base text-theme-text-main outline-none focus:border-theme-accent-solid"
                                        />

                                        <select 
                                            value={hourControl.shift}
                                            onChange={(e) => setHourControl({...hourControl, shift: e.target.value})}
                                            className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-base text-theme-text-muted outline-none appearance-none"
                                        >
                                            <option value="Manhã">Manhã</option>
                                            <option value="Tarde">Tarde</option>
                                            <option value="Noite">Noite</option>
                                        </select>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-theme-text-muted uppercase mb-1 block pl-1">Início</label>
                                                <div className="relative">
                                                    <input 
                                                        type="time" 
                                                        value={hourControl.startTime}
                                                        onChange={(e) => setHourControl({...hourControl, startTime: e.target.value})}
                                                        className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-base text-theme-text-main outline-none focus:border-theme-accent-solid"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-theme-text-muted uppercase mb-1 block pl-1">Fim</label>
                                                <div className="relative">
                                                    <input 
                                                        type="time" 
                                                        value={hourControl.endTime}
                                                        onChange={(e) => setHourControl({...hourControl, endTime: e.target.value})}
                                                        className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-base text-theme-text-main outline-none focus:border-theme-accent-solid"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {calculatedDuration > 0 ? (
                                            <div className="bg-theme-input/50 p-3 rounded-lg border border-theme-border space-y-2 animate-fade-in">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold uppercase text-theme-text-muted">Duração da Sessão</span>
                                                    <span className="text-base font-bold text-theme-accent-solid font-mono">
                                                        {Math.floor(calculatedDuration)}h {Math.round((calculatedDuration - Math.floor(calculatedDuration)) * 60)}min
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-2 text-xs text-theme-text-muted italic opacity-50">
                                                Preencha início e fim para calcular
                                            </div>
                                        )}

                                        <button 
                                            onClick={handleSaveHours}
                                            className="w-full py-3 bg-theme-accent-solid hover:bg-blue-600 text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-glow transition-all hover:scale-[1.02] mt-auto"
                                        >
                                            Salvar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN - AI ASSISTANT */}
                        <div className="lg:col-span-1 h-full">
                            {/* AI Chat */}
                            <div className="bg-theme-card rounded-[30px] shadow-soft flex flex-col overflow-hidden min-h-[500px] border border-theme-border h-full sticky top-6">
                                <div className="p-4 bg-theme-sidebar text-white flex justify-between items-center border-b border-theme-border">
                                    <div className="flex items-center gap-2">
                                        <Bot size={22} />
                                        <span className="font-bold text-sm">Assistente Virtual</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-theme-bg/50" ref={aiScrollRef}>
                                    {aiMessages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`p-3 rounded-2xl text-sm max-w-[90%] ${
                                                msg.role === 'user' 
                                                ? 'bg-theme-accent-solid text-white rounded-tr-none' 
                                                : 'bg-theme-input text-theme-text-main border border-theme-border rounded-tl-none'
                                            }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    {isAiLoading && <div className="text-theme-text-muted text-xs p-2">Digitando...</div>}
                                </div>
                                <form onSubmit={handleAiSend} className="p-3 bg-theme-card border-t border-theme-border flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Dúvida técnica..." 
                                        className="flex-1 bg-theme-input rounded-xl px-4 py-2 text-sm outline-none border border-theme-border text-theme-text-main"
                                        value={aiInput}
                                        onChange={(e) => setAiInput(e.target.value)}
                                    />
                                    <button type="submit" disabled={!aiInput.trim() || isAiLoading} className="bg-theme-accent-solid text-white p-2 rounded-xl">
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
             </div>
             
             {/* IMAGE PREVIEW MODAL */}
             {previewImage && (
                <div 
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <button 
                        className="absolute top-4 right-4 p-2 bg-theme-card rounded-full text-theme-text-muted hover:text-white hover:bg-theme-input transition"
                        onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                    >
                        <X size={32} />
                    </button>
                    <div className="relative max-w-[95vw] max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={previewImage} 
                            alt="Visualização em tela cheia" 
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
             )}

             {/* LUBRICATION REPORT MODAL */}
             {showLubricationReportModal && (
                 <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                     <div className="bg-white w-full max-w-3xl h-[90vh] overflow-y-auto rounded-lg shadow-2xl relative flex flex-col text-black font-sans">
                         {/* Toolbar */}
                         <div className="sticky top-0 bg-gray-100 p-4 border-b flex justify-between items-center print:hidden">
                             <h3 className="font-bold text-gray-800">Relatório de Lubrificação</h3>
                             <div className="flex gap-2">
                                 <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2">
                                     <Printer size={16} /> Imprimir
                                 </button>
                                 <button onClick={() => setShowLubricationReportModal(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-400">
                                     Fechar
                                 </button>
                             </div>
                         </div>

                         {/* Printable Content */}
                         <div className="p-8 md:p-12 print:p-0">
                             <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-center">
                                 <div className="flex items-center gap-4">
                                     <div className="w-16 h-16 bg-red-600 flex items-center justify-center text-white font-bold text-xs p-1">LOGO SENAI</div>
                                     <div>
                                         <h1 className="text-2xl font-bold uppercase tracking-tight">Histórico de Lubrificação</h1>
                                         <p className="text-sm font-medium text-gray-600">Manutenção Industrial - Célula 1.A</p>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-sm font-bold text-gray-400 uppercase">Patrimônio</div>
                                     <div className="text-xl font-bold text-black">{selectedMachine.id}</div>
                                 </div>
                             </div>

                             <div className="mb-8">
                                 <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border border-gray-200">
                                     <div>
                                         <span className="block text-xs font-bold text-gray-500 uppercase">Equipamento</span>
                                         <span className="text-lg font-bold text-black">{selectedMachine.name}</span>
                                     </div>
                                     <div>
                                         <span className="block text-xs font-bold text-gray-500 uppercase">Modelo</span>
                                         <span className="text-lg font-bold text-black">{selectedMachine.model}</span>
                                     </div>
                                 </div>
                             </div>

                             <table className="w-full text-left border-collapse border border-gray-300">
                                 <thead className="bg-gray-200 uppercase text-xs font-bold text-gray-700">
                                     <tr>
                                         <th className="p-3 border border-gray-300">Data / Hora</th>
                                         <th className="p-3 border border-gray-300">Responsável</th>
                                         <th className="p-3 border border-gray-300">Turma / Turno</th>
                                         <th className="p-3 border border-gray-300">Detalhes da Execução</th>
                                     </tr>
                                 </thead>
                                 <tbody className="text-sm text-gray-800">
                                     {machineLubricationHistory.map((log) => (
                                         <tr key={log.id}>
                                             <td className="p-3 border border-gray-300 whitespace-nowrap">
                                                 {new Date(log.timestamp).toLocaleDateString()} <br/>
                                                 <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                             </td>
                                             <td className="p-3 border border-gray-300">{log.user}</td>
                                             <td className="p-3 border border-gray-300">
                                                 {log.studentClass} <br/>
                                                 <span className="text-xs text-gray-500">{log.shift}</span>
                                             </td>
                                             <td className="p-3 border border-gray-300">
                                                 {log.details}
                                             </td>
                                         </tr>
                                     ))}
                                     {machineLubricationHistory.length === 0 && (
                                         <tr>
                                             <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                                                 Nenhum registro de lubrificação encontrado.
                                             </td>
                                         </tr>
                                     )}
                                 </tbody>
                             </table>

                             <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between text-xs text-gray-500 uppercase">
                                 <div>Emitido em: {new Date().toLocaleString()}</div>
                                 <div>Sistema de Gestão Célula 1.A</div>
                             </div>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
  }

  // 2. FOLDERS VIEW (UNCHANGED)
  return (
    <div className="space-y-6 animate-fade-in h-full relative">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 max-w-md ${
          toast.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' :
          toast.type === 'warning' ? 'bg-amber-950/95 border-amber-500/50 text-amber-200' :
          toast.type === 'error' ? 'bg-red-950/95 border-red-500/50 text-red-200' :
          'bg-slate-900/95 border-blue-500/50 text-blue-200'
        }`}>
          {toast.type === 'success' && <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle size={20} className="text-amber-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={20} className="text-red-400 shrink-0" />}
          {toast.type === 'info' && <Info size={20} className="text-blue-400 shrink-0" />}
          <span className="text-xs md:text-sm font-medium flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            {selectedFolder && (
                <button onClick={() => setSelectedFolder(null)} className="p-2 -ml-2 rounded-full hover:bg-theme-card text-theme-text-muted transition-colors">
                    <ArrowLeft size={24} />
                </button>
            )}
            <div>
                 <h2 className="text-3xl font-bold text-theme-text-main tracking-tight">
                    {selectedFolder ? selectedFolder : 'Área de Usinagem'}
                </h2>
                <p className="text-theme-text-muted font-medium ml-1 text-sm">
                    {selectedFolder ? `${machineGroups[selectedFolder].length} ativos` : 'Selecione uma categoria'}
                </p>
            </div>
        </div>
        {!selectedFolder ? (
            <button onClick={() => setIsFolderModalOpen(true)} className="bg-gradient-accent text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-glow flex items-center gap-2 hover:scale-105 transition">
                <Plus size={18} /> Nova Pasta
            </button>
        ) : (
             <button onClick={() => setIsMachineModalOpen(true)} className="bg-gradient-accent text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-glow flex items-center gap-2 hover:scale-105 transition">
                <Plus size={18} /> Adicionar {selectedFolder}
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 pb-12 pt-4">
        {/* FOLDERS */}
        {!selectedFolder && folders.map((folderName) => {
            const machinesInFolder = machineGroups[folderName];
            return (
                <div key={folderName} onClick={() => setSelectedFolder(folderName)} className="group cursor-pointer relative mt-6">
                    <div className="absolute -top-8 left-0 w-24 h-10 bg-theme-card group-hover:bg-theme-accent-solid transition-colors duration-300 rounded-t-2xl z-0 border-t border-l border-r border-theme-border"></div>
                    <div className="bg-theme-card group-hover:bg-theme-accent-solid transition-colors duration-300 rounded-b-[26px] rounded-tr-[26px] rounded-tl-none p-6 shadow-soft h-44 flex flex-col justify-between relative z-10 w-full border border-theme-border">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest text-theme-text-muted group-hover:text-white/80 mb-2">STATUS</div>
                            <div className="flex -space-x-2">
                                {machinesInFolder.slice(0, 4).map((m, i) => (
                                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-theme-card group-hover:border-theme-accent-solid flex items-center justify-center ${m.status === MachineStatus.OPERATIONAL ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest text-theme-text-muted group-hover:text-white/80 mb-1">CATEGORIA</div>
                            <h3 className="text-xl md:text-2xl font-bold text-theme-text-main group-hover:text-white leading-tight">{folderName}</h3>
                        </div>
                    </div>
                </div>
            );
        })}

        {/* ASSETS */}
        {selectedFolder && machineGroups[selectedFolder].map((machine) => (
             <div key={machine.id} onClick={() => setSelectedMachineId(machine.id)} className="group cursor-pointer">
                <div className="bg-theme-card rounded-[26px] p-6 shadow-soft border border-theme-border hover:border-theme-accent-solid/50 transition-all duration-300 h-full flex flex-col hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-theme-input px-3 py-1.5 rounded-lg border border-theme-border">
                            <div className="text-[10px] text-theme-text-muted font-bold uppercase tracking-wider">Patrimônio</div>
                            <div className="text-sm font-bold text-theme-text-main flex items-center gap-1"><Tag size={12} />{machine.id}</div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 ${getStatusColor(machine.status)}`}>
                            {getStatusIcon(machine.status)} {getStatusLabel(machine.status)}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-14 h-14 rounded-xl bg-theme-input overflow-hidden shrink-0 border border-theme-border">
                                <img src={machine.image} alt={machine.name} className="w-full h-full object-cover opacity-80" />
                             </div>
                             <div>
                                 <h3 className="font-bold text-theme-text-main text-sm">{machine.type}</h3>
                                 <p className="text-[10px] text-theme-text-muted line-clamp-2">{machine.model}</p>
                             </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-theme-border flex gap-2">
                        <div className="flex-1 bg-theme-input text-theme-text-muted py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">Ver Detalhes</div>
                    </div>
                </div>
             </div>
        ))}
      </div>

      {/* MODALS */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-theme-card rounded-[24px] shadow-2xl w-full max-w-md border border-theme-border overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-theme-border bg-theme-sidebar/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-theme-text-main">Nova Pasta de Máquinas</h3>
                    <button onClick={() => setIsFolderModalOpen(false)} className="text-theme-text-muted hover:text-white"><X size={20}/></button>
                </div>
                <form onSubmit={handleCreateFolder} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">Nome da Categoria</label>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Ex: Tornos CNC, Centros de Usinagem..." 
                            className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-sm text-theme-text-main outline-none focus:border-theme-accent-solid"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="pt-4 border-t border-theme-border">
                        <p className="text-xs text-theme-text-muted mb-3 italic">Adicione a primeira máquina desta pasta:</p>
                        <div className="space-y-3">
                             <div>
                                <input type="text" placeholder="Código Patrimônio (ID)" className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-sm text-theme-text-main outline-none" value={newMachineData.id} onChange={(e) => setNewMachineData({...newMachineData, id: e.target.value})} required />
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="Tipo (Ex: Torno)" className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-sm text-theme-text-main outline-none" value={newMachineData.type} onChange={(e) => setNewMachineData({...newMachineData, type: e.target.value})} required />
                                <input type="text" placeholder="Modelo" className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-sm text-theme-text-main outline-none" value={newMachineData.model} onChange={(e) => setNewMachineData({...newMachineData, model: e.target.value})} required />
                             </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-3 bg-gradient-accent text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition shadow-glow mt-2 flex items-center justify-center gap-2">
                        <Plus size={16} /> Criar Pasta
                    </button>
                </form>
            </div>
        </div>
      )}

      {isMachineModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-theme-card rounded-[24px] shadow-2xl w-full max-w-md border border-theme-border overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-theme-border bg-theme-sidebar/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-theme-text-main">Adicionar em <span className="text-theme-accent-solid">{selectedFolder}</span></h3>
                    <button onClick={() => setIsMachineModalOpen(false)} className="text-theme-text-muted hover:text-white"><X size={20}/></button>
                </div>
                <form onSubmit={handleAddMachineToFolder} className="p-6 space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">Código Patrimônio</label>
                        <input type="text" className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-sm text-theme-text-main outline-none focus:border-theme-accent-solid" value={newMachineData.id} onChange={(e) => setNewMachineData({...newMachineData, id: e.target.value})} required />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">Tipo de Máquina</label>
                        <input type="text" className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-sm text-theme-text-main outline-none" value={newMachineData.type} onChange={(e) => setNewMachineData({...newMachineData, type: e.target.value})} required />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">Modelo</label>
                            <input type="text" className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-sm text-theme-text-main outline-none" value={newMachineData.model} onChange={(e) => setNewMachineData({...newMachineData, model: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">Série (Opcional)</label>
                            <input type="text" className="w-full bg-theme-input border border-theme-border rounded-xl p-3 text-sm text-theme-text-main outline-none" value={newMachineData.serial} onChange={(e) => setNewMachineData({...newMachineData, serial: e.target.value})} />
                        </div>
                     </div>

                    <button type="submit" className="w-full py-3 bg-gradient-accent text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition shadow-glow mt-4 flex items-center justify-center gap-2">
                        <Save size={16} /> Salvar Máquina
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default MachineList;
