import { describe, it, expect } from 'vitest';
import { statusMessageKey } from '@/lib/status-label';

describe('statusMessageKey', () => {
  it('maps simple statuses', () => {
    expect(statusMessageKey('DRAFT')).toBe('dashboard.statusDraft');
    expect(statusMessageKey('SUBMITTED')).toBe('dashboard.statusSubmitted');
    expect(statusMessageKey('APPROVED')).toBe('dashboard.statusApproved');
    expect(statusMessageKey('REJECTED')).toBe('dashboard.statusRejected');
  });

  it('maps a multi-word status', () => {
    expect(statusMessageKey('IN_REVIEW')).toBe('dashboard.statusInReview');
  });
});
