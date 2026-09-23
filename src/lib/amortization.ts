export interface ScheduleEntry {
  dueDate: Date;
  amount: number;
}

export function generateAmortizationSchedule(
  amount: number,
  termMonths: number,
  annualRate: number,
  startDate: Date = new Date()
): ScheduleEntry[] {
  const monthlyRate = annualRate / 12;
  const payment =
    monthlyRate === 0
      ? amount / termMonths
      : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
  const roundedPayment = Math.round(payment * 100) / 100;

  const schedule: ScheduleEntry[] = [];
  for (let i = 1; i <= termMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setUTCMonth(dueDate.getUTCMonth() + i);
    schedule.push({ dueDate, amount: roundedPayment });
  }
  return schedule;
}
