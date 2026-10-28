
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { Machine, MaintenanceLog, MachineStatus } from '../types';
import { Zap, Activity, ClipboardList, AlertTriangle, CheckCircle2, Search, Filter, ArrowRight, X, ListFilter, Clock, User, Wrench } from 'lucide-react';
import { ENERGY_CONSUMPTION } from '../constants';

interface IndustrialIndicatorsProps {
  machines: Machine[];
  logs: MaintenanceLog[];
  onUpdateLog?: (updatedLog: MaintenanceLog) => void;
}

const IndustrialIndicators: React.FC<IndustrialIndicatorsProps> = ({ machines, logs, onUpdateLog }) => {
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('Ativas');

  // Calculations
  const totalMachines = machines.length;
  const operationalMachines = machines.filter(m => m.status === MachineStatus.OPERATIONAL).length;
  const availabilityPercentage = totalMachines > 0 ? Math.round((operationalMachines / totalMachines) * 100) : 0;
  
  const getCellStatus = () => {
    if (availabilityPercentage === 100) return { label: 'Excelente', color: 'text-green-500' };
    if (availabilityPercentage >= 75) return { label: 'Bom', color: 'text-green-400' };
    if (availabilityPercentage >= 50) return { label: 'Atenção', color: 'text-amber-400' };
    return { label: 'Crítico', color: 'text-red-500' };
  };
  const cellStatus = getCellStatus();

  // Explicitly setting Green for Operational and Red for Maintenance
  const machineStatusData = [
    { 
      name: 'Operacional', 
      value: machines.filter(m => m.status === MachineStatus.OPERATIONAL || m.status === MachineStatus.IDLE).length, 
      color: '#22c55e' // Green-500
    },
    { 
      name: 'Manutenção', 
      value: machines.filter(m => m.status === MachineStatus.MAINTENANCE || m.status === MachineStatus.OFFLINE).length, 
      color: '#ef4444' // Red-500
    },
  ].filter(d => d.value > 0);

  const activeOrdersCount = logs.filter(l => l.status !== 'Concluída').length;
  
  // Filter logic for the modal
  const filteredOrders = logs.filter(l => {
    // 1. Search Term
    const matchesSearch = 
        l.machineName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        l.description.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        l.technician.toLowerCase().includes(orderSearchTerm.toLowerCase());

    // 2. Type Filter
    const matchesType = typeFilter === 'Todas' || l.type === typeFilter;

    // 3. Status Filter (Active vs All)
    const matchesStatus = statusFilter === 'Todas' 
        ? true 
        : (statusFilter === 'Ativas' ? l.status !== 'Concluída' : l.status === 'Concluída');

    return matchesSearch && matchesType && matchesStatus;
  });

  const activeOrdersList = logs.filter(l => l.status !== 'Concluída').slice(0, 5);

  const osByType = [
    { name: 'Preventiva', value: logs.filter(l => l.type === 'Preventiva').length, color: '#3b82f6' }, // Blue
    { name: 'Corretiva', value: logs.filter(l => l.type === 'Corretiva').length, color: '#ef4444' }, // Red
    { name: 'Preditiva', value: logs.filter(l => l.type === 'Preditiva').length, color: '#10b981' }, // Emerald
  ];

  const handleAdvanceStatus = (log: MaintenanceLog) => {
    const statusFlow: MaintenanceLog['status'][] = ['Aberta', 'Aprovada', 'Em Execução', 'Concluída'];
    const currentIndex = statusFlow.indexOf(log.status);
    if (currentIndex !== -1 && currentIndex < statusFlow.length - 1) {
        if (onUpdateLog) onUpdateLog({ ...log, status: statusFlow[currentIndex + 1] });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-6 relative">
      <div>
           <h2 className="text-2xl font-bold text-theme-text-main tracking-tight">Indicadores Industriais</h2>
           <p className="text-theme-text-muted font-medium text-xs">Dashboard Operacional da Célula 1.A</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards (Dark Theme) */}
        {[
            { title: 'Status da Célula', icon: <Activity size={16} className="text-blue-400" />, content: (
                <div className="flex-1 flex items-center gap-4">
                    <div className="w-20 h-20 relative flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={machineStatusData} innerRadius={20} outerRadius={35} paddingAngle={5} dataKey="value" stroke="none">
                                    {machineStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className={`text-[9px] font-bold uppercase ${cellStatus.color}`}>{cellStatus.label}</span></div>
                    </div>
                    {/* LEGEND */}
                    <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                             <div className="flex flex-col">
                                <span className="text-[10px] text-theme-text-muted font-bold uppercase">Operacional</span>
                                <span className="text-[9px] text-white font-mono">{machineStatusData.find(d => d.name === 'Operacional')?.value || 0} Ativos</span>
                             </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                             <div className="flex flex-col">
                                <span className="text-[10px] text-theme-text-muted font-bold uppercase">Manutenção</span>
                                <span className="text-[9px] text-white font-mono">{machineStatusData.find(d => d.name === 'Manutenção')?.value || 0} Parados</span>
                             </div>
                        </div>
                    </div>
                </div>
            )},
            { title: 'Disponibilidade', icon: <CheckCircle2 size={16} className="text-emerald-400" />, content: (
                <div className="relative mt-auto">
                     <div className="text-4xl font-bold text-theme-text-main tracking-tighter mb-1.5">{availabilityPercentage}<span className="text-xl text-theme-text-muted">%</span></div>
                    <div className="w-full bg-theme-input rounded-full h-1.5"><div className={`h-1.5 rounded-full ${availabilityPercentage > 80 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${availabilityPercentage}%` }}></div></div>
                </div>
            )},
            { 
              title: 'Ordens de Serviço', 
              icon: <ClipboardList size={16} className="text-purple-400" />, 
              isInteractive: true,
              content: (
                <div className="mt-auto">
                    <div className="flex items-baseline gap-1"><span className="text-4xl font-bold text-theme-text-main tracking-tighter">{logs.length}</span><span className="text-[10px] text-theme-text-muted font-bold uppercase">Total</span></div>
                    <div className="flex gap-2 mt-2"><div className="flex-1 bg-orange-500/10 rounded-lg p-1.5 text-center border border-orange-500/20"><div className="text-base font-bold text-orange-400">{activeOrdersCount}</div><div className="text-[9px] text-orange-400 uppercase">Ativas</div></div></div>
                </div>
            )},
            { title: 'Consumo Energia', icon: <Zap size={16} className="text-amber-400" />, content: (
                <div className="mt-auto">
                    <div className="text-3xl font-bold text-theme-text-main tracking-tighter mb-1">155 <span className="text-sm text-theme-text-muted font-normal">kW</span></div>
                    <div className="h-8 w-full opacity-50"><ResponsiveContainer width="100%" height="100%"><AreaChart data={ENERGY_CONSUMPTION}><Area type="monotone" dataKey="kwh" stroke="#F59E0B" fill="#FEF3C7" /></AreaChart></ResponsiveContainer></div>
                </div>
            )}
        ].map((card, idx) => (
            <div 
                key={idx} 
                onClick={() => card.isInteractive && setIsOrdersModalOpen(true)}
                className={`
                    bg-theme-card p-4 rounded-[20px] shadow-soft flex flex-col h-40 border border-theme-border transition
                    ${card.isInteractive ? 'cursor-pointer hover:border-theme-accent-solid hover:scale-[1.02] hover:shadow-glow group' : 'hover:border-theme-accent-solid/30'}
                `}
            >
                <div className="flex items-center justify-between text-theme-text-muted font-medium mb-1 text-xs">
                    <div className="flex items-center gap-2">{card.icon} {card.title}</div>
                    {card.isInteractive && <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-theme-accent-solid" />}
                </div>
                {card.content}
            </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-theme-card p-6 rounded-[24px] shadow-soft border border-theme-border">
            <h3 className="font-bold text-base text-theme-text-main flex items-center gap-2 mb-4"><Zap size={16} className="text-theme-text-muted" /> Histórico de Consumo</h3>
            <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ENERGY_CONSUMPTION} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs><linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3}/><stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/></linearGradient></defs>
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#C49CA2'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#C49CA2'}} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }} />
                        <Area type="monotone" dataKey="kwh" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorKwh)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-theme-card p-6 rounded-[24px] shadow-soft flex flex-col border border-theme-border">
            <h3 className="font-bold text-base text-theme-text-main mb-4 flex items-center gap-2"><Activity size={16} className="text-theme-text-muted" /> OS por Tipo</h3>
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="w-40 h-40 relative">
                     <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={osByType} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" cornerRadius={6} stroke="none">{osByType.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}/></PieChart></ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-2xl font-bold text-theme-text-main">{logs.length}</span><span className="text-[9px] text-theme-text-muted uppercase font-bold">Total</span></div>
                </div>
                <div className="space-y-3">
                    {osByType.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                            <div className="text-xs text-theme-text-muted font-medium min-w-[70px]">{item.name}</div>
                            <div className="text-xs font-bold text-theme-text-main bg-theme-input px-1.5 py-0.5 rounded-md">{Math.round((item.value / logs.length) * 100) || 0}%</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* ACTIVE ORDERS LIST (ON PAGE) */}
      <div className="bg-theme-card rounded-[24px] shadow-soft border border-theme-border overflow-hidden mt-6">
        <div className="p-5 border-b border-theme-border flex justify-between items-center bg-theme-sidebar/50">
            <h3 className="font-bold text-base text-theme-text-main flex items-center gap-2">
                <ListFilter size={18} className="text-theme-accent-solid" /> 
                Ordens de Serviço em Aberto
            </h3>
            <button onClick={() => setIsOrdersModalOpen(true)} className="text-xs font-bold text-theme-accent-solid hover:text-white hover:underline transition">
                Ver Gerenciador Completo
            </button>
        </div>
        <div className="divide-y divide-theme-border">
            {activeOrdersList.length > 0 ? activeOrdersList.map(log => (
                <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-theme-input/30 transition group">
                    <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg mt-1 ${
                            log.type === 'Corretiva' ? 'bg-red-500/10 text-red-400' : 
                            log.type === 'Preventiva' ? 'bg-blue-500/10 text-blue-400' : 
                            'bg-emerald-500/10 text-emerald-400'
                        }`}>
                            <Wrench size={16} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono text-theme-text-muted bg-theme-input px-1.5 rounded border border-theme-border">#{log.id.split('-')[1]}</span>
                                <span className="text-sm font-bold text-theme-text-main">{log.machineName}</span>
                            </div>
                            <p className="text-xs text-theme-text-muted line-clamp-1">{log.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                    log.type === 'Corretiva' ? 'border-red-500/30 text-red-400' : 'border-blue-500/30 text-blue-400'
                                }`}>
                                    {log.type}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-theme-text-muted">
                                    <Clock size={10} /> {log.date}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-theme-text-muted">
                                    <User size={10} /> {log.technician}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 self-end md:self-center pl-12 md:pl-0">
                         <div className="flex flex-col items-end min-w-[100px]">
                            <span className="text-[9px] font-bold uppercase text-theme-text-muted mb-1">Status Atual</span>
                            <span className="text-xs font-bold text-theme-text-main px-3 py-1 bg-theme-input rounded-lg border border-theme-border">{log.status}</span>
                         </div>
                         <button onClick={() => handleAdvanceStatus(log)} className="p-2 rounded-lg bg-theme-accent-solid text-white shadow-glow hover:scale-110 transition" title="Avançar Status">
                            <ArrowRight size={16} />
                         </button>
                    </div>
                </div>
            )) : (
                <div className="p-8 text-center text-theme-text-muted text-sm italic">
                    Nenhuma ordem ativa no momento.
                </div>
            )}
        </div>
      </div>

      {/* ACTIVE ORDERS MODAL (FULL MANAGER) */}
      {isOrdersModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-theme-card rounded-[24px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-theme-border animate-slide-up">
                 <div className="p-6 border-b border-theme-border flex justify-between items-center bg-theme-sidebar/50 rounded-t-[24px]">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-500/20 p-2 rounded-lg text-purple-500"><ClipboardList size={20} /></div>
                        <div>
                            <h3 className="text-lg font-bold text-theme-text-main uppercase tracking-wide">Gestão de Ordens</h3>
                            <p className="text-xs text-theme-text-muted">Visualização detalhada</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOrdersModalOpen(false)} className="p-2 hover:bg-theme-input rounded-full text-theme-text-muted transition">
                        <X size={20} />
                    </button>
                 </div>

                 {/* Filters Bar */}
                 <div className="p-4 bg-theme-bg/30 border-b border-theme-border flex flex-col md:flex-row items-center gap-4">
                     <div className="relative flex-1 w-full">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
                        <input 
                            type="text" 
                            placeholder="Buscar ordem, máquina ou técnico..." 
                            value={orderSearchTerm}
                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                            className="bg-theme-input border border-theme-border rounded-lg pl-8 pr-3 py-2 text-xs focus:ring-1 focus:ring-theme-accent-solid outline-none w-full transition-all text-theme-text-main" 
                        />
                     </div>
                     <div className="flex gap-2 w-full md:w-auto">
                         <div className="relative">
                             <ListFilter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
                             <select 
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="bg-theme-input border border-theme-border rounded-lg pl-8 pr-8 py-2 text-xs text-theme-text-main outline-none appearance-none cursor-pointer hover:border-theme-accent-solid transition"
                             >
                                 <option value="Todas">Todos os Tipos</option>
                                 <option value="Corretiva">Corretiva</option>
                                 <option value="Preventiva">Preventiva</option>
                                 <option value="Preditiva">Preditiva</option>
                             </select>
                         </div>
                         <div className="relative">
                             <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
                             <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-theme-input border border-theme-border rounded-lg pl-8 pr-8 py-2 text-xs text-theme-text-main outline-none appearance-none cursor-pointer hover:border-theme-accent-solid transition"
                             >
                                 <option value="Todas">Todos os Status</option>
                                 <option value="Ativas">Apenas Ativas</option>
                                 <option value="Concluídas">Concluídas</option>
                             </select>
                         </div>
                     </div>
                 </div>

                 <div className="overflow-y-auto p-6">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-theme-card z-10">
                            <tr className="border-b border-theme-border">
                                <th className="pb-3 pl-3 text-[10px] font-bold text-theme-text-muted uppercase tracking-wider w-24">ID</th>
                                <th className="pb-3 text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">Tipo</th>
                                <th className="pb-3 text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">Máquina / Problema</th>
                                <th className="pb-3 text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">Técnico</th>
                                <th className="pb-3 text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">Status</th>
                                <th className="pb-3 text-[10px] font-bold text-theme-text-muted uppercase tracking-wider text-right pr-3">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border/50">
                            {filteredOrders.length > 0 ? filteredOrders.map(log => (
                                <tr key={log.id} className="group hover:bg-theme-input transition-colors">
                                    <td className="py-3 pl-3 font-bold text-theme-text-muted text-[11px]">#{log.id.split('-')[1]}</td>
                                    <td className="py-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                            log.type === 'Corretiva' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            log.type === 'Preventiva' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="py-3"><div className="font-bold text-theme-text-main text-xs">{log.machineName}</div><div className="text-[10px] text-theme-text-muted mt-0.5">{log.description}</div></td>
                                    <td className="py-3 text-xs text-theme-text-muted"><div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-theme-input text-theme-text-main flex items-center justify-center text-[9px] font-bold uppercase border border-theme-border">{log.technician.charAt(0)}</div>{log.technician}</div></td>
                                    <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${log.status === 'Concluída' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{log.status}</span></td>
                                    <td className="py-3 text-right pr-3">
                                        {log.status !== 'Concluída' && (
                                            <button onClick={() => handleAdvanceStatus(log)} className="text-theme-accent-solid hover:text-white hover:bg-theme-accent-solid text-[10px] font-bold border border-theme-accent-solid px-2 py-1 rounded-md bg-transparent transition flex items-center gap-1 ml-auto">
                                                Avançar <ArrowRight size={10} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-theme-text-muted text-xs italic">Nenhuma ordem encontrada com estes filtros.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default IndustrialIndicators;
