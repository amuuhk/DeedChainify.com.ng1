'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserCircle, MapPin, ArrowLeft, Loader2, ShieldCheck, Phone,
  CheckCircle, QrCode, Lock, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import type { Profile, Property } from '@/lib/supabase/client';
import { PropertyCard } from '@/components/property-card';
import { StatusBadge } from '@/components/status-badge';
import { SiteHeader } from '@/components/site-header';
import { formatNaira, getCurrentMonth } from '@/lib/dcid';

export default function PersonPage() {
  const params = useParams();
  const dcId = decodeURIComponent(params.dc_id as string);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanStatus, setScanStatus] = useState<'checking' | 'locked' | 'free' | 'revealed'>('checking');
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    async function fetch() {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('dc_id', dcId)
        .maybeSingle();
      setProfile(profileData as Profile | null);

      if (profileData) {
        const { data: propData } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_dc_id', dcId)
          .order('created_at', { ascending: false });
        setProperties(propData as Property[] || []);
        checkScanLog(dcId);
      }
      setLoading(false);
    }
    fetch();
  }, [dcId]);

  async function checkScanLog(id: string) {
    setScanStatus('checking');
    const month = getCurrentMonth();
    const { data } = await supabase
      .from('public_scan_logs')
      .select('*')
      .eq('dc_title', `PERSON:${id}`)
      .eq('month', month)
      .maybeSingle();

    const count = (data as any)?.scan_count || 0;
    setScanCount(count);
    setScanStatus(count < 2 ? 'free' : 'locked');
  }

  async function performScan() {
    if (!profile) return;
    setScanStatus('checking');

    try {
      const month = getCurrentMonth();
      const logKey = `PERSON:${dcId}`;
      const { data: existing } = await supabase
        .from('public_scan_logs')
        .select('*')
        .eq('dc_title', logKey)
        .eq('month', month)
        .maybeSingle();

      const currentCount = (existing as any)?.scan_count || 0;

      if (currentCount < 2) {
        if (existing) {
          await supabase
            .from('public_scan_logs')
            .update({ scan_count: currentCount + 1 })
            .eq('id', (existing as any).id);
        } else {
          await supabase
            .from('public_scan_logs')
            .insert({ dc_title: logKey, month, scan_count: 1 });
        }
        setScanCount(currentCount + 1);
        setScanStatus('revealed');
        const left = 1 - currentCount;
        toast.success(`Scan complete! ${left} free scan(s) left this month`);
      } else {
        await supabase.from('payments').insert({
          type: 'PUBLIC_SCAN',
          amount: 5000,
          dc_id: dcId,
          status: 'SUCCESS',
        });

        if (existing) {
          await supabase
            .from('public_scan_logs')
            .update({ scan_count: currentCount + 1 })
            .eq('id', (existing as any).id);
        } else {
          await supabase
            .from('public_scan_logs')
            .insert({ dc_title: logKey, month, scan_count: 1 });
        }
        setScanCount(currentCount + 1);
        setScanStatus('revealed');
        toast.success('Payment confirmed. Person data revealed!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Scan failed');
      setScanStatus('locked');
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-12">
          <Card className="border-border/60">
            <CardContent className="py-16 text-center">
              <UserCircle size={48} className="mx-auto text-muted-foreground" />
              <h2 className="mt-4 font-jakarta text-xl font-bold">Person Not Found</h2>
              <p className="mt-1 text-sm text-muted-foreground">No owner with DCID: {dcId}</p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const scansLeft = Math.max(0, 2 - scanCount);
  const pledgedCount = properties.filter((p) => p.is_pledged).length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/person" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to search
        </Link>

        <Card className="overflow-hidden border-border/60">
          <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <UserCircle size={36} className="text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="font-jakarta text-2xl">{profile.full_name}</CardTitle>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                    <ShieldCheck size={12} className="mr-1.5" />
                    {profile.dc_id}
                  </Badge>
                  <Badge variant="outline" className={
                    profile.kyc_status === 'VERIFIED' ? 'border-green-300 bg-green-50 text-green-700' :
                    'border-yellow-300 bg-yellow-50 text-yellow-700'
                  }>
                    KYC: {profile.kyc_status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone size={14} />
              {profile.phone}
            </div>
          </CardContent>
        </Card>

        {/* Scan gate banner */}
        <div className="mt-6">
          {scanStatus === 'checking' ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          ) : scanStatus === 'free' && scanCount < 2 ? (
            <Card className="border-2 border-green-300 bg-green-50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Free Scan Available</p>
                    <p className="text-sm text-green-700">
                      {scansLeft} free scan{scansLeft !== 1 ? 's' : ''} left this month
                    </p>
                  </div>
                </div>
                <Button onClick={performScan} className="bg-green-600 hover:bg-green-700">
                  <Eye size={16} className="mr-2" />
                  Reveal Data (Free)
                </Button>
              </CardContent>
            </Card>
          ) : scanStatus === 'locked' ? (
            <Card className="border-2 border-secondary/40 bg-secondary/5">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Lock size={24} className="text-secondary" />
                  <div>
                    <p className="font-semibold">Payment Required</p>
                    <p className="text-sm text-muted-foreground">
                      You have used your 2 free scans this month
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-jakarta text-lg font-bold">{formatNaira(5000)}</p>
                  <Button onClick={performScan} size="sm" className="mt-1">
                    <QrCode size={14} className="mr-1.5" />
                    Pay to Reveal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-green-300 bg-green-50">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle size={24} className="text-green-600" />
                <p className="font-semibold text-green-800">Data revealed. Properties shown below.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Properties - only visible after scan */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-jakarta text-lg font-bold">
              Properties ({properties.length})
            </h2>
            {scanStatus === 'revealed' && pledgedCount > 0 && (
              <Badge className="bg-blue-100 text-blue-700">
                {pledgedCount} pledged
              </Badge>
            )}
          </div>

          {scanStatus !== 'revealed' ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20">
                  <Lock size={32} className="text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="mt-4 rounded-xl border-2 border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No properties registered
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
