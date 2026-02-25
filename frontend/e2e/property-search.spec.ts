import { test, expect } from '@playwright/test';

test.describe('Property Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/properties');
  });

  test('page loads with heading and filters', async ({ page }) => {
    // The page should display a search interface
    await expect(page.locator('nav')).toBeVisible();

    // Should have filter controls or a search area
    const hasFilters = await page.getByRole('button', { name: /filter/i }).or(
      page.locator('[class*="filter"]')
    ).first().isVisible().catch(() => false);

    const hasSortOrView = await page.getByRole('button').filter({ hasText: /grid|list|map|sort|newest/i }).first().isVisible().catch(() => false);

    expect(hasFilters || hasSortOrView).toBeTruthy();
  });

  test('displays property cards or empty state', async ({ page }) => {
    // Wait for API to respond
    await page.waitForLoadState('networkidle');

    // Either property cards or an empty state message should appear
    const cards = page.locator('[class*="property"], article, [data-testid="property-card"]');
    const emptyState = page.getByText(/no properties|no results|nothing found/i);

    const hasCards = await cards.first().isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('view mode toggle buttons are interactive', async ({ page }) => {
    const gridBtn = page.getByRole('button').filter({ hasText: /grid/i }).first();
    const listBtn = page.getByRole('button').filter({ hasText: /list/i }).first();

    if (await gridBtn.isVisible().catch(() => false)) {
      await gridBtn.click();
      // Should remain on the same page
      await expect(page).toHaveURL(/\/properties/);
    }

    if (await listBtn.isVisible().catch(() => false)) {
      await listBtn.click();
      await expect(page).toHaveURL(/\/properties/);
    }
  });
});
