import React, { useState, useRef, useEffect } from 'react';
import { Machine, MachineStatus, MaintenanceLog, Notification } from '../types';
import { 
  Zap, Shield, Search, X, Bell, Bot, Map, Maximize2, Minimize2, Tag, 
  CheckCircle2, AlertCircle, Power, AlertTriangle, Settings, Edit, Plus, Grip, MousePointer2, Layout,
  ZoomIn, ZoomOut, RotateCcw, Wrench, Hammer, Save, Info, Trash2, Droplets, ArrowRight, ShieldCheck
} from 'lucide-react';

interface DashboardProps {
  machines: Machine[];
  logs: MaintenanceLog[]; 
  notifications: Notification[];
  onMachineSelect: (id: string) => void;
  onOpenAI: () => void;
  onNavigate: (view: string) => void;
  onOpenLubrication?: (mode: 'semanal' | 'semestral' | 'hub') => void;
  onMarkAsRead: (id: string) => void;
  onClearNotifications: () => void;
}

interface MachineNodeProps {
  machine?: Machine;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  onSelect: (id: string) => void;
  // Edit props
  isEditing?: boolean;
  onDelete?: () => void;
  style?: React.CSSProperties;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

const MachineNode: React.FC<MachineNodeProps> = ({ machine, size = 'md', label = '', onSelect, isEditing, onDelete, style, onMouseDown, onTouchStart }) => {
    // If no machine data is passed (e.g. generic added item), render a placeholder
    if (!machine) return (
        <div 
            style={style}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className={`
                absolute bg-theme-input/20 border-2 border-dashed border-theme-border rounded flex items-center justify-center text-xs text-theme-text-muted 
                ${size === 'lg' ? 'w-24 h-20' : size === 'md' ? 'w-16 h-14' : 'w-12 h-12'}
                ${isEditing ? 'cursor-move hover:border-theme-accent-solid hover:bg-theme-input/40 z-50' : ''}
            `}
        >
            {isEditing && onDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition z-50">
                    <X size={10} />
                </button>
            )}
            <span className="text-center">{label || 'Vazio'}</span>
        </div>
    );
    
    return (
      <div 
          style={style}
          onMouseDown={isEditing ? onMouseDown : undefined}
          onTouchStart={isEditing ? onTouchStart : undefined}
          onClick={!isEditing ? () => onSelect(machine.id) : undefined}
          className={`
              absolute bg-theme-card border border-theme-border transition-all shadow-soft
              flex flex-col items-center justify-center rounded-xl z-10
              ${size === 'lg' ? 'w-28 h-24' : size === 'md' ? 'w-20 h-16' : 'w-14 h-14'}
              ${isEditing 
                ? 'cursor-move hover:border-theme-accent-solid hover:shadow-glow z-50' 
                : 'cursor-pointer hover:-translate-y-1 hover:border-theme-accent-solid'
              }
          `}
      >
          {isEditing && onDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition z-50">
                    <X size={10} />
                </button>
          )}

          {/* Status Indicator */}
          <div className={`w-2 h-2 rounded-full absolute top-1.5 right-1.5 shadow-glow ${
              machine.status === MachineStatus.OPERATIONAL ? 'bg-emerald-500' : 
              machine.status === MachineStatus.MAINTENANCE ? 'bg-amber-500' : 'bg-theme-accent-danger'
          }`}></div>
          
          <div className="text-[10px] font-bold text-theme-text-muted uppercase mb-1 tracking-wider text-center px-1 truncate w-full pointer-events-none">{label || machine.name.split(' ')[0]}</div>
          <div className="font-mono text-[10px] text-theme-text-main font-bold bg-theme-input px-1.5 py-0.5 rounded border border-theme-border/50 pointer-events-none">
              {machine.id.length > 5 ? '...'+machine.id.slice(-4) : machine.id}
          </div>
          
          {/* Hover Details (Only in View Mode) */}
          {!isEditing && (
              <div className="absolute opacity-0 group-hover:opacity-100 -bottom-8 left-1/2 -translate-x-1/2 bg-theme-sidebar text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 border border-theme-border shadow-xl pointer-events-none transition-opacity">
                  {machine.model}
              </div>
          )}
      </div>
    );
};

// Types for Layout System
interface LayoutItem {
    uid: string; // Unique ID for layout tracking
    type: 'machine' | 'label' | 'zone';
    machineId?: string; // Links to actual machine data
    label?: string; // For labels like "Entrada"
    x: number;
    y: number;
    w?: number; // width override
    h?: number; // height override
    size: 'sm' | 'md' | 'lg';
}

