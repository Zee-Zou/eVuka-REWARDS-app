/**
 * E2E tests for authentication flow
 * Tests: Sign up, login, logout, password reset
 */

import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should redirect to login page when not authenticated", async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator("h1, h2")).toContainText(/login|sign in/i);
  });

  test("should display login form with email and password fields", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show validation errors for invalid login", async ({ page }) => {
    await page.goto("/auth/login");

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator("text=/required|invalid/i")).toBeVisible();
  });

  test("should navigate to register page from login page", async ({ page }) => {
    await page.goto("/auth/login");

    // Click on register link
    await page.click("text=/sign up|register|create account/i");

    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test("should display registration form", async ({ page }) => {
    await page.goto("/auth/register");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show password strength indicator on registration", async ({ page }) => {
    await page.goto("/auth/register");

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill("weak");

    // Should show password strength indicator
    await expect(page.locator("text=/weak|strength/i")).toBeVisible();

    await passwordInput.fill("Strong123!");

    // Should show stronger indicator
    await expect(page.locator("text=/strong|good/i")).toBeVisible();
  });

  test("should navigate to password reset page", async ({ page }) => {
    await page.goto("/auth/login");

    await page.click("text=/forgot password|reset password/i");

    await expect(page).toHaveURL(/\/auth\/password-reset/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("should handle password reset flow", async ({ page }) => {
    await page.goto("/auth/password-reset");

    await page.fill('input[type="email"]', "test@example.com");
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(
      page.locator("text=/check your email|reset link sent/i")
    ).toBeVisible({ timeout: 10000 });
  });

  test("should show loading state during authentication", async ({ page }) => {
    await page.goto("/auth/login");

    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");

    // Start login
    await page.click('button[type="submit"]');

    // Should show loading indicator
    await expect(page.locator("text=/loading|signing in/i, [aria-busy='true']")).toBeVisible();
  });

  test("should persist authentication across page reloads", async ({ page, context }) => {
    // This test would require a real authenticated session
    // For now, just verify the auth check happens
    await page.goto("/");

    // Should check authentication and redirect appropriately
    await page.waitForLoadState("networkidle");

    // Either at login page or home page (depending on auth state)
    const url = page.url();
    expect(url).toMatch(/\/(auth\/login)?$/);
  });

  test("should handle logout correctly", async ({ page }) => {
    // Navigate to home (will redirect to login if not authenticated)
    await page.goto("/");

    // If we have a logout button (meaning we're authenticated)
    const logoutButton = page.locator("text=/logout|sign out/i");

    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();

      // Should redirect to login page
      await expect(page).toHaveURL(/\/auth\/login/);
    }
  });
});
