export interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <ol className="flex gap-4" data-testid="step-progress">
      {steps.map((label, index) => (
        <li
          key={label}
          data-testid={`step-${index}`}
          data-active={index === currentStep}
          className={
            index === currentStep
              ? 'font-bold text-[var(--color-accent)]'
              : 'text-[var(--color-navy)]/50'
          }
        >
          {label}
        </li>
      ))}
    </ol>
  );
}
