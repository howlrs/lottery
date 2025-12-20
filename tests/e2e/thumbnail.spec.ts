import { test } from '@playwright/test';

test('capture thumbnail', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    try {
        await page.waitForSelector('canvas', { timeout: 5000 });
    } catch (e) {
        console.log('Canvas not found, taking screenshot anyway');
    }
    await page.screenshot({ path: 'docs/thumbnail.png' });
});
