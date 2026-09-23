import { test, expect } from '@playwright/test';

async function applyAsNewClient(page: import('@playwright/test').Page, email: string) {
  await page.goto('/fr/register');
  await page.getByLabel('Prénom').fill('Ada');
  await page.getByLabel('Nom', { exact: true }).fill('Lovelace');
  await page.getByLabel('Courriel').fill(email);
  await page.getByLabel('Mot de passe').fill('Sup3rSecret!');
  await page.getByRole('button', { name: /créer un compte/i }).click();

  await page.waitForURL(/\/login/);
  await page.getByLabel('Courriel').fill(email);
  await page.getByLabel('Mot de passe').fill('Sup3rSecret!');
  await page.getByRole('button', { name: /se connecter/i }).click();

  await page.waitForURL(/\/apply\/loan-details/);
  await page.locator('#amount-input').fill('8000');
  await page.getByRole('button', { name: /suivant/i }).click();

  await page.waitForURL(/\/apply\/personal/);
  await page.getByLabel('Prénom').fill('Ada');
  await page.getByLabel('Nom', { exact: true }).fill('Lovelace');
  await page.locator('#dateOfBirth').fill('1990-01-01');
  await page.locator('#address').fill('1 rue Principale');
  await page.locator('#city').fill('Montréal');
  await page.locator('#postalCode').fill('H1A 1A1');
  await page.getByRole('button', { name: /suivant/i }).click();

  await page.waitForURL(/\/apply\/employment/);
  await page.locator('#employerName').fill('Acme Inc.');
  await page.locator('#monthlyIncome').fill('4000');
  await page.locator('#employmentStatus').selectOption('EMPLOYED');
  await page.getByRole('button', { name: /suivant/i }).click();

  await page.waitForURL(/\/apply\/review/);
  await expect(page.getByTestId('review-summary')).toBeVisible();
  await page.getByRole('button', { name: /confirmer/i }).click();
  await page.waitForURL(/\/dashboard/);
}

test('client applies, supervisor approves, client sees the schedule', async ({ browser }) => {
  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();
  const staffContext = await browser.newContext();
  const staffPage = await staffContext.newPage();

  const clientEmail = `e2e-approve-${Date.now()}@example.com`;
  await applyAsNewClient(clientPage, clientEmail);
  await expect(clientPage.getByTestId('application-status')).toContainText(/soumise/i);

  await staffPage.goto('/fr/admin/login');
  await staffPage.getByLabel('Courriel').fill('supervisor@espacecredit.test');
  await staffPage.getByLabel('Mot de passe').fill('Sup3rSecret!');
  await staffPage.getByRole('button', { name: /se connecter/i }).click();
  await staffPage.waitForURL(/\/admin$/);

  // .first(): the case list orders by createdAt desc, so the most recently
  // submitted application (this test's) sorts first even if earlier e2e runs
  // left other "Ada Lovelace" rows in this shared database.
  await staffPage.getByText('Ada Lovelace').first().click();
  await staffPage.waitForURL(/\/admin\/applications\//);
  await staffPage.getByRole('button', { name: /approuver/i }).click();
  // The decision form submits via a Next.js Server Action (client-side router
  // transition, not a full navigation), so wait for the resulting re-render —
  // the approve/reject buttons disappear once the application is no longer
  // decidable — before checking the client's view reflects the new status.
  await expect(staffPage.getByRole('button', { name: /approuver/i })).toBeHidden();

  await clientPage.goto('/fr/dashboard');
  await expect(clientPage.getByTestId('application-status')).toContainText(/approuvée/i);
  await expect(clientPage.getByTestId('schedule-table')).toBeVisible();

  await clientContext.close();
  await staffContext.close();
});

test('client applies, supervisor rejects, client sees the reason', async ({ browser }) => {
  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();
  const staffContext = await browser.newContext();
  const staffPage = await staffContext.newPage();

  const clientEmail = `e2e-reject-${Date.now()}@example.com`;
  await applyAsNewClient(clientPage, clientEmail);

  await staffPage.goto('/fr/admin/login');
  await staffPage.getByLabel('Courriel').fill('supervisor@espacecredit.test');
  await staffPage.getByLabel('Mot de passe').fill('Sup3rSecret!');
  await staffPage.getByRole('button', { name: /se connecter/i }).click();
  await staffPage.waitForURL(/\/admin$/);

  await staffPage.getByText('Ada Lovelace').first().click();
  await staffPage.waitForURL(/\/admin\/applications\//);
  await staffPage.locator('#reason').fill('Insufficient income');
  await staffPage.getByRole('button', { name: /refuser/i }).click();
  // See comment in the approve test above: wait for the decision to commit
  // and the page to re-render before checking the client's view.
  await expect(staffPage.getByRole('button', { name: /refuser/i })).toBeHidden();

  await clientPage.goto('/fr/dashboard');
  await expect(clientPage.getByTestId('application-status')).toContainText(/refusée/i);
  await expect(clientPage.getByTestId('decision-reason')).toContainText('Insufficient income');

  await clientContext.close();
  await staffContext.close();
});
