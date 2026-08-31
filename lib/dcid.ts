export const STATE_CODES: Record<string, string> = {
  Kano: 'KN',
  Lagos: 'LG',
  Kaduna: 'KD',
  'FCT-Abuja': 'AB',
};

export const STATE_NAMES: Record<string, string> = {
  KN: 'Kano',
  LG: 'Lagos',
  KD: 'Kaduna',
  AB: 'FCT-Abuja',
};

export const LGA_CODES: Record<string, Record<string, string>> = {
  KN: { Fagge: 'FG', 'Nassarawa': 'NS', 'Tarauni': 'TR' },
  LG: { 'Ibeju-Lekki': 'IJ', 'Ikeja': 'IK', 'Eti-Osa': 'ET' },
  KD: { Zaria: 'ZR', 'Kaduna North': 'KN', 'Kaduna South': 'KS' },
  AB: { Maitama: 'MA', 'Garki': 'GA', 'Wuse': 'WU' },
};

export const PLOT_TYPES: Record<string, string> = {
  Residential: 'P',
  Farm: 'FM',
  Commercial: 'CM',
  Industrial: 'IN',
};

export const PLOT_TYPE_LABELS: Record<string, string> = {
  P: 'Residential',
  FM: 'Farm',
  CM: 'Commercial',
  IN: 'Industrial',
};

export function getStateCode(state: string): string {
  return STATE_CODES[state] || state.substring(0, 2).toUpperCase();
}

export function getLGACode(stateCode: string, lga: string): string {
  const lgaMap = LGA_CODES[stateCode];
  if (lgaMap && lgaMap[lga]) return lgaMap[lga];
  return lga.substring(0, 2).toUpperCase();
}

export function getPlotTypeCode(plotType: string): string {
  return PLOT_TYPES[plotType] || 'P';
}

export function generateDCID(state: string, sequence: number): string {
  const stateCode = getStateCode(state);
  const year = new Date().getFullYear();
  const seq = String(sequence).padStart(6, '0');
  return `DC-${stateCode}-${year}-${seq}`;
}

export function generateDCTitle(
  state: string,
  lga: string,
  layout: string,
  block: string,
  plotType: string,
  plot: string,
  sequence: number,
): string {
  const stateCode = getStateCode(state);
  const lgaCode = getLGACode(stateCode, lga);
  const layoutCode = layout.substring(0, 3).toUpperCase().replace(/\s/g, '');
  const blockCode = `B${block}`;
  const typeCode = getPlotTypeCode(plotType);
  const plotCode = `P${String(plot).padStart(2, '0')}`;
  const seq = String(sequence).padStart(3, '0');
  return `DC-${stateCode}-${lgaCode}-${layoutCode}-${blockCode}-${typeCode}${plotCode}-${seq}`;
}

export function getOnboardingFee(lga: string): number {
  const TIER1_URBAN = ['VICTORIA ISLAND', 'MAITAMA', 'ASOKORO', 'GRA', 'IKEJA', 'WUSE', 'ZARIA', 'NASARAWA', 'BODIJA'];
  const TIER2_CITY = ['SURULERE', 'YABA', 'AJAH', 'OSHODI', 'MUSHIN', 'EGBEDA', 'BICHI', 'KIRU', 'RANO', 'GAYA'];
  const upper = lga.toUpperCase();
  if (TIER1_URBAN.includes(upper)) return 50000;
  if (TIER2_CITY.includes(upper)) return 25000;
  return 10000;
}

export function getFeeTier(lga: string): { fee: number; tier: string } {
  const fee = getOnboardingFee(lga);
  if (fee === 50000) return { fee, tier: 'Tier 1 (Urban)' };
  if (fee === 25000) return { fee, tier: 'Tier 2 (City)' };
  return { fee, tier: 'Tier 3 (Rural)' };
}

export function formatNaira(amount: number): string {
  return '\u20A6' + amount.toLocaleString('en-NG');
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  VERIFIED: { label: 'VERIFIED', color: 'text-green-700', bg: 'bg-green-100 border-green-300', icon: 'CheckCircle' },
  GREEN: { label: 'VERIFIED', color: 'text-green-700', bg: 'bg-green-100 border-green-300', icon: 'CheckCircle' },
  YELLOW: { label: 'WAITING CHIEF APPROVAL', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300', icon: 'Clock' },
  PENDING: { label: 'PENDING VERIFICATION', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-300', icon: 'Clock' },
  DISPUTED: { label: 'DISPUTED', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: 'AlertTriangle' },
  RED: { label: 'DISPUTED', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: 'AlertTriangle' },
  COLLATERAL: { label: 'COLLATERAL', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300', icon: 'Banknote' },
};

export function getStatusConfig(status: string, isPledged?: boolean, bankName?: string | null) {
  if (isPledged) {
    return {
      label: `COLLATERAL - PLEDGED TO ${bankName || 'BANK'}`,
      color: 'text-blue-700',
      bg: 'bg-blue-100 border-blue-300',
      icon: 'Banknote',
    };
  }
  return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
}

export function getCollateralStatus(isPledged: boolean, status: string, bankName?: string | null) {
  if (isPledged) {
    return {
      label: `COLLATERAL - ${bankName || 'BANK'}`,
      color: 'text-blue-700',
      bg: 'bg-blue-100 border-blue-300',
      icon: 'Banknote',
    };
  }
  return getStatusConfig(status);
}

export function generateLandlordId(state: string, sequence: number): string {
  const stateCode = getStateCode(state);
  const seq = String(sequence).padStart(6, '0');
  return `DC-LL-${stateCode}-${seq}`;
}

export function generateBarristerId(state: string, sequence: number): string {
  const stateCode = getStateCode(state);
  const seq = String(sequence).padStart(8, '0');
  return `DC-BRR-${stateCode}-${seq}`;
}

export function generateDeveloperId(state: string, sequence: number): string {
  // Generates DC-RE-STATE-###### format for Real Estate Agencies/Developers
  const stateCode = getStateCode(state);
  const seq = String(sequence).padStart(6, '0');
  return `DC-RE-${stateCode}-${seq}`;
}

// Collateral-related status configurations
export const LOAN_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  ACTIVE: { label: 'ACTIVE', color: 'text-green-700', bg: 'bg-green-100 border-green-300', icon: 'CheckCircle' },
  PAID: { label: 'PAID', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300', icon: 'CheckCircle' },
  DEFAULTED: { label: 'DEFAULTED', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: 'AlertTriangle' },
  RESTRUCTURED: { label: 'RESTRUCTURED', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300', icon: 'Clock' },
};

export const INSURANCE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'ACTIVE', color: 'text-green-700', bg: 'bg-green-100 border-green-300' },
  EXPIRED: { label: 'EXPIRED', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
  CANCELLED: { label: 'CANCELLED', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-300' },
};

export const ALERT_SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'LOW', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
  MEDIUM: { label: 'MEDIUM', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' },
  HIGH: { label: 'HIGH', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300' },
  CRITICAL: { label: 'CRITICAL', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
};

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number
): number {
  if (annualRate === 0) return principal / months;
  const monthlyRate = annualRate / 100 / 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
         (Math.pow(1 + monthlyRate, months) - 1);
}

export function calculateLoanToValue(loanAmount: number, propertyValue: number): number {
  if (propertyValue === 0) return 0;
  return (loanAmount / propertyValue) * 100;
}

export function generateLoanId(bankId: string, sequence: number): string {
  const bankShort = bankId.substring(0, 8).toUpperCase();
  const seq = String(sequence).padStart(6, '0');
  return `LOAN-${bankShort}-${seq}`;
}
