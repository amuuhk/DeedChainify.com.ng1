'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsTrigger, TabsList } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, FileText, Users, Activity, Landmark, MapPin,
  CheckCircle, Clock, AlertTriangle, ShieldCheck, Loader2,
  QrCode, Download, Send, Banknote, ArrowRightLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { Property, NeighborRequest, PropertyOwner } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/status-badge';
import { SiteHeader } from '@/components/site-header';
import { LoanFamilyPortal } from '@/components/loan-family-portal';
import { NeighborNotification } from '@/components/neighbor-notification';
import { formatNaira, PLOT_TYPE_LABELS } from '@/lib/dcid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const dcTitle = decodeURIComponent(params.dc_title as string);

  const [property, setProperty] = useState<Property | null>(null);
  const [neighbors, setNeighbors] = useState<NeighborRequest[]>([]);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [pledging, setPledging] = useState(false);

  useEffect(() => {
    if (!profile) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [profile, dcTitle]);

  async function fetchData() {
    const { data: propData } = await supabase
      .from('properties')
      .select('*')
      .eq('dc_title', dcTitle)
      .maybeSingle();
    setProperty(propData as Property | null);

    if (propData) {
      const propId = (propData as Property).id;
      const { data: neighborData } = await supabase
        .from('neighbor_requests')
        .select('*')
        .eq('property_id', propId)
        .order('created_at', { ascending: false });
      setNeighbors(neighborData as NeighborRequest[] || []);

      const { data: ownerData } = await supabase
        .from('property_owners')
        .select('*')
        .eq('property_id', propId)
        .order('created_at', { ascending: true });
      setOwners(ownerData as PropertyOwner[] || []);
    }
    setLoading(false);
  }

  async function requestChiefApproval() {
    if (!property) return;
    try {
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(property.dc_title + Date.now()));
      const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase
        .from('properties')
        .update({
          status: 'GREEN',
          blockchain_hash: hashHex,
          ipfs_url: `ipfs://Qm${hashHex.substring(0, 44)}`,
        })
        .eq('id', property.id);

      if (error) throw error;
      toast.success('Chief approved! Property is now VERIFIED.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Approval failed');
    }
  }

  async function pledgeToBank() {
    if (!property) return;
    setPledging(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_pledged: true, bank_name: 'GTBank' })
        .eq('id', property.id);

      if (error) throw error;
      toast.success('Property pledged to GTBank');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Pledge failed');
    } finally {
      setPledging(false);
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
            <CardContent className="py-16 text-center">
              <h2 className="font-jakarta text-xl font-bold">Property not found</h2>
              <Link href="/owner" className="mt-4 inline-block">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const plotLabel = PLOT_TYPE_LABELS[property.plot_type] || 'Residential';
  const approvedNeighbors = neighbors.filter((n) => n.status === 'APPROVED').length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/owner" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        {/* Header card */}
        <Card className="overflow-hidden border-border/60">
          <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge variant="outline" className="mb-2">
                  <MapPin size={12} className="mr-1.5" />
                  {plotLabel}
                </Badge>
                <h1 className="font-jakarta text-2xl font-bold">{property.dc_title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {property.layout_name}, {property.lga}, {property.state} &middot; {property.size_sqm} sqm
                </p>
              </div>
              <StatusBadge
                status={property.status}
                isPledged={property.is_pledged}
                bankName={property.bank_name}
              />
            </div>
          </CardHeader>
          {owners.length > 0 && (
            <CardContent className="border-t border-border/60 pt-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <p className="text-sm font-semibold">OWNERS: {owners.length}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {owners.map((o, i) => (
                  <div key={o.id} className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-sm">
                    <span className="font-medium">{o.name}</span>
                    <span className="ml-1.5 text-muted-foreground">- {Number(o.share_pct)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        <Tabs defaultValue="documents" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="documents">
              <FileText size={16} className="mr-1.5" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="neighbors">
              <Users size={16} className="mr-1.5" />
              <span className="hidden sm:inline">Neighbors</span>
            </TabsTrigger>
            <TabsTrigger value="status">
              <Activity size={16} className="mr-1.5" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
            <TabsTrigger value="transfer">
              <ArrowRightLeft size={16} className="mr-1.5" />
              <span className="hidden sm:inline">Transfer</span>
            </TabsTrigger>
            <TabsTrigger value="loan">
              <Landmark size={16} className="mr-1.5" />
              <span className="hidden sm:inline">Loan</span>
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="font-jakarta text-lg">Property Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Property Title (DC_TITLE)</p>
                      <p className="text-xs text-muted-foreground font-mono">{property.dc_title}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download size={14} className="mr-1.5" />
                    PDF
                  </Button>
                </div>

                {property.blockchain_hash && (
                  <div className="rounded-lg border border-green-300 bg-green-50 p-3">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={20} className="text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">Blockchain Verified</p>
                        <p className="text-xs text-green-700 font-mono break-all">
                          {property.blockchain_hash}
                        </p>
                      </div>
                    </div>
                    {property.ipfs_url && (
                      <p className="mt-2 text-xs text-green-700 font-mono break-all">
                        IPFS: {property.ipfs_url}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-3">
                    <QrCode size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Public QR Code</p>
                      <p className="text-xs text-muted-foreground">Anyone can scan to verify</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download size={14} className="mr-1.5" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-3">
                    <QrCode size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Private QR Token</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {property.private_qr_token?.substring(0, 16)}...
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Send size={14} className="mr-1.5" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Neighbors Tab */}
          <TabsContent value="neighbors" className="mt-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="font-jakarta text-lg">Neighbor Verification</CardTitle>
              </CardHeader>
              <CardContent>
                {neighbors.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Users size={40} className="text-muted-foreground" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      No neighbor verification requests sent yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {neighbors.map((n) => (
                      <div key={n.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                        <div>
                          <p className="text-sm font-medium">{n.neighbor_phone}</p>
                          <p className="text-xs text-muted-foreground">
                            Sent {new Date(n.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className={
                          n.status === 'APPROVED' ? 'border-green-300 bg-green-50 text-green-700' :
                          n.status === 'REJECTED' ? 'border-red-300 bg-red-50 text-red-700' :
                          'border-yellow-300 bg-yellow-50 text-yellow-700'
                        }>
                          {n.status}
                        </Badge>
                      </div>
                    ))}
                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                      <p className="text-sm">
                        {approvedNeighbors} of 2 approvals needed for YELLOW status
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="mt-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="font-jakarta text-lg">Status Center</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TooltipProvider delayDuration={200}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { icon: CheckCircle, label: 'GREEN', desc: 'Govt Approved', active: property.status === 'GREEN' || property.status === 'VERIFIED', color: 'green' },
                    { icon: Clock, label: 'YELLOW', desc: 'Chief Approval Pending', active: property.status === 'YELLOW', color: 'yellow' },
                    { icon: AlertTriangle, label: 'RED', desc: 'Disputed', active: property.status === 'RED' || property.status === 'DISPUTED', color: 'red' },
                    { icon: Banknote, label: 'COLLATERAL', desc: 'Pledged to Bank via API', tooltip: 'Collateral: Pledged to Bank via API', active: property.is_pledged, color: 'blue' },
                  ].map((s) => (
                    <Tooltip key={s.label}>
                      <TooltipTrigger asChild>
                    <div
                      className={`rounded-xl border-2 p-4 transition-all ${
                        s.active
                          ? s.color === 'green' ? 'border-green-300 bg-green-50' :
                            s.color === 'yellow' ? 'border-yellow-300 bg-yellow-50' :
                            s.color === 'red' ? 'border-red-300 bg-red-50' :
                            'border-blue-300 bg-blue-50'
                          : 'border-border/60 bg-muted/20 opacity-50'
                      }`}
                    >
                      <s.icon size={24} className={
                        s.active
                          ? s.color === 'green' ? 'text-green-600' :
                            s.color === 'yellow' ? 'text-yellow-600' :
                            s.color === 'red' ? 'text-red-600' :
                            'text-blue-600'
                          : 'text-muted-foreground'
                      } />
                      <p className="mt-2 font-semibold">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                      </TooltipTrigger>
                      {s.tooltip && (
                        <TooltipContent>
                          <p>{s.tooltip}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
                </TooltipProvider>

                {property.status === 'PENDING' && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                    <p className="text-sm font-medium">Next Steps:</p>
                    <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                      <li>Get 2 neighbor approvals (YELLOW)</li>
                      <li>Chief approval generates hash + IPFS (GREEN)</li>
                    </ol>
                  </div>
                )}

                {property.status === 'YELLOW' && (
                  <Button onClick={requestChiefApproval} className="w-full">
                    <ShieldCheck size={16} className="mr-2" />
                    Submit for Chief Approval
                  </Button>
                )}

                {!property.is_pledged && property.status === 'GREEN' && (
                  <Button onClick={pledgeToBank} variant="outline" disabled={pledging} className="w-full">
                    <Banknote size={16} className="mr-2" />
                    {pledging ? 'Processing...' : 'Pledge as Collateral'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transfer Tab */}
          <TabsContent value="transfer" className="mt-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="font-jakarta text-lg">Property Transfer (Deed of Assignment)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create a Deed of Assignment to transfer this property to a new owner. The deed includes seller, buyer, witnesses, barrister, and chief details, with SMS notifications sent to all parties.
                </p>
                <Link href={`/owner/${encodeURIComponent(property.dc_title)}/transfer`}>
                  <Button>
                    <ArrowRightLeft size={16} className="mr-2" />
                    Start Property Transfer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loan Tab */}
          <TabsContent value="loan" className="mt-6">
            <LoanFamilyPortal properties={[property]} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
