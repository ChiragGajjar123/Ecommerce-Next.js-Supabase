import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CollectionsLoading() {
  return (
    <div className="w-full py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 flex flex-col items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="relative aspect-[4/5] w-full rounded-xl overflow-hidden border border-border p-6 flex flex-col justify-end bg-card">
            <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
            <div className="relative z-10 flex flex-col gap-2">
              <Skeleton className="h-5 w-1/2 bg-foreground/10" />
              <Skeleton className="h-4 w-full bg-foreground/10" />
              <Skeleton className="h-4 w-3/4 bg-foreground/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
