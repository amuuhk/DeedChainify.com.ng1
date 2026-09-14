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
import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PropertyStatusGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <HelpCircle className="mr-2 h-4 w-4" />
          Status Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Property Status Guide</DialogTitle>
          <DialogDescription>
            Understanding the different property verification statuses
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Badge className="bg-green-600">VERIFIED</Badge>
            <div>
              <p className="font-semibold">Government-Approved</p>
              <p className="text-sm text-muted-foreground">
                This property has been fully verified and approved by government authorities
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge className="bg-yellow-600">WAITING</Badge>
            <div>
              <p className="font-semibold">Chief Approval Pending</p>
              <p className="text-sm text-muted-foreground">
                Awaiting approval from the community leader (Chief) via SMS
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge className="bg-gray-600">PENDING</Badge>
            <div>
              <p className="font-semibold">Verification in Progress</p>
              <p className="text-sm text-muted-foreground">
                Property is currently being verified by the system
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge className="bg-red-600">DISPUTED</Badge>
            <div>
              <p className="font-semibold">Contested Title</p>
              <p className="text-sm text-muted-foreground">
                The property title has been disputed and requires resolution
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge className="bg-blue-600">COLLATERAL</Badge>
            <div>
              <p className="font-semibold">Bank Collateral</p>
              <p className="text-sm text-muted-foreground">
                Property is pledged to a bank as loan collateral
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}