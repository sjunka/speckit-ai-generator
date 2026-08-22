import { test, expect } from "@playwright/test";

test("landing page loads and links to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Create videos from photos")).toBeVisible();
  await page.getByRole("link", { name: "Start creating" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
});
