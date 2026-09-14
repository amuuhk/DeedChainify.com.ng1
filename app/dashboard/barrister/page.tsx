'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Scale, ShieldCheck, FileText, Wallet, Loader2, CheckCircle,
  Clock, Gavel, Download,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Transfer, Property, Payment } from '@/lib/supabase/client';
import { SiteHeader } from '@/components/site-header';
import { RoleSidebar } from '@/components/role-sidebar';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { formatNaira, generateBarristerId } from '@/lib/dcid';

function BarristerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // now safe inside Suspense
  const { profile, loading: authLoading } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [barristerId, setBarristerId] = useState<string>('');

  const activeTab = searchParams.get('tab') || 'cases';

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        router.push('/login');
        return;
      }
      if (profile.role !== 'barrister') {
        router.push('/owner');
        return;
      }
      fetchData();
      generateId();
    }
  }, [authLoading, profile, router]);

  async function generateId() {
    if (!profile) return;
    try {
      const { count: barristerCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'barrister');
      const id = generateBarristerId(profile.state || 'Kano', (barristerCount || 0) + 1);
      setBarristerId(id);
    } catch (err) {
      console.error('Failed to generate barrister ID');
    }
  }

  async function fetchData() {
    const [transRes, propRes, payRes] = await Promise.all([
      supabase.from('transfers').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    setTransfers(transRes.data as Transfer[] || []);
    setProperties(propRes.data as Property[] || []);
    setPayments(payRes.data as Payment[] || []);
    setLoading(false);
  }

  const assignedCases = transfers.filter((t) => t.barrister_name);
  const pendingCases = assignedCases.filter((t) => t.status === 'PENDING');
  const verifiedDocs = properties.filter((p) => p.status === 'GREEN' || p.status === 'VERIFIED');
  const legalFees = payments.filter((p) => p.type === 'LEGAL_FEE' || p.type === 'PRIVATE_ONBOARD');
  const totalFees = legalFees.reduce((sum, p) => sum + Math.round(p.amount * 0.05), 0);

  async function generateDeed(transfer: Transfer) {
    toast.success('Deed of Assignment generated', {
      description: `Document for transfer ${transfer.transfer_id} is ready for download`,
    });
  }

  async function verifyDocument(prop: Property) {
    try {
      const { error } = await supabase.from('properties').update({ status: 'GREEN' }).eq('id', prop.id);
      if (error) throw error;
      toast.success('Document verified', { description: prop.dc_title });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify');
    }
  }

  if (authLoading || loading) {
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
      <div className="flex">
        <RoleSidebar role="barrister" />
        <main className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6">
          {/* KEEP ALL YOUR EXISTING JSX HERE - IT'S THE SAME */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Gavel size={22} />
            </div>
            <div>
              <h1 className="font-jakarta text-2xl font-bold">Barrister Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {barristerId && <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded mr-2">{barristerId}</span>}
                {profile?.bar_id || 'NBA Member'} — Verify documents and generate Deeds of Assignment
              </p>
            </div>
          </div>
          
          {/* ... paste the rest of your return JSX here ... */}
        </main>
      </div>
    </>
  );
}

export default function BarristerDashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin"/></div>}>
      <BarristerDashboardContent />
    </Suspense>
  )
}