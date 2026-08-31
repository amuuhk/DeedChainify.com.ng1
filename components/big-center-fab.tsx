'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldCheck, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BigCenterFAB({
  onPrivate,
  onPublic,
}: {
  onPrivate: () => void;
  onPublic: () => void;
}) {
  const [open, setOpen] = useState(false);

  function handleSelect(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-6 py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
        aria-label="Onboard new property"
      >
        <PlusCircle size={28} />
        <span className="hidden sm:inline">Onboard Property</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-jakarta text-xl">Onboard a Property</DialogTitle>
            <DialogDescription>Choose how you want to list this property</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <button
              onClick={() => handleSelect(onPrivate)}
              className="flex w-full items-center gap-4 rounded-xl border-2 border-border/60 p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck size={28} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-jakarta text-lg font-bold">Private Onboarding</p>
                <p className="text-sm text-muted-foreground">
                  Geo-tier pricing &middot; N10,000 - N50,000
                </p>
              </div>
            </button>

            <button
              onClick={() => handleSelect(onPublic)}
              className="flex w-full items-center gap-4 rounded-xl border-2 border-border/60 p-4 text-left transition-all hover:border-secondary hover:bg-secondary/5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10">
                <Eye size={28} className="text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-jakarta text-lg font-bold">Public Listing</p>
                <p className="text-sm text-muted-foreground">Free &middot; Anyone can scan to verify</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
