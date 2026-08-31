'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Landmark, Activity, Wallet, TrendingUp, Loader2, Key, Copy,
  Shield, DollarSign, AlertTriangle, CheckCircle, Calendar,
  FileText, PieChart, Plus, ArrowRight, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import type { 
  Bank, Property, Payment, CollateralLoan, 
  CollateralInsurance, CollateralValuation, CollateralAlert 
} from '@/lib/supabase/client';
import { SiteHeader } from '@/components/site-header';
import { StatusBadge } from '@/components/status-badge';
import { CollateralWorkflow } from '@/components/collateral-workflow';
import { formatNaira } from '@/lib/dcid';

export default function BankDashboard() {
  const [bank, setBank] = useState<Bank | null>(null);
  const [collateral, setCollateral] = useState<Property[]>([]);
  const [apiCalls, setApiCalls] = useState<Payment[]>([]);
  const [loans, setLoans] = useState<CollateralLoan[]>([]);
  const [insurance, setInsurance] = useState<CollateralInsurance[]>([]);
  const [valuations, setValuations] = useState<CollateralValuation[]>([]);
  const [alerts, setAlerts] = useState<CollateralAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data: bankData } = await supabase
        .from('banks')
        .select('*')
        .maybeSingle();
      setBank(bankData as Bank | null);

      const { data: propData } = await supabase
        .from('properties')
        .select('*')
        .eq('is_pledged', true);
      setCollateral(propData as Property[] || []);

      const { data: payData } = await supabase
        .from('payments')
        .select('*')
        .eq('type', 'BANK_API')
        .order('created_at', { ascending: false })
        .limit(10);
      setApiCalls(payData as Payment[] || []);

      const { data: loanData } = await supabase
        .from('collateral_loans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setLoans(loanData as CollateralLoan[] || []);

      const { data: insuranceData } = await supabase
        .from('collateral_insurance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setInsurance(insuranceData as CollateralInsurance[] || []);

      const { data: valuationData } = await supabase
        .from('collateral_valuations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setValuations(valuationData as CollateralValuation[] || []);

      const { data: alertData } = await supabase
        .from('collateral_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);
      setAlerts(alertData as CollateralAlert[] || []);

      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <>
        <SiteHeader />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      </>
    );
  }

  const apiUsage = bank ? (bank.api_calls_used / bank.api_calls_included) * 100 : 0;
  const totalLoanPortfolio = loans.reduce((sum, loan) => sum + loan.loan_amount, 0);
  const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstanding_balance, 0);
  const activeLoans = loans.filter(l => l.status === 'ACTIVE').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-jakarta text-2xl font-bold">Bank Portal</h1>
            <p className="text-sm text-muted-foreground">Collateral management & loan portfolio tracking</p>
          </div>
          <Button onClick={() => setShowNewLoanModal(true)}>
            <Plus size={16} className="mr-2" />
            New Collateral Loan
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {[
            { label: 'Total Portfolio', value: formatNaira(totalLoanPortfolio), icon: PieChart, color: 'text-primary' },
            { label: 'Outstanding', value: formatNaira(totalOutstanding), icon: DollarSign, color: 'text-blue-600' },
            { label: 'Active Loans', value: activeLoans, icon: TrendingUp, color: 'text-green-600' },
            { label: 'Collateral', value: collateral.length, icon: Shield, color: 'text-purple-600' },
            { label: 'API Calls', value: `${bank?.api_calls_used || 0}/${bank?.api_calls_included || 100}`, icon: Activity, color: 'text-secondary' },
            { label: 'Critical Alerts', value: criticalAlerts, icon: AlertTriangle, color: 'text-red-600' },
          ].map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4">
                <s.icon size={20} className={s.color} />
                <p className="mt-2 font-jakarta text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="loans" className="mt-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="loans">
              <DollarSign size={16} className="mr-1.5" />
              Loans
            </TabsTrigger>
            <TabsTrigger value="collateral">
              <Shield size={16} className="mr-1.5" />
              Collateral
            </TabsTrigger>
            <TabsTrigger value="insurance">
              <FileText size={16} className="mr-1.5" />
              Insurance
            </TabsTrigger>
            <TabsTrigger value="valuations">
              <TrendingUp size={16} className="mr-1.5" />
              Valuations
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <AlertTriangle size={16} className="mr-1.5" />
              Alerts
            </TabsTrigger>
          </TabsList>

          {/* Loans Tab */}
          <TabsContent value="loans" className="mt-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="font-jakarta text-lg">Active Loans Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                {loans.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <DollarSign size={32} className="text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No active loans</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loans.map((loan) => (
                      <div key={loan.id} className="rounded-lg border border-border/60 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Loan Amount: {formatNaira(loan.loan_amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              Term: {loan.loan_term_months} months &middot; Rate: {loan.interest_rate}%
                            </p>
                          </div>
                          <Badge 
                            variant={loan.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className={loan.status === 'ACTIVE' ? 'bg-green-500' : ''}
                          >
                            {loan.status}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Monthly Payment</p>
                            <p className="font-medium">{formatNaira(loan.monthly_payment)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Outstanding</p>
                            <p className="font-medium">{formatNaira(loan.outstanding_balance)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Next Payment</p>
                            <p className="font-medium">
                              {loan.next_payment_date 
                                ? new Date(loan.next_payment_date).toLocaleDateString() 
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collateral Tab */}
          <TabsContent value="collateral" className="mt-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="font-jakarta text-lg">Pledged Properties</CardTitle>
              </CardHeader>
              <CardContent>
                {collateral.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Shield size={32} className="text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No collateral pledged</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collateral.map((p) => (
                      <div key={p.id} className="rounded-lg border border-blue-300 bg-blue-50 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{p.dc_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.owner_name} &middot; {p.size_sqm} sqm &middot; {p.state}
                            </p>
                          </div>
                          <StatusBadge status={p.status} isPledged={p.is_pledged} bankName={p.bank_name} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="mt-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="font-jakarta text-lg">Insurance Policies</CardTitle>
              </CardHeader>
              <CardContent>
                {insurance.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <FileText size={32} className="text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No insurance policies</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insurance.map((policy) => (
                      <div key={policy.id} className="rounded-lg border border-border/60 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{policy.insurance_provider}</p>
                            <p className="text-xs text-muted-foreground">
                              Policy: {policy.policy_number}
                            </p>
                          </div>
                          <Badge 
                            variant={policy.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className={policy.status === 'ACTIVE' ? 'bg-green-500' : ''}
                          >
                            {policy.status}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Coverage</p>
                            <p className="font-medium">{formatNaira(policy.coverage_amount)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Premium</p>
                            <p className="font-medium">{formatNaira(policy.premium_amount)}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Valid: {new Date(policy.policy_start_date).toLocaleDateString()} - {new Date(policy.policy_end_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Valuations Tab */}
          <TabsContent value="valuations" className="mt-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="font-jakarta text-lg">Property Valuations</CardTitle>
              </CardHeader>
              <CardContent>
                {valuations.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <TrendingUp size={32} className="text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No valuations recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {valuations.map((valuation) => (
                      <div key={valuation.id} className="rounded-lg border border-border/60 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{formatNaira(valuation.valuation_amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {valuation.valuator_name} &middot; {valuation.valuation_method}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {new Date(valuation.valuation_date).toLocaleDateString()}
                          </Badge>
                        </div>
                        {valuation.notes && (
                          <p className="mt-2 text-xs text-muted-foreground">{valuation.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="font-jakarta text-lg">Risk Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <CheckCircle size={32} className="text-green-600" />
                    <p className="mt-2 text-sm text-muted-foreground">No active alerts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={`rounded-lg border p-4 ${
                        alert.severity === 'CRITICAL' ? 'border-red-300 bg-red-50' :
                        alert.severity === 'HIGH' ? 'border-orange-300 bg-orange-50' :
                        alert.severity === 'MEDIUM' ? 'border-yellow-300 bg-yellow-50' :
                        'border-blue-300 bg-blue-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className={
                              alert.severity === 'CRITICAL' ? 'text-red-600' :
                              alert.severity === 'HIGH' ? 'text-orange-600' :
                              alert.severity === 'MEDIUM' ? 'text-yellow-600' :
                              'text-blue-600'
                            } />
                            <div>
                              <p className="text-sm font-medium">{alert.alert_type}</p>
                              <p className="text-xs text-muted-foreground">{alert.message}</p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline"
                            className={
                              alert.severity === 'CRITICAL' ? 'border-red-300 text-red-700' :
                              alert.severity === 'HIGH' ? 'border-orange-300 text-orange-700' :
                              alert.severity === 'MEDIUM' ? 'border-yellow-300 text-yellow-700' :
                              'border-blue-300 text-blue-700'
                            }
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline">
                            Resolve
                          </Button>
                          <Button size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* API Usage Section */}
        <Card className="mt-6 border-border/60">
          <CardHeader>
            <CardTitle className="font-jakarta text-lg">API Usage & Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Used: {bank?.api_calls_used || 0}</span>
                  <span className="text-muted-foreground">Limit: {bank?.api_calls_included || 100}</span>
                </div>
                <div className="mt-2 h-4 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${apiUsage > 80 ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, apiUsage)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {apiUsage.toFixed(0)}% of monthly quota used
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-primary" />
                    <span className="text-sm font-medium">API Key</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(bank?.api_key || '');
                      toast.success('API key copied');
                    }}
                  >
                    <Copy size={14} className="mr-1.5" />
                    Copy
                  </Button>
                </div>
                <p className="mt-2 font-mono text-xs text-muted-foreground break-all">
                  {bank?.api_key?.substring(0, 20)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Collateral Loan Modal */}
        {showNewLoanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-2xl">
              <CollateralWorkflow 
                bank={bank} 
                onSuccess={() => {
                  setShowNewLoanModal(false);
                  // Refresh data
                  window.location.reload();
                }} 
              />
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => setShowNewLoanModal(false)}>
                  <X size={16} className="mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
