import { test, expect } from '@playwright/test';

test.describe('Track Inquiry', () => {
  test('page loads with tracking form', async ({ page }) => {
    await page.goto('/track-inquiry');

    // Should have inputs for reference and email
    await expect(page.getByPlaceholder(/reference|tracking/i).or(
      page.getByLabel(/reference|tracking/i)
    ).first()).toBeVisible();

    await expect(page.getByPlaceholder(/email/i).or(
      page.getByLabel(/email/i)
    ).first()).toBeVisible();
  });

  test('shows error when tracking with invalid ref', async ({ page }) => {
    // Mock the tracking endpoint
    await page.route('**/api/v1/inquiries/track', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'No inquiry found. Please check your reference number and email.',
        }),
      })
    );

    await page.goto('/track-inquiry');

    // Fill in a reference and email
    const refInput = page.getByPlaceholder(/reference|tracking/i).or(page.getByLabel(/reference|tracking/i)).first();
    const emailInput = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).first();

    await refInput.fill('AL12345678');
    await emailInput.fill('test@example.com');

    // Submit the tracking form
    await page.getByRole('button', { name: /track|check|submit/i }).first().click();

    // Should show an error message
    await expect(page.getByText(/no inquiry found|not found/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows inquiry status when tracking with valid ref', async ({ page }) => {
    // Mock successful tracking
    await page.route('**/api/v1/inquiries/track', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            tracking_ref: 'AL1a2b3c4d',
            status: 'qualified',
            status_label: 'Qualified',
            property: {
              title: 'Test Property',
              slug: 'test-property',
              formatted_price: '₦5,000,000',
            },
            created_at: '2026-02-20T10:00:00Z',
          },
        }),
      })
    );

    await page.goto('/track-inquiry');

    const refInput = page.getByPlaceholder(/reference|tracking/i).or(page.getByLabel(/reference|tracking/i)).first();
    const emailInput = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).first();

    await refInput.fill('AL1a2b3c4d');
    await emailInput.fill('test@example.com');

    await page.getByRole('button', { name: /track|check|submit/i }).first().click();

    // Should show status
    await expect(page.getByText(/qualified/i)).toBeVisible({ timeout: 5000 });
  });
});
