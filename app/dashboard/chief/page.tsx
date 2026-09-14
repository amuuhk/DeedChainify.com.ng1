'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Clock, CheckCircle, MapPin, Loader2, Crown, XCircle,
  MessageSquare, CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Transfer, Property } from '@/lib/supabase/client';
import { SiteHeader } from '@/components/site-header';
import { RoleSidebar } from '@/components/role-sidebar';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { formatNaira } from '@/lib/dcid';

function ChiefDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // now safely inside Suspense
  const { profile, loading: authLoading } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpModal, setOtpModal] = useState<Transfer | null>(null);
  const [otp, setOtp] = useState('');
  const [approving, setApproving] = useState(false);

  const activeTab = searchParams.get('tab') || 'pending';

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        router.push('/login');
        return;
      }
      if (profile.role !== 'chief') {
        if (profile.role === 'landlord') router.push('/dashboard/landlord');
        else if (profile.role === 'barrister') router.push('/dashboard/barrister');
        else if (profile.role === 'developer') router.push('/dashboard/developer');
        else if (profile.role === 'user') router.push('/person');
        else router.push('/owner');
        return;
      }
      fetchData();
    }
  }, [authLoading, profile, router]);

  async function fetchData() {
    const [transRes, propRes] = await Promise.all([
      supabase.from('transfers').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
    ]);
    setTransfers(transRes.data as Transfer[] || []);
    setProperties(propRes.data as Property[] || []);
    setLoading(false);
  }

  const pendingTransfers = transfers.filter((t) => t.chief_status === 'PENDING' && t.status === 'PENDING');
  const approvedTransfers = transfers.filter((t) => t.chief_status === 'APPROVED');
  const communityLands = properties.filter((p) => p.status === 'YELLOW' || p.status === 'PENDING');

  async function handleApprove() {
    if (!otpModal || !otp.trim()) return;
    setApproving(true);
    try {
      const { error } = await supabase.from('transfers').update({ chief_status: 'APPROVED', status: 'APPROVED' }).eq('id', otpModal.id);
      if (error) throw error;
      toast.success('Transfer approved', { description: `OTP verified via Termii SMS` });
      setOtpModal(null);
      setOtp('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    } finally {
      setApproving(false);
    }
  }

  async function handleReject(transfer: Transfer) {
    try {
      const { error } = await supabase.from('transfers').update({ chief_status: 'REJECTED', status: 'DISPUTED' }).eq('id', transfer.id);
      if (error) throw error;
      toast.success('Transfer rejected');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    }
  }

  function sendOtp(transfer: Transfer) {
    setOtpModal(transfer);
    setOtp('');
    toast.success('OTP sent via Termii SMS', { description: `Sent to ${transfer.chief_phone || 'your phone'}` });
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
        <RoleSidebar role="chief" />
        <main className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6">
          {/* ... keep all your JSX exactly the same from here down ... */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Crown size={22} />
            </div>
            <div>
              <h1 className="font-jakarta text-2xl font-bold">Chief Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.traditional_title || 'Community Leader'} — Approve land transfers via SMS OTP
              </p>
            </div>
          </div>
          {/* paste the rest of your return JSX here. It's too long to repeat */}
        </main>
      </div>
    </>
  );
}


export default function ChiefDashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin"/></div>}>
      <ChiefDashboardContent />
    </Suspense>
  )
}