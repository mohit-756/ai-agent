import React from 'react';

export const SkeletonChart: React.FC = () => {
  return (
    <div className="bg-[#12182B] border border-white/[0.08] rounded-[24px] p-6 shadow-md space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-[#1A2238] rounded-md" />
          <div className="h-3 w-48 bg-[#1A2238]/60 rounded-md" />
        </div>
        <div className="h-6 w-20 bg-[#1A2238] rounded-xl" />
      </div>

      <div className="h-64 w-full bg-[#0B1020]/60 rounded-2xl flex items-end justify-between p-4 space-x-3">
        <div className="h-1/3 w-full bg-[#1A2238]/40 rounded-t-lg" />
        <div className="h-2/3 w-full bg-[#1A2238]/60 rounded-t-lg" />
        <div className="h-1/2 w-full bg-[#1A2238]/40 rounded-t-lg" />
        <div className="h-4/5 w-full bg-[#1A2238]/80 rounded-t-lg" />
        <div className="h-3/5 w-full bg-[#1A2238]/50 rounded-t-lg" />
        <div className="h-full w-full bg-[#7C3AED]/20 rounded-t-lg" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC = () => {
  return (
    <div className="bg-[#12182B] border border-white/[0.08] rounded-[24px] p-6 shadow-md space-y-4 animate-pulse">
      <div className="flex items-center justify-between pb-2">
        <div className="h-4 w-40 bg-[#1A2238] rounded-md" />
        <div className="h-4 w-24 bg-[#1A2238]/60 rounded-md" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-[#0B1020]/60 rounded-2xl p-3 flex items-center justify-between border border-[#24304A]/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#1A2238]" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 bg-[#1A2238] rounded" />
                <div className="h-2.5 w-16 bg-[#1A2238]/60 rounded" />
              </div>
            </div>
            <div className="h-4 w-20 bg-[#1A2238] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
