import { describe, it, expect } from 'vitest';
import { ORIGINATION_FEE_RATE, calculateNetDisbursement } from '@/lib/config/loan';

describe('calculateNetDisbursement', () => {
  it('deducts the origination fee rate from the approved amount', () => {
    expect(ORIGINATION_FEE_RATE).toBe(0.05);
    expect(calculateNetDisbursement(100000)).toBe(95000);
  });

  it('rounds to the nearest cent-equivalent integer for odd amounts', () => {
    expect(calculateNetDisbursement(80000)).toBe(76000);
  });
});
