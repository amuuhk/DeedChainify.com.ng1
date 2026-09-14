'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentRequirement, getRequirementsForRole } from '@/lib/verification-requirements';
import { youverifyService } from '@/lib/youverify';

interface DocumentVerificationProps {
  role: string;
  onVerificationComplete: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
}

export function DocumentVerification({ role, onVerificationComplete, initialData = {} }: DocumentVerificationProps) {
  const requirements = getRequirementsForRole(role);
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});
  const [verificationStatus, setVerificationStatus] = useState<Record<string, 'pending' | 'verified' | 'failed'>>({});
  const [formData, setFormData] = useState<Record<string, string>>(initialData);

  const handleVerify = async (doc: DocumentRequirement) => {
    setVerifying(prev => ({ ...prev, [doc.id]: true }));
    setVerificationStatus(prev => ({ ...prev, [doc.id]: 'pending' }));

    try {
      let result;
      const value = formData[doc.fieldName];

      if (!value) {
        toast.error(`Please enter your ${doc.name}`);
        setVerifying(prev => ({ ...prev, [doc.id]: false }));
        return;
      }

      switch (doc.documentType) {
        case 'NIN':
          result = await youverifyService.verifyNIN(value);
          break;
        case 'BVN':
          result = await youverifyService.verifyBVN(value);
          break;
        case 'CAC':
          result = await youverifyService.verifyCAC(value);
          break;
        default:
          // For document uploads, simulate verification
          await new Promise(resolve => setTimeout(resolve, 2000));
          result = {
            status: 'verified',
            reference: `DOC-${Date.now()}`,
            data: { documentType: doc.documentType },
          };
      }

      if (result.status === 'verified') {
        setVerificationStatus(prev => ({ ...prev, [doc.id]: 'verified' }));
        toast.success(`${doc.name} verified successfully`);
        onVerificationComplete({ [doc.fieldName]: value, ...result.data });
      } else {
        setVerificationStatus(prev => ({ ...prev, [doc.id]: 'failed' }));
        toast.error(`${doc.name} verification failed: ${result.error}`);
      }
    } catch (error: any) {
      setVerificationStatus(prev => ({ ...prev, [doc.id]: 'failed' }));
      toast.error(`Verification error: ${error.message}`);
    } finally {
      setVerifying(prev => ({ ...prev, [doc.id]: false }));
    }
  };

  const handleDocumentUpload = (doc: DocumentRequirement) => {
    // In a real implementation, this would open a file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setFormData(prev => ({ ...prev, [doc.fieldName]: file.name }));
        toast.success(`${doc.name} uploaded successfully`);
      }
    };
    input.click();
  };

  const allVerified = requirements.documents.every(doc => 
    !doc.required || verificationStatus[doc.id] === 'verified'
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Verification</CardTitle>
          <CardDescription>{requirements.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requirements.documents.map((doc) => (
            <div key={doc.id} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">{doc.name}</h4>
                    {doc.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                </div>
                {verificationStatus[doc.id] === 'verified' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {verificationStatus[doc.id] === 'failed' && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>

              {doc.documentType === 'NIN' || doc.documentType === 'BVN' || doc.documentType === 'CAC' ? (
                <div className="space-y-2">
                  <Label htmlFor={doc.id}>{doc.name} Number</Label>
                  <Input
                    id={doc.id}
                    placeholder={`Enter your ${doc.name}`}
                    value={formData[doc.fieldName] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [doc.fieldName]: e.target.value }))}
                    disabled={verificationStatus[doc.id] === 'verified'}
                  />
                  <Button
                    onClick={() => handleVerify(doc)}
                    disabled={verifying[doc.id] || verificationStatus[doc.id] === 'verified'}
                    variant={verificationStatus[doc.id] === 'verified' ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {verifying[doc.id] ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : verificationStatus[doc.id] === 'verified' ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verified
                      </>
                    ) : (
                      'Verify with YouVerify'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleDocumentUpload(doc)}
                    variant="outline"
                    className="w-full"
                    disabled={verificationStatus[doc.id] === 'verified'}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData[doc.fieldName] ? formData[doc.fieldName] : `Upload ${doc.name}`}
                  </Button>
                  {formData[doc.fieldName] && (
                    <Button
                      onClick={() => handleVerify(doc)}
                      disabled={verifying[doc.id] || verificationStatus[doc.id] === 'verified'}
                      variant="outline"
                      className="w-full"
                    >
                      {verifying[doc.id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : 'Verify Document'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {allVerified && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">All required documents verified!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                You can now proceed with registration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}