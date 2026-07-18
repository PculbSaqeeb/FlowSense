'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { CurrentStatus, PredictionSummary, RecommendationItem, StaffMember, Surgery } from '@/shared/types';

interface ReportExportProps {
  status: CurrentStatus | null;
  prediction: PredictionSummary | null;
  recommendations: RecommendationItem[];
  staff: StaffMember[];
  surgeries: Surgery[];
}

export function ReportExport({ status, prediction, recommendations, staff, surgeries }: ReportExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, H = 297, M = 16;
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const currentBoarding = status?.boarding_count ?? prediction?.current_boarding ?? 0;
      const totalRevenue = recommendations.reduce((s, r) => s + r.expected_revenue_protected, 0);
      const riskLevel = prediction?.peak_risk_level || 'Normal';
      const totalPages = recommendations.length > 0 ? 3 : 2;

      const riskRGB = riskLevel === 'critical' ? [220, 38, 38] : riskLevel === 'high' ? [234, 88, 12] : riskLevel === 'medium' ? [202, 138, 4] : [16, 185, 129];
      const riskBgRGB = riskLevel === 'critical' ? [254, 242, 242] : riskLevel === 'high' ? [255, 247, 237] : riskLevel === 'medium' ? [254, 252, 232] : [236, 253, 245];

      const drawHeader = (title: string, subtitle: string, accent: number[]) => {
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, W, 32, 'F');
        
        // Logo Box
        pdf.setFillColor(accent[0], accent[1], accent[2]);
        pdf.roundedRect(M, 8, 16, 16, 4, 4, 'F');
        
        // Draw Pulse Icon inside the box
        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(1.2);
        pdf.setLineCap('round');
        pdf.setLineJoin('round');
        pdf.lines([[2.5, 0], [2, -4], [3, 9], [2, -5], [2.5, 0]], M + 2, 16);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, M + 22, 16);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(203, 213, 225);
        pdf.text(subtitle, M + 22, 22);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(dateStr, W - M, 16, { align: 'right' });
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.text('Generated at ' + timeStr, W - M, 22, { align: 'right' });
      };

      const drawFooter = (page: number) => {
        pdf.setDrawColor(226, 232, 240);
        pdf.line(M, H - 15, W - M, H - 15);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.setFont('helvetica', 'bold');
        pdf.text('FLOWSENSE AI HOSPITAL INTELLIGENCE', M, H - 10);
        pdf.text('Page ' + page + ' of ' + totalPages, W - M, H - 10, { align: 'right' });
      };

      const drawCard = (x: number, y: number, w: number, h: number, label: string, value: string, desc: string, bgColor: number[], textColor: number[]) => {
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.roundedRect(x, y, w, h, 4, 4, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(x, y, w, h, 4, 4, 'S');
        
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label.toUpperCase(), x + 8, y + 10);

        pdf.setFontSize(28);
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, x + 8, y + 24);

        // Explanation text wrapped
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        
        const maxW = w - 16;
        const words = desc.split(' ');
        let line = '';
        let lY = y + 32;
        words.forEach(word => {
          if (pdf.getTextWidth(line + ' ' + word) > maxW) { pdf.text(line, x + 8, lY); line = word; lY += 4; }
          else { line = line ? line + ' ' + word : word; }
        });
        if (line) pdf.text(line, x + 8, lY);
      };

      // PAGE 1
      drawHeader('FlowSense AI', 'Executive Operations & Intelligence Report', [109, 40, 217]);
      drawFooter(1);

      let y = 42;
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EXECUTIVE OVERVIEW', M, y);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text('High-level summary of current hospital capacity, predicted risks, and financial impact.', M, y + 5);
      
      pdf.setDrawColor(226, 232, 240);
      pdf.line(M, y + 9, W - M, y + 9);
      y += 15;

      const cardW = (W - M * 2 - 8) / 2;
      const cardH = 45;
      
      drawCard(M, y, cardW, cardH, 'Patients Boarding', String(currentBoarding), 'Patients currently admitted but waiting in the ED for an inpatient bed. High boarding indicates bottlenecked outflow.', [248, 250, 252], [15, 23, 42]);
      drawCard(M + cardW + 8, y, cardW, cardH, 'AI Risk Assessment', riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1), "FlowSense AI's prediction of operational failure risk based on incoming patient volume and discharge rates.", riskBgRGB, riskRGB);
      
      y += cardH + 8;
      
      const ttc = prediction?.time_to_critical;
      const ttcStr = ttc != null ? (ttc === 0 ? 'CRITICAL NOW' : Math.floor(ttc / 60) + 'h ' + Math.round(ttc % 60) + 'm') : '--';
      drawCard(M, y, cardW, cardH, 'Time to Critical', ttcStr, 'Estimated time remaining until the emergency department reaches critical capacity and requires diversion.', [248, 250, 252], [15, 23, 42]);
      drawCard(M + cardW + 8, y, cardW, cardH, 'Revenue Protection', '$' + (totalRevenue / 1000).toFixed(1) + 'k', 'Estimated revenue retained by implementing AI-recommended flow optimizations and preventing patient walkouts (24h).', [240, 253, 250], [15, 118, 110]);
      
      y += cardH + 20;

      // Chart
      if (prediction) {
        pdf.setFontSize(12);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.text('12-HOUR BOARDING FORECAST', M, y);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text('Predicted number of boarding patients at intervals over the next 12 hours based on historical trends.', M, y + 5);
        y += 10;

        const chartW = W - M * 2;
        const chartH = 60;
        const bars = [
          { label: 'Current', val: prediction.current_boarding },
          { label: '+4 Hours', val: prediction.predicted_boarding_4h },
          { label: '+6 Hours', val: prediction.predicted_boarding_6h },
          { label: '+8 Hours', val: prediction.predicted_boarding_8h },
          { label: '+12 Hours', val: prediction.predicted_boarding_12h },
        ];
        const maxVal = Math.max(...bars.map(b => b.val), 1);
        const barW = 24;
        const gap = (chartW - bars.length * barW) / (bars.length + 1);

        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(M, y, chartW, chartH + 22, 4, 4, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(M, y, chartW, chartH + 22, 4, 4, 'S');

        bars.forEach((bar, i) => {
          const bx = M + gap + i * (barW + gap);
          const bH = Math.max((bar.val / maxVal) * (chartH - 10), 4);
          const by = y + chartH - bH + 5;
          const isHigh = bar.val > 15;
          const isElev = bar.val > 10;
          const c = isHigh ? [239, 68, 68] : isElev ? [249, 115, 22] : [139, 92, 246];

          pdf.setFontSize(11);
          pdf.setTextColor(15, 23, 42);
          pdf.setFont('helvetica', 'bold');
          pdf.text(String(Math.round(bar.val)), bx + barW / 2, by - 3, { align: 'center' });

          pdf.setFillColor(c[0], c[1], c[2]);
          pdf.roundedRect(bx, by, barW, bH, 2, 2, 'F');

          pdf.setFontSize(7);
          pdf.setTextColor(100, 116, 139);
          pdf.setFont('helvetica', 'bold');
          pdf.text(bar.label, bx + barW / 2, y + chartH + 12, { align: 'center' });
        });

        y += chartH + 30;
        pdf.setFontSize(8);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Model Confidence: ' + Math.round(prediction.confidence_score * 100) + '%', W - M, y, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        
        pdf.setFillColor(139, 92, 246); pdf.rect(M, y-3, 4, 4, 'F');
        pdf.text('Normal', M + 6, y);
        pdf.setFillColor(249, 115, 22); pdf.rect(M + 24, y-3, 4, 4, 'F');
        pdf.text('Elevated (>10)', M + 30, y);
        pdf.setFillColor(239, 68, 68); pdf.rect(M + 56, y-3, 4, 4, 'F');
        pdf.text('Critical (>15)', M + 62, y);
      }

      // PAGE 2
      if (recommendations.length > 0) {
        pdf.addPage();
        drawHeader('AI Recommended Actions', 'Prioritized steps to mitigate risk and optimize patient flow', [16, 185, 129]);
        drawFooter(2);
        y = 42;

        pdf.setFillColor(240, 249, 255);
        pdf.roundedRect(M, y, W - M * 2, 20, 4, 4, 'F');
        pdf.setFillColor(59, 130, 246);
        pdf.roundedRect(M, y, 4, 20, 2, 2, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.text('How to read this section:', M + 8, y + 8);
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        pdf.text('The AI engine has analyzed current bottlenecks and suggests the following actions in order of maximum impact.', M + 8, y + 14);
        
        y += 28;

        let recPage = 2;
        recommendations.slice(0, 6).forEach((rec, i) => {
          if (y > H - 35) { pdf.addPage(); drawHeader('AI Recommended Actions', 'Continued', [16, 185, 129]); drawFooter(recPage); y = 42; recPage++; }
          const isTop = i === 0;
          const cH = 32;
          pdf.setFillColor(isTop ? 248 : 255, isTop ? 250 : 255, isTop ? 252 : 255);
          pdf.roundedRect(M, y, W - M * 2, cH, 4, 4, 'F');
          pdf.setDrawColor(isTop ? 186 : 226, isTop ? 230 : 232, isTop ? 253 : 240);
          pdf.roundedRect(M, y, W - M * 2, cH, 4, 4, 'S');

          if (isTop) { pdf.setFillColor(59, 130, 246); } else { pdf.setFillColor(241, 245, 249); }
          pdf.roundedRect(M + 6, y + 6, 12, 12, 3, 3, 'F');
          pdf.setFontSize(12);
          pdf.setTextColor(isTop ? 255 : 100, isTop ? 255 : 116, isTop ? 255 : 139);
          pdf.setFont('helvetica', 'bold');
          pdf.text(String(rec.priority_rank), M + 12, y + 14, { align: 'center' });

          pdf.setFontSize(10);
          pdf.setTextColor(15, 23, 42);
          pdf.setFont('helvetica', 'bold');
          pdf.text(rec.action_name, M + 22, y + 10);

          const revText = '+$' + rec.expected_revenue_protected.toLocaleString() + ' Protected';
          const patText = rec.expected_patients_helped + ' Patients Helped';
          const timeText = rec.expected_time_saved + 'h Saved';
          pdf.setFontSize(7);
          const patW = pdf.getTextWidth(patText) + 8;
          const revW = pdf.getTextWidth(revText) + 8;
          const timeW = pdf.getTextWidth(timeText) + 8;

          pdf.setFillColor(220, 252, 231);
          pdf.roundedRect(W - M - revW - patW - timeW - 14, y + 6, revW, 6, 3, 3, 'F');
          pdf.setTextColor(22, 101, 52);
          pdf.setFont('helvetica', 'bold');
          pdf.text(revText, W - M - revW - patW - timeW - 10, y + 10);

          pdf.setFillColor(224, 231, 255);
          pdf.roundedRect(W - M - patW - timeW - 10, y + 6, patW, 6, 3, 3, 'F');
          pdf.setTextColor(55, 48, 163);
          pdf.text(patText, W - M - patW - timeW - 6, y + 10);

          pdf.setFillColor(254, 243, 199);
          pdf.roundedRect(W - M - timeW - 6, y + 6, timeW, 6, 3, 3, 'F');
          pdf.setTextColor(146, 64, 14);
          pdf.text(timeText, W - M - timeW - 2, y + 10);

          pdf.setFontSize(8);
          pdf.setTextColor(71, 85, 105);
          pdf.setFont('helvetica', 'normal');
          const desc = rec.action_description;
          const maxW = W - M * 2 - 28;
          const words = desc.split(' ');
          let line = '';
          let lY = y + 18;
          words.forEach(word => {
            if (pdf.getTextWidth(line + ' ' + word) > maxW) { pdf.text(line, M + 22, lY); line = word; lY += 4.5; }
            else { line = line ? line + ' ' + word : word; }
          });
          if (line) pdf.text(line, M + 22, lY);
          
          y += cH + 8;
        });
      }

      // PAGE 3
      pdf.addPage();
      drawHeader('Operational Status', 'Real-time breakdown of hospital departments, staffing, and surgeries', [245, 158, 11]);
      drawFooter(totalPages);
      y = 40;

      if (status) {
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DEPARTMENT METRICS', M, y);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text('Current occupancy and wait times across key hospital departments.', M, y + 4);
        pdf.setDrawColor(226, 232, 240);
        pdf.line(M, y + 7, W - M, y + 7);
        y += 11;

        const mW = (W - M * 2 - 6) / 2;
        const mH = 18;
        const metrics = [
          { label: 'ED Bed Utilization', val: status.ed_beds_occupied + '/' + status.ed_beds_total, sub: 'Occupied vs Total Beds' },
          { label: 'Total Boarding', val: String(status.boarding_count), sub: 'Patients awaiting inpatient beds' },
          { label: 'PACU Occupancy', val: Math.round(status.pacu_occupancy * 100) + '%', sub: 'Post-Anesthesia Care Unit capacity' },
          { label: 'Average ER Wait', val: Math.round(status.ed_wait_time_avg) + 'm', sub: 'Time from arrival to rooming' },
          { label: 'Left Without Seen', val: String(status.patients_left_without_seen), sub: 'Patients who left before treatment' },
          { label: 'Discharge Ready', val: String(status.discharge_ready_count), sub: 'Cleared patients still occupying beds' },
          { label: 'Inpatient Census', val: status.inpatient_census + '/' + status.inpatient_beds_total, sub: 'Admitted patients vs total beds' },
          { label: 'Nurse-Patient Ratio', val: status.nurse_patient_ratio > 0 ? '1:' + status.nurse_patient_ratio.toFixed(1) : '--', sub: 'Staffing adequacy level' },
          { label: 'OR Delays', val: String(status.or_delays), sub: 'Surgical schedule delays today' },
          { label: 'Discharges Today', val: String(status.discharges_today), sub: 'Patients discharged so far' },
        ];
        metrics.forEach((m, i) => {
          const mx = M + (i % 2) * (mW + 6);
          const my = y + Math.floor(i / 2) * (mH + 4);
          pdf.setFillColor(248, 250, 252);
          pdf.roundedRect(mx, my, mW, mH, 3, 3, 'F');
          pdf.setDrawColor(226, 232, 240);
          pdf.roundedRect(mx, my, mW, mH, 3, 3, 'S');
          
          pdf.setFontSize(6);
          pdf.setTextColor(100, 116, 139);
          pdf.setFont('helvetica', 'bold');
          pdf.text(m.label.toUpperCase(), mx + 4, my + 6);
          
          pdf.setFontSize(14);
          pdf.setTextColor(15, 23, 42);
          pdf.text(m.val, mx + 4, my + 12);
          
          pdf.setFontSize(6);
          pdf.setTextColor(148, 163, 184);
          pdf.setFont('helvetica', 'normal');
          pdf.text(m.sub, mx + 4, my + 16);
        });
        y += Math.ceil(metrics.length / 2) * (mH + 4) + 6;
      }

      const halfW = (W - M * 2 - 6) / 2;
      let col2Y = y;
      
      if (staff.length > 0) {
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.text('STAFFING', M, y);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text('Current personnel availability.', M, y + 4);
        pdf.setDrawColor(226, 232, 240);
        pdf.line(M, y + 7, M + halfW, y + 7);
        let sy = y + 11;
        const sH = 15;
        const onDuty = staff.filter(s => s.is_on_duty).length;
        const offDuty = staff.filter(s => !s.is_on_duty).length;
        const otAvail = staff.filter(s => s.is_available_overtime).length;

        [{ l: 'On Duty', v: onDuty, bg: [248, 250, 252], tc: [15, 23, 42] },
         { l: 'Off Duty', v: offDuty, bg: [248, 250, 252], tc: [15, 23, 42] },
         { l: 'Available for Overtime', v: otAvail, bg: [240, 253, 250], tc: [15, 118, 110] }].forEach((item) => {
          pdf.setFillColor(item.bg[0], item.bg[1], item.bg[2]);
          pdf.roundedRect(M, sy, halfW, sH, 2, 2, 'F');
          pdf.setDrawColor(226, 232, 240);
          pdf.roundedRect(M, sy, halfW, sH, 2, 2, 'S');
          
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          pdf.setFont('helvetica', 'bold');
          pdf.text(item.l, M + 4, sy + 9);
          
          pdf.setFontSize(12);
          pdf.setTextColor(item.tc[0], item.tc[1], item.tc[2]);
          pdf.text(String(item.v), M + halfW - 4, sy + 10, { align: 'right' });
          sy += sH + 3;
        });
      }

      if (surgeries.length > 0) {
        const sx = M + halfW + 6;
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SURGERIES', sx, col2Y);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text('Daily surgical pipeline.', sx, col2Y + 4);
        pdf.setDrawColor(226, 232, 240);
        pdf.line(sx, col2Y + 7, sx + halfW, col2Y + 7);
        
        let sy = col2Y + 11;
        const sH = 24;
        const sW = (halfW - 3) / 2;
        const sData = [
          { label: 'SCHEDULED', val: String(surgeries.length), bg: [248, 250, 252], tc: [15, 23, 42] },
          { label: 'IN PROGRESS', val: String(surgeries.filter(s => s.status === 'in_progress').length), bg: [254, 252, 232], tc: [133, 77, 14] },
          { label: 'DELAYED', val: String(surgeries.filter(s => s.status === 'delayed').length), bg: [254, 242, 242], tc: [153, 27, 27] },
          { label: 'COMPLETED', val: String(surgeries.filter(s => s.status === 'completed').length), bg: [240, 253, 244], tc: [22, 101, 52] },
        ];
        sData.forEach((sd, i) => {
          const ax = sx + (i % 2) * (sW + 3);
          const ay = sy + Math.floor(i / 2) * (sH + 3);
          pdf.setFillColor(sd.bg[0], sd.bg[1], sd.bg[2]);
          pdf.roundedRect(ax, ay, sW, sH, 2, 2, 'F');
          pdf.setDrawColor(226, 232, 240);
          pdf.roundedRect(ax, ay, sW, sH, 2, 2, 'S');
          
          pdf.setFontSize(5);
          pdf.setTextColor(100, 116, 139);
          pdf.setFont('helvetica', 'bold');
          pdf.text(sd.label, ax + sW / 2, ay + 8, { align: 'center' });
          pdf.setFontSize(14);
          pdf.setTextColor(sd.tc[0], sd.tc[1], sd.tc[2]);
          pdf.text(sd.val, ax + sW / 2, ay + 17, { align: 'center' });
        });
        
        y += 65;
      }

      if (surgeries.length > 0) {
        y += 8;
        if (y > H - 50) { pdf.addPage(); drawHeader('Operational Status', 'Continued', [245, 158, 11]); drawFooter(3); y = 42; }
        
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.text('RECENT SURGERIES', M, y);
        y += 4;
        pdf.setDrawColor(226, 232, 240);
        pdf.line(M, y, W - M, y);
        y += 4;

        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(M, y, W - M * 2, 7, 2, 2, 'F');
        pdf.setFontSize(6);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PATIENT ID', M + 4, y + 5);
        pdf.text('PROCEDURE', M + 35, y + 5);
        pdf.text('STATUS', M + 115, y + 5);
        pdf.text('SURGEON', M + 145, y + 5);
        y += 7;

        surgeries.slice(0, 4).forEach((s, i) => { // Limited to 4 rows to ensure single-page fit
          if (y > H - 15) return;
          if (i % 2 === 0) { pdf.setFillColor(249, 250, 251); pdf.rect(M, y, W - M * 2, 7.5, 'F'); }
          pdf.setFontSize(7);
          pdf.setTextColor(15, 23, 42);
          pdf.setFont('helvetica', 'bold');
          pdf.text('#' + s.patient_id, M + 4, y + 5);
          
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(71, 85, 105);
          pdf.text(s.procedure_type.substring(0, 45), M + 35, y + 5);

          const stColors: Record<string, number[]> = { delayed: [254, 242, 242], in_progress: [254, 252, 232], completed: [240, 253, 244] };
          const stTxt: Record<string, number[]> = { delayed: [220, 38, 38], in_progress: [202, 138, 4], completed: [22, 163, 74] };
          const sbg = stColors[s.status] || [239, 246, 255];
          const stc = stTxt[s.status] || [37, 99, 235];
          const statusText = s.status.replace('_', ' ').toUpperCase();
          
          pdf.setFontSize(5);
          const stW = pdf.getTextWidth(statusText) + 8;
          pdf.setFillColor(sbg[0], sbg[1], sbg[2]);
          pdf.roundedRect(M + 115, y + 1.5, stW, 4.5, 2, 2, 'F');
          pdf.setTextColor(stc[0], stc[1], stc[2]);
          pdf.setFont('helvetica', 'bold');
          pdf.text(statusText, M + 119, y + 4.5);

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(71, 85, 105);
          pdf.setFontSize(7);
          pdf.text(s.surgeon_name || '', M + 145, y + 5);
          y += 7.5;
        });
        
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(M, y - (surgeries.slice(0, 4).length * 7.5) - 7, W - M * 2, (surgeries.slice(0, 4).length * 7.5) + 7, 2, 2, 'S');
      }

      pdf.save('FlowSense-Report-' + now.toISOString().slice(0, 10) + '.pdf');
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generateReport}
      disabled={isGenerating}
      className="flex items-center gap-2 px-3 py-2 glass rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
    >
      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      <span className="text-sm hidden sm:inline">Export PDF</span>
    </button>
  );
}
