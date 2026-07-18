'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, MessageSquare, Loader2, Send, Bot, User, Volume2, VolumeX } from 'lucide-react';
import { api } from '@/shared/lib';

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{role: string, text: string}>>([
    { role: 'assistant', text: 'Hi! Ask me anything about the hospital — boarding count, risk level, bed availability, recommendations, or staff status.' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  }, []);

  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const msg = textInput.trim();
    if (!msg || isLoading) return;

    stopSpeaking();
    setTextInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setIsLoading(true);

    try {
      const result = await api.chatWithAI(msg);
      setChatHistory(prev => {
        const updated = [...prev, { role: 'assistant', text: result.response }];
        return updated;
      });
      if (autoSpeak) {
        setTimeout(() => speakText(result.response), 100);
      }
    } catch {
      const errMsg = 'Sorry, something went wrong. Please try again.';
      setChatHistory(prev => [...prev, { role: 'assistant', text: errMsg }]);
      if (autoSpeak) {
        setTimeout(() => speakText(errMsg), 100);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 flex flex-col items-end gap-2">
      {/* Chat panel */}
      {isOpen && (
        <div className="glass rounded-xl shadow-2xl w-[calc(100vw-2rem)] sm:w-80 max-h-[480px] flex flex-col overflow-hidden border border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-gray-200">FlowSense AI</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Auto-speak toggle */}
              <button
                onClick={() => {
                  if (autoSpeak) stopSpeaking();
                  setAutoSpeak(!autoSpeak);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors ${
                  autoSpeak
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-white/5 text-gray-500 hover:text-gray-300'
                }`}
                title={autoSpeak ? 'Auto-speak ON — click to disable' : 'Auto-speak OFF — click to enable'}
              >
                {autoSpeak ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                <span>{autoSpeak ? 'Voice ON' : 'Voice OFF'}</span>
              </button>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[320px]">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-cyan-400" />
                  </div>
                )}
                <div className={`text-[11px] leading-relaxed rounded-lg px-2.5 py-2 max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-cyan-500/20 text-cyan-100'
                    : 'bg-white/5 text-gray-300'
                }`}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-2">
                  <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                  <span className="text-[10px] text-gray-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10">
            {/* Stop speaking bar */}
            {isSpeaking && (
              <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 cursor-pointer hover:bg-cyan-500/20 transition-colors" onClick={stopSpeaking}>
                <Volume2 className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="text-[10px] text-cyan-300">Speaking... tap to stop</span>
              </div>
            )}
            <form onSubmit={handleSend} className="flex items-center gap-2 p-2.5">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Ask about hospital status..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-cyan-500/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isLoading}
                className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-30 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 ${
          isOpen
            ? 'bg-cyan-500 text-white shadow-cyan-500/40 shadow-2xl'
            : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-600/30 shadow-2xl border border-cyan-400/30 animate-bounce'
        }`}
        title="AI Chat"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>
    </div>
  );
}
