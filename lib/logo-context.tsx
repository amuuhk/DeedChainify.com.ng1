'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase/client';

export const DEFAULT_LOGO_URL = '/WhatsApp_Image_2026-08-13_at_1.56.37_PM_(1).jpeg';

type LogoContextType = {
  logoUrl: string | null;
  refresh: () => Promise<void>;
};

const LogoContext = createContext<LogoContextType>({
  logoUrl: null,
  refresh: async () => {},
});

export function LogoProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);

  async function fetchLogo() {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'logo_url')
      .maybeSingle();
    setLogoUrl((data as any)?.value || DEFAULT_LOGO_URL);
  }

  useEffect(() => {
    fetchLogo();
  }, []);

  return (
    <LogoContext.Provider value={{ logoUrl, refresh: fetchLogo }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  return useContext(LogoContext);
}
