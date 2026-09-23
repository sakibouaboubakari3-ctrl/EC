import { useTranslations } from 'next-intl';
import { getDraftApplicationId } from '../actions';
import { saveEmploymentStepAction } from './actions';
import { StepProgress } from '@/components/StepProgress';

export default async function EmploymentPage() {
  const applicationId = await getDraftApplicationId();
  const action = saveEmploymentStepAction.bind(null, applicationId);

  return <EmploymentForm action={action} />;
}

function EmploymentForm({ action }: { action: (formData: FormData) => Promise<void> }) {
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
        currentStep={2}
      />
      <form action={action} className="mt-6 flex flex-col gap-4">
        <label htmlFor="employerName">{t('apply.employment.employerName')}</label>
        <input id="employerName" name="employerName" required />
        <label htmlFor="monthlyIncome">{t('apply.employment.monthlyIncome')}</label>
        <input id="monthlyIncome" name="monthlyIncome" type="number" min="0" step="0.01" required />
        <label htmlFor="employmentStatus">{t('apply.employment.status')}</label>
        <select id="employmentStatus" name="employmentStatus" required defaultValue="">
          <option value="" disabled>
            {t('apply.employment.status')}
          </option>
          <option value="EMPLOYED">{t('apply.employment.statusEmployed')}</option>
          <option value="SELF_EMPLOYED">{t('apply.employment.statusSelfEmployed')}</option>
          <option value="UNEMPLOYED">{t('apply.employment.statusUnemployed')}</option>
          <option value="RETIRED">{t('apply.employment.statusRetired')}</option>
        </select>
        <button
          type="submit"
          className="mt-2 rounded-full bg-[var(--color-accent)] px-6 py-2 font-bold text-[var(--color-navy)]"
        >
          {t('common.next')}
        </button>
      </form>
    </main>
  );
}
