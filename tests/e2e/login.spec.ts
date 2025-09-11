import { test, expect } from "@playwright/test";

test("user can login and reach CRM", async ({ page }) => {
  await page.goto("/login");

  await page.getByTestId("login-email").fill(process.env.E2E_USER || "");
  await page.getByTestId("login-password").fill(process.env.E2E_PASS || "");
  await page.getByTestId("login-submit").click();

  // If an error banner appears, surface it clearly
  try {
    const errorBanner = page.getByTestId("auth-error");
    if (await errorBanner.isVisible({ timeout: 2000 })) {
      const msg = await errorBanner.innerText();
      throw new Error("Login failed banner: " + msg);
    }
  } catch {
    // ignore if not visible within 2s
  }

  // Allow extra time for auth + redirect
  await expect(page).toHaveURL(/\/app\/crm(?:$|[/?#])/, { timeout: 15000 });
  await expect(page.getByTestId("crm-root")).toBeVisible({ timeout: 15000 });
});
