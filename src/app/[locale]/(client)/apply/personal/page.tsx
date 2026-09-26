import { useTranslations } from 'next-intl';
import { getDraftApplicationId } from '../actions';
import { savePersonalStepAction } from './actions';
import { StepProgress } from '@/components/StepProgress';
import { pageShellClass, wideCardClass, labelClass, inputClass, primaryButtonClass } from '@/lib/ui/classnames';

export default async function PersonalInfoPage() {
  const applicationId = await getDraftApplicationId();
  const action = savePersonalStepAction.bind(null, applicationId);

  return <PersonalInfoForm action={action} />;
}

function PersonalInfoForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const t = useTranslations();

  return (
    <main className={pageShellClass}>
      <div className={wideCardClass}>
        <StepProgress
          steps={[
            t('apply.stepLoanDetails'),
            t('apply.stepPersonalInfo'),
            t('apply.stepEmployment'),
            t('apply.stepReview'),
          ]}
          currentStep={1}
        />
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="firstName" className={labelClass}>
              {t('auth.firstName')}
            </label>
            <input id="firstName" name="firstName" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="lastName" className={labelClass}>
              {t('auth.lastName')}
            </label>
            <input id="lastName" name="lastName" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dateOfBirth" className={labelClass}>
              {t('apply.personal.dateOfBirth')}
            </label>
            <input id="dateOfBirth" name="dateOfBirth" type="date" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="address" className={labelClass}>
              {t('apply.personal.address')}
            </label>
            <input id="address" name="address" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="city" className={labelClass}>
              {t('apply.personal.city')}
            </label>
            <input id="city" name="city" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="postalCode" className={labelClass}>
              {t('apply.personal.postalCode')}
            </label>
            <input id="postalCode" name="postalCode" required className={inputClass} />
          </div>
          <button type="submit" className={`mt-2 ${primaryButtonClass}`}>
            {t('common.next')}
          </button>
        </form>
      </div>
    </main>
  );
}
