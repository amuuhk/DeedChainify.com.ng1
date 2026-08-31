'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, Calendar, Calculator, Shield, FileText, 
  AlertTriangle, CheckCircle, Loader2, Plus, X, Search 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { formatNaira, calculateMonthlyPayment, generateLoanId } from '@/lib/dcid';
import type { Property, Bank } from '@/lib/supabase/client';

interface CollateralWorkflowProps {
  bank: Bank | null;
  onSuccess?: () => void;
}

export function CollateralWorkflow({ bank, onSuccess }: CollateralWorkflowProps) {
  const [step, setStep] = useState<'search' | 'loan' | 'insurance' | 'review'>('search');
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Property[]>([]);

  const [loanForm, setLoanForm] = useState({
    loanAmount: '',
    loanTermMonths: '12',
    interestRate: '15',
    startDate: new Date().toISOString().split('T')[0],
  });

  const [insuranceForm, setInsuranceForm] = useState({
    policyNumber: '',
    insuranceProvider: '',
    coverageAmount: '',
    premiumAmount: '',
    policyStartDate: new Date().toISOString().split('T')[0],
    policyEndDate: '',
  });

  async function searchProperties() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .or(`dc_title.ilike.%${searchQuery}%,owner_name.ilike.%${searchQuery}%`)
        .eq('status', 'VERIFIED')
        .limit(10);
      setSearchResults(data as Property[] || []);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }

  function calculateLoanDetails() {
    const principal = parseFloat(loanForm.loanAmount) || 0;
    const rate = parseFloat(loanForm.interestRate) || 0;
    const months = parseInt(loanForm.loanTermMonths) || 12;
    
    const monthlyPayment = calculateMonthlyPayment(principal, rate, months);
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - principal;

    return { monthlyPayment, totalPayment, totalInterest };
  }

  async function createCollateralLoan() {
    if (!selectedProperty || !bank) return;
    setLoading(true);

    try {
      const { monthlyPayment } = calculateLoanDetails();
      const principal = parseFloat(loanForm.loanAmount) || 0;
      const months = parseInt(loanForm.loanTermMonths) || 12;
      
      const startDate = new Date(loanForm.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);
      
      const nextPaymentDate = new Date(startDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      // Create loan
      const { data: loanData, error: loanError } = await supabase
        .from('collateral_loans')
        .insert({
          bank_id: bank.id,
          property_id: selectedProperty.id,
          loan_amount: principal,
          loan_term_months: months,
          interest_rate: parseFloat(loanForm.interestRate) || 0,
          monthly_payment: monthlyPayment,
          outstanding_balance: principal,
          status: 'ACTIVE',
          start_date: loanForm.startDate,
          end_date: endDate.toISOString(),
          next_payment_date: nextPaymentDate.toISOString(),
        })
        .select()
        .single();

      if (loanError) throw loanError;

      // Update property as pledged
      await supabase
        .from('properties')
        .update({ 
          is_pledged: true, 
          bank_name: bank.bank_name,
          status: 'COLLATERAL'
        })
        .eq('id', selectedProperty.id);

      // Create insurance if provided
      if (insuranceForm.policyNumber && insuranceForm.insuranceProvider) {
        await supabase.from('collateral_insurance').insert({
          loan_id: loanData.id,
          policy_number: insuranceForm.policyNumber,
          insurance_provider: insuranceForm.insuranceProvider,
          coverage_amount: parseFloat(insuranceForm.coverageAmount) || 0,
          premium_amount: parseFloat(insuranceForm.premiumAmount) || 0,
          policy_start_date: insuranceForm.policyStartDate,
          policy_end_date: insuranceForm.policyEndDate,
          status: 'ACTIVE',
        });
      }

      // Create initial valuation
      await supabase.from('collateral_valuations').insert({
        property_id: selectedProperty.id,
        bank_id: bank.id,
        valuation_amount: principal, // Using loan amount as initial valuation
        valuation_date: new Date().toISOString(),
        valuator_name: 'Bank Internal',
        valuation_method: 'Automated',
        notes: 'Initial valuation for collateral loan',
      });

      toast.success('Collateral loan created successfully');
      if (onSuccess) onSuccess();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create loan');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setStep('search');
    setSelectedProperty(null);
    setSearchQuery('');
    setSearchResults([]);
    setLoanForm({
      loanAmount: '',
      loanTermMonths: '12',
      interestRate: '15',
      startDate: new Date().toISOString().split('T')[0],
    });
    setInsuranceForm({
      policyNumber: '',
      insuranceProvider: '',
      coverageAmount: '',
      premiumAmount: '',
      policyStartDate: new Date().toISOString().split('T')[0],
      policyEndDate: '',
    });
  }

  const loanDetails = calculateLoanDetails();

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-jakarta text-lg">Create Collateral Loan</CardTitle>
            <CardDescription>
              {step === 'search' && 'Search for a verified property to use as collateral'}
              {step === 'loan' && 'Configure loan terms and conditions'}
              {step === 'insurance' && 'Add insurance policy (optional)'}
              {step === 'review' && 'Review and confirm collateral loan details'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={resetForm}>
            <X size={16} />
          </Button>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4 flex items-center gap-2">
          {['search', 'loan', 'insurance', 'review'].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div className={`h-2 w-8 rounded-full ${
                step === s ? 'bg-primary' : 
                ['search', 'loan', 'insurance', 'review'].indexOf(step) > idx ? 'bg-primary/50' : 'bg-muted'
              }`} />
              {idx < 3 && <div className="w-2 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {step === 'search' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by DC Title or owner name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchProperties()}
              />
              <Button onClick={searchProperties} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((property) => (
                  <div
                    key={property.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedProperty?.id === property.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border/60 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedProperty(property)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{property.dc_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {property.owner_name} &middot; {property.size_sqm} sqm
                        </p>
                      </div>
                      <Badge variant="outline">{property.state}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full"
              disabled={!selectedProperty}
              onClick={() => setStep('loan')}
            >
              Continue to Loan Setup
              <Calculator size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {step === 'loan' && (
          <div className="space-y-4">
            {selectedProperty && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-sm font-medium">{selectedProperty.dc_title}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedProperty.layout_name}, {selectedProperty.lga}, {selectedProperty.state}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Loan Amount (₦)</Label>
                <Input
                  type="number"
                  value={loanForm.loanAmount}
                  onChange={(e) => setLoanForm({ ...loanForm, loanAmount: e.target.value })}
                  placeholder="5000000"
                />
              </div>
              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={loanForm.interestRate}
                  onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Loan Term (Months)</Label>
                <Select
                  value={loanForm.loanTermMonths}
                  onValueChange={(v) => setLoanForm({ ...loanForm, loanTermMonths: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                    <SelectItem value="60">60 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={loanForm.startDate}
                  onChange={(e) => setLoanForm({ ...loanForm, startDate: e.target.value })}
                />
              </div>
            </div>

            {loanForm.loanAmount && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calculator size={16} className="text-primary" />
                  Loan Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Payment</span>
                    <span className="font-medium">{formatNaira(loanDetails.monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Interest</span>
                    <span className="font-medium">{formatNaira(loanDetails.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Payment</span>
                    <span className="font-medium">{formatNaira(loanDetails.totalPayment)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('search')}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep('insurance')}>
                Continue
                <Shield size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'insurance' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText size={16} />
              <span>Insurance is optional but recommended for collateral protection</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Policy Number</Label>
                <Input
                  value={insuranceForm.policyNumber}
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                  placeholder="POL-2024-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Insurance Provider</Label>
                <Input
                  value={insuranceForm.insuranceProvider}
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, insuranceProvider: e.target.value })}
                  placeholder="Leadway Assurance"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Coverage Amount (₦)</Label>
                  <Input
                    type="number"
                    value={insuranceForm.coverageAmount}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, coverageAmount: e.target.value })}
                    placeholder={loanForm.loanAmount}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Premium Amount (₦)</Label>
                  <Input
                    type="number"
                    value={insuranceForm.premiumAmount}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, premiumAmount: e.target.value })}
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Policy Start Date</Label>
                  <Input
                    type="date"
                    value={insuranceForm.policyStartDate}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyStartDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Policy End Date</Label>
                  <Input
                    type="date"
                    value={insuranceForm.policyEndDate}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyEndDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('loan')}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep('review')}>
                Review
                <CheckCircle size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <h4 className="font-medium mb-3">Collateral Summary</h4>
              {selectedProperty && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property</span>
                    <span className="font-medium">{selectedProperty.dc_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{selectedProperty.lga}, {selectedProperty.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium">{selectedProperty.size_sqm} sqm</span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <h4 className="font-medium mb-3">Loan Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Amount</span>
                  <span className="font-medium">{formatNaira(parseFloat(loanForm.loanAmount) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Rate</span>
                  <span className="font-medium">{loanForm.interestRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Term</span>
                  <span className="font-medium">{loanForm.loanTermMonths} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Payment</span>
                  <span className="font-medium">{formatNaira(loanDetails.monthlyPayment)}</span>
                </div>
              </div>
            </div>

            {insuranceForm.policyNumber && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <h4 className="font-medium mb-3">Insurance Coverage</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">{insuranceForm.insuranceProvider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Policy Number</span>
                    <span className="font-medium">{insuranceForm.policyNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-medium">{formatNaira(parseFloat(insuranceForm.coverageAmount) || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('insurance')}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={createCollateralLoan}
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />}
                Create Collateral Loan
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}