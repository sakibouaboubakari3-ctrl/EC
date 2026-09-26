import { getDraftApplicationId } from '../actions';
import { LoanDetailsForm } from './LoanDetailsForm';

export default async function LoanDetailsPage() {
  const applicationId = await getDraftApplicationId();
  return <LoanDetailsForm applicationId={applicationId} />;
}
