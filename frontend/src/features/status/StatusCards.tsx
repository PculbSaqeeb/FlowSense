'use client';

import React from 'react';
import { 
  Activity, Users, Clock, AlertTriangle, 
  Bed, Heart, Stethoscope, TrendingUp 
} from 'lucide-react';
import { Skeleton, SkeletonBar } from '@/shared/components';
import type { StatusCardsProps } from '@/shared/types';

export const StatusCards = React.memo(function StatusCards({ status, isLoading }: StatusCardsProps) {
  if (isLoading || !status) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-1/3 mb-2" />
            <Skeleton className="h-3 w-2/3" />
            <SkeletonBar className="mt-2 h-1 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'ER Beds Used',
      value: `${status.ed_beds_occupied}/${status.ed_beds_total}`,
      percentage: status.ed_beds_total > 0 ? (status.ed_beds_occupied / status.ed_beds_total) * 100 : 0,
      icon: Bed,
      color: status.ed_beds_occupied > 27 ? 'text-red-400' : status.ed_beds_occupied > 24 ? 'text-orange-400' : 'text-green-400',
      bgColor: status.ed_beds_occupied > 27 ? 'bg-red-500/10' : status.ed_beds_occupied > 24 ? 'bg-orange-500/10' : 'bg-green-500/10',
      alert: status.ed_beds_occupied > 24,
      alertColor: status.ed_beds_occupied > 27 ? 'bg-red-500' : 'bg-orange-500',
      subtitle: status.ed_beds_occupied > 27 ? 'Almost full' : status.ed_beds_occupied > 24 ? 'Getting crowded' : 'Room available',
    },
    {
      title: 'Patients Waiting',
      value: status.boarding_count.toString(),
      subtitle: status.boarding_count > 15 ? 'Too many waiting' : status.boarding_count > 10 ? 'Moderate wait' : 'Under control',
      icon: AlertTriangle,
      color: status.boarding_count > 15 ? 'text-red-400' : status.boarding_count > 10 ? 'text-orange-400' : 'text-green-400',
      bgColor: status.boarding_count > 15 ? 'bg-red-500/10' : status.boarding_count > 10 ? 'bg-orange-500/10' : 'bg-green-500/10',
      alert: status.boarding_count > 10,
      alertColor: status.boarding_count > 15 ? 'bg-red-500' : 'bg-orange-500',
    },
    {
      title: 'Recovery Room',
      value: `${Math.round(status.pacu_occupancy * 100)}%`,
      subtitle: status.pacu_occupancy > 0.9 ? 'No beds free' : status.pacu_occupancy > 0.8 ? 'Very busy' : 'Room available',
      icon: Activity,
      color: status.pacu_occupancy > 0.9 ? 'text-red-400' : status.pacu_occupancy > 0.7 ? 'text-orange-400' : 'text-green-400',
      bgColor: status.pacu_occupancy > 0.9 ? 'bg-red-500/10' : status.pacu_occupancy > 0.7 ? 'bg-orange-500/10' : 'bg-green-500/10',
      alert: status.pacu_occupancy > 0.8,
      alertColor: status.pacu_occupancy > 0.9 ? 'bg-red-500' : 'bg-orange-500',
    },
    {
      title: 'Nurse Load',
      value: `${status.nurse_patient_ratio.toFixed(0)} each`,
      subtitle: status.nurse_patient_ratio > 6 ? 'Overwhelmed — too many patients' : status.nurse_patient_ratio > 5 ? 'Busy but managing' : 'Good — patients well covered',
      icon: Users,
      color: status.nurse_patient_ratio > 6 ? 'text-red-400' : status.nurse_patient_ratio > 5 ? 'text-orange-400' : 'text-green-400',
      bgColor: status.nurse_patient_ratio > 6 ? 'bg-red-500/10' : status.nurse_patient_ratio > 5 ? 'bg-orange-500/10' : 'bg-green-500/10',
      alert: status.nurse_patient_ratio > 5,
      alertColor: status.nurse_patient_ratio > 6 ? 'bg-red-500' : 'bg-orange-500',
    },
    {
      title: 'Avg Wait',
      value: `${Math.round(status.ed_wait_time_avg)} min`,
      subtitle: status.ed_wait_time_avg > 60 ? 'Patients waiting too long' : status.ed_wait_time_avg > 45 ? 'Above target' : 'On target',
      icon: Clock,
      color: status.ed_wait_time_avg > 60 ? 'text-red-400' : status.ed_wait_time_avg > 45 ? 'text-orange-400' : 'text-green-400',
      bgColor: status.ed_wait_time_avg > 60 ? 'bg-red-500/10' : status.ed_wait_time_avg > 45 ? 'bg-orange-500/10' : 'bg-green-500/10',
      alert: status.ed_wait_time_avg > 45,
      alertColor: status.ed_wait_time_avg > 60 ? 'bg-red-500' : 'bg-orange-500',
    },
    {
      title: 'Sent Home',
      value: status.discharges_today.toString(),
      subtitle: `${status.discharge_ready_count} ready to go`,
      icon: Heart,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10',
      alert: false,
      alertColor: '',
    },
    {
      title: 'Surgery Delays',
      value: status.or_delays.toString(),
      subtitle: status.or_delays > 0 ? 'Behind schedule' : 'On track',
      icon: Stethoscope,
      color: status.or_delays > 2 ? 'text-red-400' : status.or_delays > 0 ? 'text-orange-400' : 'text-green-400',
      bgColor: status.or_delays > 2 ? 'bg-red-500/10' : status.or_delays > 0 ? 'bg-orange-500/10' : 'bg-green-500/10',
      alert: status.or_delays > 0,
      alertColor: status.or_delays > 2 ? 'bg-red-500' : 'bg-orange-500',
    },
    {
      title: 'Surgeries Today',
      value: status.surgeries_scheduled.toString(),
      subtitle: `${Math.max(0, status.surgeries_scheduled - status.or_delays)} on track`,
      icon: TrendingUp,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10',
      alert: false,
      alertColor: '',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`glass rounded-xl p-4 hover:bg-white/10 transition-all duration-200 relative`}
        >
          {card.alert && (
            <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${card.alertColor} animate-pulse`} />
          )}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">{card.title}</span>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          {card.subtitle && (
            <div className="text-xs text-gray-500 mt-1">{card.subtitle}</div>
          )}
          {card.percentage !== undefined && (
            <div className="mt-2">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    card.percentage > 90 ? 'bg-red-500' : 
                    card.percentage > 80 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, card.percentage)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
