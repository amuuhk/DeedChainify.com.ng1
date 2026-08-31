'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Send, Loader2, Printer, ShieldCheck, CheckCircle, Clock, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import type { Property, Transfer } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { SiteHeader } from '@/components/site-header';
import { pdfTranslations, buildSmsMessage, generateTransferId } from '@/lib/deed-templates';
import { getTierPrice, TIER_LABELS } from '@/lib/geotier';
import { formatNaira } from '@/lib/dcid';
import { QRCodeSVG } from 'qrcode.react';

export default function TransferPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const dcTitle = decodeURIComponent(params.dc_title as string);

  const [property, setProperty] = useState<Property | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeed, setShowDeed] = useState(false);
  const [activeTransfer, setActiveTransfer] = useState<Transfer | null>(null);
  const [custodium, setCustodium] = useState<{ pdfHash: string; ledgerId: string; signature: string } | null>(null);

  const [form, setForm] = useState({
    sellerName: '',
    sellerPhone: '',
    sellerNIN: '',
    buyerName: '',
    buyerPhone: '',
    buyerNIN: '',
    salePrice: '',
    state: 'Kano',
    lga: 'Fagge',
    barristerName: '',
    barristerPhone: '',
    barristerNIN: '',
    witness1Phone: '',
    witness2Phone: '',
    witness3Phone: '',
    chiefName: '',
    chiefPhone: '',
    deedLanguage: 'en' as 'en' | 'ha' | 'yo',
  });

  const tierInfo = useMemo(() => getTierPrice(form.state, form.lga), [form.state, form.lga]);

  const allFieldsFilled = useMemo(() => {
    return !!(form.sellerName && form.sellerPhone && form.buyerName && form.buyerPhone &&
      form.salePrice && form.barristerName && form.barristerPhone &&
      form.witness1Phone && form.witness2Phone && form.witness3Phone &&
      form.chiefName && form.chiefPhone);
  }, [form]);

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
      const { data: transferData } = await supabase
        .from('transfers')
        .select('*')
        .eq('dc_title', dcTitle)
        .order('created_at', { ascending: false });
      setTransfers(transferData as Transfer[] || []);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!property || !profile) return;
    setSubmitting(true);

    try {
      const transferId = generateTransferId();
      const { data, error } = await supabase
        .from('transfers')
        .insert({
          dc_title: dcTitle,
          transfer_id: transferId,
          seller_name: form.sellerName,
          seller_phone: form.sellerPhone,
          seller_nin: form.sellerNIN || null,
          buyer_name: form.buyerName,
          buyer_phone: form.buyerPhone,
          buyer_nin: form.buyerNIN || null,
          sale_price: parseInt(form.salePrice) || 0,
          tier_price: tierInfo.price,
          tier: tierInfo.tier,
          state: form.state,
          lga: form.lga,
          barrister_name: form.barristerName || null,
          barrister_phone: form.barristerPhone || null,
          barrister_nin: form.barristerNIN || null,
          witness1_phone: form.witness1Phone || null,
          witness2_phone: form.witness2Phone || null,
          witness3_phone: form.witness3Phone || null,
          chief_name: form.chiefName || null,
          chief_phone: form.chiefPhone || null,
          language: form.deedLanguage,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate PDF hash from the deed data (client-side SHA-256)
      const deedData = `${dcTitle}|${form.sellerName}|${form.buyerName}|${form.salePrice}|${tierInfo.price}|${transferId}`;
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(deedData));
      const pdfHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

      // Seal to custodium via edge function
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/seal-custodium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session?.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          transferId,
          dcTitle,
          pdfHash,
          userId: profile.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to seal to custodium');
      const custodiumResult = await response.json();

      setCustodium({
        pdfHash: custodiumResult.pdfHash,
        ledgerId: custodiumResult.ledgerId,
        signature: custodiumResult.signature,
      });

      const sms = buildSmsMessage(form.deedLanguage, dcTitle, tierInfo.price, custodiumResult.ledgerId);
      toast.success('Transfer created & sealed to Custodium!', {
        description: `Transfer ID: ${transferId}`,
      });
      toast('SMS template ready', { description: sms, duration: 8000 });

      // Refresh transfers list
      const { data: refreshedTransfer } = await supabase
        .from('transfers')
        .select('*')
        .eq('transfer_id', transferId)
        .single();

      setTransfers([refreshedTransfer as Transfer, ...transfers.filter((t) => t.transfer_id !== transferId)]);
      setActiveTransfer(refreshedTransfer as Transfer);
      setShowDeed(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrint() {
    window.print();
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

  const t = pdfTranslations[form.deedLanguage];
  const today = new Date().toLocaleDateString('en-GB');
  const custodiumUrl = `https://deedchainify.ng/custodium/${custodium?.ledgerId || activeTransfer?.ledger_id || ''}`;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href={`/owner/${encodeURIComponent(dcTitle)}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to {dcTitle}
        </Link>

        <div className="mb-6">
          <h1 className="font-jakarta text-2xl font-bold">Property Transfer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a Deed of Assignment for {dcTitle}
          </p>
        </div>

        {showDeed && activeTransfer ? (
          <div className="space-y-4">
            <div className="flex gap-2 print:hidden">
              <Button onClick={handlePrint} variant="outline">
                <Printer size={16} className="mr-2" />
                Print Deed
              </Button>
              <Button onClick={() => setShowDeed(false)} variant="ghost">
                Back to Form
              </Button>
            </div>

            {/* Printable Deed Document */}
            <Card className="mx-auto max-w-4xl border-2 border-primary/20 print:border-0 print:shadow-none">
              <CardContent className="p-8 print:p-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-primary pb-4">
                  <div className="flex items-center gap-3">
                    <img src="/WhatsApp_Image_2026-08-13_at_1.56.37_PM_(1).jpeg" alt="DeedChainify" className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">Govt Verified Document</p>
                      <p className="text-sm font-semibold">DeedChainify OS</p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">DC TITLE: {dcTitle}</p>
                    <p className="text-muted-foreground">DATE: {today}</p>
                    <p className="text-muted-foreground uppercase">LANG: {form.deedLanguage}</p>
                  </div>
                </div>

                <h2 className="my-6 text-center font-jakarta text-xl font-bold uppercase tracking-wide">{t.title}</h2>

                {/* Section A: Property Details */}
                <section className="mb-6">
                  <h3 className="mb-2 border-b border-border pb-1 text-sm font-bold uppercase">{t.property}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">DC Title:</span> <span className="font-medium">{dcTitle}</span></div>
                    <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{property.layout_name}, {property.lga}, {property.state}</span></div>
                    <div><span className="text-muted-foreground">Land Size:</span> <span className="font-medium">{property.size_sqm} sqm</span></div>
                    <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{property.status}</span></div>
                  </div>
                  <div className="mt-3 flex justify-center">
                    <div className="rounded-lg border border-border p-3">
                      <QRCodeSVG value={`https://deedchainify.ng/verify/${dcTitle}`} size={100} />
                      <p className="mt-1 text-center text-xs text-muted-foreground">Scan to verify property</p>
                    </div>
                  </div>
                </section>

                {/* Section B: Parties */}
                <section className="mb-6">
                  <h3 className="mb-2 border-b border-border pb-1 text-sm font-bold uppercase">{t.seller}</h3>
                  <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{activeTransfer.seller_name}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{activeTransfer.seller_phone}</span></div>
                    <div><span className="text-muted-foreground">NIN:</span> <span className="font-medium">{activeTransfer.seller_nin || 'N/A'}</span></div>
                  </div>

                  <h3 className="mb-2 border-b border-border pb-1 text-sm font-bold uppercase">{t.buyer}</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{activeTransfer.buyer_name}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{activeTransfer.buyer_phone}</span></div>
                    <div><span className="text-muted-foreground">NIN:</span> <span className="font-medium">{activeTransfer.buyer_nin || 'N/A'}</span></div>
                  </div>

                  <div className="mt-4 rounded-lg bg-muted/30 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sale Price:</span>
                      <span className="font-bold">{'\u20A6'}{activeTransfer.sale_price.toLocaleString('en-NG')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{today}</span>
                    </div>
                  </div>
                </section>

                {/* Section C: Witnesses & Authorities */}
                <section className="mb-6">
                  <h3 className="mb-2 border-b border-border pb-1 text-sm font-bold uppercase">Barrister / Legal Representative</h3>
                  <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{activeTransfer.barrister_name || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{activeTransfer.barrister_phone || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">NIN:</span> <span className="font-medium">{activeTransfer.barrister_nin || 'N/A'}</span></div>
                  </div>

                  <h3 className="mb-2 border-b border-border pb-1 text-sm font-bold uppercase">Community Witnesses</h3>
                  <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-muted-foreground">1.</span> <span className="font-medium">{activeTransfer.witness1_phone || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">2.</span> <span className="font-medium">{activeTransfer.witness2_phone || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">3.</span> <span className="font-medium">{activeTransfer.witness3_phone || 'N/A'}</span></div>
                  </div>

                  <h3 className="mb-2 border-b border-border pb-1 text-sm font-bold uppercase">Traditional Authority</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Chief Name:</span> <span className="font-medium">{activeTransfer.chief_name || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">Chief Phone:</span> <span className="font-medium">{activeTransfer.chief_phone || 'N/A'}</span></div>
                  </div>
                  <div className="mt-3 h-20 rounded-lg border-2 border-dashed border-border print:h-24" />
                  <p className="mt-1 text-center text-xs text-muted-foreground">Signature Box for Chief + Thumbprint</p>
                </section>

                {/* Section D: Declaration */}
                <section className="mb-6">
                  <h3 className="mb-2 border-b border-border pb-1 text-sm font-bold uppercase">{t.declaration}</h3>
                  <p className="text-sm text-muted-foreground">{t.footer}</p>
                </section>

                {/* Section F: Geotier & Pricing */}
                <section className="mb-6">
                  <h3 className="mb-2 border-b border-border pb-1 text-sm font-bold uppercase">{t.geotier}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">State:</span> <span className="font-medium">{activeTransfer.state || form.state}</span></div>
                    <div><span className="text-muted-foreground">LGA:</span> <span className="font-medium">{activeTransfer.lga || form.lga}</span></div>
                    <div><span className="text-muted-foreground">Tier:</span> <span className="font-medium">{TIER_LABELS[activeTransfer.tier || tierInfo.tier]}</span></div>
                    <div><span className="text-muted-foreground">Processing Fee:</span> <span className="font-bold">{formatNaira(activeTransfer.tier_price || tierInfo.price)}</span></div>
                  </div>
                </section>

                {/* Section G: Private Custodium Proof */}
                <section className="mb-6">
                  <h3 className="mb-2 border-b border-border pb-1 text-sm font-bold uppercase">{t.custodium}</h3>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="space-y-2 text-sm">
                      <div><span className="text-muted-foreground">Custodium Network:</span> <span className="font-medium">DEEDCHAINIFY PRIVATE LEDGER v1</span></div>
                      <div><span className="text-muted-foreground">PDF Hash:</span> <p className="mt-0.5 font-mono text-xs break-all">{custodium?.pdfHash || activeTransfer.pdf_hash || 'Pending'}</p></div>
                      <div><span className="text-muted-foreground">Ledger ID:</span> <span className="font-mono text-xs">{custodium?.ledgerId || activeTransfer.ledger_id || 'Pending'}</span></div>
                      <div><span className="text-muted-foreground">Seal Signature:</span> <p className="mt-0.5 font-mono text-xs break-all">{custodium?.signature || activeTransfer.signature || 'Pending'}</p></div>
                      <div><span className="text-muted-foreground">Timestamp:</span> <span className="font-medium">{today}</span></div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="rounded-lg border border-border p-2">
                        <QRCodeSVG value={custodiumUrl} size={70} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Verification</p>
                        <p className="text-xs font-medium">Scan QR or visit deedchainify.ng/custodium/{(custodium?.ledgerId || activeTransfer.ledger_id || '').substring(0, 8)}...</p>
                        <p className="mt-1 text-xs text-primary">Cryptographically sealed. Any alteration invalidates the seal.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Approval Seal */}
                <div className="mb-6 flex items-center justify-center gap-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-green-600 bg-green-50">
                    <div className="text-center">
                      <ShieldCheck size={24} className="mx-auto text-green-600" />
                      <p className="mt-1 text-[10px] font-bold uppercase text-green-700">{t.approved}</p>
                    </div>
                  </div>
                </div>

                {/* Section E: Signatures */}
                <section className="mt-8 grid grid-cols-2 gap-8">
                  <div>
                    <div className="border-t-2 border-foreground pt-1" />
                    <p className="text-xs text-muted-foreground">Seller Signature</p>
                  </div>
                  <div>
                    <div className="border-t-2 border-foreground pt-1" />
                    <p className="text-xs text-muted-foreground">Buyer Signature</p>
                  </div>
                  <div>
                    <div className="border-t-2 border-foreground pt-1" />
                    <p className="text-xs text-muted-foreground">Barrister Stamp</p>
                  </div>
                  <div>
                    <div className="border-t-2 border-foreground pt-1" />
                    <p className="text-xs text-muted-foreground">Chief Signature</p>
                  </div>
                </section>

                {/* Watermark */}
                <p className="mt-8 border-t border-border pt-2 text-center text-xs text-muted-foreground">
                  Printed for {activeTransfer.buyer_name} on {today}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Transfer Form */}
            <div className="lg:col-span-2">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-jakarta text-lg">Deed of Assignment Form</CardTitle>
                  <CardDescription>Fill in all required fields to create the transfer deed</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Geotier Pricing */}
                    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                      <div className="flex items-center gap-2">
                        <Lock size={16} className="text-primary" />
                        <p className="text-sm font-bold">{t.geotier}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="state">State</Label>
                          <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                            <SelectTrigger id="state"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="KANO">Kano</SelectItem>
                              <SelectItem value="ABUJA">Abuja</SelectItem>
                              <SelectItem value="LAGOS">Lagos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lga">LGA</Label>
                          <Input id="lga" required value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} placeholder="e.g. Fagge, Ikeja, Wuse" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between rounded-lg bg-background p-3">
                        <div>
                          <p className="text-xs text-muted-foreground">{TIER_LABELS[tierInfo.tier]}</p>
                          <p className="text-lg font-bold text-primary">{formatNaira(tierInfo.price)}</p>
                        </div>
                        <Badge className="bg-primary/10 text-primary">Tier {tierInfo.tier}</Badge>
                      </div>
                    </div>

                    {/* Seller */}
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase text-primary">Seller Details</h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="sellerName">Full Name</Label>
                          <Input id="sellerName" required value={form.sellerName} onChange={(e) => setForm({ ...form, sellerName: e.target.value })} placeholder="Seller name" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="sellerPhone">Phone</Label>
                          <Input id="sellerPhone" required value={form.sellerPhone} onChange={(e) => setForm({ ...form, sellerPhone: e.target.value })} placeholder="08012345678" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="sellerNIN">NIN</Label>
                          <Input id="sellerNIN" value={form.sellerNIN} onChange={(e) => setForm({ ...form, sellerNIN: e.target.value })} placeholder="12345678901" />
                        </div>
                      </div>
                    </div>

                    {/* Buyer */}
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase text-primary">Buyer Details</h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="buyerName">Full Name</Label>
                          <Input id="buyerName" required value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} placeholder="Buyer name" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="buyerPhone">Phone</Label>
                          <Input id="buyerPhone" required value={form.buyerPhone} onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })} placeholder="08012345678" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="buyerNIN">NIN</Label>
                          <Input id="buyerNIN" value={form.buyerNIN} onChange={(e) => setForm({ ...form, buyerNIN: e.target.value })} placeholder="12345678901" />
                        </div>
                      </div>
                    </div>

                    {/* Sale Price */}
                    <div className="space-y-1.5">
                      <Label htmlFor="salePrice">Sale Price (NGN)</Label>
                      <Input id="salePrice" type="number" required value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} placeholder="5000000" />
                    </div>

                    {/* Barrister */}
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase text-primary">Barrister / Legal Representative</h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="barristerName">Name</Label>
                          <Input id="barristerName" required value={form.barristerName} onChange={(e) => setForm({ ...form, barristerName: e.target.value })} placeholder="Barrister name" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="barristerPhone">Phone</Label>
                          <Input id="barristerPhone" required value={form.barristerPhone} onChange={(e) => setForm({ ...form, barristerPhone: e.target.value })} placeholder="08012345678" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="barristerNIN">NIN</Label>
                          <Input id="barristerNIN" value={form.barristerNIN} onChange={(e) => setForm({ ...form, barristerNIN: e.target.value })} placeholder="12345678901" />
                        </div>
                      </div>
                    </div>

                    {/* Witnesses */}
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase text-primary">Community Witnesses (3 Neighbors)</h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="witness1Phone">Witness 1 Phone</Label>
                          <Input id="witness1Phone" required value={form.witness1Phone} onChange={(e) => setForm({ ...form, witness1Phone: e.target.value })} placeholder="08012345678" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="witness2Phone">Witness 2 Phone</Label>
                          <Input id="witness2Phone" required value={form.witness2Phone} onChange={(e) => setForm({ ...form, witness2Phone: e.target.value })} placeholder="08012345678" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="witness3Phone">Witness 3 Phone</Label>
                          <Input id="witness3Phone" required value={form.witness3Phone} onChange={(e) => setForm({ ...form, witness3Phone: e.target.value })} placeholder="08012345678" />
                        </div>
                      </div>
                    </div>

                    {/* Chief */}
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase text-primary">Traditional Authority</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="chiefName">Chief Name</Label>
                          <Input id="chiefName" required value={form.chiefName} onChange={(e) => setForm({ ...form, chiefName: e.target.value })} placeholder="Chief name" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="chiefPhone">Chief Phone</Label>
                          <Input id="chiefPhone" required value={form.chiefPhone} onChange={(e) => setForm({ ...form, chiefPhone: e.target.value })} placeholder="08012345678" />
                        </div>
                      </div>
                    </div>

                    {/* Language */}
                    <div className="space-y-1.5">
                      <Label htmlFor="deedLanguage">Deed Document Language</Label>
                      <Select value={form.deedLanguage} onValueChange={(v) => setForm({ ...form, deedLanguage: v as 'en' | 'ha' | 'yo' })}>
                        <SelectTrigger id="deedLanguage">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ha">Hausa</SelectItem>
                          <SelectItem value="yo">Yoruba</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={submitting || !allFieldsFilled}>
                      {submitting ? <Loader2 className="animate-spin" /> : <Send size={18} className="mr-2" />}
                      {submitting ? 'Creating transfer & sealing...' : 'Generate Official Deed'}
                    </Button>
                    {!allFieldsFilled && (
                      <p className="text-center text-xs text-muted-foreground">Fill all required fields to enable deed generation</p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Existing Transfers */}
            <div>
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-jakarta text-lg">Existing Transfers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {transfers.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <FileText size={32} className="text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No transfers yet</p>
                    </div>
                  ) : (
                    transfers.map((tr) => {
                      const witnessApproved = [tr.witness1_status, tr.witness2_status, tr.witness3_status].filter((s) => s === 'APPROVED').length;
                      return (
                        <div key={tr.id} className="rounded-lg border border-border/60 p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-xs font-bold">{tr.transfer_id}</p>
                            <Badge variant="outline" className={
                              tr.status === 'APPROVED' ? 'border-green-300 bg-green-50 text-green-700' :
                              tr.status === 'DISPUTED' ? 'border-red-300 bg-red-50 text-red-700' :
                              'border-yellow-300 bg-yellow-50 text-yellow-700'
                            }>
                              {tr.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm">{tr.buyer_name} &rarr; {tr.seller_name}</p>
                          <p className="text-xs text-muted-foreground">{'\u20A6'}{tr.sale_price.toLocaleString('en-NG')}</p>
                          <div className="mt-2 flex items-center gap-1 text-xs">
                            {witnessApproved}/3 witnesses
                            {witnessApproved >= 2 ? <CheckCircle size={12} className="text-green-600" /> : <Clock size={12} className="text-yellow-600" />}
                          </div>
                          {tr.ledger_id && (
                            <Badge className="mt-2 bg-primary/10 text-primary">
                              <Lock size={10} className="mr-1" />
                              Custodium Sealed
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => { setActiveTransfer(tr); setShowDeed(true); }}
                          >
                            <FileText size={14} className="mr-1.5" />
                            View Deed
                          </Button>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
