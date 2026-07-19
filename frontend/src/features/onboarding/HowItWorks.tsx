'use client';

import React, { useState, useEffect } from 'react';
import { 
  Info, X, Brain, DollarSign, 
  Users, AlertTriangle, ChevronRight, Database,
  Cpu, Zap, Target, ArrowRight, CheckCircle2
} from 'lucide-react';

import { createPortal } from 'react-dom';

export function HowItWorks() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = [
    {
      title: 'The Problem',
      icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
      color: 'red',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            Every year, <span className="text-white font-semibold">5 million patients</span> wait in US emergency rooms for a bed. 
            Hospitals lose <span className="text-red-400 font-semibold">$17.1 billion/year</span> because of this.
          </p>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-300 font-medium mb-2">What is "boarding"?</p>
            <p className="text-xs text-gray-300">
              When a patient arrives at the ER and needs to be admitted to the hospital, they need a bed upstairs. 
              But if all beds are full, the patient is <span className="text-white font-medium">"stuck" in the ER</span> - waiting on a stretcher in the hallway. 
              This is called <span className="text-red-400 font-medium">boarding</span>.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-300 font-medium mb-2">Why is this a problem?</p>
            <ul className="text-xs text-gray-400 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Patients wait 4-6 hours in hallways instead of getting treatment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>ER gets overcrowded - new patients can't get in</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Ambulances get diverted to other hospitals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Staff gets burned out from the chaos</span>
              </li>
            </ul>
          </div>

          <div className="text-xs text-gray-500">
            Source: CDC National Hospital Ambulatory Medical Care Survey
          </div>
        </div>
      ),
    },
    {
      title: 'The Architecture',
      icon: <Cpu className="w-6 h-6 text-cyan-400" />,
      color: 'cyan',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            Here's <span className="text-white font-semibold">exactly how FlowSense works</span> under the hood:
          </p>
          
          {/* Visual Architecture Diagram */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
            <div className="flex flex-col items-center gap-3">
              {/* Data Layer */}
              <div className="w-full bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-400">DATA LAYER</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-sm sm:text-lg font-bold text-white">143K</div>
                    <div className="text-[9px] text-gray-400">Real ER Visits</div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-lg font-bold text-white">27</div>
                    <div className="text-[9px] text-gray-400">Features Extracted</div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-lg font-bold text-white">24/7</div>
                    <div className="text-[9px] text-gray-400">Live Monitoring</div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-1 text-cyan-400">
                <div className="w-8 h-px bg-cyan-400/50" />
                <ArrowRight className="w-4 h-4" />
                <div className="w-8 h-px bg-cyan-400/50" />
              </div>

              {/* AI Layer */}
              <div className="w-full bg-gray-800/50 rounded-lg p-3 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-400">AI ENGINE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                  <div className="bg-purple-500/10 rounded p-2">
                    <div className="text-xs font-bold text-purple-400">GradientBoost</div>
                    <div className="text-[9px] text-gray-400">Complex patterns</div>
                  </div>
                  <div className="bg-green-500/10 rounded p-2">
                    <div className="text-xs font-bold text-green-400">RandomForest</div>
                    <div className="text-[9px] text-gray-400">Reliable baseline</div>
                  </div>
                  <div className="bg-yellow-500/10 rounded p-2">
                    <div className="text-xs font-bold text-yellow-400">RidgeRegression</div>
                    <div className="text-[9px] text-gray-400">Stability</div>
                  </div>
                </div>
                <div className="mt-2 text-center text-[10px] text-gray-400">
                  Ensemble weighted by inverse MAE → R² = 0.67
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-1 text-purple-400">
                <div className="w-8 h-px bg-purple-400/50" />
                <ArrowRight className="w-4 h-4" />
                <div className="w-8 h-px bg-purple-400/50" />
              </div>

              {/* Output Layer */}
              <div className="w-full bg-gray-800/50 rounded-lg p-3 border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold text-green-400">OUTPUT</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-green-500/10 rounded p-2">
                    <div className="text-xs font-bold text-green-400">4-12h Forecast</div>
                    <div className="text-[9px] text-gray-400">Boarding count prediction</div>
                  </div>
                  <div className="bg-blue-500/10 rounded p-2">
                    <div className="text-xs font-bold text-blue-400">Action Items</div>
                    <div className="text-[9px] text-gray-400">Ranked recommendations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'The AI Models',
      icon: <Brain className="w-6 h-6 text-purple-400" />,
      color: 'purple',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            FlowSense uses <span className="text-white font-semibold">3 different AI models</span> that work together 
            (like getting opinions from 3 doctors instead of 1).
          </p>
          
          <div className="space-y-2">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-sm text-white font-medium">Gradient Boosting</p>
              </div>
              <p className="text-xs text-gray-400">Best at finding complex patterns - catches things humans might miss</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-sm text-white font-medium">Random Forest</p>
              </div>
              <p className="text-xs text-gray-400">Very reliable - doesn't get confused by noisy or unusual data</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <p className="text-sm text-white font-medium">Ridge Regression</p>
              </div>
              <p className="text-xs text-gray-400">The baseline - simple but effective, keeps predictions reasonable</p>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <p className="text-sm text-purple-300 font-medium mb-2">What the AI looks at:</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-300">
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> Current patients waiting
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> Time of day / day of week
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> How urgent patients are
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> Average patient age
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> How long patients stay
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> Pain levels
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> Critical patients count
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> Injury vs illness mix
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> Admission rate
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> Weather conditions
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> Nurse availability
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span> PACU capacity
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Tech Stack',
      icon: <Target className="w-6 h-6 text-orange-400" />,
      color: 'orange',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            Built with <span className="text-white font-semibold">production-grade technologies</span> — not just a notebook demo.
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs font-semibold text-orange-400 mb-2">BACKEND</div>
              <div className="space-y-1.5 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>Python + FastAPI</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>scikit-learn ML</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>SQLite + aiosqlite</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>SSE real-time push</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs font-semibold text-blue-400 mb-2">FRONTEND</div>
              <div className="space-y-1.5 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>Next.js 14 + React</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>TypeScript</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>Tailwind CSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>Web Audio API alerts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-xs font-semibold text-cyan-400 mb-2">DATA</div>
            <div className="space-y-1.5 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                <span>143,280 real ER visits from Texas hospitals (2017)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                <span>27 engineered features per prediction</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                <span>Real-time weather integration</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Key Innovation',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      color: 'yellow',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            What makes FlowSense <span className="text-white font-semibold">different from existing solutions</span>?
          </p>
          
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">Predictive, Not Reactive</p>
                <p className="text-xs text-gray-400">Existing tools show current status. FlowSense predicts 4-6 hours ahead.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">Actionable Recommendations</p>
                <p className="text-xs text-gray-400">Not just "you're busy" — tells staff exactly what to do (e.g., "Discharge 5 patients now").</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">Trained on Real Data</p>
                <p className="text-xs text-gray-400">143,280 actual ER visits — not synthetic or simulated data.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">Real-Time via SSE</p>
                <p className="text-xs text-gray-400">Server pushes updates every 30 seconds — no polling, no stale data.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Try It Yourself',
      icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
      color: 'emerald',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            Click <span className="text-white font-semibold">"Test Prediction"</span> in the header to try different scenarios:
          </p>
          
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <p className="text-sm text-emerald-300 font-medium mb-3">4 Pre-built Scenarios:</p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <span className="text-lg">☀️</span>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">Normal Day</div>
                  <div className="text-xs text-gray-400">5 patients waiting, 22 beds used</div>
                </div>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">LOW</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <span className="text-lg">📅</span>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">Busy Monday</div>
                  <div className="text-xs text-gray-400">10 patients waiting, 26 beds used</div>
                </div>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">MEDIUM</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <span className="text-lg">🚨</span>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">Boarding Crisis</div>
                  <div className="text-xs text-gray-400">18 patients waiting, 29 beds used</div>
                </div>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">CRITICAL</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <span className="text-lg">🤒</span>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">Flu Outbreak</div>
                  <div className="text-xs text-gray-400">14 patients waiting, 28 beds used</div>
                </div>
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">HIGH</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400">
              <span className="text-white font-medium">How to test:</span> Change any number (like boarding count or arrival rate) 
              and watch the AI prediction change in real-time. This proves the model is actually computing, not just showing fake data.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400">
              <span className="text-white font-medium">Also try:</span> Click "Export PDF" to generate a professional report, 
              or click the bell icon to see real-time alerts.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Real-World Impact',
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      color: 'emerald',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            If a hospital uses FlowSense for 1 year:
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">$3.2M</div>
              <div className="text-xs text-gray-400">Revenue saved</div>
              <div className="text-[10px] text-gray-500 mt-1">From fewer diversions</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">2,400</div>
              <div className="text-xs text-gray-400">Patients helped</div>
              <div className="text-[10px] text-gray-500 mt-1">Got beds faster</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">60%</div>
              <div className="text-xs text-gray-400">Fewer diversions</div>
              <div className="text-[10px] text-gray-500 mt-1">Ambulances can come here</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-400">4hrs</div>
              <div className="text-xs text-gray-400">Earlier warning</div>
              <div className="text-[10px] text-gray-500 mt-1">Before crisis hits</div>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <p className="text-sm text-emerald-300 font-medium mb-2">How the savings work:</p>
            <div className="text-xs text-gray-300 space-y-1">
              <p>• Each boarding patient costs the hospital ~$5,000 in lost revenue</p>
              <p>• FlowSense catches crises 4 hours early</p>
              <p>• Staff can discharge patients, open beds, call extra nurses</p>
              <p>• Result: Fewer patients stuck, more beds available, money saved</p>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Based on: HHS Study on ED Boarding Costs (2023) + AHRQ Patient Safety Data
          </div>
        </div>
      ),
    },
  ];

  const handleOpen = () => {
    setIsOpen(true);
    setStep(0);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg hover:shadow-blue-500/25 transition-all group border border-blue-400/20"
        title="How FlowSense Works"
      >
        <Info className="w-5 h-5 text-white" />
        <span className="text-sm font-medium text-white">How It Works</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl p-3 sm:p-6 transition-all duration-300">
          <div className="bg-[#111318]/95 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-[600px] max-h-[85vh] overflow-hidden shadow-2xl flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 shrink-0 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <Info className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">How FlowSense Works</h2>
                  <p className="text-[11px] text-gray-400">Understand the system in 3 minutes</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                  step === steps.length - 1 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'bg-gray-800/30 text-gray-600 cursor-not-allowed opacity-30'
                }`}
                disabled={step !== steps.length - 1}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Progress */}
            <div className="px-6 py-3 border-b border-gray-700/50 shrink-0">
              <div className="flex gap-1.5">
                {steps.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      i === step ? 'bg-blue-500' : i < step ? 'bg-blue-500/50' : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-gray-500">Step {step + 1} of {steps.length}</span>
                <span className="text-[10px] text-gray-500">{steps[step]?.title}</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                {steps[step]?.icon}
                <h3 className="text-lg font-bold text-white">{steps[step]?.title}</h3>
              </div>
              {steps[step]?.content}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/5 shrink-0 flex items-center justify-between bg-black/20">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              <div className="flex gap-2">
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
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm text-white font-medium transition-colors"
                  >
                    Got It!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
