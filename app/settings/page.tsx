'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Trash2, Image as ImageIcon, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useLogo } from '@/lib/logo-context';
import { supabase } from '@/lib/supabase/client';
import { SiteHeader } from '@/components/site-header';
import Link from 'next/link';

export default function SettingsPage() {
  const { profile, loading } = useAuth();
  const { logoUrl, refresh } = useLogo();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login');
    }
  }, [profile, loading, router]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(`logos/${fileName}`, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(`logos/${fileName}`);

      const publicUrl = urlData.publicUrl;

      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'logo_url')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('settings')
          .update({ value: publicUrl, updated_at: new Date().toISOString() })
          .eq('key', 'logo_url');
      } else {
        await supabase
          .from('settings')
          .insert({ key: 'logo_url', value: publicUrl });
      }

      await refresh();
      toast.success('Logo uploaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload logo');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  async function removeLogo() {
    try {
      await supabase.from('settings').delete().eq('key', 'logo_url');
      await refresh();
      setPreview(null);
      toast.success('Logo removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove logo');
    }
  }

  if (loading || !profile) {
    return (
      <>
        <SiteHeader />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </>
    );
  }

  const currentLogo = preview || logoUrl;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/owner" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ImageIcon size={20} className="text-primary" />
              </div>
              <div>
                <CardTitle className="font-jakarta text-xl">Platform Logo</CardTitle>
                <CardDescription>Upload your brand logo to display across the site</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preview */}
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8">
              {currentLogo ? (
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={currentLogo}
                    alt="Logo preview"
                    className="h-24 w-24 rounded-xl object-cover shadow-md"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <ShieldCheck size={20} />
                    </div>
                    <span className="font-jakarta text-lg font-bold">DeedChainify</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Preview of how your logo appears</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <ImageIcon size={36} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No logo uploaded yet</p>
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload size={16} className="mr-2" /> Upload Logo</>
                )}
              </Button>
              {currentLogo && (
                <Button
                  onClick={removeLogo}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} className="mr-2" />
                  Remove Logo
                </Button>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Recommended: square image (e.g. 256x256px), PNG or JPG, under 2MB.
                Your logo appears in the header and footer across all pages.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
