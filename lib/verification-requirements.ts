export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  documentType: 'NIN' | 'BVN' | 'CAC' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'BAR_ID' | 'LAW_LICENSE' | 'TRADITIONAL_TITLE' | 'COMPANY_LICENSE';
  fieldName: string;
}

export interface RoleVerificationRequirements {
  role: string;
  documents: DocumentRequirement[];
  description: string;
}

export const VERIFICATION_REQUIREMENTS: Record<string, RoleVerificationRequirements> = {
  user: {
    role: 'user',
    description: 'Basic identity verification for property buyers',
    documents: [
      {
        id: 'nin',
        name: 'National Identity Number (NIN)',
        description: 'Your 11-digit NIN number from NIMC',
        required: true,
        documentType: 'NIN',
        fieldName: 'nin',
      },
      {
        id: 'bvn',
        name: 'Bank Verification Number (BVN)',
        description: 'Your 11-digit BVN number',
        required: false,
        documentType: 'BVN',
        fieldName: 'bvn',
      },
    ],
  },
  landlord: {
    role: 'landlord',
    description: 'Enhanced verification for property sellers',
    documents: [
      {
        id: 'nin',
        name: 'National Identity Number (NIN)',
        description: 'Your 11-digit NIN number from NIMC',
        required: true,
        documentType: 'NIN',
        fieldName: 'nin',
      },
      {
        id: 'bvn',
        name: 'Bank Verification Number (BVN)',
        description: 'Your 11-digit BVN number for payout',
        required: true,
        documentType: 'BVN',
        fieldName: 'bvn',
      },
      {
        id: 'title-proof',
        name: 'Land Title Document',
        description: 'Proof of ownership for properties you want to onboard',
        required: true,
        documentType: 'PASSPORT',
        fieldName: 'title_proof',
      },
    ],
  },
  chief: {
    role: 'chief',
    description: 'Community leader verification',
    documents: [
      {
        id: 'nin',
        name: 'National Identity Number (NIN)',
        description: 'Your 11-digit NIN number from NIMC',
        required: true,
        documentType: 'NIN',
        fieldName: 'nin',
      },
      {
        id: 'traditional-title',
        name: 'Traditional Title Document',
        description: 'Official document showing your traditional title',
        required: true,
        documentType: 'TRADITIONAL_TITLE',
        fieldName: 'traditional_title',
      },
      {
        id: 'title-proof',
        name: 'Letter of Appointment',
        description: 'Official letter appointing you as community chief',
        required: true,
        documentType: 'PASSPORT',
        fieldName: 'title_proof',
      },
    ],
  },
  barrister: {
    role: 'barrister',
    description: 'Legal professional verification',
    documents: [
      {
        id: 'nin',
        name: 'National Identity Number (NIN)',
        description: 'Your 11-digit NIN number from NIMC',
        required: true,
        documentType: 'NIN',
        fieldName: 'nin',
      },
      {
        id: 'bar-id',
        name: 'Bar Association ID',
        description: 'Your Bar Association registration number',
        required: true,
        documentType: 'BAR_ID',
        fieldName: 'bar_id',
      },
      {
        id: 'law-license',
        name: 'Law Practice License',
        description: 'Your practicing license from the NBA',
        required: true,
        documentType: 'LAW_LICENSE',
        fieldName: 'law_license',
      },
    ],
  },
  developer: {
    role: 'developer',
    description: 'Real estate developer verification',
    documents: [
      {
        id: 'nin',
        name: 'National Identity Number (NIN)',
        description: 'Your 11-digit NIN number from NIMC',
        required: true,
        documentType: 'NIN',
        fieldName: 'nin',
      },
      {
        id: 'cac-number',
        name: 'CAC Registration Number',
        description: 'Your company CAC registration number',
        required: true,
        documentType: 'CAC',
        fieldName: 'cac_number',
      },
      {
        id: 'company-license',
        name: 'Company Operating License',
        description: 'Real estate development license',
        required: true,
        documentType: 'COMPANY_LICENSE',
        fieldName: 'company_license',
      },
    ],
  },
};

export function getRequirementsForRole(role: string): RoleVerificationRequirements {
  return VERIFICATION_REQUIREMENTS[role] || VERIFICATION_REQUIREMENTS.user;
}

export function getRequiredDocuments(role: string): DocumentRequirement[] {
  const requirements = getRequirementsForRole(role);
  return requirements.documents.filter(doc => doc.required);
}