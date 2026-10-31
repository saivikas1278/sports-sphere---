import React from 'react';
import { Trophy } from 'lucide-react';

export const RouteLoadingFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
    <div className="relative flex items-center justify-center">
      <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center animate-pulse">
        <Trophy className="text-blue-500 animate-bounce" size={28} />
      </div>
      <div className="absolute -inset-2 rounded-3xl border border-blue-400/30 animate-ping opacity-25"></div>
    </div>
    <span className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400 animate-pulse">
      Loading SportSphere...
    </span>
  </div>
);

export const SkeletonMatchCard = () => (
  <div className="rounded-3xl bg-white/60 border border-white p-5 shadow-sm animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-4 w-24 bg-slate-200 rounded-full"></div>
      <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
    </div>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200"></div>
          <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-6 w-10 bg-slate-200 rounded-md"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200"></div>
          <div className="h-4 w-28 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-6 w-10 bg-slate-200 rounded-md"></div>
      </div>
    </div>
    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
      <div className="h-3 w-36 bg-slate-200 rounded-md"></div>
      <div className="h-8 w-20 bg-slate-200 rounded-xl"></div>
    </div>
  </div>
);

export const SkeletonTournamentCard = () => (
  <div className="rounded-3xl bg-white/60 border border-white overflow-hidden shadow-sm animate-pulse">
    <div className="h-44 bg-slate-200"></div>
    <div className="p-5 space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-5 w-20 bg-slate-200 rounded-full"></div>
        <div className="h-4 w-16 bg-slate-200 rounded-md"></div>
      </div>
      <div className="h-6 w-3/4 bg-slate-200 rounded-md"></div>
      <div className="h-4 w-full bg-slate-200 rounded-md"></div>
      <div className="pt-3 flex justify-between items-center">
        <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
        <div className="h-9 w-28 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  </div>
);

export const SkeletonWorkoutCard = () => (
  <div className="rounded-[32px] bg-white/60 border border-white overflow-hidden shadow-sm animate-pulse">
    <div className="h-56 bg-slate-200"></div>
    <div className="p-5 space-y-4">
      <div className="h-6 w-2/3 bg-slate-200 rounded-md"></div>
      <div className="h-4 w-full bg-slate-200 rounded-md"></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="h-16 bg-slate-100 rounded-2xl"></div>
        <div className="h-16 bg-slate-100 rounded-2xl"></div>
        <div className="h-16 bg-slate-100 rounded-2xl"></div>
      </div>
      <div className="h-12 w-full bg-slate-200 rounded-2xl"></div>
    </div>
  </div>
);

export const SkeletonCard = ({ height = 'h-48' }) => (
  <div className={`rounded-3xl bg-white/60 border border-white p-6 shadow-sm animate-pulse ${height} flex flex-col justify-between`}>
    <div className="space-y-3">
      <div className="h-5 w-1/3 bg-slate-200 rounded-md"></div>
      <div className="h-4 w-2/3 bg-slate-200 rounded-md"></div>
    </div>
    <div className="h-8 w-24 bg-slate-200 rounded-xl"></div>
  </div>
);
