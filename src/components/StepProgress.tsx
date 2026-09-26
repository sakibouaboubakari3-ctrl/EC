export interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <ol className="mb-8 flex items-start gap-2" data-testid="step-progress">
      {steps.map((label, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;
        return (
          <li
            key={label}
            data-testid={`step-${index}`}
            data-active={isActive}
            className="flex flex-1 flex-col items-center gap-2 text-center"
          >
            <span
              className={
                isActive || isDone
                  ? 'flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-[var(--color-navy)]'
                  : 'flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-navy)]/30 text-sm text-[var(--color-navy)]/50'
              }
            >
              {index + 1}
            </span>
            <span
              className={
                isActive
                  ? 'text-xs font-bold text-[var(--color-navy)]'
                  : 'text-xs text-[var(--color-navy)]/50'
              }
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
