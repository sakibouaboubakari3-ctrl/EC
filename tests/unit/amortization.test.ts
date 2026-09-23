import { describe, it, expect } from 'vitest';
import { generateAmortizationSchedule } from '@/lib/amortization';

describe('generateAmortizationSchedule', () => {
  it('splits an interest-free loan into equal payments', () => {
    const schedule = generateAmortizationSchedule(1200, 12, 0, new Date('2026-01-01'));
    expect(schedule).toHaveLength(12);
    expect(schedule[0].amount).toBeCloseTo(100, 2);
    const total = schedule.reduce((sum, entry) => sum + entry.amount, 0);
    expect(total).toBeCloseTo(1200, 1);
  });

  it('produces monthly due dates starting after the start date', () => {
    const schedule = generateAmortizationSchedule(1200, 3, 0, new Date('2026-01-01'));
    expect(schedule[0].dueDate.toISOString().slice(0, 10)).toBe('2026-02-01');
    expect(schedule[1].dueDate.toISOString().slice(0, 10)).toBe('2026-03-01');
    expect(schedule[2].dueDate.toISOString().slice(0, 10)).toBe('2026-04-01');
  });

  it('charges more than principal when a positive rate is applied', () => {
    const schedule = generateAmortizationSchedule(5000, 12, 0.15, new Date('2026-01-01'));
    const total = schedule.reduce((sum, entry) => sum + entry.amount, 0);
    expect(total).toBeGreaterThan(5000);
  });
});