const Dashboard: React.FC<DashboardProps> = ({ 
  machines, 
  logs, 
  notifications, 
  onMachineSelect, 
  onOpenAI, 
  onNavigate, 
  onOpenLubrication,
  onMarkAsRead, 
  onClearNotifications 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // EDIT MODE STATES
  const [isEditMode, setIsEditMode] = useState(false);
  const [layoutItems, setLayoutItems] = useState<LayoutItem[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Refs for Drag/Pan math
  const dragStartRef = useRef({ x: 0, y: 0 });
  const itemStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
            setIsNotifOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Layout Positions
  useEffect(() => {
    const initialItems: LayoutItem[] = [
        // Left Column
        { uid: 'ret-1', type: 'machine', machineId: 'RT-001', label: 'RETÍFICA', x: 50, y: 50, size: 'md' },
        { uid: 'fur-1', type: 'machine', machineId: '1081579', label: 'FURADEIRA', x: 50, y: 130, size: 'sm' },
        { uid: 'fur-2', type: 'machine', machineId: '1081578', label: 'FURADEIRA', x: 50, y: 190, size: 'sm' },
        
        // Mid-Left Column (Aligned)
        { uid: 'ser-col-1', type: 'machine', machineId: '463285', label: 'SERRA', x: 176, y: 224, size: 'md' }, // left-44 = 176px. Adjusted Y for stack
        { uid: 'ser-col-2', type: 'machine', machineId: 'ES-001', label: 'ESMERIL', x: 176, y: 272, size: 'md' }, 

        // Center Stack - Fresas
        { uid: 'fre-1', type: 'machine', machineId: '1085926', label: 'FRESAS', x: 384, y: 16, size: 'md' }, // Center X
        { uid: 'fre-2', type: 'machine', machineId: '837073', label: 'FRESAS', x: 474, y: 16, size: 'md' },
        { uid: 'fre-3', type: 'machine', machineId: '837074', label: 'FRESAS', x: 564, y: 16, size: 'md' },

        // Center Stack - Bancadas
        { uid: 'ban-1', type: 'machine', machineId: 'BD-001', label: 'BANCADA', x: 384, y: 90, w: 110, size: 'md' },
        { uid: 'ban-2', type: 'machine', machineId: 'BD-002', label: 'BANCADA', x: 504, y: 90, w: 110, size: 'md' },
        { uid: 'ban-3', type: 'machine', machineId: 'BD-003', label: 'BANCADA', x: 384, y: 150, w: 110, size: 'md' },
        { uid: 'ban-4', type: 'machine', machineId: 'BD-004', label: 'BANCADA', x: 504, y: 150, w: 110, size: 'md' },

        // Center Stack - Armário
        { uid: 'arm-1', type: 'label', label: 'ARMÁRIO DE FERRAMENTAS', x: 384, y: 220, w: 260, h: 50, size: 'lg' },

        // Center Stack - Tornos
        { uid: 'tor-1', type: 'machine', machineId: '465067', label: 'TORNO', x: 384, y: 290, size: 'sm' },
        { uid: 'tor-2', type: 'machine', machineId: '465059', label: 'TORNO', x: 444, y: 290, size: 'sm' },
        { uid: 'tor-3', type: 'machine', machineId: '779282', label: 'TORNO', x: 504, y: 290, size: 'sm' },
        { uid: 'tor-4', type: 'machine', machineId: '1124424', label: 'TORNO', x: 564, y: 290, size: 'sm' },
        { uid: 'tor-5', type: 'machine', machineId: '1124425', label: 'TORNO', x: 384, y: 360, size: 'sm' },
        { uid: 'tor-6', type: 'machine', machineId: '1124426', label: 'TORNO', x: 444, y: 360, size: 'sm' },
        { uid: 'tor-7', type: 'machine', machineId: '1124427', label: 'TORNO', x: 504, y: 360, size: 'sm' },
    ];
    setLayoutItems(initialItems);
  }, []);

  // --- ZOOM LOGIC ---
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleResetView = () => {
      setScale(1);
      setPan({ x: 0, y: 0 });
  };

  // --- DRAG LOGIC (ITEMS) ---
  const handleItemStart = (uid: string, clientX: number, clientY: number) => {
     setDragItem(uid);
     dragStartRef.current = { x: clientX, y: clientY };
     const item = layoutItems.find(i => i.uid === uid);
     if (item) {
         itemStartRef.current = { x: item.x, y: item.y };
     }
  };

  const handleItemMouseDown = (e: React.MouseEvent, uid: string) => {
    if (!isEditMode) return;
    e.stopPropagation(); 
    e.preventDefault();
    handleItemStart(uid, e.clientX, e.clientY);
  };

  const handleItemTouchStart = (e: React.TouchEvent, uid: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    handleItemStart(uid, e.touches[0].clientX, e.touches[0].clientY);
  };

  // --- PAN LOGIC (BACKGROUND) ---
  const handlePanStart = (clientX: number, clientY: number) => {
     setIsPanning(true);
     dragStartRef.current = { x: clientX, y: clientY };
     itemStartRef.current = { x: pan.x, y: pan.y };
  };

  const handlePanMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); 
    handlePanStart(e.clientX, e.clientY);
  };

  const handlePanTouchStart = (e: React.TouchEvent) => {
     handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  // --- GLOBAL MOUSE/TOUCH MOVE/UP ---
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
        if (dragItem) {
            const dx = (clientX - dragStartRef.current.x) / scale; 
            const dy = (clientY - dragStartRef.current.y) / scale;
            setLayoutItems(prev => prev.map(item => {
                if (item.uid === dragItem) {
                    return { ...item, x: itemStartRef.current.x + dx, y: itemStartRef.current.y + dy };
                }
                return item;
            }));
        } else if (isPanning) {
             const dx = clientX - dragStartRef.current.x;
             const dy = clientY - dragStartRef.current.y;
             setPan({ x: itemStartRef.current.x + dx, y: itemStartRef.current.y + dy });
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (dragItem || isPanning) {
            e.preventDefault();
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    const handleEnd = () => {
        setDragItem(null);
        setIsPanning(false);
    };

    if (dragItem || isPanning) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
    };
  }, [dragItem, isPanning, scale]);

  // --- EDIT ACTIONS ---
  const handleAddMachineFromModal = (machine: Machine) => {
    const newItem: LayoutItem = {
        uid: `mach-${Date.now()}`,
        type: 'machine',
        machineId: machine.id,
        label: machine.type.split(' ')[0].toUpperCase(),
        x: (425 - pan.x),
        y: (275 - pan.y),
        size: 'md'
    };
    setLayoutItems(prev => [...prev, newItem]);
    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (uid: string) => {
      setLayoutItems(prev => prev.filter(i => i.uid !== uid));
  };

  const placedMachineIds = new Set(layoutItems.map(i => i.machineId).filter(Boolean));
  
  // Find last maintenance log
  const recentLog = logs && logs.length > 0 ? logs[0] : null;

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter Logic
  const filteredMachines = searchTerm
    ? machines.filter(m => 
        m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.model.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getStatusIcon = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.OPERATIONAL: return <CheckCircle2 size={16} className="text-emerald-400" />;
      case MachineStatus.MAINTENANCE: return <Settings size={16} className="text-amber-400 animate-spin-slow" />;
      case MachineStatus.IDLE: return <Power size={16} className="text-gray-400" />;
      case MachineStatus.OFFLINE: return <AlertTriangle size={16} className="text-theme-accent-danger" />;
      default: return <AlertCircle size={16} className="text-blue-400" />;
    }
  };

  const getStatusLabel = (status: MachineStatus) => {
     switch (status) {
      case MachineStatus.OPERATIONAL: return 'OPERACIONAL';
      case MachineStatus.MAINTENANCE: return 'MANUTENÇÃO';
      case MachineStatus.IDLE: return 'PARADA';
      case MachineStatus.OFFLINE: return 'DESLIGADA';
      default: return status;
    }
  };

  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.OPERATIONAL: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case MachineStatus.MAINTENANCE: return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case MachineStatus.IDLE: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      case MachineStatus.OFFLINE: return 'bg-theme-accent-danger/10 text-theme-accent-danger border-theme-accent-danger/30';
      default: return 'bg-blue-500/10 text-blue-400';
    }
  };

  return (
    <div className="animate-fade-in font-sans pb-12">
      
      {/* Search Header & Bell */}
      <div className="flex justify-between items-center mb-8 pt-4 px-1">
        {/* Centered Search Bar */}
        <div className="relative w-full max-w-2xl transform transition-transform duration-300 mx-auto md:ml-0 md:mr-auto">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search size={20} className="text-theme-text-muted" />
            </div>
            <input 
                type="text" 
                placeholder="PESQUISAR PATRIMÔNIO / MÁQUINA..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-28 py-3 bg-theme-input/80 backdrop-blur-sm rounded-xl shadow-soft text-sm font-mono text-theme-text-main placeholder-theme-text-muted/70 outline-none focus:ring-1 focus:ring-theme-accent-solid border border-theme-border tracking-wide uppercase"
            />
            {searchTerm ? (
                 <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-theme-card text-theme-text-muted px-3 py-1.5 rounded-lg font-bold text-xs hover:text-white transition flex items-center gap-1 border border-theme-border uppercase tracking-wider"
                 >
                    <X size={14} /> Limpar
                </button>
            ) : (
                 <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-theme-accent-solid text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-glow hover:brightness-110 transition flex items-center gap-1 uppercase tracking-wider">
                    BUSCAR
                </button>
            )}
        </div>

        {/* Bell With Notification Dropdown */}
        <div className="hidden md:flex items-center gap-4 ml-6 relative" ref={notifRef}>
            <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-3 rounded-xl shadow-soft hover:bg-theme-cardHover transition relative group border ${isNotifOpen ? 'bg-theme-cardHover border-theme-accent-solid' : 'bg-theme-card border-theme-border'}`}
            >
                <Bell size={22} className={`text-theme-text-muted group-hover:text-white ${isNotifOpen ? 'text-white' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-theme-accent-danger rounded-full shadow-glow-red animate-pulse"></span>
                )}
            </button>

            {/* NOTIFICATION DROPDOWN */}
            {isNotifOpen && (
                <div className="absolute top-full right-0 mt-3 w-80 bg-theme-card border border-theme-border rounded-xl shadow-2xl z-[150] overflow-hidden animate-slide-up origin-top-right">
                    <div className="flex items-center justify-between p-4 bg-theme-sidebar/50 border-b border-theme-border">
                        <div className="flex items-center gap-2">
                             <Bell size={16} className="text-theme-accent-solid" />
                             <span className="font-bold text-sm text-theme-text-main uppercase">Notificações</span>
                             {unreadCount > 0 && <span className="bg-theme-accent-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                        </div>
                        {notifications.length > 0 && (
                            <button onClick={onClearNotifications} className="text-xs font-bold text-theme-text-muted hover:text-white hover:underline uppercase">
                                Limpar Tudo
                            </button>
                        )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto bg-theme-bg/30">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    onClick={() => onMarkAsRead(notif.id)}
                                    className={`p-4 border-b border-theme-border/50 hover:bg-theme-input/50 transition cursor-pointer flex gap-3 ${!notif.read ? 'bg-theme-input/20' : ''}`}
                                >
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                        notif.type === 'alert' ? 'bg-theme-accent-danger shadow-glow-red' : 
                                        notif.type === 'warning' ? 'bg-amber-500' :
                                        notif.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                                    }`}></div>
                                    <div>
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h4 className={`text-sm font-bold ${!notif.read ? 'text-theme-text-main' : 'text-theme-text-muted'}`}>{notif.title}</h4>
                                            <span className="text-[10px] text-theme-text-muted font-mono">{notif.timestamp}</span>
                                        </div>
                                        <p className="text-xs text-theme-text-muted leading-snug">{notif.message}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-theme-text-muted">
                                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-mono">Nenhuma notificação.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* CONDITIONAL CONTENT: SEARCH RESULTS OR DASHBOARD */}
      {searchTerm ? (
        <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-6 border-b border-theme-border pb-4">
                <h3 className="text-xl font-tech font-bold text-theme-text-main flex items-center gap-2 uppercase tracking-wide">
                    <Search size={20} className="text-theme-accent-solid" />
                    Resultados da Pesquisa
                </h3>
                <span className="text-xs font-mono font-bold text-theme-accent-solid bg-theme-accent-solid/10 px-3 py-1 rounded border border-theme-accent-solid/30">
                    {filteredMachines.length} ENCONTRADOS
                </span>
            </div>

            {filteredMachines.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMachines.map(machine => (
                        <div 
                            key={machine.id} 
                            onClick={() => onMachineSelect(machine.id)}
                            className="bg-theme-card rounded-xl p-6 shadow-soft border border-theme-border hover:border-theme-accent-solid/50 transition-all duration-300 flex flex-col hover:-translate-y-1 group cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/5 to-transparent -mr-4 -mt-4 rotate-45"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-theme-input px-3 py-1.5 rounded border border-theme-border group-hover:border-theme-accent-solid/30 transition-colors">
                                    <div className="text-[10px] text-theme-text-muted font-bold uppercase tracking-widest font-mono">PATRIMÔNIO</div>
                                    <div className="text-sm font-bold text-theme-text-main flex items-center gap-1.5 font-mono tracking-wide">
                                        <Tag size={12} />
                                        {machine.id}
                                    </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${getStatusColor(machine.status)}`}>
                                    {getStatusIcon(machine.status)}
                                    {getStatusLabel(machine.status)}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-theme-input overflow-hidden shrink-0 border border-theme-border relative">
                                        <div className="absolute inset-0 border border-white/5 pointer-events-none"></div>
                                        <img src={machine.image} alt={machine.name} className="w-full h-full object-cover opacity-80" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-theme-text-main text-sm uppercase tracking-wide font-tech">{machine.name}</h3>
                                        <p className="text-xs text-theme-text-muted line-clamp-2 leading-relaxed font-mono mt-1">
                                            {machine.model}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-theme-bg/30 p-2.5 rounded border border-theme-border/50">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-theme-text-muted font-bold uppercase">Manutenção</span>
                                        <span className="font-mono text-theme-text-main">{machine.lastMaintenance}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-theme-card rounded-xl border border-theme-border border-dashed">
                    <div className="w-16 h-16 bg-theme-input rounded-full flex items-center justify-center mx-auto mb-4 text-theme-text-muted">
                        <Search size={32} />
                    </div>
                    <h4 className="text-theme-text-main font-bold text-lg font-tech uppercase">Nenhum resultado</h4>
                    <p className="text-theme-text-muted text-sm mt-2 font-mono">Verifique o código de patrimônio.</p>
                </div>
            )}
        </div>
      ) : (
        <>
          {/* HERO BANNER */}
          <div className="w-full h-[350px] rounded-[24px] relative overflow-hidden shadow-2xl group mb-10 border border-theme-border bg-theme-bg">
            <div className="absolute inset-0">
                <img 
                    src="https://lh3.googleusercontent.com/d/1vkoUyrgtX6qWu0VG1V1apTa5w_i54El8" 
                    alt="Industrial Banner" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-40 grayscale-[20%]"
                />
                <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-theme-bg via-theme-bg/80 to-transparent"></div>
            </div>

            <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-4xl">
                <div className="flex items-center gap-3 mb-4 animate-slide-right">
                    <div className="w-10 h-10 bg-theme-accent-danger rounded-sm flex items-center justify-center shadow-glow-red border border-white/10 overflow-hidden">
                        <img src="https://lh3.googleusercontent.com/d/1L2mI54ppN63F77yrXlRhQXoaWMoDLjJc" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-theme-text-muted text-xs font-mono uppercase tracking-[0.2em]">SISTEMA DE GESTÃO</span>
                        <span className="text-white font-bold tracking-widest text-sm uppercase font-tech">
                            CÉLULA 1.A
                        </span>
                    </div>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-[0.9] tracking-tighter animate-slide-up font-tech uppercase">
                    SISTEMA DE<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-theme-accent-solid to-theme-accent-solid">OPERAÇÃO E MANUTENÇÃO</span>
                </h1>
                
                <p className="text-theme-text-muted text-sm md:text-base max-w-lg mb-8 leading-relaxed font-mono animate-slide-up delay-100 border-l-2 border-theme-accent-danger pl-4">
                    Monitoramento em tempo real, controle de ativos e manutenção preditiva assistida por IA.
                </p>
            </div>
            
            <div className="absolute bottom-6 right-6 flex flex-col items-end opacity-50">
                 <div className="text-xs font-mono text-theme-text-muted uppercase">STATUS DO SISTEMA</div>
                 <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    ONLINE
                 </div>
            </div>
          </div>

          {/* WIDGETS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-8">
                {/* Card 1: Operational Efficiency */}
                <div className="bg-theme-card p-6 rounded-2xl shadow-soft flex flex-col justify-between border border-theme-border hover:border-emerald-500/30 transition group cursor-pointer h-48 relative overflow-hidden">
                    <div className="absolute top-3 right-3 flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-theme-border rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-theme-border rounded-full"></div>
                    </div>
                    <div className="flex items-start justify-between relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                            <Zap size={24} />
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded border border-emerald-500/20 font-mono">OEE +2.4%</span>
                    </div>
                    <div className="relative z-10">
                        <h4 className="font-bold text-theme-text-main text-lg font-tech uppercase tracking-wide">Eficiência</h4>
                        <p className="text-theme-text-muted text-xs leading-relaxed mt-1 font-mono">
                            Meta atingida. OEE atual em <span className="text-emerald-400 font-bold">85%</span>.
                        </p>
                    </div>
                </div>

                {/* Card 2: Recent Maintenance (Replaces Team) */}
                <div onClick={() => onNavigate('prisma')} className="bg-theme-card p-6 rounded-2xl shadow-soft flex flex-col justify-between border border-theme-border hover:border-amber-500/30 transition group cursor-pointer h-48 relative overflow-hidden">
                    <div className="absolute top-3 right-3 flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-theme-border rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-theme-border rounded-full"></div>
                    </div>
                    <div className="flex items-start justify-between relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                            <Wrench size={24} />
                        </div>
                        <div className="flex -space-x-2">
                            {/* Visual indicator for log count */}
                            <div className="w-6 h-6 rounded-full bg-theme-accent-solid border-2 border-theme-card flex items-center justify-center text-[10px] font-bold text-white font-mono shadow-sm">
                                {logs.length}
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h4 className="font-bold text-theme-text-main text-lg font-tech uppercase tracking-wide">Manutenção</h4>
                        {recentLog ? (
                            <div className="text-theme-text-muted text-xs leading-relaxed mt-1 font-mono">
                                <p className="truncate font-bold text-amber-400 mb-0.5">{recentLog.machineName}</p>
                                <p className="truncate opacity-80">{recentLog.type} - {recentLog.status}</p>
                            </div>
                        ) : (
                            <p className="text-theme-text-muted text-xs leading-relaxed mt-1 font-mono">
                                Nenhuma ordem recente.
                            </p>
                        )}
                    </div>
                </div>

                {/* Card 3: Safety */}
                <div className="bg-theme-card p-6 rounded-2xl shadow-soft flex flex-col justify-between border border-theme-border hover:border-theme-accent-danger/30 transition group cursor-pointer h-48 relative overflow-hidden">
                     <div className="absolute top-3 right-3 flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-theme-border rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-theme-border rounded-full"></div>
                    </div>
                    <div className="flex items-start justify-between relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-theme-accent-danger/10 flex items-center justify-center text-theme-accent-danger border border-theme-accent-danger/20">
                            <Shield size={24} />
                        </div>
                        <span className="bg-theme-accent-danger/10 text-theme-accent-danger text-xs font-bold px-2 py-1 rounded border border-theme-accent-danger/20 font-mono">NR-12 OK</span>
                    </div>
                    <div className="relative z-10">
                        <h4 className="font-bold text-theme-text-main text-lg font-tech uppercase tracking-wide">Segurança</h4>
                        <p className="text-theme-text-muted text-xs leading-relaxed mt-1 font-mono">
                            Zero acidentes há <span className="text-theme-accent-solid font-bold">145 dias</span>.
                        </p>
                    </div>
                </div>

                {/* Card 4: AI Assistant */}
                <div onClick={onOpenAI} className="bg-theme-card p-6 rounded-2xl shadow-soft flex flex-col justify-between border border-theme-border hover:border-theme-accent-solid transition group cursor-pointer h-48 relative overflow-hidden">
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme-accent-solid opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-theme-accent-solid"></span>
                        </span>
                        <span className="text-[10px] font-bold text-theme-accent-solid uppercase">ONLINE</span>
                    </div>
                    <div className="flex items-start justify-between relative z-10">
                         <div className="w-12 h-12 rounded-xl bg-theme-accent-solid text-white flex items-center justify-center shadow-glow">
                            <Bot size={24} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h4 className="font-bold text-theme-text-main text-lg font-tech uppercase tracking-wide">Assistente IA</h4>
                        <p className="text-theme-text-muted text-xs leading-relaxed mt-1 font-mono">
                            Suporte técnico 24/7. Tire dúvidas sobre manutenção e operação.
                        </p>
                    </div>
                </div>
          </div>

          {/* CELL DIGITAL LAYOUT */}
          <div className={`
            transition-all duration-300 ease-in-out
            ${isExpanded 
                ? 'fixed inset-0 z-[100] bg-theme-bg p-8 overflow-auto' 
                : 'bg-theme-card p-6 md:p-8 rounded-2xl shadow-soft border border-theme-border relative overflow-hidden group mb-8'}
          `}>
             <div className="flex justify-between items-center mb-6 relative z-10 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-lg text-theme-text-main flex items-center gap-2 uppercase tracking-wide font-tech">
                        <Map size={20} className="text-theme-accent-solid" />
                        Layout Digital da Célula
                    </h3>

                    {/* ZOOM CONTROLS (INLINE) */}
                    <div className="flex items-center bg-theme-input rounded-lg border border-theme-border overflow-hidden ml-4">
                        <button onClick={handleZoomOut} className="p-1.5 hover:bg-theme-card text-theme-text-muted hover:text-white transition" title="Diminuir Zoom">
                            <ZoomOut size={16} />
                        </button>
                        <div className="w-px h-4 bg-theme-border"></div>
                        <button onClick={handleResetView} className="p-1.5 hover:bg-theme-card text-theme-text-muted hover:text-white transition" title="Resetar Visualização">
                            <RotateCcw size={16} />
                        </button>
                        <div className="w-px h-4 bg-theme-border"></div>
                        <button onClick={handleZoomIn} className="p-1.5 hover:bg-theme-card text-theme-text-muted hover:text-white transition" title="Aumentar Zoom">
                            <ZoomIn size={16} />
                        </button>
                    </div>
                    
                    {/* EDIT BUTTON */}
                    {!isEditMode && (
                        <button 
                            onClick={() => setIsEditMode(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-theme-accent-solid/30 bg-theme-accent-solid/10 text-xs font-bold text-theme-accent-solid hover:bg-theme-accent-solid hover:text-white transition uppercase tracking-wider ml-2"
                        >
                            <Edit size={14} /> Editar
                        </button>
                    )}
                </div>

                {/* HEADER CONTROLS */}
                <div className="flex items-center gap-2">
                    {/* EDIT TOOLBAR */}
                    {isEditMode && (
                        <div className="flex items-center gap-2 mr-4 bg-theme-input px-2 py-1 rounded-lg border border-theme-border">
                            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold uppercase transition">
                                <Plus size={14} /> Adicionar
                            </button>
                            <div className="w-px h-4 bg-theme-border"></div>
                            <span className="flex items-center gap-2 text-xs text-theme-text-muted px-2 cursor-help" title="Clique e arraste o fundo para mover o layout. Arraste as máquinas para reposicionar.">
                                <Grip size={14} /> Arrastar
                            </span>
                             <div className="w-px h-4 bg-theme-border"></div>
                            <button onClick={() => setIsEditMode(false)} className="flex items-center gap-1 px-3 py-1.5 rounded bg-theme-accent-solid text-white hover:scale-105 text-xs font-bold uppercase transition">
                                <Save size={14} /> Salvar
                            </button>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-theme-border bg-theme-input text-xs font-bold text-theme-text-muted hover:text-white hover:border-theme-accent-solid transition uppercase tracking-wider"
                    >
                        {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        {isExpanded ? 'MINIMIZAR' : 'EXPANDIR'}
                    </button>
                </div>
             </div>

             {/* Floor Plan Container */}
             <div 
                ref={containerRef}
                onMouseDown={handlePanMouseDown}
                onTouchStart={handlePanTouchStart}
                className={`
                    relative bg-theme-input/30 rounded-xl border border-theme-border/50 mx-auto overflow-hidden
                    ${isExpanded ? 'w-full h-[calc(100vh-150px)]' : 'w-full h-[550px]'}
                    ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}
                `}
             >
                 {isEditMode && (
                     <div className="absolute top-4 left-4 z-40 bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded border border-white/10 pointer-events-none flex items-center gap-2">
                         <MousePointer2 size={12} /> Modo de Edição Ativo
                     </div>
                 )}
                 {!isEditMode && !isExpanded && (
                      <div className="absolute top-4 left-4 z-40 text-theme-text-muted/50 text-xs pointer-events-none">
                         Arrastar para mover
                     </div>
                 )}

                {/* The scaling wrapper ensures the absolute layout stays intact but grows if expanded */}
                <div className={`
                    relative mx-auto transition-transform duration-200 ease-out origin-center
                    ${!isEditMode && isExpanded ? 'mt-24' : ''}
                `} style={{ 
                    width: '850px', 
                    height: '550px',
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` 
                }}>
                    
                    {/* Render Layout Items */}
                    {layoutItems.map(item => {
                        const style: React.CSSProperties = {
                            left: item.x,
                            top: item.y,
                            width: item.w,
                            height: item.h,
                            position: 'absolute'
                        };

                        if (item.type === 'label') {
                            return (
                                <div 
                                    key={item.uid}
                                    style={style}
                                    onMouseDown={(e) => isEditMode ? handleItemMouseDown(e, item.uid) : undefined}
                                    onTouchStart={(e) => isEditMode ? handleItemTouchStart(e, item.uid) : undefined}
                                    className={`
                                        border border-theme-border bg-theme-input/80 text-theme-text-muted text-xs font-bold px-4 py-2 rounded uppercase tracking-widest z-0 flex items-center justify-center text-center
                                        ${isEditMode ? 'cursor-move hover:border-theme-accent-solid z-50' : ''}
                                    `}
                                >
                                    {isEditMode && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.uid); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition z-50">
                                            <X size={10} />
                                        </button>
                                    )}
                                    {item.label}
                                </div>
                            );
                        }

                        // Default Machine Nodes
                        const machine = machines.find(m => m.id === item.machineId);
                        
                        // Render Machine Node
                        return (
                            <MachineNode 
                                key={item.uid}
                                machine={machine}
                                size={item.size}
                                label={item.label}
                                onSelect={onMachineSelect}
                                isEditing={isEditMode}
                                onDelete={() => handleDeleteItem(item.uid)}
                                style={style}
                                onMouseDown={(e) => handleItemMouseDown(e, item.uid)}
                                onTouchStart={(e) => handleItemTouchStart(e, item.uid)}
                            />
                        );
                    })}

                    {/* Floor Decorations (Legend) */}
                    <div className="absolute bottom-4 left-4 p-3 bg-theme-card border border-theme-border rounded-lg shadow-lg z-0 pointer-events-none">
                        <div className="text-[10px] font-bold text-theme-text-muted uppercase mb-2 border-b border-theme-border pb-1">Legenda</div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[10px] text-theme-text-muted"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> OPERACIONAL</div>
                            <div className="flex items-center gap-2 text-[10px] text-theme-text-muted"><div className="w-2 h-2 rounded-full bg-amber-500"></div> MANUTENÇÃO</div>
                            <div className="flex items-center gap-2 text-[10px] text-theme-text-muted"><div className="w-2 h-2 rounded-full bg-theme-accent-danger"></div> PARADA/DESL.</div>
                        </div>
                    </div>

                </div>
             </div>
          </div>

          {/* LUBRIFICAÇÃO DE MÁQUINAS SECTION */}
          <div className="mb-10 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-theme-border pb-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-theme-accent-danger/10 text-theme-accent-danger flex items-center justify-center border border-theme-accent-danger/20 shadow-glow-red">
                          <Droplets size={22} />
                      </div>
                      <div>
                          <div className="flex items-center gap-2">
                              <h3 className="font-bold text-xl text-theme-text-main uppercase tracking-wider font-tech">
                                  Lubrificação de Máquinas
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-theme-accent-danger/10 text-theme-accent-danger border border-theme-accent-danger/30 uppercase font-mono">
                                  Kone Standard
                              </span>
                          </div>
                          <p className="text-xs text-theme-text-muted font-mono mt-0.5">
                              Planos de manutenção preventiva periódica padronizados para a oficina mecânica
                          </p>
                      </div>
                  </div>
                  <button
                      onClick={() => onOpenLubrication ? onOpenLubrication('history') : onNavigate('maquinas')}
                      className="self-start sm:self-auto text-xs font-bold text-theme-accent-solid hover:text-white px-3 py-1.5 rounded-lg border border-theme-accent-solid/30 bg-theme-accent-solid/10 hover:bg-theme-accent-solid transition-all flex items-center gap-1.5 uppercase font-mono"
                  >
                      Ver Histórico e Relatórios <ArrowRight size={14} />
                  </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card 1: Semanal */}
                  <div className="bg-theme-card rounded-2xl border border-theme-border p-6 shadow-soft hover:border-theme-accent-solid/60 transition-all flex flex-col justify-between group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent-solid/5 rounded-bl-full pointer-events-none group-hover:bg-theme-accent-solid/10 transition-colors" />
                      
                      <div>
                          <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                  <span className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold font-mono text-xs">
                                      01
                                  </span>
                                  <div>
                                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">
                                          Periodicidade Semanal
                                      </span>
                                      <h4 className="font-bold text-lg text-theme-text-main uppercase font-tech">
                                          Lubrificação Semanal — Fresadora Kone
                                      </h4>
                                  </div>
                              </div>
                              <span className="text-xs font-bold px-2 py-1 rounded bg-theme-input text-theme-text-muted border border-theme-border uppercase font-mono shrink-0">
                                  8 Verificações
                              </span>
                          </div>

                          {/* Image preview & components */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 p-3 rounded-xl bg-theme-bg/60 border border-theme-border/60">
                              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-black border border-theme-border relative group/img">
                                  <img 
                                      src="/assets/aistudio/image_6db5b7dc.png" 
                                      alt="Reservatório Hidráulico Semanal" 
                                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute bottom-1 left-1 bg-black/80 backdrop-blur text-[9px] font-mono text-white px-1.5 py-0.5 rounded border border-white/10">
                                      Reservatório
                                  </div>
                              </div>
                              <div className="sm:col-span-2 flex flex-col justify-between text-xs space-y-1.5">
                                  <div className="text-[11px] text-theme-text-muted leading-relaxed">
                                      Inspeção do reservatório hidráulico, conferência do visor entre MIN e MAX, avaliação da coloração do fluido (âmbar clara) e engraxamento dos pinos por bombeamento.
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-theme-card border border-theme-border text-theme-text-muted font-mono">
                                          Nível MIN/MAX
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-theme-card border border-theme-border text-theme-text-muted font-mono">
                                          Cor do Fluido
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-theme-card border border-theme-border text-theme-text-muted font-mono">
                                          Pinos Graxeiros
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="pt-4 border-t border-theme-border/60 flex items-center justify-between gap-3">
                          <span className="text-xs text-theme-text-muted font-mono">
                              Validação obrigatória por turma
                          </span>
                          <button
                              onClick={() => {
                                  if (onOpenLubrication) onOpenLubrication('semanal');
                                  else onNavigate('maquinas');
                              }}
                              className="px-5 py-2.5 bg-theme-accent-solid hover:bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-glow transition-all hover:scale-105 flex items-center gap-2"
                          >
                              <Droplets size={16} /> Iniciar manutenção
                          </button>
                      </div>
                  </div>

                  {/* Card 2: Semestral */}
                  <div className="bg-theme-card rounded-2xl border border-theme-border p-6 shadow-soft hover:border-theme-accent-danger/60 transition-all flex flex-col justify-between group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent-danger/5 rounded-bl-full pointer-events-none group-hover:bg-theme-accent-danger/10 transition-colors" />
                      
                      <div>
                          <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                  <span className="w-9 h-9 rounded-xl bg-theme-accent-danger/10 text-theme-accent-danger border border-theme-accent-danger/20 flex items-center justify-center font-bold font-mono text-xs">
                                      02
                                  </span>
                                  <div>
                                      <span className="text-[10px] font-bold text-theme-accent-danger uppercase tracking-widest font-mono">
                                          Periodicidade Semestral
                                      </span>
                                      <h4 className="font-bold text-lg text-theme-text-main uppercase font-tech">
                                          Lubrificação Semestral — Fresadora Kone
                                      </h4>
                                  </div>
                              </div>
                              <span className="text-xs font-bold px-2 py-1 rounded bg-theme-input text-theme-text-muted border border-theme-border uppercase font-mono shrink-0">
                                  5 Verificações
                              </span>
                          </div>

                          {/* Image preview & components */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 p-3 rounded-xl bg-theme-bg/60 border border-theme-border/60">
                              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-black border border-theme-border relative group/img">
                                  <img 
                                      src="/assets/aistudio/image_6552fb35.png" 
                                      alt="Caixa de Avanços Semestral" 
                                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute bottom-1 left-1 bg-black/80 backdrop-blur text-[9px] font-mono text-white px-1.5 py-0.5 rounded border border-white/10">
                                      Caixa Avanço
                                  </div>
                              </div>
                              <div className="sm:col-span-2 flex flex-col justify-between text-xs space-y-1.5">
                                  <div className="text-[11px] text-theme-text-muted leading-relaxed">
                                      Revisão profunda da caixa de avanços, drenagem total do óleo usado, diagnóstico de contaminações/partículas e reabastecimento com <strong className="text-theme-text-main">Mobil DTE-26</strong>.
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-theme-card border border-theme-border text-theme-text-muted font-mono">
                                          Caixa de Avanços
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-theme-card border border-theme-border text-theme-text-muted font-mono">
                                          Drenagem Total
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-theme-accent-danger/10 border border-theme-accent-danger/30 text-theme-accent-danger font-mono font-bold">
                                          Mobil DTE-26
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="pt-4 border-t border-theme-border/60 flex items-center justify-between gap-3">
                          <span className="text-xs text-theme-text-muted font-mono">
                              Substituição de óleo crítico
                          </span>
                          <button
                              onClick={() => {
                                  if (onOpenLubrication) onOpenLubrication('semestral');
                                  else onNavigate('maquinas');
                              }}
                              className="px-5 py-2.5 bg-theme-accent-danger hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-glow-red transition-all hover:scale-105 flex items-center gap-2"
                          >
                              <Droplets size={16} /> Iniciar manutenção
                          </button>
                      </div>
                  </div>
              </div>
          </div>
        </>
      )}

      {/* ADD MACHINE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-theme-card rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col border border-theme-border shadow-2xl">
                <div className="p-6 border-b border-theme-border flex justify-between items-center bg-theme-sidebar/50 rounded-t-2xl">
                    <h3 className="text-lg font-bold text-theme-text-main flex items-center gap-2 uppercase tracking-wide">
                        <Layout size={20} className="text-theme-accent-solid" />
                        Adicionar Máquina ao Layout
                    </h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-theme-input rounded-full text-theme-text-muted transition">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-theme-bg/50">
                    {machines.map(machine => {
                        const isPlaced = placedMachineIds.has(machine.id);
                        return (
                            <button 
                                key={machine.id}
                                onClick={() => !isPlaced && handleAddMachineFromModal(machine)}
                                disabled={isPlaced}
                                className={`
                                    bg-theme-card p-4 rounded-xl border flex flex-col items-center text-center transition-all group relative
                                    ${isPlaced 
                                        ? 'opacity-50 grayscale border-theme-border cursor-not-allowed' 
                                        : 'border-theme-border hover:border-theme-accent-solid hover:shadow-glow cursor-pointer hover:-translate-y-1'
                                    }
                                `}
                            >
                                {isPlaced && (
                                    <div className="absolute top-2 right-2 bg-theme-input text-theme-text-muted text-[10px] font-bold px-2 py-0.5 rounded border border-theme-border">
                                        JÁ NO LAYOUT
                                    </div>
                                )}
                                <div className="w-12 h-12 rounded-lg bg-theme-input mb-3 overflow-hidden border border-theme-border">
                                    <img src={machine.image} alt={machine.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-xs font-bold text-theme-text-main uppercase font-tech">{machine.name}</div>
                                <div className="text-[10px] text-theme-text-muted font-mono mt-1">{machine.id}</div>
                            </button>
                        );
                    })}
                </div>
                
                <div className="p-4 border-t border-theme-border bg-theme-card rounded-b-2xl text-right">
                    <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-bold text-theme-text-muted hover:text-white transition">CANCELAR</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;