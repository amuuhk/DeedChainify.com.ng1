export const geoTierData: Record<string, Record<string, string[]>> = {
  KANO: {
    TIER1_URBAN_18K: ['Kano Municipal', 'Fagge', 'Dala', 'Nasarawa', 'Gwammaja'],
    TIER2_CITY_20K: ['Tarauni', 'Ungogo', 'Kumbotso', 'Dawakin Kudu', 'Bichi', 'Kiru', 'Rano', 'Gaya'],
    TIER3_RURAL_10K: ['Wudil', 'Kibiya', 'Makarfi', 'Ajingi', 'Gezawa', 'Minjibir'],
  },
  ABUJA: {
    TIER1_URBAN_50K: ['Municipal Area Council - Garki', 'Wuse', 'Maitama', 'Asokoro'],
    TIER2_CITY_25K: ['Bwari', 'Kubwa', 'Gwagwalada', 'Kuje', 'Lugbe'],
    TIER3_RURAL_10K: ['Abaji', 'Kwali', 'Zuba', 'Dutse'],
  },
  LAGOS: {
    TIER1_URBAN_50K: ['Ikeja', 'Victoria Island', 'Ikoyi', 'Lekki Phase 1'],
    TIER2_CITY_25K: ['Surulere', 'Yaba', 'Ajah', 'Ilupeju', 'Oshodi', 'Mushin', 'Egbeda'],
    TIER3_RURAL_10K: ['Ikorodu', 'Epe', 'Badagry', 'Iba'],
  },
};

export function getTierPrice(state: string, lga: string): { price: number; tier: number } {
  const stateData = geoTierData[state.toUpperCase()];
  if (!stateData) return { price: 25000, tier: 2 };

  for (const [tierKey, lgas] of Object.entries(stateData)) {
    if (lgas.includes(lga)) {
      if (tierKey.includes('50K')) return { price: 50000, tier: 1 };
      if (tierKey.includes('25K')) return { price: 25000, tier: 2 };
      if (tierKey.includes('10K')) return { price: 10000, tier: 3 };
    }
  }
  return { price: 25000, tier: 2 };
}

export const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 (Urban)',
  2: 'Tier 2 (City)',
  3: 'Tier 3 (Rural)',
};
