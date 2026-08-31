'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Search, ScanLine, Camera, Keyboard } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { QrScanner } from '@/components/qr-scanner';
import { toast } from 'sonner';

export default function VerifySearchPage() {
  const router = useRouter();
  const [dcTitle, setDcTitle] = useState('');
  const [defaultTab, setDefaultTab] = useState('scan');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!dcTitle.trim()) {
      toast.error('Enter a DC Title to verify');
      return;
    }
    router.push(`/verify/${dcTitle.trim()}`);
  }

  function handleScan(decoded: string) {
    let title = decoded.trim();
    if (title.startsWith('http')) {
      const match = title.match(/\/verify\/(.+)$/);
      if (match) title = decodeURIComponent(match[1]);
      else {
        toast.error('QR code does not contain a valid property link');
        return;
      }
    }
    if (title.startsWith('DC-')) {
      toast.success('QR scanned: ' + title);
      router.push(`/verify/${title}`);
    } else {
      toast.error('Invalid QR code. Expected a DC Title like DC-KN-FG-FAGGE-B12-P04-001');
    }
  }

  function handleCameraDenied() {
    setDefaultTab('manual');
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Card className="border-border/60">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <ScanLine size={28} className="text-primary" />
            </div>
            <CardTitle className="font-jakarta text-2xl">Verify Land</CardTitle>
            <CardDescription>
              Scan a QR code or enter a DC Title to verify property ownership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scan">
                  <Camera size={16} className="mr-1.5" />
                  Scan QR
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <Keyboard size={16} className="mr-1.5" />
                  Enter Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scan" className="mt-4 space-y-4">
                <QrScanner onScan={handleScan} title="Scan Property QR" onCameraDenied={handleCameraDenied} />
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <QrCode size={16} className="text-primary" />
                    <p className="text-sm font-medium">How it works</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    First scan per property is FREE for life. After that,
                    {`\u20A6`}5,000 per scan. Point your camera at any DeedChainify QR code.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-4 space-y-4">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      value={dcTitle}
                      onChange={(e) => setDcTitle(e.target.value)}
                      placeholder="DC-KN-FG-FAGGE-B12-P04-001"
                      className="h-12 text-lg font-mono"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    <Search size={18} className="mr-2" />
                    Verify Property
                  </Button>
                </form>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <QrCode size={16} className="text-primary" />
                    <p className="text-sm font-medium">Pricing</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    First scan per property is FREE for life. After that,
                    {`\u20A6`}5,000 per scan.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
