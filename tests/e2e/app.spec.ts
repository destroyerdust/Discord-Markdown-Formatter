import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1400 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('formats spoilers and reveals them in preview', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Message content' });

  await editor.fill('secret');
  await editor.press('Control+A');
  await page.getByRole('button', { name: 'Spoiler' }).click();

  await expect(editor).toHaveValue('||secret||');

  const spoiler = page.getByRole('button', { name: 'Spoiler (click to reveal)' });
  await expect(spoiler).toBeVisible();
  await spoiler.click();
  await expect(spoiler).toHaveClass(/revealed/);
});

test('builds and inserts a timestamp token into the editor', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Message content' });

  await editor.fill('Meet at ');
  await editor.press('End');
  await page.getByRole('button', { name: 'Insert Timestamp' }).click();

  await expect(page.getByRole('dialog', { name: 'Timestamp Builder' })).toBeVisible();
  await page.getByRole('button', { name: 'In 5 minutes' }).click();
  await page.getByRole('button', { name: /Relative/i }).click();
  const insertTimestampButton = page
    .getByRole('dialog', { name: 'Timestamp Builder' })
    .getByRole('button', { name: 'Insert Timestamp', exact: true });
  await insertTimestampButton.scrollIntoViewIfNeeded();
  await insertTimestampButton.click({ force: true });

  await expect(editor).toHaveValue(/Meet at <t:\d+:R>/);
  await expect(page.locator('.discord-timestamp')).toHaveCount(1);
});

test('saves a draft, reloads, then loads and deletes it', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Message content' });

  await editor.fill('Persistent draft body');
  await page.getByRole('button', { name: 'Open drafts' }).click();
  await page.getByLabel('Save Current Content as Draft').fill('Smoke Draft');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('1 draft saved locally')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Open drafts' }).click();
  await expect(page.getByRole('heading', { name: 'Smoke Draft' })).toBeVisible();

  await page.locator('button[title="Load draft"]').first().click();
  await expect(editor).toHaveValue('Persistent draft body');

  await page.getByRole('button', { name: 'Open drafts' }).click();
  await page.locator('button[title="Delete draft"]').first().click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('No saved drafts yet')).toBeVisible();
});

test('inserts a template from the gallery', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Message content' });

  await page.getByRole('button', { name: 'Open templates' }).click();
  await expect(page.getByRole('dialog', { name: 'Template Gallery' })).toBeVisible();

  await page.getByRole('button', { name: 'Interactive' }).click();
  await page.getByRole('button', { name: /Simple Poll/i }).click();
  await page.getByRole('button', { name: 'Insert Template' }).click();

  await expect(editor).toHaveValue(/# Poll: Your Question Here\?/);
});
