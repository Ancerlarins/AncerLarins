'use client';

import { useState, useMemo } from 'react';
import { formatPrice } from '@/lib/utils';

const BANK_PRESETS = [
  { name: 'Stanbic IBTC', rate: 18 },
  { name: 'Access Bank', rate: 19 },
  { name: 'GTBank', rate: 21 },
  { name: 'First Bank', rate: 23 },
];

export default function MortgageCalculator({ propertyPrice }: { propertyPrice: number }) {
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(22);
  const [termYears, setTermYears] = useState(20);

  const calculation = useMemo(() => {
    const priceNaira = propertyPrice / 100;
    const downPayment = priceNaira * (downPaymentPct / 100);
    const principal = priceNaira - downPayment;

    if (principal <= 0) {
      return { monthly: 0, totalInterest: 0, totalCost: 0, principal: 0, downPayment };
    }

    const monthlyRate = interestRate / 100 / 12;
    const numPayments = termYears * 12;

    // M = P[r(1+r)^n] / [(1+r)^n - 1]
    const factor = Math.pow(1 + monthlyRate, numPayments);
    const monthly = principal * (monthlyRate * factor) / (factor - 1);
    const totalCost = monthly * numPayments;
    const totalInterest = totalCost - principal;

    return {
      monthly: Math.round(monthly),
      totalInterest: Math.round(totalInterest),
      totalCost: Math.round(totalCost + downPayment),
      principal: Math.round(principal),
      downPayment: Math.round(downPayment),
    };
  }, [propertyPrice, downPaymentPct, interestRate, termYears]);

  // Affordability: 30% DTI rule
  const requiredIncome = calculation.monthly > 0 ? Math.round(calculation.monthly / 0.3) : 0;

  // Pie chart segments (CSS conic-gradient)
  const principalPct = calculation.totalCost > 0
    ? Math.round((calculation.principal / calculation.totalCost) * 100)
    : 0;
  const interestPct = calculation.totalCost > 0
    ? Math.round((calculation.totalInterest / calculation.totalCost) * 100)
    : 0;

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-1">Mortgage Calculator</h2>
      <p className="text-xs text-text-muted mb-5">Estimate your monthly payment for this property</p>

      <div className="space-y-5">
        {/* Down Payment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="mortgage-down-payment" className="text-sm text-text-secondary">Down Payment</label>
            <span className="text-sm font-semibold text-text-primary">{downPaymentPct}%</span>
          </div>
          <input
            id="mortgage-down-payment"
            type="range"
            min={5}
            max={80}
            step={5}
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Number(e.target.value))}
            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent-dark"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>5%</span>
            <span className="font-medium text-text-secondary">{formatPrice(calculation.downPayment * 100)}</span>
            <span>80%</span>
          </div>
        </div>

        {/* Interest Rate */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="mortgage-interest-rate" className="text-sm text-text-secondary">Interest Rate</label>
            <span className="text-sm font-semibold text-text-primary">{interestRate}%</span>
          </div>
          <input
            id="mortgage-interest-rate"
            type="range"
            min={10}
            max={35}
            step={0.5}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent-dark"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {BANK_PRESETS.map((bank) => (
              <button
                key={bank.name}
                type="button"
                onClick={() => setInterestRate(bank.rate)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  interestRate === bank.rate
                    ? 'bg-primary text-white'
                    : 'bg-background border border-border text-text-muted hover:border-accent-dark'
                }`}
              >
                {bank.name} ({bank.rate}%)
              </button>
            ))}
          </div>
        </div>

        {/* Loan Term */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="mortgage-loan-term" className="text-sm text-text-secondary">Loan Term</label>
            <span className="text-sm font-semibold text-text-primary">{termYears} years</span>
          </div>
          <input
            id="mortgage-loan-term"
            type="range"
            min={5}
            max={30}
            step={5}
            value={termYears}
            onChange={(e) => setTermYears(Number(e.target.value))}
            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent-dark"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>5 yrs</span>
            <span>30 yrs</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 pt-5 border-t border-border">
        <div className="text-center mb-5">
          <p className="text-xs text-text-muted mb-1">Monthly Payment</p>
          <p className="text-3xl font-bold text-accent-dark">{formatPrice(calculation.monthly * 100)}</p>
          <p className="text-xs text-text-muted mt-0.5">/month</p>
        </div>

        <div className="flex items-center gap-5">
          {/* CSS Pie Chart */}
          <div
            className="w-20 h-20 rounded-full flex-shrink-0"
            style={{
              background: `conic-gradient(
                var(--color-primary) 0% ${principalPct}%,
                var(--color-accent-dark) ${principalPct}% ${principalPct + interestPct}%,
                var(--color-border) ${principalPct + interestPct}% 100%
              )`,
            }}
          />
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
              <span className="text-text-muted">Principal:</span>
              <span className="font-medium text-text-primary ml-auto">{formatPrice(calculation.principal * 100)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent-dark flex-shrink-0" />
              <span className="text-text-muted">Interest:</span>
              <span className="font-medium text-text-primary ml-auto">{formatPrice(calculation.totalInterest * 100)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-border flex-shrink-0" />
              <span className="text-text-muted">Down Payment:</span>
              <span className="font-medium text-text-primary ml-auto">{formatPrice(calculation.downPayment * 100)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 text-sm text-text-muted">
          <p className="flex justify-between">
            <span>Total Cost</span>
            <span className="font-medium text-text-primary">{formatPrice(calculation.totalCost * 100)}</span>
          </p>
        </div>

        {/* Affordability Note */}
        {requiredIncome > 0 && (
          <div className="mt-4 bg-accent/10 rounded-lg p-3">
            <p className="text-xs text-accent-dark">
              Based on the 30% debt-to-income rule, you need approximately{' '}
              <span className="font-semibold">{formatPrice(requiredIncome * 100)}</span>{' '}
              monthly income to qualify for this mortgage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
