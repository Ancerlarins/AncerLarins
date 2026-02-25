import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and displays the hero section', async ({ page }) => {
    await expect(page).toHaveTitle(/AncerLarins/i);
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('navigation bar is visible with key links', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Logo / brand
    await expect(nav.getByText('Ancer')).toBeVisible();

    // Key nav links
    await expect(nav.getByRole('link', { name: /properties/i })).toBeVisible();
  });

  test('has a working link to properties page', async ({ page }) => {
    await page.getByRole('link', { name: /browse properties|properties|explore/i }).first().click();
    await expect(page).toHaveURL(/\/properties/);
  });

  test('footer is present', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});
