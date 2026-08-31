import { supabase } from '@/lib/supabase/client';

const FREE_SCAN_LIMIT = 2;
const PAID_SCAN_FEE = 5000;

export async function getScanCount(dcTitle: string): Promise<number> {
  const { count, error } = await supabase
    .from('scan_logs')
    .select('*', { count: 'exact', head: true })
    .eq('dc_title', dcTitle);

  if (error) return 0;
  return count || 0;
}

export async function canScanFree(dcTitle: string): Promise<{ allowed: boolean; free: boolean; remaining: number; fee: number }> {
  const scanCount = await getScanCount(dcTitle);

  if (scanCount < FREE_SCAN_LIMIT) {
    return { allowed: true, free: true, remaining: FREE_SCAN_LIMIT - scanCount - 1, fee: 0 };
  }

  return { allowed: true, free: false, remaining: 0, fee: PAID_SCAN_FEE };
}

export async function logScan(dcTitle: string, cost: number): Promise<void> {
  await supabase.from('scan_logs').insert({ dc_title: dcTitle, cost });
}

export { FREE_SCAN_LIMIT, PAID_SCAN_FEE };
