
import React, { useState, useRef, useEffect } from 'react';
import { getAIChatResponse } from '../services/gemini';
import { useLMS } from '../store';

const AIAdvisor: React.FC = () => {
  const { currentUser } = useLMS();
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: `Greetings, ${currentUser?.name}. Welcome to the VRT Strategic Command. I am your AI Growth Advisor. We are here to architect your business expansion. What challenge shall we tackle first?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (userMsg: string) => {
    if (!userMsg.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await getAIChatResponse(messages, userMsg);
    
    setMessages(prev => [...prev, { role: 'model', text: response || "I'm currently recalibrating my strategic processors. Please try again." }]);
    setIsLoading(false);
  };

  const suggestedPrompts = [
    "How do I optimize my customer acquisition costs?",
    "Identify 3 operational bottlenecks in a scaling startup.",
    "Draft a strategic hiring roadmap for the next 6 months.",
    "Explain the EGA framework for operational excellence."
  ];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-160px)] flex flex-col animate-fadeIn">
      <header className="mb-8">
        <p className="text-[10px] font-black uppercase text-nitrocrimson-600 tracking-[0.3em] mb-2">VRT Strategic Intelligence</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">AI Executive Advisor</h1>
      </header>

      <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 bg-slate-50/30 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm ${
                  msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-nitrocrimson-600 text-white'
                }`}>
                  <i className={`fas ${msg.role === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
                </div>
                <div className={`p-6 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-10 h-10 rounded-xl bg-nitrocrimson-600 text-white flex items-center justify-center animate-pulse">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] rounded-tl-none shadow-sm flex items-center">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-8 md:px-12 py-4 border-t border-slate-50 bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Strategic Shortcuts</p>
          <div className="flex flex-wrap gap-3">
            {suggestedPrompts.map((prompt, i) => (
              <button 
                key={i}
                onClick={() => handleSend(prompt)}
                className="px-4 py-2 bg-slate-50 hover:bg-nitrocrimson-50 text-slate-600 hover:text-nitrocrimson-600 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border border-slate-100 hover:border-nitrocrimson-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-8 md:p-12 bg-white border-t border-slate-50">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Deploy strategic inquiry..."
              className="w-full bg-slate-50 border-0 rounded-[2rem] px-8 py-6 pr-24 text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-nitrocrimson-600/5 transition-all"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-3 w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-nitrocrimson-600 transition-all disabled:opacity-20 shadow-xl"
            >
              <i className="fas fa-paper-plane text-xl"></i>
            </button>
          </form>
          <p className="text-center mt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Encrypted Advisory Stream Active</p>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #EA0027; }
      `}</style>
    </div>
  );
};

export default AIAdvisor;
