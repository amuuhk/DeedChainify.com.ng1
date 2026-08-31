'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, UserPlus, Wallet, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Property } from '@/lib/supabase/client';

export function LoanFamilyPortal({ properties }: { properties: Property[] }) {
  const { profile, refreshProfile } = useAuth();
  const [addingKin, setAddingKin] = useState(false);
  const [kinForm, setKinForm] = useState({ name: '', phone: '', relationship: '' });

  const pledgedProperties = properties.filter((p) => p.is_pledged);

  async function saveKin(e: React.FormEvent) {
    e.preventDefault();
    setAddingKin(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ next_of_kin: kinForm })
        .eq('id', profile!.id);

      if (error) throw error;
      await refreshProfile();
      toast.success('Next of kin saved');
      setKinForm({ name: '', phone: '', relationship: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setAddingKin(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Next of Kin */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus size={18} className="text-primary" />
              </div>
              <CardTitle className="font-jakarta text-lg">Next of Kin</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profile?.next_of_kin ? (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="font-medium">{profile.next_of_kin.name}</p>
              <p className="text-sm text-muted-foreground">{profile.next_of_kin.phone}</p>
              <p className="text-sm text-muted-foreground">{profile.next_of_kin.relationship}</p>
            </div>
          ) : (
            <form onSubmit={saveKin} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="kinName">Full Name</Label>
                  <Input
                    id="kinName"
                    required
                    value={kinForm.name}
                    onChange={(e) => setKinForm({ ...kinForm, name: e.target.value })}
                    placeholder="Next of kin name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kinPhone">Phone</Label>
                  <Input
                    id="kinPhone"
                    required
                    value={kinForm.phone}
                    onChange={(e) => setKinForm({ ...kinForm, phone: e.target.value })}
                    placeholder="08012345678"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kinRel">Relationship</Label>
                <Input
                  id="kinRel"
                  required
                  value={kinForm.relationship}
                  onChange={(e) => setKinForm({ ...kinForm, relationship: e.target.value })}
                  placeholder="Son, Daughter, Spouse..."
                />
              </div>
              <Button type="submit" disabled={addingKin} className="w-full">
                {addingKin ? 'Saving...' : 'Add Next of Kin'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Active Loans / Pledges */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Landmark size={18} className="text-blue-700" />
            </div>
            <CardTitle className="font-jakarta text-lg">Active Loans / Pledges</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {pledgedProperties.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Wallet size={32} className="text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No active loans or pledges
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pledgedProperties.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="font-medium text-sm">{p.dc_title}</p>
                    <p className="text-xs text-muted-foreground">Pledged to {p.bank_name}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    COLLATERAL
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inheritance Mode */}
      <Card className="border-2 border-orange-300 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
              <AlertCircle size={18} className="text-orange-700" />
            </div>
            <CardTitle className="font-jakarta text-lg text-orange-800">Inheritance Mode</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Clock size={16} className="mt-0.5 text-orange-600" />
            <p className="text-sm text-orange-800">
              If you are inactive for 12 months, your next of kin will be notified
              with instructions to claim your properties through inheritance.
              {!profile?.next_of_kin && ' Add a next of kin to enable this feature.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
