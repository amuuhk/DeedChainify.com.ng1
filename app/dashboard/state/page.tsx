'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Wallet, CheckCircle, Clock, Download, Loader2, MapPin,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Property, Payment } from '@/lib/supabase/client';
import { SiteHeader } from '@/components/site-header';
import { StatusBadge } from '@/components/status-badge';
import { formatNaira } from '@/lib/dcid';

export default function StateDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [propRes, payRes] = await Promise.all([
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*'),
      ]);
      setProperties(propRes.data as Property[] || []);
      setPayments(payRes.data as Payment[] || []);
      setLoading(false);
    }
    fetch();
  }, []);

  const govtRevenue = payments
    .filter((p) => p.type === 'PRIVATE_ONBOARD')
    .reduce((sum, p) => sum + Math.round(p.amount * 0.20), 0);

  const pendingApproval = properties.filter((p) => p.status === 'YELLOW');
  const verified = properties.filter((p) => p.status === 'GREEN' || p.status === 'VERIFIED');

  function exportCSV() {
    const headers = ['DC Title', 'Owner', 'State', 'LGA', 'Size (sqm)', 'Status', 'Created'];
    const rows = properties.map((p) => [
      p.dc_title, p.owner_name || '', p.state, p.lga, p.size_sqm, p.status, p.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'properties.csv';
    a.click();
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-jakarta text-2xl font-bold">State Government Portal</h1>
            <p className="text-sm text-muted-foreground">Revenue tracking, property approval, CSV export</p>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Govt Revenue (20%)', value: formatNaira(govtRevenue), icon: Wallet, color: 'text-primary' },
            { label: 'Total Properties', value: properties.length, icon: Building2, color: 'text-blue-600' },
            { label: 'Pending Approval', value: pendingApproval.length, icon: Clock, color: 'text-yellow-600' },
            { label: 'Verified', value: verified.length, icon: CheckCircle, color: 'text-green-600' },
          ].map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4">
                <s.icon size={20} className={s.color} />
                <p className="mt-2 font-jakarta text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {pendingApproval.length > 0 && (
          <Card className="mt-6 border-2 border-yellow-300 bg-yellow-50">
            <CardHeader>
              <CardTitle className="font-jakarta text-lg text-yellow-800">
                Pending Chief Approval ({pendingApproval.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingApproval.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-yellow-300 bg-white p-3">
                    <div>
                      <p className="text-sm font-medium">{p.dc_title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} />
                        {p.layout_name}, {p.lga}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6 border-border/60">
          <CardHeader>
            <CardTitle className="font-jakarta text-lg">All Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {properties.slice(0, 20).map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div>
                    <p className="text-sm font-medium">{p.dc_title}</p>
                    <p className="text-xs text-muted-foreground">{p.owner_name} &middot; {p.lga}, {p.state}</p>
                  </div>
                  <StatusBadge status={p.status} isPledged={p.is_pledged} bankName={p.bank_name} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
