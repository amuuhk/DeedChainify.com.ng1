'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ShieldCheck, Eye, CheckCircle, Loader2, Plus, Trash2, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import {
  STATE_CODES, LGA_CODES, PLOT_TYPES, generateDCTitle,
  getOnboardingFee, getFeeTier, formatNaira,
} from '@/lib/dcid';
import { SiteHeader } from '@/components/site-header';

type CoOwner = {
  dcid: string;
  name: string;
  share: string;
  kycVerified: boolean;
};

function OnboardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const isPrivate = searchParams.get('type') === 'private';

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    state: 'Kano',
    lga: 'Fagge',
    layoutName: '',
    blockNo: '',
    plotNo: '',
    plotType: 'Residential',
    sizeSqm: 450,
    gpsLat: 12.0,
    gpsLong: 8.5167,
    neighbor1: '',
    neighbor2: '',
    neighbor3: '',
    landlordReferral: '',
    barristerReferral: '',
    agencyReferral: '',
  });

  const [ownershipType, setOwnershipType] = useState<'single' | 'co'>('single');

  const [coOwners, setCoOwners] = useState<CoOwner[]>([
    { dcid: '', name: '', share: '100', kycVerified: false },
  ]);

  const availableLGAs = Object.keys(LGA_CODES[STATE_CODES[form.state]] || {});
  const fee = isPrivate ? getOnboardingFee(form.lga) : 0;
  const tier = getFeeTier(form.lga);

  const totalShare = coOwners.reduce((sum, o) => sum + (parseFloat(o.share) || 0), 0);
  const shareValid = Math.abs(totalShare - 100) < 0.01;
  const allKycVerified = coOwners.every(o => o.kycVerified || ownershipType === 'single');

  useEffect(() => {
    if (!profile) router.push('/login');
  }, [profile, router]);

  function addCoOwner() {
    if (coOwners.length >= 50) {
      toast.error('Maximum 50 owners allowed');
      return;
    }
    setCoOwners([...coOwners, { dcid: '', name: '', share: '', kycVerified: false }]);
  }

  function removeCoOwner(idx: number) {
    if (coOwners.length === 1) return;
    setCoOwners(coOwners.filter((_, i) => i !== idx));
  }

  async function verifyDcidKyc(dcid: string, idx: number) {
    if (!dcid.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('dc_id, full_name, kyc_status')
        .eq('dc_id', dcid.trim())
        .single();

      if (error || !data) {
        toast.error('DCID not found', { description: 'Please enter a valid DeedChainify ID' });
        setCoOwners(coOwners.map((o, i) => (i === idx ? { ...o, kycVerified: false } : o)));
        return;
      }

      if (data.kyc_status !== 'VERIFIED') {
        toast.error('KYC verification required', { 
          description: 'Cannot add owner. DCID must be fully identity-verified first via Youverify.' 
        });
        setCoOwners(coOwners.map((o, i) => (i === idx ? { ...o, kycVerified: false, name: '' } : o)));
        return;
      }

      // DCID is verified, update the co-owner
      setCoOwners(coOwners.map((o, i) => (i === idx ? { ...o, name: data.full_name, kycVerified: true } : o)));
      toast.success('DCID verified', { description: `${data.full_name} - KYC verified` });
    } catch (err) {
      toast.error('Verification failed', { description: 'Please check the DCID and try again' });
      setCoOwners(coOwners.map((o, i) => (i === idx ? { ...o, kycVerified: false } : o)));
    }
  }

  function updateCoOwner(idx: number, field: keyof CoOwner, value: string) {
    setCoOwners(coOwners.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
    
    // Trigger KYC verification when DCID is entered
    if (field === 'dcid' && value.trim()) {
      verifyDcidKyc(value, idx);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    
    if (ownershipType === 'co' && !shareValid) {
      toast.error('Total ownership share must equal exactly 100%');
      return;
    }
    
    if (ownershipType === 'co' && !allKycVerified) {
      toast.error('All co-owners must be KYC verified', { 
        description: 'Cannot add owner. DCID must be fully identity-verified first.' 
      });
      return;
    }
    
    const hasOwnerInfo = coOwners.some((o) => o.name.trim());
    if (!hasOwnerInfo) {
      toast.error('At least one owner is required');
      return;
    }
    setSubmitting(true);

    try {
      const { data: countData } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true });

      const seq = (countData?.length || 0) + 1;
      const dcTitle = generateDCTitle(
        form.state, form.lga, form.layoutName, form.blockNo,
        form.plotType, form.plotNo, seq,
      );

      const { data, error } = await supabase.from('properties').insert({
        dc_title: dcTitle,
        owner_id: profile.id,
        owner_dc_id: profile.dc_id,
        owner_name: profile.full_name,
        state: form.state,
        lga: form.lga,
        layout_name: form.layoutName,
        block_no: form.blockNo,
        plot_no: form.plotNo,
        plot_type: PLOT_TYPES[form.plotType] || 'P',
        gps_lat: form.gpsLat,
        gps_long: form.gpsLong,
        size_sqm: form.sizeSqm,
        status: 'PENDING',
        listing_type: isPrivate ? 'PRIVATE' : 'PUBLIC',
        private_qr_token: crypto.randomUUID(),
        landlord_referral: form.landlordReferral || null,
        barrister_referral: form.barristerReferral || null,
      }).select().single();

      if (error) throw error;

      // Insert co-owners
      const ownersToInsert = coOwners
        .filter((o) => o.name.trim())
        .map((o) => ({
          property_id: data.id,
          dc_id: o.dcid,
          name: o.name,
          share_pct: parseFloat(o.share) || 0,
        }));
      if (ownersToInsert.length > 0) {
        await supabase.from('property_owners').insert(ownersToInsert);
      }

      if (isPrivate) {
        await supabase.from('payments').insert({
          type: 'PRIVATE_ONBOARD',
          amount: fee,
          dc_title: dcTitle,
          dc_id: profile.dc_id,
          user_id: profile.id,
          status: 'SUCCESS',
        });
      }

      const neighbors = [form.neighbor1, form.neighbor2, form.neighbor3].filter(Boolean);
      if (neighbors.length > 0) {
        const neighborInserts = neighbors.map((phone) => ({
          property_id: data.id,
          neighbor_phone: phone,
          status: 'PENDING',
        }));
        await supabase.from('neighbor_requests').insert(neighborInserts);
      }

      toast.success('Property onboarded!', { description: dcTitle });
      router.push(`/owner/${dcTitle}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to onboard property');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/owner" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isPrivate ? 'bg-primary/10' : 'bg-secondary/10'}`}>
            {isPrivate ? <ShieldCheck size={24} className="text-primary" /> : <Eye size={24} className="text-secondary" />}
          </div>
          <div>
            <h1 className="font-jakarta text-2xl font-bold">
              {isPrivate ? 'Private Onboarding' : 'Public Listing'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isPrivate ? `Geo-tier pricing: ${formatNaira(fee)} (${tier.tier})` : 'Free listing, anyone can scan to verify'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ownership Type Toggle */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-jakarta text-lg">Ownership Type</CardTitle>
              <CardDescription>Select how this property will be owned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setOwnershipType('single')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    ownershipType === 'single' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border/60 hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-2">👤</div>
                  <div className="font-semibold">Single Ownership</div>
                  <div className="text-xs text-muted-foreground mt-1">One owner, 100% ownership</div>
                </button>
                <button
                  type="button"
                  onClick={() => setOwnershipType('co')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    ownershipType === 'co' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border/60 hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-semibold">Co-Ownership</div>
                  <div className="text-xs text-muted-foreground mt-1">Multiple owners, fractional shares</div>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-jakarta text-lg">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v, lga: Object.keys(LGA_CODES[STATE_CODES[v]] || {})[0] || '' })}>
                    <SelectTrigger id="state"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(STATE_CODES).map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lga">LGA</Label>
                  <Select value={form.lga} onValueChange={(v) => setForm({ ...form, lga: v })}>
                    <SelectTrigger id="lga"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableLGAs.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="layout">Layout Name</Label>
                <Input
                  id="layout"
                  required
                  value={form.layoutName}
                  onChange={(e) => setForm({ ...form, layoutName: e.target.value })}
                  placeholder="e.g. FAGGE"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="block">Block No</Label>
                  <Input id="block" required value={form.blockNo} onChange={(e) => setForm({ ...form, blockNo: e.target.value })} placeholder="12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plot">Plot No</Label>
                  <Input id="plot" required value={form.plotNo} onChange={(e) => setForm({ ...form, plotNo: e.target.value })} placeholder="04" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Plot Type</Label>
                  <Select value={form.plotType} onValueChange={(v) => setForm({ ...form, plotType: v })}>
                    <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(PLOT_TYPES).map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="size">Size (sqm)</Label>
                  <Input id="size" type="number" required value={form.sizeSqm} onChange={(e) => setForm({ ...form, sizeSqm: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lat">GPS Lat</Label>
                  <Input id="lat" type="number" step="any" value={form.gpsLat} onChange={(e) => setForm({ ...form, gpsLat: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="long">GPS Long</Label>
                  <Input id="long" type="number" step="any" value={form.gpsLong} onChange={(e) => setForm({ ...form, gpsLong: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Co-Ownership */}
          {ownershipType === 'co' && (
            <Card className="border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-jakarta text-lg flex items-center gap-2">
                      <Users size={18} className="text-primary" />
                      Co-Ownership Setup
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Enter DCIDs of co-owners. Each DCID must be KYC verified via Youverify.
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addCoOwner}>
                    <Plus size={14} className="mr-1.5" />
                    Add Owner
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {coOwners.map((owner, idx) => (
                  <div key={idx} className={`rounded-lg border p-3 ${owner.kycVerified ? 'border-green-300 bg-green-50' : 'border-border/60'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Owner {idx + 1}</span>
                      {coOwners.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeCoOwner(idx)}>
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor={`dcid-${idx}`} className="text-xs">DeedChainify ID (DCID)</Label>
                        <Input
                          id={`dcid-${idx}`}
                          placeholder="DC-KN-2026-000412"
                          value={owner.dcid}
                          onChange={(e) => updateCoOwner(idx, 'dcid', e.target.value)}
                          className={owner.kycVerified ? 'border-green-500' : ''}
                        />
                        {owner.kycVerified && (
                          <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                            <CheckCircle size={12} />
                            KYC Verified
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`name-${idx}`} className="text-xs">Owner Name</Label>
                        <Input
                          id={`name-${idx}`}
                          placeholder="Auto-filled from DCID"
                          value={owner.name}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`share-${idx}`} className="text-xs">Ownership %</Label>
                        <div className="relative">
                          <Input
                            id={`share-${idx}`}
                            type="number"
                            placeholder="50"
                            required
                            value={owner.share}
                            onChange={(e) => updateCoOwner(idx, 'share', e.target.value)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className={`flex items-center justify-between rounded-lg p-3 text-sm ${shareValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <span>Total Share:</span>
                  <span className="font-bold">{totalShare.toFixed(0)}% {shareValid ? '(Valid)' : '(Must equal 100%)'}</span>
                </div>
                {!allKycVerified && (
                  <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span className="font-medium">KYC Verification Required</span>
                    </div>
                    <p className="mt-1 text-xs">All co-owners must have completed Youverify KYC verification before onboarding.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Neighbor verification */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-jakarta text-lg">Neighbor Verification</CardTitle>
              <CardDescription>Send verification requests to up to 3 neighbors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Label htmlFor={`neighbor${i}`}>Neighbor {i} Phone</Label>
                  <Input
                    id={`neighbor${i}`}
                    value={form[`neighbor${i}` as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [`neighbor${i}`]: e.target.value } as any)}
                    placeholder="08012345678"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Referral Options */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-jakarta text-lg">Referral Options (Optional)</CardTitle>
              <CardDescription>Refer a barrister or real estate agency to this property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="barristerReferral">Barrister Referral ID (DC-BRR...)</Label>
                <Input
                  id="barristerReferral"
                  value={form.barristerReferral}
                  onChange={(e) => setForm({ ...form, barristerReferral: e.target.value })}
                  placeholder="DC-BRR-KN-00000001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyReferral">Real Estate Agency ID (DC-RE...)</Label>
                <Input
                  id="agencyReferral"
                  value={form.agencyReferral}
                  onChange={(e) => setForm({ ...form, agencyReferral: e.target.value })}
                  placeholder="DC-RE-KN-000112"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={submitting || !shareValid}>
            {submitting ? (
              <><Loader2 size={18} className="mr-2 animate-spin" /> Onboarding...</>
            ) : (
              <>
                <CheckCircle size={18} className="mr-2" />
                {isPrivate ? `Pay ${formatNaira(fee)} & Onboard` : 'Create Free Listing'}
              </>
            )}
          </Button>
        </form>
      </main>
    </>
  );
}

export default function OnboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <OnboardForm />
    </Suspense>
  );
}
