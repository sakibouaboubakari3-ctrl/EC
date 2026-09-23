import { useTranslations } from 'next-intl';
import { getDraftApplicationId } from '../actions';
import { savePersonalStepAction } from './actions';
import { StepProgress } from '@/components/StepProgress';

export default async function PersonalInfoPage() {
  const applicationId = await getDraftApplicationId();
  const action = savePersonalStepAction.bind(null, applicationId);

  return <PersonalInfoForm action={action} />;
}

function PersonalInfoForm({ action }: { action: (formData: FormData) => Promise<void> }) {
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
        currentStep={1}
      />
      <form action={action} className="mt-6 flex flex-col gap-4">
        <label htmlFor="firstName">{t('auth.firstName')}</label>
        <input id="firstName" name="firstName" required />
        <label htmlFor="lastName">{t('auth.lastName')}</label>
        <input id="lastName" name="lastName" required />
        <label htmlFor="dateOfBirth">{t('apply.personal.dateOfBirth')}</label>
        <input id="dateOfBirth" name="dateOfBirth" type="date" required />
        <label htmlFor="address">{t('apply.personal.address')}</label>
        <input id="address" name="address" required />
        <label htmlFor="city">{t('apply.personal.city')}</label>
        <input id="city" name="city" required />
        <label htmlFor="postalCode">{t('apply.personal.postalCode')}</label>
        <input id="postalCode" name="postalCode" required />
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
