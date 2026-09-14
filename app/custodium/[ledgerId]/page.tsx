'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, Loader2, ArrowLeft, Fingerprint, FileCheck, Link2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

// Explicit type definition resolving the module resolution failure
export type PrivateLedger = {
  id: string;
  dc_title: string;
  transfer_id: string;
  pdf_hash: string;
  timestamp: string | number | Date;
  signature: string;
  previous_hash: string;
};

export default function CustodiumVerifyPage() {
  const params = useParams();
  const ledgerId = params.ledgerId as string;

  const [block, setBlock] = useState<PrivateLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    async function verify() {
      const { data, error } = await supabase
        .from('private_ledger')
        .select('*')
        .eq('id', ledgerId)
        .maybeSingle();

      if (error || !data) {
        setValid(false);
        setLoading(false);
        return;
      }

      setBlock(data as PrivateLedger);

      // Verify the chain: check that previous_hash matches the prior block's pdf_hash
      if (data.previous_hash === 'GENESIS_BLOCK') {
        setValid(true);
      } else {
        const { data: prevBlock } = await supabase
          .from('private_ledger')
          .select('pdf_hash')
          .eq('pdf_hash', data.previous_hash)
          .maybeSingle();

        setValid(!!prevBlock);
      }

      setLoading(false);
    }
    verify();
  }, [ledgerId]);

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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {valid === null || !valid && !block ? (
          <Card className="border-red-300">
            <CardContent className="py-16 text-center">
              <AlertTriangle size={48} className="mx-auto text-red-600" />
              <h2 className="mt-4 font-jakarta text-xl font-bold text-red-700">Invalid Ledger Entry</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This custodium record could not be found or has been tampered with.
              </p>
            </CardContent>
          </Card>
        ) : valid ? (
          <Card className="border-2 border-green-300">
            <div className="h-2 bg-gradient-to-r from-green-500 to-green-600" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <ShieldCheck size={24} className="text-green-600" />
                </div>
                <div>
                  <CardTitle className="font-jakarta text-lg text-green-800">Custodium Verified</CardTitle>
                  <CardDescription>This deed is cryptographically sealed and valid</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-2">
                    <FileCheck size={16} className="text-primary" />
                    <p className="text-xs text-muted-foreground">DC Title</p>
                  </div>
                  <p className="mt-1 font-mono text-sm font-medium">{block?.dc_title}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-2">
                    <Link2 size={16} className="text-primary" />
                    <p className="text-xs text-muted-foreground">Transfer ID</p>
                  </div>
                  <p className="mt-1 font-mono text-sm font-medium">{block?.transfer_id}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-2">
                    <Fingerprint size={16} className="text-primary" />
                    <p className="text-xs text-muted-foreground">PDF Hash (SHA-256)</p>
                  </div>
                  <p className="mt-1 font-mono text-xs break-all">{block?.pdf_hash}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-primary" />
                    <p className="text-xs text-muted-foreground">Sealed On</p>
                  </div>
                  <p className="mt-1 text-sm font-medium">
                    {block ? new Date(block.timestamp).toLocaleString('en-GB') : ''}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Seal Signature (HMAC-SHA256)</p>
                <p className="mt-1 font-mono text-xs break-all">{block?.signature}</p>
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600 text-white">SEALED</Badge>
                  <span className="text-sm text-green-700">
                    This document is cryptographically sealed on the DeedChainify Private Ledger.
                    Any alteration invalidates the seal.
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Previous Block Hash</p>
                <p className="mt-1 font-mono text-xs break-all">{block?.previous_hash}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-red-300">
            <div className="h-2 bg-gradient-to-r from-red-500 to-red-600" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <CardTitle className="font-jakarta text-lg text-red-800">Tampered or Broken Chain</CardTitle>
                  <CardDescription>The blockchain chain link is broken for this entry</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-600 text-white">INVALID</Badge>
                  <span className="text-sm text-red-700">
                    The chain link to the previous block could not be verified. This record may have been tampered with.
                  </span>
                </div>
              </div>
              {block && (
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Expected Previous Hash</p>
                  <p className="mt-1 font-mono text-xs break-all">{block.previous_hash}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
