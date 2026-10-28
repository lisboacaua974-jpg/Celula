
import React, { useState, useEffect } from 'react';
import { MaintenanceLog, Machine, ReportEntry } from '../types';
import { 
  Plus, Search, Filter, Calendar, ChevronDown, MoreHorizontal, 
  Edit2, Trash2, CheckCircle2, Clock, AlertCircle, User, X, Save,
  RefreshCcw, PlayCircle, ThumbsUp, ArrowRight, ArrowRightCircle, Eye,
  FileText, Download, Printer, PieChart, BarChart, ListFilter, History
} from 'lucide-react';

interface MaintenanceLogProps {
  logs: MaintenanceLog[];
  machines: Machine[];
  currentUser: string;
  onAddLog: (log: MaintenanceLog) => void;
  onUpdateLog?: (updatedLog: MaintenanceLog) => void;
  onDeleteLog?: (logId: string) => void;
  onAddReport: (report: ReportEntry) => void;
}

const MaintenanceLogView: React.FC<MaintenanceLogProps> = ({ logs, machines, currentUser, onAddLog, onUpdateLog, onDeleteLog, onAddReport }) => {
  const [showForm, setShowForm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); // General Report
  const [printLog, setPrintLog] = useState<MaintenanceLog | null>(null); // Individual OS Report
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  const [formData, setFormData] = useState<Partial<MaintenanceLog>>({
    type: 'Corretiva',
    status: 'Aberta',
    technician: ''
  });

  const resetForm = () => {
    setFormData({ type: 'Corretiva', status: 'Aberta', technician: '' });
    setShowForm(false);
  };

  const filteredLogs = logs.filter(log => {
    return (log.machineName.toLowerCase().includes(searchTerm.toLowerCase()) || log.technician.toLowerCase().includes(searchTerm.toLowerCase())) &&
           (statusFilter ? log.status === statusFilter : true) &&
           (typeFilter ? log.type === typeFilter : true);
  });

  // Report Calculations (General)
  const totalReport = filteredLogs.length;
  const concludedReport = filteredLogs.filter(l => l.status === 'Concluída').length;
  const openReport = totalReport - concludedReport;
  const byTypeReport = {
      preventiva: filteredLogs.filter(l => l.type === 'Preventiva').length,
      corretiva: filteredLogs.filter(l => l.type === 'Corretiva').length,
      preditiva: filteredLogs.filter(l => l.type === 'Preditiva').length
  };

  const handleExportCSV = () => {
    const headers = "ID,Máquina,Tipo,Data,Técnico,Status,Descrição\n";
    const rows = filteredLogs.map(log => 
        `${log.id},"${log.machineName}",${log.type},${log.date},"${log.technician}",${log.status},"${log.description.replace(/"/g, '""')}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_manutencao_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.machineId && formData.description && formData.type) {
      const machine = machines.find(m => m.id === formData.machineId);
      const logEntry: MaintenanceLog = {
        id: `L-${Date.now()}`,
        machineId: formData.machineId,
        machineName: machine ? machine.name : 'Desconhecida',
        type: formData.type as any,
        description: formData.description,
        date: formData.date || new Date().toISOString().split('T')[0],
        technician: formData.technician || 'Não atribuído',
        status: formData.status || 'Aberta'
      };
      onAddLog(logEntry);
      resetForm();
    }
  };

  const handleAdvanceStatus = (e: React.MouseEvent, log: MaintenanceLog) => {
    e.preventDefault();
    e.stopPropagation();
    const statusFlow: MaintenanceLog['status'][] = ['Aberta', 'Aprovada', 'Em Execução', 'Concluída'];
    const currentIndex = statusFlow.indexOf(log.status);
    if (currentIndex !== -1 && currentIndex < statusFlow.length - 1) {
        if (onUpdateLog) onUpdateLog({ ...log, status: statusFlow[currentIndex + 1] });
    }
  };

  const handleReopenClick = (e: React.MouseEvent, log: MaintenanceLog) => {
    e.preventDefault();
    e.stopPropagation();
    if (onUpdateLog) onUpdateLog({ ...log, status: 'Aberta' });
  };

  const handlePrintClick = (e: React.MouseEvent, log: MaintenanceLog) => {
      e.preventDefault();
      e.stopPropagation();
      setPrintLog(log);
  };

  const handleConfirmPrint = () => {
      if (printLog) {
          const newReport: ReportEntry = {
              id: `R-${Date.now()}`,
              logId: printLog.id,
              machineName: printLog.machineName,
              generatedAt: new Date().toISOString(),
              generatedBy: currentUser || 'Desconhecido'
          };
          onAddReport(newReport);
          window.print();
      }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12 relative">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-3xl font-bold text-theme-text-main tracking-tight">GESTÃO DE MANUTENÇÃO</h2>
          <div className="flex items-center gap-2">
            <p className="text-theme-text-muted font-medium">Controle de Ativos e Ordens</p>
            <span className="text-[10px] bg-theme-input px-2 py-0.5 rounded border border-theme-border text-theme-text-muted/70 font-mono flex items-center gap-1">
               Powered by <span className="font-bold text-theme-accent-solid">PRISMA</span>
            </span>
          </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setShowReportModal(true)} 
                className="px-4 py-3 rounded-2xl text-xs font-bold transition shadow-soft flex items-center gap-2 bg-theme-input text-theme-text-muted hover:text-white hover:bg-theme-card border border-theme-border"
            >
                <FileText size={16} /> Relatório Geral
            </button>
            <button 
                onClick={() => setShowForm(!showForm)} 
                className={`px-6 py-3 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 ${showForm ? 'bg-theme-input text-theme-text-muted' : 'bg-gradient-accent text-white hover:scale-105'}`}
            >
                {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancelar' : 'Nova Solicitação'}
            </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-theme-card p-8 rounded-[30px] shadow-soft animate-slide-down border border-theme-border mb-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">Máquina</label>
              <select className="w-full bg-theme-input border border-theme-border rounded-2xl p-4 text-theme-text-main outline-none" required value={formData.machineId || ''} onChange={(e) => setFormData({...formData, machineId: e.target.value})}>
                    <option value="">Selecione...</option>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">Técnico</label>
              <input type="text" className="w-full bg-theme-input border border-theme-border rounded-2xl p-4 text-theme-text-main outline-none" value={formData.technician || ''} onChange={(e) => setFormData({...formData, technician: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2">Descrição</label>
              <textarea className="w-full bg-theme-input border border-theme-border rounded-2xl p-4 text-theme-text-main outline-none h-32 resize-none" required value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
            </div>
            <button type="submit" className="col-span-2 px-8 py-3 bg-gradient-accent text-white rounded-xl font-bold shadow-glow flex items-center gap-2 justify-center"><Save size={18} /> Salvar Registro</button>
          </form>
        </div>
      )}

      <div className="bg-theme-card rounded-[24px] shadow-soft overflow-hidden border border-theme-border">
        <div className="bg-theme-sidebar px-6 py-4 flex justify-between items-center text-white border-b border-theme-border">
            <h3 className="font-bold text-sm md:text-base tracking-wide">Registros de Manutenção</h3>
            <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">Total: {filteredLogs.length}</div>
        </div>

        <div className="p-5 bg-theme-card border-b border-theme-border flex gap-4 items-center">
            <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted" size={18} />
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-theme-input pl-12 pr-4 py-3 rounded-[16px] text-sm font-medium outline-none text-theme-text-main border border-theme-border focus:border-theme-accent-solid" />
            </div>
            {(statusFilter || typeFilter) && <button onClick={() => { setStatusFilter(''); setTypeFilter(''); }} className="px-3 py-2.5 rounded-xl border border-red-500/50 text-red-400 text-xs font-bold hover:bg-red-500/10">Limpar</button>}
        </div>

        <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse text-theme-text-main">
                <thead>
                    <tr className="border-b border-theme-border bg-theme-sidebar/50">
                        <th className="py-4 pl-6 text-[10px] font-bold text-theme-text-muted uppercase">ID</th>
                        <th className="py-4 px-4 text-[10px] font-bold text-theme-text-muted uppercase">Máquina / Descrição</th>
                        <th className="py-4 px-4 text-[10px] font-bold text-theme-text-muted uppercase">Status</th>
                        <th className="py-4 px-4 text-right text-[10px] font-bold text-theme-text-muted uppercase">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                    {filteredLogs.map((log) => (
                        <tr key={log.id} className="group hover:bg-theme-input/50 transition-colors">
                            <td className="py-4 pl-6 text-xs font-bold text-theme-text-muted">#{log.id.split('-')[1]}</td>
                            <td className="py-4 px-4"><div className="font-bold text-sm">{log.machineName}</div><div className="text-[10px] text-theme-text-muted opacity-80">{log.description}</div></td>
                            <td className="py-4 px-4"><span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase border border-theme-border bg-theme-input text-theme-text-muted">{log.status}</span></td>
                            <td className="py-4 px-4 text-right flex justify-end gap-2">
                                <button onClick={() => setSelectedLog(log)} className="text-theme-text-muted hover:text-white p-1.5" title="Ver Detalhes"><Eye size={16} /></button>
                                <button onClick={(e) => handlePrintClick(e, log)} className="text-theme-text-muted hover:text-white p-1.5" title="Imprimir OS"><Printer size={16} /></button>
                                {log.status !== 'Concluída' ? (
                                    <button onClick={(e) => handleAdvanceStatus(e, log)} className="text-theme-accent-solid text-[10px] font-bold border border-theme-accent-solid px-3 py-1.5 rounded-lg hover:bg-theme-accent-solid hover:text-white transition flex items-center gap-1">Avançar <ArrowRight size={12} /></button>
                                ) : (
                                    <button onClick={(e) => handleReopenClick(e, log)} className="text-emerald-400 text-[10px] font-bold border border-emerald-500 px-3 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition flex items-center gap-1">Reabrir</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-theme-card rounded-[30px] w-full max-w-lg p-8 border border-theme-border shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-theme-text-main">Detalhes da OS #{selectedLog.id}</h3>
                    <div className="px-3 py-1 rounded-full border border-theme-border bg-theme-input text-xs font-bold text-theme-text-muted">{selectedLog.status}</div>
                </div>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <div className="text-xs font-bold text-theme-text-muted uppercase">Equipamento</div>
                        <div className="text-sm font-medium text-theme-text-main">{selectedLog.machineName}</div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-theme-text-muted uppercase">Tipo de Manutenção</div>
                        <div className="text-sm font-medium text-theme-text-main">{selectedLog.type}</div>
                    </div>
                     <div>
                        <div className="text-xs font-bold text-theme-text-muted uppercase">Técnico Responsável</div>
                        <div className="text-sm font-medium text-theme-text-main">{selectedLog.technician}</div>
                    </div>
                    <div className="bg-theme-input p-4 rounded-xl border border-theme-border">
                        <div className="text-xs font-bold text-theme-text-muted uppercase mb-1">Descrição do Serviço</div>
                        <p className="text-sm text-theme-text-main leading-relaxed">{selectedLog.description}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setPrintLog(selectedLog)} className="flex-1 bg-theme-accent-solid text-white py-3 rounded-xl border border-transparent shadow-glow hover:scale-[1.02] transition font-bold text-sm uppercase flex items-center justify-center gap-2">
                        <Printer size={16} /> Imprimir OS
                    </button>
                    <button onClick={() => setSelectedLog(null)} className="flex-1 bg-theme-input text-theme-text-main py-3 rounded-xl border border-theme-border hover:bg-theme-cardHover transition font-bold text-sm uppercase">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* INDIVIDUAL OS REPORT MODAL (PRINT PREVIEW) */}
      {printLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
            <div className="bg-white w-full max-w-2xl h-[90vh] overflow-y-auto rounded-lg shadow-2xl relative flex flex-col">
                {/* Print Toolbar */}
                <div className="sticky top-0 bg-gray-100 p-4 border-b flex justify-between items-center print:hidden">
                    <h3 className="font-bold text-gray-800">Visualização de Impressão</h3>
                    <div className="flex gap-2">
                         <button onClick={handleConfirmPrint} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2">
                             <Printer size={16} /> Imprimir & Salvar
                         </button>
                         <button onClick={() => setPrintLog(null)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-400">
                             Fechar
                         </button>
                    </div>
                </div>

                {/* Printable Content (A4 style) */}
                <div className="p-8 md:p-12 text-black bg-white font-sans print:p-0">
                    {/* Header */}
                    <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-red-600 flex items-center justify-center text-white font-bold text-xs p-1">LOGO SENAI</div>
                            <div>
                                <h1 className="text-2xl font-bold uppercase tracking-tight">Ordem de Serviço</h1>
                                <p className="text-sm font-medium text-gray-600">Manutenção Industrial - Célula 1.A</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-3xl font-bold text-gray-400">#{printLog.id.split('-')[1]}</div>
                             <div className="text-xs font-bold uppercase mt-1 px-2 py-1 bg-gray-200 inline-block rounded">{printLog.status}</div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Equipamento</label>
                            <div className="text-lg font-bold border-b border-gray-200 pb-1">{printLog.machineName}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tipo de Manutenção</label>
                            <div className="text-lg font-bold border-b border-gray-200 pb-1">{printLog.type}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Data de Abertura</label>
                            <div className="text-base font-medium border-b border-gray-200 pb-1">{printLog.date}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Técnico Responsável</label>
                            <div className="text-base font-medium border-b border-gray-200 pb-1">{printLog.technician}</div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Descrição da Solicitação / Problema</label>
                        <div className="w-full h-32 border border-gray-300 rounded p-4 text-sm leading-relaxed bg-gray-50">
                            {printLog.description}
                        </div>
                    </div>

                    <div className="mb-12">
                         <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Observações Técnicas / Peças Utilizadas</label>
                         <div className="w-full h-32 border border-gray-300 rounded border-dashed bg-transparent p-4 text-sm text-gray-400 italic">
                             (Espaço reservado para preenchimento manual do técnico)
                         </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-gray-200">
                        <div className="text-center">
                            <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                            <div className="text-xs font-bold uppercase">Assinatura do Técnico</div>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                            <div className="text-xs font-bold uppercase">Assinatura do Supervisor</div>
                        </div>
                    </div>

                    <div className="mt-12 text-center text-[10px] text-gray-400 uppercase">
                        Documento gerado digitalmente pelo Sistema de Gestão Célula 1.A em {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* REPORT MODAL (GENERAL) */}
      {showReportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-theme-card rounded-[24px] w-full max-w-2xl border border-theme-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                 {/* Modal Header */}
                 <div className="p-6 border-b border-theme-border bg-theme-sidebar/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><FileText size={20} /></div>
                        <div>
                            <h3 className="text-lg font-bold text-theme-text-main uppercase tracking-wide">Relatório Gerencial</h3>
                            <p className="text-xs text-theme-text-muted">Resumo da visualização atual</p>
                        </div>
                    </div>
                    <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-theme-input rounded-full text-theme-text-muted transition">
                        <X size={20} />
                    </button>
                 </div>

                 {/* Report Content */}
                 <div className="p-8 overflow-y-auto bg-theme-bg/50">
                    <div className="bg-theme-card border border-theme-border p-8 rounded-xl shadow-sm mb-6">
                         <div className="flex justify-between items-start mb-8 border-b border-theme-border/50 pb-6">
                             <div>
                                 <h1 className="text-2xl font-bold text-theme-text-main font-tech uppercase">Relatório de Manutenção</h1>
                                 <p className="text-[10px] text-theme-text-muted font-mono mt-0.5">Sistema PRISMA</p>
                                 <p className="text-xs text-theme-text-muted mt-2 font-mono">Gerado em: {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}</p>
                             </div>
                             <div className="text-right">
                                 <div className="text-xs font-bold text-theme-text-muted uppercase">Período / Filtro</div>
                                 <div className="text-sm font-bold text-theme-accent-solid">{filteredLogs.length} Registros Encontrados</div>
                             </div>
                         </div>

                         {/* Stats Grid */}
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                             <div className="bg-theme-input p-4 rounded-xl border border-theme-border text-center">
                                 <div className="text-3xl font-bold text-theme-text-main">{totalReport}</div>
                                 <div className="text-[9px] font-bold text-theme-text-muted uppercase mt-1">Total de Ordens</div>
                             </div>
                             <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 text-center">
                                 <div className="text-3xl font-bold text-green-500">{concludedReport}</div>
                                 <div className="text-[9px] font-bold text-green-400/70 uppercase mt-1">Concluídas</div>
                             </div>
                             <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-center">
                                 <div className="text-3xl font-bold text-blue-500">{openReport}</div>
                                 <div className="text-[9px] font-bold text-blue-400/70 uppercase mt-1">Em Aberto</div>
                             </div>
                             <div className="bg-theme-input p-4 rounded-xl border border-theme-border text-center flex flex-col justify-center">
                                 <div className="text-xs text-theme-text-muted mb-1">Preventivas: <span className="text-theme-text-main font-bold">{byTypeReport.preventiva}</span></div>
                                 <div className="text-xs text-theme-text-muted">Corretivas: <span className="text-theme-text-main font-bold">{byTypeReport.corretiva}</span></div>
                             </div>
                         </div>

                         {/* Simple Table Preview */}
                         <div>
                             <h4 className="text-xs font-bold text-theme-text-muted uppercase mb-3 flex items-center gap-2"><ListFilter size={12}/> Últimos Registros (Amostra)</h4>
                             <div className="border border-theme-border rounded-lg overflow-hidden">
                                 <table className="w-full text-left text-[10px]">
                                     <thead className="bg-theme-input text-theme-text-muted uppercase font-bold">
                                         <tr>
                                             <th className="p-2">Data</th>
                                             <th className="p-2">Máquina</th>
                                             <th className="p-2">Tipo</th>
                                             <th className="p-2 text-right">Status</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-theme-border text-theme-text-main">
                                         {filteredLogs.slice(0, 5).map(l => (
                                             <tr key={l.id}>
                                                 <td className="p-2 font-mono text-theme-text-muted">{l.date}</td>
                                                 <td className="p-2 font-bold">{l.machineName}</td>
                                                 <td className="p-2">{l.type}</td>
                                                 <td className="p-2 text-right">{l.status}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                                 {filteredLogs.length > 5 && (
                                     <div className="p-2 text-center text-[9px] text-theme-text-muted bg-theme-input/30 font-mono">
                                         ... e mais {filteredLogs.length - 5} registros.
                                     </div>
                                 )}
                             </div>
                         </div>
                    </div>
                 </div>

                 {/* Footer Actions */}
                 <div className="p-6 border-t border-theme-border bg-theme-card flex justify-end gap-3">
                     <button onClick={() => window.print()} className="px-5 py-3 rounded-xl border border-theme-border text-theme-text-muted hover:text-white hover:bg-theme-input transition text-xs font-bold uppercase flex items-center gap-2">
                         <Printer size={16} /> Imprimir Resumo
                     </button>
                     <button onClick={handleExportCSV} className="px-5 py-3 rounded-xl bg-theme-accent-solid text-white shadow-glow hover:scale-105 transition text-xs font-bold uppercase flex items-center gap-2">
                         <Download size={16} /> Baixar CSV
                     </button>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceLogView;
