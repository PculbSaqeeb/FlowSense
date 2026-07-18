'use client';

import React, { useState, useMemo } from 'react';
import { Users, Award, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { StaffMember } from '@/shared/types';

interface StaffSkillMatrixProps {
  staff: StaffMember[];
  isLoading?: boolean;
}

const CRITICAL_SPECS: Record<string, string> = {
  cardiac: 'Cardiac',
  pediatric: 'Pediatric',
  trauma: 'Trauma',
  mental_health: 'Mental Health',
};

const SKILL_COLORS: Record<string, string> = {
  BLS: 'bg-green-500/20 text-green-400',
  ACLS: 'bg-blue-500/20 text-blue-400',
  TNCC: 'bg-purple-500/20 text-purple-400',
  PALS: 'bg-cyan-500/20 text-cyan-400',
  CCRN: 'bg-orange-500/20 text-orange-400',
  ATLS: 'bg-red-500/20 text-red-400',
  TLS: 'bg-yellow-500/20 text-yellow-400',
};

export const StaffSkillMatrix = React.memo(function StaffSkillMatrix({ staff, isLoading }: StaffSkillMatrixProps) {
  const [expanded, setExpanded] = useState(false);

  const { onDuty, otAvailable, specSummary, gaps, advancedCount } = useMemo(() => {
    const onDuty = staff.filter(s => s.is_on_duty);
    const otAvailable = onDuty.filter(s => s.is_available_overtime);

    const specSummary: Record<string, number> = {};
    Object.keys(CRITICAL_SPECS).forEach(spec => {
      specSummary[spec] = onDuty.filter(s => s.specializations?.includes(spec)).length;
    });

    const gaps: string[] = [];
    Object.entries(CRITICAL_SPECS).forEach(([key, label]) => {
      if ((specSummary[key] || 0) === 0) gaps.push(`No ${label} specialist on duty`);
      else if (specSummary[key] === 1) gaps.push(`Only 1 ${label} specialist`);
    });

    const advancedCount = onDuty.filter(s => s.certification_level === 'advanced').length;

    return { onDuty, otAvailable, specSummary, gaps, advancedCount };
  }, [staff]);

  if (isLoading || !staff.length) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-28 mb-2" />
        <div className="h-20 bg-white/10 rounded" />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="font-medium text-sm">Staff & Skills</h3>
          <span className="text-xs text-gray-500">{onDuty.length} on duty</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-400">{onDuty.length}</div>
              <div className="text-[9px] text-gray-500">On Duty</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-400">{otAvailable.length}</div>
              <div className="text-[9px] text-gray-500">OT Available</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-purple-400">{advancedCount}</div>
              <div className="text-[9px] text-gray-500">Advanced</div>
            </div>
          </div>

          {gaps.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-medium text-yellow-400">Skill Gaps</span>
              </div>
              {gaps.map((gap, i) => (
                <p key={i} className="text-[10px] text-yellow-300/70">{gap}</p>
              ))}
            </div>
          )}

          <div>
            <h4 className="text-[10px] text-gray-500 uppercase mb-1.5 flex items-center gap-1">
              <Award className="w-3 h-3" /> Certifications Available
            </h4>
            <div className="flex flex-wrap gap-1">
              {Object.keys(SKILL_COLORS).map(skill => {
                const count = onDuty.filter(s => s.skills?.includes(skill)).length;
                return (
                  <span key={skill} className={`text-[10px] px-1.5 py-0.5 rounded-full ${count > 0 ? SKILL_COLORS[skill] : 'bg-white/5 text-gray-600'}`}>
                    {skill} ({count})
                  </span>
                );
              })}
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto overflow-x-auto w-full hide-scrollbar">
            <table className="w-full min-w-[320px]">
              <thead>
                <tr className="text-[9px] text-gray-500 uppercase">
                  <th className="text-left py-1 pr-2">Name</th>
                  <th className="text-center py-1 px-1">Role</th>
                  <th className="text-center py-1 px-1">Level</th>
                  <th className="text-center py-1 px-1">OT</th>
                </tr>
              </thead>
              <tbody>
                {onDuty.slice(0, 10).map((s, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="py-1.5 text-xs text-gray-300 truncate max-w-[100px]">{s.name}</td>
                    <td className="py-1.5 text-[10px] text-center text-gray-400">{s.role}</td>
                    <td className="py-1.5 text-center">
                      <span className={`text-[9px] px-1 py-0.5 rounded ${
                        s.certification_level === 'advanced' ? 'bg-purple-500/20 text-purple-400' :
                        s.certification_level === 'intermediate' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-white/10 text-gray-400'
                      }`}>{s.certification_level}</span>
                    </td>
                    <td className="py-1.5 text-center">
                      {s.is_available_overtime && <span className="text-[9px] text-green-400">Yes</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});
