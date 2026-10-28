import React, { useState } from 'react';
import { Home, BarChart2, HardDrive, Box, LogOut, Menu, Activity, User, X, Mail, BadgeCheck, Building2, Fingerprint, Sun, Moon, ShieldCheck, Droplets } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, isMobileMenuOpen, setIsMobileMenuOpen, userName = 'Usuário', userRole = 'Visitante', onLogout, theme = 'dark', toggleTheme }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'VISÃO GERAL', icon: <Home size={20} /> },
    { id: 'indicadores', label: 'INDICADORES', icon: <BarChart2 size={20} /> },
    { id: 'maquinas', label: 'MÁQUINAS', icon: <HardDrive size={20} /> },
    { id: 'fresa-safety', label: 'CHECKLIST FRESA', icon: <ShieldCheck size={20} /> },
    { id: 'lubrificacao', label: 'LUBRIFICAÇÃO', icon: <Droplets size={20} /> },
    { id: 'prisma', label: 'GESTÃO', icon: <Box size={20} /> },
  ];

  const getRoleLabel = () => {
    switch(userRole) {
        case 'admin': return 'Docente';
        case 'student': return 'Aluno';
        case 'tech': return 'Técnico';
        default: return userRole;
    }
  };

  const getEmailSimulated = () => {
    if (userRole === 'student') return 'aluno.125@aluno.senai.br';
    if (userRole === 'admin') return 'docente.senai@sp.senai.br';
    return 'tecnico.manutencao@sp.senai.br';
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-theme-sidebar/95 backdrop-blur-md sticky top-0 z-50 border-b border-theme-border">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-theme-accent-danger rounded flex items-center justify-center text-white shadow-glow-red overflow-hidden">
                <img src="https://lh3.googleusercontent.com/d/1L2mI54ppN63F77yrXlRhQXoaWMoDLjJc" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <span className="font-bold text-theme-text-main font-tech tracking-wide uppercase">Célula 1.A</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-theme-text-main hover:bg-theme-card rounded border border-transparent hover:border-theme-border transition">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
        md:relative md:translate-x-0 transition-all duration-300 ease-in-out
        w-20 lg:w-48 z-40 flex flex-col items-center lg:items-stretch
        py-6 bg-theme-sidebar 
        md:h-[calc(100vh-3rem)] md:my-6 md:ml-6 md:rounded-lg md:border md:border-theme-border md:shadow-soft
        h-screen border-r border-theme-border/20
      `}>
        {/* Logo Area */}
        <div className="flex items-center justify-center lg:justify-start lg:px-4 gap-3 mb-10 w-full">
          <div className="w-10 h-10 bg-theme-accent-danger rounded-sm flex items-center justify-center text-white shadow-glow-red border border-white/10 shrink-0 overflow-hidden">
            <img src="https://lh3.googleusercontent.com/d/1L2mI54ppN63F77yrXlRhQXoaWMoDLjJc" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-theme-text-main text-sm tracking-wide font-tech uppercase leading-none">SENAI</h1>
            <p className="text-[9px] text-theme-text-muted font-bold tracking-[0.2em] uppercase font-mono mt-1">Industrial</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 w-full px-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center justify-center lg:justify-start gap-3 py-2.5 px-3 relative group transition-all duration-200 rounded-lg
                  ${currentView === item.id 
                    ? 'bg-theme-accent-solid text-white shadow-glow' 
                    : 'text-theme-text-muted hover:bg-theme-input hover:text-theme-text-main'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                    {item.icon}
                    <span className={`hidden lg:block text-[11px] font-bold font-tech uppercase tracking-wide ${currentView === item.id ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
                </div>
                
                {/* Active Indicator Dot for collapsed mode */}
                {currentView === item.id && (
                    <div className="lg:hidden absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </button>
            ))}
        </nav>

        {/* Footer Area: Theme Toggle & User */}
        <div className="mt-auto w-full px-2 mb-2 space-y-2">
          
          {/* Theme Toggle */}
          {toggleTheme && (
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-center lg:justify-start gap-3 py-2.5 px-3 rounded-lg text-theme-text-muted hover:bg-theme-input hover:text-theme-text-main transition-all group border border-transparent hover:border-theme-border"
                title="Alternar Tema"
              >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  <span className="hidden lg:block text-[11px] font-bold font-tech uppercase tracking-wide">
                      {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                  </span>
              </button>
          )}

          {/* User Profile */}
          <div 
            onClick={() => setIsProfileOpen(true)}
            className="bg-theme-input/50 rounded-xl p-2.5 flex items-center justify-between lg:justify-start gap-3 border border-theme-border group cursor-pointer hover:bg-theme-input transition-colors relative"
          >
            <div className="w-8 h-8 rounded bg-theme-card flex items-center justify-center shrink-0 border border-theme-border group-hover:border-theme-accent-solid transition-colors group-hover:bg-theme-accent-solid/10">
                <User size={18} className="text-theme-text-muted group-hover:text-theme-accent-solid transition-colors" />
            </div>
            
            <div className="hidden lg:block overflow-hidden flex-1">
                <div className="text-[11px] font-bold text-theme-text-main truncate font-tech uppercase tracking-wide">{userName}</div>
                <div className="text-[9px] text-theme-text-muted font-mono uppercase">{getRoleLabel()}</div>
            </div>

            <div className="text-theme-text-muted hover:text-theme-accent-danger transition-colors lg:hidden">
                 <User size={16} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* PROFILE MODAL */}
      {isProfileOpen && (
        <div 
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsProfileOpen(false)}
        >
            <div 
                className="bg-theme-card w-full max-w-md rounded-[24px] border border-theme-border shadow-2xl overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-accent opacity-20"></div>
                <button 
                    onClick={() => setIsProfileOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-6 relative pt-12 text-center">
                    <div className="w-24 h-24 rounded-2xl bg-theme-sidebar border-4 border-theme-card shadow-glow mx-auto mb-4 flex items-center justify-center relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-theme-accent-solid/20 to-transparent"></div>
                         <User size={48} className="text-theme-accent-solid" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-theme-text-main font-tech uppercase tracking-wide">{userName}</h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-input border border-theme-border mt-2">
                        <BadgeCheck size={14} className="text-emerald-400" />
                        <span className="text-xs font-bold text-theme-text-muted uppercase">{getRoleLabel()}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-8 text-left bg-theme-input/50 p-4 rounded-xl border border-theme-border/50">
                        <div className="flex items-center gap-3 p-3 bg-theme-card rounded-lg border border-theme-border">
                            <div className="p-2 bg-theme-input rounded text-theme-text-muted"><Mail size={16}/></div>
                            <div>
                                <div className="text-[10px] font-bold text-theme-text-muted uppercase">E-mail Corporativo</div>
                                <div className="text-sm font-medium text-theme-text-main">{getEmailSimulated()}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-theme-card rounded-lg border border-theme-border">
                            <div className="p-2 bg-theme-input rounded text-theme-text-muted"><Fingerprint size={16}/></div>
                            <div>
                                <div className="text-[10px] font-bold text-theme-text-muted uppercase">Matrícula / ID</div>
                                <div className="text-sm font-medium text-theme-text-main font-mono">2024.1A.{Math.floor(Math.random() * 9000) + 1000}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-theme-card rounded-lg border border-theme-border">
                            <div className="p-2 bg-theme-input rounded text-theme-text-muted"><Building2 size={16}/></div>
                            <div>
                                <div className="text-[10px] font-bold text-theme-text-muted uppercase">Setor / Célula</div>
                                <div className="text-sm font-medium text-theme-text-main">Manufatura Avançada 1.A</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-theme-border flex gap-3">
                         <button 
                            onClick={onLogout}
                            className="w-full py-3 bg-theme-accent-danger/10 hover:bg-theme-accent-danger text-theme-accent-danger hover:text-white border border-theme-accent-danger/50 rounded-xl font-bold uppercase tracking-wide shadow-glow-red transition-all flex items-center justify-center gap-2 text-xs"
                         >
                            <LogOut size={16} /> Encerrar Sessão
                         </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Navbar;