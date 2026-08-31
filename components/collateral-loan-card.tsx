'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, Calendar, TrendingUp, AlertTriangle, 
  FileText, Shield, MoreHorizontal, ChevronRight 
} from 'lucide-react';
import { formatNaira } from '@/lib/dcid';
import type { CollateralLoan, Property } from '@/lib/supabase/client';

interface CollateralLoanCardProps {
  loan: CollateralLoan;
  property?: Property;
  onManage?: () => void;
}

export function CollateralLoanCard({ loan, property, onManage }: CollateralLoanCardProps) {
  const loanToValue = property ? (loan.loan_amount / property.size_sqm) * 100 : 0;
  const isOverdue = loan.next_payment_date && new Date(loan.next_payment_date) < new Date();
  const daysUntilPayment = loan.next_payment_date 
    ? Math.ceil((new Date(loan.next_payment_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="border-border/60 transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge 
                variant={loan.status === 'ACTIVE' ? 'default' : 'secondary'}
                className={loan.status === 'ACTIVE' ? 'bg-green-500' : ''}
              >
                {loan.status}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle size={12} />
                  Overdue
                </Badge>
              )}
            </div>
            <h3 className="mt-2 font-jakarta text-lg font-bold">
              {formatNaira(loan.loan_amount)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {property?.dc_title || 'Property not linked'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onManage}>
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Monthly Payment</p>
            <p className="font-medium">{formatNaira(loan.monthly_payment)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Outstanding</p>
            <p className="font-medium">{formatNaira(loan.outstanding_balance)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Interest Rate</p>
            <p className="font-medium">{loan.interest_rate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Loan Term</p>
            <p className="font-medium">{loan.loan_term_months} months</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-primary" />
            <span className="text-muted-foreground">Next Payment:</span>
            <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
              {loan.next_payment_date 
                ? new Date(loan.next_payment_date).toLocaleDateString()
                : 'N/A'}
            </span>
            {daysUntilPayment !== null && !isOverdue && (
              <span className="text-xs text-muted-foreground">
                ({daysUntilPayment} days)
              </span>
            )}
          </div>
        </div>

        {property && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp size={14} />
              <span>LTV Ratio:</span>
            </div>
            <span className={`font-medium ${loanToValue > 80 ? 'text-red-600' : loanToValue > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
              {loanToValue.toFixed(1)}%
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <FileText size={14} className="mr-1.5" />
            Documents
          </Button>
          <Button size="sm" className="flex-1">
            <Shield size={14} className="mr-1.5" />
            Insurance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}