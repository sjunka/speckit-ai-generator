import { test, expect } from "@playwright/test";

test("landing page loads and routes to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Create videos from photos")).toBeVisible();
  // A button, not a link: REPLICATION-PROMPT §7 specifies "one full-width
  // primary button", and app/page.jsx routes with router.push. This spec asked
  // for a link and had never passed.
  await page.getByRole("button", { name: "Start creating" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
});
