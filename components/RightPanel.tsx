import React, { useState } from 'react';
import { Machine, MaintenanceLog, OperationalLog, Notification, MachineStatus } from '../types';
import { 
  Bell, Bot, Wrench, Shield, CheckCircle2, AlertTriangle, Clock, 
  ExternalLink, ChevronRight, Activity, Zap, Sparkles, Filter, ShieldCheck
} from 'lucide-react';

interface RightPanelProps {
  className?: string;
  machines?: Machine[];
  logs?: MaintenanceLog[];
  operationalLogs?: OperationalLog[];
  notifications?: Notification[];
  onOpenAI?: () => void;
  onNavigate?: (view: string) => void;
  onSelectMachine?: (id: string) => void;
  userName?: string;
  userRole?: string;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
  className = '',
  machines = [],
  logs = [],
  operationalLogs = [],
  notifications = [],
  onOpenAI,
  onNavigate,
  onSelectMachine,
  userName,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'activity'>('status');

  // Quick stats
  const totalMachines = machines.length;
  const operationalCount = machines.filter(m => m.status === MachineStatus.OPERATIONAL).length;
  const maintenanceCount = machines.filter(m => m.status === MachineStatus.MAINTENANCE || m.status === MachineStatus.OFFLINE).length;
  const lockedCount = machines.filter(m => !m.safetyCheckCompleted && m.name !== 'Bancadas Didáticas').length;
  const activeOrders = logs.filter(l => l.status !== 'Concluída');

  // Shift calculation
  const getShift = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return { name: 'Turno Manhã', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (hour >= 12 && hour < 18) return { name: 'Turno Tarde', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return { name: 'Turno Noite', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
  };

  const currentShift = getShift();

  // Recent 5 logs
  const recentActivity = operationalLogs.slice(0, 5);

  return (
    <aside className={`flex flex-col h-full space-y-4 ${className}`}>
      
      {/* Top Shift & AI Quick Card */}
      <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-soft">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-theme-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-theme-text-main uppercase font-tech tracking-wider">Célula 1.A</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${currentShift.color}`}>
            {currentShift.name}
          </span>
        </div>

        {/* Quick Cell Summary */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-theme-input/70 p-2.5 rounded-xl border border-theme-border/60">
            <div className="text-[10px] text-theme-text-muted font-bold uppercase tracking-wider">Ativas</div>
            <div className="text-lg font-bold text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 size={16} />
              {operationalCount}/{totalMachines}
            </div>
          </div>
          <div className="bg-theme-input/70 p-2.5 rounded-xl border border-theme-border/60">
            <div className="text-[10px] text-theme-text-muted font-bold uppercase tracking-wider">O.S. Abertas</div>
            <div className="text-lg font-bold text-amber-400 font-mono flex items-center gap-1.5 mt-0.5">
              <Wrench size={16} />
              {activeOrders.length}
            </div>
          </div>
        </div>

        {/* Safety Lock Badge */}
        {lockedCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2 text-amber-400">
              <Shield size={16} />
              <span className="font-bold text-[11px]">{lockedCount} pendente(s) de liberação</span>
            </div>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('maquinas')} 
                className="text-[10px] font-bold text-amber-300 underline hover:text-white"
              >
                Liberar
              </button>
            )}
          </div>
        )}

        {/* AI Assistant Quick Trigger */}
        <button
          onClick={onOpenAI}
          className="w-full bg-gradient-accent hover:brightness-110 text-white p-3 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-glow transition group"
        >
          <Sparkles size={16} className="text-amber-200 group-hover:rotate-12 transition-transform" />
          <span>Assistente IA Técnico</span>
        </button>

        {/* Fresa Safety Questionnaire Quick Action */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('fresa-safety')}
            className="w-full mt-2 bg-theme-input hover:bg-theme-input/80 border border-theme-border text-theme-text-main p-2.5 rounded-xl font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 hover:border-theme-accent-solid/50 transition group"
          >
            <ShieldCheck size={15} className="text-theme-accent-solid group-hover:scale-110 transition-transform" />
            <span>Checklist Fresa NR-12</span>
          </button>
        )}
      </div>

      {/* Tabs: Status vs Activity */}
      <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-soft flex-1 flex flex-col min-h-0">
        <div className="flex bg-theme-input p-1 rounded-xl border border-theme-border mb-3 shrink-0">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition ${
              activeTab === 'status' 
                ? 'bg-theme-card text-theme-text-main shadow-sm' 
                : 'text-theme-text-muted hover:text-white'
            }`}
          >
            Equipamentos
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition ${
              activeTab === 'activity' 
                ? 'bg-theme-card text-theme-text-main shadow-sm' 
                : 'text-theme-text-muted hover:text-white'
            }`}
          >
            Histórico ({operationalLogs.length})
          </button>
        </div>

        {/* Tab 1: Equipment List */}
        {activeTab === 'status' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scroll-container">
            {machines.length === 0 ? (
              <p className="text-xs text-theme-text-muted text-center py-6 font-mono">Nenhum equipamento cadastrado.</p>
            ) : (
              machines.map(m => {
                const isOp = m.status === MachineStatus.OPERATIONAL;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (onSelectMachine) onSelectMachine(m.id);
                      if (onNavigate) onNavigate('maquinas');
                    }}
                    className="p-2.5 rounded-xl bg-theme-input/50 hover:bg-theme-input border border-theme-border/60 hover:border-theme-accent-solid/40 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isOp ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <div className="truncate">
                        <div className="text-xs font-bold text-theme-text-main group-hover:text-theme-accent-solid transition truncate">
                          {m.name}
                        </div>
                        <div className="text-[10px] text-theme-text-muted font-mono truncate">
                          Pat: {m.id} • {m.operatingHours || 0}h
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-theme-text-muted group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Activity List */}
        {activeTab === 'activity' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scroll-container">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-theme-text-muted">
                <Clock size={20} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-mono">Nenhum registro recente.</p>
              </div>
            ) : (
              recentActivity.map(act => (
                <div 
                  key={act.id} 
                  className="p-2.5 rounded-xl bg-theme-input/50 border border-theme-border/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`font-bold px-1.5 py-0.5 rounded ${
                      act.type === 'Segurança' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      act.type === 'Lubrificação' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                      'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    }`}>
                      {act.type}
                    </span>
                    <span className="text-theme-text-muted font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-theme-text-main text-[11px] leading-snug truncate">
                    {act.details || 'Ação operacional registrada.'}
                  </p>
                  <div className="text-[10px] text-theme-text-muted font-mono flex items-center justify-between">
                    <span>{act.user}</span>
                    {act.shift && <span>{act.shift}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Quick Navigation Footer */}
        <div className="pt-3 mt-3 border-t border-theme-border/60 grid grid-cols-2 gap-2 shrink-0">
          <button
            onClick={() => onNavigate && onNavigate('indicadores')}
            className="px-2.5 py-2 rounded-lg bg-theme-input hover:bg-theme-card border border-theme-border text-center text-[10px] font-bold uppercase tracking-wider text-theme-text-muted hover:text-white transition"
          >
            Indicadores
          </button>
          <button
            onClick={() => onNavigate && onNavigate('prisma')}
            className="px-2.5 py-2 rounded-lg bg-theme-input hover:bg-theme-card border border-theme-border text-center text-[10px] font-bold uppercase tracking-wider text-theme-text-muted hover:text-white transition"
          >
            Gestão O.S.
          </button>
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;