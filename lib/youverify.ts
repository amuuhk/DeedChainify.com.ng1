export interface YouVerifyConfig {
  apiKey: string;
  baseUrl: string;
}

export interface VerificationRequest {
  documentType: 'NIN' | 'BVN' | 'CAC' | 'PASSPORT' | 'DRIVERS_LICENSE';
  documentNumber: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}

export interface VerificationResponse {
  status: 'pending' | 'verified' | 'failed';
  reference: string;
  data?: any;
  error?: string;
}

export class YouVerifyService {
  private config: YouVerifyConfig;

  constructor(config: YouVerifyConfig) {
    this.config = config;
  }

  async verifyNIN(nin: string): Promise<VerificationResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/api/identity/ng/verify-nin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nin }),
      });

      const data = await response.json();
      
      if (data.status === 'success' || data.status === 'verified') {
        return {
          status: 'verified',
          reference: data.reference || data.transactionReference,
          data: data.data,
        };
      }

      return {
        status: 'failed',
        reference: data.reference || data.transactionReference || '',
        error: data.message || data.error || 'Verification failed',
      };
    } catch (error: any) {
      return {
        status: 'failed',
        reference: '',
        error: error.message || 'Network error',
      };
    }
  }

  async verifyBVN(bvn: string): Promise<VerificationResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/api/identity/ng/verify-bvn`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bvn }),
      });

      const data = await response.json();
      
      if (data.status === 'success' || data.status === 'verified') {
        return {
          status: 'verified',
          reference: data.reference || data.transactionReference,
          data: data.data,
        };
      }

      return {
        status: 'failed',
        reference: data.reference || data.transactionReference || '',
        error: data.message || data.error || 'Verification failed',
      };
    } catch (error: any) {
      return {
        status: 'failed',
        reference: '',
        error: error.message || 'Network error',
      };
    }
  }

  async verifyCAC(cacNumber: string): Promise<VerificationResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/api/business/ng/verify-cac`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cacNumber }),
      });

      const data = await response.json();
      
      if (data.status === 'success' || data.status === 'verified') {
        return {
          status: 'verified',
          reference: data.reference || data.transactionReference,
          data: data.data,
        };
      }

      return {
        status: 'failed',
        reference: data.reference || data.transactionReference || '',
        error: data.message || data.error || 'Verification failed',
      };
    } catch (error: any) {
      return {
        status: 'failed',
        reference: '',
        error: error.message || 'Network error',
      };
    }
  }
}

export const youverifyService = new YouVerifyService({
  apiKey: process.env.NEXT_PUBLIC_YOUVERIFY_PUBLIC_KEY || '',
  baseUrl: process.env.NEXT_PUBLIC_YOUVERIFY_BASE_URL || 'https://api.youverify.co',
});

// Add validation warning
if (!process.env.NEXT_PUBLIC_YOUVERIFY_PUBLIC_KEY) {
  console.warn('YouVerify API key not configured. Verification will be simulated.');
}