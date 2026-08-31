'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, ArrowRight, Eye, EyeOff, User, Home, Crown, Scale, Building,
  CheckCircle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { generateDCID, STATE_CODES, generateLandlordId, generateBarristerId, generateDeveloperId } from '@/lib/dcid';
import { SiteHeader } from '@/components/site-header';
import { TermsConsent } from '@/components/terms-consent';
import { useLanguage } from '@/lib/language-context';

type Role = 'user' | 'landlord' | 'chief' | 'barrister' | 'developer';

const ROLE_INFO: Record<Role, { label: string; icon: typeof User; desc: string }> = {
  user: { label: 'User', icon: User, desc: 'Property buyer — verify properties and owners' },
  landlord: { label: 'Landlord', icon: Home, desc: 'Property seller — onboard and manage your land' },
  chief: { label: 'Chief', icon: Crown, desc: 'Community leader — approve land transfers via SMS' },
  barrister: { label: 'Barrister', icon: Scale, desc: 'Lawyer — verify documents and generate deeds' },
  developer: { label: 'Developer', icon: Building, desc: 'Real estate developer — manage development projects' },
};

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [role, setRole] = useState<Role>('user');
  const { language } = useLanguage();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    nin: '',
    state: 'Kano',
    referralCode: '',
    cacNumber: '',
    traditionalTitle: '',
    titleProof: '',
    barId: '',
    lawLicense: '',
    companyLicense: '',
    developerId: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;

    if (role === 'landlord' && !form.cacNumber.trim()) {
      toast.error('CAC number is required for landlords');
      return;
    }
    if (role === 'chief' && !form.traditionalTitle.trim()) {
      toast.error('Traditional title is required for chiefs');
      return;
    }
    if (role === 'barrister' && (!form.barId.trim() || !form.lawLicense.trim())) {
      toast.error('Bar ID and Law Practice License are required for barristers');
      return;
    }
    if (role === 'developer' && (!form.companyLicense.trim() || !form.developerId.trim())) {
      toast.error('Company License and Developer ID are required for developers');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName, phone: form.phone, role } },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      const { data: allProfiles } = await supabase.from('profiles').select('id');
      const seq = (allProfiles?.length || 0) + 1;
      const dcId = generateDCID(form.state, seq);
      
      let roleId = '';
      if (role === 'landlord') {
        const { data: landlordProfiles } = await supabase.from('profiles').select('id').eq('role', 'landlord');
        const landlordSeq = (landlordProfiles?.length || 0) + 1;
        roleId = generateLandlordId(form.state, landlordSeq);
      } else if (role === 'barrister') {
        const { data: barristerProfiles } = await supabase.from('profiles').select('id').eq('role', 'barrister');
        const barristerSeq = (barristerProfiles?.length || 0) + 1;
        roleId = generateBarristerId(form.state, barristerSeq);
      } else if (role === 'developer') {
        const { data: developerProfiles } = await supabase.from('profiles').select('id').eq('role', 'developer');
        const developerSeq = (developerProfiles?.length || 0) + 1;
        roleId = generateDeveloperId(form.state, developerSeq);
      }

      const profileInsert: Record<string, unknown> = {
        id: authData.user.id,
        dc_id: dcId,
        full_name: form.fullName,
        phone: form.phone,
        email: form.email,
        nin: form.nin || null,
        role,
        referral_code: form.referralCode || null,
        kyc_status: 'PENDING',
        role_id: roleId || null,
        bank_account: '',
        bank_name: '',
      };

      if (role === 'landlord') {
        profileInsert.cac_number = form.cacNumber || null;
      }
      if (role === 'chief') {
        profileInsert.traditional_title = form.traditionalTitle || null;
        profileInsert.title_proof = form.titleProof || null;
      }
      if (role === 'barrister') {
        profileInsert.bar_id = form.barId || null;
        profileInsert.law_license = form.lawLicense || null;
      }
      if (role === 'developer') {
        profileInsert.company_license = form.companyLicense || null;
        profileInsert.developer_id = form.developerId || null;
      }

      const { error: profileError } = await supabase.from('profiles').insert(profileInsert);

      if (profileError) throw profileError;

      const successMessage = roleId 
        ? `Your DCID is ${dcId}. Your Role ID is ${roleId}. KYC verification pending via Youverify.`
        : `Your DCID is ${dcId}. KYC verification pending via Youverify.`;
      
      toast.success('Account created!', { description: successMessage });

      if (role === 'landlord') router.push('/dashboard/landlord');
      else if (role === 'chief') router.push('/dashboard/chief');
      else if (role === 'barrister') router.push('/dashboard/barrister');
      else if (role === 'developer') router.push('/dashboard/developer');
      else if (role === 'user') router.push('/person');
      else router.push('/owner');
    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg animate-scale-in border-border/60">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck size={24} />
            </div>
            <CardTitle className="font-jakarta text-2xl">Get Your DCID</CardTitle>
            <CardDescription>
              One person, one DCID forever. Like BVN, for property. KYC verified via Youverify.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Tabs */}
              <div>
                <Label className="mb-2 block">Choose Your Role</Label>
                <Tabs value={role} onValueChange={(v) => setRole(v as Role)}>
                  <TabsList className="grid w-full grid-cols-5">
                    {(Object.keys(ROLE_INFO) as Role[]).map((r) => {
                      const Icon = ROLE_INFO[r].icon;
                      return (
                        <TabsTrigger key={r} value={r} className="flex-col gap-1 py-2 text-xs">
                          <Icon size={16} />
                          {ROLE_INFO[r].label}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  {(Object.keys(ROLE_INFO) as Role[]).map((r) => (
                    <TabsContent key={r} value={r} className="mt-2">
                      <p className="text-center text-xs text-muted-foreground">{ROLE_INFO[r].desc}</p>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Alhaji Musa Abdullahi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08012345678"
                />
                <p className="text-xs text-muted-foreground">OTP will be sent via Termii to verify your number</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="nin">NIN (Youverify KYC)</Label>
                  <Input
                    id="nin"
                    required
                    value={form.nin}
                    onChange={(e) => setForm({ ...form, nin: e.target.value })}
                    placeholder="12345678901"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="Kano"
                  />
                </div>
              </div>

              {/* Role-specific fields */}
              {role === 'landlord' && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <Home size={16} className="text-primary" />
                    <span className="text-sm font-semibold">Landlord Requirements</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cacNumber">CAC Number (Corporate Affairs Commission)</Label>
                    <Input
                      id="cacNumber"
                      required
                      value={form.cacNumber}
                      onChange={(e) => setForm({ ...form, cacNumber: e.target.value })}
                      placeholder="RC1234567"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You must present land ownership documents (C of O, Deed, or Survey) before co-ownership can be documented.
                  </p>
                </div>
              )}

              {role === 'chief' && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-primary" />
                    <span className="text-sm font-semibold">Chief Requirements</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="traditionalTitle">Traditional Title</Label>
                    <Input
                      id="traditionalTitle"
                      required
                      value={form.traditionalTitle}
                      onChange={(e) => setForm({ ...form, traditionalTitle: e.target.value })}
                      placeholder="Sarkin Kano, Baale of Eti-Osa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleProof">Title Proof (describe document)</Label>
                    <Input
                      id="titleProof"
                      value={form.titleProof}
                      onChange={(e) => setForm({ ...form, titleProof: e.target.value })}
                      placeholder="Certificate of Chieftaincy, Staff of Office"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ID and traditional title verified via Youverify KYC. You will approve land transfers via SMS OTP sent through Termii.
                  </p>
                </div>
              )}

              {role === 'barrister' && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <Scale size={16} className="text-primary" />
                    <span className="text-sm font-semibold">Barrister Requirements</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="barId">NBA Bar ID</Label>
                      <Input
                        id="barId"
                        required
                        value={form.barId}
                        onChange={(e) => setForm({ ...form, barId: e.target.value })}
                        placeholder="NBA/2024/12345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lawLicense">Law Practice License</Label>
                      <Input
                        id="lawLicense"
                        required
                        value={form.lawLicense}
                        onChange={(e) => setForm({ ...form, lawLicense: e.target.value })}
                        placeholder="LPC/2024/67890"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Credentials verified via Youverify KYC. You will verify documents and generate Deeds of Assignment.
                  </p>
                </div>
              )}

              {role === 'developer' && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-primary" />
                    <span className="text-sm font-semibold">Developer Requirements</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="companyLicense">Company License</Label>
                      <Input
                        id="companyLicense"
                        required
                        value={form.companyLicense}
                        onChange={(e) => setForm({ ...form, companyLicense: e.target.value })}
                        placeholder="RC1234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="developerId">Developer ID</Label>
                      <Input
                        id="developerId"
                        required
                        value={form.developerId}
                        onChange={(e) => setForm({ ...form, developerId: e.target.value })}
                        placeholder="RED/2024/12345"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Company license and developer ID verified via Youverify KYC. You will manage real estate development projects.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="referralCode">Referral Code (optional)</Label>
                <Input
                  id="referralCode"
                  value={form.referralCode}
                  onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
                  placeholder="DC-XXXX-XXXX"
                />
              </div>

              <TermsConsent checked={agreed} onCheckedChange={setAgreed} />

              <Button type="submit" className="w-full" size="lg" disabled={loading || !agreed}>
                {loading ? (
                  <><Loader2 size={18} className="mr-2 animate-spin" /> Verifying KYC...</>
                ) : (
                  <>
                    {language === 'ha' ? 'Ƙirƙiri Asusu' : language === 'yo' ? 'Ṣẹ̀dá Àkọọ́lẹ̀' : 'Create Account & Verify KYC'}
                    {!loading && <ArrowRight size={18} className="ml-2" />}
                  </>
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
