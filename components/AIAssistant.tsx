import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { askTechnicalAssistant } from '../services/geminiService';
import { Bot, Send, User, Loader2, Info, Sparkles } from 'lucide-react';

const QUICK_CHIPS = [
  'Calcular RPM',
  'Parâmetros Aço 1020',
  'Norma NR-12 e EPIs',
  'Lubrificação de Barramento',
  'Ciclo G71 Torno CNC Romi'
];

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Olá! Sou o Assistente Técnico Virtual da Célula 1.A do SENAI.\nComo posso ajudar você com parâmetros de usinagem, manutenção, segurança NR-12 ou programação CNC?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const responseText = await askTechnicalAssistant(text);

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageWithText(inputValue);
  };

  return (
    <div className="h-full flex flex-col bg-theme-card rounded-2xl shadow-sm border border-theme-border overflow-hidden">
      {/* Chat Header */}
      <div className="bg-theme-sidebar p-4 flex items-center justify-between text-white border-b border-theme-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-theme-accent-solid/20 p-2 rounded-xl text-theme-accent-solid border border-theme-accent-solid/30">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-theme-text-main uppercase font-tech tracking-wide">Assistente Técnico SENAI</h2>
            <p className="text-[11px] text-theme-text-muted">Célula 1.A • Manufatura Avançada</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="flex h-2 w-2 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
           </span>
           <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase font-mono">Pronto</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-950/40 p-2.5 text-xs text-blue-300 flex items-center gap-2 border-b border-blue-900/30 shrink-0">
        <Info size={14} className="shrink-0 text-blue-400" />
        <p className="text-[11px] leading-tight">Consulte rotações, avanços, procedimentos preventivos e normas de segurança.</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-theme-bg/40 scroll-container">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[90%] md:max-w-[80%] gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`
                w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold
                ${msg.role === 'user' ? 'bg-theme-input border border-theme-border text-theme-text-muted' : 'bg-theme-accent-solid text-white shadow-glow'}
              `}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              
              <div className={`
                p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-theme-accent-solid text-white rounded-tr-none' 
                  : 'bg-theme-card text-theme-text-main rounded-tl-none border border-theme-border'}
              `}>
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                <div className={`text-[9px] mt-1.5 text-right font-mono ${msg.role === 'user' ? 'text-white/60' : 'text-theme-text-muted'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
             <div className="flex max-w-[80%] gap-2.5">
               <div className="w-7 h-7 rounded-lg bg-theme-accent-solid text-white flex items-center justify-center shrink-0">
                  <Bot size={14} />
               </div>
               <div className="bg-theme-card border border-theme-border p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                 <Loader2 size={16} className="animate-spin text-theme-accent-solid" />
                 <span className="text-xs text-theme-text-muted font-mono">Consultando base de conhecimento técnico...</span>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-3 pt-2 bg-theme-card border-t border-theme-border/50 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 pb-1">
        {QUICK_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => sendMessageWithText(chip)}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-theme-input hover:bg-theme-accent-solid/20 text-theme-text-muted hover:text-theme-accent-solid border border-theme-border hover:border-theme-accent-solid/30 whitespace-nowrap transition"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-theme-card shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ex: Qual o cálculo de RPM para fresar alumínio D=40mm?"
            className="flex-1 bg-theme-input border border-theme-border text-theme-text-main text-xs md:text-sm rounded-xl focus:ring-1 focus:ring-theme-accent-solid block px-3.5 py-2.5 outline-none transition-colors"
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-accent hover:brightness-110 text-white rounded-xl px-4 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-glow shrink-0"
            title="Enviar Pergunta"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;