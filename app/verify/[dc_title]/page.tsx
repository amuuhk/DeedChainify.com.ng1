'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, ShieldCheck, Eye, ArrowLeft, Loader2,
  CheckCircle, Maximize, Building, User, Calendar, QrCode,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import type { Property } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/status-badge';
import { SiteHeader } from '@/components/site-header';
import { formatNaira, PLOT_TYPE_LABELS } from '@/lib/dcid';
import { getScanCount, logScan, FREE_SCAN_LIMIT, PAID_SCAN_FEE } from '@/lib/scan-limit';

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const dcTitle = decodeURIComponent(params.dc_title as string);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanStatus, setScanStatus] = useState<'idle' | 'checking' | 'free' | 'paid' | 'scanning'>('idle');
  const [scanCount, setScanCount] = useState(0);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [dcTitle]);

  async function fetchProperty() {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('dc_title', dcTitle)
      .maybeSingle();

    setProperty(data as Property | null);
    setLoading(false);

    if (data) {
      checkScanLog(data.dc_title);
    }
  }

  async function checkScanLog(title: string) {
    setScanStatus('checking');
    const count = await getScanCount(title);
    setScanCount(count);
    setScanStatus(count < FREE_SCAN_LIMIT ? 'free' : 'paid');
  }

  async function performScan() {
    if (!property) return;
    setScanStatus('scanning');

    try {
      const currentCount = await getScanCount(property.dc_title);

      if (currentCount < FREE_SCAN_LIMIT) {
        await logScan(property.dc_title, 0);
        setScanCount(currentCount + 1);
        setScanned(true);
        setScanStatus('free');
        const remaining = FREE_SCAN_LIMIT - currentCount - 1;
        toast.success(`Scan complete! ${remaining} free scan${remaining !== 1 ? 's' : ''} left for life`);
      } else {
        await supabase.from('payments').insert({
          type: 'PUBLIC_SCAN',
          amount: PAID_SCAN_FEE,
          dc_title: property.dc_title,
          status: 'SUCCESS',
        });
        await logScan(property.dc_title, PAID_SCAN_FEE);
        setScanCount(currentCount + 1);
        setScanned(true);
        setScanStatus('free');
        toast.success('Payment confirmed. Scan complete!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Scan failed');
      setScanStatus(scanCount < FREE_SCAN_LIMIT ? 'free' : 'paid');
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

  if (!property) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-12">
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <ShieldCheck size={32} className="text-red-600" />
              </div>
              <h2 className="mt-4 font-jakarta text-xl font-bold">Property Not Found</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                No property found with title: {dcTitle}
              </p>
              <Link href="/verify" className="mt-4">
                <Button variant="outline">Search Properties</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const plotLabel = PLOT_TYPE_LABELS[property.plot_type] || 'Residential';
  const scansLeft = Math.max(0, FREE_SCAN_LIMIT - scanCount);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/verify" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to search
        </Link>

        <Card className="overflow-hidden border-border/60">
          <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <Badge variant="outline" className="mb-2">
                  <Building size={12} className="mr-1.5" />
                  {plotLabel}
                </Badge>
                <CardTitle className="font-jakarta text-xl">{property.dc_title}</CardTitle>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin size={12} className="text-primary" />
                  {property.layout_name}, {property.lga}, {property.state}
                </p>
              </div>
              <StatusBadge
                status={property.status}
                isPledged={property.is_pledged}
                bankName={property.bank_name}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scan banner */}
            {scanStatus === 'checking' || scanStatus === 'scanning' ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            ) : scanned ? (
              <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Scan Complete</p>
                    <p className="text-sm text-green-700">Property data is now visible below</p>
                  </div>
                </div>
              </div>
            ) : scanStatus === 'free' && scanCount < FREE_SCAN_LIMIT ? (
              <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Free Scan Available</p>
                    <p className="text-sm text-green-700">
                      {scansLeft} free scan{scansLeft !== 1 ? 's' : ''} left for life
                    </p>
                  </div>
                </div>
              </div>
            ) : scanStatus === 'paid' ? (
              <div className="rounded-xl border-2 border-secondary/40 bg-secondary/5 p-4">
                <div className="flex items-center gap-3">
                  <QrCode size={24} className="text-secondary" />
                  <div className="flex-1">
                    <p className="font-semibold">Payment Required</p>
                    <p className="text-sm text-muted-foreground">
                      You have used your {FREE_SCAN_LIMIT} free scans for this property
                    </p>
                  </div>
                  <span className="font-jakarta text-lg font-bold">{formatNaira(PAID_SCAN_FEE)}</span>
                </div>
              </div>
            ) : null}

            {/* Property details - only visible after scan */}
            {scanned && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: User, label: 'Owner', value: property.owner_name || 'Unknown' },
                  { icon: Maximize, label: 'Size', value: `${property.size_sqm} sqm` },
                  { icon: Building, label: 'Block', value: property.block_no },
                  { icon: Building, label: 'Plot', value: property.plot_no },
                  { icon: MapPin, label: 'GPS', value: `${property.gps_lat?.toFixed(4) || 'N/A'}, ${property.gps_long?.toFixed(4) || 'N/A'}` },
                  { icon: Calendar, label: 'Registered', value: new Date(property.created_at).toLocaleDateString() },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <item.icon size={12} />
                      {item.label}
                    </div>
                    <p className="mt-1 font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Blockchain info */}
            {scanned && property.blockchain_hash && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-primary" />
                  <p className="text-sm font-semibold">Blockchain Verified</p>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                  Hash: {property.blockchain_hash}
                </p>
                {property.ipfs_url && (
                  <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                    IPFS: {property.ipfs_url}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {!scanned && scanStatus === 'free' && scanCount < FREE_SCAN_LIMIT ? (
                <Button onClick={performScan} size="lg" className="flex-1">
                  <Eye size={18} className="mr-2" />
                  View Details (Free)
                </Button>
              ) : !scanned && scanStatus === 'paid' ? (
                <Button onClick={performScan} size="lg" className="flex-1">
                  <QrCode size={18} className="mr-2" />
                  Pay {formatNaira(PAID_SCAN_FEE)} to Scan
                </Button>
              ) : null}
              {scanned && (
                <Link href={`/person/${property.owner_dc_id}`} className="flex-1">
                  <Button variant="outline" size="lg" className="w-full">
                    <User size={18} className="mr-2" />
                    View Owner
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
