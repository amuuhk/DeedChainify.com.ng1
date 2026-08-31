'use client';

import { useEffect, useState } from 'react';
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

export default function ChiefDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      // Strict role check for chief
      if (profile.role !== 'chief') {
        // Redirect to appropriate dashboard based on role
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
      const { error } = await supabase
        .from('transfers')
        .update({ chief_status: 'APPROVED', status: 'APPROVED' })
        .eq('id', otpModal.id);

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
      const { error } = await supabase
        .from('transfers')
        .update({ chief_status: 'REJECTED', status: 'DISPUTED' })
        .eq('id', transfer.id);

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

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Pending Approvals', value: pendingTransfers.length, icon: Clock, color: 'text-yellow-600' },
              { label: 'Approved', value: approvedTransfers.length, icon: CheckCircle, color: 'text-green-600' },
              { label: 'Community Lands', value: communityLands.length, icon: MapPin, color: 'text-blue-600' },
              { label: 'Total Transfers', value: transfers.length, icon: Crown, color: 'text-primary' },
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

          {/* Tab content */}
          <div className="mt-8">
            {activeTab === 'history' ? (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-jakarta text-lg flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    Approved History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {approvedTransfers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No approved transfers yet</p>
                  ) : (
                    <div className="space-y-2">
                      {approvedTransfers.map((t) => (
                        <div key={t.id} className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 p-3">
                          <div>
                            <p className="text-sm font-medium">Transfer: {t.transfer_id}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.seller_name} → {t.buyer_name} &middot; {t.dc_title || '-'}
                            </p>
                          </div>
                          <Badge className="border-green-300 text-green-700" variant="outline">APPROVED</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : activeTab === 'lands' ? (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-jakarta text-lg flex items-center gap-2">
                    <MapPin size={18} className="text-blue-600" />
                    Community Lands
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {communityLands.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No community lands recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {communityLands.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                          <div>
                            <p className="text-sm font-medium">{p.dc_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.owner_name} &middot; {p.layout_name}, {p.lga}, {p.state}
                            </p>
                          </div>
                          <Badge variant="secondary">{p.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-jakarta text-lg flex items-center gap-2">
                    <Clock size={18} className="text-yellow-600" />
                    Pending Approvals ({pendingTransfers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingTransfers.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <CheckCircle size={32} className="text-green-600" />
                      <p className="mt-2 text-sm text-muted-foreground">No pending approvals</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingTransfers.map((t) => (
                        <div key={t.id} className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Transfer: {t.transfer_id}</p>
                              <p className="text-xs text-muted-foreground">
                                Seller: {t.seller_name} ({t.seller_phone}) → Buyer: {t.buyer_name} ({t.buyer_phone})
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                DC Title: {t.dc_title || '-'} &middot; Price: {formatNaira(t.sale_price)}
                              </p>
                            </div>
                            <Badge variant="secondary" className="border-yellow-300 text-yellow-700">PENDING</Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {t.witness1_phone && (
                              <Badge variant="outline" className={t.witness1_status === 'APPROVED' ? 'border-green-300 text-green-700' : ''}>
                                W1: {t.witness1_status}
                              </Badge>
                            )}
                            {t.witness2_phone && (
                              <Badge variant="outline" className={t.witness2_status === 'APPROVED' ? 'border-green-300 text-green-700' : ''}>
                                W2: {t.witness2_status}
                              </Badge>
                            )}
                            {t.witness3_phone && (
                              <Badge variant="outline" className={t.witness3_status === 'APPROVED' ? 'border-green-300 text-green-700' : ''}>
                                W3: {t.witness3_status}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={() => sendOtp(t)}>
                              <MessageSquare size={14} className="mr-1.5" />
                              Send OTP & Approve
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => handleReject(t)}>
                              <XCircle size={14} className="mr-1.5" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* OTP Modal */}
          {otpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <Card className="w-full max-w-sm border-border/60">
                <CardHeader>
                  <CardTitle className="font-jakarta text-lg flex items-center gap-2">
                    <MessageSquare size={18} className="text-primary" />
                    Enter SMS OTP
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    An OTP was sent to {otpModal.chief_phone || 'your phone'} via Termii SMS. Enter it below to approve transfer {otpModal.transfer_id}.
                  </p>
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleApprove} disabled={approving || !otp.trim()}>
                      {approving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <CheckCircle2 size={16} className="mr-2" />}
                      Verify & Approve
                    </Button>
                    <Button variant="outline" onClick={() => { setOtpModal(null); setOtp(''); }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
