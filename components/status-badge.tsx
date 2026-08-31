'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Banknote } from 'lucide-react';
import { getStatusConfig } from '@/lib/dcid';
import { cn } from '@/lib/utils';

export function StatusBadge({
  status,
  isPledged,
  bankName,
  className,
}: {
  status: string;
  isPledged?: boolean;
  bankName?: string | null;
  className?: string;
}) {
  const config = getStatusConfig(status, isPledged, bankName);

  const icons: Record<string, typeof CheckCircle> = {
    CheckCircle,
    Clock,
    AlertTriangle,
    Banknote,
  };

  const Icon = icons[config.icon] || Clock;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
        config.bg,
        config.color,
        className,
      )}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}
