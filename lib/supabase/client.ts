import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
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
};

export type Property = {
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
  public_qr_url: string | null;
  private_qr_token: string | null;
  landlord_id: string | null;
  barrister_id: string | null;
  landlord_referral: string | null;
  barrister_referral: string | null;
  listing_type: string;
  created_at: string;
};

export type Payment = {
  id: string;
  type: string;
  amount: number;
  dc_title: string | null;
  dc_id: string | null;
  user_id: string | null;
  recipient_id: string | null;
  status: string;
  created_at: string;
};

export type Bank = {
  id: string;
  bank_name: string;
  tier: string;
  monthly_fee: number;
  api_calls_included: number;
  api_calls_used: number;
  api_key: string;
  created_at: string;
};

export type NeighborRequest = {
  id: string;
  property_id: string;
  neighbor_phone: string;
  status: string;
  responder_dc_id: string | null;
  created_at: string;
};

export type Agent = {
  id: string;
  phone: string;
  type: string;
  commission_earned: number;
  created_at: string;
};

export type Transfer = {
  id: string;
  dc_title: string | null;
  transfer_id: string;
  seller_name: string;
  seller_phone: string;
  seller_nin: string | null;
  buyer_name: string;
  buyer_phone: string;
  buyer_nin: string | null;
  sale_price: number;
  tier_price: number | null;
  tier: number | null;
  state: string | null;
  lga: string | null;
  barrister_name: string | null;
  barrister_phone: string | null;
  barrister_nin: string | null;
  witness1_phone: string | null;
  witness2_phone: string | null;
  witness3_phone: string | null;
  chief_name: string | null;
  chief_phone: string | null;
  language: string;
  status: string;
  witness1_status: string;
  witness2_status: string;
  witness3_status: string;
  chief_status: string;
  created_by: string | null;
  created_at: string;
};

// BLOCKCHAIN SYSTEM REMOVED - PrivateLedger type no longer needed
// export type PrivateLedger = {
//   id: string;
//   transfer_id: string | null;
//   dc_title: string;
//   pdf_hash: string;
//   previous_hash: string | null;
//   signature: string;
//   nonce: string;
//   status: string;
//   timestamp: string;
// };

export type PropertyOwner = {
  id: string;
  property_id: string;
  name: string;
  nin: string | null;
  phone: string | null;
  share_pct: number;
  created_at: string;
};

export type CollateralLoan = {
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
};

export type CollateralInsurance = {
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
};

export type CollateralValuation = {
  id: string;
  property_id: string;
  bank_id: string;
  valuation_amount: number;
  valuation_date: string;
  valuator_name: string;
  valuation_method: string;
  notes: string | null;
  created_at: string;
};

export type CollateralAlert = {
  id: string;
  loan_id: string;
  alert_type: string;
  severity: string;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
};
