// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';
import { LoanSimulator } from '@/components/LoanSimulator';

function renderSimulator(props: Partial<React.ComponentProps<typeof LoanSimulator>> = {}) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <LoanSimulator annualRate={0.15} {...props} />
    </NextIntlClientProvider>
  );
}

describe('LoanSimulator', () => {
  it('clamps the amount to the configured bounds', () => {
    renderSimulator();
    const input = screen.getByLabelText(/amount-input/i, { selector: 'input' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '999999' } });
    expect(input.value).toBe('500000');
    fireEvent.change(input, { target: { value: '1' } });
    expect(input.value).toBe('20000');
  });

  it('keeps the slider and the numeric input in sync', () => {
    renderSimulator();
    const slider = screen.getByRole('slider') as HTMLInputElement;
    const input = screen.getByLabelText(/amount-input/i, { selector: 'input' }) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '80000' } });
    expect(input.value).toBe('80000');
  });

  it('calls onChange with the current amount and term', () => {
    const onChange = vi.fn();
    renderSimulator({ onChange });
    const input = screen.getByLabelText(/amount-input/i, { selector: 'input' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '60000' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ amount: 60000 }));
  });

  it('displays a computed monthly payment formatted as CAD currency', () => {
    renderSimulator({ initialAmount: 120000, initialTermMonths: 12, annualRate: 0 });
    expect(screen.getByTestId('monthly-payment')).toHaveTextContent(/10\s*000\s*\$/);
  });

  it('discloses the origination fee', () => {
    renderSimulator();
    expect(screen.getByText(messages.simulator.feeDisclosure)).toBeInTheDocument();
  });
});
