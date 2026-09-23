// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoanSimulator } from '@/components/LoanSimulator';

describe('LoanSimulator', () => {
  it('clamps the amount to the configured bounds', () => {
    render(<LoanSimulator annualRate={0.15} />);
    const input = screen.getByLabelText(/amount-input/i, { selector: 'input' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '99999' } });
    expect(input.value).toBe('20000');
    fireEvent.change(input, { target: { value: '1' } });
    expect(input.value).toBe('2000');
  });

  it('keeps the slider and the numeric input in sync', () => {
    render(<LoanSimulator annualRate={0.15} />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    const input = screen.getByLabelText(/amount-input/i, { selector: 'input' }) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '8000' } });
    expect(input.value).toBe('8000');
  });

  it('calls onChange with the current amount and term', () => {
    const onChange = vi.fn();
    render(<LoanSimulator annualRate={0.15} onChange={onChange} />);
    const input = screen.getByLabelText(/amount-input/i, { selector: 'input' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '6000' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ amount: 6000 }));
  });

  it('displays a computed monthly payment', () => {
    render(<LoanSimulator initialAmount={1200} initialTermMonths={12} annualRate={0} />);
    expect(screen.getByTestId('monthly-payment')).toHaveTextContent('100.00');
  });
});
