'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, Wallet, Users, Loader2, ArrowDownToLine,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import type { Agent, Property, Payment } from '@/lib/supabase/client';
import { SiteHeader } from '@/components/site-header';
import { formatNaira } from '@/lib/dcid';

export default function AgentDashboard() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [clientProperties, setClientProperties] = useState<Property[]>([]);
  const [earnings, setEarnings] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .maybeSingle();
      setAgent(agentData as Agent | null);

      const { data: propData } = await supabase
        .from('properties')
        .select('*')
        .neq('landlord_id', null)
        .order('created_at', { ascending: false });
      setClientProperties(propData as Property[] || []);

      const { data: payData } = await supabase
        .from('payments')
        .select('*')
        .eq('type', 'PRIVATE_ONBOARD')
        .order('created_at', { ascending: false })
        .limit(10);
      setEarnings(payData as Payment[] || []);

      setLoading(false);
    }
    fetch();
  }, []);

  function withdraw() {
    toast.success('Withdrawal requested', {
      description: 'Funds will be sent to your bank account within 24 hours',
    });
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

  const totalCommission = earnings.reduce((sum, p) => sum + Math.round(p.amount * 0.10), 0);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-jakarta text-2xl font-bold">Agent Portal</h1>
            <p className="text-sm text-muted-foreground">
              {agent?.type === 'barrister' ? 'Barrister' : 'Landlord'} &middot; Commission tracking
            </p>
          </div>
          <Button onClick={withdraw} disabled={totalCommission === 0}>
            <ArrowDownToLine size={16} className="mr-2" />
            Withdraw
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Commission Earned', value: formatNaira(totalCommission), icon: Wallet, color: 'text-primary' },
            { label: 'Total Clients', value: clientProperties.length, icon: Users, color: 'text-blue-600' },
            { label: 'Agent Type', value: agent?.type || 'landlord', icon: TrendingUp, color: 'text-secondary' },
            { label: 'Commission Rate', value: '10%', icon: TrendingUp, color: 'text-green-600' },
          ].map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4">
                <s.icon size={20} className={s.color} />
                <p className="mt-2 font-jakarta text-xl font-bold capitalize">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-jakarta text-lg">My Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {clientProperties.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Users size={32} className="text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No clients yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientProperties.slice(0, 10).map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div>
                        <p className="text-sm font-medium">{p.dc_title}</p>
                        <p className="text-xs text-muted-foreground">{p.owner_name}</p>
                      </div>
                      <Badge variant="outline">{p.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-jakarta text-lg">Commission History</CardTitle>
            </CardHeader>
            <CardContent>
              {earnings.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Wallet size={32} className="text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No earnings yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {earnings.map((e) => (
                    <div key={e.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div>
                        <p className="text-sm font-medium">{e.dc_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-semibold text-sm text-primary">
                        +{formatNaira(Math.round(e.amount * 0.10))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
