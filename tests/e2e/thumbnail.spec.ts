import { test } from '@playwright/test';

test('capture thumbnail', async ({ page }) => {
    await page.goto('/');
    // Wait for the lottery wheel to be visible to look nice
    await page.waitForSelector('canvas');
    await page.screenshot({ path: 'docs/thumbnail.png' });
});
