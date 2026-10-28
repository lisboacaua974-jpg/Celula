
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import MachineList from './components/MachineList';
import MaintenanceLogView from './components/MaintenanceLog';
import IndustrialIndicators from './components/IndustrialIndicators';
import RightPanel from './components/RightPanel';
import AIAssistant from './components/AIAssistant';
import Login from './components/Login'; 
import FresaSafetyQuestionnaire from './components/FresaSafetyQuestionnaire';
import FresaLubricationModule from './components/FresaLubricationModule';
import { INITIAL_MACHINES, INITIAL_LOGS, INITIAL_NOTIFICATIONS, INITIAL_REPORTS, INITIAL_OPERATIONAL_LOGS } from './constants';
import { MaintenanceLog, Machine, Notification, ReportEntry, OperationalLog, FresaSafetyInspection } from './types';
import { Search, Bot, X, Wrench, Sparkles, Tag, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('guest'); 
  const [userName, setUserName] = useState(''); 

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [currentView, setCurrentView] = useState('home');
  const [lubricationMode, setLubricationMode] = useState<'semanal' | 'semestral' | 'hub'>('hub');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logs, setLogs] = useState<MaintenanceLog[]>(INITIAL_LOGS);
  
  // Initialize Machines with LocalStorage persistence
  const [machines, setMachines] = useState<Machine[]>(() => {
    const savedMachines = localStorage.getItem('senai_machines');
    return savedMachines ? JSON.parse(savedMachines) : INITIAL_MACHINES;
  });

  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [reportHistory, setReportHistory] = useState<ReportEntry[]>(INITIAL_REPORTS);
  
  // Initialize Operational Logs with LocalStorage persistence
  const [operationalLogs, setOperationalLogs] = useState<OperationalLog[]>(() => {
    const savedLogs = localStorage.getItem('senai_operational_logs');
    return savedLogs ? JSON.parse(savedLogs) : INITIAL_OPERATIONAL_LOGS;
  });

  const [showAI, setShowAI] = useState(false);
  
  // Lifted state for machine navigation
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);

  // Global Header Search
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Apply Theme to HTML Body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist Machines (e.g. Operating Hours, Status)
  useEffect(() => {
    localStorage.setItem('senai_machines', JSON.stringify(machines));
  }, [machines]);

  // Persist Operational Logs (History)
  useEffect(() => {
    localStorage.setItem('senai_operational_logs', JSON.stringify(operationalLogs));
  }, [operationalLogs]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (role: string, name: string) => {
    setUserRole(role);
    setUserName(name);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('guest');
    setUserName('');
    setCurrentView('home');
    setSelectedMachineId(null);
    
    // RESET SAFETY CHECKS ON LOGOUT
    // This locks all machines, requiring the safety questionnaire to be filled out again upon next login.
    setMachines(prevMachines => prevMachines.map(m => ({
      ...m,
      safetyCheckCompleted: false
    })));
  };

  const handleAddLog = (newLog: MaintenanceLog) => {
    setLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateLog = (updatedLog: MaintenanceLog) => {
    setLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
  };

  const handleDeleteLog = (logId: string) => {
    setLogs(prev => prev.filter(log => log.id !== logId));
  };

  const handleAddReport = (report: ReportEntry) => {
    setReportHistory(prev => [report, ...prev]);
  };

  const handleAddOperationalLog = (log: OperationalLog) => {
    setOperationalLogs(prev => [log, ...prev]);
  };

  const handleMachineSelect = (id: string) => {
    setSelectedMachineId(id);
    setCurrentView('maquinas');
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    // Reset selection if navigating to the list view via menu
    if (view === 'maquinas') {
      setSelectedMachineId(null);
    }
    if (view === 'lubrificacao') {
      setLubricationMode('hub');
    }
  };

  const handleOpenLubrication = (mode: 'semanal' | 'semestral' | 'hub') => {
    setLubricationMode(mode);
    setCurrentView('lubrificacao');
  };

  // Notification Handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
            <Dashboard 
                machines={machines} 
                logs={logs} 
                notifications={notifications}
                onMachineSelect={handleMachineSelect} 
                onOpenAI={() => setShowAI(true)} 
                onNavigate={handleViewChange}
                onOpenLubrication={handleOpenLubrication}
                onMarkAsRead={handleMarkAsRead}
                onClearNotifications={handleClearNotifications}
            />
        );
      case 'indicadores':
         return <IndustrialIndicators machines={machines} logs={logs} onUpdateLog={handleUpdateLog} />;
      case 'maquinas':
        return (
          <MachineList 
            machines={machines} 
            setMachines={setMachines} 
            selectedMachineId={selectedMachineId}
            setSelectedMachineId={setSelectedMachineId}
            onAddOperationalLog={handleAddOperationalLog}
            operationalLogs={operationalLogs}
            currentUser={userName}
            userRole={userRole}
            onNavigate={handleViewChange}
            onOpenLubrication={handleOpenLubrication}
          />
        );
      case 'prisma':
        return (
            <MaintenanceLogView 
                logs={logs} 
                machines={machines} 
                currentUser={userName}
                onAddLog={handleAddLog} 
                onUpdateLog={handleUpdateLog}
                onDeleteLog={handleDeleteLog}
                onAddReport={handleAddReport}
            />
        );
      case 'fresa-safety':
        return (
          <FresaSafetyQuestionnaire 
            machines={machines}
            currentUser={userName}
            userRole={userRole}
            onAddOperationalLog={handleAddOperationalLog}
            onUnlockMachine={(machId) => {
              setMachines(prev => prev.map(m => m.id === machId ? { ...m, safetyCheckCompleted: true } : m));
            }}
          />
        );
      case 'lubrificacao':
        return (
          <FresaLubricationModule 
            machines={machines}
            currentUser={userName}
            userRole={userRole}
            initialType={lubricationMode}
            onAddOperationalLog={handleAddOperationalLog}
            onNavigate={handleViewChange}
          />
        );
      default:
        return (
            <Dashboard 
                machines={machines} 
                logs={logs} 
                notifications={notifications}
                onMachineSelect={handleMachineSelect} 
                onOpenAI={() => setShowAI(true)} 
                onNavigate={handleViewChange}
                onOpenLubrication={handleOpenLubrication}
                onMarkAsRead={handleMarkAsRead}
                onClearNotifications={handleClearNotifications}
            />
        );
    }
  };

  // Search results for global header search
  const filteredSearchMachines = globalSearch.trim()
    ? machines.filter(m => 
        m.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        m.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
        m.type.toLowerCase().includes(globalSearch.toLowerCase()) ||
        m.model.toLowerCase().includes(globalSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredSearchLogs = globalSearch.trim()
    ? logs.filter(l => 
        l.machineName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        l.description.toLowerCase().includes(globalSearch.toLowerCase()) ||
        l.technician.toLowerCase().includes(globalSearch.toLowerCase()) ||
        l.id.toLowerCase().includes(globalSearch.toLowerCase())
      ).slice(0, 3)
    : [];

  const getMobileTitle = () => {
    switch (currentView) {
      case 'home': return 'Visão Geral';
      case 'indicadores': return 'Indicadores Industriais';
      case 'maquinas': return selectedMachineId ? 'Detalhes do Ativo' : 'Parque de Máquinas';
      case 'fresa-safety': return 'Checklist Fresa';
      case 'lubrificacao': return 'Lubrificação de Máquinas';
      case 'prisma': return 'Gestão de Manutenção';
      default: return 'Célula 1.A';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-transparent selection:bg-theme-accent-solid selection:text-white transition-colors duration-300">
      <Navbar 
        currentView={currentView} 
        setCurrentView={handleViewChange}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        userName={userName}
        userRole={userRole}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Main Header (Hidden on Home to match custom design) */}
        {currentView !== 'home' && (
            <header className="px-6 md:px-8 py-5 flex items-center justify-between shrink-0 gap-4 border-b border-theme-border/40">
                {/* Search Bar with Autocomplete Dropdown */}
                <div className="relative w-full max-w-xl">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-theme-text-muted" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Buscar ativo, patrimônio, tipo ou ordem..." 
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            className="w-full pl-11 pr-10 py-2.5 bg-theme-input rounded-xl text-sm font-medium text-theme-text-main placeholder-theme-text-muted/60 outline-none focus:ring-1 focus:ring-theme-accent-solid shadow-soft transition-all border border-theme-border"
                        />
                        {globalSearch && (
                            <button 
                                onClick={() => setGlobalSearch('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-text-muted hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Search Suggestions Dropdown */}
                    {globalSearch.trim().length > 0 && isSearchFocused && (
                        <div 
                            className="absolute top-full left-0 right-0 mt-2 bg-theme-card border border-theme-border rounded-2xl shadow-2xl z-[150] overflow-hidden max-h-96 overflow-y-auto animate-slide-up"
                            onMouseDown={(e) => e.preventDefault()} // Prevents blur before click
                        >
                            {filteredSearchMachines.length === 0 && filteredSearchLogs.length === 0 ? (
                                <div className="p-4 text-center text-xs text-theme-text-muted font-mono">
                                    Nenhum resultado para "{globalSearch}".
                                </div>
                            ) : (
                                <>
                                    {filteredSearchMachines.length > 0 && (
                                        <div className="p-2">
                                            <div className="text-[10px] font-bold text-theme-text-muted uppercase px-3 py-1">Máquinas & Ativos</div>
                                            {filteredSearchMachines.map(m => (
                                                <div 
                                                    key={m.id}
                                                    onClick={() => {
                                                        handleMachineSelect(m.id);
                                                        setGlobalSearch('');
                                                        setIsSearchFocused(false);
                                                    }}
                                                    className="p-2.5 rounded-xl hover:bg-theme-input transition cursor-pointer flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-theme-input border border-theme-border overflow-hidden shrink-0">
                                                            <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-theme-text-main group-hover:text-theme-accent-solid transition">
                                                                {m.name}
                                                            </div>
                                                            <div className="text-[10px] text-theme-text-muted font-mono">
                                                                PAT: {m.id} • {m.type}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-theme-accent-solid opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                                                        Abrir <ChevronRight size={12} />
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {filteredSearchLogs.length > 0 && (
                                        <div className="p-2 border-t border-theme-border/50">
                                            <div className="text-[10px] font-bold text-theme-text-muted uppercase px-3 py-1">Ordens de Serviço</div>
                                            {filteredSearchLogs.map(l => (
                                                <div 
                                                    key={l.id}
                                                    onClick={() => {
                                                        handleViewChange('prisma');
                                                        setGlobalSearch('');
                                                        setIsSearchFocused(false);
                                                    }}
                                                    className="p-2.5 rounded-xl hover:bg-theme-input transition cursor-pointer flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Wrench size={14} className="text-amber-400 shrink-0" />
                                                        <div className="truncate">
                                                            <div className="text-xs font-bold text-theme-text-main truncate">{l.machineName}</div>
                                                            <div className="text-[10px] text-theme-text-muted truncate">{l.description}</div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-input text-theme-text-muted shrink-0">
                                                        {l.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Right controls: AI Quick Button & Mobile Title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAI(true)}
                        className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-theme-accent-solid/10 hover:bg-theme-accent-solid text-theme-accent-solid hover:text-white border border-theme-accent-solid/30 text-xs font-bold uppercase tracking-wider transition shadow-sm"
                    >
                        <Sparkles size={14} />
                        <span>Assistente IA</span>
                    </button>
                    <div className="md:hidden font-bold text-theme-text-main text-sm font-tech uppercase tracking-wide truncate">
                        {getMobileTitle()}
                    </div>
                </div>
            </header>
        )}

        {/* Scrollable Content Grid */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pb-8 flex gap-8 scroll-container ${currentView === 'home' ? 'pt-8' : 'pt-6'}`}>
            {/* Center Column - Expand on Home */}
            <div className={`flex-1 w-full mx-auto transition-all duration-300 ${currentView === 'home' ? 'max-w-full pr-4' : 'max-w-7xl'}`}>
                {renderContent()}
            </div>

            {/* Right Panel - Hidden on Home View and smaller screens */}
            {currentView !== 'home' && (
                <div className="hidden xl:block w-80 shrink-0 sticky top-0 h-fit pb-8">
                    <RightPanel 
                        machines={machines}
                        logs={logs}
                        operationalLogs={operationalLogs}
                        notifications={notifications}
                        onOpenAI={() => setShowAI(true)}
                        onNavigate={handleViewChange}
                        onSelectMachine={handleMachineSelect}
                        userName={userName}
                        userRole={userRole}
                    />
                </div>
            )}
        </div>

        {/* AI Assistant Floating Button (Mobile) */}
        <button 
          onClick={() => setShowAI(!showAI)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-accent text-white p-4 rounded-full shadow-glow hover:scale-110 transition-transform md:hidden flex items-center justify-center"
          title="Abrir Assistente Técnico IA"
        >
          <Bot size={24} />
        </button>

        {/* AI Modal for Mobile/Desktop */}
        {showAI && (
           <div 
             className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
             onClick={() => setShowAI(false)}
           >
              <div 
                className="w-full max-w-xl h-[640px] bg-theme-card rounded-3xl overflow-hidden relative shadow-2xl border border-theme-border flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                 <button 
                   onClick={() => setShowAI(false)} 
                   className="absolute top-4 right-4 z-20 p-2 bg-theme-input/80 hover:bg-theme-input rounded-full text-theme-text-muted hover:text-white transition"
                 >
                   ✕
                 </button>
                 <AIAssistant />
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default App;
