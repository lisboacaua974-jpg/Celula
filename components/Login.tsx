import React, { useState } from 'react';
import { User, Shield, Wrench, ArrowRight, Lock, Mail, AlertCircle, Check, Sun, Moon } from 'lucide-react';

interface LoginProps {
  onLogin: (role: string, name: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, theme, toggleTheme }) => {
  const [activeRole, setActiveRole] = useState<'admin' | 'student' | 'tech'>('admin');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setNewName('');
    setNewEmail('');
    setNewPass('');
    setConfirmPass('');
    setError('');
    setSuccessMsg('');
  };

  const handleRoleChange = (role: 'admin' | 'student' | 'tech') => {
    setActiveRole(role);
    setIsRegistering(false); // Always reset to login when changing roles
    resetForm();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      // VALIDATION LOGIC
      let isValid = false;
      let userName = '';

      if (activeRole === 'admin') {
        // Docente Hardcoded
        if (email === 'uanderson.mazzoni@docente.senai.br' && password === '1') {
            isValid = true;
            userName = 'Prof. Uanderson';
        } else {
            // Check against "registered" users (simulated)
            if (email === newEmail && password === newPass && newEmail !== '') {
                isValid = true;
                userName = newName;
            }
        }
      } else if (activeRole === 'student') {
        // Aluno Hardcoded
        if (email === 'aluno.senai.125@gmail.com' && password === 'senai') {
            isValid = true;
            userName = 'Aluno 125';
        }
      } else if (activeRole === 'tech') {
        // Technician (Open for demo, or match registration)
        if (email !== '' && password !== '') {
             isValid = true;
             userName = 'Téc. Manutenção';
        }
      }

      setIsLoading(false);

      if (isValid) {
        onLogin(activeRole, userName);
      } else {
        setError('Credenciais inválidas. Verifique e-mail e senha.');
      }
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPass !== confirmPass) {
        setError('As senhas não coincidem.');
        return;
    }

    setIsLoading(true);

    // Simulate Registration API
    setTimeout(() => {
        setIsLoading(false);
        setSuccessMsg('Cadastro realizado com sucesso! Faça login.');
        // Switch to login view with pre-filled email
        setEmail(newEmail);
        setIsRegistering(false);
    }, 1000);
  };

  const getRoleIcon = () => {
    switch (activeRole) {
      case 'admin': return <Shield size={18} />;
      case 'student': return <User size={18} />;
      case 'tech': return <Wrench size={18} />;
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-theme-bg font-sans selection:bg-theme-accent-danger selection:text-white overflow-hidden transition-colors duration-300">
      
      {/* Left Side - Visual / Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-theme-sidebar items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1565514020176-db99d5f7bcc2?q=80&w=2000&auto=format&fit=crop" 
            alt="Industrial Background" 
            className="w-full h-full object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-theme-bg via-theme-sidebar/80 to-theme-sidebar/90"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        </div>

        <div className="relative z-10 p-12 max-w-lg">
          <div className="w-16 h-16 bg-theme-accent-danger rounded-xl flex items-center justify-center shadow-glow-red border border-white/10 overflow-hidden mb-8 animate-fade-in">
             <img src="https://lh3.googleusercontent.com/d/1L2mI54ppN63F77yrXlRhQXoaWMoDLjJc" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-6 font-tech uppercase leading-tight tracking-tight">
            Gestão Inteligente <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-theme-accent-danger to-red-400">Célula 1.A</span>
          </h1>
          
          <p className="text-theme-text-muted text-lg leading-relaxed font-mono border-l-2 border-theme-accent-danger pl-6">
            Plataforma integrada para monitoramento de ativos, controle de manutenção e suporte operacional assistido por IA.
          </p>

          <div className="mt-12 flex gap-4">
             <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                <span className="block text-xl font-bold text-white font-mono">100%</span>
                <span className="text-xs uppercase text-theme-text-muted tracking-wider">Digital</span>
             </div>
             <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                <span className="block text-xl font-bold text-theme-accent-danger font-mono">24/7</span>
                <span className="text-xs uppercase text-theme-text-muted tracking-wider">Monitoramento</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        
        {/* Top Right Controls (Theme & Help) */}
        <div className="absolute top-6 right-6 flex items-center gap-4">
             <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full text-theme-text-muted hover:bg-theme-input hover:text-theme-text-main transition border border-transparent hover:border-theme-border"
                title="Alternar Tema"
             >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             <div className="hidden md:block">
                <span className="text-theme-text-muted text-sm font-mono mr-2">Precisa de ajuda?</span>
                <a href="#" className="text-theme-accent-danger text-sm font-bold hover:underline">Contatar Suporte</a>
             </div>
        </div>

        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-theme-text-main font-tech uppercase tracking-wide">
                {isRegistering ? 'Criar Conta' : 'Acessar Painel'}
            </h2>
            <p className="text-theme-text-muted mt-2 text-sm">
                {isRegistering ? 'Preencha os dados para solicitar acesso.' : 'Selecione seu perfil e insira suas credenciais.'}
            </p>
          </div>

          {/* Role Selector Tabs (Only show in Login Mode or if registering allowed) */}
          <div className="bg-theme-input p-1 rounded-xl flex border border-theme-border">
            <button 
              onClick={() => handleRoleChange('admin')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2
                ${activeRole === 'admin' ? 'bg-theme-accent-danger text-white shadow-lg' : 'text-theme-text-muted hover:text-white hover:bg-white/5'}`}
            >
              <Shield size={16} /> Docente
            </button>
            <button 
              onClick={() => handleRoleChange('student')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2
                ${activeRole === 'student' ? 'bg-theme-accent-danger text-white shadow-lg' : 'text-theme-text-muted hover:text-white hover:bg-white/5'}`}
            >
              <User size={16} /> Aluno
            </button>
            <button 
              onClick={() => handleRoleChange('tech')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2
                ${activeRole === 'tech' ? 'bg-theme-accent-danger text-white shadow-lg' : 'text-theme-text-muted hover:text-white hover:bg-white/5'}`}
            >
              <Wrench size={16} /> Técnico
            </button>
          </div>
          
          {/* Messages */}
          {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle size={18} /> {error}
              </div>
          )}
          {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in">
                  <Check size={18} /> {successMsg}
              </div>
          )}

          {/* FORM */}
          {!isRegistering ? (
            // --- LOGIN FORM ---
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                <div className="group">
                    <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2 ml-1">E-mail</label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-theme-text-muted group-focus-within:text-theme-accent-danger transition-colors">
                        <Mail size={18} />
                    </div>
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.email@senai.br"
                        className="w-full bg-theme-card border border-theme-border rounded-xl py-3.5 pl-11 pr-4 text-theme-text-main placeholder-theme-text-muted/50 outline-none focus:border-theme-accent-danger focus:ring-1 focus:ring-theme-accent-danger transition-all text-base font-medium"
                        required
                    />
                    </div>
                </div>

                <div className="group">
                    <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2 ml-1">Senha</label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-theme-text-muted group-focus-within:text-theme-accent-danger transition-colors">
                        <Lock size={18} />
                    </div>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-theme-card border border-theme-border rounded-xl py-3.5 pl-11 pr-4 text-theme-text-main placeholder-theme-text-muted/50 outline-none focus:border-theme-accent-danger focus:ring-1 focus:ring-theme-accent-danger transition-all text-base font-medium"
                        required
                    />
                    </div>
                </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-theme-text-muted hover:text-theme-text-main transition">
                    <input type="checkbox" className="rounded border-theme-border bg-theme-input text-theme-accent-danger focus:ring-0" />
                    Lembrar-me
                </label>
                <a href="#" className="text-theme-accent-danger font-bold hover:underline">Esqueceu a senha?</a>
                </div>

                <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-red text-white py-4 rounded-xl font-bold uppercase tracking-wide shadow-glow-red hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                {isLoading ? (
                    <>Verificando...</>
                ) : (
                    <>Entrar no Sistema <ArrowRight size={18} /></>
                )}
                </button>
            </form>
          ) : (
            // --- REGISTER FORM ---
            <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-4">
                     <div className="group">
                        <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2 ml-1">Nome Completo</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-theme-text-muted group-focus-within:text-theme-accent-danger transition-colors">
                                <User size={18} />
                            </div>
                            <input 
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Seu Nome"
                                className="w-full bg-theme-card border border-theme-border rounded-xl py-3.5 pl-11 pr-4 text-theme-text-main placeholder-theme-text-muted/50 outline-none focus:border-theme-accent-danger focus:ring-1 focus:ring-theme-accent-danger transition-all text-base font-medium"
                                required
                            />
                        </div>
                    </div>
                     <div className="group">
                        <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2 ml-1">E-mail Corporativo</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-theme-text-muted group-focus-within:text-theme-accent-danger transition-colors">
                                <Mail size={18} />
                            </div>
                            <input 
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="email@exemplo.com"
                                className="w-full bg-theme-card border border-theme-border rounded-xl py-3.5 pl-11 pr-4 text-theme-text-main placeholder-theme-text-muted/50 outline-none focus:border-theme-accent-danger focus:ring-1 focus:ring-theme-accent-danger transition-all text-base font-medium"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="group">
                            <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2 ml-1">Senha</label>
                            <input 
                                type="password"
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                placeholder="••••••"
                                className="w-full bg-theme-card border border-theme-border rounded-xl py-3.5 px-4 text-theme-text-main placeholder-theme-text-muted/50 outline-none focus:border-theme-accent-danger focus:ring-1 focus:ring-theme-accent-danger transition-all text-base font-medium"
                                required
                            />
                        </div>
                         <div className="group">
                            <label className="block text-xs font-bold text-theme-text-muted uppercase mb-2 ml-1">Confirmar</label>
                            <input 
                                type="password"
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                placeholder="••••••"
                                className="w-full bg-theme-card border border-theme-border rounded-xl py-3.5 px-4 text-theme-text-main placeholder-theme-text-muted/50 outline-none focus:border-theme-accent-danger focus:ring-1 focus:ring-theme-accent-danger transition-all text-base font-medium"
                                required
                            />
                        </div>
                    </div>
                </div>

                <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-red text-white py-4 rounded-xl font-bold uppercase tracking-wide shadow-glow-red hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                {isLoading ? 'Processando...' : 'Finalizar Cadastro'}
                </button>
            </form>
          )}

          {/* Toggle Register/Login Link (Hidden for Student) */}
          {activeRole !== 'student' && (
              <div className="text-center pt-6 border-t border-theme-border">
                {isRegistering ? (
                    <p className="text-sm text-theme-text-muted">
                        Já possui uma conta? {' '}
                        <button onClick={() => setIsRegistering(false)} className="text-theme-accent-danger font-bold hover:underline ml-1">
                            Fazer Login
                        </button>
                    </p>
                ) : (
                    <p className="text-sm text-theme-text-muted">
                        Não possui acesso? {' '}
                        <button onClick={() => setIsRegistering(true)} className="text-theme-accent-danger font-bold hover:underline ml-1">
                            Cadastrar-se
                        </button>
                    </p>
                )}
              </div>
          )}

           {activeRole === 'student' && (
              <div className="text-center pt-6 border-t border-theme-border">
                <p className="text-sm text-theme-text-muted">
                    Alunos possuem cadastro único. <br/> Contate a secretaria em caso de problemas.
                </p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;