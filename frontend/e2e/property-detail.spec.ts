import { test, expect } from '@playwright/test';

test.describe('Property Detail', () => {
  test('displays property info when navigated from listing', async ({ page }) => {
    // Mock the API to return a property listing
    await page.route('**/api/v1/properties?**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'test-prop-1',
              title: 'Beautiful 3 Bedroom Flat in Lekki',
              slug: 'beautiful-3-bedroom-flat-in-lekki',
              price_kobo: 350000000,
              formatted_price: '₦3,500,000',
              listing_type: 'rent',
              bedrooms: 3,
              bathrooms: 2,
              city: { name: 'Lagos' },
              area: { name: 'Lekki Phase 1' },
              property_type: { name: 'Flat' },
              images: [{ url: '/placeholder.jpg', is_primary: true }],
              agent: { company_name: 'Test Agent', user: { full_name: 'Test Agent' } },
            },
          ],
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
        }),
      })
    );

    // Mock property detail
    await page.route('**/api/v1/properties/beautiful-3-bedroom-flat-in-lekki', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-prop-1',
            title: 'Beautiful 3 Bedroom Flat in Lekki',
            slug: 'beautiful-3-bedroom-flat-in-lekki',
            description: 'A beautiful flat in the heart of Lekki.',
            price_kobo: 350000000,
            formatted_price: '₦3,500,000',
            listing_type: 'rent',
            bedrooms: 3,
            bathrooms: 2,
            city: { name: 'Lagos' },
            area: { name: 'Lekki Phase 1' },
            property_type: { name: 'Flat' },
            images: [{ url: '/placeholder.jpg', is_primary: true }],
            agent: { company_name: 'Test Agent', user: { full_name: 'Test Agent' } },
            address: '15 Admiralty Way',
          },
        }),
      })
    );

    await page.goto('/properties/beautiful-3-bedroom-flat-in-lekki');
    await page.waitForLoadState('networkidle');

    // Should show the property title
    await expect(page.getByText('Beautiful 3 Bedroom Flat in Lekki')).toBeVisible();
  });

  test('inquiry form is visible on desktop', async ({ page }) => {
    // Mock the detail API
    await page.route('**/api/v1/properties/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-prop-1',
            title: 'Test Property',
            slug: 'test-property',
            price_kobo: 500000000,
            listing_type: 'sale',
            bedrooms: 4,
            bathrooms: 3,
            images: [],
            agent: { company_name: 'Agent Co', user: { full_name: 'Agent' } },
          },
        }),
      })
    );

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/properties/test-property');
    await page.waitForLoadState('networkidle');

    // The "Request Private Viewing" form should be visible on desktop
    await expect(page.getByText('Request Private Viewing').first()).toBeVisible();
    await expect(page.getByPlaceholder('Your full name')).toBeVisible();
    await expect(page.getByPlaceholder('08012345678')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
  });
});
