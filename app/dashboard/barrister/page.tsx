'use client';

import { useEffect, useState } from 'react';
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

export default function BarristerDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      const { error } = await supabase
        .from('properties')
        .update({ status: 'GREEN' })
        .eq('id', prop.id);

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

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Assigned Cases', value: assignedCases.length, icon: Scale, color: 'text-primary' },
              { label: 'Pending', value: pendingCases.length, icon: Clock, color: 'text-yellow-600' },
              { label: 'Documents Verified', value: verifiedDocs.length, icon: ShieldCheck, color: 'text-green-600' },
              { label: 'Legal Fees (5%)', value: formatNaira(totalFees), icon: Wallet, color: 'text-blue-600' },
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
          <div className="mt-8 space-y-6">
            {/* Assigned Cases */}
            {(activeTab === 'cases' || activeTab === 'deed') && (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-jakarta text-lg flex items-center gap-2">
                    <Scale size={18} className="text-primary" />
                    {activeTab === 'deed' ? 'Generate Deed of Assignment' : 'Assigned Cases'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignedCases.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Scale size={32} className="text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No assigned cases yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignedCases.map((t) => (
                        <div key={t.id} className="rounded-lg border border-border/60 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Transfer: {t.transfer_id}</p>
                              <p className="text-xs text-muted-foreground">
                                Seller: {t.seller_name} → Buyer: {t.buyer_name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                DC Title: {t.dc_title || '-'} &middot; Price: {formatNaira(t.sale_price)}
                              </p>
                            </div>
                            <Badge variant={t.status === 'APPROVED' ? 'default' : 'secondary'}>
                              {t.status}
                            </Badge>
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
                            {t.chief_phone && (
                              <Badge variant="outline" className={t.chief_status === 'APPROVED' ? 'border-green-300 text-green-700' : ''}>
                                Chief: {t.chief_status}
                              </Badge>
                            )}
                          </div>
                          {activeTab === 'deed' && (
                            <div className="mt-3">
                              <Button size="sm" onClick={() => generateDeed(t)}>
                                <FileText size={14} className="mr-1.5" />
                                Generate Deed of Assignment
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Verify Documents */}
            {activeTab === 'verify' && (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-jakarta text-lg flex items-center gap-2">
                    <ShieldCheck size={18} className="text-green-600" />
                    Verify Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {properties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No properties to verify</p>
                  ) : (
                    <div className="space-y-2">
                      {properties.filter((p) => p.status !== 'GREEN' && p.status !== 'VERIFIED').slice(0, 20).map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                          <div>
                            <p className="text-sm font-medium">{p.dc_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.owner_name} &middot; {p.layout_name}, {p.lga}, {p.state} &middot; {p.size_sqm} sqm
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{p.status}</Badge>
                            <Button size="sm" variant="outline" onClick={() => verifyDocument(p)}>
                              <CheckCircle size={14} className="mr-1.5" />
                              Verify
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Legal Fees */}
            {activeTab === 'fees' && (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-jakarta text-lg flex items-center gap-2">
                    <Wallet size={18} className="text-blue-600" />
                    Legal Fees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 p-4 text-center">
                    <p className="font-jakarta text-2xl font-bold text-blue-700">{formatNaira(totalFees)}</p>
                    <p className="text-xs text-blue-600">Total earned (5% of onboarding fees)</p>
                  </div>
                  {legalFees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No legal fees recorded yet</p>
                  ) : (
                    <div className="space-y-2">
                      {legalFees.map((p) => (
                        <div key={p.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                          <div>
                            <p className="text-sm font-medium">{p.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.dc_title || '-'} &middot; {new Date(p.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="font-semibold text-sm text-blue-600">
                            +{formatNaira(Math.round(p.amount * 0.05))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
