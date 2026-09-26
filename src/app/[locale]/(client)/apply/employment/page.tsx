import { useTranslations } from 'next-intl';
import { getDraftApplicationId } from '../actions';
import { saveEmploymentStepAction } from './actions';
import { StepProgress } from '@/components/StepProgress';
import { pageShellClass, wideCardClass, labelClass, inputClass, primaryButtonClass } from '@/lib/ui/classnames';

export default async function EmploymentPage() {
  const applicationId = await getDraftApplicationId();
  const action = saveEmploymentStepAction.bind(null, applicationId);

  return <EmploymentForm action={action} />;
}

function EmploymentForm({ action }: { action: (formData: FormData) => Promise<void> }) {
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
          currentStep={2}
        />
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="employerName" className={labelClass}>
              {t('apply.employment.employerName')}
            </label>
            <input id="employerName" name="employerName" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="monthlyIncome" className={labelClass}>
              {t('apply.employment.monthlyIncome')}
            </label>
            <input
              id="monthlyIncome"
              name="monthlyIncome"
              type="number"
              min="0"
              step="0.01"
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="employmentStatus" className={labelClass}>
              {t('apply.employment.status')}
            </label>
            <select
              id="employmentStatus"
              name="employmentStatus"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                {t('apply.employment.status')}
              </option>
              <option value="EMPLOYED">{t('apply.employment.statusEmployed')}</option>
              <option value="SELF_EMPLOYED">{t('apply.employment.statusSelfEmployed')}</option>
              <option value="UNEMPLOYED">{t('apply.employment.statusUnemployed')}</option>
              <option value="RETIRED">{t('apply.employment.statusRetired')}</option>
            </select>
          </div>
          <button type="submit" className={`mt-2 ${primaryButtonClass}`}>
            {t('common.next')}
          </button>
        </form>
      </div>
    </main>
  );
}
