'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2, X, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

type QrScannerProps = {
  onScan: (decodedText: string) => void;
  title?: string;
  onCameraDenied?: () => void;
};

export function QrScanner({ onScan, title = 'Scan QR Code', onCameraDenied }: QrScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const lastScanRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    setStarting(true);

    try {
      // Check camera permissions first
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as any });
          if (permissionStatus.state === 'denied') {
            setCameraDenied(true);
            setError('Camera permission is denied. Please enable camera permissions in your browser settings or enter the code manually.');
            toast.error('Camera permission denied. Please enter the code manually below.');
            if (onCameraDenied) onCameraDenied();
            setStarting(false);
            return;
          }
        } catch (permError) {
          // Permission API not supported, continue with camera attempt
          console.log('Permission API not supported, continuing with camera attempt');
        }
      }

      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-reader', { verbose: false });
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText: string) => {
          const now = Date.now();
          if (
            lastScanRef.current.text === decodedText &&
            now - lastScanRef.current.time < 3000
          ) {
            return;
          }
          lastScanRef.current = { text: decodedText, time: now };
          stopScanner();
          onScan(decodedText);
        },
        () => {
          // ignore per-frame errors
        },
      );

      setScanning(true);
    } catch (err: any) {
      setCameraDenied(true);
      setError(
        'Could not access camera. Please allow camera permissions or enter the code manually.',
      );
      toast.error('Camera access denied. Please enter the code manually below.');
      if (onCameraDenied) onCameraDenied();
    } finally {
      setStarting(false);
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="space-y-3">
      {!scanning && !starting && (
        <Button
          onClick={startScanner}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <Camera size={20} className="mr-2" />
          Open Camera Scanner
        </Button>
      )}

      {starting && (
        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Starting camera...</span>
        </div>
      )}

      {scanning && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border-2 border-primary/40">
            <div id="qr-reader" ref={scannerRef} className="w-full" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-56 w-56 rounded-xl border-2 border-primary/60 shadow-lg">
                <div className="absolute left-1/2 top-1/2 h-0.5 w-56 -translate-x-1/2 -translate-y-1/2 animate-pulse bg-primary" />
              </div>
            </div>
            <div className="absolute left-0 right-0 top-0 bg-primary/90 px-4 py-1.5 text-center text-xs font-medium text-primary-foreground">
              {title} - Point camera at QR code
            </div>
          </div>
          <Button onClick={stopScanner} variant="outline" className="w-full">
            <CameraOff size={18} className="mr-2" />
            Stop Camera
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
