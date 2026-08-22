import { test, expect } from "@playwright/test";

test("landing page loads and links to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Create videos from photos")).toBeVisible();
  // The CTA is a button that pushes the route, not an anchor — which is what
  // app/page.jsx renders and what app/phase2.test.jsx asserts.
  await page.getByRole("button", { name: "Start creating" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
});
