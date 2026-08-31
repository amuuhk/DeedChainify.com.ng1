'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Eye, Lock, Maximize, Building } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { formatNaira, PLOT_TYPE_LABELS } from '@/lib/dcid';
import type { Property } from '@/lib/supabase/client';

export function PropertyCard({ property }: { property: Property }) {
  const plotLabel = PLOT_TYPE_LABELS[property.plot_type] || 'Residential';

  return (
    <Card className="group overflow-hidden border-border/60 transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building size={12} />
              {plotLabel}
            </div>
            <h3 className="mt-1 font-jakarta text-base font-bold leading-tight">
              {property.dc_title}
            </h3>
          </div>
          <StatusBadge
            status={property.status}
            isPledged={property.is_pledged}
            bankName={property.bank_name}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Owner</p>
            <p className="font-medium truncate">{property.owner_name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Size</p>
            <p className="font-medium">{property.size_sqm} sqm</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="flex items-center gap-1 font-medium">
              <MapPin size={12} className="text-primary" />
              {property.layout_name}, {property.lga}, {property.state}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/verify/${property.dc_title}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye size={14} className="mr-1.5" />
              Public Scan
            </Button>
          </Link>
          <Link href={`/owner/${property.dc_title}`} className="flex-1">
            <Button size="sm" className="w-full">
              <Lock size={14} className="mr-1.5" />
              Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
