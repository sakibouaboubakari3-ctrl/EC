import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { getDraftApplicationId, submitApplicationAction } from '../actions';
import { StepProgress } from '@/components/StepProgress';

export default async function ReviewPage() {
  const applicationId = await getDraftApplicationId();
  const application = await prisma.loanApplication.findUniqueOrThrow({ where: { id: applicationId } });
  const formData = application.formData as Record<string, unknown>;
  const action = submitApplicationAction.bind(null, applicationId);

  return <ReviewSummary formData={formData} action={action} />;
}

function ReviewSummary({
  formData,
  action,
}: {
  formData: Record<string, unknown>;
  action: (formData: FormData) => Promise<void>;
}) {
  const t = useTranslations();

  return (
    <main className="mx-auto max-w-xl p-8">
      <StepProgress
        steps={[
          t('apply.stepLoanDetails'),
          t('apply.stepPersonalInfo'),
          t('apply.stepEmployment'),
          t('apply.stepReview'),
        ]}
        currentStep={3}
      />
      <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[var(--color-navy)]">
        {t('apply.review.title')}
      </h1>
      <dl className="mt-4 grid grid-cols-2 gap-2" data-testid="review-summary">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="text-[var(--color-navy)]/70">{key}</dt>
            <dd>{String(value)}</dd>
          </div>
        ))}
      </dl>
      <form action={action} className="mt-6">
        <button
          type="submit"
          className="rounded-full bg-[var(--color-accent)] px-6 py-2 font-bold text-[var(--color-navy)]"
        >
          {t('apply.review.confirm')}
        </button>
      </form>
    </main>
  );
}
