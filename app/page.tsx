'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, Eye, Lock, Users, MapPin, QrCode, Landmark,
  Banknote, Clock, AlertTriangle, CheckCircle, ArrowRight,
  Zap, FileCheck, Building2, TrendingUp, Globe,
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { formatNaira } from '@/lib/dcid';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="animate-slide-up">
                <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">
                  <Zap size={12} className="mr-1.5" />
                  Bankable in 30ms
                </Badge>
                <h1 className="font-jakarta text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Verify Land in{' '}
                  <span className="text-primary">60 Seconds</span>
                </h1>
                <p className="mt-5 text-lg text-muted-foreground text-balance">
                  Make every land in Nigeria bankable with DCID, QR, and Community
                  Verification. Replace paper fraud with digital trust.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto">
                      <ShieldCheck size={18} className="mr-2" />
                      Get Your DCID
                    </Button>
                  </Link>
                  <Link href="/verify">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      <QrCode size={18} className="mr-2" />
                      Scan to Verify
                    </Button>
                  </Link>
                </div>
                <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-primary" />
                    First scan FREE for life
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-primary" />
                    Community verified
                  </div>
                </div>
              </div>

              <div className="relative animate-scale-in">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/20 to-secondary/20 blur-2xl" />
                <div className="relative overflow-hidden rounded-2xl border border-border shadow-2xl">
                  <img
                    src="https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                    alt="Residential building in Nigeria"
                    className="h-[400px] w-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <div className="flex items-center gap-2 text-white">
                      <MapPin size={16} />
                      <span className="text-sm font-medium">DC-KN-FG-FAGGE-B12-P04-001</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className="bg-green-500/90 text-white">
                        <CheckCircle size={12} className="mr-1" />
                        VERIFIED
                      </Badge>
                      <span className="text-xs text-white/80">Fagge, Kano &middot; 450 sqm</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-4 -top-4 rounded-xl border border-border bg-card p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <QrCode size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Scan Fee</p>
                      <p className="text-sm font-bold">{formatNaira(5000)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-border/60 bg-muted/30">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-10 sm:px-6 md:grid-cols-4">
            {[
              { value: '30ms', label: 'Verification Speed', icon: Zap },
              { value: '36', label: 'States + FCT', icon: Globe },
              { value: '4', label: 'Languages', icon: FileCheck },
              { value: '0', label: 'Paper Fraud', icon: ShieldCheck },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon size={20} className="mx-auto mb-1 text-primary" />
                <div className="font-jakarta text-2xl font-bold sm:text-3xl">{stat.value}</div>
                <div className="text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <Badge variant="outline" className="mb-3">How It Works</Badge>
            <h2 className="font-jakarta text-3xl font-bold tracking-tight sm:text-4xl">
              From Paper to Verified in 3 Steps
            </h2>
            <p className="mt-3 text-muted-foreground">No more lost documents. No more fake titles.</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: '1. Get Your DCID',
                desc: 'Sign up with phone + NIN. 4 roles: User, Landlord, Chief, Barrister.',
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                icon: QrCode,
                title: '2. Onboard Property with Co-Ownership',
                desc: 'Add 1 to 50 owners with %. Set share for each person. Generate QR + DC_TITLE.',
                color: 'text-secondary',
                bg: 'bg-secondary/10',
              },
              {
                icon: Users,
                title: '3. Community Verify',
                desc: 'Neighbors confirm. Chief approves via SMS. Status goes GREEN. Bankable.',
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
            ].map((step) => (
              <Card key={step.title} className="relative overflow-hidden border-border/60 transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.bg}`}>
                    <step.icon size={24} className={step.color} />
                  </div>
                  <CardTitle className="mt-4 font-jakarta">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Status System */}
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-3">Status System</Badge>
              <h2 className="font-jakarta text-3xl font-bold tracking-tight sm:text-4xl">
                Every Property Has a Status
              </h2>
              <p className="mt-3 text-muted-foreground">Know exactly where a land record stands.</p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: CheckCircle, label: 'VERIFIED', desc: 'Govt Approved', color: 'green', border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-700' },
                { icon: Clock, label: 'WAITING', desc: 'Chief Approval Pending', color: 'yellow', border: 'border-yellow-300', bg: 'bg-yellow-50', text: 'text-yellow-700' },
                { icon: AlertTriangle, label: 'DISPUTED', desc: 'Contested Title', color: 'red', border: 'border-red-300', bg: 'bg-red-50', text: 'text-red-700' },
                { icon: Banknote, label: 'COLLATERAL', desc: 'Pledged to Bank via API', color: 'blue', border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-700' },
              ].map((status) => (
                <Card key={status.label} className={`border-2 ${status.border} ${status.bg}`}>
                  <CardContent className="pt-6">
                    <status.icon size={28} className={status.text} />
                    <h3 className={`mt-3 font-bold ${status.text}`}>{status.label}</h3>
                    <p className="text-sm text-muted-foreground">{status.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Revenue Model */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-3">Revenue Model</Badge>
              <h2 className="font-jakarta text-3xl font-bold tracking-tight sm:text-4xl">
                Transparent Pricing
              </h2>
              <p className="mt-3 text-muted-foreground">
                First QR scan per property is FREE for life. After that, pay per scan.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: Eye, title: 'Public QR Scan', price: formatNaira(5000), note: 'First scan FREE for life' },
                  { icon: Lock, title: 'Private Onboarding', price: formatNaira(10000) + ' - ' + formatNaira(50000), note: 'Geo-tier pricing (Urban/ City/ Rural)' },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.note}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-secondary/20 to-primary/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-border shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/12969403/pexels-photo-12969403.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Digital proptech analytics dashboard"
                  className="h-[400px] w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldCheck size={16} />
                    <span className="text-sm font-medium">Digital PropTech Platform</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="bg-primary/90 text-white">
                      <Zap size={12} className="mr-1" />
                      Real-time
                    </Badge>
                    <span className="text-xs text-white/80">Blockchain verified &middot; QR secured</span>
                  </div>
                </div>
              </div>
              <div className="absolute -left-4 -top-4 rounded-xl border border-border bg-card p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <Lock size={20} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Custodium Seal</p>
                    <p className="text-sm font-bold">Tamper-proof</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Portals */}
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-3">Portals</Badge>
              <h2 className="font-jakarta text-3xl font-bold tracking-tight sm:text-4xl">
                Dashboards for Every Stakeholder
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { icon: Building2, title: 'Chief Portal', desc: 'Pending approvals, approve/reject land transfer via OTP, approved history, community lands', href: '/dashboard/chief', color: 'text-primary' },
                { icon: Landmark, title: 'Landlord Portal', desc: 'My properties, add new property, upload C of O/Deed/Survey, pending sales, earnings, withdraw via Paystack', href: '/dashboard/landlord', color: 'text-blue-600' },
                { icon: TrendingUp, title: 'Barrister Portal', desc: 'Assigned cases, verify documents, generate deed of assignment, legal fees', href: '/dashboard/barrister', color: 'text-secondary' },
              ].map((portal) => (
                <Link key={portal.title} href={portal.href}>
                  <Card className="h-full border-border/60 transition-all hover:shadow-lg hover:-translate-y-1">
                    <CardContent className="pt-6">
                      <portal.icon size={32} className={portal.color} />
                      <h3 className="mt-4 font-jakarta text-lg font-bold">{portal.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{portal.desc}</p>
                      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                        Open Portal <ArrowRight size={14} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 to-secondary/5 p-12">
            <ShieldCheck size={48} className="mx-auto text-primary" />
            <h2 className="mt-6 font-jakarta text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Make Your Land Bankable?
            </h2>
            <p className="mt-3 text-muted-foreground text-balance">
              Join thousands of property owners building digital trust in Nigeria.
              Get your lifetime DCID today.
            </p>
            <Link href="/signup" className="mt-6 inline-block">
              <Button size="lg">
                Get Started Free <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
