'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, ShieldCheck, Stamp, CheckCircle, ArrowRight,
  Lock, Eye, ArrowRightLeft, Download, Gavel,
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { formatNaira } from '@/lib/dcid';

export default function DocumentingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <Badge variant="outline" className="mb-3">Documenting</Badge>
          <h1 className="font-jakarta text-3xl font-bold tracking-tight sm:text-4xl">
            Property Documenting
          </h1>
          <p className="mt-3 text-muted-foreground">
            Onboard, seal, and transfer land documents. Every property gets a permanent digital record with blockchain-verified Custodium seals.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Eye,
              title: 'Public QR Scan',
              price: formatNaira(5000),
              note: 'First scan FREE for life. Then N5,000 per scan',
              features: ['First scan FREE for life', 'Anyone can scan to verify', 'Instant verification', '100% to DeedChainify'],
              color: 'text-primary',
              bg: 'bg-primary/10',
            },
            {
              icon: Lock,
              title: 'Private Onboarding + Custodium Seal',
              price: `${formatNaira(10000)} - ${formatNaira(50000)}`,
              note: 'Geo-tier pricing (Urban N50k, City N25k, Rural N10k). One-time payment. Bankable.',
              features: ['Tier 3: N10k (Rural)', 'Tier 2: N25k (City)', 'Tier 1: N50k (Urban)', 'Includes Custodium blockchain seal'],
              color: 'text-secondary',
              bg: 'bg-secondary/10',
              featured: true,
              badge: 'Most Popular for Banks',
            },
            {
              icon: ArrowRightLeft,
              title: 'Property Transfer',
              price: 'Tier Fee',
              note: 'Each time property is sold',
              features: ['Geo-tier based transfer fee', 'Deed of Assignment generated', 'Sealed to Private Custodium', 'SMS to witnesses + chief'],
              color: 'text-blue-600',
              bg: 'bg-blue-100',
            },
          ].map((plan) => (
            <Card
              key={plan.title}
              className={`relative overflow-hidden border-border/60 ${plan.featured ? 'border-2 border-primary/40 shadow-lg' : ''}`}
            >
              {plan.featured && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {plan.badge}
                </div>
              )}
              <CardHeader>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${plan.bg}`}>
                  <plan.icon size={24} className={plan.color} />
                </div>
                <CardTitle className="mt-3 font-jakarta">{plan.title}</CardTitle>
                <div className="mt-2">
                  <span className="font-jakarta text-2xl font-bold">{plan.price}</span>
                  <p className="text-sm text-muted-foreground">{plan.note}</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className="text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-6 block">
                  <Button className="w-full" variant={plan.featured ? 'default' : 'outline'}>
                    Get Started <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Documenting process */}
        <div className="mt-16">
          <h2 className="text-center font-jakarta text-xl font-bold">How Documenting Works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              { icon: FileText, title: '1. Onboard Property', desc: 'Landlord enters property details, GPS, and co-ownership splits' },
              { icon: ShieldCheck, title: '2. Youverify KYC', desc: 'NIN and identity verified via Youverify for all parties' },
              { icon: Stamp, title: '3. Custodium Seal', desc: 'Document sealed to the private blockchain ledger with a unique hash' },
              { icon: Gavel, title: '4. Chief Approves', desc: 'Traditional ruler approves transfer via SMS OTP through Termii' },
            ].map((step) => (
              <Card key={step.title} className="border-border/60">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon size={26} className="text-primary" />
                  </div>
                  <h3 className="mt-4 font-jakarta text-sm font-bold">{step.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Documenting table */}
        <div className="mt-16">
          <h2 className="text-center font-jakarta text-xl font-bold">Documenting Fees</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="mx-auto w-full max-w-2xl border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="py-3 text-left font-semibold">Document Type</th>
                  <th className="py-3 text-left font-semibold">Price</th>
                  <th className="py-3 text-left font-semibold">Limit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/60">
                  <td className="py-3">Public QR Scan</td>
                  <td className="py-3 font-medium">{formatNaira(5000)}</td>
                  <td className="py-3 text-muted-foreground">First scan FREE for life per property</td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-3">Private Onboarding</td>
                  <td className="py-3 font-medium">{formatNaira(10000)} - {formatNaira(50000)}</td>
                  <td className="py-3 text-muted-foreground">One-time per property based on geo-tier</td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-3">Custodium Seal</td>
                  <td className="py-3 font-medium">Included</td>
                  <td className="py-3 text-muted-foreground">With private onboarding</td>
                </tr>
                <tr>
                  <td className="py-3">Property Transfer (Deed of Assignment)</td>
                  <td className="py-3 font-medium">Tier Fee</td>
                  <td className="py-3 text-muted-foreground">Each time property is sold</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
      <SiteFooter />
    </>
  );
}
