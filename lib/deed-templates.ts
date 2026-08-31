import type { Language } from '@/lib/language-context';

export const pdfTranslations: Record<Language, {
  title: string;
  property: string;
  seller: string;
  buyer: string;
  declaration: string;
  approved: string;
  geotier: string;
  custodium: string;
  footer: string;
}> = {
  en: {
    title: 'DEED OF ASSIGNMENT',
    property: 'PROPERTY DETAILS',
    seller: 'SELLER DETAILS',
    buyer: 'BUYER DETAILS',
    declaration: 'DECLARATION',
    approved: 'APPROVED BY DEEDCHAINIFY',
    geotier: 'GEOTIER & PRICING',
    custodium: 'PRIVATE CUSTODIUM PROOF',
    footer: 'This transaction is subject to final verification by DeedChainify 3-Neighbor system and Government Land Registry. DeedChainify does NOT guarantee title.',
  },
  ha: {
    title: 'TAKARDAR SAYAR DA GIDA',
    property: 'BAYANIN GIDAN',
    seller: 'BAYANIN MAI SAYARWA',
    buyer: 'BAYANIN MAI SIYA',
    declaration: 'SANARWA',
    approved: 'AN YARDA DA WANNA TA DEEDCHAINIFY',
    geotier: 'MATSAKI & KUDI',
    custodium: 'HUJJA TA CUSTODIUM',
    footer: 'Wannan ciniki yana karkashin tabbatarwa ta tsarin makwabta 3 na DeedChainify da kuma Rijistar Gwamnati. DeedChainify baya ba da garantin mallaka.',
  },
  yo: {
    title: 'IWE AKO ILE',
    property: 'ALAYE ILE',
    seller: 'ALAYE OLU TOSO',
    buyer: 'ALAYE OLU RA',
    declaration: 'IKEDE',
    approved: 'A FOWOSI NI NIPA DEEDCHAINIFY',
    geotier: 'TIER & OWO',
    custodium: 'ERI CUSTODIUM',
    footer: 'Isowo yii wa labẹ ijẹrisi eto Aladugbo 3 ti DeedChainify ati Iforukọsilẹ Ijọba. DeedChainify ko ṣe iseduro akọle.',
  },
};

export function buildSmsMessage(
  language: Language,
  dcTitle: string,
  tierPrice: number,
  ledgerId: string,
): string {
  const templates: Record<Language, string> = {
    en: `DeedChainify: You are listed as witness/chief for land transfer DC: ${dcTitle}. Fee: NGN${tierPrice}. Reply YES to confirm or NO to dispute. Verify: deedchainify.ng/custodium/${ledgerId}`,
    ha: `DeedChainify: An lissafa ka a matsayin shaida/Sarki na cinikin gida DC: ${dcTitle}. Kudi: NGN${tierPrice}. Amsa da EH don tabbatarwa ko AA don musantawa. Tabbatar: deedchainify.ng/custodium/${ledgerId}`,
    yo: `DeedChainify: A ti yan o si bi eleri/Oba fun tita ile DC: ${dcTitle}. Owo: NGN${tierPrice}. Dahun BENI lati jẹrisi tabi BEKỌ lati tako. Sayẹwo: deedchainify.ng/custodium/${ledgerId}`,
  };
  return templates[language];
}

export type DeedData = {
  dcTitle: string;
  today: string;
  language: Language;
  property: {
    address: string;
    size: string;
    status: string;
  };
  sellerName: string;
  sellerPhone: string;
  sellerNIN: string;
  buyerName: string;
  buyerPhone: string;
  buyerNIN: string;
  salePrice: number;
  tierPrice: number;
  tier: number;
  state: string;
  lga: string;
  barristerName: string;
  barristerPhone: string;
  barristerNIN: string;
  witness1Phone: string;
  witness2Phone: string;
  witness3Phone: string;
  chiefName: string;
  chiefPhone: string;
  transferId: string;
  pdfHash: string;
  ledgerId: string;
  signature: string;
};

export function generateTransferId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TRF-${id}`;
}
