'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Phone, Mail, MapPin, Shield, Calendar } from 'lucide-react';
import type { Profile } from '@/lib/supabase/client';

export function UserProfileVault({ profile }: { profile: Profile }) {
  return (
    <Card className="overflow-hidden border-border/60">
      <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <UserCircle size={28} className="text-primary" />
          </div>
          <div>
            <CardTitle className="font-jakarta">{profile.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground">Property Owner</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* DCID Card */}
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Lifetime DCID</p>
              <p className="font-jakarta text-xl font-bold tracking-wider text-primary">
                {profile.dc_id}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield size={24} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className={
              profile.kyc_status === 'VERIFIED' ? 'border-green-300 bg-green-50 text-green-700' :
              profile.kyc_status === 'PENDING' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
              'border-red-300 bg-red-50 text-red-700'
            }>
              KYC: {profile.kyc_status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {profile.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-muted-foreground" />
              <span>{profile.phone}</span>
            </div>
          )}
          {profile.email && (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-muted-foreground" />
              <span className="truncate">{profile.email}</span>
            </div>
          )}
          {profile.address && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-muted-foreground" />
              <span className="truncate">{profile.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
