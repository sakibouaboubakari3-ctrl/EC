import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/password';

describe('password hashing', () => {
  it('produces a hash different from the plaintext', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    expect(hash).not.toBe('Sup3rSecret!');
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    expect(await verifyPassword('Sup3rSecret!', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });
});
