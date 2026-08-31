import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Type definitions removed for JavaScript compatibility
// The following are the expected data structures for reference:

/*
Profile structure:
{
  id: string;
  dc_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  nin: string | null;
  bvn: string | null;
  address: string | null;
  state: string | null;
  kyc_status: string;
  next_of_kin: { name: string; phone: string; relationship: string } | null;
  role: string;
  referral_code: string | null;
  role_id: string | null;
  bank_account: string | null;
  bank_name: string | null;
  cac_number: string | null;
  traditional_title: string | null;
  title_proof: string | null;
  bar_id: string | null;
  law_license: string | null;
  company_license: string | null;
  developer_id: string | null;
  created_at: string;
}

Property structure:
{
  id: string;
  dc_title: string;
  owner_id: string;
  owner_dc_id: string | null;
  owner_name: string | null;
  state: string;
  lga: string;
  layout_name: string;
  block_no: string;
  plot_no: string;
  plot_type: string;
  gps_lat: number | null;
  gps_long: number | null;
  size_sqm: number;
  status: string;
  is_pledged: boolean;
  bank_name: string | null;
  blockchain_hash: string | null;
  ipfs_url: string | null;
  public_qr_url: string | null;
  private_qr_token: string | null;
  landlord_id: string | null;
  barrister_id: string | null;
  landlord_referral: string | null;
  barrister_referral: string | null;
  listing_type: string;
  created_at: string;
}

CollateralLoan structure:
{
  id: string;
  bank_id: string;
  property_id: string;
  loan_amount: number;
  loan_term_months: number;
  interest_rate: number;
  monthly_payment: number;
  outstanding_balance: number;
  status: string;
  start_date: string;
  end_date: string | null;
  next_payment_date: string | null;
  created_at: string;
}

CollateralInsurance structure:
{
  id: string;
  loan_id: string;
  policy_number: string;
  insurance_provider: string;
  coverage_amount: number;
  premium_amount: number;
  policy_start_date: string;
  policy_end_date: string;
  status: string;
  created_at: string;
}

CollateralValuation structure:
{
  id: string;
  property_id: string;
  bank_id: string;
  valuation_amount: number;
  valuation_date: string;
  valuator_name: string;
  valuation_method: string;
  notes: string | null;
  created_at: string;
}

CollateralAlert structure:
{
  id: string;
  loan_id: string;
  alert_type: string;
  severity: string;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}
*/