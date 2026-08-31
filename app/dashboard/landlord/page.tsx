'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home, Wallet, TrendingUp, Upload, ArrowDownToLine, Loader2, Plus,
  Building2, FileText, CheckCircle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import type { Property, Payment } from '@/lib/supabase/client';
import { SiteHeader } from '@/components/site-header';
import { StatusBadge } from '@/components/status-badge';
import { formatNaira, generateLandlordId } from '@/lib/dcid';
import { useAuth } from '@/lib/auth-context';

export default function LandlordDashboard() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [earnings, setEarnings] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [landlordId, setLandlordId] = useState<string>('');

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        router.push('/login');
        return;
      }
      // Allow both landlord and owner roles for backward compatibility
      if (profile.role !== 'landlord' && profile.role !== 'owner') {
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
      const { data } = await supabase.from('profiles').select('id').eq('role', 'landlord');
      const seq = (data?.length || 0) + 1;
      const id = generateLandlordId(profile.state || 'Kano', seq);
      setLandlordId(id);
    } catch (err) {
      console.error('Failed to generate landlord ID');
    }
  }

  async function fetchData() {
    if (!profile) return;
    try {
      const [propRes, payRes] = await Promise.all([
        supabase.from('properties').select('*').eq('owner_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('recipient_id', profile.id).order('created_at', { ascending: false }).limit(10),
      ]);
      setProperties(propRes.data as Property[] || []);
      setEarnings(payRes.data as Payment[] || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }

  function withdraw() {
    toast.success('Withdrawal requested via Paystack', {
      description: 'Funds will be sent to your bank account within 24 hours',
    });
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

  const totalEarnings = earnings.reduce((sum, p) => sum + p.amount, 0);
  const pendingSales = properties.filter((p) => p.status === 'PENDING' || p.status === 'YELLOW');
  const verifiedProperties = properties.filter((p) => p.status === 'GREEN' || p.status === 'VERIFIED');

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-jakarta text-2xl font-bold">Landlord Portal</h1>
            <p className="text-sm text-muted-foreground">
              {landlordId && <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded">{landlordId}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={withdraw} disabled={totalEarnings === 0}>
              <ArrowDownToLine size={16} className="mr-2" />
              Withdraw via Paystack
            </Button>
            <Button onClick={() => router.push('/owner/onboard')}>
              <Plus size={16} className="mr-2" />
              Add New Property
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'My Properties', value: properties.length, icon: Home, color: 'text-primary' },
            { label: 'Earnings', value: formatNaira(totalEarnings), icon: Wallet, color: 'text-green-600' },
            { label: 'Pending Sales', value: pendingSales.length, icon: Clock, color: 'text-yellow-600' },
            { label: 'Verified', value: verifiedProperties.length, icon: CheckCircle, color: 'text-blue-600' },
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

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* My Properties */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-jakarta text-lg flex items-center gap-2">
                <Building2 size={18} className="text-primary" />
                My Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Home size={32} className="text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No properties yet</p>
                  <Button onClick={() => router.push('/owner/onboard')} className="mt-4" size="sm">
                    <Plus size={14} className="mr-2" />
                    Add First Property
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {properties.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div>
                        <p className="text-sm font-medium">{p.dc_title}</p>
                        <p className="text-xs text-muted-foreground">{p.layout_name}, {p.lga}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Earnings */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-jakarta text-lg flex items-center gap-2">
                <Wallet size={18} className="text-green-600" />
                Earnings History
              </CardTitle>
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
                        <p className="text-sm font-medium">{e.dc_title || 'Property'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-semibold text-sm text-green-600">
                        +{formatNaira(e.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upload Documents Section */}
        <Card className="mt-6 border-border/60">
          <CardHeader>
            <CardTitle className="font-jakarta text-lg flex items-center gap-2">
              <Upload size={18} className="text-primary" />
              Upload Property Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: 'Certificate of Occupancy (C of O)', desc: 'Government-issued land ownership document' },
                { title: 'Deed of Assignment', desc: 'Legal transfer document from previous owner' },
                { title: 'Survey Plan', desc: 'Surveyed land dimensions and boundaries' },
              ].map((doc) => (
                <div key={doc.title} className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    <p className="text-sm font-medium">{doc.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{doc.desc}</p>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Upload size={14} className="mr-2" />
                    Upload
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}