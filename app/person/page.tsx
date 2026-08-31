'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCircle, Search, Camera, Keyboard, ScanLine } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { QrScanner } from '@/components/qr-scanner';
import { toast } from 'sonner';

export default function PersonSearchPage() {
  const router = useRouter();
  const [dcId, setDcId] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!dcId.trim()) {
      toast.error('Enter a DCID to verify');
      return;
    }
    router.push(`/person/${dcId.trim()}`);
  }

  function handleScan(decoded: string) {
    let id = decoded.trim();
    if (id.startsWith('http')) {
      const match = id.match(/\/person\/(.+)$/);
      if (match) id = decodeURIComponent(match[1]);
      else {
        toast.error('QR code does not contain a valid person link');
        return;
      }
    }
    if (id.startsWith('DC-')) {
      toast.success('QR scanned: ' + id);
      router.push(`/person/${id}`);
    } else {
      toast.error('Invalid QR code. Expected a DCID like DC-KN-2026-000001');
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Card className="border-border/60">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <UserCircle size={28} className="text-primary" />
            </div>
            <CardTitle className="font-jakarta text-2xl">Verify Person</CardTitle>
            <CardDescription>
              Scan a person&apos;s DCID QR or enter it manually to see all their properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="scan">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scan">
                  <Camera size={16} className="mr-1.5" />
                  Scan QR
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <Keyboard size={16} className="mr-1.5" />
                  Enter DCID
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scan" className="mt-4 space-y-4">
                <QrScanner onScan={handleScan} title="Scan Person DCID" />
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <ScanLine size={16} className="text-primary" />
                    <p className="text-sm font-medium">Bank Verification</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Used by banks to verify a person&apos;s identity and all properties
                    before approving loans. {`\u20A6`}5,000 per scan.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-4 space-y-4">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      value={dcId}
                      onChange={(e) => setDcId(e.target.value)}
                      placeholder="DC-KN-2026-000001"
                      className="h-12 text-lg font-mono"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    <Search size={18} className="mr-2" />
                    Verify Person
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
