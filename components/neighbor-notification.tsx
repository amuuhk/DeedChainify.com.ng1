'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ThumbsUp, ThumbsDown, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import type { NeighborRequest, Property } from '@/lib/supabase/client';

export function NeighborNotification({
  request,
  property,
}: {
  request: NeighborRequest;
  property?: Property | null;
}) {
  const [status, setStatus] = useState(request.status);
  const [responded, setResponded] = useState(false);

  async function respond(approved: boolean) {
    setResponded(true);
    try {
      const { error } = await supabase
        .from('neighbor_requests')
        .update({ status: approved ? 'APPROVED' : 'REJECTED' })
        .eq('id', request.id);

      if (error) throw error;
      setStatus(approved ? 'APPROVED' : 'REJECTED');
      toast.success(approved ? 'Confirmed!' : 'Rejected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to respond');
      setResponded(false);
    }
  }

  if (status === 'APPROVED' || status === 'REJECTED') {
    return (
      <Card className="border-border/60">
        <CardContent className="flex items-center gap-3 p-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${status === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'}`}>
            {status === 'APPROVED' ? <ThumbsUp size={18} className="text-green-700" /> : <ThumbsDown size={18} className="text-red-700" />}
          </div>
          <div>
            <p className="text-sm font-medium">
              {status === 'APPROVED' ? 'You confirmed this property' : 'You rejected this property'}
            </p>
            <p className="text-xs text-muted-foreground">
              {property?.dc_title || 'Property verification'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-yellow-300 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100">
            <Users size={20} className="text-yellow-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              A property is being registered near you
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {property ? (
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {property.dc_title} &middot; {property.layout_name}, {property.lga}
                </span>
              ) : (
                'Reply to confirm this registration'
              )}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => respond(true)}
                disabled={responded}
                className="bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp size={14} className="mr-1.5" />
                YES
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => respond(false)}
                disabled={responded}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <ThumbsDown size={14} className="mr-1.5" />
                NO
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
