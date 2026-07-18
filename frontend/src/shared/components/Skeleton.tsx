'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-white/10 rounded ${className}`}
        />
      ))}
    </>
  );
}

export function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/10 rounded-lg ${className}`} />
  );
}
