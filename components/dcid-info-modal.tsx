'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

export function DCIDInfoModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Info className="mr-2 h-4 w-4" />
          What is DCID?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Understanding DCID (Digital Chain ID)</DialogTitle>
          <DialogDescription>
            Your unique lifetime identifier for property ownership in Nigeria
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">What is a DCID?</h3>
            <p className="text-muted-foreground">
              A DCID is like a BVN for property - a unique identifier that stays with you forever 
              and is used for all your property transactions on DeedChainify.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">DCID Format</h3>
            <code className="bg-muted px-2 py-1 rounded">DC-STATE-YEAR-SEQUENCE</code>
            <p className="text-muted-foreground mt-2">
              Example: <code className="bg-muted px-2 py-1 rounded">DC-KN-2024-000123</code>
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Role-Specific IDs</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Users:</strong> DC-STATE-YEAR-SEQUENCE</li>
              <li><strong>Landlords:</strong> DC-LL-STATE-SEQUENCE</li>
              <li><strong>Barristers:</strong> DC-BRR-STATE-SEQUENCE</li>
              <li><strong>Developers:</strong> DC-RE-STATE-SEQUENCE</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Onboarding Fees</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted p-2 rounded">
                <div className="font-semibold">Tier 1</div>
                <div className="text-xs text-muted-foreground">Urban</div>
                <div className="font-bold text-green-600">₦50,000</div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="font-semibold">Tier 2</div>
                <div className="text-xs text-muted-foreground">City</div>
                <div className="font-bold text-yellow-600">₦25,000</div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="font-semibold">Tier 3</div>
                <div className="text-xs text-muted-foreground">Rural</div>
                <div className="font-bold text-blue-600">₦10,000</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}