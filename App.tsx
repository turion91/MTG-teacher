
import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  Zap, 
  Palette, 
  Send, 
  BrainCircuit, 
  ChevronRight,
  Sparkles,
  Info,
  Lightbulb
} from 'lucide-react';
import { AgentCategory, ChatMessage, WorkflowStep } from './types';
import { classifyQuery, getWorkerResponse } from './services/gemini';

const EXAMPLE_QUERIES = [
  { text: "How does the stack work?", category: AgentCategory.GENERAL_RULES, label: "Fundamentals" },
  { text: "What is summoning sickness?", category: AgentCategory.CARD_TYPE, label: "Card Types" },
  { text: "Explain the Ward keyword.", category: AgentCategory.EFFECT_TYPE, label: "Mechanics" },
  { text: "What are Blue's core strengths?", category: AgentCategory.COLOR_ARCHETYPE, label: "Color Pie" },
  { text: "Difference between Instant and Sorcery?", category: AgentCategory.CARD_TYPE, label: "Spells" },
  { text: "How do I win a game of Magic?", category: AgentCategory.GENERAL_RULES, label: "Objectives" },
  { text: "How does Trample interact with Deathtouch?", category: AgentCategory.EFFECT_TYPE, label: "Keywords" },
  { text: "Why is Black associated with the graveyard?", category: AgentCategory.COLOR_ARCHETYPE, label: "Philosophy" },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, workflow]);

  const handleSend = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const query = overrideInput || input;
    if (!query.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!overrideInput) setInput('');
    setIsProcessing(true);

    // Initial Workflow State
    setWorkflow([
      { agent: AgentCategory.ORCHESTRATOR, status: 'processing', message: 'Analyzing query category...' }
    ]);

    try {
      // 1. Orchestration Phase
      const classification = await classifyQuery(query);
      setWorkflow(prev => [
        { ...prev[0], status: 'completed', message: `Classified as ${classification.category}` },
        { agent: classification.category, status: 'processing', message: `Domain expert '${classification.category}' is crafting your answer...` }
      ]);

      // 2. Worker Phase
      const workerOutput = await getWorkerResponse(classification.category, query);
      
      setWorkflow(prev => [
        prev[0],
        { ...prev[1], status: 'completed', message: 'Response generated successfully.' }
      ]);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: workerOutput,
        category: classification.category,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setWorkflow(prev => prev.map(step => step.status === 'processing' ? { ...step, status: 'error', message: 'Failed to process request.' } : step));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I encountered an error while consulting the library. Please try again.",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsProcessing(false);
      // Optional: Clear workflow after a delay
      setTimeout(() => setWorkflow([]), 5000);
    }
  };

  const getAgentIcon = (category: AgentCategory) => {
    switch (category) {
      case AgentCategory.ORCHESTRATOR: return <BrainCircuit className="w-5 h-5" />;
      case AgentCategory.GENERAL_RULES: return <ShieldCheck className="w-5 h-5 text-slate-400" />;
      case AgentCategory.CARD_TYPE: return <Layers className="w-5 h-5 text-amber-400" />;
      case AgentCategory.EFFECT_TYPE: return <Zap className="w-5 h-5 text-red-400" />;
      case AgentCategory.COLOR_ARCHETYPE: return <Palette className="w-5 h-5 text-emerald-400" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getAgentColor = (category?: AgentCategory) => {
    switch (category) {
      case AgentCategory.ORCHESTRATOR: return 'border-blue-500/50 bg-blue-500/10';
      case AgentCategory.GENERAL_RULES: return 'border-slate-500/50 bg-slate-500/10';
      case AgentCategory.CARD_TYPE: return 'border-amber-500/50 bg-amber-500/10';
      case AgentCategory.EFFECT_TYPE: return 'border-red-500/50 bg-red-500/10';
      case AgentCategory.COLOR_ARCHETYPE: return 'border-emerald-500/50 bg-emerald-500/10';
      default: return 'border-slate-700 bg-slate-800/50';
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8 text-center flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">MTG Rules Sage</h1>
            <p className="text-slate-400 text-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Multi-Agent Orchestration Engine
            </p>
          </div>
        </div>
        <div className="hidden md:flex gap-4">
            <div className="text-xs text-slate-500 flex flex-col items-end">
                <span className="font-semibold text-slate-300 uppercase tracking-wider">Agents Online</span>
                <span className="flex gap-2 mt-1">
                    <span title="General Rules" className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span title="Card Types" className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span title="Effect Types" className="w-2 h-2 rounded-full bg-red-400"></span>
                    <span title="Color Archetypes" className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </span>
            </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Sidebar / Agent Map */}
        <aside className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> System Workflow
            </h2>
            <div className="space-y-4">
              <WorkflowStepItem 
                title="Orchestrator" 
                desc="Classifies and routes queries" 
                icon={<BrainCircuit className="w-4 h-4" />} 
                active={workflow.some(s => s.agent === AgentCategory.ORCHESTRATOR)}
                status={workflow.find(s => s.agent === AgentCategory.ORCHESTRATOR)?.status}
              />
              <div className="flex justify-center -my-1">
                <ChevronRight className="rotate-90 text-slate-700 w-4 h-4" />
              </div>
              <WorkflowStepItem 
                title="Worker Agents" 
                desc="Specialized domain experts" 
                icon={<Layers className="w-4 h-4" />} 
                active={workflow.some(s => s.agent !== AgentCategory.ORCHESTRATOR && s.agent !== undefined)}
                status={workflow.find(s => s.agent !== AgentCategory.ORCHESTRATOR && s.agent !== undefined)?.status}
              />
            </div>

            {workflow.length > 0 && (
              <div className="mt-6 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg animate-pulse">
                <p className="text-xs text-indigo-300 font-mono">
                  {workflow[workflow.length - 1].message}
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex-1 hidden lg:block overflow-hidden flex flex-col">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Try Asking...
            </h2>
            <div className="space-y-2 overflow-y-auto pr-1">
              {EXAMPLE_QUERIES.map((q, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(undefined, q.text)}
                  disabled={isProcessing}
                  className="w-full text-left p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 transition-all group disabled:opacity-50"
                >
                  <p className="text-xs text-slate-300 group-hover:text-white line-clamp-2 leading-relaxed mb-1">{q.text}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${getAgentColor(q.category)}`}>
                    {q.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="lg:col-span-3 flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="bg-slate-800 p-4 rounded-full mb-4">
                  <BrainCircuit className="w-12 h-12 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Welcome, Planeswalker</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-8">
                  I am a collective of specialized rule experts. Ask me any question, and the Orchestrator will find the right sage for you.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full lg:hidden">
                  {EXAMPLE_QUERIES.slice(0, 4).map((q, i) => (
                    <QuickStartBtn key={i} onClick={() => handleSend(undefined, q.text)} text={q.text} label={q.label} />
                  ))}
                </div>
                <div className="mt-8 text-xs text-slate-500 flex items-center gap-4">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Rules</span>
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3"/> Types</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3"/> Effects</span>
                  <span className="flex items-center gap-1"><Palette className="w-3 h-3"/> Lore</span>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                    {msg.role === 'assistant' && msg.category && (
                      <div className="flex items-center gap-2 mb-1 ml-1">
                        {getAgentIcon(msg.category)}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Expert: {msg.category.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    <div className={`
                      p-4 rounded-2xl shadow-sm leading-relaxed
                      ${msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : `${getAgentColor(msg.category)} border text-slate-200 rounded-tl-none prose prose-invert prose-sm max-w-none`
                      }
                    `}>
                      <div className="whitespace-pre-wrap mtg-font">
                        {msg.content}
                      </div>
                    </div>
                    <div className={`text-[10px] text-slate-600 mt-1 px-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl rounded-tl-none animate-pulse flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-sm text-slate-400 font-medium">Consulting the archives...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-950/50 border-t border-slate-800">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about turn phases, keywords, or card types..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-4 pr-14 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-600 mt-3 uppercase tracking-tighter">
              Orchestrated AI Response System • Magic: The Gathering
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

// Helper Components

const WorkflowStepItem: React.FC<{ 
  title: string; 
  desc: string; 
  icon: React.ReactNode; 
  active: boolean; 
  status?: 'idle' | 'processing' | 'completed' | 'error' 
}> = ({ title, desc, icon, active, status }) => {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-all border ${
      active 
        ? 'bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/5' 
        : 'bg-transparent border-transparent opacity-40'
    }`}>
      <div className={`mt-1 p-2 rounded-lg ${active ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-xs font-bold text-slate-200">{title}</h4>
        <p className="text-[10px] text-slate-500 leading-tight">{desc}</p>
        {active && status === 'processing' && (
          <div className="mt-2 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-[progress_1.5s_ease-in-out_infinite] w-1/3"></div>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickStartBtn: React.FC<{ text: string; label: string; onClick: () => void }> = ({ text, label, onClick }) => (
  <button 
    onClick={onClick}
    className="text-left px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-all flex items-center justify-between group"
  >
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold group-hover:text-indigo-400">{label}</span>
      {text}
    </div>
    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

export default App;
