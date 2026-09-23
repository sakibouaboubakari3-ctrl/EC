// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepProgress } from '@/components/StepProgress';

describe('StepProgress', () => {
  it('renders every step label', () => {
    render(<StepProgress steps={['A', 'B', 'C']} currentStep={1} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('marks the current step as active', () => {
    render(<StepProgress steps={['A', 'B', 'C']} currentStep={1} />);
    expect(screen.getByTestId('step-1')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('step-0')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('step-2')).toHaveAttribute('data-active', 'false');
  });
});
