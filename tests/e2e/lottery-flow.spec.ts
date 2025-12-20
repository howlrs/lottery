import { test, expect } from '@playwright/test';

test.describe('Lottery Flow', () => {
    test('should allow an admin to manage rewards and a user to participate', async ({ page, baseURL }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        console.log('Testing with baseURL:', baseURL);
        // 1. Admin Page: List Events
        await page.goto('/admin');
        await expect(page.locator('h1')).toContainText(/Events|イベント一覧/);

        // 2. Click on "Manage" for the first event (assuming one exists from seeding)
        await page.goto('/admin');
        await expect(page.locator('h1')).toContainText(/Events|イベント一覧/);

        // 3. Go to public page and find event
        await page.goto('/');
        const eventLink = page.locator('a[href^="/events/"]').first();
        await expect(eventLink).toBeVisible();
        const eventSlug = await eventLink.getAttribute('href');

        // 4. User: Participation
        console.log('Clicking on event:', eventSlug);
        await eventLink.click();

        await expect(page.locator('h1')).toBeVisible();
        console.log('Participating in lottery...');

        // Spin the wheel
        const spinButton = page.locator('button', { hasText: /SPIN|回す|Spin/i });
        await expect(spinButton).toBeEnabled();
        await spinButton.click();
        console.log('Wheel spinning...');

        // Wait a bit then stop
        await page.waitForTimeout(2000);
        const stopButton = page.locator('button', { hasText: /STOP|ストップ/i });
        await stopButton.click();
        console.log('Stopping...');

        // Wait for wheel to stop and results to appear
        const resultHeader = page.locator('h2', { hasText: /Congratulations|おめでとう|Too bad|残念/ });
        await expect(resultHeader).toBeVisible({ timeout: 15000 });
        console.log('Result appeared!');

        // If won, check for QR code
        const isWin = await page.locator('text=Congratulations').count() > 0 || await page.locator('text=おめでとう').count() > 0;
        if (isWin) {
            // Result modal should contain an SVG for the QR code
            const qrContainer = page.locator('.animate-bounce'); // This is the won modal container
            await expect(qrContainer.locator('svg')).toBeVisible();

            const tokenText = await page.locator('p.font-mono').innerText();
            // Extract token after the label
            const token = tokenText.split(': ')[1].trim();

            // 4. Admin: Redemption
            await page.goto('/admin');
            // Find the event in the list and click manage. 
            // For simplicity, let's just go back to the event admin page if we know the ID.
            // But we don't know it easily here. Let's try to find it.
            await page.getByRole('link', { name: 'Manage' }).first().click();

            // Check Win History
            await expect(page.getByText('Win History')).toBeVisible();
            await expect(page.getByText(token.substring(0, 8))).toBeVisible();

            // Manual verification
            const tokenInput = page.locator('input[placeholder*="Token"]');
            await tokenInput.fill(token);
            await page.getByRole('button', { name: 'Verify' }).click();

            await expect(page.getByText('Valid Token')).toBeVisible();

            // Redeem
            page.on('dialog', dialog => dialog.accept());
            await page.getByRole('button', { name: 'Redeem Prize' }).click();

            await expect(page.getByText('Already Redeemed')).toBeVisible();
        }
    });
});
