'use client';

import React, { useState, useEffect } from 'react';
import { X, Brain, Shield, Play, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

const WELCOME_KEY = 'flowsense_welcome_seen';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const seen = localStorage.getItem(WELCOME_KEY);
    if (!seen) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(WELCOME_KEY, 'true');
  };

  const steps = [
    {
      icon: <Brain className="w-8 h-8 text-purple-400" />,
      title: 'Welcome to FlowSense',
      subtitle: 'AI-Powered Hospital Intelligence',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed text-sm">
            FlowSense predicts <span className="text-white font-semibold">when the emergency department will overflow</span> — 
            4 to 6 hours before it happens — and tells staff exactly what to do.
          </p>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <p className="text-xs text-purple-300 font-medium mb-2">In one sentence:</p>
            <p className="text-sm text-white font-semibold">
              "It's a weather forecast, but for hospital overcrowding."
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-400" />,
      title: 'What You\'re Looking At',
      subtitle: 'The dashboard at a glance',
      content: (
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">Top Banner</p>
              <p className="text-xs text-gray-400">Shows current risk level — Red = crisis, Green = all clear</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">8 Status Cards</p>
              <p className="text-xs text-gray-400">ER beds, waiting patients, nurse workload, and more — all live</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">AI Predictions</p>
              <p className="text-xs text-gray-400">Bar chart showing how many patients will be stuck in 4, 6, 8, 12 hours</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">AI Recommendations</p>
              <p className="text-xs text-gray-400">Specific actions like "Discharge 5 patients now" ranked by priority</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: <Play className="w-8 h-8 text-green-400" />,
      title: 'Try It Now',
      subtitle: 'See the AI in action',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed text-sm">
            Click the <span className="text-white font-semibold">"Test Prediction"</span> button in the header to try different scenarios:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
              <div className="text-lg mb-1">☀️</div>
              <p className="text-xs text-white font-medium">Normal Day</p>
              <p className="text-[10px] text-gray-400">LOW risk</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
              <div className="text-lg mb-1">📅</div>
              <p className="text-xs text-white font-medium">Busy Monday</p>
              <p className="text-[10px] text-gray-400">MEDIUM risk</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
              <div className="text-lg mb-1">🚨</div>
              <p className="text-xs text-white font-medium">Boarding Crisis</p>
              <p className="text-[10px] text-gray-400">CRITICAL risk</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
              <div className="text-lg mb-1">🤒</div>
              <p className="text-xs text-white font-medium">Flu Outbreak</p>
              <p className="text-[10px] text-gray-400">HIGH risk</p>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400">
              <span className="text-white font-medium">Tip:</span> Change any number and watch the AI prediction change in real-time. 
              This proves the model is actually computing.
            </p>
          </div>
        </div>
      ),
    },
  ];

  if (!mounted) return null;

  return isOpen ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
      <div className="bg-[#111318]/95 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-[520px] overflow-hidden shadow-2xl">
        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-blue-500' : 'bg-gray-700'}`} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            {steps[step].icon}
            <div>
              <h2 className="text-lg font-bold text-white">{steps[step].title}</h2>
              <p className="text-xs text-gray-400">{steps[step].subtitle}</p>
            </div>
          </div>
          {steps[step].content}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Skip tour
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white font-medium transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm text-white font-medium transition-colors"
            >
              Start Using FlowSense
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;
}
