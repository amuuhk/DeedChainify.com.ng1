'use client';

import { useLanguage } from '@/lib/language-context';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck } from 'lucide-react';

type TermsConsentProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

type TermSection = {
  title: string;
  body: string[];
};

const terms: Record<'en' | 'ha' | 'yo', { heading: string; intro: string; agree: string; sections: TermSection[] }> = {
  en: {
    heading: 'Terms and consent',
    intro: 'By clicking “I Agree”, you confirm:',
    agree: 'I Agree to the Terms and Conditions',
    sections: [
      { title: '1. WE ARE NOT A LAND VENDOR', body: ['DeedChainify OS does not sell, buy, or guarantee ownership of land. We are a technology platform for DIGITAL DOCUMENTATION of manual property documents only.'] },
      { title: '2. WHAT WE DO', body: ['We digitize your property through Government Facilitation.', 'We run Community Risk Cure by informing 3 neighboring property owners (“Shells”) for verification.', 'We prepare your documents for Government Submarcation and Recognition.', 'We provide DCID and QR for bankability and fraud prevention.'] },
      { title: '3. YOUR RESPONSIBILITY', body: ['You confirm you are the rightful owner or authorized representative. Any false information is a criminal offense under the Land Use Act and Cybercrimes Act.'] },
      { title: '4. DATA & CONSENT', body: ['We will collect your NIN, BVN, Phone, GPS, and Documents. We use this ONLY for verification, bank checks, and government records. Data is hashed on IPFS + SHA256.'] },
      { title: '5. FEES', body: ['Public Scan: N5,000. First 2 per month FREE. Private Onboarding: N10,000 - N50,000. Revenue split applies.'] },
      { title: '6. DISPUTES', body: ['If 2/3 neighbors reject or Chief rejects, status becomes RED/DISPUTED. We do not resolve land disputes. Go to court or customary council.'] },
    ],
  },
  ha: {
    heading: 'Sharuɗɗa da amincewa',
    intro: 'Ta danna “Na Amince”, ka tabbatar da cewa:',
    agree: 'Na Amince da Sharuɗɗa da Dokoki',
    sections: [
      { title: '1. MU BA MASU SAYAR DA FILI BA NE', body: ['DeedChainify OS ba ya sayarwa, saya, ko bada tabbacin mallakar fili. Mu dandali ne na fasaha don TAKARDUN DIJITAL na takardun kadarori na hannu kawai.'] },
      { title: '2. ABIN DA MUKE YI', body: ['Muna mayar da bayanan kadararka zuwa dijital ta hanyar taimakon gwamnati.', 'Muna gudanar da gyaran haɗarin al’umma ta sanar da makwabta 3 (“Shells”) don tabbatarwa.', 'Muna shirya takardunka don alamar iyaka da amincewar gwamnati.', 'Muna samar da DCID da QR don sauƙaƙe banki da hana zamba.'] },
      { title: '3. NAUYIN KA', body: ['Ka tabbatar kai ne mai fili na gaskiya ko wakilin da aka ba izini. Bayanin ƙarya laifi ne a ƙarƙashin Dokar Amfani da Fili da Dokar Laifukan Intanet.'] },
      { title: '4. BAYANAI DA IZINI', body: ['Za mu tattara NIN, BVN, waya, GPS, da takardu. Za mu yi amfani da su KAWAI don tabbatarwa, binciken banki, da bayanan gwamnati. Ana hash bayanai ta IPFS + SHA256.'] },
      { title: '5. KUƊAƊE', body: ['Binciken jama’a: N5,000. Bincike 2 na farko a wata kyauta. Rijistar sirri: N10,000 - N50,000. Ana amfani da rabon kuɗin shiga.'] },
      { title: '6. RIGINGIMU', body: ['Idan makwabta 2 cikin 3 ko Hakimi ya ƙi, matsayin zai zama JA/RIGIMA. Ba ma warware rigingimun fili. Je kotu ko majalisar gargajiya.'] },
    ],
  },
  yo: {
    heading: 'Àwọn ofin àti ìfọwọ́sí',
    intro: 'Nípa títẹ “Mo Fọwọ́sí”, o jẹ́rìí pé:',
    agree: 'Mo Fọwọ́sí Àwọn Ofin àti Àdéhùn',
    sections: [
      { title: '1. A KÌ Í ṢE OLÙTA ILẸ̀', body: ['DeedChainify OS kì í ta, rà, tàbí ṣe ìdánilójú ohun-ini ilẹ̀. A jẹ́ pẹpẹ ìmọ̀ ẹ̀rọ fún ÀKỌ́SÍLẸ̀ DIGITAL ti àwọn ìwé ohun-ini ọwọ́ nìkan.'] },
      { title: '2. OHUN TÍ A N ṢE', body: ['A ń yí ohun-ini rẹ padà sí digital pẹ̀lú ìrànlọ́wọ́ ìjọba.', 'A ń ṣe Community Risk Cure nípa fífi àwọn onílé ilẹ̀ mẹ́ta tó wà nítòsí (“Shells”) létí fún ìjẹ́rìí.', 'A ń pèsè àwọn ìwé rẹ fún ìdámọ̀ ààlà àti ìdánimọ̀ ìjọba.', 'A ń pèsè DCID àti QR fún lílo banki àti dídènà jíjẹ̀bì.'] },
      { title: '3. OJÚṣe RẸ', body: ['O jẹ́rìí pé ìwọ ni olúwa tó tọ́ tàbí aṣojú tí a fún ní àṣẹ. Ìwífún èké jẹ́ ẹ̀ṣẹ̀ lábẹ́ Land Use Act àti Cybercrimes Act.'] },
      { title: '4. DATA ÀTI ÌFỌ́WỌ́SÍ', body: ['A máa gba NIN, BVN, fóònù, GPS, àti àwọn ìwé. A máa lo wọn NÌKAN fún ìjẹ́rìí, àyẹ̀wò banki, àti àkọsílẹ̀ ìjọba. A máa hash data pẹ̀lú IPFS + SHA256.'] },
      { title: '5. OWÓ', body: ['Public Scan: N5,000. Àwọn méjì àkọ́kọ́ lóṣù jẹ́ ọ̀fẹ́. Private Onboarding: N10,000 - N50,000. Ìpín owó-wíwọlé máa ń ṣiṣẹ́.'] },
      { title: '6. ÀWÍYÉ', body: ['Tí àwọn aládùúgbò 2/3 tàbí Olórí bá kọ̀, ipò yóò di PẸ̀LÚ/ÀWÍYÉ. A kì í yanjú awuyewuye ilẹ̀. Lọ sí ilé-ẹjọ́ tàbí igbimọ̀ ìbílẹ̀.'] },
    ],
  },
};

export function TermsConsent({ checked, onCheckedChange }: TermsConsentProps) {
  const { language } = useLanguage();
  const content = terms[language];

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck size={18} className="text-primary" />
        <h3 className="font-semibold">{content.heading}</h3>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{content.intro}</p>
      <ScrollArea className="h-48 rounded-lg border border-border bg-background px-4 py-3">
        <div className="space-y-4 pr-3 text-sm leading-6">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h4 className="font-semibold">{section.title}</h4>
              {section.body.map((paragraph) => <p key={paragraph} className="mt-1 text-muted-foreground">{paragraph}</p>)}
            </section>
          ))}
        </div>
      </ScrollArea>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm font-medium">
        <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} className="mt-0.5" />
        <span>{content.agree}</span>
      </label>
    </div>
  );
}
