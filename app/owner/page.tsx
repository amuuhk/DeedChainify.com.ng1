'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Landmark, UserCircle, Building2, Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { Property, NeighborRequest } from '@/lib/supabase/client';
import { SiteHeader } from '@/components/site-header';
import { PropertyCard } from '@/components/property-card';
import { BigCenterFAB } from '@/components/big-center-fab';
import { UserProfileVault } from '@/components/user-profile-vault';
import { LoanFamilyPortal } from '@/components/loan-family-portal';
import { NeighborNotification } from '@/components/neighbor-notification';
import { BottomNav } from '@/components/bottom-nav';

export default function OwnerDashboard() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [neighborRequests, setNeighborRequests] = useState<NeighborRequest[]>([]);
  const [neighborProperties, setNeighborProperties] = useState<Record<string, Property | null>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login');
    }
  }, [profile, loading, router]);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    if (!profile) return;
    try {
      const [propRes, neighborRes] = await Promise.all([
        supabase.from('properties').select('*').eq('owner_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('neighbor_requests').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      setProperties(propRes.data as Property[] || []);
      const reqs = neighborRes.data as NeighborRequest[] || [];
      setNeighborRequests(reqs);

      const propMap: Record<string, Property | null> = {};
      for (const req of reqs) {
        if (req.property_id) {
          const { data } = await supabase
            .from('properties')
            .select('*')
            .eq('id', req.property_id)
            .maybeSingle();
          propMap[req.id] = data as Property | null;
        }
      }
      setNeighborProperties(propMap);
    } finally {
      setDataLoading(false);
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

  const verifiedCount = properties.filter((p) => p.status === 'GREEN' || p.status === 'VERIFIED').length;
  const pendingCount = properties.filter((p) => p.status === 'PENDING' || p.status === 'YELLOW').length;
  const pledgedCount = properties.filter((p) => p.is_pledged).length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total Properties', value: properties.length, icon: Building2, color: 'text-primary' },
            { label: 'Verified', value: verifiedCount, icon: Building2, color: 'text-green-600' },
            { label: 'Pending', value: pendingCount, icon: Building2, color: 'text-yellow-600' },
            { label: 'Pledged', value: pledgedCount, icon: Landmark, color: 'text-blue-600' },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="p-4">
                <stat.icon size={20} className={stat.color} />
                <p className="mt-2 font-jakarta text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="properties" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">
              <Building2 size={16} className="mr-1.5" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="profile">
              <UserCircle size={16} className="mr-1.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="neighbors">
              <Users size={16} className="mr-1.5" />
              Neighbors
              {neighborRequests.filter((r) => r.status === 'PENDING').length > 0 && (
                <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {neighborRequests.filter((r) => r.status === 'PENDING').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="mt-6">
            {dataLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-20 text-center">
                <Building2 size={48} className="text-muted-foreground" />
                <h3 className="mt-4 font-jakarta text-lg font-semibold">No properties yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tap the button below to onboard your first property
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <UserProfileVault profile={profile} />
              <LoanFamilyPortal properties={properties} />
            </div>
          </TabsContent>

          {/* Neighbors Tab */}
          <TabsContent value="neighbors" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-primary" />
                <h3 className="font-jakarta text-lg font-semibold">Community Verification</h3>
              </div>
              {neighborRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-20 text-center">
                  <Users size={48} className="text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    No neighbor verification requests right now
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {neighborRequests.map((req) => (
                    <NeighborNotification
                      key={req.id}
                      request={req}
                      property={neighborProperties[req.id]}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BigCenterFAB
        onPrivate={() => router.push('/owner/onboard?type=private')}
        onPublic={() => router.push('/owner/onboard?type=public')}
      />
      <BottomNav />
    </>
  );
}
