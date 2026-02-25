import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('loads with phone input', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByText('Sign in to your account')).toBeVisible();
      await expect(page.getByPlaceholder(/234|phone/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send verification/i })).toBeVisible();
    });

    test('validates phone number format', async ({ page }) => {
      await page.goto('/login');

      // Enter invalid phone
      await page.getByPlaceholder(/234|phone/i).fill('12345');
      await page.getByRole('button', { name: /send verification/i }).click();

      // Should show validation error
      await expect(page.getByText(/valid nigerian phone/i)).toBeVisible();
    });

    test('progresses to OTP step on valid phone', async ({ page }) => {
      // Mock the login (send OTP) endpoint
      await page.route('**/api/v1/auth/login', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'OTP sent.',
            data: null,
          }),
        })
      );

      await page.goto('/login');
      await page.getByPlaceholder(/234|phone/i).fill('08012345678');
      await page.getByRole('button', { name: /send verification/i }).click();

      // Should progress to OTP step
      await expect(page.getByText('Enter verification code')).toBeVisible({ timeout: 5000 });
      await expect(page.getByPlaceholder('000000')).toBeVisible();
      await expect(page.getByText(/change phone/i)).toBeVisible();
    });

    test('has link to register page', async ({ page }) => {
      await page.goto('/login');

      const signUpLink = page.getByRole('link', { name: /sign up/i });
      await expect(signUpLink).toBeVisible();
      await signUpLink.click();
      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('Register Page', () => {
    test('loads with registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByText('Create your account')).toBeVisible();
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
      await expect(page.getByPlaceholder(/234|phone/i)).toBeVisible();
    });

    test('validates required fields', async ({ page }) => {
      await page.goto('/register');

      // Click create without filling
      await page.getByRole('button', { name: /create account/i }).click();

      // Should show validation errors
      await expect(page.getByText(/at least 2 characters/i).first()).toBeVisible();
    });

    test('role selection buttons work', async ({ page }) => {
      await page.goto('/register');

      const buyerBtn = page.getByRole('button', { name: /buyer|tenant/i });
      const agentBtn = page.getByRole('button', { name: /agent/i });

      // Buyer should be selected by default
      await expect(buyerBtn).toBeVisible();
      await expect(agentBtn).toBeVisible();

      // Click Agent
      await agentBtn.click();
      // Agent button should now be highlighted (bg-primary)
      await expect(agentBtn).toHaveClass(/bg-primary/);
    });

    test('has link to login page', async ({ page }) => {
      await page.goto('/register');

      const signInLink = page.getByRole('link', { name: /sign in/i });
      await expect(signInLink).toBeVisible();
      await signInLink.click();
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
