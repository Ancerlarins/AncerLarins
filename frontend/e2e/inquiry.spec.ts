import { test, expect } from '@playwright/test';

test.describe('Inquiry Form Submission', () => {
  test.beforeEach(async ({ page }) => {
    // Mock property detail
    await page.route('**/api/v1/properties/**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'prop-123',
              title: 'Luxury Villa in Banana Island',
              slug: 'luxury-villa-banana-island',
              price_kobo: 100000000000,
              listing_type: 'sale',
              bedrooms: 5,
              bathrooms: 6,
              images: [],
              agent: { company_name: 'Premium Agent', user: { full_name: 'Agent' } },
            },
          }),
        });
      }
      return route.continue();
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/properties/luxury-villa-banana-island');
    await page.waitForLoadState('networkidle');
  });

  test('shows validation errors when submitting empty form', async ({ page }) => {
    // Click submit without filling fields
    await page.getByRole('button', { name: /request viewing/i }).first().click();

    // Should show validation error messages
    await expect(page.getByText(/name must be at least|enter a valid/i).first()).toBeVisible();
  });

  test('submits inquiry and shows success with tracking ref', async ({ page }) => {
    // Mock the inquiry submission endpoint
    await page.route('**/api/v1/inquiries', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Thank you!',
            data: {
              inquiry_id: 'lead-456',
              tracking_ref: 'AL1a2b3c4d',
            },
          }),
        });
      }
      return route.continue();
    });

    // Fill in the form
    await page.getByPlaceholder('Your full name').fill('John Doe');
    await page.getByPlaceholder('08012345678').fill('08012345678');
    await page.getByPlaceholder('you@example.com').fill('john@example.com');

    // Select budget range
    await page.locator('select').first().selectOption({ index: 1 });

    // Submit
    await page.getByRole('button', { name: /request viewing/i }).first().click();

    // Should show success message and tracking reference
    await expect(page.getByText('Thank You!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('AL1a2b3c4d')).toBeVisible();
    await expect(page.getByText(/track your inquiry/i)).toBeVisible();
  });
});
